"use client";

import * as React from "react";

import { ChartSkeleton } from "@/components/shared/loading-skeletons";
import { formatDecimal, formatNumber } from "@/lib/format";
import { chartSpec, type ReportChartSpec } from "../lib/charts";
import { foldSourceSlices, type MonthReport } from "../lib/report";
import { shareLabel } from "../lib/summary";
import { AdsVsCrmChart } from "./charts/ads-vs-crm-chart";
import { LeadsPerDayChart } from "./charts/leads-per-day-chart";
import { ReportChartCard } from "./charts/report-chart-card";
import { SourceDonutChart } from "./charts/source-donut-chart";
import { StatusFunnelChart } from "./charts/status-funnel-chart";

interface ReportChartsProps {
  report: MonthReport;
  specs: readonly ReportChartSpec[];
  isAdmin: boolean;
  adsLoading: boolean;
}

/** Gráficos do período (spec §4.7): leads por dia, fontes, funil e Google Ads × CRM. */
export function ReportCharts({ report, specs, isAdmin, adsLoading }: ReportChartsProps) {
  const total = report.current.kpis.total;
  const days = report.perDay.length;
  const slices = React.useMemo(() => foldSourceSlices(report.sources), [report.sources]);
  const ads = report.current.ads;
  const googleAdsLeads = report.current.kpis.googleAdsLeads;

  const adsEmpty =
    report.current.adsState === "unavailable"
      ? {
          title: "Métricas do Google Ads indisponíveis",
          description: "Não foi possível carregar as métricas agora. Verifique a conexão e tente novamente.",
        }
      : {
          title: `Sem métricas do Google Ads em ${report.monthLabel}`,
          description: isAdmin
            ? "Lance os dados diários (ou importe o CSV do Google Ads) para comparar conversões com os leads reais."
            : "Quando o gestor de tráfego lançar as métricas do Google Ads, o comparativo aparecerá aqui.",
        };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReportChartCard
        spec={chartSpec(specs, "leads-per-day")}
        className="lg:col-span-2"
        headline={formatNumber(total)}
        headlineLabel={days > 0 ? `média de ${formatDecimal(total / days)} por dia` : undefined}
      >
        <LeadsPerDayChart data={report.perDay} monthLabel={report.monthLabel} />
      </ReportChartCard>

      <ReportChartCard spec={chartSpec(specs, "sources")}>
        <SourceDonutChart slices={slices} total={total} monthLabel={report.monthLabel} />
      </ReportChartCard>

      <ReportChartCard
        spec={chartSpec(specs, "status-funnel")}
        headline={shareLabel(report.current.kpis.scheduled, total)}
        headlineLabel="taxa de agendamento"
      >
        <StatusFunnelChart bars={report.statusBars} monthLabel={report.monthLabel} />
      </ReportChartCard>

      {adsLoading ? (
        <ChartSkeleton height={280} className="lg:col-span-2" />
      ) : (
        <ReportChartCard
          spec={chartSpec(specs, "ads-vs-crm")}
          className="lg:col-span-2"
          headline={ads ? `${formatNumber(ads.conversions)} × ${formatNumber(googleAdsLeads)}` : undefined}
          headlineLabel="conversões × leads reais"
          emptyTitle={adsEmpty.title}
          emptyDescription={adsEmpty.description}
          emptyAction={
            isAdmin && report.current.adsState === "empty"
              ? { label: "Lançar métricas", href: "/google-ads", variant: "outline" }
              : undefined
          }
        >
          {report.adsComparison ? <AdsVsCrmChart data={report.adsComparison} monthLabel={report.monthLabel} /> : null}
        </ReportChartCard>
      )}
    </div>
  );
}
