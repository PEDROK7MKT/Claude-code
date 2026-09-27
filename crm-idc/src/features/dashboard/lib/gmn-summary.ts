/**
 * Card lateral do Google Meu Negócio no dashboard do admin (spec §4.2):
 * registro mais recente × período anterior, com variações. Funções puras.
 */
import { percentChange } from "@/lib/format";
import type { GmnMetric } from "@/types/database";

type GmnRow = Pick<
  GmnMetric,
  | "id"
  | "period_start"
  | "period_end"
  | "created_at"
  | "search_views"
  | "website_clicks"
  | "direction_requests"
  | "total_reviews"
  | "average_rating"
  | "new_reviews"
>;

export interface GmnComparison<T extends GmnRow = GmnRow> {
  latest: T;
  /** Registro mais recente que termina antes do início do mais recente (sem sobreposição) */
  previous: T | null;
}

function byPeriodDesc(a: GmnRow, b: GmnRow): number {
  if (a.period_end !== b.period_end) return a.period_end < b.period_end ? 1 : -1;
  if (a.period_start !== b.period_start) return a.period_start < b.period_start ? 1 : -1;
  return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
}

/** Registro atual e o anterior para comparação (null sem registros). */
export function pickGmnComparison<T extends GmnRow>(rows: readonly T[]): GmnComparison<T> | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort(byPeriodDesc);
  const latest = sorted[0];
  const previous = sorted.slice(1).find((row) => row.period_end < latest.period_start) ?? null;
  return { latest, previous };
}

const DAY_MS = 86_400_000;

function keyToUtc(key: string): number {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Dias do período, contando início e fim. */
export function gmnPeriodDays(start: string, end: string): number {
  return Math.max(1, Math.round((keyToUtc(end) - keyToUtc(start)) / DAY_MS) + 1);
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

export interface GmnFlowStat {
  value: number;
  /** Variação % vs período anterior (null sem base) */
  change: number | null;
}

export interface GmnSummary {
  periodStart: string;
  periodEnd: string;
  previousPeriod: { start: string; end: string } | null;
  /**
   * Períodos de tamanhos diferentes (ex.: semana × mês): as variações de
   * visualizações/cliques/rotas comparam a média diária, não o total.
   */
  normalized: boolean;
  rating: { value: number | null; /** diferença absoluta (0,1 = +0,1 estrela) */ diff: number | null };
  totalReviews: { value: number; diff: number | null; newReviews: number | null };
  searchViews: GmnFlowStat;
  websiteClicks: GmnFlowStat;
  directionRequests: GmnFlowStat;
}

function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function summarizeGmn(comparison: GmnComparison): GmnSummary {
  const { latest, previous } = comparison;
  const latestDays = gmnPeriodDays(latest.period_start, latest.period_end);
  const previousDays = previous ? gmnPeriodDays(previous.period_start, previous.period_end) : latestDays;
  const normalized = previous !== null && previousDays !== latestDays;

  const flow = (key: "search_views" | "website_clicks" | "direction_requests"): GmnFlowStat => {
    const value = toNumber(latest[key]) ?? 0;
    if (!previous) return { value, change: null };
    const before = toNumber(previous[key]) ?? 0;
    const change = normalized ? percentChange(value / latestDays, before / previousDays) : percentChange(value, before);
    return { value, change };
  };

  const rating = toNumber(latest.average_rating);
  const previousRating = previous ? toNumber(previous.average_rating) : null;
  const reviews = toNumber(latest.total_reviews) ?? 0;
  const previousReviews = previous ? toNumber(previous.total_reviews) : null;

  return {
    periodStart: latest.period_start,
    periodEnd: latest.period_end,
    previousPeriod: previous ? { start: previous.period_start, end: previous.period_end } : null,
    normalized,
    rating: {
      value: rating,
      diff: rating !== null && previousRating !== null ? round1(rating - previousRating) : null,
    },
    totalReviews: {
      value: reviews,
      diff: previousReviews !== null ? reviews - previousReviews : null,
      newReviews: toNumber(latest.new_reviews),
    },
    searchViews: flow("search_views"),
    websiteClicks: flow("website_clicks"),
    directionRequests: flow("direction_requests"),
  };
}
