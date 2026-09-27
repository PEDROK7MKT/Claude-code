/**
 * Metadados dos gráficos do relatório (título, descrição, legenda, largura no PDF).
 * Usados pelos cards da tela e pela composição do PDF — mesma redação nos dois.
 */
import { BRAND } from "@/lib/constants";
import { formatDateKey } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { foldSourceSlices, type MonthReport } from "./report";
import { shareLabel } from "./summary";

export type ReportChartId = "leads-per-day" | "sources" | "status-funnel" | "ads-vs-crm";

export const REPORT_CHART_IDS: readonly ReportChartId[] = ["leads-per-day", "sources", "status-funnel", "ads-vs-crm"];

/** Atributo que marca o contêiner de cada gráfico na página (captura do SVG para o PDF). */
export const CHART_DATA_ATTRIBUTE = "data-report-chart";

export interface ChartLegendItem {
  label: string;
  color: string;
  /** Valor ao lado do rótulo ("29 · 62%") */
  value?: string;
  /** Amostra em linha (tracejada para tendência) em vez de quadrado */
  line?: "solid" | "dashed";
}

export interface ReportChartSpec {
  id: ReportChartId;
  title: string;
  description: string;
  legend: ChartLegendItem[];
  /** Largura no PDF: página inteira ou meia coluna */
  span: "full" | "half";
  /** Há dados para desenhar (senão a tela mostra o estado vazio e o PDF omite) */
  available: boolean;
}

export const ADS_SERIES = {
  conversions: { label: "Conversões (Google Ads)", color: BRAND.primary },
  crmLeads: { label: "Leads reais (CRM)", color: BRAND.accent },
} as const;

export const DAY_SERIES = {
  count: { label: "Leads", color: BRAND.primary },
  trend: { label: "Tendência", color: BRAND.accent },
} as const;

function periodText(report: MonthReport): string {
  return report.isPartial
    ? `de ${formatDateKey(report.range.fromKey)} até hoje (${formatDateKey(report.throughKey)})`
    : `em ${report.monthLabel}`;
}

export function buildReportChartSpecs(report: MonthReport): ReportChartSpec[] {
  const total = report.current.kpis.total;
  const hasTrend = report.perDay.some((d) => d.trend !== null);
  const donut = foldSourceSlices(report.sources);

  return [
    {
      id: "leads-per-day",
      title: "Leads por dia",
      description: `Entrada de leads ${periodText(report)}${hasTrend ? ", com linha de tendência" : ""}.`,
      legend: hasTrend
        ? [
            { ...DAY_SERIES.count, line: "solid" },
            { ...DAY_SERIES.trend, line: "dashed" },
          ]
        : [],
      span: "full",
      available: total > 0,
    },
    {
      id: "sources",
      title: "Leads por fonte",
      description: "Participação de cada origem no total de leads do mês.",
      legend: donut.map((slice) => ({
        label: slice.label,
        color: slice.color,
        value: `${formatNumber(slice.value)} · ${shareLabel(slice.value, total)}`,
      })),
      span: "half",
      available: total > 0,
    },
    {
      id: "status-funnel",
      title: "Funil por status",
      description: "Status atual dos leads que entraram no mês.",
      legend: [],
      span: "half",
      available: total > 0,
    },
    {
      id: "ads-vs-crm",
      title: "Google Ads: conversões × leads no CRM",
      description: "Conversões registradas pela plataforma e leads do Google Ads que chegaram de fato ao CRM, por dia.",
      legend: [
        { ...ADS_SERIES.conversions },
        { ...ADS_SERIES.crmLeads },
      ],
      span: "full",
      available: report.adsComparison !== null,
    },
  ];
}

/** Spec de um gráfico pelo id (lança se não existir — erro de programação). */
export function chartSpec(specs: readonly ReportChartSpec[], id: ReportChartId): ReportChartSpec {
  const spec = specs.find((s) => s.id === id);
  if (!spec) throw new Error(`Gráfico desconhecido: ${id}`);
  return spec;
}
