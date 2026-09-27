import path from "node:path";
import type { NextConfig } from "next";

/** Cabeçalhos de segurança de todas as respostas (app privado; não pode ser embutido em iframes). */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** Service worker (PWA offline): sempre revalidado, com escopo na raiz. */
const SERVICE_WORKER_HEADERS = [
  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Service-Worker-Allowed", value: "/" },
  // o SW só busca o próprio domínio
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
];

/** Script de rastreamento de UTMs usado no site institutodeciocarrilho.com.br (docs/WEBHOOK.md). */
const TRACKER_HEADERS = [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // O repositório tem outro package-lock na raiz (app Batcaverna); o CRM é um projeto à parte
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/sw.js", headers: SERVICE_WORKER_HEADERS },
      { source: "/idc-lead-tracker.js", headers: TRACKER_HEADERS },
    ];
  },
};

export default nextConfig;
