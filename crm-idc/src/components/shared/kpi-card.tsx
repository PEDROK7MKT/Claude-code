import * as React from "react";
import { ArrowDownIcon, ArrowUpIcon, type LucideIcon, MinusIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface KpiCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  icon: LucideIcon;
  /** Valor já formatado (ex.: `formatCurrency(12.5)`, `formatNumber(47)`). */
  value: React.ReactNode;
  /** Texto auxiliar abaixo do valor (ex.: "12 agendamentos"). */
  hint?: React.ReactNode;
  /**
   * Variação percentual vs período anterior, em pontos percentuais (12.5 = 12,5%).
   * `undefined` oculta o indicador; `null` mostra "—" (sem base de comparação).
   */
  change?: number | null;
  changeLabel?: string;
  /** Para métricas de custo: queda é boa (verde) e alta é ruim (vermelho). */
  invertChange?: boolean;
  loading?: boolean;
  /** `highlight`: card em destaque na cor primária (ex.: "Leads novos hoje"). */
  variant?: "default" | "highlight";
}

/** Card de KPI do dashboard (spec §12): valor grande + ↑/↓ % vs período anterior. */
export function KpiCard({
  title,
  icon: Icon,
  value,
  hint,
  change,
  changeLabel = "vs período anterior",
  invertChange = false,
  loading = false,
  variant = "default",
  className,
  ...props
}: KpiCardProps) {
  const highlight = variant === "highlight";

  return (
    <Card
      data-slot="kpi-card"
      aria-busy={loading || undefined}
      className={cn(
        "gap-4 py-5",
        highlight && "bg-primary text-primary-foreground border-primary",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5 px-5">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-white/15 text-white" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
        <h3
          className={cn(
            "min-w-0 truncate text-sm font-medium",
            highlight ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {title}
        </h3>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-5">
        {loading ? (
          <div className="w-full space-y-2">
            <Skeleton className={cn("h-9 w-24", highlight && "bg-white/20")} />
            {hint !== undefined || change !== undefined ? (
              <Skeleton className={cn("h-4 w-32", highlight && "bg-white/20")} />
            ) : null}
            <span className="sr-only">Carregando…</span>
          </div>
        ) : (
          <>
            <div className="min-w-0 space-y-1">
              <p
                className={cn(
                  "text-3xl leading-none font-bold tracking-tight tabular-nums",
                  highlight ? "text-white" : "text-foreground",
                  highlight && "text-4xl",
                )}
              >
                {value}
              </p>
              {hint ? (
                <p className={cn("text-xs", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {hint}
                </p>
              ) : null}
            </div>
            {change !== undefined ? (
              <KpiChange change={change} label={changeLabel} invert={invertChange} onPrimary={highlight} />
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}

function KpiChange({
  change,
  label,
  invert,
  onPrimary,
}: {
  change: number | null;
  label: string;
  invert: boolean;
  onPrimary: boolean;
}) {
  const labelClass = cn("text-[11px] leading-tight", onPrimary ? "text-primary-foreground/75" : "text-muted-foreground");

  if (change === null || !Number.isFinite(change)) {
    return (
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span className={cn("text-sm font-semibold", onPrimary ? "text-primary-foreground/80" : "text-muted-foreground")}>
          —
        </span>
        <span className={labelClass}>sem base de comparação</span>
      </div>
    );
  }

  // Arredonda a magnitude (1 casa) para que ±x,x5 se comportem igual
  const magnitude = Math.round(Math.abs(change) * 10) / 10;
  const direction = magnitude === 0 ? "flat" : change > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") !== invert;
  const Arrow = direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : MinusIcon;
  const verb = direction === "up" ? "Aumento" : direction === "down" ? "Queda" : "Sem variação";
  const percent = formatPercent(magnitude);

  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
          onPrimary
            ? "bg-white/15 text-white"
            : good === null
              ? "bg-muted text-muted-foreground"
              : good
                ? "bg-green-500/10 text-green-700"
                : "bg-red-500/10 text-red-700",
        )}
      >
        <Arrow aria-hidden="true" className="size-3.5" />
        <span aria-hidden="true">{percent}</span>
        <span className="sr-only">{direction === "flat" ? `${verb} ${label}` : `${verb} de ${percent} ${label}`}</span>
      </span>
      <span aria-hidden="true" className={labelClass}>
        {label}
      </span>
    </div>
  );
}
