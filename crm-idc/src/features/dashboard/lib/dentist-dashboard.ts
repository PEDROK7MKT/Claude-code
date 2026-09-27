/**
 * Cálculos puros do dashboard simplificado do dentista (spec §4.2):
 * leads novos hoje × ontem, agenda da semana agrupada por dia, comparecimento
 * do mês e fila de leads aguardando resposta. Datas no fuso America/Bahia.
 */
import {
  currentMonthKey,
  getCurrentWeekRange,
  getMonthRange,
  getPeriodRanges,
  toDateKey,
  type DateInput,
  type DateRange,
} from "@/lib/dates";
import { percentChange } from "@/lib/format";
import { appointmentsInRange, attendanceRate, filterByCreatedAt } from "@/lib/metrics";
import type { Lead, LeadStatus } from "@/types/database";
import { weekdayHeading } from "./labels";

function toTime(input: DateInput): number {
  return input instanceof Date ? input.getTime() : new Date(input).getTime();
}

// -----------------------------------------------------------------------------
// Intervalos
// -----------------------------------------------------------------------------

export interface DentistDashboardRanges {
  today: DateRange;
  yesterday: DateRange;
  /** Semana corrente, segunda a domingo */
  week: DateRange;
  /** Mês corrente inteiro (inclui consultas futuras) */
  month: DateRange;
  /** Leads criados de ontem 00:00 até amanhã 00:00 */
  recentQuery: { createdFrom: string; createdTo: string };
  /** Consultas da semana e do mês numa única consulta (a semana pode cruzar meses) */
  appointmentsQuery: { scheduledFrom: string; scheduledTo: string };
}

export function getDentistDashboardRanges(now: DateInput = Date.now()): DentistDashboardRanges {
  const { current: today, previous: yesterday } = getPeriodRanges("today", now);
  const week = getCurrentWeekRange(now);
  const month = getMonthRange(currentMonthKey(now));
  const from = Math.min(week.from.getTime(), month.from.getTime());
  const to = Math.max(week.to.getTime(), month.to.getTime());
  return {
    today,
    yesterday,
    week,
    month,
    recentQuery: { createdFrom: yesterday.from.toISOString(), createdTo: today.to.toISOString() },
    appointmentsQuery: { scheduledFrom: new Date(from).toISOString(), scheduledTo: new Date(to).toISOString() },
  };
}

// -----------------------------------------------------------------------------
// Leads novos hoje
// -----------------------------------------------------------------------------

export interface NewLeadsSummary {
  today: number;
  yesterday: number;
  /** Variação % vs ontem (null sem base) */
  change: number | null;
  /** Dos leads de hoje, quantos ainda estão em "novo" */
  stillNew: number;
}

export function summarizeNewLeads(
  leads: ReadonlyArray<Pick<Lead, "created_at" | "status">>,
  ranges: Pick<DentistDashboardRanges, "today" | "yesterday">,
): NewLeadsSummary {
  const today = filterByCreatedAt(leads, ranges.today.from, ranges.today.to);
  const yesterday = filterByCreatedAt(leads, ranges.yesterday.from, ranges.yesterday.to);
  return {
    today: today.length,
    yesterday: yesterday.length,
    change: percentChange(today.length, yesterday.length),
    stillNew: today.filter((lead) => lead.status === "novo").length,
  };
}

// -----------------------------------------------------------------------------
// Agendamentos da semana
// -----------------------------------------------------------------------------

/** Consultas ainda por acontecer/registrar exibidas na agenda da semana. */
export const WEEK_APPOINTMENT_STATUSES: readonly LeadStatus[] = ["agendado", "confirmado"];

export interface AppointmentDay<T> {
  dateKey: string;
  /** "Segunda, 22/09" */
  heading: string;
  isToday: boolean;
  isPast: boolean;
  items: T[];
}

