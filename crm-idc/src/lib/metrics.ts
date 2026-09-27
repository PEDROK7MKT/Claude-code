/**
 * Cálculos de KPI puros (sem Supabase/React) — dashboard, Google Ads e relatórios.
 * Datas são agrupadas no fuso America/Bahia via @/lib/dates.
 * Razões indefinidas (divisão por zero) retornam null — exiba com formatCurrency/formatPercent ("—").
 */
import { LEAD_SOURCES, LEAD_STATUSES, SCHEDULED_STATUSES, SOURCE_COLORS, SOURCE_LABEL } from "@/lib/constants";
import { eachDateKey, formatDateKey, toDateKey, type DateInput } from "@/lib/dates";
import { safeDivide } from "@/lib/format";
import type { DailyMetric, Lead, LeadSource, LeadStatus } from "@/types/database";

const SCHEDULED = new Set<LeadStatus>(SCHEDULED_STATUSES);

/** Arredonda para centavos (evita 0.1 + 0.2 = 0.30000000000000004 nos somatórios de custo). */
function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Converte valores numéricos vindos do banco (DECIMAL pode chegar como string) em number finito. */
function num(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function percent(numerator: number, denominator: number): number | null {
  const ratio = safeDivide(numerator, denominator);
  return ratio === null ? null : ratio * 100;
}

/** "2026-03-05" → "05/03" */
function dayLabel(dateKey: string): string {
  return formatDateKey(dateKey).slice(0, 5);
}

// -----------------------------------------------------------------------------
// KPIs de leads
// -----------------------------------------------------------------------------

export interface LeadKpis {
  total: number;
  /** Leads em agendado/confirmado/compareceu */
  scheduled: number;
  /** scheduled / total × 100 (null sem leads) */
  schedulingRate: number | null;
  /** Soma do custo do Google Ads no período */
  investment: number;
  /** investment / total — spec §4.2 */
  costPerLead: number | null;
  /** investment / scheduled */
  costPerScheduled: number | null;
  googleAdsLeads: number;
  costPerGoogleAdsLead: number | null;
  googleAdsScheduled: number;
  costPerGoogleAdsScheduled: number | null;
}

export function computeLeadKpis(leads: ReadonlyArray<Pick<Lead, "status" | "source">>, adsCost: number): LeadKpis {
  const investment = roundCents(num(adsCost));
  let scheduled = 0;
  let googleAdsLeads = 0;
  let googleAdsScheduled = 0;
  for (const lead of leads) {
    const isScheduled = SCHEDULED.has(lead.status);
    if (isScheduled) scheduled++;
    if (lead.source === "google_ads") {
      googleAdsLeads++;
      if (isScheduled) googleAdsScheduled++;
    }
  }
  const total = leads.length;
  return {
    total,
    scheduled,
    schedulingRate: percent(scheduled, total),
    investment,
    costPerLead: safeDivide(investment, total),
    costPerScheduled: safeDivide(investment, scheduled),
    googleAdsLeads,
    costPerGoogleAdsLead: safeDivide(investment, googleAdsLeads),
    googleAdsScheduled,
    costPerGoogleAdsScheduled: safeDivide(investment, googleAdsScheduled),
  };
}

/**
 * Regra 7 (custo do dia × leads do mesmo dia): leads google_ads criados em dias que têm métrica
 * lançada — a base das razões de custo do Google Ads (CPL real, custo por agendamento real).
 * Leads de dias ainda sem lançamento (ex.: hoje; o lançamento costuma sair no dia seguinte)
 * ficam de fora para não baixar o CPL real artificialmente.
 */
export function googleAdsLeadsOnMetricDays<T extends Pick<Lead, "source" | "created_at">>(
  leads: readonly T[],
  metrics: ReadonlyArray<Pick<DailyMetric, "date">>,
): T[] {
  const days = new Set(metrics.map((m) => m.date.slice(0, 10)));
  return leads.filter((lead) => lead.source === "google_ads" && days.has(toDateKey(lead.created_at)));
}

/** Contagem por status (todos os status presentes, inclusive zerados). */
export function countByStatus(leads: ReadonlyArray<Pick<Lead, "status">>): Record<LeadStatus, number> {
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const lead of leads) {
    if (lead.status in counts) counts[lead.status]++;
  }
  return counts;
}

