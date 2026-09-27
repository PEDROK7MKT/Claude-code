"use client";

import * as React from "react";
import type { TooltipPayload } from "recharts";

import { BRAND } from "@/lib/constants";

/**
 * Tema dos gráficos do relatório — só cores hex (o SVG é exportado para o PDF):
 * grade em linha fina, eixos discretos, texto em cor de texto (nunca na cor da série).
 * As animações ficam desligadas: o PDF captura o SVG a qualquer momento e ele
 * precisa estar no estado final.
 */
export const CHART_GRID = "#E5E7EB";
export const CHART_SURFACE = "#FFFFFF";
export const CHART_CURSOR_FILL = "#F3F4F6";
export const CHART_INK = BRAND.text;
export const AXIS_TICK = { fill: BRAND.muted, fontSize: 11 } as const;

/** id seguro para <linearGradient> (useId pode conter ":" e outros caracteres). */
export function useSvgId(prefix: string): string {
  const id = React.useId();
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Rótulo completo do tooltip a partir do ponto (campo `tooltipLabel`). */
export function tooltipLabelFromPayload(_label: React.ReactNode, payload: TooltipPayload): React.ReactNode {
  const point: unknown = payload?.[0]?.payload;
  if (typeof point === "object" && point !== null && "tooltipLabel" in point) {
    const label = (point as { tooltipLabel: unknown }).tooltipLabel;
    return typeof label === "string" ? label : null;
  }
  return null;
}

/** Linha do tooltip: amostra de cor + nome + valor. */
export function TooltipRow({
  color,
  label,
  value,
  muted = false,
  line = false,
}: {
  color: string;
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
  /** Amostra em traço (séries de linha) */
  line?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <span
        aria-hidden="true"
        className={line ? "h-0.5 w-3 shrink-0 rounded-full" : "size-2.5 shrink-0 rounded-[2px]"}
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className={muted ? "text-muted-foreground italic" : "text-foreground font-mono font-medium tabular-nums"}>
        {value}
      </span>
    </div>
  );
}

/** Tabela só para leitores de tela — o "gêmeo" acessível de cada gráfico. */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly string[];
  rows: ReadonlyArray<ReadonlyArray<string | number>>;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
