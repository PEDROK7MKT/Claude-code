/**
 * KPIs do resumo automático (mesma lista na tela e no PDF): valor formatado,
 * texto auxiliar e variação vs mês anterior. Funções puras.
 */
import { formatDateKey } from "@/lib/dates";
import { formatCurrency, formatDecimal, formatNumber, formatPercent, percentChange } from "@/lib/format";
import type { MonthReport, PeriodStats } from "./report";

export type ReportKpiId =
  | "leads"
  | "scheduled"
  | "schedulingRate"
  | "attended"
  | "attendanceRate"
  | "investment"
  | "costPerLead"
  | "costPerScheduled"
  | "costPerGoogleAdsLead"
  | "clicks"
  | "ctr"
  | "gmnRating";

export interface ReportKpi {
  id: ReportKpiId;
  label: string;
  /** Valor já formatado ("47", "R$ 42,10", "38%", "—") */
  value: string;
  hint?: string;
  /**
   * Variação % vs mês anterior (semântica do KpiCard): undefined oculta,
   * null = sem base de comparação.
   */
  change?: number | null;
  /** Métricas de custo: queda é boa */
  invertChange?: boolean;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Variação entre dois valores (undefined quando algum lado é desconhecido). */
function change(current: number | null | undefined, previous: number | null | undefined): number | null | undefined {
  if (current == null || previous === undefined) return undefined;
  if (previous === null) return null;
  return percentChange(current, previous);
}

type Pick2 = (stats: PeriodStats) => number | null;

/** Variação de um KPI de leads (existe sempre que o mês anterior carregou). */
function leadChange(report: MonthReport, pick: Pick2): number | null | undefined {
  if (!report.previous) return undefined;
  return change(pick(report.current), pick(report.previous));
}

/** Variação de um KPI do Google Ads (exige métricas lançadas nos dois meses). */
function adsChange(report: MonthReport, pick: Pick2): number | null | undefined {
  if (report.current.adsState !== "ready" || !report.previous || report.previous.adsState === "unavailable") {
    return undefined;
  }
  if (report.previous.adsState === "empty") return null;
  return change(pick(report.current), pick(report.previous));
}

function adsHint(stats: PeriodStats, readyHint: string): string {
  if (stats.adsState === "unavailable") return "Métricas do Google Ads indisponíveis";
  if (stats.adsState === "empty") return "Sem métricas do Google Ads no mês";
  return readyHint;
}

export function buildReportKpis(report: MonthReport): ReportKpi[] {
  const { current } = report;
  const k = current.kpis;
  const ads = current.ads;
  const gmn = report.gmn;

  return [
    {
      id: "leads",
      label: "Leads totais",
      value: formatNumber(k.total),
      hint: `${plural(k.googleAdsLeads, "veio", "vieram")} do Google Ads`,
      change: leadChange(report, (s) => s.kpis.total),
    },
    {
      id: "scheduled",
      label: "Agendamentos",
      value: formatNumber(k.scheduled),
      hint: "agendado, confirmado ou compareceu",
      change: leadChange(report, (s) => s.kpis.scheduled),
    },
    {
      id: "schedulingRate",
      label: "Taxa de agendamento",
      value: formatPercent(k.schedulingRate),
      hint: `${formatNumber(k.scheduled)} de ${plural(k.total, "lead", "leads")}`,
      change: leadChange(report, (s) => s.kpis.schedulingRate),
    },
    {
      id: "attended",
      label: "Comparecimentos",
      value: formatNumber(current.attended),
      hint:
        current.missed === 0
          ? "nenhuma falta registrada"
          : `${plural(current.missed, "falta registrada", "faltas registradas")}`,
      change: leadChange(report, (s) => s.attended),
    },
    {
      id: "attendanceRate",
      label: "Taxa de comparecimento",
      value: formatPercent(current.attendanceRate),
      hint:
        current.attendanceRate === null
          ? "sem consultas concluídas"
          : `${formatNumber(current.attended)} de ${plural(current.attended + current.missed, "consulta", "consultas")}`,
      change: leadChange(report, (s) => s.attendanceRate),
    },
    {
      id: "investment",
      label: "Investimento Google Ads",
      value: ads ? formatCurrency(ads.cost) : "—",
      hint: adsHint(current, plural(current.adsDays, "dia com métricas", "dias com métricas")),
      change: adsChange(report, (s) => s.ads?.cost ?? null),
    },
    {
      id: "costPerLead",
      label: "CPL",
      value: formatCurrency(k.costPerLead),
      hint: adsHint(current, "investimento ÷ leads totais"),
      change: adsChange(report, (s) => s.kpis.costPerLead),
      invertChange: true,
    },
    {
      id: "costPerScheduled",
      label: "Custo por agendamento",
      value: formatCurrency(k.costPerScheduled),
      hint: adsHint(current, "investimento ÷ agendamentos"),
      change: adsChange(report, (s) => s.kpis.costPerScheduled),
      invertChange: true,
    },
    {
      id: "costPerGoogleAdsLead",
      label: "CPL real Google Ads",
      value: formatCurrency(k.costPerGoogleAdsLead),
      hint: adsHint(
        current,
        `investimento ÷ ${plural(current.googleAdsLeadsOnMetricDays, "lead do Google Ads", "leads do Google Ads")}${
          current.googleAdsLeadsOnMetricDays < k.googleAdsLeads ? " dos dias lançados" : ""
        }`,
      ),
      change: adsChange(report, (s) => s.kpis.costPerGoogleAdsLead),
      invertChange: true,
    },
    {
      id: "clicks",
      label: "Cliques",
      value: ads ? formatNumber(ads.clicks) : "—",
      hint: adsHint(current, ads ? `${plural(ads.impressions, "impressão", "impressões")}` : ""),
      change: adsChange(report, (s) => s.ads?.clicks ?? null),
    },
    {
      id: "ctr",
      label: "CTR",
      value: ads ? formatPercent(ads.ctr, 2) : "—",
      hint: adsHint(current, "cliques ÷ impressões"),
      change: adsChange(report, (s) => s.ads?.ctr ?? null),
    },
    {
      id: "gmnRating",
      label: "Nota GMN",
      value: gmn?.rating != null ? formatDecimal(gmn.rating) : "—",
      hint: gmn
        ? `${plural(gmn.totalReviews, "avaliação", "avaliações")} · até ${formatDateKey(gmn.periodEnd)}`
        : "Sem registro do Google Meu Negócio",
    },
  ];
}

/** "+12%", "-8%", "0%" (variação arredondada, para textos e PDF); null → null. */
export function formatChange(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "-"}${formatPercent(Math.abs(rounded), 0)}`;
}

/** Direção da variação considerando se alta é boa: "good" | "bad" | "neutral". */
export function changeTone(value: number | null | undefined, invert = false): "good" | "bad" | "neutral" {
  if (value == null || !Number.isFinite(value) || Math.round(value) === 0) return "neutral";
  return (value > 0) !== invert ? "good" : "bad";
}
