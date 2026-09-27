/**
 * Validação e mensagens da tela de login (pt-BR). Funções puras.
 */
import { z } from "zod";
import { getErrorMessage } from "@/lib/errors";

export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha incorretos.";
export const INACTIVE_ACCOUNT_MESSAGE = "Seu acesso foi desativado. Fale com o administrador.";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .max(254, "E-mail muito longo.")
    .pipe(z.email("Informe um e-mail válido.")),
  // senha não é aparada: espaços podem fazer parte dela
  password: z.string().min(1, "Informe sua senha.").max(256, "Senha muito longa."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const LOGIN_DEFAULT_VALUES: LoginValues = { email: "", password: "" };

interface AuthErrorLike {
  code?: unknown;
  message?: unknown;
}

function asAuthError(err: unknown): { code: unknown; message: string } | null {
  if (typeof err !== "object" || err === null) return null;
  const { code, message } = err as AuthErrorLike;
  return { code, message: typeof message === "string" ? message : "" };
}

/** Conta bloqueada no Supabase Auth (usuário desativado pelo admin). */
export function isInactiveAccountError(err: unknown): boolean {
  const e = asAuthError(err);
  return Boolean(e && (e.code === "user_banned" || /user is banned/i.test(e.message)));
}

/** Erro do Supabase Auth → mensagem da tela de login. */
export function loginErrorMessage(err: unknown): string {
  const e = asAuthError(err);
  if (e && (e.code === "invalid_credentials" || /invalid login credentials/i.test(e.message))) {
    return INVALID_CREDENTIALS_MESSAGE;
  }
  if (isInactiveAccountError(err)) return INACTIVE_ACCOUNT_MESSAGE;
  return getErrorMessage(err);
}
