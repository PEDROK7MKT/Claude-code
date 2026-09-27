/**
 * Tabela de leads do relatório: ordenação por coluna, paginação no cliente
 * e linha de totais. Funções puras.
 */
import { LEAD_STATUSES, SCHEDULED_STATUSES, SERVICE_LABEL, SOURCE_LABEL } from "@/lib/constants";
import { APPOINTMENT_STATUSES } from "@/lib/metrics";
import type { Lead, LeadStatus } from "@/types/database";

export type ReportSortKey = "name" | "source" | "service" | "status" | "created_at" | "scheduled_at";
export type SortDirection = "asc" | "desc";

export interface ReportSort {
  key: ReportSortKey;
  dir: SortDirection;
}

export const DEFAULT_REPORT_SORT: ReportSort = { key: "created_at", dir: "desc" };

export const REPORT_SORT_LABEL: Record<ReportSortKey, string> = {
  name: "Nome",
  source: "Fonte",
  service: "Serviço",
  status: "Status",
  created_at: "Entrada",
  scheduled_at: "Agendamento",
};

/** Direção inicial ao clicar numa coluna: datas começam da mais recente, textos de A a Z. */
export const INITIAL_SORT_DIR: Record<ReportSortKey, SortDirection> = {
  name: "asc",
  source: "asc",
  service: "asc",
  status: "asc",
  created_at: "desc",
  scheduled_at: "desc",
};

export type ReportTableLead = Pick<
  Lead,
  "id" | "name" | "source" | "service" | "status" | "created_at" | "scheduled_at"
>;

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });
const STATUS_ORDER = new Map<LeadStatus, number>(LEAD_STATUSES.map((s, i) => [s, i]));

function time(value: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Compara pela coluna; retorna null quando algum lado é vazio (vazios ficam sempre no fim). */
function compareBy(a: ReportTableLead, b: ReportTableLead, key: ReportSortKey): number | null {
  switch (key) {
    case "name":
      return collator.compare(a.name.trim(), b.name.trim());
    case "source":
      return collator.compare(SOURCE_LABEL[a.source] ?? a.source, SOURCE_LABEL[b.source] ?? b.source);
    case "service":
      if (!a.service || !b.service) return null;
      return collator.compare(SERVICE_LABEL[a.service] ?? a.service, SERVICE_LABEL[b.service] ?? b.service);
    case "status":
      return (STATUS_ORDER.get(a.status) ?? 99) - (STATUS_ORDER.get(b.status) ?? 99);
    case "created_at":
    case "scheduled_at": {
      const ta = time(a[key]);
      const tb = time(b[key]);
      if (ta === null || tb === null) return null;
      return ta - tb;
    }
  }
}

function isEmpty(lead: ReportTableLead, key: ReportSortKey): boolean {
  if (key === "service") return !lead.service;
  if (key === "scheduled_at") return time(lead.scheduled_at) === null;
  return false;
}

/**
 * Ordena sem alterar o array original. Valores vazios (sem serviço, sem agendamento)
 * ficam sempre no fim; empates caem na data de entrada mais recente e no id.
 */
export function sortReportLeads<T extends ReportTableLead>(leads: readonly T[], sort: ReportSort): T[] {
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...leads].sort((a, b) => {
    const emptyA = isEmpty(a, sort.key);
    const emptyB = isEmpty(b, sort.key);
    if (emptyA !== emptyB) return emptyA ? 1 : -1;
    const primary = emptyA ? 0 : (compareBy(a, b, sort.key) ?? 0);
    if (primary !== 0) return primary * factor;
    const created = (time(b.created_at) ?? 0) - (time(a.created_at) ?? 0);
    if (created !== 0) return created;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Próxima ordenação ao clicar no cabeçalho: mesma coluna inverte; outra coluna usa a direção inicial. */
export function toggleSort(current: ReportSort, key: ReportSortKey): ReportSort {
  if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key, dir: INITIAL_SORT_DIR[key] };
}

export interface Page<T> {
  rows: T[];
  /** 1-based, limitada ao total de páginas */
  page: number;
  pageCount: number;
  /** Índice (1-based) do primeiro e do último item exibidos */
  from: number;
  to: number;
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * size;
  const rows = items.slice(start, start + size);
  return {
    rows,
    page: current,
    pageCount,
    from: rows.length ? start + 1 : 0,
    to: start + rows.length,
  };
}

export interface ReportTableTotals {
  leads: number;
  /** agendado, confirmado ou compareceu */
  scheduled: number;
  attended: number;
  /** Consultas com data (agendado, confirmado, compareceu, não compareceu) */
  withAppointment: number;
  sources: number;
  services: number;
  googleAds: number;
}

const SCHEDULED = new Set<LeadStatus>(SCHEDULED_STATUSES);
const APPOINTMENT = new Set<LeadStatus>(APPOINTMENT_STATUSES);

export function reportTableTotals(
  leads: ReadonlyArray<Pick<Lead, "status" | "source" | "service" | "scheduled_at">>,
): ReportTableTotals {
  const sources = new Set<string>();
  const services = new Set<string>();
  const totals: ReportTableTotals = {
    leads: leads.length,
    scheduled: 0,
    attended: 0,
    withAppointment: 0,
    sources: 0,
    services: 0,
    googleAds: 0,
  };
  for (const lead of leads) {
    if (SCHEDULED.has(lead.status)) totals.scheduled++;
    if (lead.status === "compareceu") totals.attended++;
    if (lead.scheduled_at && APPOINTMENT.has(lead.status)) totals.withAppointment++;
    if (lead.source === "google_ads") totals.googleAds++;
    sources.add(lead.source);
    if (lead.service) services.add(lead.service);
  }
  totals.sources = sources.size;
  totals.services = services.size;
  return totals;
}

/** Consulta que não vale mais (cancelado/perdido mantêm a data antiga). */
export function isStaleAppointment(lead: Pick<Lead, "status" | "scheduled_at">): boolean {
  return Boolean(lead.scheduled_at) && !APPOINTMENT.has(lead.status);
}
