"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
  LINE_X_PADDING,
  X_AXIS_PROPS,
  Y_AXIS_PROPS,
  axisNumber,
  periodTooltipLabel,
  pointDot,
} from "./gmn-chart-card";

const config = {
  websiteClicks: { label: "Cliques no site", color: GMN_COLORS.website },
  directionRequests: { label: "Rotas", color: GMN_COLORS.directions },
  phoneCalls: { label: "Ligações", color: GMN_COLORS.calls },
} satisfies ChartConfig;

const SERIES = ["websiteClicks", "directionRequests", "phoneCalls"] as const;

/** Ações dos clientes no perfil: cliques no site, rotas e ligações. */
export function GmnActionsChart({ data, className }: { data: GmnSeriesPoint[]; className?: string }) {
  const last = data.at(-1);

  return (
    <GmnChartCard
      className={className}
      title="Ações no perfil"
      description="Cliques no site, solicitações de rota e ligações por período"
      summary={
        last
          ? `Ações em ${data.length} períodos. Último período, encerrado em ${last.label}: ` +
            `${formatNumber(last.websiteClicks)} cliques no site, ${formatNumber(last.directionRequests)} rotas ` +
            `e ${formatNumber(last.phoneCalls)} ligações.`
          : "Sem dados."
      }
    >
      <ChartContainer config={config} className={CHART_CLASS}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis {...X_AXIS_PROPS} padding={LINE_X_PADDING} />
          <YAxis {...Y_AXIS_PROPS} width={40} tickFormatter={axisNumber} />
          <ChartTooltip
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
            content={<ChartTooltipContent labelFormatter={periodTooltipLabel} />}
          />
          {SERIES.map((key) => (
            <Line
              key={key}
              dataKey={key}
              name={key}
              type="monotone"
              stroke={config[key].color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={data.length > 12 ? false : pointDot(config[key].color, 3)}
              activeDot={pointDot(config[key].color, 5)}
            />
          ))}
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
    </GmnChartCard>
  );
}
