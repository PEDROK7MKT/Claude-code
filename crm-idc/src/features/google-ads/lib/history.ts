/**
 * Tabela de histórico de lançamentos: ordenação, paginação e razões por linha.
 * Funções puras.
 */
import { safeDivide } from "@/lib/format";
import type { DailyMetric } from "@/types/database";

export type HistorySortKey = "date" | "cost";
export type SortDirection = "asc" | "desc";

export interface HistorySort {
  key: HistorySortKey;
  direction: SortDirection;
}

export const DEFAULT_HISTORY_SORT: HistorySort = { key: "date", direction: "desc" };

export const HISTORY_SORT_OPTIONS: ReadonlyArray<{ value: string; label: string; sort: HistorySort }> = [
  { value: "date-desc", label: "Mais recentes", sort: { key: "date", direction: "desc" } },
  { value: "date-asc", label: "Mais antigos", sort: { key: "date", direction: "asc" } },
  { value: "cost-desc", label: "Maior custo", sort: { key: "cost", direction: "desc" } },
  { value: "cost-asc", label: "Menor custo", sort: { key: "cost", direction: "asc" } },
];

export function sortValue(sort: HistorySort): string {
  return `${sort.key}-${sort.direction}`;
}

type Sortable = Pick<DailyMetric, "date" | "campaign" | "cost">;

/** Ordena sem alterar o array original. Desempate: data mais recente, depois campanha. */
export function sortHistory<T extends Sortable>(rows: readonly T[], sort: HistorySort): T[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const primary =
      sort.key === "cost" ? (Number(a.cost) - Number(b.cost)) * dir : a.date.localeCompare(b.date) * dir;
    if (primary !== 0) return primary;
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return a.campaign.localeCompare(b.campaign, "pt-BR");
  });
}

/** Próxima ordenação ao clicar no cabeçalho: mesma coluna inverte; outra começa desc. */
export function toggleSort(current: HistorySort, key: HistorySortKey): HistorySort {
  if (current.key === key) return { key, direction: current.direction === "desc" ? "asc" : "desc" };
  return { key, direction: "desc" };
}

export interface Paginated<T> {
  rows: T[];
  /** Página exibida (1-based), limitada ao total */
  page: number;
  pageCount: number;
  total: number;
  /** Índice (1-based) do primeiro e do último item exibidos */
  start: number;
  end: number;
}

export function paginate<T>(rows: readonly T[], page: number, pageSize: number): Paginated<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const offset = (current - 1) * pageSize;
  const slice = rows.slice(offset, offset + pageSize);
  return {
    rows: slice,
    page: current,
    pageCount,
    total,
    start: total ? offset + 1 : 0,
    end: offset + slice.length,
  };
}

/** Números de página a exibir: primeira, última e vizinhas da atual, com reticências (null). */
export function pageWindow(page: number, pageCount: number): Array<number | null> {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: Array<number | null> = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push(null);
    out.push(p);
  }
  return out;
}

type RowMetric = Pick<DailyMetric, "impressions" | "clicks" | "cost" | "leads_total" | "leads_agendados">;

/** CTR da linha (%). */
export function rowCtr(row: RowMetric): number | null {
  const ratio = safeDivide(Number(row.clicks), Number(row.impressions));
  return ratio === null ? null : ratio * 100;
}

/** CPL real da linha: custo ÷ leads do CRM contados pelo banco nesse dia/campanha. */
export function rowCpl(row: RowMetric): number | null {
  return safeDivide(Number(row.cost), Number(row.leads_total));
}
