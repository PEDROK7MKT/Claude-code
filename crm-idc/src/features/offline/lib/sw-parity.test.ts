/**
 * Executa public/sw.js num sandbox (node:vm) com Cache Storage e fetch falsos:
 * 1. a tabela de rotas do sw.js é idêntica à de cache-strategy.ts;
 * 2. o ciclo de vida (install/activate/fetch/message) se comporta como documentado.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

import * as strategy from "./cache-strategy";
import { ORIGIN, ROUTE_CASES, SAMPLE_OFFLINE_HTML } from "./cache-strategy.fixtures";

const SW_SOURCE = readFileSync(fileURLToPath(new URL("../../../../public/sw.js", import.meta.url)), "utf8");

// -----------------------------------------------------------------------------
// Fakes mínimos das APIs do service worker
// -----------------------------------------------------------------------------

type RequestLike = string | { url: string };
interface MatchOptions {
  ignoreSearch?: boolean;
  ignoreVary?: boolean;
}

function keyOf(req: RequestLike): string {
  return typeof req === "string" ? new URL(req, ORIGIN).href : req.url;
}

function withoutSearch(url: string): string {
  const u = new URL(url);
  u.search = "";
  return u.href;
}

class FakeCache {
  readonly entries = new Map<string, Response>();

  constructor(private readonly doFetch: (req: RequestLike) => Promise<Response>) {}

  async match(req: RequestLike, opts: MatchOptions = {}): Promise<Response | undefined> {
    const key = keyOf(req);
    const hit = this.entries.get(key);
    if (hit) return hit.clone();
    if (!opts.ignoreSearch) return undefined;
    for (const [k, v] of this.entries) if (withoutSearch(k) === withoutSearch(key)) return v.clone();
    return undefined;
  }

  async put(req: RequestLike, res: Response): Promise<void> {
    const key = keyOf(req);
    this.entries.delete(key);
    this.entries.set(key, res);
  }

  async add(req: RequestLike): Promise<void> {
    const res = await this.doFetch(req);
    if (!res.ok) throw new TypeError("bad response");
    await this.put(req, res);
  }

  async keys(): Promise<Array<{ url: string }>> {
    return [...this.entries.keys()].map((url) => ({ url }));
  }

  async delete(req: RequestLike): Promise<boolean> {
    return this.entries.delete(keyOf(req));
  }
}

class FakeCacheStorage {
  readonly stores = new Map<string, FakeCache>();

  constructor(private readonly doFetch: (req: RequestLike) => Promise<Response>) {}

  async open(name: string): Promise<FakeCache> {
    let cache = this.stores.get(name);
    if (!cache) {
      cache = new FakeCache(this.doFetch);
      this.stores.set(name, cache);
    }
    return cache;
  }

  async keys(): Promise<string[]> {
    return [...this.stores.keys()];
  }

  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name);
  }

  async match(req: RequestLike, opts?: MatchOptions): Promise<Response | undefined> {
    for (const cache of this.stores.values()) {
      const hit = await cache.match(req, opts);
      if (hit) return hit;
    }
    return undefined;
  }

  urls(name: string): string[] {
    return [...(this.stores.get(name)?.entries.keys() ?? [])];
  }
}

/** Request falso: o construtor real não aceita mode "navigate". */
class FakeRequest {
  readonly url: string;
  readonly method: string;
  readonly mode: string;
  readonly destination: string;
  readonly headers: Headers;

  constructor(
    input: string | FakeRequest,
    init: { method?: string; mode?: string; destination?: string; headers?: Record<string, string> } = {},
  ) {
    this.url = typeof input === "string" ? new URL(input, ORIGIN).href : input.url;
    this.method = init.method ?? "GET";
    this.mode = init.mode ?? "cors";
    this.destination = init.destination ?? "";
    this.headers = new Headers(init.headers);
  }
}

/** Resposta "basic" (mesmo domínio), como o fetch real devolveria. */
function basic(body: string, init: ResponseInit & { redirected?: boolean } = {}): Response {
  const res = new Response(body, init);
  Object.defineProperty(res, "type", { value: "basic" });
  if (init.redirected) Object.defineProperty(res, "redirected", { value: true });
  return res;
}

