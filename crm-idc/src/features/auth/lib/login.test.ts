import { describe, expect, it } from "vitest";
import { NETWORK_ERROR_MESSAGE } from "@/lib/errors";
import {
  INACTIVE_ACCOUNT_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  isInactiveAccountError,
  loginErrorMessage,
  loginSchema,
} from "./login";

describe("loginSchema", () => {
  it("aceita e-mail válido (aparado) e senha", () => {
    const parsed = loginSchema.parse({ email: "  decio@idc.com.br ", password: " segredo " });
    expect(parsed).toEqual({ email: "decio@idc.com.br", password: " segredo " });
  });

  it("exige e-mail e senha com mensagens em pt-BR", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
    expect(messages.email).toBe("Informe seu e-mail.");
    expect(messages.password).toBe("Informe sua senha.");
  });

  it("rejeita e-mail malformado", () => {
    const result = loginSchema.safeParse({ email: "decio@", password: "x" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("Informe um e-mail válido.");
  });
});

describe("loginErrorMessage", () => {
  it("credenciais inválidas → mensagem da tela de login", () => {
    expect(loginErrorMessage({ name: "AuthApiError", code: "invalid_credentials", status: 400 })).toBe(
      INVALID_CREDENTIALS_MESSAGE,
    );
    expect(loginErrorMessage({ message: "Invalid login credentials", status: 400 })).toBe(INVALID_CREDENTIALS_MESSAGE);
  });

  it("usuário banido (desativado no Auth) → aviso de acesso desativado", () => {
    expect(loginErrorMessage({ code: "user_banned", status: 400 })).toBe(INACTIVE_ACCOUNT_MESSAGE);
  });

  it("demais erros usam getErrorMessage", () => {
    expect(loginErrorMessage({ name: "AuthRetryableFetchError", message: "Failed to fetch" })).toBe(
      NETWORK_ERROR_MESSAGE,
    );
    expect(loginErrorMessage({ code: "over_request_rate_limit", status: 429 })).toBe(
      "Muitas tentativas. Aguarde um momento e tente novamente.",
    );
    expect(loginErrorMessage(null)).toBe("Não foi possível concluir a operação. Tente novamente.");
  });
});

describe("isInactiveAccountError", () => {
  it("detecta usuário banido pelo código ou pela mensagem", () => {
    expect(isInactiveAccountError({ code: "user_banned" })).toBe(true);
    expect(isInactiveAccountError({ message: "User is banned" })).toBe(true);
    expect(isInactiveAccountError({ code: "invalid_credentials" })).toBe(false);
    expect(isInactiveAccountError(new Error("Failed to fetch"))).toBe(false);
    expect(isInactiveAccountError(null)).toBe(false);
  });
});
