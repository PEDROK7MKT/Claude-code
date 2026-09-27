"use client";

import * as React from "react";
import { Label, Pie, PieChart, type LabelProps } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BRAND } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { DonutSlice } from "../../lib/report";
import { shareLabel } from "../../lib/summary";
import { CHART_SURFACE, ChartDataTable, TooltipRow } from "./chart-theme";

const SIZE = 208;

type DonutDatum = DonutSlice & { fill: string };

function isDonutDatum(value: unknown): value is DonutDatum {
  return typeof value === "object" && value !== null && "source" in value && "fill" in value;
}

/**
 * Donut "Leads por fonte" (cor fixa por fonte) com o total no centro — o total fica
 * dentro do SVG para aparecer também no PDF — e legenda com valor e participação.
 */
export function SourceDonutChart({
  slices,
  total,
  monthLabel,
}: {
  slices: readonly DonutSlice[];
  total: number;
  monthLabel: string;
}) {
  const data = React.useMemo<DonutDatum[]>(() => slices.map((s) => ({ ...s, fill: s.color })), [slices]);
  const config = React.useMemo<ChartConfig>(
    () => Object.fromEntries(slices.map((s) => [s.source, { label: s.label, color: s.color }])),
    [slices],
  );

  const renderCenter = (props: LabelProps): React.ReactElement => {
    const box = props.viewBox;
    if (!box || !("cx" in box)) return <g />;
    const { cx, cy } = box;
    return (
      <g>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={30} fontWeight={700} fill={BRAND.text}>
          {formatNumber(total)}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize={12} fill={BRAND.muted}>
          {total === 1 ? "lead" : "leads"}
        </text>
      </g>
    );
  };

  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-5 @sm:flex-row @sm:gap-6">
        <div className="shrink-0" style={{ width: SIZE, height: SIZE }}>
          <ChartContainer config={config} className="aspect-square h-full w-full" initialDimension={{ width: SIZE, height: SIZE }}>
            <PieChart accessibilityLayer>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => {
                      const slice: unknown = item.payload;
                      if (!isDonutDatum(slice)) return null;
                      return (
                        <TooltipRow
                          color={slice.color}
                          label={slice.label}
                          value={`${formatNumber(Number(value))} · ${shareLabel(slice.value, total)}`}
                        />
                      );
                    }}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="source"
                innerRadius="64%"
                outerRadius="98%"
                paddingAngle={data.length > 1 ? 2 : 0}
                cornerRadius={4}
                stroke={CHART_SURFACE}
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                <Label position="center" content={renderCenter} />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <ul aria-label="Legenda: leads por fonte" className="w-full min-w-0 flex-1 space-y-2.5">
          {slices.map((slice) => (
            <li key={slice.source} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{slice.label}</span>
              <span className="text-foreground font-medium tabular-nums">{formatNumber(slice.value)}</span>
              <span className="text-muted-foreground w-11 text-right text-xs tabular-nums">
                {shareLabel(slice.value, total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ChartDataTable
        caption={`Leads por fonte — ${monthLabel}`}
        columns={["Fonte", "Leads", "Participação"]}
        rows={slices.map((s) => [s.label, s.value, shareLabel(s.value, total)])}
      />
    </div>
  );
}
