/**
 * Leitura do corpo com limite de tamanho (sem confiar só no Content-Length) e
 * parse por Content-Type: JSON ou application/x-www-form-urlencoded. text/plain
 * e corpo sem tipo (navigator.sendBeacon) são detectados pelo conteúdo.
 */
import { WEBHOOK_MESSAGES } from "@/features/webhook/lib/constants";

export type ReadBodyResult = { ok: true; text: string } | { ok: false; status: 413 };

/** Lê o corpo em UTF-8, abortando assim que passar de `maxBytes`. */
export async function readBodyText(request: Request, maxBytes: number): Promise<ReadBodyResult> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413 };
  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder("utf-8").decode(bytes) };
}

export type ParseBodyResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: 400 | 415; error: string };

type BodyFormat = "json" | "form" | "sniff" | "unsupported";

function detectFormat(contentType: string | null): BodyFormat {
  const type = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (!type || type === "text/plain") return "sniff";
  if (type === "application/json" || type.endsWith("+json")) return "json";
  if (type === "application/x-www-form-urlencoded") return "form";
  return "unsupported";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string): ParseBodyResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: WEBHOOK_MESSAGES.invalidJson };
  }
  return isPlainObject(data) ? { ok: true, data } : { ok: false, status: 400, error: WEBHOOK_MESSAGES.notAnObject };
}

/** Formulário: a primeira ocorrência não vazia de cada campo vence. */
function parseForm(text: string): ParseBodyResult {
  // sem protótipo: um campo "__proto__" vira só mais uma chave
  const data = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of new URLSearchParams(text)) {
    if (!(key in data) || data[key] === "") data[key] = value;
  }
  return { ok: true, data };
}

export function parseBody(text: string, contentType: string | null): ParseBodyResult {
  const format = detectFormat(contentType);
  if (format === "unsupported") return { ok: false, status: 415, error: WEBHOOK_MESSAGES.unsupportedMediaType };

  const trimmed = text.replace(/^﻿/, "").trim();
  if (!trimmed) return { ok: false, status: 400, error: WEBHOOK_MESSAGES.emptyBody };

  if (format === "json") return parseJson(trimmed);
  if (format === "form") return parseForm(trimmed);
  return /^[[{]/.test(trimmed) ? parseJson(trimmed) : parseForm(trimmed);
}
