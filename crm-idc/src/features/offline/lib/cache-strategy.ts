/**
 * Estratégias de cache do service worker (public/sw.js).
 *
 * O sw.js é JavaScript puro servido de /public e não importa TypeScript, então a
 * mesma tabela de rotas é DUPLICADA lá. `sw-parity.test.ts` executa o sw.js num
 * sandbox e compara as duas implementações caso a caso — altere as duas juntas.
 */

/** Prefixo de todos os caches do app (Cache Storage). Nada fora dele é tocado. */
export const CACHE_PREFIX = "idc-crm";

/**
 * Versão dos caches. Incrementar ao mudar o sw.js de forma incompatível: no
 * `activate`, caches de outras versões são apagados.
 */
export const CACHE_VERSION = "v1";

export const SW_PATH = "/sw.js";
export const OFFLINE_PATH = "/offline";
/** start_url do manifest — fallback de "/" quando não há cópia da raiz. */
export const START_PATH = "/dashboard";

/** Navegações: acima disso, com cópia salva, mostra a cópia e atualiza em segundo plano. */
export const NAVIGATION_TIMEOUT_MS = 6000;

/** Limites de entradas por cache (os mais antigos saem primeiro). */
export const CACHE_LIMITS = {
  pages: 40,
  static: 300,
  runtime: 80,
} as const;

/** Mensagens trocadas entre a página e o service worker. */
export const SW_MESSAGES = {
  /** Ativa a versão nova que está esperando (botão "Atualizar"). */
  skipWaiting: "SKIP_WAITING",
  /** Guarda a página atual e os assets já carregados (1ª visita, ainda sem SW no controle). */
  warmCache: "WARM_CACHE",
  /** Apaga as páginas salvas (dados de sessão) — logout. */
  clearPages: "CLEAR_PAGES",
} as const;

export type CacheStrategy =
  /** Não intercepta: o navegador vai direto à rede (Supabase, /api, POST, RSC…). */
  | "bypass"
  /** Navegação sempre pela rede, sem guardar cópia; offline → /offline (login, /auth/*). */
  | "network-only-page"
  /** Navegação pela rede com cópia salva; offline → última cópia da página → /offline. */
  | "network-first-page"
  /** Assets imutáveis (/_next/static, fontes, ícones): cache primeiro. */
  | "cache-first"
  /** Demais assets do próprio domínio: responde do cache e atualiza em segundo plano. */
  | "stale-while-revalidate";

export type CacheBucket = "precache" | "pages" | "static" | "runtime";

/** Dados da requisição que importam para a estratégia (espelha `describeRequest` do sw.js). */
export interface RequestDescriptor {
  /** URL absoluta. */
  url: string;
  method: string;
  /** `Request.mode` ("navigate" nas navegações de documento). */
  mode?: string;
  /** `Request.destination` ("image", "style", "script", "font", "manifest"…). */
  destination?: string;
  /** Cabeçalho `RSC: 1` (payload de navegação/prefetch do App Router). */
  rsc?: boolean;
  /** Tem cabeçalho `Range` (mídia parcial). */
  range?: boolean;
}

const ASSET_DESTINATIONS = new Set(["image", "style", "script", "font", "manifest"]);
const FONT_EXTENSION = /\.(?:woff2?|ttf|otf|eot)$/i;
const STATIC_EXTENSION = /\.(?:css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|webmanifest|json|txt|woff2?|ttf|otf)$/i;
const ANY_EXTENSION = /\/[^/]+\.[a-z0-9]+$/i;

/** Nome de cada cache na versão atual. */
export function cacheName(bucket: CacheBucket, version: string = CACHE_VERSION): string {
  return `${CACHE_PREFIX}-${bucket}-${version}`;
}

/** Todos os caches da versão atual (os que sobrevivem ao `activate`). */
export function currentCacheNames(version: string = CACHE_VERSION): string[] {
  return (["precache", "pages", "static", "runtime"] as const).map((b) => cacheName(b, version));
}

