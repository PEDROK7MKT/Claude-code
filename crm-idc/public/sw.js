/*
 * IDC CRM — service worker (offline-first). Escrito à mão, sem Workbox.
 * Documentação: docs/OFFLINE.md.
 *
 * - Precache: página /offline + CSS/JS/fontes/ícones que ela referencia.
 * - Navegações (HTML): rede primeiro; sem rede → última cópia da página → /offline.
 * - /_next/static, fontes e ícones: cache primeiro (arquivos imutáveis, com hash).
 * - Demais assets do próprio domínio: stale-while-revalidate.
 * - NUNCA guarda: Supabase (outro domínio), /api/*, POST, payload RSC, /login e /auth/*.
 *
 * A tabela de rotas espelha src/features/offline/lib/cache-strategy.ts —
 * src/features/offline/lib/sw-parity.test.ts compara as duas. Altere as duas juntas
 * e incremente CACHE_VERSION quando mudar o formato dos caches.
 */
"use strict";

const CACHE_PREFIX = "idc-crm";
const CACHE_VERSION = "v1";
const SW_PATH = "/sw.js";
const OFFLINE_PATH = "/offline";
const START_PATH = "/dashboard";
const NAVIGATION_TIMEOUT_MS = 6000;
const CACHE_LIMITS = { pages: 40, static: 300, runtime: 80 };
const SW_MESSAGES = {
  skipWaiting: "SKIP_WAITING",
  warmCache: "WARM_CACHE",
  clearPages: "CLEAR_PAGES",
};
const PRECACHE_EXTRA_PATHS = ["/icon.svg", "/manifest.webmanifest"];

