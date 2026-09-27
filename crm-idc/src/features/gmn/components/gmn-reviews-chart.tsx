"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDecimal, formatNumber } from "@/lib/format";
import { ratingAxisDomain, ratingAxisTicks, type GmnSeriesPoint } from "../lib/summary";
import {
  CHART_CLASS,
  GMN_COLORS,
  GRID_COLOR,
  GmnChartCard,
  X_AXIS_PROPS,
  Y_AXIS_PROPS,
  axisNumber,
  periodTooltipLabel,
  pointDot,
} from "./gmn-chart-card";

const config = {
  totalReviews: { label: "Total de avaliações", color: GMN_COLORS.reviews },
  averageRating: { label: "Nota média", color: GMN_COLORS.rating },
} satisfies ChartConfig;

/** Avaliações: total acumulado (barras, eixo esquerdo) e nota média (linha, eixo direito). */
export function GmnReviewsChart({ data, className }: { data: GmnSeriesPoint[]; className?: string }) {
  const domain = ratingAxisDomain(data.map((p) => p.averageRating));
  const ticks = ratingAxisTicks(domain);
  const last = data.at(-1);

  return (
    <GmnChartCard
      className={className}
      title="Avaliações no Google"
      description="Barras: total de avaliações (eixo à esquerda) · Linha: nota média (eixo à direita)"
      summary={
        last
          ? `Avaliações em ${data.length} períodos. Último período, encerrado em ${last.label}: ` +
            `${formatNumber(last.totalReviews)} avaliações no total` +
            (last.averageRating != null ? `, nota média ${formatDecimal(last.averageRating)}.` : ".")
          : "Sem dados."
      }
    >
      <ChartContainer config={config} className={CHART_CLASS}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} yAxisId="reviews" />
          <XAxis {...X_AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} yAxisId="reviews" width={40} tickFormatter={axisNumber} />
          <YAxis
            {...Y_AXIS_PROPS}
            yAxisId="rating"
            orientation="right"
            width={32}
            domain={domain}
            ticks={ticks}
            allowDecimals
            allowDataOverflow
            tickFormatter={(value: number) => formatDecimal(value)}
          />
          <ChartTooltip cursor={{ fill: "#F4F4F5" }} content={<ChartTooltipContent labelFormatter={periodTooltipLabel} />} />
          <Bar
            yAxisId="reviews"
            dataKey="totalReviews"
            name="totalReviews"
            fill={GMN_COLORS.reviews}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Line
            yAxisId="rating"
            dataKey="averageRating"
            name="averageRating"
            type="monotone"
            stroke={GMN_COLORS.rating}
            strokeWidth={2}
            strokeLinecap="round"
            connectNulls
            dot={pointDot(GMN_COLORS.rating)}
            activeDot={pointDot(GMN_COLORS.rating, 5)}
          />
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        </ComposedChart>
      </ChartContainer>
    </GmnChartCard>
  );
}
