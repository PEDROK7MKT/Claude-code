/**
 * Casos de teste compartilhados entre cache-strategy.test.ts e sw-parity.test.ts
 * (a mesma tabela valida o TypeScript e o public/sw.js).
 */
import type { CacheStrategy, RequestDescriptor } from "./cache-strategy";

export const ORIGIN = "https://crm.idc.test";

/** Casos compartilhados com o teste de paridade do sw.js. */
export const ROUTE_CASES: ReadonlyArray<{ name: string; req: RequestDescriptor; expected: CacheStrategy }> = [
  // navegações
  { name: "dashboard", req: { url: `${ORIGIN}/dashboard`, method: "GET", mode: "navigate" }, expected: "network-first-page" },
  { name: "raiz", req: { url: `${ORIGIN}/`, method: "GET", mode: "navigate" }, expected: "network-first-page" },
  { name: "detalhe do lead com query", req: { url: `${ORIGIN}/leads/5b1c?aba=historico`, method: "GET", mode: "navigate" }, expected: "network-first-page" },
  { name: "página offline", req: { url: `${ORIGIN}/offline`, method: "GET", mode: "navigate" }, expected: "network-first-page" },
  { name: "login", req: { url: `${ORIGIN}/login?next=%2Fleads`, method: "GET", mode: "navigate" }, expected: "network-only-page" },
  { name: "logout", req: { url: `${ORIGIN}/auth/signout`, method: "GET", mode: "navigate" }, expected: "network-only-page" },
  { name: "callback de auth", req: { url: `${ORIGIN}/auth/callback?code=1`, method: "GET", mode: "navigate" }, expected: "network-only-page" },
  { name: "/login-ajuda não é auth", req: { url: `${ORIGIN}/login-ajuda`, method: "GET", mode: "navigate" }, expected: "network-first-page" },
  { name: "navegação para arquivo", req: { url: `${ORIGIN}/icon.svg`, method: "GET", mode: "navigate" }, expected: "bypass" },
  { name: "navegação para API", req: { url: `${ORIGIN}/api/webhook/lead`, method: "GET", mode: "navigate" }, expected: "bypass" },
  { name: "logout via POST", req: { url: `${ORIGIN}/auth/signout`, method: "POST", mode: "navigate" }, expected: "bypass" },
  // nunca intercepta
  { name: "Supabase REST", req: { url: "https://abc.supabase.co/rest/v1/leads?select=*", method: "GET", mode: "cors" }, expected: "bypass" },
  { name: "Supabase auth", req: { url: "https://abc.supabase.co/auth/v1/token", method: "POST", mode: "cors" }, expected: "bypass" },
  { name: "webhook POST", req: { url: `${ORIGIN}/api/webhook/lead`, method: "POST" }, expected: "bypass" },
  { name: "API GET", req: { url: `${ORIGIN}/api/qualquer`, method: "GET" }, expected: "bypass" },
  { name: "Server Action", req: { url: `${ORIGIN}/leads/novo`, method: "POST", mode: "cors" }, expected: "bypass" },
  { name: "HEAD de conectividade", req: { url: `${ORIGIN}/dashboard`, method: "HEAD" }, expected: "bypass" },
  { name: "RSC por cabeçalho", req: { url: `${ORIGIN}/leads`, method: "GET", rsc: true }, expected: "bypass" },
  { name: "RSC por query", req: { url: `${ORIGIN}/leads?_rsc=abc12`, method: "GET" }, expected: "bypass" },
  { name: "o próprio sw.js", req: { url: `${ORIGIN}/sw.js`, method: "GET", destination: "serviceworker" }, expected: "bypass" },
  { name: "HMR", req: { url: `${ORIGIN}/_next/webpack-hmr`, method: "GET" }, expected: "bypass" },
  { name: "fetch em rota de auth", req: { url: `${ORIGIN}/auth/signout`, method: "GET" }, expected: "bypass" },
  { name: "fetch genérico", req: { url: `${ORIGIN}/relatorios/exportar`, method: "GET" }, expected: "bypass" },
  { name: "Range", req: { url: `${ORIGIN}/video.mp4`, method: "GET", destination: "video", range: true }, expected: "bypass" },
  { name: "URL inválida", req: { url: "nada", method: "GET" }, expected: "bypass" },
  // assets
  { name: "chunk JS", req: { url: `${ORIGIN}/_next/static/chunks/app-1a2b.js`, method: "GET", destination: "script" }, expected: "cache-first" },
  { name: "CSS", req: { url: `${ORIGIN}/_next/static/css/9f8e.css`, method: "GET", destination: "style" }, expected: "cache-first" },
  { name: "fonte do next/font", req: { url: `${ORIGIN}/_next/static/media/inter.woff2`, method: "GET", destination: "font" }, expected: "cache-first" },
  { name: "fonte fora do _next", req: { url: `${ORIGIN}/fonts/extra.woff2`, method: "GET" }, expected: "cache-first" },
  { name: "ícone SVG", req: { url: `${ORIGIN}/icon.svg?a1b2`, method: "GET", destination: "image" }, expected: "cache-first" },
  { name: "apple-icon", req: { url: `${ORIGIN}/apple-icon/180.png?c3d4`, method: "GET", destination: "image" }, expected: "cache-first" },
  { name: "manifest", req: { url: `${ORIGIN}/manifest.webmanifest`, method: "GET", destination: "manifest" }, expected: "stale-while-revalidate" },
  { name: "imagem otimizada", req: { url: `${ORIGIN}/_next/image?url=%2Flogo.png&w=256&q=75`, method: "GET", destination: "image" }, expected: "stale-while-revalidate" },
  { name: "arquivo público", req: { url: `${ORIGIN}/logo.png`, method: "GET" }, expected: "stale-while-revalidate" },
  { name: "logo do Storage", req: { url: "https://abc.supabase.co/storage/v1/object/public/logo.png", method: "GET", destination: "image" }, expected: "bypass" },
];

/** HTML típico da página /offline gerada pelo Next (para o precache). */
export const SAMPLE_OFFLINE_HTML = `<!DOCTYPE html><html lang="pt-BR"><head>
<link rel="preload" href="/_next/static/media/inter-latin.p.woff2" as="font" crossorigin="" type="font/woff2"/>
<link rel="stylesheet" href="/_next/static/css/app-3f2a.css" data-precedence="next"/>
<script src="/_next/static/chunks/webpack-77aa.js" async=""></script>
<link rel="manifest" href="/manifest.webmanifest"/>
<link rel="icon" href="/icon.svg?9a8b7c" type="image/svg+xml" sizes="any"/>
<link rel="apple-touch-icon" href="/apple-icon/180.png?1d2e&amp;v=2" type="image/png" sizes="180x180"/>
<link rel="icon" href="/icon?5f6a" type="image/png"/>
<script src="https://cdn.externo.com/lib.js"></script>
</head><body><a href="/dashboard">Ir para o dashboard</a>
<script>self.__next_f.push([1,"2:I[\\"/_next/static/chunks/offline-page-ab12.js\\",[]]"])</script>
</body></html>`;
