import * as React from "react";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DeltaPillProps {
  /** Variação: em pontos percentuais (kind "percent") ou valor absoluto (kind "absolute"). null = sem base. */
  value: number | null | undefined;
  kind?: "percent" | "absolute";
  /** Formata a magnitude de uma variação absoluta (ex.: `formatDecimal` para a nota). */
  formatAbsolute?: (magnitude: number) => string;
  /** Queda é boa (custos). */
  invert?: boolean;
  /** Complemento do texto para leitores de tela (ex.: "vs período anterior"). */
  context?: string;
  /** `onPrimary`: sobre fundo teal (card em destaque), sempre branco. */
  tone?: "default" | "onPrimary";
  className?: string;
}

/** Variação compacta (↑ 12% / ↓ 3 / —) com cor de acordo com o que é bom. */
export function DeltaPill({
  value,
  kind = "percent",
  formatAbsolute = (m) => String(m),
  invert = false,
  context = "vs período anterior",
  tone = "default",
  className,
}: DeltaPillProps) {
  const onPrimary = tone === "onPrimary";

  if (value == null || !Number.isFinite(value)) {
    return (
      <span className={cn("text-xs", onPrimary ? "text-primary-foreground/80" : "text-muted-foreground", className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sem base de comparação</span>
      </span>
    );
  }

  const magnitude = kind === "percent" ? Math.round(Math.abs(value) * 10) / 10 : Math.abs(value);
  const direction = magnitude === 0 ? "flat" : value > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") !== invert;
  const Arrow = direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : MinusIcon;
  const text = kind === "percent" ? formatPercent(magnitude) : formatAbsolute(magnitude);
  const verb = direction === "up" ? "Aumento de" : direction === "down" ? "Queda de" : "Sem variação";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums",
        onPrimary
          ? "bg-white/15 text-white"
          : good === null
            ? "bg-muted text-muted-foreground"
            : good
              ? "bg-green-500/10 text-green-700"
              : "bg-red-500/10 text-red-700",
        className,
      )}
    >
      <Arrow aria-hidden="true" className="size-3" />
      <span aria-hidden="true">{direction === "flat" ? "0" : text}</span>
      <span className="sr-only">{direction === "flat" ? `${verb} ${context}` : `${verb} ${text} ${context}`}</span>
    </span>
  );
}
