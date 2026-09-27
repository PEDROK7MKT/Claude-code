import * as React from "react";
import { ChartLineIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: string;
  description?: React.ReactNode;
  /** Valor do período em destaque à direita do título (ex.: CTR médio). */
  headline?: React.ReactNode;
  headlineLabel?: React.ReactNode;
  /** Sem dados para desenhar: mostra o estado vazio no lugar do gráfico. */
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Card padrão dos gráficos do Google Ads: título, valor do período e área do gráfico. */
export function ChartCard({
  title,
  description,
  headline,
  headlineLabel,
  empty = false,
  emptyTitle = "Sem métricas no período",
  emptyDescription = "Lance os dados do Google Ads ou escolha outro período.",
  className,
  children,
  ...props
}: ChartCardProps) {
  return (
    <Card className={cn("min-w-0 gap-4", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {headline !== undefined ? (
          <CardAction className="text-right">
            <p className="text-foreground text-lg leading-tight font-semibold tabular-nums">{headline}</p>
            {headlineLabel ? <p className="text-muted-foreground text-xs">{headlineLabel}</p> : null}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="min-w-0 px-3 sm:px-6">
        {empty ? (
          <EmptyState size="sm" icon={ChartLineIcon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <figure aria-label={title} className="m-0">
            {children}
          </figure>
        )}
      </CardContent>
    </Card>
  );
}
