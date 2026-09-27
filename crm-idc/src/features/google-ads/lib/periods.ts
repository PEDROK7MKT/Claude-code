/**
 * Períodos da página Google Ads (filtro do cabeçalho). Tudo em datas-calendário
 * yyyy-MM-dd (fuso America/Bahia): a aritmética é feita em UTC puro, sem depender
 * do fuso do navegador. Funções puras.
 */
import type { DateKeyRange } from "@/components/shared/date-time-picker";
import { startOfDateKey } from "@/lib/dates";
import { filterByCreatedAt } from "@/lib/metrics";
import type { Lead } from "@/types/database";

export type AdsPeriodPreset = "7d" | "30d" | "90d" | "month" | "last_month" | "all";
/** Preset escolhido ou "custom" (intervalo livre no calendário). */
export type AdsPeriodSelection = AdsPeriodPreset | "custom";

export const ADS_PERIOD_OPTIONS: ReadonlyArray<{ value: AdsPeriodPreset; label: string }> = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "month", label: "Mês atual" },
  { value: "last_month", label: "Mês anterior" },
  { value: "all", label: "Todo o período" },
];

export const DEFAULT_ADS_PERIOD: AdsPeriodPreset = "30d";

const DAY_MS = 86_400_000;

function keyToUtc(key: string): number {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Soma `days` dias a uma data-calendário ("2026-02-28" + 1 → "2026-03-01"). */
export function addDaysToKey(key: string, days: number): string {
  return utcToKey(keyToUtc(key) + days * DAY_MS);
}

/** Quantidade de dias do intervalo, contando as duas pontas. */
export function rangeLength(range: DateKeyRange): number {
  return Math.round((keyToUtc(range.to) - keyToUtc(range.from)) / DAY_MS) + 1;
}

/** Último dia do mês de `key`. */
function endOfMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return utcToKey(Date.UTC(y, m, 0));
}

/** Primeiro dia do mês de `key` deslocado `offset` meses. */
function monthStartKey(key: string, offset = 0): string {
  const [y, m] = key.split("-").map(Number);
  return utcToKey(Date.UTC(y, m - 1 + offset, 1));
}

export function isKeyInRange(key: string, range: DateKeyRange): boolean {
  const k = key.slice(0, 10);
  return k >= range.from && k <= range.to;
}

/**
 * Intervalo de um preset. `earliestKey` = primeira data com métrica lançada
 * (usado por "Todo o período"; sem métricas cai nos últimos 30 dias).
 */
export function presetRange(preset: AdsPeriodPreset, today: string, earliestKey?: string | null): DateKeyRange {
  switch (preset) {
    case "7d":
      return { from: addDaysToKey(today, -6), to: today };
    case "30d":
      return { from: addDaysToKey(today, -29), to: today };
    case "90d":
      return { from: addDaysToKey(today, -89), to: today };
    case "month":
      return { from: monthStartKey(today), to: today };
    case "last_month": {
      const from = monthStartKey(today, -1);
      return { from, to: endOfMonthKey(from) };
    }
    case "all":
      return earliestKey && earliestKey < today
        ? { from: earliestKey.slice(0, 10), to: today }
        : { from: addDaysToKey(today, -29), to: today };
  }
}

/**
 * Período anterior para comparação (↑↓%):
 * - month: mesmos dias do mês anterior (1 → dia de hoje, limitado ao fim do mês)
 * - last_month: o mês inteiro antes dele
 * - all: sem comparação (null)
 * - demais/custom: mesma duração imediatamente antes
 */
export function previousRange(range: DateKeyRange, selection: AdsPeriodSelection): DateKeyRange | null {
  if (selection === "all") return null;
  if (selection === "month" || selection === "last_month") {
    const from = monthStartKey(range.from, -1);
    const monthEnd = endOfMonthKey(from);
    if (selection === "last_month") return { from, to: monthEnd };
    const sameDay = addDaysToKey(from, rangeLength(range) - 1);
    return { from, to: sameDay < monthEnd ? sameDay : monthEnd };
  }
  const length = rangeLength(range);
  return { from: addDaysToKey(range.from, -length), to: addDaysToKey(range.from, -1) };
}

/** Instantes UTC [início, fim) do intervalo no fuso da clínica — para `useLeads`. */
export function rangeToLeadWindow(range: DateKeyRange): { createdFrom: string; createdTo: string } {
  return {
    createdFrom: startOfDateKey(range.from).toISOString(),
    createdTo: startOfDateKey(addDaysToKey(range.to, 1)).toISOString(),
  };
}

/** Leads criados dentro do intervalo (dias no fuso America/Bahia). */
export function leadsInRange<T extends Pick<Lead, "created_at">>(leads: readonly T[], range: DateKeyRange): T[] {
  const { createdFrom, createdTo } = rangeToLeadWindow(range);
  return filterByCreatedAt(leads, createdFrom, createdTo);
}

/** Linhas de métrica (coluna DATE) dentro do intervalo. */
export function metricsInRange<T extends { date: string }>(metrics: readonly T[], range: DateKeyRange): T[] {
  return metrics.filter((m) => isKeyInRange(m.date, range));
}

/** Menor data (yyyy-MM-dd) entre as métricas, ou null. */
export function earliestMetricKey(metrics: ReadonlyArray<{ date: string }>): string | null {
  let min: string | null = null;
  for (const m of metrics) {
    const key = m.date.slice(0, 10);
    if (min === null || key < min) min = key;
  }
  return min;
}
