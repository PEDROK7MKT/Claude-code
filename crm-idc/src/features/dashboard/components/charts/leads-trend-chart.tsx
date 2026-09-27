"use client";

import * as React from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BRAND } from "@/lib/constants";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { TrendPoint } from "../../lib/admin-dashboard";
import { ChartDataTable } from "./chart-data-table";
import {
  AXIS_TICK,
  CHART_GRID,
  CHART_MARGIN,
  CHART_SURFACE,
  TooltipRow,
  TREND_COLOR,
  tooltipDayLabel,
  useSvgId,
} from "./chart-theme";

const CHART_HEIGHT = 260;

const config = {
  count: { label: "Leads", color: BRAND.primary },
  trend: { label: "Tendência", color: TREND_COLOR },
} satisfies ChartConfig;

export interface LeadsTrendChartProps {
  points: readonly TrendPoint[];
  /** Descrição curta para leitores de tela (ex.: "Últimos 30 dias"). */
  rangeLabel: string;
}

/** Linha "Leads por dia" com área suave e reta de tendência tracejada. */
export function LeadsTrendChart({ points, rangeLabel }: LeadsTrendChartProps) {
  const gradientId = useSvgId("leads-area");
  const data = React.useMemo(() => [...points], [points]);
  // Poucos dias: marcadores em todos os pontos; muitos: só no hover.
  const showDots = data.length <= 10;

  return (
    <figure aria-label={`Leads por dia — ${rangeLabel}`} className="m-0">
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height: CHART_HEIGHT }}
        initialDimension={{ width: 360, height: CHART_HEIGHT }}
      >
        <ComposedChart data={data} margin={CHART_MARGIN} accessibilityLayer>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tick={AXIS_TICK} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
            tickCount={4}
            tick={AXIS_TICK}
            domain={[0, "auto"]}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <ChartTooltip
            cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={tooltipDayLabel}
                formatter={(value, name) =>
                  name === "trend" ? (
                    <TooltipRow dashed color={TREND_COLOR} label="Tendência" value={`${formatDecimal(Number(value))}/dia`} />
                  ) : (
                    <TooltipRow color={BRAND.primary} label="Leads" value={formatNumber(Number(value))} />
                  )
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            name="count"
            stroke={BRAND.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${gradientId})`}
            dot={showDots ? { r: 3.5, fill: BRAND.primary, stroke: CHART_SURFACE, strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: BRAND.primary, stroke: CHART_SURFACE, strokeWidth: 2 }}
          />
          <Line
            type="linear"
            dataKey="trend"
            name="trend"
            stroke={TREND_COLOR}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            strokeLinecap="round"
            dot={false}
            activeDot={false}
          />
          <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
        </ComposedChart>
      </ChartContainer>
      <ChartDataTable
        caption={`Leads por dia — ${rangeLabel}`}
        columns={["Dia", "Leads", "Tendência"]}
        rows={data.map((point) => [point.tooltipLabel, point.count, formatDecimal(point.trend)])}
      />
    </figure>
  );
}
