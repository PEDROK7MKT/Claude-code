/**
 * Lista de usuários em Configurações: ordenação, resumo, ações permitidas por
 * linha e texto com os dados de acesso para enviar ao novo usuário. Funções puras.
 */
import { APP_LOCALE, ROLE_LABEL } from "@/lib/constants";
import { firstName } from "@/lib/format";
import type { Profile, UserRole } from "@/types/database";

export type UserAction = "edit-name" | "change-role" | "reset-password" | "deactivate" | "reactivate";

/** Ativos primeiro; depois gestores antes de dentistas; por fim nome (pt-BR). */
export function sortProfiles(profiles: readonly Profile[]): Profile[] {
  const rolePriority: Record<UserRole, number> = { admin: 0, dentist: 1 };
  return [...profiles].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) ||
      rolePriority[a.role] - rolePriority[b.role] ||
      a.full_name.localeCompare(b.full_name, APP_LOCALE, { sensitivity: "base" }),
  );
}

export interface ProfilesSummary {
  total: number;
  active: number;
  inactive: number;
  /** Gestores de tráfego ativos */
  admins: number;
  /** Dentistas ativos */
  dentists: number;
}

export function summarizeProfiles(profiles: readonly Profile[]): ProfilesSummary {
  const active = profiles.filter((p) => p.active);
  return {
    total: profiles.length,
    active: active.length,
    inactive: profiles.length - active.length,
    admins: active.filter((p) => p.role === "admin").length,
    dentists: active.filter((p) => p.role === "dentist").length,
  };
}

/** "3 usuários · 2 ativos · 1 desativado" */
export function describeProfilesSummary(summary: ProfilesSummary): string {
  const total = summary.total === 1 ? "1 usuário" : `${summary.total} usuários`;
  const parts = [total, summary.active === 1 ? "1 ativo" : `${summary.active} ativos`];
  if (summary.inactive > 0) parts.push(summary.inactive === 1 ? "1 desativado" : `${summary.inactive} desativados`);
  return parts.join(" · ");
}

/** Primeiro acesso (spec §11): ainda não há dentista ativo → sugerir criar a conta do Dr. Décio. */
export function needsFirstDentist(profiles: readonly Profile[]): boolean {
  return !profiles.some((p) => p.active && p.role === "dentist");
}

export interface ActionAvailability {
  allowed: boolean;
  /** Por que a ação está indisponível (tooltip / texto do menu) */
  reason: string | null;
}

/**
 * O que o admin pode fazer com cada usuário. Ninguém altera o próprio perfil
 * de acesso nem se desativa (espelha o trigger protect_profile_privileges).
 */
export function userActionAvailability(
  profile: Pick<Profile, "id" | "active">,
  currentUserId: string,
): Record<UserAction, ActionAvailability> {
  const isSelf = profile.id === currentUserId;
  const ok: ActionAvailability = { allowed: true, reason: null };
  return {
    "edit-name": ok,
    "reset-password": ok,
    "change-role": isSelf ? { allowed: false, reason: "Você não pode alterar o próprio perfil de acesso." } : ok,
    deactivate: isSelf
      ? { allowed: false, reason: "Você não pode desativar a própria conta." }
      : profile.active
        ? ok
        : { allowed: false, reason: "Usuário já está desativado." },
    reactivate: profile.active ? { allowed: false, reason: "Usuário já está ativo." } : ok,
  };
}

/** Descrição do que cada perfil pode fazer (diálogos de criação e troca de perfil). */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Vê e edita tudo: leads, métricas do Google Ads e GMN, relatórios e configurações.",
  dentist: "Vê leads, kanban e dashboard resumido; atualiza status. Métricas e relatórios em modo leitura.",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}

export interface AccessMessageInput {
  fullName: string;
  email: string;
  password: string;
  /** Endereço da tela de login (ex.: https://crm.institutodeciocarrilho.com.br/login) */
  loginUrl: string;
  crmName: string;
}

/** Mensagem com os dados de acesso, pronta para copiar e enviar (spec §11 passo 2). */
export function accessMessage({ fullName, email, password, loginUrl, crmName }: AccessMessageInput): string {
  const name = firstName(fullName);
  return [
    `Olá${name ? `, ${name}` : ""}! Seu acesso ao ${crmName} foi criado.`,
    "",
    `Endereço: ${loginUrl}`,
    `E-mail: ${email}`,
    `Senha: ${password}`,
    "",
    "Guarde a senha em local seguro e não a compartilhe.",
  ].join("\n");
}