/** Consultas da semana agrupadas por dia (Bahia), em ordem cronológica; dias vazios omitidos. */
export function groupAppointmentsByDay<T extends Pick<Lead, "scheduled_at" | "status">>(
  leads: readonly T[],
  week: Pick<DateRange, "from" | "to">,
  now: DateInput = Date.now(),
  statuses: readonly LeadStatus[] = WEEK_APPOINTMENT_STATUSES,
): AppointmentDay<T>[] {
  const today = toDateKey(now);
  const days = new Map<string, AppointmentDay<T>>();
  for (const lead of appointmentsInRange(leads, week.from, week.to, statuses)) {
    const dateKey = toDateKey(lead.scheduled_at as string);
    let day = days.get(dateKey);
    if (!day) {
      day = { dateKey, heading: weekdayHeading(dateKey), isToday: dateKey === today, isPast: dateKey < today, items: [] };
      days.set(dateKey, day);
    }
    day.items.push(lead);
  }
  return [...days.values()];
}

/** Consulta cujo horário já passou e ainda não teve comparecimento registrado. */
export function isAwaitingAttendance(lead: Pick<Lead, "scheduled_at" | "status">, now: DateInput = Date.now()): boolean {
  if (!lead.scheduled_at) return false;
  if (lead.status !== "agendado" && lead.status !== "confirmado") return false;
  return new Date(lead.scheduled_at).getTime() < toTime(now);
}

// -----------------------------------------------------------------------------
// Taxa de comparecimento do mês
// -----------------------------------------------------------------------------

export interface AttendanceSummary {
  attended: number;
  missed: number;
  /** Horário já passou, comparecimento ainda não registrado */
  awaiting: number;
  /** Consultas futuras do mês */
  upcoming: number;
  /** compareceu / (compareceu + não compareceu) × 100 — null sem consultas finalizadas */
  rate: number | null;
  /** Consultas válidas do mês (agendado, confirmado, compareceu, não compareceu) */
  total: number;
}

export function summarizeAttendance(
  leads: ReadonlyArray<Pick<Lead, "scheduled_at" | "status">>,
  month: Pick<DateRange, "from" | "to">,
  now: DateInput = Date.now(),
): AttendanceSummary {
  const appointments = appointmentsInRange(leads, month.from, month.to);
  let attended = 0;
  let missed = 0;
  let awaiting = 0;
  let upcoming = 0;
  for (const lead of appointments) {
    if (lead.status === "compareceu") attended++;
    else if (lead.status === "nao_compareceu") missed++;
    else if (isAwaitingAttendance(lead, now)) awaiting++;
    else upcoming++;
  }
  return { attended, missed, awaiting, upcoming, rate: attendanceRate(appointments), total: appointments.length };
}

export type AttendanceLevel = "good" | "fair" | "poor" | "none";

/** Faixa da taxa para a cor do anel: ≥ 80% boa, ≥ 60% regular, abaixo disso ruim. */
export function attendanceLevel(rate: number | null): AttendanceLevel {
  if (rate === null || !Number.isFinite(rate)) return "none";
  if (rate >= 80) return "good";
  if (rate >= 60) return "fair";
  return "poor";
}

// -----------------------------------------------------------------------------
// Leads aguardando resposta
// -----------------------------------------------------------------------------

export const WAITING_WARNING_MS = 2 * 60 * 60 * 1000;
export const WAITING_CRITICAL_MS = 24 * 60 * 60 * 1000;

export type WaitingLevel = "ok" | "warning" | "critical";

/** Há quanto tempo o lead espera: > 2 h âmbar, > 24 h vermelho. */
export function waitingLevel(createdAt: DateInput, now: DateInput = Date.now()): WaitingLevel {
  const elapsed = toTime(now) - toTime(createdAt);
  if (elapsed > WAITING_CRITICAL_MS) return "critical";
  if (elapsed > WAITING_WARNING_MS) return "warning";
  return "ok";
}

/** Leads em "novo", do que espera há mais tempo para o mais recente. */
export function sortWaitingLeads<T extends Pick<Lead, "id" | "status" | "created_at">>(leads: readonly T[]): T[] {
  return leads
    .filter((lead) => lead.status === "novo")
    .sort((a, b) => toTime(a.created_at) - toTime(b.created_at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function countWaitingByLevel(
  leads: ReadonlyArray<Pick<Lead, "created_at">>,
  now: DateInput = Date.now(),
): Record<WaitingLevel, number> {
  const counts: Record<WaitingLevel, number> = { ok: 0, warning: 0, critical: 0 };
  for (const lead of leads) counts[waitingLevel(lead.created_at, now)]++;
  return counts;
}