function html(body: string, status = 200): Response {
  return basic(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

type Listener = (event: unknown) => void;

interface FetchEventResult {
  handled: boolean;
  response?: Response;
}

class SwHarness {
  online = true;
  readonly network = new Map<string, () => Response>();
  readonly fetched: string[] = [];
  readonly listeners = new Map<string, Listener>();
  skipWaitingCalls = 0;
  claimCalls = 0;
  readonly caches: FakeCacheStorage;
  readonly context: vm.Context;

  constructor() {
    const doFetch = async (req: RequestLike): Promise<Response> => {
      const url = keyOf(req);
      this.fetched.push(url);
      if (!this.online) throw new TypeError("Failed to fetch");
      const make = this.network.get(url) ?? this.network.get(withoutSearch(url));
      return make ? make() : basic("not found", { status: 404 });
    };
    this.caches = new FakeCacheStorage(doFetch);

    const sandbox: Record<string, unknown> = {
      URL,
      Headers,
      Response,
      Request: FakeRequest,
      Promise,
      setTimeout,
      clearTimeout,
      caches: this.caches,
      fetch: doFetch,
      location: new URL(`${ORIGIN}/sw.js`),
      registration: { navigationPreload: { enable: async () => undefined } },
      clients: { claim: async () => void this.claimCalls++ },
      skipWaiting: async () => void this.skipWaitingCalls++,
      addEventListener: (type: string, fn: Listener) => this.listeners.set(type, fn),
    };
    sandbox.self = sandbox;
    this.context = vm.createContext(sandbox);
    vm.runInContext(SW_SOURCE, this.context, { filename: "sw.js" });
  }

  /** Valor de uma declaração top-level do sw.js (const/function). */
  eval<T>(expression: string): T {
    // JSON para não carregar objetos de outro realm para o expect
    return JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, this.context) as string) as T;
  }

  call<T>(fn: string, ...args: unknown[]): T {
    const f = vm.runInContext(fn, this.context) as (...a: unknown[]) => unknown;
    return JSON.parse(JSON.stringify(f(...args))) as T;
  }

  private async dispatch(type: string, extra: Record<string, unknown>): Promise<FetchEventResult> {
    const pending: Array<Promise<unknown>> = [];
    let responded: Promise<Response> | undefined;
    const event = {
      ...extra,
      waitUntil: (p: Promise<unknown>) => void pending.push(Promise.resolve(p)),
      respondWith: (p: Promise<Response>) => {
        responded = Promise.resolve(p);
      },
    };
    const listener = this.listeners.get(type);
    if (!listener) throw new Error(`sw.js não registra "${type}"`);
    listener(event);
    const response = responded ? await responded : undefined;
    // espera todo o trabalho em segundo plano (inclui waitUntil chamados depois)
    for (let settled = 0; settled < pending.length; ) {
      const batch = pending.slice(settled);
      settled = pending.length;
      await Promise.allSettled(batch);
    }
    return { handled: Boolean(responded), response };
  }

  install() {
    return this.dispatch("install", {});
  }

  activate() {
    return this.dispatch("activate", {});
  }

  message(data: unknown) {
    return this.dispatch("message", { data });
  }

  fetch(url: string, init: ConstructorParameters<typeof FakeRequest>[1] = {}) {
    return this.dispatch("fetch", { request: new FakeRequest(url, init), preloadResponse: Promise.resolve(undefined) });
  }

  navigate(path: string) {
    return this.fetch(`${ORIGIN}${path}`, { mode: "navigate", destination: "document" });
  }
}

const cache = (bucket: strategy.CacheBucket) => strategy.cacheName(bucket);

// -----------------------------------------------------------------------------
// 1. Paridade da tabela de rotas
// -----------------------------------------------------------------------------

