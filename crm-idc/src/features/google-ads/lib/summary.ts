/**
 * KPIs da página Google Ads: totais do Google Ads + leads reais do CRM (regra 7:
 * CPL real = custo ÷ leads do Google Ads registrados no CRM). Funções puras.
 */
import { computeLeadKpis, summarizeDailyMetrics, type AdsTotals } from "@/lib/metrics";
import { percentChange } from "@/lib/format";
import type { DailyMetric, Lead } from "@/types/database";

type MetricLike = Pick<DailyMetric, "date" | "impressions" | "clicks" | "cost" | "conversions">;
type LeadLike = Pick<Lead, "status" | "source" | "campaign">;

export interface AdsKpis extends AdsTotals {
  /** Leads google_ads criados no período (CRM) */
  crmLeads: number;
  /** Desses, quantos estão agendado/confirmado/compareceu */
  crmScheduled: number;
  /** Custo ÷ leads reais (regra 7) */
  realCpl: number | null;
  /** Custo ÷ agendamentos reais */
  realCostPerScheduled: number | null;
  /** Leads do Google Ads sem campanha informada (não entram na tabela por campanha) */
  leadsWithoutCampaign: number;
  /** Dias distintos com métrica lançada */
  daysWithData: number;
}

export function computeAdsKpis(metrics: readonly MetricLike[], leads: readonly LeadLike[]): AdsKpis {
  const totals = summarizeDailyMetrics(metrics);
  const adsLeads = leads.filter((lead) => lead.source === "google_ads");
  const leadKpis = computeLeadKpis(adsLeads, totals.cost);
  return {
    ...totals,
    crmLeads: leadKpis.googleAdsLeads,
    crmScheduled: leadKpis.googleAdsScheduled,
    realCpl: leadKpis.costPerGoogleAdsLead,
    realCostPerScheduled: leadKpis.costPerGoogleAdsScheduled,
    leadsWithoutCampaign: adsLeads.filter((lead) => !lead.campaign?.trim()).length,
    daysWithData: new Set(metrics.map((m) => m.date.slice(0, 10))).size,
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
