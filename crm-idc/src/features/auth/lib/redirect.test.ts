import { describe, expect, it } from "vitest";
import {
  DASHBOARD_PATH,
  buildSignOutRedirectPath,
  firstSearchParam,
  getSafeNextPath,
  homePathForRole,
  parseLoginReason,
  resolvePostLoginPath,
} from "./redirect";

describe("getSafeNextPath", () => {
  it("aceita caminhos relativos do app, preservando query e hash", () => {
    expect(getSafeNextPath("/leads")).toBe("/leads");
    expect(getSafeNextPath("/leads/123?tab=historico#notas")).toBe("/leads/123?tab=historico#notas");
    expect(getSafeNextPath("/kanban?status=novo&status=agendado")).toBe("/kanban?status=novo&status=agendado");
    expect(getSafeNextPath("  /relatorios  ")).toBe("/relatorios");
    expect(getSafeNextPath("/")).toBe("/");
  });

  it("normaliza segmentos de ponto sem sair do app", () => {
    expect(getSafeNextPath("/leads/../kanban")).toBe("/kanban");
    expect(getSafeNextPath("/../../etc")).toBe("/etc");
  });

  it("rejeita URLs absolutas e relativas ao protocolo", () => {
    expect(getSafeNextPath("https://evil.com")).toBeNull();
    expect(getSafeNextPath("http://localhost:3000/leads")).toBeNull();
    expect(getSafeNextPath("//evil.com")).toBeNull();
    expect(getSafeNextPath("//evil.com/leads")).toBeNull();
    expect(getSafeNextPath("/\\evil.com")).toBeNull();
    expect(getSafeNextPath("\\\\evil.com")).toBeNull();
    expect(getSafeNextPath("javascript:alert(1)")).toBeNull();
    expect(getSafeNextPath("leads")).toBeNull();
  });

  it("rejeita caracteres de controle (tab/quebra de linha viram // no navegador)", () => {
    expect(getSafeNextPath("/\t/evil.com")).toBeNull();
    expect(getSafeNextPath("/\n/evil.com")).toBeNull();
    expect(getSafeNextPath("/leads\u0000")).toBeNull();
  });

  it("mantém codificações sem transformá-las em outro host", () => {
    expect(getSafeNextPath("/%2F%2Fevil.com")).toBe("/%2F%2Fevil.com");
  });

  it("rejeita rotas de autenticação e internas (evita loop e logout)", () => {
    expect(getSafeNextPath("/login")).toBeNull();
    expect(getSafeNextPath("/login?next=/leads")).toBeNull();
    expect(getSafeNextPath("/auth/signout")).toBeNull();
    expect(getSafeNextPath("/api/webhook/lead")).toBeNull();
    expect(getSafeNextPath("/_next/static/chunk.js")).toBeNull();
    // prefixo parecido, mas outra rota
    expect(getSafeNextPath("/login-ajuda")).toBe("/login-ajuda");
    expect(getSafeNextPath("/authors")).toBe("/authors");
  });

  it("rejeita valores vazios, longos demais ou de outro tipo", () => {
    expect(getSafeNextPath("")).toBeNull();
    expect(getSafeNextPath("   ")).toBeNull();
    expect(getSafeNextPath(null)).toBeNull();
    expect(getSafeNextPath(undefined)).toBeNull();
    expect(getSafeNextPath(["/leads"])).toBeNull();
    expect(getSafeNextPath(`/${"a".repeat(3000)}`)).toBeNull();
  });
});

describe("resolvePostLoginPath", () => {
  it("usa o next seguro quando existe", () => {
    expect(resolvePostLoginPath({ next: "/leads/novo", role: "dentist" })).toBe("/leads/novo");
  });

  it("cai na página inicial do papel quando next é ausente ou inseguro", () => {
    expect(resolvePostLoginPath({ next: null, role: "admin" })).toBe(DASHBOARD_PATH);
    expect(resolvePostLoginPath({ next: "https://evil.com", role: "dentist" })).toBe(DASHBOARD_PATH);
    expect(resolvePostLoginPath({ next: "/login", role: null })).toBe(DASHBOARD_PATH);
  });
});

describe("homePathForRole", () => {
  it("admin e dentista abrem o dashboard (que renderiza a visão do papel)", () => {
    expect(homePathForRole("admin")).toBe("/dashboard");
    expect(homePathForRole("dentist")).toBe("/dashboard");
    expect(homePathForRole(null)).toBe("/dashboard");
  });
});

describe("firstSearchParam", () => {
  it("normaliza string | string[] | undefined", () => {
    expect(firstSearchParam("a")).toBe("a");
    expect(firstSearchParam(["b", "c"])).toBe("b");
    expect(firstSearchParam([])).toBeNull();
    expect(firstSearchParam(undefined)).toBeNull();
    expect(firstSearchParam(null)).toBeNull();
  });
});

describe("parseLoginReason / buildSignOutRedirectPath", () => {
  it("só reconhece motivos conhecidos", () => {
    expect(parseLoginReason("inactive")).toBe("inactive");
    expect(parseLoginReason("outro")).toBeNull();
    expect(parseLoginReason(null)).toBeNull();
  });

  it("preserva reason=inactive no redirect do logout", () => {
    expect(buildSignOutRedirectPath("inactive")).toBe("/login?reason=inactive");
    expect(buildSignOutRedirectPath(null)).toBe("/login");
    expect(buildSignOutRedirectPath("<script>")).toBe("/login");
  });
});
