/**
 * Apresentação da lista de leads: paginação, destaque de agendamentos e de
 * linhas recém-chegadas. Funções puras (testadas em list-display.test.ts).
 */
import { formatDistanceStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

import { formatAppointment, formatDateTime, formatTime, toDateKey, type DateInput } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import type { Lead, LeadStatus } from "@/types/database";

/** Rota de detalhe do lead. */
export function leadDetailHref(id: string): string {
  return `/leads/${encodeURIComponent(id)}`;
}

/**
 * "há 5 minutos" em relação a `now` (relógio da lista), para que o texto se
 * atualize junto com ele. Datas no futuro (relógio do aparelho atrasado) viram "agora".
 */
export function formatEntryAge(createdAt: string, now: DateInput): string {
  const created = new Date(createdAt);
  const reference = new Date(now);
  if (Number.isNaN(created.getTime()) || Number.isNaN(reference.getTime())) return "—";
  if (reference.getTime() - created.getTime() < 60_000) return "agora mesmo";
  return formatDistanceStrict(created, reference, { locale: ptBR, addSuffix: true });
}

// -----------------------------------------------------------------------------
// Contagem e paginação
// -----------------------------------------------------------------------------

/** "1 lead" · "137 leads" */
export function formatLeadCount(total: number): string {
  return `${formatNumber(total)} ${total === 1 ? "lead" : "leads"}`;
}

/** Descrição do cabeçalho: total geral ou total encontrado com os filtros. */
export function leadsHeaderDescription(total: number, filtered: boolean): string {
  if (filtered) return `${formatLeadCount(total)} ${total === 1 ? "encontrado" : "encontrados"} com os filtros atuais`;
  return `${formatLeadCount(total)} no total`;
}

/** Botão que fecha o painel de filtros no celular: "Ver 37 leads" · "Nenhum lead encontrado". */
export function showResultsLabel(total: number | null | undefined): string {
  if (total == null) return "Ver resultados";
  if (total <= 0) return "Nenhum lead encontrado";
  return `Ver ${formatLeadCount(total)}`;
}

export interface PageRange {
  /** Posição do primeiro item exibido (1-based; 0 se vazio) */
  from: number;
  /** Posição do último item exibido */
  to: number;
  total: number;
}

export function pageRange(page: number, pageSize: number, total: number): PageRange {
  if (total <= 0) return { from: 0, to: 0, total: 0 };
  const from = Math.min((Math.max(1, page) - 1) * pageSize + 1, total);
  return { from, to: Math.min(from + pageSize - 1, total), total };
}

/** "Mostrando 21–40 de 137" */
export function pageRangeLabel(page: number, pageSize: number, total: number): string {
  const range = pageRange(page, pageSize, total);
  if (range.total === 0) return "Nenhum lead";
  return `Mostrando ${formatNumber(range.from)}–${formatNumber(range.to)} de ${formatNumber(range.total)}`;
}

export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Números de página com reticências: sempre a primeira, a última e `siblings`
 * vizinhas da atual. Ex.: (7, 20) → [1, "ellipsis-start", 6, 7, 8, "ellipsis-end", 20].
 * O total de itens é constante (2·siblings + 5) quando há reticências, para os botões não pularem.
 */
export function paginationItems(current: number, pageCount: number, siblings = 1): PaginationItem[] {
  const count = Math.max(1, Math.floor(pageCount));
  const page = Math.min(Math.max(1, Math.floor(current)), count);
  const slots = siblings * 2 + 5;
  if (count <= slots) return Array.from({ length: count }, (_, i) => i + 1);

  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const nearStart = page <= siblings + 3;
  const nearEnd = page >= count - siblings - 2;

  if (nearStart) return [...range(1, slots - 2), "ellipsis-end", count];
  if (nearEnd) return [1, "ellipsis-start", ...range(count - (slots - 3), count)];
  return [1, "ellipsis-start", ...range(page - siblings, page + siblings), "ellipsis-end", count];
}

// -----------------------------------------------------------------------------
// Agendamento
// -----------------------------------------------------------------------------

/** Status em que o agendamento ainda vai acontecer (ou deveria ter acontecido). */
const PENDING_APPOINTMENT: readonly LeadStatus[] = ["agendado", "confirmado"];
/** Status em que a consulta já foi resolvida (compareceu ou faltou). */
const RESOLVED_APPOINTMENT: readonly LeadStatus[] = ["compareceu", "nao_compareceu"];

export type AppointmentTone =
  /** sem agendamento */
  | "none"
  /** consulta futura */
  | "upcoming"
  /** horário passou e o status ainda é agendado/confirmado — precisa de atualização */
  | "overdue"
  /** consulta já resolvida (compareceu / não compareceu) */
  | "past"
  /** agendamento sem efeito (cancelado, perdido ou lead voltou ao início do funil) */
  | "inactive";

export interface AppointmentDisplay {
  tone: AppointmentTone;
  /** Texto exibido: "Hoje, 14:30" · "Amanhã, 09:00" · "terça, 29/09 às 14:30" · "—" */
  label: string;
  /** Data completa (dd/MM/yyyy HH:mm) para tooltip */
  full: string | null;
  /** Consulta pendente para hoje (destaque) */
  isToday: boolean;
}

/** Diferença em dias-calendário (Bahia) entre duas datas yyyy-MM-dd. */
function calendarDayDiff(fromKey: string, toKey: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(toKey) - toUtc(fromKey)) / 86_400_000);
}