const ASSET_DESTINATIONS = new Set(["image", "style", "script", "font", "manifest"]);
const FONT_EXTENSION = /\.(?:woff2?|ttf|otf|eot)$/i;
const STATIC_EXTENSION = /\.(?:css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|webmanifest|json|txt|woff2?|ttf|otf)$/i;
const ANY_EXTENSION = /\/[^/]+\.[a-z0-9]+$/i;
const NEXT_STATIC_IN_HTML = /\/_next\/static\/[^\s"'<>\\)]+/g;
const ATTR_ASSET_IN_HTML = /(?:href|src)="(\/[^"]+?\.(?:css|js|svg|png|ico|webmanifest|woff2?)(?:\?[^"]*)?)"/g;
const ICON_ROUTE_IN_HTML = /(?:href|src)="(\/(?:apple-icon|icon)(?:\/[^"?]*)?(?:\?[^"]*)?)"/g;

// -----------------------------------------------------------------------------
// Tabela de rotas (espelho de cache-strategy.ts)
// -----------------------------------------------------------------------------

function cacheName(bucket, version) {
  return CACHE_PREFIX + "-" + bucket + "-" + (version || CACHE_VERSION);
}

function currentCacheNames(version) {
  return ["precache", "pages", "static", "runtime"].map(function (b) {
    return cacheName(b, version);
  });
}

function isObsoleteCache(name, version) {
  return name.indexOf(CACHE_PREFIX + "-") === 0 && currentCacheNames(version).indexOf(name) === -1;
}

function matchesPrefix(path, prefix) {
  return path === prefix || path.indexOf(prefix + "/") === 0;
}

function isAuthPath(path) {
  return matchesPrefix(path, "/login") || matchesPrefix(path, "/auth");
}

function isApiPath(path) {
  return matchesPrefix(path, "/api");
}

function isIconPath(path) {
  return (
    path === "/icon.svg" ||
    path === "/favicon.ico" ||
    matchesPrefix(path, "/icon") ||
    matchesPrefix(path, "/apple-icon")
  );
}

function isSessionBoundaryPath(path) {
  return path === "/login" || matchesPrefix(path, "/auth/signout");
}

function classifyRequest(req, origin) {
  if (String(req.method).toUpperCase() !== "GET") return "bypass";

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return "bypass";
  }
  if (url.origin !== origin) return "bypass";
  if (req.range) return "bypass";

  const path = url.pathname;
  if (path === SW_PATH || isApiPath(path)) return "bypass";
  if (req.rsc || url.searchParams.has("_rsc")) return "bypass";

  if (req.mode === "navigate") {
    if (ANY_EXTENSION.test(path)) return "bypass";
    return isAuthPath(path) ? "network-only-page" : "network-first-page";
  }

  if (isAuthPath(path)) return "bypass";
  if (path.indexOf("/_next/static/") === 0) return "cache-first";
  if (path.indexOf("/_next/") === 0 && path.indexOf("/_next/image") !== 0) return "bypass";
  if (req.destination === "font" || FONT_EXTENSION.test(path) || isIconPath(path)) return "cache-first";
  if (ASSET_DESTINATIONS.has(req.destination || "") || STATIC_EXTENSION.test(path)) {
    return "stale-while-revalidate";
  }
  return "bypass";
}

function pageCacheKey(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  return url.href;
}

function navigationFallbackPaths(rawUrl) {
  const path = new URL(rawUrl).pathname;
  const paths = [path];
  if (path === "/") paths.push(START_PATH);
  if (paths.indexOf(OFFLINE_PATH) === -1) paths.push(OFFLINE_PATH);
  return paths;
}

function isCacheablePageResponse(res) {
  return (
    res.ok &&
    res.status === 200 &&
    res.type === "basic" &&
    !res.redirected &&
    String(res.contentType || "").toLowerCase().indexOf("text/html") !== -1
  );
}

function extractPrecacheAssets(html, origin) {
  const found = new Set();
  function add(raw) {
    const path = raw.replace(/&amp;/g, "&");
    try {
      const url = new URL(path, origin);
      if (url.origin === origin) found.add(url.href);
    } catch {
      // URL inválida: ignora
    }
  }
  for (const m of html.matchAll(NEXT_STATIC_IN_HTML)) add(m[0]);
  for (const m of html.matchAll(ATTR_ASSET_IN_HTML)) add(m[1]);
  for (const m of html.matchAll(ICON_ROUTE_IN_HTML)) add(m[1]);
  return Array.from(found);
}

// -----------------------------------------------------------------------------
// Utilitários de Request/Response/Cache
// -----------------------------------------------------------------------------

function describeRequest(request) {
  return {
    url: request.url,
    method: request.method,
    mode: request.mode,
    destination: request.destination,
    rsc: request.headers.get("RSC") === "1",
    range: request.headers.has("Range"),
  };
}

function describeResponse(response) {
  return {
    ok: response.ok,
    status: response.status,
    type: response.type,
    redirected: response.redirected,
    contentType: response.headers.get("Content-Type"),
  };
}

function isCacheableAsset(response) {
  return Boolean(response) && response.ok && response.type === "basic";
}

function noop() {}

function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      reject(new Error("timeout"));
    }, ms);
    promise.then(
      function (value) {
        clearTimeout(timer);
        resolve(value);
      },
      function (error) {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Remove as entradas mais antigas além do limite (keys() vem em ordem de gravação). */
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  const excess = keys.length - max;
  for (let i = 0; i < excess; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function putInCache(bucket, key, response) {
  const name = cacheName(bucket);
  const cache = await caches.open(name);
  await cache.put(key, response);
  if (CACHE_LIMITS[bucket]) await trimCache(name, CACHE_LIMITS[bucket]);
}

/** Apaga as cópias de página (contêm dados da sessão) e os assets de runtime. */
async function clearSessionCaches() {
  await Promise.all([caches.delete(cacheName("pages")), caches.delete(cacheName("runtime"))]);
}

/** Resposta da rede para a navegação, aproveitando o navigation preload quando ativo. */
async function fetchNavigation(event) {
  const preloaded = await event.preloadResponse;
  return preloaded || fetch(event.request);
}

function offlineHtml() {
  const html =
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>Sem conexão · IDC CRM</title></head>" +
    '<body style="font-family:system-ui,sans-serif;background:#F5F5F5;color:#1A1A1A;' +
    'display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px">' +
    '<main style="max-width:420px;text-align:center">' +
    '<h1 style="color:#0D6E6E;font-size:1.5rem">Você está offline</h1>' +
    "<p>Não foi possível carregar esta página sem conexão. Verifique a internet e tente novamente.</p>" +
    '<p><a href="" style="color:#0D6E6E;font-weight:600">Tentar novamente</a></p>' +
    "</main></body></html>";
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Última cópia da página → start_url (para "/") → /offline → HTML mínimo embutido. */
async function offlineFallback(rawUrl) {
  const pages = await caches.open(cacheName("pages"));
  const origin = self.location.origin;
  const paths = navigationFallbackPaths(rawUrl);
  for (const path of paths) {
    const target = new URL(path, origin).href;
    const copy =
      path === OFFLINE_PATH
        ? await caches.match(target, { ignoreVary: true })
        : await pages.match(target, { ignoreSearch: true, ignoreVary: true });
    if (copy) return copy;
  }
  return offlineHtml();
}

// -----------------------------------------------------------------------------
// Estratégias
// -----------------------------------------------------------------------------

/** Login e /auth/*: sempre pela rede; ao cruzar a fronteira da sessão, apaga as páginas salvas. */
async function networkOnlyPage(event) {
  const url = new URL(event.request.url);
  try {
    const response = await fetchNavigation(event);
    if (isSessionBoundaryPath(url.pathname)) event.waitUntil(clearSessionCaches().catch(noop));
    return response;
  } catch {
    return offlineFallback(event.request.url);
  }
}

/** Páginas do app: rede primeiro (guardando a cópia); sem rede, a última cópia salva. */
async function networkFirstPage(event) {
  const request = event.request;
  const key = pageCacheKey(request.url);
  const pages = await caches.open(cacheName("pages"));

  const network = fetchNavigation(event).then(function (response) {
    if (isCacheablePageResponse(describeResponse(response))) {
      // grava em segundo plano, sem atrasar o streaming do HTML
      event.waitUntil(putInCache("pages", key, response.clone()).catch(noop));
    }
    return response;
  });
  event.waitUntil(network.catch(noop));

  const cached = await pages.match(key, { ignoreVary: true });
  if (!cached) {
    try {
      return await network;
    } catch {
      return offlineFallback(request.url);
    }
  }

  try {
    const response = await withTimeout(network, NAVIGATION_TIMEOUT_MS);
    // servidor/gateway fora do ar: a cópia salva é mais útil que a página de erro
    return response.status >= 502 && response.status <= 504 ? cached : response;
  } catch {
    return cached;
  }
}

async function cacheFirst(event) {
  const request = event.request;
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableAsset(response)) {
    event.waitUntil(putInCache("static", request, response.clone()).catch(noop));
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  // procura em todos os caches (o manifest também é pré-carregado com /offline)
  const cached = await caches.match(request);
  const network = fetch(request).then(function (response) {
    if (isCacheableAsset(response)) {
      event.waitUntil(putInCache("runtime", request, response.clone()).catch(noop));
    }
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(noop));
    return cached;
  }
  return network;
}

// -----------------------------------------------------------------------------
// Ciclo de vida
// -----------------------------------------------------------------------------

/** Guarda /offline e tudo que ela referencia (best-effort para os assets). */
async function precacheOfflinePage() {
  const cache = await caches.open(cacheName("precache"));
  const origin = self.location.origin;
  const offlineUrl = new URL(OFFLINE_PATH, origin).href;
  const response = await fetch(new Request(offlineUrl, { cache: "reload", credentials: "same-origin" }));
  if (!response.ok) throw new Error("Falha ao pré-carregar " + OFFLINE_PATH + ": HTTP " + response.status);
  await cache.put(offlineUrl, response.clone());

  const html = await response.text();
  const extras = PRECACHE_EXTRA_PATHS.map(function (p) {
    return new URL(p, origin).href;
  });
  const assets = extractPrecacheAssets(html, origin).concat(extras);
  await Promise.all(
    assets.map(function (asset) {
      return cache.add(new Request(asset, { cache: "reload" })).catch(noop);
    }),
  );
}

/** Primeira visita: a página carregou antes do SW — guarda a página e os assets já usados. */
async function warmCache(data) {
  const origin = self.location.origin;
  const assets = Array.isArray(data.assets) ? data.assets.slice(0, 150) : [];
  const tasks = assets.map(async function (asset) {
    if (classifyRequest({ url: asset, method: "GET" }, origin) !== "cache-first") return;
    if (await caches.match(asset)) return;
    const response = await fetch(asset);
    if (isCacheableAsset(response)) await putInCache("static", asset, response);
  });
  if (typeof data.page === "string") {
    const page = data.page;
    if (classifyRequest({ url: page, method: "GET", mode: "navigate" }, origin) === "network-first-page") {
      tasks.push(
        fetch(page, { credentials: "same-origin" }).then(function (response) {
          if (isCacheablePageResponse(describeResponse(response))) {
            return putInCache("pages", pageCacheKey(page), response);
          }
          return undefined;
        }),
      );
    }
  }
  await Promise.all(
    tasks.map(function (task) {
      return Promise.resolve(task).catch(noop);
    }),
  );
}

self.addEventListener("install", function (event) {
  // não chama skipWaiting: a versão nova espera o usuário clicar em "Atualizar"
  event.waitUntil(precacheOfflinePage());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      const names = await caches.keys();
      await Promise.all(
        names.filter(function (name) {
          return isObsoleteCache(name);
        }).map(function (name) {
          return caches.delete(name);
        }),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(noop);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", function (event) {
  const data = event.data;
  if (!data || typeof data.type !== "string") return;
  if (data.type === SW_MESSAGES.skipWaiting) {
    self.skipWaiting();
  } else if (data.type === SW_MESSAGES.warmCache) {
    event.waitUntil(warmCache(data).catch(noop));
  } else if (data.type === SW_MESSAGES.clearPages) {
    event.waitUntil(clearSessionCaches().catch(noop));
  }
});

/** Rede de segurança das navegações: se o Cache Storage falhar (cota, disco), vai à rede. */
function safeNavigation(event, handler) {
  return handler(event).catch(function () {
    return fetchNavigation(event).catch(offlineHtml);
  });
}

self.addEventListener("fetch", function (event) {
  const strategy = classifyRequest(describeRequest(event.request), self.location.origin);
  switch (strategy) {
    case "network-only-page":
      event.respondWith(safeNavigation(event, networkOnlyPage));
      return;
    case "network-first-page":
      event.respondWith(safeNavigation(event, networkFirstPage));
      return;
    case "cache-first":
      event.respondWith(cacheFirst(event));
      return;
    case "stale-while-revalidate":
      event.respondWith(staleWhileRevalidate(event));
      return;
    default:
      // "bypass": o navegador segue direto para a rede
      return;
  }
});
