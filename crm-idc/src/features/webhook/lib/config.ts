/**
 * Configuração do webhook a partir das variáveis de ambiente (lidas a cada
 * requisição — nada é cacheado, então trocar o segredo não exige novo build).
 */
import { MIN_SECRET_LENGTH, PLACEHOLDER_SECRETS } from "@/features/webhook/lib/constants";
import { parseAllowedOrigins } from "@/features/webhook/lib/cors";

export interface WebhookConfig {
  /** Segredo válido, ou null quando ausente/curto demais/de exemplo (webhook desativado → 503) */
  secret: string | null;
  /** Motivo de `secret` ser null, para o log do servidor */
  secretProblem: "missing" | "too_short" | "placeholder" | null;
  /** Origens autorizadas para o modo público (navegador), normalizadas */
  allowedOrigins: string[];
  /** Service role + URL do Supabase configurados? */
  databaseConfigured: boolean;
}

export function readWebhookConfig(env: Readonly<Record<string, string | undefined>>): WebhookConfig {
  const rawSecret = (env.WEBHOOK_SECRET ?? "").trim();
  const secretProblem = !rawSecret
    ? "missing"
    : rawSecret.length < MIN_SECRET_LENGTH
      ? "too_short"
      : PLACEHOLDER_SECRETS.includes(rawSecret.toLowerCase())
        ? "placeholder"
        : null;
  return {
    secret: secretProblem ? null : rawSecret,
    secretProblem,
    allowedOrigins: parseAllowedOrigins(env.WEBHOOK_ALLOWED_ORIGINS),
    databaseConfigured: Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  };
}
