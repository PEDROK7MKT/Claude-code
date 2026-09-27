/**
 * Validação do corpo do webhook (zod v4). Aceita os nomes de campo da API
 * (inglês, como as colunas do banco) e apelidos comuns em português de plugins
 * de formulário ("nome", "telefone", "mensagem"...). Textos são limpos e cortados
 * no limite; tipos errados (objeto, lista) viram erro 400 com o campo indicado.
 */
import { z } from "zod";
import { FIELD_LIMITS, FIELD_MESSAGES, HONEYPOT_FIELD } from "@/features/webhook/lib/constants";
import type { WebhookFieldError } from "@/features/webhook/lib/types";
import { slugify } from "@/lib/format";

// -----------------------------------------------------------------------------
// Limpeza de texto
// -----------------------------------------------------------------------------

// Caracteres de controle (exceto \t e \n), marcas de direção bidi e BOM
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F‎‏‪-‮⁦-⁩﻿]/g;

/** Corta em `max` caracteres sem partir um emoji (par substituto) ao meio. */
export function truncateText(value: string, max: number): string {
  if (value.length <= max) return value;
  let cut = value.slice(0, max);
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1);
  return cut.trimEnd();
}

/**
 * Texto limpo: sem caracteres de controle, espaços únicos (ou, em campos de
 * várias linhas, espaços únicos por linha e no máximo uma linha em branco
 * seguida), cortado em `max`. Vazio → null.
 */
export function cleanText(value: string | number | null | undefined, max: number, multiline = false): string | null {
  if (value == null) return null;
  let text = String(value).replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "");
  if (multiline) {
    text = text
      .split("\n")
      .map((line) => line.replace(/[ \t ]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    text = text.replace(/\s+/g, " ");
  }
  text = truncateText(text.trim(), max);
  return text ? text : null;
}

// -----------------------------------------------------------------------------
// Apelidos de campos
// -----------------------------------------------------------------------------

export const WEBHOOK_FIELDS = [
  "name",
  "phone",
  "source",
  "campaign",
  "keyword",
  "ad_group",
  "landing_page",
  "url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "service",
  "service_detail",
  "notes",
  "message",
] as const;

export type WebhookField = (typeof WEBHOOK_FIELDS)[number];

/** Apelido (normalizado: minúsculo, sem acento, "_" como separador) → campo da API. */
const FIELD_ALIASES: Readonly<Record<string, WebhookField>> = {
  nome: "name",
  nome_completo: "name",
  full_name: "name",
  fullname: "name",
  your_name: "name",
  telefone: "phone",
  celular: "phone",
  whatsapp: "phone",
  fone: "phone",
  tel: "phone",
  phone_number: "phone",
  fonte: "source",
  origem: "source",
  campanha: "campaign",
  palavra_chave: "keyword",
  kw: "keyword",
  grupo_de_anuncios: "ad_group",
  grupo_anuncio: "ad_group",
  adgroup: "ad_group",
  pagina: "landing_page",
  pagina_de_destino: "landing_page",
  page_url: "url",
  landing_url: "url",
  href: "url",
  servico: "service",
  tratamento: "service",
  interesse: "service",
  detalhe: "service_detail",
  detalhe_servico: "service_detail",
  observacoes: "notes",
  observacao: "notes",
  obs: "notes",
  mensagem: "message",
  msg: "message",
};

const CANONICAL_FIELDS: ReadonlySet<string> = new Set(WEBHOOK_FIELDS);

/**
 * Traduz apelidos para os nomes da API. O nome oficial sempre vence o apelido;
 * entre apelidos, vence o primeiro com valor. Campos desconhecidos são descartados.
 */
export function applyFieldAliases(raw: Readonly<Record<string, unknown>>): Partial<Record<WebhookField, unknown>> {
  const out: Partial<Record<WebhookField, unknown>> = {};
  const fromAlias = new Set<WebhookField>();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null || value === "") continue;
    const normalized = slugify(key);
    if (CANONICAL_FIELDS.has(normalized)) {
      const field = normalized as WebhookField;
      if (!(field in out) || fromAlias.has(field)) {
        out[field] = value;
        fromAlias.delete(field);
      }
      continue;
    }
    const alias = FIELD_ALIASES[normalized];
    if (alias && !(alias in out)) {
      out[alias] = value;
      fromAlias.add(alias);
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------

function textField(max: number, multiline = false) {
  return z
    .union([z.string(), z.number()], { error: FIELD_MESSAGES.notText })
    .nullish()
    .transform((value) => cleanText(value, max, multiline));
}

export const webhookLeadSchema = z.object({
  name: textField(FIELD_LIMITS.name),
  phone: textField(FIELD_LIMITS.phone),
  source: textField(FIELD_LIMITS.source),
  campaign: textField(FIELD_LIMITS.campaign),
  keyword: textField(FIELD_LIMITS.keyword),
  ad_group: textField(FIELD_LIMITS.ad_group),
  landing_page: textField(FIELD_LIMITS.url),
  url: textField(FIELD_LIMITS.url),
  utm_source: textField(FIELD_LIMITS.utm),
  utm_medium: textField(FIELD_LIMITS.utm),
  utm_campaign: textField(FIELD_LIMITS.utm),
  utm_term: textField(FIELD_LIMITS.utm),
  utm_content: textField(FIELD_LIMITS.utm),
  gclid: textField(FIELD_LIMITS.gclid),
  service: textField(FIELD_LIMITS.service),
  service_detail: textField(FIELD_LIMITS.service_detail),
  notes: textField(FIELD_LIMITS.notes, true),
  message: textField(FIELD_LIMITS.message, true),
});

/** Corpo validado: todos os campos presentes, texto limpo ou null. */
export type WebhookLeadPayload = z.output<typeof webhookLeadSchema>;

export type ParsePayloadResult = { ok: true; data: WebhookLeadPayload } | { ok: false; errors: WebhookFieldError[] };

/** Converte os issues do zod em erros por campo (um por campo, em pt-BR). */
export function toFieldErrors(error: z.ZodError): WebhookFieldError[] {
  const seen = new Set<string>();
  const errors: WebhookFieldError[] = [];
  for (const issue of error.issues) {
    const field = issue.path.length ? issue.path.map(String).join(".") : "body";
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, message: issue.message });
  }
  return errors;
}

/** Aplica apelidos e valida o objeto recebido. */
export function parseWebhookPayload(raw: Readonly<Record<string, unknown>>): ParsePayloadResult {
  const result = webhookLeadSchema.safeParse(applyFieldAliases(raw));
  if (!result.success) return { ok: false, errors: toFieldErrors(result.error) };
  return { ok: true, data: result.data };
}

/** O campo isca (oculto no formulário do site) veio preenchido? */
export function isHoneypotFilled(raw: Readonly<Record<string, unknown>>): boolean {
  const value = raw[HONEYPOT_FIELD];
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}
