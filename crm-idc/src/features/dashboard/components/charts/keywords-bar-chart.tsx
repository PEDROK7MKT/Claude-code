"use client";

import * as React from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BRAND } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { KeywordCount } from "@/lib/metrics";
import { axisLabelWidth, truncateLabel } from "../../lib/labels";
import { ChartDataTable } from "./chart-data-table";
import { AXIS_TICK, CHART_CURSOR_FILL, TooltipRow } from "./chart-theme";

const ROW_HEIGHT = 44;
/** Limite do rótulo no eixo (o tooltip mostra a palavra-chave inteira). */
const MAX_LABEL_CHARS = 18;
const LABEL_FONT_SIZE = 12;

const config = {
  count: { label: "Leads", color: BRAND.primary },
} satisfies ChartConfig;

interface KeywordPoint extends KeywordCount {
  /** Rótulo cortado para o eixo; o tooltip mostra a palavra-chave inteira. */
  short: string;
}

export interface KeywordsBarChartProps {
  keywords: readonly KeywordCount[];
  rangeLabel: string;
}

/** Barras horizontais "Top 5 palavras-chave" por número de leads. */
export function KeywordsBarChart({ keywords, rangeLabel }: KeywordsBarChartProps) {
  const data = React.useMemo<KeywordPoint[]>(
    () => keywords.map((k) => ({ ...k, short: truncateLabel(k.keyword, MAX_LABEL_CHARS) })),
    [keywords],
  );
  const height = Math.max(data.length, 1) * ROW_HEIGHT + 8;
  const axisWidth = axisLabelWidth(data.map((k) => k.short));

  return (
    <figure aria-label={`Top 5 palavras-chave — ${rangeLabel}`} className="m-0">
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height }}
        initialDimension={{ width: 360, height }}
      >
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }} barCategoryGap="28%" accessibilityLayer>
          <XAxis type="number" hide domain={[0, "dataMax"]} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="short"
            tickLine={false}
            axisLine={false}
            width={axisWidth}
            tick={{ ...AXIS_TICK, fontSize: LABEL_FONT_SIZE }}
          />
          <ChartTooltip
            cursor={{ fill: CHART_CURSOR_FILL }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => (
                  <TooltipRow
                    color={BRAND.primary}
                    label={(item.payload as KeywordPoint | undefined)?.keyword ?? "Palavra-chave"}
                    value={`${formatNumber(Number(value))} ${Number(value) === 1 ? "lead" : "leads"}`}
                  />
                )}
              />
            }
          />
          <Bar dataKey="count" name="count" fill={BRAND.primary} radius={[0, 4, 4, 0]} maxBarSize={24}>
            <LabelList
              dataKey="count"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
              fontWeight={600}
              formatter={(value: unknown) => formatNumber(Number(value))}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={`Top 5 palavras-chave — ${rangeLabel}`}
        columns={["Palavra-chave", "Leads"]}
        rows={data.map((k) => [k.keyword, k.count])}
      />
    </figure>
  );
}
