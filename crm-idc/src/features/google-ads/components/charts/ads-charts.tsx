"use client";

import { ChartSkeleton } from "@/components/shared/loading-skeletons";
import { formatAxisCount, formatAxisCurrency, formatAxisPercent } from "@/features/google-ads/lib/chart-format";
import { GRANULARITY_LABEL, hasSeriesValues, type AdsChartPoint, type Granularity } from "@/features/google-ads/lib/series";
import type { AdsKpis } from "@/features/google-ads/lib/summary";
import { BRAND } from "@/lib/constants";
import { formatCurrency, formatNumber, formatPercent, safeDivide } from "@/lib/format";
import { ChartCard } from "./chart-card";
import { CHART_HEIGHT } from "./chart-theme";
import { SeriesBarChart, type BarSeries } from "./series-bar-chart";
import { TrendAreaChart } from "./trend-area-chart";

const formatCount = (value: number) => formatNumber(value);
const formatMoney = (value: number) => formatCurrency(value);
const formatPct = (value: number) => formatPercent(value, 2);

const COMPARISON_SERIES: readonly BarSeries[] = [
  {
    key: "conversions",
    label: "Conversões (Google Ads)",
    color: BRAND.primary,
    formatValue: formatCount,
    emptyLabel: "sem lançamento",
  },
  { key: "crmLeads", label: "Leads reais (CRM)", color: BRAND.accent, formatValue: formatCount },
];

const CPC_SERIES: readonly BarSeries[] = [
  { key: "cpc", label: "CPC médio", color: BRAND.primary, formatValue: formatMoney },
];

interface AdsChartsProps {
  series: readonly AdsChartPoint[];
  granularity: Granularity;
  kpis: AdsKpis;
  leadsLoading: boolean;
  leadsError: boolean;
}

/** Gráficos automáticos da spec §4.5: comparativo CRM, CTR, CPC médio e custo por conversão. */
export function AdsCharts({ series, granularity, kpis, leadsLoading, leadsError }: AdsChartsProps) {
  const per = GRANULARITY_LABEL[granularity];
  const hasMetrics = series.some((point) => point.hasData);
  const hasLeads = series.some((point) => point.crmLeads > 0);
  const captureRate = safeDivide(kpis.crmLeads, kpis.conversions);

  return (
    <section aria-labelledby="ads-charts-title" className="space-y-3">
      <h2 id="ads-charts-title" className="sr-only">
        Gráficos do período
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {leadsLoading ? (
          <ChartSkeleton height={CHART_HEIGHT} />
        ) : (
          <ChartCard
            title="Conversões Google Ads × Leads reais no CRM"
            description={`O que o Google Ads registrou e o que chegou de fato no CRM, ${per}.`}
            headline={`${formatNumber(kpis.conversions)} × ${formatNumber(kpis.crmLeads)}`}
            headlineLabel="conversões × leads"
            empty={leadsError || (!hasMetrics && !hasLeads)}
            emptyTitle={leadsError ? "Leads do CRM indisponíveis" : undefined}
            emptyDescription={leadsError ? "Não foi possível carregar os leads para o comparativo." : undefined}
          >
            <SeriesBarChart
              data={series}
              series={COMPARISON_SERIES}
              formatAxis={formatAxisCount}
              yAxisWidth={36}
              allowDecimals={false}
            />
            <figcaption className="text-muted-foreground mt-2 text-xs text-pretty">
              {captureRate === null
                ? "Sem conversões registradas no Google Ads no período."
                : `Os leads reais equivalem a ${formatPercent(captureRate * 100, 0)} das conversões registradas no Google Ads.`}
            </figcaption>
          </ChartCard>
        )}

        <ChartCard
          title={`CTR ${per}`}
          description="Cliques ÷ impressões × 100"
          headline={formatPercent(kpis.ctr, 2)}
          headlineLabel="no período"
          empty={!hasSeriesValues(series, "ctr")}
        >
          <TrendAreaChart
            data={series}
            dataKey="ctr"
            label="CTR"
            color={BRAND.primary}
            formatValue={formatPct}
            formatAxis={formatAxisPercent}
            yAxisWidth={44}
          />
        </ChartCard>

        <ChartCard
          title={`CPC médio ${per}`}
          description="Custo ÷ cliques"
          headline={formatCurrency(kpis.cpc)}
          headlineLabel="no período"
          empty={!hasSeriesValues(series, "cpc")}
        >
          <SeriesBarChart data={series} series={CPC_SERIES} formatAxis={formatAxisCurrency} yAxisWidth={60} />
        </ChartCard>

        <ChartCard
          title={`Custo por conversão ${per}`}
          description="Custo ÷ conversões registradas no Google Ads"
          headline={formatCurrency(kpis.costPerConversion)}
          headlineLabel="no período"
          empty={!hasSeriesValues(series, "costPerConversion")}
          emptyDescription="Sem conversões registradas no período para calcular o custo."
        >
          <TrendAreaChart
            data={series}
            dataKey="costPerConversion"
            label="Custo por conversão"
            color={BRAND.primary}
            formatValue={formatMoney}
            formatAxis={formatAxisCurrency}
            yAxisWidth={64}
          />
        </ChartCard>
      </div>
    </section>
  );
}
