"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { SOURCE_COLORS, SOURCE_LABEL } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/format";
import type { LeadSource } from "@/types/database";
import type { SourceShare } from "../../lib/admin-dashboard";
import { ChartDataTable } from "./chart-data-table";
import { CHART_SURFACE, TooltipRow } from "./chart-theme";

const DONUT_SIZE = 200;

const config = Object.fromEntries(
  (Object.keys(SOURCE_LABEL) as LeadSource[]).map((source) => [
    source,
    { label: SOURCE_LABEL[source], color: SOURCE_COLORS[source] },
  ]),
) satisfies ChartConfig;

export interface SourceDonutChartProps {
  slices: readonly SourceShare[];
  rangeLabel: string;
}

/** Donut "Leads por fonte" com o total no centro e legenda com participação (%). */
export function SourceDonutChart({ slices, rangeLabel }: SourceDonutChartProps) {
  const data = React.useMemo(() => [...slices], [slices]);
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const shareBySource = new Map(data.map((slice) => [slice.source, slice.share]));

  // Container query: o card pode ser estreito mesmo em telas largas (coluna ao lado do GMN)
  return (
    <div className="@container">
      <figure
        aria-label={`Leads por fonte — ${rangeLabel}`}
        className="m-0 flex flex-col items-center gap-5 @sm:flex-row @sm:gap-6"
      >
        <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <ChartContainer
            config={config}
            className="aspect-square h-full w-full"
            initialDimension={{ width: DONUT_SIZE, height: DONUT_SIZE }}
          >
            <PieChart accessibilityLayer>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    nameKey="source"
                    formatter={(value, _name, item) => {
                      const source = (item.payload as SourceShare | undefined)?.source;
                      if (!source) return null;
                      return (
                        <TooltipRow
                          color={SOURCE_COLORS[source]}
                          label={SOURCE_LABEL[source]}
                          value={`${formatNumber(Number(value))} · ${formatPercent(shareBySource.get(source) ?? 0)}`}
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
                outerRadius="100%"
                paddingAngle={data.length > 1 ? 2 : 0}
                cornerRadius={4}
                stroke={CHART_SURFACE}
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
              />
            </PieChart>
          </ChartContainer>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-foreground text-3xl leading-none font-bold tracking-tight tabular-nums">
              {formatNumber(total)}
            </span>
            <span className="text-muted-foreground mt-1 text-xs">{total === 1 ? "lead" : "leads"}</span>
          </div>
        </div>

        <ul aria-label="Legenda: leads por fonte" className="w-full min-w-0 flex-1 space-y-2.5">
          {data.map((slice) => (
            <li key={slice.source} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{slice.label}</span>
              <span className="text-foreground font-medium tabular-nums">{formatNumber(slice.value)}</span>
              <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">{formatPercent(slice.share)}</span>
            </li>
          ))}
        </ul>

        <ChartDataTable
          caption={`Leads por fonte — ${rangeLabel}`}
          columns={["Fonte", "Leads", "Participação"]}
          rows={data.map((slice) => [slice.label, slice.value, formatPercent(slice.share)])}
        />
      </figure>
    </div>
  );
}
