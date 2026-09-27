/**
 * Período do dashboard do admin (spec §4.2): valor na URL (?periodo=today|7d|30d|month),
 * rótulos do seletor e textos de comparação. Funções puras.
 */
import { formatDateKey, PERIOD_OPTIONS, type DateRange, type PeriodKey } from "@/lib/dates";

export const PERIOD_PARAM = "periodo";
export const DEFAULT_PERIOD: PeriodKey = "30d";

const PERIOD_KEYS: readonly string[] = PERIOD_OPTIONS.map((option) => option.value);

export function isPeriodKey(value: unknown): value is PeriodKey {
  return typeof value === "string" && PERIOD_KEYS.includes(value);
}

/** `?periodo=` (ausente, repetido ou inválido) → período válido; padrão "30d". */
export function parsePeriodParam(value: string | readonly string[] | null | undefined): PeriodKey {
  const raw = typeof value === "string" ? value : value?.[0];
  const normalized = raw?.trim().toLowerCase();
  return isPeriodKey(normalized) ? normalized : DEFAULT_PERIOD;
}

export interface PeriodChoice {
  value: PeriodKey;
  /** Rótulo curto do seletor ("7 dias") */
  label: string;
  /** Rótulo completo ("Últimos 7 dias") */
  longLabel: string;
}

const SHORT_LABEL: Record<PeriodKey, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  month: "Mês atual",
};

export const PERIOD_CHOICES: readonly PeriodChoice[] = PERIOD_OPTIONS.map((option) => ({
  value: option.value,
  label: SHORT_LABEL[option.value],
  longLabel: option.label,
}));

/**
 * Query string com o período, preservando os demais parâmetros.
 * O período é sempre gravado explicitamente (inclusive o padrão) para que
 * voltar/avançar no histórico reflita exatamente o que estava na tela.
 */
export function buildPeriodSearch(currentSearch: string, period: PeriodKey): string {
  const params = new URLSearchParams(currentSearch);
  params.set(PERIOD_PARAM, period);
  return `?${params.toString()}`;
}

/** Texto curto da comparação exibido nos cards de KPI. */
export function comparisonLabel(period: PeriodKey): string {
  switch (period) {
    case "today":
      return "vs ontem";
    case "7d":
      return "vs 7 dias anteriores";
    case "30d":
      return "vs 30 dias anteriores";
    case "month":
      return "vs mesmo período do mês anterior";
  }
}

/** "27/09/2026" · "21/09 – 27/09/2026" · "29/12/2025 – 04/01/2026" */
export function formatRangeLabel(range: Pick<DateRange, "fromKey" | "toKey">): string {
  const { fromKey, toKey } = range;
  if (fromKey === toKey) return formatDateKey(fromKey);
  if (fromKey.slice(0, 4) !== toKey.slice(0, 4)) return `${formatDateKey(fromKey)} – ${formatDateKey(toKey)}`;
  return `${formatDateKey(fromKey).slice(0, 5)} – ${formatDateKey(toKey)}`;
}
