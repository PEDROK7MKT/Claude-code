import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  firstIssueMessage,
  resetPasswordSchema,
  setUserActiveSchema,
  updateUserRoleSchema,
  userAdminErrorMessage,
} from "./user-schemas";

const USER_ID = "3f2b8a4e-6c1d-4e5f-9a7b-1c2d3e4f5a6b";

describe("createUserSchema", () => {
  it("normaliza nome e e-mail", () => {
    const parsed = createUserSchema.parse({
      full_name: "  Décio Carrilho ",
      email: "  Decio@IDC.com.br ",
      password: "Senha forte 2026",
      role: "dentist",
    });
    expect(parsed).toEqual({
      full_name: "Décio Carrilho",
      email: "decio@idc.com.br",
      password: "Senha forte 2026",
      role: "dentist",
    });
  });

  it("mensagens em pt-BR", () => {
    const result = createUserSchema.safeParse({ full_name: "D", email: "decio@", password: "curta", role: "root" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const byField = Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
    expect(byField).toEqual({
      full_name: "Informe o nome completo.",
      email: "Informe um e-mail válido.",
      password: "A senha precisa ter pelo menos 8 caracteres.",
      role: "Selecione o perfil de acesso.",
    });
    expect(firstIssueMessage(result.error)).toBe("Informe o nome completo.");
  });

  it("senha: limite do Supabase e espaços nas pontas", () => {
    const base = { full_name: "Décio", email: "d@idc.com.br", role: "admin" };
    expect(createUserSchema.safeParse({ ...base, password: "x".repeat(73) }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, password: " abcdefgh1" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, password: "abc defgh1" }).success).toBe(true);
  });

  it("rejeita tipos inesperados vindos do cliente", () => {
    expect(createUserSchema.safeParse(null).success).toBe(false);
    expect(createUserSchema.safeParse({ full_name: 1, email: [], password: {}, role: "admin" }).success).toBe(false);
  });
});

describe("schemas das actions", () => {
  it("exigem id de usuário válido", () => {
    expect(updateUserRoleSchema.safeParse({ userId: USER_ID, role: "admin" }).success).toBe(true);
    const bad = updateUserRoleSchema.safeParse({ userId: "1 OR 1=1", role: "admin" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(firstIssueMessage(bad.error)).toBe("Usuário inválido.");
  });

  it("status precisa ser booleano", () => {
    expect(setUserActiveSchema.safeParse({ userId: USER_ID, active: false }).success).toBe(true);
    expect(setUserActiveSchema.safeParse({ userId: USER_ID, active: "false" }).success).toBe(false);
  });

  it("redefinição de senha valida a nova senha", () => {
    expect(resetPasswordSchema.safeParse({ userId: USER_ID, password: "12345678" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ userId: USER_ID, password: "123" }).success).toBe(false);
  });
});

describe("userAdminErrorMessage", () => {
  it("e-mail já cadastrado", () => {
    expect(
      userAdminErrorMessage({ code: "email_exists", message: "A user with this email address has already been registered" }),
    ).toBe("Já existe um usuário com este e-mail.");
    expect(userAdminErrorMessage({ message: "User already registered", status: 422 })).toBe(
      "Já existe um usuário com este e-mail.",
    );
  });

  it("outros erros do Auth", () => {
    expect(userAdminErrorMessage({ code: "user_not_found", status: 404 })).toBe("Usuário não encontrado.");
    expect(userAdminErrorMessage({ code: "weak_password", message: "Password should contain..." })).toMatch(/Senha fraca/);
    expect(userAdminErrorMessage({ code: "email_address_invalid", message: "x" })).toMatch(/E-mail inválido/);
  });

  it("cai no mapeamento geral (rede, permissão)", () => {
    expect(userAdminErrorMessage(new TypeError("Failed to fetch"))).toBe("Sem conexão com o servidor");
    expect(userAdminErrorMessage({ code: "42501", message: "permission denied for table profiles" })).toBe(
      "Você não tem permissão para esta ação",
    );
  });
});