export interface SourceSlice {
  source: LeadSource;
  label: string;
  value: number;
  color: string;
}

/** Leads por fonte (pizza/donut): ordem decrescente, sem fontes zeradas. */
export function countBySource(leads: ReadonlyArray<Pick<Lead, "source">>): SourceSlice[] {
  const counts = new Map<LeadSource, number>();
  for (const lead of leads) counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
  const order = LEAD_SOURCES.map((s) => s.value as LeadSource);
  return [...counts.entries()]
    .filter(([, value]) => value > 0)
    .map(([source, value]) => ({
      source,
      label: SOURCE_LABEL[source] ?? source,
      value,
      color: SOURCE_COLORS[source] ?? "#9CA3AF",
    }))
    .sort((a, b) => b.value - a.value || order.indexOf(a.source) - order.indexOf(b.source));
}

export interface KeywordCount {
  keyword: string;
  count: number;
}

/** Normaliza uma palavra-chave para agrupamento ([dentista], "dentista", +dentista → dentista). */
function normalizeKeyword(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\[(.*)\]$/, "$1")
    .replace(/^"(.*)"$/, "$1")
    .replace(/(^|\s)\+/g, "$1")
    .trim();
}

/**
 * Top N palavras-chave por número de leads. Agrupa sem diferenciar maiúsculas,
 * espaços e marcadores de correspondência do Google Ads; ignora vazias.
 * O rótulo exibido é a variação mais frequente (empate: a primeira vista).
 */
export function topKeywords(leads: ReadonlyArray<Pick<Lead, "keyword">>, n = 5): KeywordCount[] {
  const groups = new Map<string, { count: number; variants: Map<string, number>; order: number }>();
  let order = 0;
  for (const lead of leads) {
    if (!lead.keyword) continue;
    const display = normalizeKeyword(lead.keyword);
    if (!display) continue;
    const key = display.toLocaleLowerCase("pt-BR");
    let group = groups.get(key);
    if (!group) {
      group = { count: 0, variants: new Map(), order: order++ };
      groups.set(key, group);
    }
    group.count++;
    group.variants.set(display, (group.variants.get(display) ?? 0) + 1);
  }
  return [...groups.values()]
    .map((g) => {
      let best = "";
      let bestCount = 0;
      for (const [variant, count] of g.variants) {
        if (count > bestCount) {
          best = variant;
          bestCount = count;
        }
      }
      return { keyword: best, count: g.count, order: g.order };
    })
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, Math.max(0, n))
    .map(({ keyword, count }) => ({ keyword, count }));
}

// -----------------------------------------------------------------------------
// Séries diárias
// -----------------------------------------------------------------------------

export interface DailyCount {
  /** yyyy-MM-dd (fuso America/Bahia) */
  date: string;
  /** dd/MM */
  label: string;
  count: number;
}

/** Leads por dia de criação (Bahia), de fromKey a toKey inclusive, com dias zerados. */
export function leadsPerDay(
  leads: ReadonlyArray<Pick<Lead, "created_at">>,
  fromKey: string,
  toKey: string,
): DailyCount[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const key = toDateKey(lead.created_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return eachDateKey(fromKey, toKey).map((date) => ({ date, label: dayLabel(date), count: counts.get(date) ?? 0 }));
}

/** Linha de tendência por mínimos quadrados: valores ajustados y = a + b·x para x = 0..n-1. */
export function linearTrend(values: readonly number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [values[0]];
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let x = 0; x < n; x++) {
    const y = values[x];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return values.map((_, x) => intercept + slope * x);
}

export type StatusDayPoint = { date: string; label: string; total: number } & Record<LeadStatus, number>;

/**
 * Leads por dia de criação (Bahia) quebrados pelo status ATUAL — barras empilhadas.
 * Cada ponto tem uma chave por status (novo, em_contato, ...) e `total`.
 */
export function statusPerDay(
  leads: ReadonlyArray<Pick<Lead, "created_at" | "status">>,
  fromKey: string,
  toKey: string,
): StatusDayPoint[] {
  const points = new Map<string, StatusDayPoint>();
  const series = eachDateKey(fromKey, toKey).map((date) => {
    const point = {
      date,
      label: dayLabel(date),
      total: 0,
      ...Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])),
    } as StatusDayPoint;
    points.set(date, point);
    return point;
  });
  for (const lead of leads) {
    const point = points.get(toDateKey(lead.created_at));
    if (!point || !(lead.status in point)) continue;
    point[lead.status]++;
    point.total++;
  }
  return series;
}

