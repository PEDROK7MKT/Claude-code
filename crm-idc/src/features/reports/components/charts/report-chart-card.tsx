import * as React from "react";
import { ChartColumnIcon } from "lucide-react";

import { EmptyState, type EmptyStateAction } from "@/components/shared/empty-state";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportChartSpec } from "../../lib/charts";

interface ReportChartCardProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  spec: ReportChartSpec;
  /** Valor em destaque à direita do título */
  headline?: React.ReactNode;
  headlineLabel?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: EmptyStateAction;
}

/**
 * Card de gráfico do relatório. O contêiner do gráfico leva `data-report-chart`
 * (CHART_DATA_ATTRIBUTE) para a exportação em PDF encontrar o SVG.
 */
export function ReportChartCard({
  spec,
  headline,
  headlineLabel,
  emptyTitle = "Sem dados no período",
  emptyDescription = "Não há informações suficientes para desenhar este gráfico.",
  emptyAction,
  className,
  children,
  ...props
}: ReportChartCardProps) {
  const titleId = React.useId();
  return (
    <Card className={cn("min-w-0 gap-4 break-inside-avoid", className)} aria-labelledby={titleId} {...props}>
      <CardHeader>
        <CardTitle id={titleId} className="text-base">
          {spec.title}
        </CardTitle>
        <CardDescription>{spec.description}</CardDescription>
        {spec.available && headline !== undefined ? (
          <CardAction className="text-right">
            <p className="text-foreground text-lg leading-tight font-semibold tabular-nums">{headline}</p>
            {headlineLabel ? <p className="text-muted-foreground text-xs">{headlineLabel}</p> : null}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="min-w-0 px-3 sm:px-6">
        {spec.available ? (
          <figure aria-label={spec.title} data-report-chart={spec.id} className="m-0 min-w-0">
            {children}
          </figure>
        ) : (
          <EmptyState
            size="sm"
            icon={ChartColumnIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
      </CardContent>
    </Card>
  );
}
