"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";
import type { GmnSeriesPoint } from "../lib/summary";
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
  searchViews: { label: "Busca no Google", color: GMN_COLORS.search },
  mapsViews: { label: "Google Maps", color: GMN_COLORS.maps },
} satisfies ChartConfig;

/** Visualizações do perfil por período: busca + Maps em área empilhada. */
export function GmnViewsChart({ data, className }: { data: GmnSeriesPoint[]; className?: string }) {
  const gradientId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const showDots = data.length < 3;
  const last = data.at(-1);

  return (
    <GmnChartCard
      className={className}
      title="Visualizações do perfil"
      description="Busca no Google + Google Maps, por período (fim do período no eixo)"
      summary={
        last
          ? `Visualizações em ${data.length} períodos. Último período, encerrado em ${last.label}: ` +
            `${formatNumber(last.searchViews)} na busca e ${formatNumber(last.mapsViews)} no Maps, ` +
            `total ${formatNumber(last.totalViews)}.`
          : "Sem dados."
      }
    >
      <ChartContainer config={config} className={CHART_CLASS}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {(["searchViews", "mapsViews"] as const).map((key) => (
              <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config[key].color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={config[key].color} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis {...X_AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} width={48} tickFormatter={axisNumber} />
          <ChartTooltip
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
            content={<ChartTooltipContent labelFormatter={periodTooltipLabel} />}
          />
          {(["searchViews", "mapsViews"] as const).map((key) => (
            <Area
              key={key}
              dataKey={key}
              name={key}
              type="monotone"
              stackId="views"
              stroke={config[key].color}
              strokeWidth={2}
              fill={`url(#${gradientId}-${key})`}
              fillOpacity={1}
              dot={showDots ? pointDot(config[key].color) : false}
              activeDot={pointDot(config[key].color, 5)}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </GmnChartCard>
  );
}
