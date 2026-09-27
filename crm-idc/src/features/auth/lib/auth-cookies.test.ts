import { describe, expect, it } from "vitest";
import { isSupabaseAuthCookie } from "./auth-cookies";

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
