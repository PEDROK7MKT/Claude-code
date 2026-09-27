import { APP_LOCALE, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/constants";

const currencyFmt = new Intl.NumberFormat(APP_LOCALE, { style: "currency", currency: "BRL" });
const numberFmt = new Intl.NumberFormat(APP_LOCALE);
const decimalFmt = new Intl.NumberFormat(APP_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** R$ 1.234,56 — retorna "—" para null/NaN/Infinity (ex.: divisão por zero). */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return currencyFmt.format(value);
}

/** 1.234 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return numberFmt.format(value);
}

/** 4,9 */
export function formatDecimal(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return decimalFmt.format(value);
}

/** 12,5% — `value` já em pontos percentuais (12.5), não fração. */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString(APP_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: digits })}%`;
}

/** Divisão segura: retorna null quando o divisor é 0. */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

/** Variação percentual entre períodos (null se não houver base de comparação). */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/**
 * Converte número em formato brasileiro ou internacional para number.
 * "1.234,56" → 1234.56 · "1234.56" → 1234.56 · "R$ 12,00" → 12 · "1,234.56" → 1234.56
 */
export function parseBRNumber(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = input.replace(/[R$\s%]/g, "").trim();
  if (!s || s === "-" || s === "--") return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // o separador que aparece por último é o decimal
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1) {
    // "1.234" (milhar pt-BR) vs "12.5" (decimal): 3 dígitos após o ponto único → milhar
    // (exceto "0.123"/"-0.500": zero à esquerda não é grupo de milhar)
    const parts = s.split(".");
    const intPart = parts[0].replace(/^[-+]/, "");
    if (
      parts.length > 2 ||
      (parts.length === 2 && parts[1].length === 3 && intPart.length >= 1 && intPart.length <= 3 && intPart !== "0")
    ) {
      s = s.replace(/\./g, "");
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// -----------------------------------------------------------------------------
// Texto (busca e comparação)
// -----------------------------------------------------------------------------

/** Minúsculas e sem acentos: "JOSÉ Antônio" → "jose antonio" (busca e comparação de nomes). */
export function foldText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Minúsculo, sem acento, separadores viram "_": "Implante Dentário" → "implante_dentario". */
export function slugify(value: string): string {
  return foldText(value)
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// -----------------------------------------------------------------------------
// Telefone (Brasil)
// -----------------------------------------------------------------------------

/**
 * Normaliza telefone para só dígitos com DDD, sem +55 (10 ou 11 dígitos).
 * "(77) 98765-4321" → "77987654321" · "+55 77 98765-4321" → "77987654321"
 * Retorna null se não for um telefone brasileiro válido.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length === 11 || digits.length === 12) {
    // prefixo de operadora/0 à frente: "0 77 98765-4321"
    if (digits.startsWith("0")) digits = digits.slice(1);
  }
  if (digits.length !== 10 && digits.length !== 11) return null;
  if (digits.startsWith("0")) return null;
  return digits;
}

/**
 * Dígitos para buscar no telefone quando o termo parece um (null caso contrário) — mesma
 * regra na lista de leads (/leads) e no kanban. Número completo em qualquer formato aceito
 * no cadastro ("(077) 98765-4321", "+55 77…", "0 77…") vira os 10/11 dígitos salvos;
 * parcial só perde o "55" do país.
 */
export function searchPhoneDigits(term: string): string | null {
  if (!/^[\d\s()+.-]+$/.test(term)) return null;
  const full = normalizePhone(term);
  if (full) return full;
  let digits = term.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("55")) digits = digits.slice(2);
  return digits.length >= 2 ? digits : null;
}

/** "77987654321" → "(77) 98765-4321" · "7736112233" → "(77) 3611-2233" */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

/** Máscara progressiva para inputs de telefone. */
export function maskPhoneInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Primeiro nome, para mensagens. */
export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/**
 * Link do WhatsApp: https://wa.me/55{phone}?text=...
 * `template` aceita {nome} (primeiro nome do lead).
 */
export function whatsappUrl(phone: string, leadName?: string | null, template: string = DEFAULT_WHATSAPP_MESSAGE): string {
  const digits = normalizePhone(phone) ?? phone.replace(/\D/g, "");
  // sem nome: "Olá {nome}! ..." → "Olá! ..." (remove espaço antes de pontuação)
  const text = template
    .replaceAll("{nome}", firstName(leadName) || "")
    .replace(/[ \t]+([!?,.;:])/g, "$1")
    .trim();
  return `https://wa.me/55${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Iniciais para avatar: "Décio Carrilho" → "DC" */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
