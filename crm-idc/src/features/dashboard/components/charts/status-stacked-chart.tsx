"use client";

import * as React from "react";
import { Bar, BarChart, BarStack, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { STATUS_META } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/format";
import type { LeadStatus } from "@/types/database";
import type { StatusChartPoint, StatusTotal } from "../../lib/admin-dashboard";
import { ChartDataTable } from "./chart-data-table";
import {
  AXIS_TICK,
  CHART_CURSOR_FILL,
  CHART_GRID,
  CHART_MARGIN,
  CHART_SURFACE,
  TooltipRow,
  tooltipDayLabel,
} from "./chart-theme";

const COLUMN_HEIGHT = 260;
const SINGLE_BAR_HEIGHT = 44;

const config = Object.fromEntries(
  Object.values(STATUS_META).map((meta) => [meta.value, { label: meta.title, color: meta.color }]),
) satisfies ChartConfig;

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && value in STATUS_META;
}

export interface StatusStackedChartProps {
  data: readonly StatusChartPoint[];
  /** Status com leads no período (ordem do funil) — define as séries e a legenda. */
  totals: readonly StatusTotal[];
  rangeLabel: string;
}

/**
 * Barras empilhadas "Leads por status" por dia de entrada (status atual).
 * Um único dia ("Hoje") vira uma barra horizontal 100% com a contagem na legenda.
 */
export function StatusStackedChart({ data, totals, rangeLabel }: StatusStackedChartProps) {
  const points = React.useMemo(() => [...data], [data]);
  const statuses = totals.map((t) => t.status);
  const singleDay = points.length === 1;

  const tooltip = (
    <ChartTooltip
      cursor={singleDay ? false : { fill: CHART_CURSOR_FILL }}
      content={(props) => (
        <ChartTooltipContent
          active={props.active}
          label={props.label}
          // Só os status com leads no dia; ordem do funil
          payload={props.payload.filter((item) => Number(item.value) > 0)}
          labelFormatter={singleDay ? undefined : tooltipDayLabel}
          hideLabel={singleDay}
          formatter={(value, name) =>
            isLeadStatus(name) ? (
              <TooltipRow color={STATUS_META[name].color} label={STATUS_META[name].title} value={formatNumber(Number(value))} />
            ) : null
          }
        />
      )}
    />
  );

  const bars = statuses.map((status) => (
    <Bar
      key={status}
      dataKey={status}
      name={status}
      fill={STATUS_META[status].color}
      // 1px de contorno na cor da superfície = 2px de respiro entre segmentos
      stroke={CHART_SURFACE}
      strokeWidth={1}
      maxBarSize={singleDay ? SINGLE_BAR_HEIGHT : 24}
      isAnimationActive={false}
    />
  ));

  return (
    <figure aria-label={`Leads por status — ${rangeLabel}`} className="m-0 space-y-4">
      {singleDay ? (
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: SINGLE_BAR_HEIGHT }}
          initialDimension={{ width: 360, height: SINGLE_BAR_HEIGHT }}
        >
          <BarChart data={points} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="label" hide />
            {tooltip}
            <BarStack radius={6}>{bars}</BarStack>
          </BarChart>
        </ChartContainer>
      ) : (
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: COLUMN_HEIGHT }}
          initialDimension={{ width: 360, height: COLUMN_HEIGHT }}
        >
          <BarChart data={points} margin={CHART_MARGIN} barCategoryGap="20%" accessibilityLayer>
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tick={AXIS_TICK} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tickCount={4}
              tick={AXIS_TICK}
              tickFormatter={(value: number) => formatNumber(value)}
            />
            {tooltip}
            <BarStack radius={[4, 4, 0, 0]}>{bars}</BarStack>
          </BarChart>
        </ChartContainer>
      )}

      <StatusLegend totals={totals} />

      <ChartDataTable
        caption={`Leads por status — ${rangeLabel}`}
        columns={["Dia", ...statuses.map((s) => STATUS_META[s].title), "Total"]}
        rows={points.map((point) => [point.tooltipLabel, ...statuses.map((s) => point[s]), point.total])}
      />
    </figure>
  );
}

/** Legenda com contagem e participação de cada status no período. */
function StatusLegend({ totals }: { totals: readonly StatusTotal[] }) {
  return (
    <ul aria-label="Legenda: leads por status no período" className="flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs">
      {totals.map((item) => (
        <li key={item.status} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.title}</span>
          <span className="text-foreground font-medium tabular-nums">{formatNumber(item.count)}</span>
          <span className="text-muted-foreground tabular-nums">({formatPercent(item.share, 0)})</span>
        </li>
      ))}
    </ul>
  );
}
