"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, type DotItemDotProps } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AdsChartPoint } from "@/features/google-ads/lib/series";
import {
  AXIS_TICK,
  CHART_GRID,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_SURFACE,
  TooltipValueRow,
  tooltipLabel,
  useSvgId,
} from "./chart-theme";

type RatioKey = "ctr" | "cpc" | "costPerConversion";

interface TrendAreaChartProps {
  data: readonly AdsChartPoint[];
  dataKey: RatioKey;
  /** Nome da série (tooltip) */
  label: string;
  color: string;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  yAxisWidth?: number;
}

/**
 * Linha com área suave para razões diárias (CTR, custo por conversão).
 * Dias sem lançamento ficam como lacuna; pontos isolados ganham marcador para não sumir.
 */
export function TrendAreaChart({
  data,
  dataKey,
  label,
  color,
  formatValue,
  formatAxis,
  yAxisWidth = 48,
}: TrendAreaChartProps) {
  const gradientId = useSvgId(`fill-${dataKey}`);
  const config = React.useMemo<ChartConfig>(() => ({ [dataKey]: { label, color } }), [dataKey, label, color]);
  const showAllDots = data.length <= 14;

  const renderDot = (props: DotItemDotProps): React.ReactNode => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return null;
    const current = data[index]?.[dataKey];
    const isolated = current != null && data[index - 1]?.[dataKey] == null && data[index + 1]?.[dataKey] == null;
    if (!showAllDots && !isolated) return null;
    return (
      <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={color} stroke={CHART_SURFACE} strokeWidth={2} />
    );
  };

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: CHART_HEIGHT }}
      initialDimension={{ width: 360, height: CHART_HEIGHT }}
    >
      <AreaChart data={[...data]} margin={CHART_MARGIN} accessibilityLayer>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} tick={AXIS_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={yAxisWidth}
          tickCount={4}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => formatAxis(value)}
        />
        <ChartTooltip
          cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              labelFormatter={tooltipLabel}
              formatter={(value) => (
                <TooltipValueRow
                  color={color}
                  label={label}
                  value={typeof value === "number" ? formatValue(value) : "sem lançamento"}
                  muted={typeof value !== "number"}
                />
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={label}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#${gradientId})`}
          connectNulls={false}
          dot={renderDot}
          activeDot={{ r: 5, fill: color, stroke: CHART_SURFACE, strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