describe("sw.js × cache-strategy.ts", () => {
  const sw = new SwHarness();

  it("constantes iguais", () => {
    expect(sw.eval("CACHE_PREFIX")).toBe(strategy.CACHE_PREFIX);
    expect(sw.eval("CACHE_VERSION")).toBe(strategy.CACHE_VERSION);
    expect(sw.eval("SW_PATH")).toBe(strategy.SW_PATH);
    expect(sw.eval("OFFLINE_PATH")).toBe(strategy.OFFLINE_PATH);
    expect(sw.eval("START_PATH")).toBe(strategy.START_PATH);
    expect(sw.eval("NAVIGATION_TIMEOUT_MS")).toBe(strategy.NAVIGATION_TIMEOUT_MS);
    expect(sw.eval("CACHE_LIMITS")).toEqual(strategy.CACHE_LIMITS);
    expect(sw.eval("SW_MESSAGES")).toEqual(strategy.SW_MESSAGES);
    expect(sw.eval("currentCacheNames()")).toEqual(strategy.currentCacheNames());
  });

  it.each(ROUTE_CASES)("classifyRequest: $name", ({ req, expected }) => {
    expect(sw.call("classifyRequest", req, ORIGIN)).toBe(expected);
    expect(strategy.classifyRequest(req, ORIGIN)).toBe(expected);
  });

  it.each([
    "idc-crm-pages-v0",
    "idc-crm-static-v1",
    "idc-crm-precache-v1",
    "outro-cache",
    "idc-crm-runtime-v2",
  ])("isObsoleteCache(%s)", (name) => {
    expect(sw.call("isObsoleteCache", name)).toBe(strategy.isObsoleteCache(name));
  });

  it.each(["/login", "/auth", "/auth/signout", "/authors", "/api/x", "/apple-icon/180.png", "/icon.svg", "/leads"])(
    "predicados de caminho: %s",
    (path) => {
      expect(sw.call("isAuthPath", path)).toBe(strategy.isAuthPath(path));
      expect(sw.call("isApiPath", path)).toBe(strategy.isApiPath(path));
      expect(sw.call("isIconPath", path)).toBe(strategy.isIconPath(path));
      expect(sw.call("isSessionBoundaryPath", path)).toBe(strategy.isSessionBoundaryPath(path));
    },
  );

  it.each([`${ORIGIN}/`, `${ORIGIN}/leads?status=novo#x`, `${ORIGIN}/offline`])("páginas: %s", (url) => {
    expect(sw.call("pageCacheKey", url)).toBe(strategy.pageCacheKey(url));
    expect(sw.call("navigationFallbackPaths", url)).toEqual(strategy.navigationFallbackPaths(url));
  });

  it("isCacheablePageResponse", () => {
    const base = { ok: true, status: 200, type: "basic", redirected: false, contentType: "text/html" };
    for (const res of [base, { ...base, redirected: true }, { ...base, contentType: null }, { ...base, status: 404, ok: false }]) {
      expect(sw.call("isCacheablePageResponse", res)).toBe(strategy.isCacheablePageResponse(res));
    }
  });

  it("extractPrecacheAssets", () => {
    expect(sw.call("extractPrecacheAssets", SAMPLE_OFFLINE_HTML, ORIGIN)).toEqual(
      strategy.extractPrecacheAssets(SAMPLE_OFFLINE_HTML, ORIGIN),
    );
  });
});

// -----------------------------------------------------------------------------
// 2. Comportamento
// -----------------------------------------------------------------------------

describe("sw.js — ciclo de vida", () => {
  let sw: SwHarness;

  beforeEach(() => {
    sw = new SwHarness();
    sw.network.set(`${ORIGIN}/offline`, () => html(SAMPLE_OFFLINE_HTML));
    sw.network.set(`${ORIGIN}/_next/static/css/app-3f2a.css`, () => basic("body{}"));
    sw.network.set(`${ORIGIN}/_next/static/chunks/webpack-77aa.js`, () => basic("//js"));
    sw.network.set(`${ORIGIN}/icon.svg`, () => basic("<svg/>"));
    sw.network.set(`${ORIGIN}/manifest.webmanifest`, () => basic("{}"));
  });

  it("registra install, activate, fetch e message", () => {
    expect([...sw.listeners.keys()].sort()).toEqual(["activate", "fetch", "install", "message"]);
  });

  it("install pré-carrega /offline e os assets que ela usa, sem skipWaiting", async () => {
    await sw.install();
    const urls = sw.caches.urls(cache("precache"));
    expect(urls).toContain(`${ORIGIN}/offline`);
    expect(urls).toContain(`${ORIGIN}/_next/static/css/app-3f2a.css`);
    expect(urls).toContain(`${ORIGIN}/_next/static/chunks/webpack-77aa.js`);
    expect(urls).toContain(`${ORIGIN}/manifest.webmanifest`);
    // assets que falharam (404) não entram nem quebram o install
    expect(urls).not.toContain(`${ORIGIN}/_next/static/chunks/offline-page-ab12.js`);
    expect(sw.skipWaitingCalls).toBe(0);
  });

  it("activate apaga só caches antigos do app e assume as abas", async () => {
    await sw.caches.open("idc-crm-pages-v0");
    await sw.caches.open("outro-app");
    await sw.caches.open(cache("static"));
    await sw.activate();
    expect(await sw.caches.keys()).toEqual(["outro-app", cache("static")]);
    expect(sw.claimCalls).toBe(1);
  });

  it("SKIP_WAITING ativa a versão nova", async () => {
    await sw.message({ type: "SKIP_WAITING" });
    expect(sw.skipWaitingCalls).toBe(1);
    await sw.message({ type: "OUTRA" });
    await sw.message(null);
    expect(sw.skipWaitingCalls).toBe(1);
  });
});