/** Estado e texto da coluna "Agendamento" (hoje/amanhã em destaque; atrasado em vermelho). */
export function getAppointmentDisplay(
  lead: Pick<Lead, "status" | "scheduled_at">,
  now: DateInput,
): AppointmentDisplay {
  if (!lead.scheduled_at) return { tone: "none", label: "—", full: null, isToday: false };

  const scheduled = new Date(lead.scheduled_at);
  const nowMs = new Date(now).getTime();
  const full = formatDateTime(scheduled);
  const dayDiff = calendarDayDiff(toDateKey(nowMs), toDateKey(scheduled));
  const sameYear = toDateKey(scheduled).slice(0, 4) === toDateKey(nowMs).slice(0, 4);

  let label: string;
  if (dayDiff === 0) label = `Hoje, ${formatTime(scheduled)}`;
  else if (dayDiff === 1) label = `Amanhã, ${formatTime(scheduled)}`;
  else if (dayDiff === -1) label = `Ontem, ${formatTime(scheduled)}`;
  else label = sameYear ? formatAppointment(scheduled) : full;

  let tone: AppointmentTone;
  if (PENDING_APPOINTMENT.includes(lead.status)) tone = scheduled.getTime() < nowMs ? "overdue" : "upcoming";
  else if (RESOLVED_APPOINTMENT.includes(lead.status)) tone = "past";
  else tone = "inactive";

  return { tone, label, full, isToday: dayDiff === 0 && (tone === "upcoming" || tone === "overdue") };
}

// -----------------------------------------------------------------------------
// Linhas recém-chegadas (Realtime)
// -----------------------------------------------------------------------------

/** Janela em que um lead que aparece na lista é considerado "acabou de chegar". */
export const FRESH_LEAD_WINDOW_MS = 2 * 60_000;

/**
 * Leads que não estavam na versão anterior da mesma página e foram criados há
 * pouco (em relação a `referenceMs`, o instante em que os dados chegaram).
 * Evita destacar linhas que só "subiram" da página seguinte.
 */
export function findFreshLeadIds(
  previousIds: readonly string[],
  rows: ReadonlyArray<Pick<Lead, "id" | "created_at">>,
  referenceMs: number,
  windowMs = FRESH_LEAD_WINDOW_MS,
): string[] {
  const seen = new Set(previousIds);
  return rows
    .filter((row) => {
      if (seen.has(row.id)) return false;
      const created = new Date(row.created_at).getTime();
      return Number.isFinite(created) && referenceMs - created <= windowMs;
    })
    .map((row) => row.id);
}

/**
 * Dos leads marcados como recém-chegados, os que ainda estão dentro da janela
 * em relação ao relógio da lista — o selo "agora" some sozinho depois de alguns minutos.
 */
export function recentFreshIds(
  freshIds: ReadonlySet<string>,
  rows: ReadonlyArray<Pick<Lead, "id" | "created_at">>,
  nowMs: number,
  windowMs = FRESH_LEAD_WINDOW_MS,
): ReadonlySet<string> {
  if (freshIds.size === 0) return freshIds;
  const recent = rows.filter((row) => {
    if (!freshIds.has(row.id)) return false;
    const created = new Date(row.created_at).getTime();
    return Number.isFinite(created) && nowMs - created <= windowMs;
  });
  return recent.length === freshIds.size ? freshIds : new Set(recent.map((row) => row.id));
}
