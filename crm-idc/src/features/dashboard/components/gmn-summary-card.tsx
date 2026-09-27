"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  MapPinnedIcon,
  MousePointerClickIcon,
  NavigationIcon,
  SearchIcon,
  StoreIcon,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGmnMetrics } from "@/features/gmn/api/gmn-metrics";
import { StarRating } from "@/features/gmn/components/star-rating";
import { formatDecimal, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { pickGmnComparison, summarizeGmn, type GmnFlowStat } from "../lib/gmn-summary";
import { formatRangeLabel } from "../lib/period";
import { DeltaPill } from "./delta-pill";

const GMN_CONTEXT = "vs período anterior do GMN";

/** Card lateral do Google Meu Negócio (spec §4.2): nota, avaliações e ações do último período. */
export function GmnSummaryCard({ className }: { className?: string }) {
  const query = useGmnMetrics();
  const summary = React.useMemo(() => {
    const comparison = query.data ? pickGmnComparison(query.data) : null;
    return comparison ? summarizeGmn(comparison) : null;
  }, [query.data]);

  if (query.isPending) return <GmnSummarySkeleton className={className} />;

  const hasData = summary !== null;

  return (
    <Card className={cn("min-w-0 gap-5", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-gold/15 text-gold-foreground flex size-8 items-center justify-center rounded-lg">
            <StoreIcon className="size-4" />
          </span>
          <h2 className="text-base leading-tight font-semibold">Google Meu Negócio</h2>
        </CardTitle>
        {summary ? (
          <CardDescription>
            Período: <span className="tabular-nums">{formatRangeLabel({ fromKey: summary.periodStart, toKey: summary.periodEnd })}</span>
          </CardDescription>
        ) : null}
        {hasData ? (
          <CardAction>
            <Button asChild variant="ghost" size="sm" className="text-primary -mr-2">
              <Link href="/gmn">
                Ver detalhes
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        {query.isError && !query.data ? (
          <ErrorState size="sm" onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : !summary ? (
          <EmptyState
            size="sm"
            icon={MapPinnedIcon}
            title="Nenhuma métrica do GMN registrada"
            description="Copie os números do painel do Google Business Profile para acompanhar nota, avaliações e visitas."
            action={{ label: "Registrar métricas do GMN", href: "/gmn" }}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-1">
            {/* Nota e avaliações */}
            <div className="bg-gold/10 rounded-xl p-4">
              <p className="text-muted-foreground text-xs font-medium">Nota média</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-foreground text-4xl leading-none font-bold tracking-tight tabular-nums">
                  {formatDecimal(summary.rating.value)}
                </span>
                <div className="space-y-1">
                  <StarRating rating={summary.rating.value} size="sm" />
                  <DeltaPill
                    value={summary.rating.diff}
                    kind="absolute"
                    formatAbsolute={formatDecimal}
                    context={GMN_CONTEXT}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-foreground font-semibold tabular-nums">{formatNumber(summary.totalReviews.value)}</span>
                <span className="text-muted-foreground">avaliações no total</span>
                <DeltaPill
                  value={summary.totalReviews.diff}
                  kind="absolute"
                  formatAbsolute={formatNumber}
                  context={GMN_CONTEXT}
                />
              </div>
            </div>

            {/* Visibilidade e ações do último período */}
            <div className="min-w-0 space-y-3">
              <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <GmnStatRow icon={SearchIcon} label="Visualizações na busca" stat={summary.searchViews} />
                <GmnStatRow icon={MousePointerClickIcon} label="Cliques no site" stat={summary.websiteClicks} />
                <GmnStatRow icon={NavigationIcon} label="Solicitações de rota" stat={summary.directionRequests} />
              </dl>

              <p className="text-muted-foreground text-xs text-pretty">
                {summary.previousPeriod ? (
                  <>
                    Variações vs{" "}
                    <span className="tabular-nums">
                      {formatRangeLabel({ fromKey: summary.previousPeriod.start, toKey: summary.previousPeriod.end })}
                    </span>
                    {summary.normalized ? " (pela média diária — períodos de tamanhos diferentes)" : null}.
                  </>
                ) : (
                  "Registre o próximo período para comparar a evolução."
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GmnStatRow({
  icon: Icon,
  label,
  stat,
}: {
  icon: LucideIcon;
  label: string;
  stat: GmnFlowStat;
}) {
  // <dl> só aceita dt/dd como filhos diretos do agrupador
  return (
    <div className="space-y-1 rounded-lg border px-3 py-2.5">
      <dt className="text-muted-foreground flex items-center gap-2 text-xs">
        <Icon aria-hidden="true" className="text-primary size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="flex items-center justify-between gap-2">
        <span className="text-foreground text-lg leading-tight font-semibold tabular-nums">{formatNumber(stat.value)}</span>
        <DeltaPill value={stat.change} context={GMN_CONTEXT} />
      </dd>
    </div>
  );
}

function GmnSummarySkeleton({ className }: { className?: string }) {
  return (
    <Card role="status" aria-busy="true" className={cn("gap-5", className)}>
      <span className="sr-only">Carregando Google Meu Negócio…</span>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
