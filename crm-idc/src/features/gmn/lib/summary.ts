/**
 * Cálculos da página do GMN: série para os gráficos, KPIs do último período
 * vs período anterior equivalente e destaque de nota/avaliações. Funções puras.
 */
import { formatDateKey } from "@/lib/dates";
import { percentChange } from "@/lib/format";
import type { GmnMetric } from "@/types/database";
import { periodLengthDays } from "./periods";

/** Campos do registro usados nos cálculos (facilita testes). */
export type GmnRow = Pick<
  GmnMetric,
  | "id"
  | "period_start"
  | "period_end"
  | "search_views"
  | "maps_views"
  | "website_clicks"
  | "direction_requests"
  | "phone_calls"
  | "total_reviews"
  | "average_rating"
  | "new_reviews"
>;

/** Nota como número (a coluna DECIMAL pode chegar como string em alguns clientes). */
export function toRating(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Visualizações totais do período (busca + Maps). */
export function totalViews(row: Pick<GmnRow, "search_views" | "maps_views">): number {
  return (row.search_views ?? 0) + (row.maps_views ?? 0);
}

/** Do período mais recente para o mais antigo (fim desc, início desc). */
export function sortByPeriodDesc<T extends Pick<GmnRow, "period_start" | "period_end">>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.period_end !== b.period_end) return a.period_end < b.period_end ? 1 : -1;
    if (a.period_start !== b.period_start) return a.period_start < b.period_start ? 1 : -1;
    return 0;
  });
}

// -----------------------------------------------------------------------------
// Série dos gráficos de evolução
// -----------------------------------------------------------------------------

export interface GmnSeriesPoint {
  id: string;
  periodStart: string;
  periodEnd: string;
  /** Fim do período em dd/MM/yyyy (eixo X) */
  label: string;
  searchViews: number;
  mapsViews: number;
  totalViews: number;
  websiteClicks: number;
  directionRequests: number;
  phoneCalls: number;
  totalReviews: number;
  averageRating: number | null;
  newReviews: number;
}

/** Série cronológica (mais antigo → mais recente) para os gráficos. */
export function buildGmnSeries(rows: readonly GmnRow[]): GmnSeriesPoint[] {
  return sortByPeriodDesc(rows)
    .reverse()
    .map((row) => ({
      id: row.id,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      label: formatDateKey(row.period_end),
      searchViews: row.search_views,
      mapsViews: row.maps_views,
      totalViews: totalViews(row),
      websiteClicks: row.website_clicks,
      directionRequests: row.direction_requests,
      phoneCalls: row.phone_calls,
      totalReviews: row.total_reviews,
      averageRating: toRating(row.average_rating),
      newReviews: row.new_reviews,
    }));
}

/**
 * Domínio do eixo da nota: 4,0–5,0 por padrão; desce em passos de 0,5 se
 * alguma nota ficar abaixo de 4 (nada é cortado do gráfico).
 */
export function ratingAxisDomain(values: ReadonlyArray<number | null>): [number, number] {
  const ratings = values.filter((v): v is number => v != null && Number.isFinite(v));
  const min = ratings.length ? Math.min(...ratings) : 4;
  const lower = Math.max(0, Math.min(4, Math.floor(min * 2) / 2));
  return [lower, 5];
}

/**
 * Eixo das barras de avaliações com folga no topo (a linha da nota fica acima das barras)
 * e marcas redondas: 197 → 0/100/200/300. Escolhe o menor máximo "redondo" com 3 a 5 intervalos.
 */
export function reviewsAxis(values: readonly number[], headroom = 1.3): { domain: [number, number]; ticks: number[] } {
  const dataMax = values.reduce((max, v) => (Number.isFinite(v) ? Math.max(max, v) : max), 0);
  const target = Math.max(4, dataMax * headroom);
  let best: { top: number; step: number; count: number } | null = null;
  for (const count of [4, 5, 3]) {
    const raw = target / count;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10]
      .map((m) => m * magnitude)
      .find((s) => s >= raw - 1e-9 && Number.isInteger(s));
    if (step == null) continue;
    const top = step * count;
    if (!best || top < best.top) best = { top, step, count };
  }
  const { top, step, count } = best ?? { top: 4, step: 1, count: 4 };
  return { domain: [0, top], ticks: Array.from({ length: count + 1 }, (_, i) => i * step) };
}

/** Marcas do eixo da nota (passo 0,5 até 2 pontos de amplitude; senão 1). */
export function ratingAxisTicks([lower, upper]: [number, number]): number[] {
  const step = upper - lower <= 2 ? 0.5 : 1;
  const ticks: number[] = [];
  for (let t = upper; t >= lower - 1e-9; t -= step) ticks.unshift(Math.round(t * 10) / 10);
  return ticks;
}

