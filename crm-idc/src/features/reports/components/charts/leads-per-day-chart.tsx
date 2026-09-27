"use client";

import * as React from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis, type DotItemDotProps } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDecimal, formatNumber } from "@/lib/format";
import { DAY_SERIES } from "../../lib/charts";
import type { DayPoint } from "../../lib/report";
import {
  AXIS_TICK,
  CHART_GRID,
  CHART_INK,
  CHART_SURFACE,
  ChartDataTable,
  TooltipRow,
  tooltipLabelFromPayload,
  useSvgId,
} from "./chart-theme";

const HEIGHT = 260;

const config = {
  count: { label: DAY_SERIES.count.label, color: DAY_SERIES.count.color },
  trend: { label: DAY_SERIES.trend.label, color: DAY_SERIES.trend.color },
} satisfies ChartConfig;

function leadsText(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? "lead" : "leads"}`;
}

/** Leads por dia: área suave com o pico rotulado e linha de tendência tracejada. */
export function LeadsPerDayChart({ data, monthLabel }: { data: readonly DayPoint[]; monthLabel: string }) {
  const gradientId = useSvgId("report-leads-fill");
  const points = React.useMemo(() => [...data], [data]);
  const hasTrend = points.some((p) => p.trend !== null);
  const peakIndex = points.reduce((best, p, i) => (p.count > (points[best]?.count ?? 0) ? i : best), 0);
  const peak = points[peakIndex];

  const renderDot = (props: DotItemDotProps): React.ReactElement<SVGElement> => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null || index !== peakIndex || !peak || peak.count === 0) {
      return <g key={`dot-${index}`} />;
    }
    // só o pico ganha rótulo (rotular todos os pontos vira ruído)
    return (
      <g key={`dot-${index}`}>
        <circle cx={cx} cy={cy} r={4.5} fill={DAY_SERIES.count.color} stroke={CHART_SURFACE} strokeWidth={2} />
        <text x={cx} y={cy - 11} textAnchor="middle" fontSize={11} fontWeight={600} fill={CHART_INK}>
          {formatNumber(peak.count)}
        </text>
      </g>
    );
  };

  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height: HEIGHT }}
        initialDimension={{ width: 640, height: HEIGHT }}
      >
        <ComposedChart data={points} margin={{ top: 22, right: 12, bottom: 0, left: -8 }} accessibilityLayer>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={DAY_SERIES.count.color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={DAY_SERIES.count.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18} tick={AXIS_TICK} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tickCount={4}
            tick={AXIS_TICK}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <ChartTooltip
            cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={tooltipLabelFromPayload}
                formatter={(value, _name, item) =>
                  item.dataKey === "trend" ? (
                    <TooltipRow
                      line
                      color={DAY_SERIES.trend.color}
                      label={DAY_SERIES.trend.label}
                      value={typeof value === "number" ? formatDecimal(value) : "—"}
                    />
                  ) : (
                    <TooltipRow
                      color={DAY_SERIES.count.color}
                      label="Leads"
                      value={typeof value === "number" ? leadsText(value) : "—"}
                    />
                  )
                }
              />
            }
          />
          {hasTrend ? <ChartLegend verticalAlign="top" align="right" content={<ChartLegendContent />} /> : null}
          <Area
            type="monotone"
            dataKey="count"
            name="count"
            stroke={DAY_SERIES.count.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${gradientId})`}
            dot={renderDot}
            activeDot={{ r: 5, fill: DAY_SERIES.count.color, stroke: CHART_SURFACE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {hasTrend ? (
            <Line
              type="linear"
              dataKey="trend"
              name="trend"
              stroke={DAY_SERIES.trend.color}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>
      <ChartDataTable
        caption={`Leads por dia — ${monthLabel}`}
        columns={["Dia", "Leads"]}
        rows={points.map((p) => [p.tooltipLabel, p.count])}
      />
    </>
  );
}
