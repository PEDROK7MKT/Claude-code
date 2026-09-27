"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatNumber, formatPercent } from "@/lib/format";
import type { StatusBar } from "../../lib/report";
import { AXIS_TICK, CHART_CURSOR_FILL, CHART_GRID, CHART_INK, ChartDataTable, TooltipRow } from "./chart-theme";

const ROW_HEIGHT = 30;

const config = { value: { label: "Leads" } } satisfies ChartConfig;

type FunnelDatum = StatusBar & { fill: string; display: string };

function isFunnelDatum(value: unknown): value is FunnelDatum {
  return typeof value === "object" && value !== null && "status" in value && "display" in value;
}

/**
 * Funil por status atual: barras horizontais finas na cor de cada status (mesmas
 * cores dos badges), com o valor e a participação na ponta da barra.
 */
export function StatusFunnelChart({ bars, monthLabel }: { bars: readonly StatusBar[]; monthLabel: string }) {
  const data = React.useMemo<FunnelDatum[]>(
    () =>
      bars.map((b) => ({
        ...b,
        fill: b.color,
        display: b.share === null ? formatNumber(b.value) : `${formatNumber(b.value)} · ${formatPercent(b.share, 0)}`,
      })),
    [bars],
  );
  const height = data.length * ROW_HEIGHT + 12;

  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height }}
        initialDimension={{ width: 360, height }}
      >
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }} barCategoryGap="24%" accessibilityLayer>
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={108}
            tickLine={false}
            axisLine={false}
            tick={{ ...AXIS_TICK, fill: CHART_INK, fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: CHART_CURSOR_FILL }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(_value, _name, item) => {
                  const datum: unknown = item.payload;
                  if (!isFunnelDatum(datum)) return null;
                  return <TooltipRow color={datum.color} label={datum.label} value={datum.display} />;
                }}
              />
            }
          />
          <Bar dataKey="value" name="value" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
            <LabelList dataKey="display" position="right" offset={8} fill={CHART_INK} fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={`Funil por status — ${monthLabel}`}
        columns={["Status", "Leads", "Participação"]}
        rows={data.map((d) => [d.label, d.value, d.share === null ? "—" : formatPercent(d.share, 0)])}
      />
    </>
  );
}
