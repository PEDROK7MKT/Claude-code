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
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/sw.js", headers: SERVICE_WORKER_HEADERS },
    ];
  },
};

export default nextConfig;
