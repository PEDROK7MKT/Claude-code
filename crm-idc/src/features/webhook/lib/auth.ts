/**
 * Autenticação do webhook: segredo compartilhado (WEBHOOK_SECRET) enviado em
 * "Authorization: Bearer <segredo>" ou "x-webhook-secret", comparado em tempo
 * constante. Sem segredo, só passa quem vem de uma origem autorizada (modo público).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import type { WebhookAuthMode } from "@/features/webhook/lib/types";

/** Segredo enviado pelo cliente; "" quando o cabeçalho existe mas está vazio/malformado; null quando ausente. */
export function extractProvidedSecret(headers: Headers): string | null {
  const authorization = headers.get("authorization");
  if (authorization !== null) {
    const match = /^\s*Bearer\s+(.+?)\s*$/i.exec(authorization);
    return match ? match[1] : "";
  }
  const header = headers.get("x-webhook-secret");
  return header === null ? null : header.trim();
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Comparação em tempo constante. Os dois lados viram SHA-256 (mesmo tamanho),
 * então nem o comprimento do segredo vaza pelo tempo de resposta.
 */
export function secretsMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}

export type WebhookAuthResult =
  | { ok: true; mode: WebhookAuthMode }
  | { ok: false; reason: "invalid_secret" | "missing_secret" };

/**
 * Decide o modo da requisição:
 * - segredo enviado e correto → "secret"; enviado e errado → invalid_secret
 *   (mesmo vindo de origem autorizada);
 * - sem segredo, de origem autorizada → "public"; senão → missing_secret.
 */
export function authenticateWebhookRequest(args: {
  headers: Headers;
  secret: string;
  originAllowed: boolean;
}): WebhookAuthResult {
  const provided = extractProvidedSecret(args.headers);
  if (provided !== null) {
    return secretsMatch(provided, args.secret) ? { ok: true, mode: "secret" } : { ok: false, reason: "invalid_secret" };
  }
  return args.originAllowed ? { ok: true, mode: "public" } : { ok: false, reason: "missing_secret" };
}
