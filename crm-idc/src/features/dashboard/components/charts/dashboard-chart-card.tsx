"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { EmptyState, type EmptyStateAction } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ChartSkeleton } from "@/components/shared/loading-skeletons";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChartEmptyState {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

export interface ChartErrorState {
  onRetry: () => void;
  retrying?: boolean;
}

export interface DashboardChartCardProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: string;
  description?: React.ReactNode;
  /** Destaque à direita do título (ex.: total do período). */
  action?: React.ReactNode;
  loading?: boolean;
  /** Altura do esqueleto (px), igual à do gráfico. */
  skeletonHeight?: number;
  /** Erro de carregamento (mostra "Tentar novamente"). */
  error?: ChartErrorState | null;
  /** Sem dados: estado vazio com ilustração + CTA no lugar do gráfico. */
  empty?: ChartEmptyState | null;
  contentClassName?: string;
}

/** Card padrão dos gráficos do dashboard: cabeçalho + gráfico, ou esqueleto/erro/vazio. */
export function DashboardChartCard({
  title,
  description,
  action,
  loading = false,
  skeletonHeight = 260,
  error,
  empty,
  className,
  contentClassName,
  children,
  ...props
}: DashboardChartCardProps) {
  if (loading) return <ChartSkeleton height={skeletonHeight} className={className} />;

  return (
    <Card className={cn("min-w-0 gap-4", className)} {...props}>
      <CardHeader>
        <CardTitle>
          <h2 className="text-base leading-tight font-semibold">
            {title}
          </h2>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction className="text-right">{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("min-w-0 px-3 sm:px-6", contentClassName)}>
        {error ? (
          <ErrorState size="sm" onRetry={error.onRetry} retrying={error.retrying} />
        ) : empty ? (
          <EmptyState
            size="sm"
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={empty.action}
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/** Valor em destaque no canto do card ("128 leads" / "média 4,3 por dia"). */
export function ChartHeadline({ value, label }: { value: React.ReactNode; label?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-foreground text-lg leading-tight font-semibold tabular-nums">{value}</p>
      {label ? <p className="text-muted-foreground text-xs">{label}</p> : null}
    </div>
  );
}
