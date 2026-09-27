/**
 * CORS do webhook: só as origens de WEBHOOK_ALLOWED_ORIGINS recebem
 * Access-Control-Allow-Origin. O navegador só pode enviar Content-Type — nunca
 * Authorization/x-webhook-secret, para o segredo jamais ir parar no site.
 */
import { ALLOWED_METHODS } from "@/features/webhook/lib/constants";

/** "https://Site.com.br/" → "https://site.com.br"; inválida, sem http(s) ou "null" → null. */
export function normalizeOrigin(value: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  if (!text || text === "null" || text === "*") return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

/** Lista separada por vírgula/espaço → origens normalizadas e sem repetição ("*" é ignorado). */
export function parseAllowedOrigins(value: string | null | undefined): string[] {
  const origins = (value ?? "")
    .split(/[,\s]+/)
    .map((item) => normalizeOrigin(item))
    .filter((item): item is string => item !== null);
  return [...new Set(origins)];
}

export function isAllowedOrigin(origin: string | null | undefined, allowed: readonly string[]): boolean {
  const normalized = normalizeOrigin(origin);
  return normalized !== null && allowed.includes(normalized);
}

/** Cabeçalhos CORS das respostas (vazios se a origem não for autorizada). */
export function buildCorsHeaders(origin: string | null | undefined, allowed: readonly string[]): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && isAllowedOrigin(origin, allowed)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Expose-Headers"] = "Retry-After";
  }
  return headers;
}

/** Resposta ao preflight (OPTIONS). */
export function buildPreflightHeaders(origin: string | null | undefined, allowed: readonly string[]): Record<string, string> {
  const headers: Record<string, string> = { ...buildCorsHeaders(origin, allowed), Allow: ALLOWED_METHODS };
  if (headers["Access-Control-Allow-Origin"]) {
    headers["Access-Control-Allow-Methods"] = ALLOWED_METHODS;
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}
