import { describe, expect, it } from "vitest";
import { expiredCookieAssignment, isSupabaseAuthCookie, supabaseAuthCookieNames } from "./auth-cookies";

describe("isSupabaseAuthCookie", () => {
  it("reconhece os cookies de sessão do @supabase/ssr", () => {
    expect(isSupabaseAuthCookie("sb-abcdefgh-auth-token")).toBe(true);
    expect(isSupabaseAuthCookie("sb-abcdefgh-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookie("sb-abcdefgh-auth-token.12")).toBe(true);
    expect(isSupabaseAuthCookie("sb-abcdefgh-auth-token-code-verifier")).toBe(true);
    expect(isSupabaseAuthCookie("sb-127-auth-token")).toBe(true);
  });

  it("ignora os demais cookies", () => {
    expect(isSupabaseAuthCookie("sidebar_state")).toBe(false);
    expect(isSupabaseAuthCookie("sb-abcdefgh-other")).toBe(false);
    expect(isSupabaseAuthCookie("auth-token")).toBe(false);
    expect(isSupabaseAuthCookie("xsb-abc-auth-token")).toBe(false);
  });
});

describe("supabaseAuthCookieNames", () => {
  it("extrai só os cookies de sessão do Supabase de document.cookie", () => {
    const cookie =
      "sidebar_state=true; sb-abc-auth-token.0=base64-xyz; sb-abc-auth-token.1=parte=2;sb-abc-auth-token-code-verifier=v";
    expect(supabaseAuthCookieNames(cookie)).toEqual([
      "sb-abc-auth-token.0",
      "sb-abc-auth-token.1",
      "sb-abc-auth-token-code-verifier",
    ]);
  });

  it("sem cookies de sessão, não retorna nada (e não repete nomes)", () => {
    expect(supabaseAuthCookieNames("")).toEqual([]);
    expect(supabaseAuthCookieNames("sidebar_state=false; outro=1")).toEqual([]);
    expect(supabaseAuthCookieNames("sb-abc-auth-token=a; sb-abc-auth-token=b")).toEqual(["sb-abc-auth-token"]);
  });
});

describe("expiredCookieAssignment", () => {
  it("expira o cookie no mesmo escopo usado pelo @supabase/ssr (host-only, path=/)", () => {
    const assignment = expiredCookieAssignment("sb-abc-auth-token.0");
    expect(assignment.startsWith("sb-abc-auth-token.0=;")).toBe(true);
    expect(assignment).toContain("Max-Age=0");
    expect(assignment).toContain("path=/");
    expect(assignment).not.toMatch(/domain=/i);
  });
});
