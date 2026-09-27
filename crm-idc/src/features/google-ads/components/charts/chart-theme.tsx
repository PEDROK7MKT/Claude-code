"use client";

import * as React from "react";
import type { TooltipPayload } from "recharts";

import { BRAND } from "@/lib/constants";
import type { AdsChartPoint } from "@/features/google-ads/lib/series";

/**
 * Tema dos gráficos do Google Ads — cores em hex puro (exportáveis em SVG/PDF):
 * grade em linha fina, eixos discretos, marcas finas com pontas arredondadas.
 */
export const CHART_HEIGHT = 240;
export const CHART_GRID = "#E5E7EB";
export const CHART_CURSOR_FILL = "#F3F4F6";
export const CHART_SURFACE = "#FFFFFF";
export const AXIS_TICK = { fill: BRAND.muted, fontSize: 11 } as const;
export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 } as const;
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

function isChartPoint(value: unknown): value is AdsChartPoint {
  return typeof value === "object" && value !== null && "tooltipLabel" in value;
}

/** Ponto do gráfico a partir do payload do tooltip do Recharts. */
export function pointFromPayload(payload: TooltipPayload | undefined): AdsChartPoint | null {
  const point: unknown = payload?.[0]?.payload;
  return isChartPoint(point) ? point : null;
}

/** Rótulo completo do tooltip ("ter, 01/09/2026", "Semana …"). */
export function tooltipLabel(_label: React.ReactNode, payload: TooltipPayload): React.ReactNode {
  return pointFromPayload(payload)?.tooltipLabel ?? null;
}

/** Linha do tooltip: amostra de cor + nome + valor (texto sempre em cor de texto). */
export function TooltipValueRow({
  color,
  label,
  value,
  muted = false,
}: {
  color: string;
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground flex-1">{label}</span>
      <span
        className={
          muted ? "text-muted-foreground italic" : "text-foreground font-mono font-medium tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

/** id seguro para <linearGradient> (useId pode conter caracteres inválidos em url(#…)). */
export function useSvgId(prefix: string): string {
  const id = React.useId();
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
