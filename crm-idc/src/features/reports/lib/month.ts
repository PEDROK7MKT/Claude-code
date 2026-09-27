/**
 * Mês do relatório (yyyy-MM): validação do parâmetro ?mes=, navegação entre meses
 * e rótulos em pt-BR. Funções puras — "hoje" sempre chega como parâmetro.
 */
import { formatMonthYear, getMonthRange } from "@/lib/dates";

/** Parâmetro da URL com o mês do relatório: /relatorios?mes=2026-03 */
export const MONTH_PARAM = "mes";

/** Quantidade de meses oferecidos no seletor (mês atual + 23 anteriores). */
export const MONTH_OPTIONS_COUNT = 24;

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MIN_YEAR = 2000;

export interface MonthOption {
  /** yyyy-MM */
  value: string;
  /** "Março de 2026" */
  label: string;
}

/** "2026-03" é um mês válido (formato e faixa de ano). */
export function isMonthKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = MONTH_KEY.exec(value);
  return match !== null && Number(match[1]) >= MIN_YEAR;
}

/** Soma `delta` meses: ("2026-01", -1) → "2025-12". */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  const y = Math.floor(index / 12);
  const m = index - y * 12 + 1;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`;
}

/**
 * Valida o parâmetro ?mes= (string ou array do searchParams do Next).
 * Retorna null se ausente, malformado ou no futuro em relação a `currentMonth`.
 */
export function parseMonthParam(value: string | string[] | null | undefined, currentMonth: string): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (!isMonthKey(key)) return null;
  return key > currentMonth ? null : key;
}

/** Mês a exibir: o do parâmetro (se válido) ou o mês atual. */
export function resolveMonthKey(value: string | string[] | null | undefined, currentMonth: string): string {
  return parseMonthParam(value, currentMonth) ?? currentMonth;
}

/** "março de 2026" */
export function monthLabel(monthKey: string): string {
  return formatMonthYear(getMonthRange(monthKey).from);
}

/** "março" */
export function monthName(monthKey: string): string {
  return monthLabel(monthKey).split(" de ")[0];
}

/** Primeira letra maiúscula ("março de 2026" → "Março de 2026"). */
export function capitalize(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1) : text;
}

/**
 * Opções do seletor: do mês atual para trás (`count` meses). Se o mês selecionado
 * estiver fora da janela (link antigo), ele entra na lista na posição cronológica.
 */
export function recentMonthOptions(
  currentMonth: string,
  selected?: string | null,
  count = MONTH_OPTIONS_COUNT,
): MonthOption[] {
  const keys = Array.from({ length: Math.max(1, count) }, (_, i) => shiftMonth(currentMonth, -i));
  if (selected && isMonthKey(selected) && selected <= currentMonth && !keys.includes(selected)) {
    keys.push(selected);
    keys.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  }
  return keys.map((value) => ({ value, label: capitalize(monthLabel(value)) }));
}

/** Meses vizinhos para as setas (null = seta desabilitada). */
export function monthNavigation(
  monthKey: string,
  currentMonth: string,
  count = MONTH_OPTIONS_COUNT,
): { previous: string | null; next: string | null } {
  const oldest = shiftMonth(currentMonth, -(Math.max(1, count) - 1));
  return {
    previous: monthKey > oldest ? shiftMonth(monthKey, -1) : null,
    next: monthKey < currentMonth ? shiftMonth(monthKey, 1) : null,
  };
}
