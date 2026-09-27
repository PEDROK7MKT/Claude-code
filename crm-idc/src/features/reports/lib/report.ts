/**
 * Relatório mensal (spec §4.7): junta leads, métricas do Google Ads e do GMN
 * de um mês (e do mês anterior, para comparação) num único objeto usado pela
 * tela, pelo resumo automático, pelo CSV e pelo PDF. Funções puras.
 */
import { LEAD_STATUSES, SERVICE_LABEL, STATUS_META } from "@/lib/constants";
import { formatDateKey, getMonthRange, startOfDateKey, toBahia, type DateRange } from "@/lib/dates";
import {
  adsDailySeries,
  attendanceRate,
  computeLeadKpis,
  countBySource,
  countByStatus,
  filterByCreatedAt,
  leadsPerDay,
  linearTrend,
  summarizeDailyMetrics,
  topKeywords,
  type AdsDayPoint,
  type AdsTotals,
  type KeywordCount,
  type LeadKpis,
  type SourceSlice,
} from "@/lib/metrics";
import type { DailyMetric, GmnMetric, Lead, LeadStatus, ServiceType } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { monthLabel, shiftMonth } from "./month";

/** Campos do lead usados nos cálculos do relatório. */
export type ReportLead = Pick<Lead, "status" | "source" | "created_at" | "keyword" | "service">;

/**
 * Situação das métricas do Google Ads no mês:
 * - ready: há métricas lançadas;
 * - empty: consulta ok, mas nenhum dia lançado;
 * - unavailable: não foi possível carregar (erro/offline).
 */
export type AdsState = "ready" | "empty" | "unavailable";

export interface PeriodStats {
  kpis: LeadKpis;
  attended: number;
  missed: number;
  /** compareceu ÷ (compareceu + não compareceu) × 100 */
  attendanceRate: number | null;
  adsState: AdsState;
  /** Totais do Google Ads (null quando adsState ≠ ready) */
  ads: AdsTotals | null;
  /** Dias distintos com métrica lançada */
  adsDays: number;
}

export interface ServiceCount {
  service: ServiceType;
  label: string;
  count: number;
}

export interface GmnSnapshot {
  rating: number | null;
  totalReviews: number;
  /** Avaliações novas registradas em períodos contidos no mês */
  newReviewsInMonth: number;
  periodStart: string;
  periodEnd: string;
}

export interface StatusBar {
  status: LeadStatus;
  label: string;
  value: number;
  color: string;
  /** % do total de leads do mês (null sem leads) */
  share: number | null;
}

export interface DayPoint {
  date: string;
  /** dd/MM (eixo) */
  label: string;
  /** "terça, 03/03/2026" (tooltip) */
  tooltipLabel: string;
  count: number;
  /** Linha de tendência (mínimos quadrados) */
  trend: number | null;
}

export interface AdsComparisonPoint {
  date: string;
  label: string;
  tooltipLabel: string;
  /** Conversões registradas pelo Google Ads (null = dia sem lançamento) */
  conversions: number | null;
  /** Leads google_ads que chegaram ao CRM no dia */
  crmLeads: number;
}

export interface MonthReport {
  monthKey: string;
  /** "março de 2026" */
  monthLabel: string;
  previousMonthKey: string;
  previousMonthLabel: string;
  range: DateRange;
  /** Mês em andamento: gráficos vão só até hoje */
  isPartial: boolean;
  /** Último dia considerado nos gráficos (yyyy-MM-dd) */
  throughKey: string;
  current: PeriodStats;
  /** null quando os leads do mês anterior não estão disponíveis */
  previous: PeriodStats | null;
  statusCounts: Record<LeadStatus, number>;
  statusBars: StatusBar[];
  sources: SourceSlice[];
  keywords: KeywordCount[];
  topService: ServiceCount | null;
  gmn: GmnSnapshot | null;
  perDay: DayPoint[];
  /** Comparativo diário (null quando não há métricas do Google Ads) */
  adsComparison: AdsComparisonPoint[] | null;
}