describe("sw.js — navegações", () => {
  let sw: SwHarness;

  beforeEach(async () => {
    sw = new SwHarness();
    sw.network.set(`${ORIGIN}/offline`, () => html("<h1>Você está offline</h1>"));
    sw.network.set(`${ORIGIN}/dashboard`, () => html("<h1>Dashboard</h1>"));
    sw.network.set(`${ORIGIN}/leads`, () => html("<h1>Leads</h1>"));
    sw.network.set(`${ORIGIN}/login`, () => html("<h1>Login</h1>"));
    sw.network.set(`${ORIGIN}/auth/signout`, () => basic("", { status: 303, headers: { Location: "/login" } }));
    await sw.install();
  });

  it("online: responde da rede e guarda a cópia", async () => {
    const { response } = await sw.navigate("/leads");
    expect(await response?.text()).toBe("<h1>Leads</h1>");
    expect(sw.caches.urls(cache("pages"))).toEqual([`${ORIGIN}/leads`]);
  });

  it("offline: última cópia da página (mesmo com outra query)", async () => {
    await sw.navigate("/leads");
    sw.online = false;
    expect(await (await sw.navigate("/leads")).response?.text()).toBe("<h1>Leads</h1>");
    expect(await (await sw.navigate("/leads?status=novo")).response?.text()).toBe("<h1>Leads</h1>");
  });

  it("offline sem cópia: página /offline; na raiz, a cópia do dashboard", async () => {
    await sw.navigate("/dashboard");
    sw.online = false;
    expect(await (await sw.navigate("/kanban")).response?.text()).toBe("<h1>Você está offline</h1>");
    expect(await (await sw.navigate("/")).response?.text()).toBe("<h1>Dashboard</h1>");
  });

  it("offline sem nada salvo: HTML mínimo embutido (503)", async () => {
    await sw.caches.delete(cache("precache"));
    sw.online = false;
    const { response } = await sw.navigate("/leads");
    expect(response?.status).toBe(503);
    expect(await response?.text()).toContain("Você está offline");
  });

  it("não guarda redirects nem erros", async () => {
    sw.network.set(`${ORIGIN}/relatorios`, () =>
      basic("<h1>Login</h1>", { status: 200, headers: { "Content-Type": "text/html" }, redirected: true }),
    );
    sw.network.set(`${ORIGIN}/gmn`, () => html("erro", 500));
    await sw.navigate("/relatorios");
    await sw.navigate("/gmn");
    expect(sw.caches.urls(cache("pages"))).toEqual([]);
  });

  it("servidor fora do ar (503) com cópia salva: usa a cópia", async () => {
    await sw.navigate("/leads");
    sw.network.set(`${ORIGIN}/leads`, () => html("gateway", 503));
    expect(await (await sw.navigate("/leads")).response?.text()).toBe("<h1>Leads</h1>");
  });

  it("login: sempre pela rede, nunca guardado; offline cai em /offline", async () => {
    const online = await sw.navigate("/login");
    expect(await online.response?.text()).toBe("<h1>Login</h1>");
    expect(sw.caches.urls(cache("pages"))).toEqual([]);
    sw.online = false;
    expect(await (await sw.navigate("/login")).response?.text()).toBe("<h1>Você está offline</h1>");
  });

  it("logout e login apagam as páginas salvas (dados da sessão)", async () => {
    await sw.navigate("/leads");
    expect(sw.caches.urls(cache("pages"))).toHaveLength(1);
    const { response } = await sw.navigate("/auth/signout");
    expect(response?.status).toBe(303);
    expect(sw.caches.stores.has(cache("pages"))).toBe(false);

    await sw.navigate("/dashboard");
    await sw.navigate("/login");
    expect(sw.caches.stores.has(cache("pages"))).toBe(false);
  });

  it("Cache Storage quebrado (cota/disco): navegação segue pela rede", async () => {
    const broken = async () => {
      throw new DOMException("QuotaExceededError");
    };
    Object.assign(sw.caches, { open: broken, match: broken });
    expect(await (await sw.navigate("/leads")).response?.text()).toBe("<h1>Leads</h1>");
    expect(await (await sw.navigate("/login")).response?.text()).toBe("<h1>Login</h1>");
    sw.online = false;
    const { response } = await sw.navigate("/leads");
    expect(response?.status).toBe(503);
    expect(await response?.text()).toContain("Você está offline");
  });

  it("CLEAR_PAGES apaga as páginas salvas", async () => {
    await sw.navigate("/leads");
    await sw.message({ type: "CLEAR_PAGES" });
    expect(sw.caches.stores.has(cache("pages"))).toBe(false);
  });

  it("respeita o limite de páginas (as mais antigas saem)", async () => {
    for (let i = 0; i <= strategy.CACHE_LIMITS.pages; i += 1) {
      sw.network.set(`${ORIGIN}/leads/${i}`, () => html(`lead ${i}`));
      await sw.navigate(`/leads/${i}`);
    }
    const urls = sw.caches.urls(cache("pages"));
    expect(urls).toHaveLength(strategy.CACHE_LIMITS.pages);
    expect(urls).not.toContain(`${ORIGIN}/leads/0`);
  });
});

