/**
 * Cálculos puros do dashboard do admin (spec §4.2): intervalos das consultas,
 * separação período atual × anterior, KPIs com variação e séries dos gráficos.
 * Tudo em cima de @/lib/metrics (já testado) — aqui só a composição do dashboard.
 */
import { LEAD_STATUSES, STATUS_META } from "@/lib/constants";
import { getPeriodRanges, PERIOD_OPTIONS, type DateInput, type DateRange, type PeriodKey } from "@/lib/dates";
import { percentChange } from "@/lib/format";
import {
  computeLeadKpis,
  countBySource,
  countByStatus,
  filterByCreatedAt,
  leadsPerDay,
  linearTrend,
  statusPerDay,
  sumAdsCost,
  type LeadKpis,
  type SourceSlice,
  type StatusDayPoint,
} from "@/lib/metrics";
import type { DailyMetric, Lead, LeadStatus } from "@/types/database";
import { tooltipDayLabel } from "./labels";

// -----------------------------------------------------------------------------
// Intervalos
// -----------------------------------------------------------------------------

/**
 * Intervalos do período selecionado. Os nomes evitam `.current` de propósito:
 * o React Compiler trata qualquer `x.current` como acesso a ref.
 */
export interface AdminDashboardRanges {
  period: PeriodKey;
  currentRange: DateRange;
  previousRange: DateRange;
  /** Janela do gráfico "Leads por dia": últimos 30 dias, ou o período se for maior. */
  trendRange: DateRange;
}

export function getAdminDashboardRanges(period: PeriodKey, now: DateInput = Date.now()): AdminDashboardRanges {
  const { current, previous } = getPeriodRanges(period, now);
  const last30 = getPeriodRanges("30d", now).current;
  // Ambos terminam amanhã 00:00; vale o que começa antes.
  const trendRange = last30.from.getTime() < current.from.getTime() ? last30 : current;
  return { period, currentRange: current, previousRange: previous, trendRange };
}

export interface DashboardFetchWindow {
  /** Leads criados em [createdFrom, createdTo) */
  leadsQuery: { createdFrom: string; createdTo: string };
  /** Métricas do Google Ads de fromKey a toKey (inclusive) */
  metricsQuery: { fromKey: string; toKey: string };
}

/**
 * Uma única janela de consulta que cobre TODOS os períodos do seletor (atual,
 * anterior e gráfico de 30 dias). A chave da consulta só muda na virada do dia,
 * então trocar o período é instantâneo — tudo é recortado em memória — e
 * funciona offline com o cache persistido. São ~60 dias de leads (poucas centenas).
 */
export function getDashboardFetchWindow(now: DateInput = Date.now()): DashboardFetchWindow {
  const all = PERIOD_OPTIONS.map((option) => getAdminDashboardRanges(option.value, now));
  let from = all[0].previousRange.from;
  let fromKey = all[0].previousRange.fromKey;
  for (const ranges of all) {
    for (const range of [ranges.previousRange, ranges.trendRange]) {
      if (range.from.getTime() < from.getTime()) from = range.from;
      if (range.fromKey < fromKey) fromKey = range.fromKey;
    }
  }
  const { currentRange } = all[0];
  return {
    leadsQuery: { createdFrom: from.toISOString(), createdTo: currentRange.to.toISOString() },
    metricsQuery: { fromKey, toKey: currentRange.toKey },
  };
}

/** Métricas diárias cuja data (yyyy-MM-dd) está no intervalo, inclusive. */
export function filterMetricsByRange<T extends Pick<DailyMetric, "date">>(
  metrics: readonly T[],
  range: Pick<DateRange, "fromKey" | "toKey">,
): T[] {
  return metrics.filter((metric) => {
    const key = metric.date.slice(0, 10);
    return key >= range.fromKey && key <= range.toKey;
  });
}

