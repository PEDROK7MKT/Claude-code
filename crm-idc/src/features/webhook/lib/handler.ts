/**
 * Handler do webhook de leads (POST /api/webhook/lead), independente do Next:
 * recebe um Request e devolve um Response. Banco, configuração, relógio, log e
 * rate limit são injetados — a rota só liga as dependências reais (service role).
 *
 * Ordem: configuração (503) → autenticação/rate limit (401/429) → corpo (413/415/400)
 * → honeypot (modo público) → validação (400) → duplicados (regra 4) → gravação (201).
 */
import { authenticateWebhookRequest } from "@/features/webhook/lib/auth";
import { parseBody, readBodyText } from "@/features/webhook/lib/body";
import type { WebhookConfig } from "@/features/webhook/lib/config";
import { ALLOWED_METHODS, MAX_BODY_BYTES, MIN_SECRET_LENGTH, WEBHOOK_MESSAGES } from "@/features/webhook/lib/constants";
import { buildCorsHeaders, buildPreflightHeaders, isAllowedOrigin } from "@/features/webhook/lib/cors";
import { isRecentRepeat, latestLead, linkDuplicate } from "@/features/webhook/lib/duplicates";
import { normalizeWebhookLead } from "@/features/webhook/lib/normalize";
import { getClientIp, type RateLimiter } from "@/features/webhook/lib/rate-limit";
import { isHoneypotFilled, parseWebhookPayload } from "@/features/webhook/lib/schema";
import type { ExistingLead, WebhookLeadRepository, WebhookResponseBody } from "@/features/webhook/lib/types";

const LOG_PREFIX = "[webhook/lead]";

export interface WebhookLogger {
  error(message: string, detail?: string): void;
  warn(message: string, detail?: string): void;
  info(message: string, detail?: string): void;
}

export interface LeadWebhookDeps {
  getConfig: () => WebhookConfig;
  /** Criado sob demanda: só é chamado depois da autenticação e da validação */
  getRepository: () => WebhookLeadRepository;
  /** Limite de requisições sem segredo válido (por IP) */
  rateLimiter: RateLimiter;
  now?: () => Date;
  logger?: WebhookLogger;
}

export interface LeadWebhookHandler {
  handlePost(request: Request): Promise<Response>;
  handleOptions(request: Request): Response;
  handleMethodNotAllowed(request: Request): Response;
}

/**
 * Descrição do erro para o log, sem dados do paciente: nome, código e mensagem
 * (nunca `details`/`hint` do Postgres, que podem conter a linha com nome e telefone).
 */
export function describeError(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error).slice(0, 200);
  const name = error instanceof Error ? error.name : "Error";
  const code = "code" in error && typeof error.code === "string" ? `code=${error.code}` : "";
  const message = "message" in error && typeof error.message === "string" ? error.message.slice(0, 200) : "";
  return [name, code, message].filter(Boolean).join(" ");
}