export interface MonthReportInput {
  monthKey: string;
  /** Hoje (yyyy-MM-dd, fuso da clínica) */
  today: string;
  /** Leads criados no mês (podem vir junto com os do mês anterior — são filtrados) */
  leads: readonly Lead[];
  /** Leads do mês anterior; null/undefined = indisponível */
  previousLeads?: readonly Lead[] | null;
  /** Métricas diárias do mês; null/undefined = indisponível */
  metrics?: readonly DailyMetric[] | null;
  previousMetrics?: readonly DailyMetric[] | null;
  /** Histórico do GMN; null/undefined = indisponível */
  gmnMetrics?: readonly GmnMetric[] | null;
}

/** Tooltip de dia: "terça, 03/03/2026" */
export function formatDayTooltip(dateKey: string): string {
  return format(toBahia(startOfDateKey(dateKey)), "EEE, dd/MM/yyyy", { locale: ptBR });
}

function metricsInRange<T extends Pick<DailyMetric, "date">>(metrics: readonly T[], range: DateRange): T[] {
  return metrics.filter((m) => {
    const key = m.date.slice(0, 10);
    return key >= range.fromKey && key <= range.toKey;
  });
}

function buildPeriodStats(
  leads: readonly ReportLead[],
  metrics: readonly DailyMetric[] | null | undefined,
): PeriodStats {
  const adsState: AdsState = metrics == null ? "unavailable" : metrics.length === 0 ? "empty" : "ready";
  const ads = adsState === "ready" && metrics ? summarizeDailyMetrics(metrics) : null;
  const base = computeLeadKpis(leads, ads?.cost ?? 0);
  // sem métricas lançadas o custo é desconhecido (não é R$ 0,00)
  const kpis: LeadKpis = ads
    ? base
    : {
        ...base,
        costPerLead: null,
        costPerScheduled: null,
        costPerGoogleAdsLead: null,
        costPerGoogleAdsScheduled: null,
      };
  let attended = 0;
  let missed = 0;
  for (const lead of leads) {
    if (lead.status === "compareceu") attended++;
    else if (lead.status === "nao_compareceu") missed++;
  }
  return {
    kpis,
    attended,
    missed,
    attendanceRate: attendanceRate(leads),
    adsState,
    ads,
    adsDays: metrics ? new Set(metrics.map((m) => m.date.slice(0, 10))).size : 0,
  };
}

/** Serviço mais procurado (ignora leads sem serviço). Empate: ordem da lista de serviços. */
export function topService(leads: ReadonlyArray<Pick<Lead, "service">>): ServiceCount | null {
  const counts = new Map<ServiceType, number>();
  for (const lead of leads) {
    if (lead.service) counts.set(lead.service, (counts.get(lead.service) ?? 0) + 1);
  }
  const order = Object.keys(SERVICE_LABEL);
  let best: ServiceCount | null = null;
  for (const [service, count] of counts) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && order.indexOf(service) < order.indexOf(best.service))
    ) {
      best = { service, label: SERVICE_LABEL[service] ?? service, count };
    }
  }
  return best;
}

/**
 * Registro do GMN mais recente que terminou até o fim do mês (nota e total de
 * avaliações "na data do relatório"), mais as avaliações novas dos períodos do mês.
 */
export function gmnSnapshotForMonth(
  rows: ReadonlyArray<
    Pick<GmnMetric, "period_start" | "period_end" | "average_rating" | "total_reviews" | "new_reviews">
  >,
  range: Pick<DateRange, "fromKey" | "toKey">,
): GmnSnapshot | null {
  let latest: (typeof rows)[number] | null = null;
  let newReviewsInMonth = 0;
  for (const row of rows) {
    const end = row.period_end.slice(0, 10);
    const start = row.period_start.slice(0, 10);
    if (end > range.toKey) continue;
    if (start >= range.fromKey) newReviewsInMonth += Number(row.new_reviews) || 0;
    if (!latest || end > latest.period_end.slice(0, 10)) latest = row;
  }
  if (!latest) return null;
  const rating = latest.average_rating == null ? null : Number(latest.average_rating);
  return {
    rating: rating != null && Number.isFinite(rating) ? rating : null,
    totalReviews: Number(latest.total_reviews) || 0,
    newReviewsInMonth,
    periodStart: latest.period_start.slice(0, 10),
    periodEnd: latest.period_end.slice(0, 10),
  };
}

