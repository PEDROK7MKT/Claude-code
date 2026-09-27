import { describe, expect, it } from "vitest";
import {
  CACHE_VERSION,
  WARM_CACHE_MAX_ASSETS,
  cacheName,
  classifyRequest,
  currentCacheNames,
  extractPrecacheAssets,
  isAuthPath,
  isCacheablePageResponse,
  isObsoleteCache,
  isSessionBoundaryPath,
  navigationFallbackPaths,
  pageCacheKey,
  selectWarmCacheAssets,
} from "./cache-strategy";
import { ORIGIN, ROUTE_CASES, SAMPLE_OFFLINE_HTML } from "./cache-strategy.fixtures";

describe("classifyRequest", () => {
  it.each(ROUTE_CASES)("$name → $expected", ({ req, expected }) => {
    expect(classifyRequest(req, ORIGIN)).toBe(expected);
  });

  it("aceita método em minúsculas", () => {
    expect(classifyRequest({ url: `${ORIGIN}/dashboard`, method: "get", mode: "navigate" }, ORIGIN)).toBe(
      "network-first-page",
    );
  });
});

describe("nomes de cache", () => {
  it("usam prefixo e versão", () => {
    expect(cacheName("pages")).toBe(`idc-crm-pages-${CACHE_VERSION}`);
    expect(currentCacheNames("v9")).toEqual([
      "idc-crm-precache-v9",
      "idc-crm-pages-v9",
      "idc-crm-static-v9",
      "idc-crm-runtime-v9",
    ]);
  });

  it("só apaga caches do app de outras versões", () => {
    expect(isObsoleteCache("idc-crm-pages-v0", "v1")).toBe(true);
    expect(isObsoleteCache("idc-crm-static-v1", "v1")).toBe(false);
    expect(isObsoleteCache("outro-app-v1", "v1")).toBe(false);
    expect(isObsoleteCache("idc-crmx", "v1")).toBe(false);
  });
});

describe("rotas de sessão", () => {
  it("reconhece login e /auth/*", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/auth/signout")).toBe(true);
    expect(isAuthPath("/authors")).toBe(false);
    expect(isAuthPath("/leads")).toBe(false);
  });

  it("login e logout apagam as páginas salvas", () => {
    expect(isSessionBoundaryPath("/login")).toBe(true);
    expect(isSessionBoundaryPath("/auth/signout")).toBe(true);
    expect(isSessionBoundaryPath("/auth/callback")).toBe(false);
    expect(isSessionBoundaryPath("/dashboard")).toBe(false);
  });
});

describe("páginas", () => {
  it("chave sem fragmento, com query", () => {
    expect(pageCacheKey(`${ORIGIN}/leads?status=novo#topo`)).toBe(`${ORIGIN}/leads?status=novo`);
  });

  it("fallback: página → start_url (raiz) → /offline", () => {
    expect(navigationFallbackPaths(`${ORIGIN}/leads?x=1`)).toEqual(["/leads", "/offline"]);
    expect(navigationFallbackPaths(`${ORIGIN}/`)).toEqual(["/", "/dashboard", "/offline"]);
    expect(navigationFallbackPaths(`${ORIGIN}/offline`)).toEqual(["/offline"]);
  });

  it("só guarda HTML 200 do próprio domínio, sem redirect", () => {
    const ok = { ok: true, status: 200, type: "basic", redirected: false, contentType: "text/html; charset=utf-8" };
    expect(isCacheablePageResponse(ok)).toBe(true);
    expect(isCacheablePageResponse({ ...ok, redirected: true })).toBe(false);
    expect(isCacheablePageResponse({ ...ok, type: "opaqueredirect", ok: false, status: 0 })).toBe(false);
    expect(isCacheablePageResponse({ ...ok, ok: false, status: 500 })).toBe(false);
    expect(isCacheablePageResponse({ ...ok, status: 203 })).toBe(false);
    expect(isCacheablePageResponse({ ...ok, contentType: "application/json" })).toBe(false);
    expect(isCacheablePageResponse({ ...ok, contentType: null })).toBe(false);
  });
});

describe("extractPrecacheAssets", () => {
  it("encontra CSS, JS, fontes, manifest e ícones do próprio domínio", () => {
    const assets = extractPrecacheAssets(SAMPLE_OFFLINE_HTML, ORIGIN);
    expect(assets).toEqual(
      expect.arrayContaining([
        `${ORIGIN}/_next/static/media/inter-latin.p.woff2`,
        `${ORIGIN}/_next/static/css/app-3f2a.css`,
        `${ORIGIN}/_next/static/chunks/webpack-77aa.js`,
        `${ORIGIN}/_next/static/chunks/offline-page-ab12.js`,
        `${ORIGIN}/manifest.webmanifest`,
        `${ORIGIN}/icon.svg?9a8b7c`,
        `${ORIGIN}/apple-icon/180.png?1d2e&v=2`,
        `${ORIGIN}/icon?5f6a`,
      ]),
    );
  });

  it("ignora links de página, domínios externos e duplicatas", () => {
    const assets = extractPrecacheAssets(SAMPLE_OFFLINE_HTML + SAMPLE_OFFLINE_HTML, ORIGIN);
    expect(assets).not.toContain(`${ORIGIN}/dashboard`);
    expect(assets.some((a) => a.includes("cdn.externo.com"))).toBe(false);
    expect(new Set(assets).size).toBe(assets.length);
    expect(assets).toHaveLength(8);
  });
});

describe("selectWarmCacheAssets", () => {
  it("mantém só assets cache-first do próprio domínio, sem duplicar", () => {
    const selected = selectWarmCacheAssets(
      [
        `${ORIGIN}/_next/static/chunks/main.js`,
        `${ORIGIN}/_next/static/chunks/main.js#x`,
        "/_next/static/css/app.css",
        `${ORIGIN}/icon.svg?abc`,
        `${ORIGIN}/api/webhook/lead`,
        `${ORIGIN}/leads?_rsc=1`,
        "https://abc.supabase.co/rest/v1/leads",
        `${ORIGIN}/manifest.webmanifest`,
        "::inválida::",
      ],
      ORIGIN,
    );
    expect(selected).toEqual([
      `${ORIGIN}/_next/static/chunks/main.js`,
      `${ORIGIN}/_next/static/css/app.css`,
      `${ORIGIN}/icon.svg?abc`,
    ]);
  });

  it("respeita o limite", () => {
    const urls = Array.from({ length: WARM_CACHE_MAX_ASSETS + 20 }, (_, i) => `${ORIGIN}/_next/static/chunks/${i}.js`);
    expect(selectWarmCacheAssets(urls, ORIGIN)).toHaveLength(WARM_CACHE_MAX_ASSETS);
  });
});
