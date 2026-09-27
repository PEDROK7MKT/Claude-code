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
import { formatNumber } from "@/lib/format";
import { ADS_SERIES } from "../../lib/charts";
import type { AdsComparisonPoint } from "../../lib/report";
import {
  AXIS_TICK,
  CHART_CURSOR_FILL,
  CHART_GRID,
  ChartDataTable,
  TooltipRow,
  tooltipLabelFromPayload,
} from "./chart-theme";

const HEIGHT = 280;

const config = {
  conversions: { label: ADS_SERIES.conversions.label, color: ADS_SERIES.conversions.color },
  crmLeads: { label: ADS_SERIES.crmLeads.label, color: ADS_SERIES.crmLeads.color },
} satisfies ChartConfig;

/** Colunas agrupadas por dia: conversões do Google Ads × leads do Google Ads que chegaram ao CRM. */
export function AdsVsCrmChart({ data, monthLabel }: { data: readonly AdsComparisonPoint[]; monthLabel: string }) {
  const points = React.useMemo(() => [...data], [data]);

  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height: HEIGHT }}
        initialDimension={{ width: 640, height: HEIGHT }}
      >
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2} barCategoryGap="18%" accessibilityLayer>
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
            cursor={{ fill: CHART_CURSOR_FILL }}
            content={
              <ChartTooltipContent
                labelFormatter={tooltipLabelFromPayload}
                formatter={(value, _name, item) => {
                  const series = item.dataKey === "crmLeads" ? ADS_SERIES.crmLeads : ADS_SERIES.conversions;
                  const numeric = typeof value === "number";
                  return (
                    <TooltipRow
                      color={series.color}
                      label={series.label}
                      value={numeric ? formatNumber(value) : "sem lançamento"}
                      muted={!numeric}
                    />
                  );
                }}
              />
            }
          />
          <ChartLegend verticalAlign="top" align="right" content={<ChartLegendContent />} />
          <Bar
            dataKey="conversions"
            name="conversions"
            fill={ADS_SERIES.conversions.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={14}
            isAnimationActive={false}
          />
          <Bar
            dataKey="crmLeads"
            name="crmLeads"
            fill={ADS_SERIES.crmLeads.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={14}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={`Conversões do Google Ads × leads no CRM — ${monthLabel}`}
        columns={["Dia", "Conversões (Google Ads)", "Leads reais (CRM)"]}
        rows={points.map((p) => [p.tooltipLabel, p.conversions ?? "sem lançamento", p.crmLeads])}
      />
    </>
  );
}
