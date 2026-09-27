import { afterEach, describe, expect, it, vi } from "vitest";
import { SIGN_OUT_PATH } from "./redirect";
import { expireSupabaseAuthCookies, isServerSignOutResponse, requestServerSignOut } from "./sign-out";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isServerSignOutResponse", () => {
  it("aceita o redirect da rota (opaqueredirect com redirect: manual) ou 2xx", () => {
    expect(isServerSignOutResponse({ type: "opaqueredirect", ok: false })).toBe(true);
    expect(isServerSignOutResponse({ type: "basic", ok: true })).toBe(true);
  });

  it("rejeita respostas de erro do servidor", () => {
    expect(isServerSignOutResponse({ type: "basic", ok: false })).toBe(false);
    expect(isServerSignOutResponse({ type: "error", ok: false })).toBe(false);
  });
});

describe("requestServerSignOut", () => {
  it("faz POST em /auth/signout sem seguir o redirect", async () => {
    const fetchMock = vi.fn(async () => ({ type: "opaqueredirect", ok: false }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestServerSignOut()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(SIGN_OUT_PATH);
    expect(init).toMatchObject({ method: "POST", redirect: "manual", cache: "no-store", credentials: "same-origin" });
  });

  it("offline (fetch rejeita) ou erro 5xx → false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(requestServerSignOut()).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn(async () => ({ type: "basic", ok: false, status: 500 }) as Response));
    await expect(requestServerSignOut()).resolves.toBe(false);
  });
});

describe("expireSupabaseAuthCookies", () => {
  it("expira no navegador só os cookies de sessão do Supabase", () => {
    const assignments: string[] = [];
    vi.stubGlobal("document", {
      get cookie() {
        return "sidebar_state=true; sb-abc-auth-token.0=a; sb-abc-auth-token.1=b";
      },
      set cookie(value: string) {
        assignments.push(value);
      },
    });

    expireSupabaseAuthCookies();

    expect(assignments).toHaveLength(2);
    expect(assignments[0]).toMatch(/^sb-abc-auth-token\.0=; Max-Age=0; path=\//);
    expect(assignments[1]).toMatch(/^sb-abc-auth-token\.1=; Max-Age=0; path=\//);
  });

  it("não faz nada fora do navegador", () => {
    expect(() => expireSupabaseAuthCookies()).not.toThrow();
  });
});