describe("sw.js — assets e requisições ignoradas", () => {
  let sw: SwHarness;

  beforeEach(() => {
    sw = new SwHarness();
  });

  it("nunca intercepta Supabase, /api, POST nem RSC", async () => {
    const cases = [
      sw.fetch("https://abc.supabase.co/rest/v1/leads?select=*"),
      sw.fetch(`${ORIGIN}/api/webhook/lead`, { method: "POST" }),
      sw.fetch(`${ORIGIN}/leads/novo`, { method: "POST" }),
      sw.fetch(`${ORIGIN}/leads`, { headers: { RSC: "1" } }),
      sw.fetch(`${ORIGIN}/auth/signout`, { method: "POST", mode: "navigate" }),
    ];
    for (const result of await Promise.all(cases)) expect(result.handled).toBe(false);
    expect(sw.fetched).toEqual([]);
  });

  it("/_next/static: cache primeiro (funciona offline depois da 1ª carga)", async () => {
    const url = `${ORIGIN}/_next/static/chunks/app-1.js`;
    sw.network.set(url, () => basic("//chunk"));
    await sw.fetch(url, { destination: "script" });
    sw.online = false;
    const { response } = await sw.fetch(url, { destination: "script" });
    expect(await response?.text()).toBe("//chunk");
    expect(sw.fetched.filter((u) => u === url)).toHaveLength(1);
  });

  it("demais assets: responde do cache e revalida em segundo plano", async () => {
    const url = `${ORIGIN}/manifest.webmanifest`;
    let version = 1;
    sw.network.set(url, () => basic(`{"v":${version}}`));
    expect(await (await sw.fetch(url, { destination: "manifest" })).response?.text()).toBe('{"v":1}');
    version = 2;
    expect(await (await sw.fetch(url, { destination: "manifest" })).response?.text()).toBe('{"v":1}');
    expect(await (await sw.fetch(url, { destination: "manifest" })).response?.text()).toBe('{"v":2}');
  });

  it("WARM_CACHE guarda a página atual e os assets já carregados", async () => {
    sw.network.set(`${ORIGIN}/dashboard`, () => html("<h1>Dashboard</h1>"));
    sw.network.set(`${ORIGIN}/_next/static/chunks/main.js`, () => basic("//main"));
    await sw.message({
      type: "WARM_CACHE",
      page: `${ORIGIN}/dashboard`,
      assets: [`${ORIGIN}/_next/static/chunks/main.js`, "https://abc.supabase.co/rest/v1/leads", `${ORIGIN}/api/x`],
    });
    expect(sw.caches.urls(cache("pages"))).toEqual([`${ORIGIN}/dashboard`]);
    expect(sw.caches.urls(cache("static"))).toEqual([`${ORIGIN}/_next/static/chunks/main.js`]);
    expect(sw.fetched).not.toContain("https://abc.supabase.co/rest/v1/leads");
  });

  it("WARM_CACHE não guarda página de login", async () => {
    sw.network.set(`${ORIGIN}/login`, () => html("<h1>Login</h1>"));
    await sw.message({ type: "WARM_CACHE", page: `${ORIGIN}/login`, assets: [] });
    expect(sw.caches.urls(cache("pages"))).toEqual([]);
  });
});