function jsonResponse(status: number, body: WebhookResponseBody, headers: Record<string, string>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function createLeadWebhookHandler(deps: LeadWebhookDeps): LeadWebhookHandler {
  const now = deps.now ?? (() => new Date());
  const logger: WebhookLogger = deps.logger ?? console;

  async function processPost(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");
    const config = deps.getConfig();
    const cors = buildCorsHeaders(origin, config.allowedOrigins);
    const reply = (status: number, body: WebhookResponseBody, extra: Record<string, string> = {}) =>
      jsonResponse(status, body, { ...cors, ...extra });
    const fail = (status: number, error: string, extra?: Record<string, string>) =>
      reply(status, { ok: false, error }, extra);

    // 1. Configuração: sem segredo o webhook fica desligado (nunca grava sem autenticação)
    if (!config.secret) {
      logger.error(
        `${LOG_PREFIX} WEBHOOK_SECRET ${
          config.secretProblem === "too_short" ? `tem menos de ${MIN_SECRET_LENGTH} caracteres` : "não configurado"
        }; requisição recusada.`,
      );
      return fail(503, WEBHOOK_MESSAGES.notConfigured);
    }
    if (!config.databaseConfigured) {
      logger.error(`${LOG_PREFIX} SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_URL ausentes; requisição recusada.`);
      return fail(503, WEBHOOK_MESSAGES.databaseNotConfigured);
    }

    // 2. Autenticação. Todo tráfego sem segredo válido passa pelo rate limit por IP.
    const auth = authenticateWebhookRequest({
      headers: request.headers,
      secret: config.secret,
      originAllowed: isAllowedOrigin(origin, config.allowedOrigins),
    });
    if (!auth.ok || auth.mode === "public") {
      const limit = deps.rateLimiter.check(getClientIp(request.headers), now().getTime());
      if (!limit.allowed) {
        return fail(429, WEBHOOK_MESSAGES.rateLimited(limit.retryAfterSeconds), {
          "Retry-After": String(limit.retryAfterSeconds),
        });
      }
    }
    if (!auth.ok) {
      return fail(401, auth.reason === "invalid_secret" ? WEBHOOK_MESSAGES.invalidSecret : WEBHOOK_MESSAGES.missingSecret, {
        "WWW-Authenticate": 'Bearer realm="webhook"',
      });
    }
    const { mode } = auth;

    // 3. Corpo
    let text: string;
    try {
      const body = await readBodyText(request, MAX_BODY_BYTES);
      if (!body.ok) return fail(413, WEBHOOK_MESSAGES.bodyTooLarge);
      text = body.text;
    } catch {
      return fail(400, WEBHOOK_MESSAGES.unreadableBody);
    }
    const parsed = parseBody(text, request.headers.get("content-type"));
    if (!parsed.ok) return fail(parsed.status, parsed.error);

    // 4. Honeypot: robô recebe "sucesso" e nada é gravado
    if (mode === "public" && isHoneypotFilled(parsed.data)) {
      logger.warn(`${LOG_PREFIX} campo isca preenchido; envio descartado.`);
      return reply(200, { ok: true, id: null, duplicate_of: null });
    }

    // 5. Validação e normalização
    const payload = parseWebhookPayload(parsed.data);
    if (!payload.ok) return reply(400, { ok: false, error: WEBHOOK_MESSAGES.validation, fields: payload.errors });
    const normalized = normalizeWebhookLead(payload.data, { mode });
    if (!normalized.ok) return reply(400, { ok: false, error: WEBHOOK_MESSAGES.validation, fields: normalized.errors });

    // 6. Duplicados (regra 4) + gravação
    try {
      const repository = deps.getRepository();
      let previous: ExistingLead | null = null;
      try {
        previous = latestLead(await repository.findLeadsByPhone(normalized.lead.phone));
      } catch (error) {
        // perder o lead é pior que perder o vínculo: segue sem ele
        logger.error(`${LOG_PREFIX} falha ao buscar leads com o mesmo telefone; gravando sem vínculo.`, describeError(error));
      }

      if (previous && isRecentRepeat(previous, now())) {
        logger.info(`${LOG_PREFIX} reenvio do lead ${previous.id}; nada foi gravado.`);
        return reply(200, { ok: true, id: previous.id, duplicate_of: null, repeated: true });
      }

      const { id } = await repository.insertLead(linkDuplicate(normalized.lead, previous));
      logger.info(`${LOG_PREFIX} lead ${id} criado${previous ? ` (possível duplicado de ${previous.id})` : ""}.`);
      return reply(201, { ok: true, id, duplicate_of: previous?.id ?? null });
    } catch (error) {
      logger.error(`${LOG_PREFIX} falha ao gravar o lead.`, describeError(error));
      return fail(500, WEBHOOK_MESSAGES.internal);
    }
  }

  async function handlePost(request: Request): Promise<Response> {
    try {
      return await processPost(request);
    } catch (error) {
      // rede de segurança: nunca devolve stack/HTML para quem integra
      logger.error(`${LOG_PREFIX} erro inesperado.`, describeError(error));
      return jsonResponse(500, { ok: false, error: WEBHOOK_MESSAGES.internal }, { Vary: "Origin" });
    }
  }

  function handleOptions(request: Request): Response {
    const headers = buildPreflightHeaders(request.headers.get("origin"), deps.getConfig().allowedOrigins);
    return new Response(null, { status: 204, headers: { ...headers, "Cache-Control": "no-store" } });
  }

  function handleMethodNotAllowed(request: Request): Response {
    const cors = buildCorsHeaders(request.headers.get("origin"), deps.getConfig().allowedOrigins);
    return jsonResponse(405, { ok: false, error: WEBHOOK_MESSAGES.methodNotAllowed }, { ...cors, Allow: ALLOWED_METHODS });
  }

  return { handlePost, handleOptions, handleMethodNotAllowed };
}