// -----------------------------------------------------------------------------
// Google Ads
// -----------------------------------------------------------------------------

type MetricLike = Pick<DailyMetric, "date" | "impressions" | "clicks" | "cost" | "conversions">;

/** Soma do custo (R$) das métricas diárias. */
export function sumAdsCost(metrics: ReadonlyArray<Pick<DailyMetric, "cost">>): number {
  return roundCents(metrics.reduce((sum, m) => sum + num(m.cost), 0));
}

export interface AdsTotals {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  /** clicks / impressions × 100 */
  ctr: number | null;
  /** cost / clicks */
  cpc: number | null;
  /** cost / conversions */
  costPerConversion: number | null;
}

function withRatios(t: { impressions: number; clicks: number; cost: number; conversions: number }): AdsTotals {
  const cost = roundCents(t.cost);
  return {
    impressions: t.impressions,
    clicks: t.clicks,
    cost,
    conversions: t.conversions,
    ctr: percent(t.clicks, t.impressions),
    cpc: safeDivide(cost, t.clicks),
    costPerConversion: safeDivide(cost, t.conversions),
  };
}

/** Totais e razões de um conjunto de métricas diárias (cards da página Google Ads). */
export function summarizeDailyMetrics(metrics: readonly MetricLike[]): AdsTotals {
  const totals = { impressions: 0, clicks: 0, cost: 0, conversions: 0 };
  for (const m of metrics) {
    totals.impressions += num(m.impressions);
    totals.clicks += num(m.clicks);
    totals.cost += num(m.cost);
    totals.conversions += num(m.conversions);
  }
  return withRatios(totals);
}

export interface AdsDayPoint extends AdsTotals {
  date: string;
  label: string;
  /** Leads google_ads criados no dia (Bahia) — "leads reais no CRM" */
  crmLeads: number;
  /** cost / crmLeads — CPL real (regra 7) */
  costPerCrmLead: number | null;
}

/**
 * Série diária do Google Ads (todas as campanhas somadas) cruzada com os leads do CRM:
 * CTR, CPC, custo por conversão e conversões do Google Ads × leads google_ads reais.
 */
export function adsDailySeries(
  metrics: readonly MetricLike[],
  leads: ReadonlyArray<Pick<Lead, "created_at" | "source">>,
  fromKey: string,
  toKey: string,
): AdsDayPoint[] {
  const byDay = new Map<string, { impressions: number; clicks: number; cost: number; conversions: number }>();
  for (const m of metrics) {
    const key = m.date.slice(0, 10);
    const acc = byDay.get(key) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0 };
    acc.impressions += num(m.impressions);
    acc.clicks += num(m.clicks);
    acc.cost += num(m.cost);
    acc.conversions += num(m.conversions);
    byDay.set(key, acc);
  }
  const leadsByDay = new Map<string, number>();
  for (const lead of leads) {
    if (lead.source !== "google_ads") continue;
    const key = toDateKey(lead.created_at);
    leadsByDay.set(key, (leadsByDay.get(key) ?? 0) + 1);
  }
  return eachDateKey(fromKey, toKey).map((date) => {
    const totals = withRatios(byDay.get(date) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0 });
    const crmLeads = leadsByDay.get(date) ?? 0;
    return { date, label: dayLabel(date), ...totals, crmLeads, costPerCrmLead: safeDivide(totals.cost, crmLeads) };
  });
}

export interface CampaignSummary extends AdsTotals {
  campaign: string;
  /** Leads do CRM contados pelo banco (daily_metrics.leads_total) */
  leadsTotal: number;
  leadsAgendados: number;
  /** cost / leadsTotal */
  costPerLead: number | null;
  /** cost / leadsAgendados */
  costPerScheduled: number | null;
  /** Dias com métrica lançada */
  days: number;
}