/** Barras do funil: todos os status na ordem do funil (inclusive zerados). */
export function buildStatusBars(counts: Record<LeadStatus, number>, total: number): StatusBar[] {
  return LEAD_STATUSES.map((status) => ({
    status,
    label: STATUS_META[status].title,
    value: counts[status],
    color: STATUS_META[status].color,
    share: total > 0 ? (counts[status] / total) * 100 : null,
  }));
}

/** Cor da fatia agrupada "Outras fontes" (neutra, distinta de "Outro"). */
export const OTHER_SOURCES_COLOR = "#CBD5E1";

export interface OtherSlice {
  source: "outras";
  label: string;
  value: number;
  color: string;
}

export type DonutSlice = SourceSlice | OtherSlice;

/**
 * Donut com no máximo `max` fatias: as maiores ficam, o resto vira "Outras fontes"
 * (cada fonte mantém a própria cor — a cor segue a fonte, não a posição).
 */
export function foldSourceSlices(slices: readonly SourceSlice[], max = 6): DonutSlice[] {
  if (slices.length <= max) return [...slices];
  const kept = slices.slice(0, Math.max(1, max - 1));
  const rest = slices.slice(kept.length);
  return [
    ...kept,
    {
      source: "outras",
      label: "Outras fontes",
      value: rest.reduce((sum, s) => sum + s.value, 0),
      color: OTHER_SOURCES_COLOR,
    },
  ];
}

export function buildMonthReport(input: MonthReportInput): MonthReport {
  const range = getMonthRange(input.monthKey);
  const previousMonthKey = shiftMonth(input.monthKey, -1);
  const previousRange = getMonthRange(previousMonthKey);

  const leads = filterByCreatedAt(input.leads, range.from, range.to);
  const metrics = input.metrics == null ? null : metricsInRange(input.metrics, range);

  const previousLeads =
    input.previousLeads == null ? null : filterByCreatedAt(input.previousLeads, previousRange.from, previousRange.to);
  const previousMetrics =
    input.previousMetrics == null ? null : metricsInRange(input.previousMetrics, previousRange);

  const isPartial = input.today >= range.fromKey && input.today <= range.toKey;
  const throughKey = isPartial ? input.today : range.toKey;

  const current = buildPeriodStats(leads, metrics);
  const previous = previousLeads ? buildPeriodStats(previousLeads, previousMetrics) : null;
  const statusCounts = countByStatus(leads);

  const daily = leadsPerDay(leads, range.fromKey, throughKey);
  const trend = daily.length >= 3 ? linearTrend(daily.map((d) => d.count)) : [];
  const perDay: DayPoint[] = daily.map((d, i) => ({
    date: d.date,
    label: d.label,
    tooltipLabel: formatDayTooltip(d.date),
    count: d.count,
    trend: trend.length ? Math.max(0, Math.round(trend[i] * 100) / 100) : null,
  }));

  let adsComparison: AdsComparisonPoint[] | null = null;
  if (metrics && metrics.length > 0) {
    const launched = new Set(metrics.map((m) => m.date.slice(0, 10)));
    const series: AdsDayPoint[] = adsDailySeries(metrics, leads, range.fromKey, throughKey);
    adsComparison = series.map((p) => ({
      date: p.date,
      label: p.label,
      tooltipLabel: formatDayTooltip(p.date),
      conversions: launched.has(p.date) ? p.conversions : null,
      crmLeads: p.crmLeads,
    }));
  }

  return {
    monthKey: input.monthKey,
    monthLabel: monthLabel(input.monthKey),
    previousMonthKey,
    previousMonthLabel: monthLabel(previousMonthKey),
    range,
    isPartial,
    throughKey,
    current,
    previous,
    statusCounts,
    statusBars: buildStatusBars(statusCounts, leads.length),
    sources: countBySource(leads),
    keywords: topKeywords(leads, 5),
    topService: topService(leads),
    gmn: input.gmnMetrics == null ? null : gmnSnapshotForMonth(input.gmnMetrics, range),
    perDay,
    adsComparison,
  };
}

/** "01/03/2026 a 31/03/2026" */
export function formatReportPeriod(report: Pick<MonthReport, "range">): string {
  return `${formatDateKey(report.range.fromKey)} a ${formatDateKey(report.range.toKey)}`;
}
