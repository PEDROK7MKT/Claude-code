/**
 * Períodos do GMN (colunas DATE yyyy-MM-dd): atalhos "Semana passada"/"Mês passado",
 * sobreposição com registros existentes e rótulos. Funções puras — a data de hoje
 * vem de todayKey() (fuso America/Bahia); o restante é aritmética de calendário.
 */
import { formatDateKey, todayKey, type DateInput } from "@/lib/dates";

/** Intervalo de datas-calendário, ambos inclusivos (mesmo formato do DateRangePicker). */
export interface PeriodRange {
  from: string;
  to: string;
}

/** Linha mínima de um registro do GMN para as funções de período. */
export interface PeriodRow {
  id: string;
  period_start: string;
  period_end: string;
}

export type PeriodPreset = "last-week" | "last-month" | "custom";

export const PERIOD_PRESETS: ReadonlyArray<{ value: PeriodPreset; label: string }> = [
  { value: "last-week", label: "Semana passada" },
  { value: "last-month", label: "Mês passado" },
  { value: "custom", label: "Personalizado" },
];

const DAY_MS = 86_400_000;

function keyToUtc(key: string): number {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Soma `days` dias a uma data-calendário (sem fuso envolvido). */
export function addDaysToKey(key: string, days: number): string {
  return utcToKey(keyToUtc(key) + days * DAY_MS);
}

/** Quantidade de dias do período, contando início e fim. */
export function periodLengthDays(start: string, end: string): number {
  return Math.round((keyToUtc(end) - keyToUtc(start)) / DAY_MS) + 1;
}

/** Semana anterior completa, de segunda a domingo. */
export function lastWeekRange(now: DateInput = Date.now()): PeriodRange {
  const today = todayKey(now);
  const weekday = new Date(keyToUtc(today)).getUTCDay(); // 0 = domingo
  const thisMonday = addDaysToKey(today, -((weekday + 6) % 7));
  return { from: addDaysToKey(thisMonday, -7), to: addDaysToKey(thisMonday, -1) };
}

/** Mês anterior completo (do dia 1 ao último dia). */
export function lastMonthRange(now: DateInput = Date.now()): PeriodRange {
  const [y, m] = todayKey(now).split("-").map(Number);
  const firstOfThisMonth = Date.UTC(y, m - 1, 1);
  const lastOfPrevMonth = firstOfThisMonth - DAY_MS;
  const prev = new Date(lastOfPrevMonth);
  return {
    from: utcToKey(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), 1)),
    to: utcToKey(lastOfPrevMonth),
  };
}

export function presetRange(preset: Exclude<PeriodPreset, "custom">, now: DateInput = Date.now()): PeriodRange {
  return preset === "last-week" ? lastWeekRange(now) : lastMonthRange(now);
}

/** Qual atalho corresponde ao intervalo (ou "custom"). */
export function detectPreset(range: PeriodRange | null | undefined, now: DateInput = Date.now()): PeriodPreset | null {
  if (!range) return null;
  const week = lastWeekRange(now);
  if (range.from === week.from && range.to === week.to) return "last-week";
  const month = lastMonthRange(now);
  if (range.from === month.from && range.to === month.to) return "last-month";
  return "custom";
}

/** Dois intervalos inclusivos compartilham ao menos um dia? */
export function rangesOverlap(a: PeriodRange, b: PeriodRange): boolean {
  return a.from <= b.to && b.from <= a.to;
}

function rowRange(row: PeriodRow): PeriodRange {
  return { from: row.period_start, to: row.period_end };
}

/** Registros que se sobrepõem ao período (ignorando o registro em edição). */
export function findOverlappingPeriods<T extends PeriodRow>(
  range: PeriodRange,
  rows: readonly T[],
  excludeId?: string | null,
): T[] {
  return rows.filter((row) => row.id !== excludeId && rangesOverlap(range, rowRange(row)));
}

/** Registro com exatamente o mesmo período (ignorando o registro em edição). */
export function findExactPeriod<T extends PeriodRow>(
  range: PeriodRange,
  rows: readonly T[],
  excludeId?: string | null,
): T | null {
  return rows.find((row) => row.id !== excludeId && row.period_start === range.from && row.period_end === range.to) ?? null;
}

/** Registro mais recente que termina antes do início do período (base para "avaliações novas"). */
export function findPreviousRow<T extends PeriodRow>(
  range: PeriodRange,
  rows: readonly T[],
  excludeId?: string | null,
): T | null {
  let best: T | null = null;
  for (const row of rows) {
    if (row.id === excludeId || row.period_end >= range.from) continue;
    if (!best || row.period_end > best.period_end || (row.period_end === best.period_end && row.period_start > best.period_start)) {
      best = row;
    }
  }
  return best;
}

/**
 * Período sugerido ao abrir o formulário: segue a periodicidade do último registro
 * (semanal → semana passada; senão mês passado). Null se esse período já foi registrado.
 */
export function suggestDefaultPeriod(rows: readonly PeriodRow[], now: DateInput = Date.now()): PeriodRange | null {
  const latest = rows.reduce<PeriodRow | null>((acc, row) => (!acc || row.period_end > acc.period_end ? row : acc), null);
  const weekly = latest ? periodLengthDays(latest.period_start, latest.period_end) <= 10 : false;
  const range = weekly ? lastWeekRange(now) : lastMonthRange(now);
  return findExactPeriod(range, rows) ? null : range;
}

/** "01/08/2026 – 31/08/2026" (ou só a data quando início = fim). */
export function formatPeriod(start: string, end: string): string {
  return start === end ? formatDateKey(start) : `${formatDateKey(start)} – ${formatDateKey(end)}`;
}

/** Versão curta para espaços estreitos: "01/08 – 31/08/2026" (mesmo ano) */
export function formatPeriodShort(start: string, end: string): string {
  if (start === end) return formatDateKey(start);
  if (start.slice(0, 4) !== end.slice(0, 4)) return formatPeriod(start, end);
  return `${formatDateKey(start).slice(0, 5)} – ${formatDateKey(end)}`;
}
