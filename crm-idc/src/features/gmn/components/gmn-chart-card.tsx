"use client";

import * as React from "react";
import type { TooltipPayload } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOCALE, BRAND, SOURCE_COLORS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatPeriod } from "../lib/periods";
import type { GmnSeriesPoint } from "../lib/summary";

/** Cores dos gráficos do GMN — hex puro (exportável em SVG/PDF). */
export const GMN_COLORS = {
  search: BRAND.primary,
  maps: BRAND.accent,
  website: BRAND.primary,
  directions: BRAND.accent,
  calls: SOURCE_COLORS.indicacao,
  reviews: BRAND.primary,
  rating: BRAND.accent,
} as const;

/** Grade discreta (um passo acima da superfície branca). */
export const GRID_COLOR = "#E4E4E7";
export const SURFACE_COLOR = "#FFFFFF";

/** Altura padrão dos gráficos de evolução. */
export const CHART_CLASS = "aspect-auto h-[260px] w-full";

/** Props comuns dos eixos (sem linhas de eixo/tick, texto discreto). */
export const X_AXIS_PROPS = {
  dataKey: "label",
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  minTickGap: 28,
  interval: "preserveStartEnd",
} as const;

/** Folga nas pontas do eixo X de linhas/áreas: o rótulo dd/MM/yyyy do último ponto não é cortado. */
export const LINE_X_PADDING = { left: 8, right: 24 } as const;

export const Y_AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 4,
  allowDecimals: false,
} as const;

const compactFmt = new Intl.NumberFormat(APP_LOCALE, { notation: "compact", maximumFractionDigits: 1 });

/** Ticks do eixo Y: 1.520 · 12,5 mil */
export function axisNumber(value: number): string {
  return Math.abs(value) >= 10_000 ? compactFmt.format(value) : formatNumber(value);
}

function isSeriesPoint(value: unknown): value is GmnSeriesPoint {
  return typeof value === "object" && value !== null && "periodStart" in value && "periodEnd" in value;
}

/** Título do tooltip: período completo do ponto ("01/08/2026 – 31/08/2026"). */
export function periodTooltipLabel(label: React.ReactNode, payload: TooltipPayload): React.ReactNode {
  const point: unknown = payload[0]?.payload;
  return isSeriesPoint(point) ? formatPeriod(point.periodStart, point.periodEnd) : label;
}

/** Marcador de ponto com anel branco (legível sobre linhas e áreas). */
export function pointDot(color: string, r = 4) {
  return { r, fill: color, stroke: SURFACE_COLOR, strokeWidth: 2 };
}

export interface GmnChartCardProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Resumo textual do gráfico para leitores de tela */
  summary: string;
}

/** Card padrão dos gráficos de evolução do GMN. */
export function GmnChartCard({ title, description, summary, className, children, ...props }: GmnChartCardProps) {
  return (
    <Card className={cn("gap-4", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <p className="sr-only">{summary}</p>
        {children}
      </CardContent>
    </Card>
  );
}
