/**
 * Séries dos gráficos da página Google Ads (CTR, CPC, custo por conversão e
 * conversões × leads reais). Dias sem métrica lançada viram lacunas (null), não
 * zeros — razão indefinida não é "0%". Períodos longos são agrupados por semana/mês.
 */
import type { DateKeyRange } from "@/components/shared/date-time-picker";
import { formatDateKey } from "@/lib/dates";
import { safeDivide } from "@/lib/format";
import { adsDailySeries } from "@/lib/metrics";
import type { DailyMetric, Lead } from "@/types/database";
import { addDaysToKey, rangeLength } from "./periods";

export type Granularity = "day" | "week" | "month";

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "por dia",
  week: "por semana",
  month: "por mês",
};

export interface AdsChartPoint {
  /** Início do agrupamento (yyyy-MM-dd) */
  key: string;
  /** Rótulo curto do eixo X */
  label: string;
  /** Rótulo completo do tooltip */
  tooltipLabel: string;
  /** Há métrica lançada em algum dia do agrupamento */
  hasData: boolean;
  impressions: number | null;
  clicks: number | null;
  cost: number | null;
  /** Conversões registradas no Google Ads (null sem lançamento) */
  conversions: number | null;
  /** Leads google_ads criados no CRM (sempre contado) */
  crmLeads: number;
  /** cliques ÷ impressões × 100 */
  ctr: number | null;
  /** custo ÷ cliques */
  cpc: number | null;
  /** custo ÷ conversões */
  costPerConversion: number | null;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
const MONTHS_LONG = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function parts(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function weekday(key: string): number {
  const { y, m, d } = parts(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Até ~3 meses por dia; até ~1 ano por semana; acima disso por mês. */
export function pickGranularity(range: DateKeyRange): Granularity {
  const days = rangeLength(range);
  if (days <= 92) return "day";
  if (days <= 400) return "week";
  return "month";
}

/**
 * Barras agrupadas (conversões × leads) ficam finas demais com muitos dias:
 * por dia até ~6 semanas, depois por semana/mês.
 */
export function pickComparisonGranularity(range: DateKeyRange): Granularity {
  const days = rangeLength(range);
  if (days <= 45) return "day";
  if (days <= 400) return "week";
  return "month";
}

/** Chave do agrupamento: o próprio dia, a segunda-feira da semana ou o dia 1 do mês. */
export function bucketKey(dateKey: string, granularity: Granularity): string {
  if (granularity === "day") return dateKey;
  if (granularity === "month") return `${dateKey.slice(0, 7)}-01`;
  const offset = (weekday(dateKey) + 6) % 7; // segunda = 0
  return addDaysToKey(dateKey, -offset);
}

function labels(first: string, last: string, granularity: Granularity): { label: string; tooltipLabel: string } {
  const { y, m } = parts(first);
  if (granularity === "month") {
    return {
      label: `${MONTHS[m - 1]}/${String(y).slice(2)}`,
      tooltipLabel: `${MONTHS_LONG[m - 1].replace(/^./, (c) => c.toUpperCase())} de ${y}`,
    };
  }
  const short = formatDateKey(first).slice(0, 5);
  if (granularity === "week") {
    return {
      label: short,
      tooltipLabel:
        first === last ? formatDateKey(first) : `${short} a ${formatDateKey(last)}`,
    };
  }
  return { label: short, tooltipLabel: `${WEEKDAYS[weekday(first)]}, ${formatDateKey(first)}` };
}

interface Bucket {
  key: string;
  first: string;
  last: string;
  hasData: boolean;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  crmLeads: number;
}

/**
 * Série dos gráficos no intervalo (inclusive). `metrics` e `leads` já filtrados
 * pela campanha escolhida; só leads com source google_ads são contados.
 */
export function buildAdsChartSeries(
  metrics: ReadonlyArray<Pick<DailyMetric, "date" | "impressions" | "clicks" | "cost" | "conversions">>,
  leads: ReadonlyArray<Pick<Lead, "created_at" | "source">>,
  range: DateKeyRange,
  granularity: Granularity = pickGranularity(range),
): AdsChartPoint[] {
  const daysWithData = new Set(metrics.map((m) => m.date.slice(0, 10)));
  const buckets = new Map<string, Bucket>();

  for (const day of adsDailySeries(metrics, leads, range.from, range.to)) {
    const key = bucketKey(day.date, granularity);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key,
        first: day.date,
        last: day.date,
        hasData: false,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        crmLeads: 0,
      };
      buckets.set(key, bucket);
    }
    bucket.last = day.date;
    bucket.crmLeads += day.crmLeads;
    if (daysWithData.has(day.date)) {
      bucket.hasData = true;
      bucket.impressions += day.impressions;
      bucket.clicks += day.clicks;
      bucket.cost += day.cost;
      bucket.conversions += day.conversions;
    }
  }

  return [...buckets.values()].map((b) => {
    const cost = Math.round(b.cost * 100) / 100;
    const ctr = b.hasData ? safeDivide(b.clicks, b.impressions) : null;
    return {
      key: b.key,
      ...labels(b.first, b.last, granularity),
      hasData: b.hasData,
      impressions: b.hasData ? b.impressions : null,
      clicks: b.hasData ? b.clicks : null,
      cost: b.hasData ? cost : null,
      conversions: b.hasData ? b.conversions : null,
      crmLeads: b.crmLeads,
      ctr: ctr === null ? null : ctr * 100,
      cpc: b.hasData ? safeDivide(cost, b.clicks) : null,
      costPerConversion: b.hasData ? safeDivide(cost, b.conversions) : null,
    };
  });
}

/** Há ao menos um ponto com valor numérico na chave. */
export function hasSeriesValues(points: readonly AdsChartPoint[], key: keyof AdsChartPoint): boolean {
  return points.some((p) => typeof p[key] === "number" && Number.isFinite(p[key]));
}