/** Leads do período atual e do anterior, a partir da consulta única. */
export function splitLeadsByPeriod<T extends Pick<Lead, "created_at">>(
  leads: readonly T[],
  ranges: Pick<AdminDashboardRanges, "currentRange" | "previousRange">,
): { periodLeads: T[]; previousLeads: T[] } {
  return {
    periodLeads: filterByCreatedAt(leads, ranges.currentRange.from, ranges.currentRange.to),
    previousLeads: filterByCreatedAt(leads, ranges.previousRange.from, ranges.previousRange.to),
  };
}

// -----------------------------------------------------------------------------
// KPIs
// -----------------------------------------------------------------------------

/**
 * Variação % de um KPI vs período anterior. `null` = sem base de comparação
 * (valor indefinido em algum período, ou anterior 0 com atual > 0).
 */
export function kpiChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return percentChange(current, previous);
}

export interface KpiMetric {
  value: number | null;
  previous: number | null;
  /** Pontos percentuais (12.5 = 12,5%); null = sem base de comparação */
  change: number | null;
}

function metric(value: number | null, previous: number | null, comparable = true): KpiMetric {
  return { value, previous, change: comparable ? kpiChange(value, previous) : null };
}

export interface AdminKpis {
  current: LeadKpis;
  previous: LeadKpis;
  leads: KpiMetric;
  schedulingRate: KpiMetric;
  /** Investimento Google Ads / leads totais (spec) */
  costPerLead: KpiMetric;
  costPerScheduled: KpiMetric;
  investment: KpiMetric;
  /** Investimento / leads de Google Ads — linha auxiliar do card de CPL */
  costPerGoogleAdsLead: number | null;
  /** Há lançamentos do Google Ads no período atual / anterior */
  hasAdsData: boolean;
  hadAdsData: boolean;
  /** Dias distintos com lançamento no período atual */
  adsDays: number;
}

export interface AdminKpiInput {
  currentLeads: ReadonlyArray<Pick<Lead, "status" | "source">>;
  previousLeads: ReadonlyArray<Pick<Lead, "status" | "source">>;
  currentMetrics: ReadonlyArray<Pick<DailyMetric, "date" | "cost">>;
  previousMetrics: ReadonlyArray<Pick<DailyMetric, "date" | "cost">>;
}

/**
 * KPIs do topo do dashboard. Sem lançamentos do Google Ads no período, os custos
 * ficam indefinidos ("—") em vez de R$ 0,00 — o lançamento é manual e costuma
 * atrasar (ex.: "Hoje" antes de lançar o dia), então zero seria enganoso.
 */
export function buildAdminKpis(input: AdminKpiInput): AdminKpis {
  const hasAdsData = input.currentMetrics.length > 0;
  const hadAdsData = input.previousMetrics.length > 0;
  const current = computeLeadKpis(input.currentLeads, sumAdsCost(input.currentMetrics));
  const previous = computeLeadKpis(input.previousLeads, sumAdsCost(input.previousMetrics));
  const costs = hasAdsData && hadAdsData;

  return {
    current,
    previous,
    leads: metric(current.total, previous.total),
    schedulingRate: metric(current.schedulingRate, previous.schedulingRate),
    costPerLead: metric(
      hasAdsData ? current.costPerLead : null,
      hadAdsData ? previous.costPerLead : null,
      costs,
    ),
    costPerScheduled: metric(
      hasAdsData ? current.costPerScheduled : null,
      hadAdsData ? previous.costPerScheduled : null,
      costs,
    ),
    investment: metric(current.investment, previous.investment, hasAdsData),
    costPerGoogleAdsLead: hasAdsData ? current.costPerGoogleAdsLead : null,
    hasAdsData,
    hadAdsData,
    adsDays: new Set(input.currentMetrics.map((m) => m.date.slice(0, 10))).size,
  };
}

// -----------------------------------------------------------------------------
// Gráfico "Leads por dia" (linha + tendência)
// -----------------------------------------------------------------------------

