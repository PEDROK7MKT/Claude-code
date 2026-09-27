"use client";

import * as React from "react";
import type { TooltipPayload } from "recharts";

import { BRAND } from "@/lib/constants";

/**
 * Tema dos gráficos do dashboard — hex puro (exportável em SVG/PDF): grade em
 * linha fina e discreta, eixos sem traço, marcas finas com pontas arredondadas.
 */
export const CHART_GRID = "#E5E7EB";
export const CHART_CURSOR_FILL = "#F3F4F6";
export const CHART_SURFACE = "#FFFFFF";
export const AXIS_TICK = { fill: BRAND.muted, fontSize: 11 } as const;
/** Margem direita cabe metade do último rótulo do eixo X ("24/09"), centrado no último ponto. */
export const CHART_MARGIN = { top: 8, right: 20, bottom: 0, left: 0 } as const;
/** Cor neutra da reta de tendência (tracejada) — não compete com a série. */
export const TREND_COLOR = BRAND.muted;

/** Pontos dos gráficos diários carregam o rótulo completo do dia. */
interface WithTooltipLabel {
  tooltipLabel: string;
}

function hasTooltipLabel(value: unknown): value is WithTooltipLabel {
  return typeof value === "object" && value !== null && "tooltipLabel" in value;
}

/** labelFormatter do ChartTooltipContent: "sábado, 26/09/2026". */
export function tooltipDayLabel(_label: React.ReactNode, payload: TooltipPayload): React.ReactNode {
  const point: unknown = payload?.[0]?.payload;
  return hasTooltipLabel(point) ? point.tooltipLabel : null;
}

/** Linha do tooltip: amostra de cor + nome + valor (texto em cor de texto, nunca na cor da série). */
export function TooltipRow({
  color,
  label,
  value,
  dashed = false,
}: {
  color: string;
  label: React.ReactNode;
  value: React.ReactNode;
  dashed?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      {dashed ? (
        <span aria-hidden="true" className="w-2.5 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
      )}
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="text-foreground font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** id seguro para <linearGradient> (useId pode conter ":" — inválido em url(#…)). */
export function useSvgId(prefix: string): string {
  const id = React.useId();
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
