/**
 * Datas no fuso America/Bahia (GMT-3, sem horário de verão).
 * Regra 6: tudo é armazenado em UTC e exibido em America/Bahia.
 * Todas as funções aceitam ISO string (UTC) ou Date e retornam instantes (Date)
 * ou strings formatadas — nunca dependem do fuso do navegador.
 */
import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatDistanceToNowStrict,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { APP_TIMEZONE } from "@/lib/constants";

export type DateInput = string | Date | number;

/** Converte qualquer entrada para um TZDate no fuso da clínica. */
export function toBahia(input: DateInput): TZDate {
  const d = input instanceof Date ? input : new Date(input);
  return new TZDate(d.getTime(), APP_TIMEZONE);
}

/** "Agora" no fuso da clínica. */
export function nowBahia(): TZDate {
  return TZDate.tz(APP_TIMEZONE);
}

/** dd/MM/yyyy */
export function formatDate(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "—";
  return format(toBahia(input), "dd/MM/yyyy");
}

/** dd/MM/yyyy HH:mm */
export function formatDateTime(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "—";
  return format(toBahia(input), "dd/MM/yyyy HH:mm");
}

/** HH:mm */
export function formatTime(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "—";
  return format(toBahia(input), "HH:mm");
}

/** "ter, 12/03 às 14:30" — útil em listas de agenda */
export function formatAppointment(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "—";
  return format(toBahia(input), "EEE, dd/MM 'às' HH:mm", { locale: ptBR });
}

/** "há 2 horas" */
export function formatRelative(input: DateInput | null | undefined): string {
  if (input == null || input === "") return "—";
  return formatDistanceToNowStrict(new Date(input), { locale: ptBR, addSuffix: true });
}

/** "março de 2026" */
export function formatMonthYear(input: DateInput): string {
  return format(toBahia(input), "MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Data-calendário (yyyy-MM-dd) de um instante, no fuso da clínica.
 * Ex.: lead criado 2026-03-02T01:30Z → "2026-03-01" (22:30 em Barreiras).
 */
export function toDateKey(input: DateInput): string {
  return format(toBahia(input), "yyyy-MM-dd");
}

/** Formata uma coluna DATE do Postgres (yyyy-MM-dd) como dd/MM/yyyy sem conversão de fuso. */
export function formatDateKey(dateKey: string | null | undefined): string {
  if (!dateKey) return "—";
  const [y, m, d] = dateKey.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Converte data (yyyy-MM-dd) + hora (HH:mm) digitadas no fuso da clínica em ISO UTC.
 * Ex.: ("2026-03-10", "14:30") → "2026-03-10T17:30:00.000Z"
 */
export function bahiaLocalToIso(dateKey: string, time = "00:00"): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh || 0, mm || 0, 0, APP_TIMEZONE).getTime()).toISOString();
}

/** Início do dia (00:00 Bahia) de uma data-calendário, como instante UTC. */
export function startOfDateKey(dateKey: string): Date {
  return new Date(bahiaLocalToIso(dateKey, "00:00"));
}

/** Lista de datas-calendário (yyyy-MM-dd) de `from` até `to`, inclusive. */
export function eachDateKey(fromKey: string, toKey: string): string[] {
  const out: string[] = [];
  let cursor = new TZDate(startOfDateKey(fromKey).getTime(), APP_TIMEZONE);
  const end = startOfDateKey(toKey).getTime();
  while (cursor.getTime() <= end) {
    out.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Períodos do dashboard
// -----------------------------------------------------------------------------

export type PeriodKey = "today" | "7d" | "30d" | "month";

export const PERIOD_OPTIONS: ReadonlyArray<{ value: PeriodKey; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Mês atual" },
];

export interface DateRange {
  /** Instante inicial (inclusivo), UTC */
  from: Date;
  /** Instante final (exclusivo), UTC */
  to: Date;
  /** Primeira data-calendário (yyyy-MM-dd), inclusive */
  fromKey: string;
  /** Última data-calendário (yyyy-MM-dd), inclusive */
  toKey: string;
}

export interface PeriodRanges {
  current: DateRange;
  /** Período anterior de mesma duração, para comparação (↑↓%) */
  previous: DateRange;
  label: string;
}

function rangeFromDays(startDay: Date, endDayExclusive: Date): DateRange {
  const start = toBahia(startDay);
  const end = toBahia(endDayExclusive);
  return {
    from: new Date(start.getTime()),
    to: new Date(end.getTime()),
    fromKey: format(start, "yyyy-MM-dd"),
    toKey: format(subDays(end, 1), "yyyy-MM-dd"),
  };
}

/**
 * Intervalos do período selecionado e do período anterior equivalente.
 * - today: hoje × ontem
 * - 7d: últimos 7 dias incluindo hoje × 7 dias antes
 * - 30d: últimos 30 dias incluindo hoje × 30 dias antes
 * - month: do dia 1 até hoje × mesmo intervalo de dias do mês anterior
 */
export function getPeriodRanges(period: PeriodKey, now: DateInput = Date.now()): PeriodRanges {
  const today = startOfDay(toBahia(now));
  const tomorrow = addDays(today, 1);
  const label = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "";

  switch (period) {
    case "today":
      return {
        current: rangeFromDays(today, tomorrow),
        previous: rangeFromDays(subDays(today, 1), today),
        label,
      };
    case "7d": {
      const start = subDays(today, 6);
      return {
        current: rangeFromDays(start, tomorrow),
        previous: rangeFromDays(subDays(start, 7), start),
        label,
      };
    }
    case "30d": {
      const start = subDays(today, 29);
      return {
        current: rangeFromDays(start, tomorrow),
        previous: rangeFromDays(subDays(start, 30), start),
        label,
      };
    }
    case "month": {
      const start = startOfMonth(today);
      const elapsedDays = differenceInCalendarDays(tomorrow, start);
      const prevStart = startOfMonth(addMonths(start, -1));
      const prevMonthEnd = addDays(endOfMonth(prevStart), 1);
      const prevEndCandidate = addDays(prevStart, elapsedDays);
      const prevEnd = prevEndCandidate.getTime() > prevMonthEnd.getTime() ? startOfDay(prevMonthEnd) : prevEndCandidate;
      return {
        current: rangeFromDays(start, tomorrow),
        previous: rangeFromDays(prevStart, prevEnd),
        label,
      };
    }
  }
}

/** Intervalo de um mês inteiro (yyyy-MM) no fuso da clínica. */
export function getMonthRange(monthKey: string): DateRange {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new TZDate(y, m - 1, 1, 0, 0, 0, APP_TIMEZONE);
  const end = startOfMonth(addMonths(start, 1));
  return rangeFromDays(start, end);
}

/** Semana corrente (segunda a domingo) no fuso da clínica. */
export function getCurrentWeekRange(now: DateInput = Date.now()): DateRange {
  const start = startOfWeek(toBahia(now), { weekStartsOn: 1 });
  return rangeFromDays(start, addDays(start, 7));
}

/** Mês corrente (yyyy-MM) no fuso da clínica. */
export function currentMonthKey(now: DateInput = Date.now()): string {
  return format(toBahia(now), "yyyy-MM");
}

/** Data de hoje (yyyy-MM-dd) no fuso da clínica. */
export function todayKey(now: DateInput = Date.now()): string {
  return toDateKey(now);
}
