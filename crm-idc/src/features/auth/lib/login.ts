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

/** Erro do Supabase Auth → mensagem da tela de login. */
export function loginErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const { code, message } = err as AuthErrorLike;
    if (code === "invalid_credentials" || (typeof message === "string" && /invalid login credentials/i.test(message))) {
      return INVALID_CREDENTIALS_MESSAGE;
    }
    if (code === "user_banned" || (typeof message === "string" && /user is banned/i.test(message))) {
      return INACTIVE_ACCOUNT_MESSAGE;
    }
  }
  return getErrorMessage(err);
}
