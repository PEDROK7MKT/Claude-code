/**
 * KPIs da página Google Ads: totais do Google Ads + leads reais do CRM (regra 7:
 * CPL real = custo do dia ÷ leads do Google Ads registrados no CRM naquele mesmo dia).
 * Funções puras.
 */
import { computeLeadKpis, googleAdsLeadsOnMetricDays, summarizeDailyMetrics, type AdsTotals } from "@/lib/metrics";
import { percentChange } from "@/lib/format";
import type { DailyMetric, Lead } from "@/types/database";

type MetricLike = Pick<DailyMetric, "date" | "impressions" | "clicks" | "cost" | "conversions">;
type LeadLike = Pick<Lead, "status" | "source" | "campaign" | "created_at">;

export interface AdsKpis extends AdsTotals {
  /** Leads google_ads criados no período (CRM) */
  crmLeads: number;
  /** Desses, quantos estão agendado/confirmado/compareceu */
  crmScheduled: number;
  /** Leads google_ads criados em dias com métrica lançada (base do CPL real) */
  leadsOnMetricDays: number;
  /** Desses, quantos estão agendado/confirmado/compareceu (base do custo por agendamento real) */
  scheduledOnMetricDays: number;
  /** Leads google_ads de dias ainda sem lançamento (ex.: hoje) — ficam fora das razões de custo */
  leadsOutsideMetricDays: number;
  /** Custo ÷ leads reais dos dias com lançamento (regra 7) */
  realCpl: number | null;
  /** Custo ÷ agendamentos reais dos dias com lançamento */
  realCostPerScheduled: number | null;
  /** Leads do Google Ads sem campanha informada (não entram na tabela por campanha) */
  leadsWithoutCampaign: number;
  /** Dias distintos com métrica lançada */
  daysWithData: number;
}

/**
 * Totais do período + leads reais do CRM. As razões de custo (CPL real, custo por
 * agendamento real) só usam os leads criados em dias que têm métrica lançada: o custo
 * de um dia é cruzado com os leads daquele mesmo dia (regra 7). Assim, os leads de hoje
 * (o lançamento costuma sair no dia seguinte) não baixam o CPL real artificialmente.
 * Com filtro de campanha, `metrics` e `leads` já chegam filtrados — o conjunto de dias
 * passa a ser o da campanha.
 */
export function computeAdsKpis(metrics: readonly MetricLike[], leads: readonly LeadLike[]): AdsKpis {
  const totals = summarizeDailyMetrics(metrics);
  const metricDays = new Set(metrics.map((m) => m.date.slice(0, 10)));
  const adsLeads = leads.filter((lead) => lead.source === "google_ads");
  const costedLeads = googleAdsLeadsOnMetricDays(adsLeads, metrics);
  const all = computeLeadKpis(adsLeads, totals.cost);
  const costed = computeLeadKpis(costedLeads, totals.cost);
  return {
    ...totals,
    crmLeads: all.googleAdsLeads,
    crmScheduled: all.googleAdsScheduled,
    leadsOnMetricDays: costed.googleAdsLeads,
    scheduledOnMetricDays: costed.googleAdsScheduled,
    leadsOutsideMetricDays: all.googleAdsLeads - costed.googleAdsLeads,
    realCpl: costed.costPerGoogleAdsLead,
    realCostPerScheduled: costed.costPerGoogleAdsScheduled,
    leadsWithoutCampaign: adsLeads.filter((lead) => !lead.campaign?.trim()).length,
    daysWithData: metricDays.size,
  };
}

export type AdsKpiKey =
  | "cost"
  | "impressions"
  | "clicks"
  | "ctr"
  | "cpc"
  | "conversions"
  | "costPerConversion"
  | "crmLeads"
  | "realCpl"
  | "realCostPerScheduled";

/**
 * Variação % de cada KPI vs período anterior, no formato do KpiCard:
 * `undefined` = sem comparação (oculta), `null` = sem base (anterior zerado/indefinido).
 */
export type AdsKpiChanges = Record<AdsKpiKey, number | null | undefined>;

function ratioChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return percentChange(current, previous);
}

export function compareAdsKpis(current: AdsKpis, previous: AdsKpis | null): AdsKpiChanges {
  if (!previous) {
    return {
      cost: undefined,
      impressions: undefined,
      clicks: undefined,
      ctr: undefined,
      cpc: undefined,
      conversions: undefined,
      costPerConversion: undefined,
      crmLeads: undefined,
      realCpl: undefined,
      realCostPerScheduled: undefined,
    };
  }
  return {
    cost: percentChange(current.cost, previous.cost),
    impressions: percentChange(current.impressions, previous.impressions),
    clicks: percentChange(current.clicks, previous.clicks),
    ctr: ratioChange(current.ctr, previous.ctr),
    cpc: ratioChange(current.cpc, previous.cpc),
    conversions: percentChange(current.conversions, previous.conversions),
    costPerConversion: ratioChange(current.costPerConversion, previous.costPerConversion),
    crmLeads: percentChange(current.crmLeads, previous.crmLeads),
    realCpl: ratioChange(current.realCpl, previous.realCpl),
    realCostPerScheduled: ratioChange(current.realCostPerScheduled, previous.realCostPerScheduled),
  };
}
