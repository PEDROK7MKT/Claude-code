"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdsChartPoint } from "@/features/google-ads/lib/series";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_CURSOR_FILL,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  TooltipValueRow,
  tooltipLabel,
} from "./chart-theme";

type NumericKey = "cpc" | "conversions" | "crmLeads" | "cost" | "clicks";

export interface BarSeries {
  key: NumericKey;
  label: string;
  color: string;
  formatValue: (value: number) => string;
  /** Texto do tooltip quando o valor é null (ex.: dia sem lançamento) */
  emptyLabel?: string;
}

interface SeriesBarChartProps {
  data: readonly AdsChartPoint[];
  series: readonly BarSeries[];
  formatAxis: (value: number) => string;
  yAxisWidth?: number;
  allowDecimals?: boolean;
}

/**
 * Colunas finas (máx. 24px, pontas arredondadas) — uma série (CPC) ou agrupadas
 * (conversões do Google Ads × leads reais do CRM, com legenda). Valores null não desenham barra.
 */
export function SeriesBarChart({
  data,
  series,
  formatAxis,
  yAxisWidth = 48,
  allowDecimals = true,
}: SeriesBarChartProps) {
  const config = React.useMemo<ChartConfig>(
    () => Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])),
    [series],
  );
  const grouped = series.length > 1;

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: CHART_HEIGHT + (grouped ? 28 : 0) }}
      initialDimension={{ width: 360, height: CHART_HEIGHT }}
    >
      <BarChart data={[...data]} margin={CHART_MARGIN} barGap={2} barCategoryGap="22%" accessibilityLayer>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} tick={AXIS_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={yAxisWidth}
          tickCount={4}
          allowDecimals={allowDecimals}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => formatAxis(value)}
        />
        <ChartTooltip
          cursor={{ fill: CHART_CURSOR_FILL }}
          content={
            <ChartTooltipContent
              labelFormatter={tooltipLabel}
              formatter={(value, _name, item) => {
                const s = series.find((entry) => entry.key === item.dataKey) ?? series[0];
                const numeric = typeof value === "number";
                return (
                  <TooltipValueRow
                    color={s.color}
                    label={s.label}
                    value={numeric ? s.formatValue(value) : (s.emptyLabel ?? "sem lançamento")}
                    muted={!numeric}
                  />
                );
              }}
            />
          }
        />
        {grouped ? <ChartLegend verticalAlign="top" content={<ChartLegendContent />} /> : null}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={BAR_RADIUS} maxBarSize={24} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