// -----------------------------------------------------------------------------
// KPIs: último período vs período anterior equivalente
// -----------------------------------------------------------------------------

export const GMN_KPI_KEYS = ["totalViews", "websiteClicks", "directionRequests", "phoneCalls", "newReviews"] as const;
export type GmnKpiKey = (typeof GMN_KPI_KEYS)[number];

export interface GmnKpiValue {
  current: number;
  previous: number | null;
  /** Variação % (pontos percentuais); null = sem base de comparação */
  change: number | null;
}

export interface GmnComparison<T extends GmnRow = GmnRow> {
  latest: T;
  /** Período anterior de duração parecida e sem sobreposição (null se não houver) */
  previous: T | null;
  kpis: Record<GmnKpiKey, GmnKpiValue>;
}

function kpiValues(row: GmnRow): Record<GmnKpiKey, number> {
  return {
    totalViews: totalViews(row),
    websiteClicks: row.website_clicks,
    directionRequests: row.direction_requests,
    phoneCalls: row.phone_calls,
    newReviews: row.new_reviews,
  };
}

/**
 * Período anterior comparável ao `latest`: termina antes de ele começar e tem
 * duração parecida (±25–35%) — evita comparar uma semana com um mês.
 */
export function findComparablePrevious<T extends GmnRow>(rows: readonly T[], latest: T): T | null {
  const length = periodLengthDays(latest.period_start, latest.period_end);
  for (const row of sortByPeriodDesc(rows)) {
    if (row.id === latest.id || row.period_end >= latest.period_start) continue;
    const ratio = periodLengthDays(row.period_start, row.period_end) / length;
    if (ratio >= 0.75 && ratio <= 1.35) return row;
  }
  return null;
}

/** KPIs do último período e variação vs o período anterior comparável. Null sem registros. */
export function compareLatestPeriods<T extends GmnRow>(rows: readonly T[]): GmnComparison<T> | null {
  const [latest] = sortByPeriodDesc(rows);
  if (!latest) return null;
  const previous = findComparablePrevious(rows, latest);
  const current = kpiValues(latest);
  const before = previous ? kpiValues(previous) : null;

  const kpis = {} as Record<GmnKpiKey, GmnKpiValue>;
  for (const key of GMN_KPI_KEYS) {
    const prev = before ? before[key] : null;
    kpis[key] = {
      current: current[key],
      previous: prev,
      change: prev == null ? null : percentChange(current[key], prev),
    };
  }
  return { latest, previous, kpis };
}

// -----------------------------------------------------------------------------
// Destaque: nota atual e total de avaliações
// -----------------------------------------------------------------------------

export interface ReviewsHighlight<T extends GmnRow = GmnRow> {
  latest: T;
  /** Registro imediatamente anterior (avaliações são acumuladas: qualquer duração serve) */
  previous: T | null;
  /** Nota mais recente informada (pode vir de um período anterior ao último) */
  rating: number | null;
  /** Fim do período de onde a nota veio, quando não é o último registro */
  ratingFromPeriodEnd: string | null;
  totalReviews: number;
  /** Avaliações ganhas vs registro anterior */
  reviewsDelta: number | null;
  /** Diferença de nota vs registro anterior (1 casa) */
  ratingDelta: number | null;
}

export function buildReviewsHighlight<T extends GmnRow>(rows: readonly T[]): ReviewsHighlight<T> | null {
  const sorted = sortByPeriodDesc(rows);
  const [latest, previous = null] = sorted;
  if (!latest) return null;

  const withRating = sorted.find((row) => toRating(row.average_rating) != null) ?? null;
  const rating = withRating ? toRating(withRating.average_rating) : null;
  const latestRating = toRating(latest.average_rating);
  const previousRating = previous ? toRating(previous.average_rating) : null;

  return {
    latest,
    previous,
    rating,
    ratingFromPeriodEnd: withRating && withRating !== latest ? withRating.period_end : null,
    totalReviews: latest.total_reviews,
    reviewsDelta: previous ? latest.total_reviews - previous.total_reviews : null,
    ratingDelta:
      latestRating != null && previousRating != null ? Math.round((latestRating - previousRating) * 10) / 10 : null,
  };
}

/** Preenchimento (0–1) de cada estrela para uma nota: 4,3 → [1, 1, 1, 1, 0.3]. */
export function starFills(rating: number | null | undefined, count = 5): number[] {
  const value = rating != null && Number.isFinite(rating) ? Math.min(count, Math.max(0, rating)) : 0;
  return Array.from({ length: count }, (_, i) => Math.round(Math.min(1, Math.max(0, value - i)) * 100) / 100);
}