/** Cache antigo do app (outra versão) que deve ser apagado no `activate`. */
export function isObsoleteCache(name: string, version: string = CACHE_VERSION): boolean {
  return name.startsWith(`${CACHE_PREFIX}-`) && !currentCacheNames(version).includes(name);
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Login e rotas de autenticação: nunca guardadas (respostas dependem da sessão/cookies). */
export function isAuthPath(path: string): boolean {
  return matchesPrefix(path, "/login") || matchesPrefix(path, "/auth");
}

/** Route Handlers da API (webhook etc.): nunca interceptados. */
export function isApiPath(path: string): boolean {
  return matchesPrefix(path, "/api");
}

/** Ícones do app (metadata do Next): mudam só com deploy e têm hash na query. */
export function isIconPath(path: string): boolean {
  return (
    path === "/icon.svg" ||
    path === "/favicon.ico" ||
    matchesPrefix(path, "/icon") ||
    matchesPrefix(path, "/apple-icon")
  );
}

/** Rotas que encerram a sessão: ao passar por elas, as páginas salvas são apagadas. */
export function isSessionBoundaryPath(path: string): boolean {
  return path === "/login" || matchesPrefix(path, "/auth/signout");
}

/**
 * Decide como o service worker trata a requisição. Ordem importa:
 * tudo que não é GET do próprio domínio passa direto — inclusive as chamadas ao
 * Supabase (outro domínio), que o TanStack Query já persiste no IndexedDB.
 */
export function classifyRequest(req: RequestDescriptor, origin: string): CacheStrategy {
  if (req.method.toUpperCase() !== "GET") return "bypass";

  let url: URL;
  try {
    url = new URL(req.url);
  } catch {
    return "bypass";
  }
  if (url.origin !== origin) return "bypass";
  if (req.range) return "bypass";

  const path = url.pathname;
  if (path === SW_PATH || isApiPath(path)) return "bypass";
  // payload RSC (navegação suave/prefetch): depende da árvore do roteador; offline, o
  // Next cai para navegação de documento, que é atendida pelas cópias de página
  if (req.rsc || url.searchParams.has("_rsc")) return "bypass";

  if (req.mode === "navigate") {
    if (ANY_EXTENSION.test(path)) return "bypass";
    return isAuthPath(path) ? "network-only-page" : "network-first-page";
  }

  if (isAuthPath(path)) return "bypass";
  if (path.startsWith("/_next/static/")) return "cache-first";
  // HMR, dados internos e demais rotas do Next (exceto o otimizador de imagens)
  if (path.startsWith("/_next/") && !path.startsWith("/_next/image")) return "bypass";
  if (req.destination === "font" || FONT_EXTENSION.test(path) || isIconPath(path)) return "cache-first";
  if (ASSET_DESTINATIONS.has(req.destination ?? "") || STATIC_EXTENSION.test(path)) {
    return "stale-while-revalidate";
  }
  // fetch() genérico (ex.: exportações): pode conter dados do usuário — não guarda
  return "bypass";
}

/** Chave da cópia de uma página: URL sem fragmento (a query faz parte). */
export function pageCacheKey(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  return url.href;
}

/**
 * Caminhos tentados, em ordem, quando a navegação falha e não há cópia exata:
 * a própria página (ignorando a query), a start_url para "/" e, por fim, /offline.
 */
export function navigationFallbackPaths(rawUrl: string): string[] {
  const path = new URL(rawUrl).pathname;
  const paths = [path];
  if (path === "/") paths.push(START_PATH);
  if (!paths.includes(OFFLINE_PATH)) paths.push(OFFLINE_PATH);
  return paths;
}

/** Resposta mínima de página que pode ser guardada (HTML 200 do próprio domínio, sem redirect). */
export interface PageResponseLike {
  ok: boolean;
  status: number;
  type: string;
  redirected: boolean;
  contentType: string | null;
}

export function isCacheablePageResponse(res: PageResponseLike): boolean {
  return (
    res.ok &&
    res.status === 200 &&
    res.type === "basic" &&
    !res.redirected &&
    (res.contentType ?? "").toLowerCase().includes("text/html")
  );
}

const NEXT_STATIC_IN_HTML = /\/_next\/static\/[^\s"'<>\\)]+/g;
const ATTR_ASSET_IN_HTML = /(?:href|src)="(\/[^"]+?\.(?:css|js|svg|png|ico|webmanifest|woff2?)(?:\?[^"]*)?)"/g;
const ICON_ROUTE_IN_HTML = /(?:href|src)="(\/(?:apple-icon|icon)(?:\/[^"?]*)?(?:\?[^"]*)?)"/g;

/**
 * Assets referenciados por um HTML (CSS, JS, fontes, ícones) para pré-carregar
 * junto com a página /offline — assim ela abre estilizada mesmo sem rede.
 */
export function extractPrecacheAssets(html: string, origin: string): string[] {
  const found = new Set<string>();
  const add = (raw: string) => {
    const path = raw.replace(/&amp;/g, "&");
    try {
      const url = new URL(path, origin);
      if (url.origin === origin) found.add(url.href);
    } catch {
      // URL inválida: ignora
    }
  };
  for (const m of html.matchAll(NEXT_STATIC_IN_HTML)) add(m[0]);
  for (const m of html.matchAll(ATTR_ASSET_IN_HTML)) add(m[1]);
  for (const m of html.matchAll(ICON_ROUTE_IN_HTML)) add(m[1]);
  return [...found];
}

/** Máximo de assets enviados no "warm cache" da primeira visita. */
export const WARM_CACHE_MAX_ASSETS = 150;

/**
 * URLs já carregadas pela página (Performance API) que valem ir para o cache na
 * primeira visita: só assets do próprio domínio tratados como cache-first.
 */
export function selectWarmCacheAssets(urls: readonly string[], origin: string): string[] {
  const selected = new Set<string>();
  for (const raw of urls) {
    if (selected.size >= WARM_CACHE_MAX_ASSETS) break;
    let url: URL;
    try {
      url = new URL(raw, origin);
    } catch {
      continue;
    }
    url.hash = "";
    if (classifyRequest({ url: url.href, method: "GET" }, origin) === "cache-first") selected.add(url.href);
  }
  return [...selected];
}
