"use server";

/**
 * Gestão de usuários (spec §4.8 e §11 "Primeiro acesso") — Server Actions.
 * Usam a SERVICE ROLE (Supabase Auth Admin), então cada action:
 *  1. revalida que quem chama é admin ativo (requireAdmin);
 *  2. valida a entrada com zod (nunca confia no cliente);
 *  3. devolve { ok } | { ok: false, error } em pt-BR — nunca lança erros crus.
 * A chave de serviço só existe no servidor (createAdminClient é server-only).
 */
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import { requireAdmin, type SessionContext } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";
import {
  createUserSchema,
  firstIssueMessage,
  resetPasswordSchema,
  setUserActiveSchema,
  updateUserNameSchema,
  updateUserRoleSchema,
  userAdminErrorMessage,
  type ActionResult,
  type CreateUserValues,
} from "../lib/user-schemas";

const SETTINGS_PATH = "/configuracoes";
/** "Para sempre" no Supabase Auth (~100 anos); "none" remove o bloqueio. */
const BAN_FOREVER = "876000h";

type AdminClient = ReturnType<typeof createAdminClient>;

interface TargetProfile {
  id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
}

function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(firstIssueMessage(result.error));
  return result.data;
}

function getAdminClient(): AdminClient {
  try {
    return createAdminClient();
  } catch {
    // sem SUPABASE_SERVICE_ROLE_KEY no servidor: mensagem sem expor detalhes da configuração
    throw new AppError("O servidor não está configurado para gerenciar usuários. Fale com o suporte técnico.");
  }
}

async function getTargetProfile(admin: AdminClient, userId: string): Promise<TargetProfile> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("Usuário não encontrado.");
  return data;
}

/** Executa a action como admin; erros viram mensagem pt-BR (redirect/notFound do Next seguem adiante). */
async function runAsAdmin(name: string, run: (session: SessionContext) => Promise<void>): Promise<ActionResult> {
  try {
    // sem sessão → /login; dentista → /dashboard (redirect do Next)
    const session = await requireAdmin();
    await run(session);
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    if (!(err instanceof AppError)) console.error(`[configuracoes] ${name} falhou:`, err);
    return { ok: false, error: userAdminErrorMessage(err) };
  }
}

/** Cria usuário já confirmado (o admin repassa e-mail e senha — spec §11). */
export async function createUser(input: CreateUserValues): Promise<ActionResult> {
  return runAsAdmin("createUser", async () => {
    const values = parseInput(createUserSchema, input);
    const admin = getAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: values.email,
      password: values.password,
      email_confirm: true,
      user_metadata: { full_name: values.full_name, role: values.role },
      // app_metadata só é gravável pela service role: é o papel lido primeiro pelo trigger handle_new_user
      app_metadata: { role: values.role },
    });
    if (error) throw error;

    // O trigger já cria o profile; o upsert garante nome/papel/e-mail mesmo se ele não existir no banco.
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        { id: data.user.id, full_name: values.full_name, email: values.email, role: values.role, active: true },
        { onConflict: "id" },
      );
    if (profileError) {
      // sem profile o usuário não consegue usar o CRM: desfaz a criação para permitir tentar de novo
      await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      throw profileError;
    }

    revalidatePath(SETTINGS_PATH);
  });
}

/** Troca o perfil de acesso (admin ↔ dentista). Ninguém altera o próprio perfil. */
export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  return runAsAdmin("updateUserRole", async (session) => {
    const values = parseInput(updateUserRoleSchema, { userId, role });
    if (values.userId === session.userId) throw new AppError("Você não pode alterar o próprio perfil de acesso.");

    const admin = getAdminClient();
    const target = await getTargetProfile(admin, values.userId);
    if (target.role === values.role) return;

    // profiles.role é a fonte da verdade (RLS e navegação)
    const { error } = await admin.from("profiles").update({ role: values.role }).eq("id", values.userId);
    if (error) throw error;

    // mantém app_metadata em sincronia (não bloqueia: o profile já foi atualizado)
    const { error: metaError } = await admin.auth.admin.updateUserById(values.userId, {
      app_metadata: { role: values.role },
    });
    if (metaError) console.error("[configuracoes] updateUserRole: app_metadata não sincronizado:", metaError);

    revalidatePath(SETTINGS_PATH);
  });
}

/**
 * Desativa (bloqueia o login no Auth + profiles.active = false, que corta o acesso
 * aos dados via RLS) ou reativa. Ninguém desativa a própria conta.
 */
export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  return runAsAdmin("setUserActive", async (session) => {
    const values = parseInput(setUserActiveSchema, { userId, active });
    if (values.userId === session.userId) throw new AppError("Você não pode desativar a própria conta.");

    const admin = getAdminClient();
    const target = await getTargetProfile(admin, values.userId);
    if (target.active === values.active) return;

    const { error: banError } = await admin.auth.admin.updateUserById(values.userId, {
      ban_duration: values.active ? "none" : BAN_FOREVER,
    });
    if (banError) throw banError;

    const { error } = await admin.from("profiles").update({ active: values.active }).eq("id", values.userId);
    if (error) {
      // desfaz o bloqueio/desbloqueio para Auth e profile não ficarem divergentes
      await admin.auth.admin
        .updateUserById(values.userId, { ban_duration: values.active ? BAN_FOREVER : "none" })
        .catch(() => undefined);
      throw error;
    }

    revalidatePath(SETTINGS_PATH);
  });
}

/** Define uma nova senha para o usuário (o admin repassa a senha a ele). */
export async function resetUserPassword(userId: string, newPassword: string): Promise<ActionResult> {
  return runAsAdmin("resetUserPassword", async () => {
    const values = parseInput(resetPasswordSchema, { userId, password: newPassword });
    const admin = getAdminClient();
    await getTargetProfile(admin, values.userId);

    const { error } = await admin.auth.admin.updateUserById(values.userId, { password: values.password });
    if (error) throw error;
  });
}

/** Corrige o nome exibido no CRM (sidebar, histórico dos leads). */
export async function updateUserName(userId: string, full_name: string): Promise<ActionResult> {
  return runAsAdmin("updateUserName", async (session) => {
    const values = parseInput(updateUserNameSchema, { userId, full_name });
    const admin = getAdminClient();
    const target = await getTargetProfile(admin, values.userId);
    if (target.full_name === values.full_name) return;

    const { error } = await admin.from("profiles").update({ full_name: values.full_name }).eq("id", values.userId);
    if (error) throw error;

    const { error: metaError } = await admin.auth.admin.updateUserById(values.userId, {
      user_metadata: { full_name: values.full_name },
    });
    if (metaError) console.error("[configuracoes] updateUserName: user_metadata não sincronizado:", metaError);

    // o próprio nome aparece na sidebar (layout): revalida o app inteiro
    if (values.userId === session.userId) revalidatePath("/", "layout");
    else revalidatePath(SETTINGS_PATH);
  });
}