/** Totais por campanha (agrupa sem diferenciar maiúsculas/espaços), ordenados por custo. */
export function groupDailyMetricsByCampaign(
  metrics: ReadonlyArray<MetricLike & Pick<DailyMetric, "campaign" | "leads_total" | "leads_agendados">>,
): CampaignSummary[] {
  const groups = new Map<
    string,
    {
      campaign: string;
      impressions: number;
      clicks: number;
      cost: number;
      conversions: number;
      leadsTotal: number;
      leadsAgendados: number;
      days: Set<string>;
    }
  >();
  for (const m of metrics) {
    const name = m.campaign.replace(/\s+/g, " ").trim();
    const key = name.toLocaleLowerCase("pt-BR");
    let g = groups.get(key);
    if (!g) {
      g = { campaign: name, impressions: 0, clicks: 0, cost: 0, conversions: 0, leadsTotal: 0, leadsAgendados: 0, days: new Set() };
      groups.set(key, g);
    }
    g.impressions += num(m.impressions);
    g.clicks += num(m.clicks);
    g.cost += num(m.cost);
    g.conversions += num(m.conversions);
    g.leadsTotal += num(m.leads_total);
    g.leadsAgendados += num(m.leads_agendados);
    g.days.add(m.date.slice(0, 10));
  }
  return [...groups.values()]
    .map((g) => {
      const totals = withRatios(g);
      return {
        campaign: g.campaign,
        ...totals,
        leadsTotal: g.leadsTotal,
        leadsAgendados: g.leadsAgendados,
        costPerLead: safeDivide(totals.cost, g.leadsTotal),
        costPerScheduled: safeDivide(totals.cost, g.leadsAgendados),
        days: g.days.size,
      };
    })
    .sort((a, b) => b.cost - a.cost || a.campaign.localeCompare(b.campaign, "pt-BR"));
}

// -----------------------------------------------------------------------------
// Dentista: comparecimento e agenda
// -----------------------------------------------------------------------------

/** Taxa de comparecimento: compareceu / (compareceu + não compareceu) × 100 (null sem base). */
export function attendanceRate(leads: ReadonlyArray<Pick<Lead, "status">>): number | null {
  let attended = 0;
  let missed = 0;
  for (const lead of leads) {
    if (lead.status === "compareceu") attended++;
    else if (lead.status === "nao_compareceu") missed++;
  }
  return percent(attended, attended + missed);
}

/** Status cujo `scheduled_at` representa uma consulta válida (cancelado/perdido ficam de fora). */
export const APPOINTMENT_STATUSES: readonly LeadStatus[] = ["agendado", "confirmado", "compareceu", "nao_compareceu"];

function toTime(input: DateInput): number {
  return input instanceof Date ? input.getTime() : new Date(input).getTime();
}

/**
 * Consultas com `scheduled_at` em [from, to), ordenadas pela data da consulta.
 * Por padrão considera só APPOINTMENT_STATUSES (lead cancelado mantém a data antiga).
 */
export function appointmentsInRange<T extends Pick<Lead, "scheduled_at" | "status">>(
  leads: readonly T[],
  from: DateInput,
  to: DateInput,
  statuses: readonly LeadStatus[] = APPOINTMENT_STATUSES,
): T[] {
  const start = toTime(from);
  const end = toTime(to);
  const allowed = new Set(statuses);
  return leads
    .filter((lead) => {
      if (!lead.scheduled_at || !allowed.has(lead.status)) return false;
      const t = new Date(lead.scheduled_at).getTime();
      return t >= start && t < end;
    })
    .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime());
}

/** Leads criados em [from, to) — útil para separar período atual e anterior de uma única consulta. */
export function filterByCreatedAt<T extends Pick<Lead, "created_at">>(leads: readonly T[], from: DateInput, to: DateInput): T[] {
  const start = toTime(from);
  const end = toTime(to);
  return leads.filter((lead) => {
    const t = new Date(lead.created_at).getTime();
    return t >= start && t < end;
  });
}
