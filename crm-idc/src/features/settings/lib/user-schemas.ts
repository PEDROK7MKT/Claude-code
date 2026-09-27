/**
 * Gestão de usuários (spec §4.8 / §11 "Primeiro acesso"): schemas zod usados
 * no formulário (cliente) e revalidados nas Server Actions, resultado das
 * actions e mensagens de erro do Supabase Auth em pt-BR. Funções puras.
 */
import { z } from "zod";
import { ROLES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import type { UserRole } from "@/types/database";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password";

export const FULL_NAME_MIN = 2;
export const FULL_NAME_MAX = 80;

/** Resultado das Server Actions de usuários (nunca lançam para o cliente). */
export type ActionResult = { ok: true } | { ok: false; error: string };

const ROLE_VALUES = ROLES.map((r) => r.value) as [UserRole, ...UserRole[]];

export const fullNameSchema = z
  .string({ error: "Informe o nome completo." })
  .trim()
  .min(FULL_NAME_MIN, "Informe o nome completo.")
  .max(FULL_NAME_MAX, `Use no máximo ${FULL_NAME_MAX} caracteres.`);

export const emailSchema = z
  .string({ error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail.")
  .max(254, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));

// não é aparada: espaços podem fazer parte da senha — só não nas pontas (erro comum ao copiar)
export const passwordSchema = z
  .string({ error: "Informe a senha." })
  .min(PASSWORD_MIN_LENGTH, `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`)
  .refine((value) => value.trim() === value, "A senha não pode começar nem terminar com espaço.");

export const roleSchema = z.enum(ROLE_VALUES, { error: "Selecione o perfil de acesso." });

export const userIdSchema = z.uuid({ error: "Usuário inválido." });

export const createUserSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserNameSchema = z.object({ userId: userIdSchema, full_name: fullNameSchema });
export const updateUserRoleSchema = z.object({ userId: userIdSchema, role: roleSchema });
export const setUserActiveSchema = z.object({
  userId: userIdSchema,
  active: z.boolean({ error: "Status inválido." }),
});
export const resetPasswordSchema = z.object({ userId: userIdSchema, password: passwordSchema });

/** Formulários dos diálogos (sem o id, que vem do usuário selecionado). */
export const editNameFormSchema = z.object({ full_name: fullNameSchema });
export const passwordFormSchema = z.object({ password: passwordSchema });

export const CREATE_USER_DEFAULTS: CreateUserValues = { full_name: "", email: "", password: "", role: "dentist" };

/** Primeira mensagem de validação (pt-BR) de um erro do zod. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos. Verifique os campos preenchidos.";
}

interface AuthErrorLike {
  code?: unknown;
  message?: unknown;
  status?: unknown;
}

/**
 * Erros do Supabase Auth Admin (createUser/updateUserById) → pt-BR.
 * Casos específicos da gestão de usuários; o resto segue getErrorMessage().
 */
export function userAdminErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const { code, message } = err as AuthErrorLike;
    const text = typeof message === "string" ? message : "";
    if (code === "email_exists" || code === "user_already_exists" || /already (been )?registered|already exists/i.test(text)) {
      return "Já existe um usuário com este e-mail.";
    }
    if (code === "user_not_found" || /user not found/i.test(text)) return "Usuário não encontrado.";
    if (code === "email_address_invalid" || /invalid.*email|email.*invalid/i.test(text)) {
      return "E-mail inválido. Confira o endereço digitado.";
    }
    if (code === "weak_password" || /password should|password is too weak|weak password/i.test(text)) {
      return "Senha fraca para as regras do Supabase. Use mais caracteres, com letras maiúsculas, minúsculas e números.";
    }
    if (code === "same_password") return "A nova senha precisa ser diferente da atual.";
    if (code === "not_admin" || /user not allowed|not_admin/i.test(text)) {
      return "A chave de serviço do Supabase não tem permissão para gerenciar usuários.";
    }
  }
  return getErrorMessage(err);
}
