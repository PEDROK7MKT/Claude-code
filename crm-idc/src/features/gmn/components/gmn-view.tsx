"use client";

import * as React from "react";
import { EyeIcon, MapPinIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/features/auth/session-context";
import { useGmnMetrics } from "@/features/gmn/api/gmn-metrics";
import { useAppSettings } from "@/features/settings/api/app-settings";
import { COMPETITORS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import type { AppSettings, GmnMetric } from "@/types/database";
import { buildCompetitorRanking } from "../lib/ranking";
import { buildGmnSeries, buildReviewsHighlight, compareLatestPeriods, sortByPeriodDesc } from "../lib/summary";
import { CompetitorRanking } from "./competitor-ranking";
import { GmnActionsChart } from "./gmn-actions-chart";
import { GmnHelpCard } from "./gmn-help-card";
import { GmnHistoryTable } from "./gmn-history-table";
import { GmnKpiCards } from "./gmn-kpi-cards";
import { GmnMetricFormDialog } from "./gmn-metric-form-dialog";
import { GmnPageSkeleton } from "./gmn-page-skeleton";
import { GmnRatingHighlight } from "./gmn-rating-highlight";
import { GmnReviewsChart } from "./gmn-reviews-chart";
import { GmnViewsChart } from "./gmn-views-chart";

interface DialogState {
  open: boolean;
  /** null = novo período */
  metric: GmnMetric | null;
}

export interface GmnViewProps {
  /** Configurações lidas no servidor (concorrentes sem "piscar" os padrões) */
  initialSettings?: AppSettings;
}

/** Página Google Meu Negócio (spec §4.6 / §6.2 fase 1). Admin registra; dentista só visualiza. */
export function GmnView({ initialSettings }: GmnViewProps) {
  const { isAdmin } = useSession();
  const metricsQuery = useGmnMetrics();
  const settingsQuery = useAppSettings(initialSettings);
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, metric: null });

  const competitors = settingsQuery.data?.competitors ?? COMPETITORS;
  const rows = React.useMemo(() => sortByPeriodDesc(metricsQuery.data ?? []), [metricsQuery.data]);
  const highlight = React.useMemo(() => buildReviewsHighlight(rows), [rows]);
  const comparison = React.useMemo(() => compareLatestPeriods(rows), [rows]);
  const series = React.useMemo(() => buildGmnSeries(rows), [rows]);
  const ranking = React.useMemo(
    () =>
      buildCompetitorRanking(
        competitors,
        highlight ? { rating: highlight.rating, reviews: highlight.totalReviews } : null,
      ),
    [competitors, highlight],
  );

  const openCreate = () => setDialog({ open: true, metric: null });
  const openEdit = (metric: GmnMetric) => setDialog({ open: true, metric });

  let content: React.ReactNode;
  if (metricsQuery.isPending) {
    content = <GmnPageSkeleton withHeader={false} />;
  } else if (metricsQuery.isError && !metricsQuery.data) {
    content = (
      <Card>
        <ErrorState
          title="Não foi possível carregar as métricas do GMN"
          message={getErrorMessage(metricsQuery.error)}
          onRetry={() => void metricsQuery.refetch()}
          retrying={metricsQuery.isFetching}
        />
      </Card>
    );
  } else if (!highlight || !comparison) {
    content = (
      <div className="space-y-6">
        <Card>
          <EmptyState
            icon={MapPinIcon}
            title="Nenhum período registrado"
            description={
              isAdmin
                ? "Copie os números do painel do Google Business Profile para acompanhar visualizações, ações e avaliações da clínica."
                : "Quando o gestor de tráfego registrar as métricas do Google Meu Negócio, elas aparecerão aqui."
            }
            action={isAdmin ? { label: "Registrar primeiro período", onClick: openCreate, icon: PlusIcon } : undefined}
          />
        </Card>
        <div className="grid items-start gap-4 lg:grid-cols-5">
          <CompetitorRanking ranking={ranking} isAdmin={isAdmin} className={isAdmin ? "lg:col-span-3" : "lg:col-span-5"} />
          {isAdmin ? <GmnHelpCard defaultOpen className="lg:col-span-2" /> : null}
        </div>
      </div>
    );
  } else {
    content = (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-5">
          <GmnRatingHighlight highlight={highlight} ranking={ranking} className="lg:col-span-2" />
          <CompetitorRanking ranking={ranking} isAdmin={isAdmin} className="lg:col-span-3" />
        </div>

        <GmnKpiCards comparison={comparison} />

        <section aria-labelledby="gmn-evolucao-title" className="space-y-3">
          <h2 id="gmn-evolucao-title" className="text-base font-semibold">
            Evolução
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
            <GmnViewsChart data={series} />
            <GmnActionsChart data={series} />
            <GmnReviewsChart data={series} className="xl:col-span-2" />
          </div>
        </section>

        <GmnHistoryTable rows={rows} isAdmin={isAdmin} onEdit={openEdit} />

        {isAdmin ? <GmnHelpCard /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Meu Negócio"
        description="Visibilidade, ações e avaliações do perfil da clínica no Google — registro semanal ou mensal."
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreate}>
              <PlusIcon aria-hidden="true" />
              Registrar período
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
              <EyeIcon aria-hidden="true" />
              Somente leitura
            </Badge>
          )
        }
      />

      {content}

      {isAdmin ? (
        <GmnMetricFormDialog
          open={dialog.open}
          metric={dialog.metric}
          rows={rows}
          onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
          onEditExisting={(metric) => setDialog({ open: true, metric })}
        />
      ) : null}
    </div>
  );
}