export interface TrendPoint {
  date: string;
  /** dd/MM (eixo) */
  label: string;
  /** "sábado, 26/09/2026" (tooltip) */
  tooltipLabel: string;
  count: number;
  /** Valor da reta de tendência (mínimos quadrados), nunca negativo */
  trend: number;
}

export type TrendDirection = "up" | "down" | "flat";

export interface TrendSeries {
  points: TrendPoint[];
  total: number;
  averagePerDay: number;
  /** Inclinação da reta (leads/dia a cada dia) */
  slopePerDay: number;
  direction: TrendDirection;
}

/** Variação da reta na janela abaixo de 10% da média diária = estável. */
const FLAT_TREND_THRESHOLD = 0.1;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildTrendSeries(
  leads: ReadonlyArray<Pick<Lead, "created_at">>,
  range: Pick<DateRange, "from" | "to" | "fromKey" | "toKey">,
): TrendSeries {
  const inRange = filterByCreatedAt(leads, range.from, range.to);
  const daily = leadsPerDay(inRange, range.fromKey, range.toKey);
  const fitted = linearTrend(daily.map((d) => d.count));
  const points = daily.map((d, i) => ({
    date: d.date,
    label: d.label,
    tooltipLabel: tooltipDayLabel(d.date),
    count: d.count,
    trend: Math.max(0, round2(fitted[i] ?? 0)),
  }));
  const total = inRange.length;
  const averagePerDay = points.length ? total / points.length : 0;
  const slopePerDay = fitted.length > 1 ? fitted[1] - fitted[0] : 0;
  const variation = slopePerDay * Math.max(0, points.length - 1);
  const direction: TrendDirection =
    averagePerDay === 0 || Math.abs(variation) < averagePerDay * FLAT_TREND_THRESHOLD
      ? "flat"
      : variation > 0
        ? "up"
        : "down";
  return { points, total, averagePerDay, slopePerDay, direction };
}

// -----------------------------------------------------------------------------
// Gráfico "Leads por status" (barras empilhadas)
// -----------------------------------------------------------------------------

/** Status exibidos nas barras empilhadas, na ordem do funil. */
export const STATUS_CHART_ORDER: readonly LeadStatus[] = LEAD_STATUSES;

export type StatusChartPoint = StatusDayPoint & { tooltipLabel: string };

export function buildStatusSeries(
  leads: ReadonlyArray<Pick<Lead, "created_at" | "status">>,
  range: Pick<DateRange, "fromKey" | "toKey">,
): StatusChartPoint[] {
  return statusPerDay(leads, range.fromKey, range.toKey).map((point) => ({
    ...point,
    tooltipLabel: tooltipDayLabel(point.date),
  }));
}

export interface StatusTotal {
  status: LeadStatus;
  title: string;
  color: string;
  count: number;
  /** Participação no total (0–100) */
  share: number;
}

/** Totais por status no período (só os que têm leads), na ordem do funil. */
export function statusTotals(leads: ReadonlyArray<Pick<Lead, "status">>): StatusTotal[] {
  const counts = countByStatus(leads);
  const total = leads.length;
  return STATUS_CHART_ORDER.filter((status) => counts[status] > 0).map((status) => ({
    status,
    title: STATUS_META[status].title,
    color: STATUS_META[status].color,
    count: counts[status],
    share: total ? (counts[status] / total) * 100 : 0,
  }));
}

// -----------------------------------------------------------------------------
// Donut "Leads por fonte"
// -----------------------------------------------------------------------------

export interface SourceShare extends SourceSlice {
  /** Participação no total (0–100) */
  share: number;
  /** Cor da fatia (Recharts lê `fill` de cada item) */
  fill: string;
}

export function sourceShares(leads: ReadonlyArray<Pick<Lead, "source">>): SourceShare[] {
  const slices = countBySource(leads);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return slices.map((slice) => ({
    ...slice,
    share: total ? (slice.value / total) * 100 : 0,
    fill: slice.color,
  }));
}
