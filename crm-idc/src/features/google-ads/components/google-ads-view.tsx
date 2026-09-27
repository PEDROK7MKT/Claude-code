"use client";

import * as React from "react";
import { EyeIcon, MegaphoneIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon, UploadIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { DateKeyRange } from "@/components/shared/date-time-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton, ChartSkeleton, TableSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-context";
import { useNow } from "@/hooks/use-now";
import { useDailyMetrics, useDeleteDailyMetric } from "@/features/google-ads/api/daily-metrics";
import { buildCampaignOptions, filterLeadsByCampaign, filterMetricsByCampaign } from "@/features/google-ads/lib/campaigns";
import {
  DEFAULT_ADS_PERIOD,
  earliestMetricKey,
  leadsInRange,
  metricsInRange,
  presetRange,
  previousRange,
  rangeToLeadWindow,
  type AdsPeriodPreset,
  type AdsPeriodSelection,
} from "@/features/google-ads/lib/periods";
import { buildAdsChartSeries, pickComparisonGranularity, pickGranularity } from "@/features/google-ads/lib/series";
import { compareAdsKpis, computeAdsKpis } from "@/features/google-ads/lib/summary";
import { useLeads } from "@/features/leads/api/leads-queries";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { groupDailyMetricsByCampaign } from "@/lib/metrics";
import type { DailyMetric } from "@/types/database";
import { AdsKpis } from "./ads-kpis";
import { AdsToolbar } from "./ads-toolbar";
import { CampaignBreakdown } from "./campaign-breakdown";
import { AdsCharts } from "./charts/ads-charts";
import { CsvImportDialog } from "./import/csv-import-dialog";
import { MetricFormDialog } from "./metric-form-dialog";
import { MetricsHistory } from "./metrics-history";

const NO_METRICS: DailyMetric[] = [];
const GOOGLE_ADS_SOURCE = ["google_ads" as const];

function formatRange(range: DateKeyRange): string {
  return range.from === range.to ? formatDateKey(range.from) : `${formatDateKey(range.from)} a ${formatDateKey(range.to)}`;
}

/** Página Google Ads (spec §4.5 + regra 7): métricas diárias cruzadas com os leads reais do CRM. */
export function GoogleAdsView() {
  const { isAdmin } = useSession();
  // "Hoje" acompanha a virada do dia com a tela aberta (PWA instalado, aba fixa):
  // presets, janela de leads, data padrão do lançamento e validação do CSV.
  const { today } = useNow();

  // Filtros
  const [selection, setSelection] = React.useState<AdsPeriodSelection>(DEFAULT_ADS_PERIOD);
  const [customRange, setCustomRange] = React.useState<DateKeyRange | null>(null);
  const [campaign, setCampaign] = React.useState<string | null>(null);

  // Diálogos
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DailyMetric | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DailyMetric | null>(null);

  const metricsQuery = useDailyMetrics();
  const deleteMutation = useDeleteDailyMetric();
  const allMetrics = metricsQuery.data ?? NO_METRICS;
  const earliest = React.useMemo(() => earliestMetricKey(allMetrics), [allMetrics]);

  const range = React.useMemo<DateKeyRange>(
    () =>
      selection === "custom" && customRange
        ? customRange
        : presetRange(selection === "custom" ? DEFAULT_ADS_PERIOD : selection, today, earliest),
    [selection, customRange, today, earliest],
  );
  const previous = React.useMemo(() => previousRange(range, selection), [range, selection]);

  // Uma consulta cobre o período atual e o anterior (comparação ↑↓%)
  const leadWindow = rangeToLeadWindow(previous ? { from: previous.from, to: range.to } : range);
  const leadsQuery = useLeads({ ...leadWindow, source: GOOGLE_ADS_SOURCE });
  // offline sem cópia deste período no aparelho: a consulta fica pausada até reconectar
  // (sem isso os KPIs de leads e o comparativo ficariam em skeleton para sempre)
  const leadsOffline = leadsQuery.isPending && leadsQuery.fetchStatus === "paused";
  const leadsLoading = leadsQuery.isPending && !leadsOffline;
  const leadsError = (leadsQuery.isError && !leadsQuery.data) || leadsOffline;

  const campaignOptions = React.useMemo(() => buildCampaignOptions(allMetrics), [allMetrics]);

  const view = React.useMemo(() => {
    const leads = filterLeadsByCampaign(leadsQuery.data ?? [], campaign);
    const metrics = filterMetricsByCampaign(metricsInRange(allMetrics, range), campaign);
    const leadsNow = leadsInRange(leads, range);
    const kpis = computeAdsKpis(metrics, leadsNow);
    const previousKpis = previous
      ? computeAdsKpis(filterMetricsByCampaign(metricsInRange(allMetrics, previous), campaign), leadsInRange(leads, previous))
      : null;
    const granularity = pickGranularity(range);
    const comparisonGranularity = pickComparisonGranularity(range);
    const series = buildAdsChartSeries(metrics, leadsNow, range, granularity);
    return {
      metrics,
      kpis,
      changes: compareAdsKpis(kpis, previousKpis),
      granularity,
      series,
      comparisonGranularity,
      comparisonSeries:
        comparisonGranularity === granularity
          ? series
          : buildAdsChartSeries(metrics, leadsNow, range, comparisonGranularity),
      campaigns: groupDailyMetricsByCampaign(metrics),
    };
  }, [allMetrics, leadsQuery.data, campaign, range, previous]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: DailyMetric) => {
    setEditing(row);
    setFormOpen(true);
  };
  const askDelete = (row: DailyMetric) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const headerActions = isAdmin ? (
    <>
      <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
        <UploadIcon aria-hidden="true" />
        Importar CSV
      </Button>
      <Button type="button" onClick={openCreate}>
        <PlusIcon aria-hidden="true" />
        Lançar dia
      </Button>
    </>
  ) : null;

  let content: React.ReactNode;
  if (metricsQuery.isPending && metricsQuery.fetchStatus === "paused") {
    // offline e nada salvo neste aparelho ainda: a consulta fica pausada até reconectar
    content = (
      <ErrorState
        title="Sem conexão com o servidor"
        message="As métricas do Google Ads ainda não foram salvas neste aparelho. Conecte-se à internet para carregá-las."
        onRetry={() => void metricsQuery.refetch()}
      />
    );
  } else if (metricsQuery.isPending) {
    content = (
      <div className="space-y-6">
        <CardGridSkeleton count={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton height={240} />
          <ChartSkeleton height={240} />
        </div>
        <TableSkeleton rows={6} columns={8} />
      </div>
    );
  } else if (metricsQuery.isError && !metricsQuery.data) {
    content = (
      <ErrorState
        title="Não foi possível carregar as métricas do Google Ads"
        onRetry={() => void metricsQuery.refetch()}
        retrying={metricsQuery.isFetching}
      />
    );
  } else if (allMetrics.length === 0) {
    content = (
      <EmptyState
        icon={MegaphoneIcon}
        className="bg-card rounded-xl border"
        title="Nenhuma métrica do Google Ads lançada ainda"
        description={
          isAdmin
            ? "Lance os números do dia (impressões, cliques, custo e conversões) ou importe o relatório do Google Ads. O CRM cruza com os leads para calcular o CPL real."
            : "Assim que o gestor de tráfego lançar as métricas, você verá aqui o investimento e o custo real por lead."
        }
        action={isAdmin ? { label: "Lançar primeiro dia", icon: PlusIcon, onClick: openCreate } : undefined}
        secondaryAction={
          isAdmin ? { label: "Importar CSV", icon: UploadIcon, onClick: () => setImportOpen(true) } : undefined
        }
      />
    );
  } else {
    content = (
      <div className="space-y-6">
        <div className="space-y-2">
          <AdsToolbar
            selection={selection}
            range={range}
            todayKey={today}
            campaign={campaign}
            campaignOptions={campaignOptions}
            onPresetChange={(preset: AdsPeriodPreset) => {
              setSelection(preset);
              setCustomRange(null);
            }}
            onRangeChange={(next) => {
              setSelection("custom");
              setCustomRange(next);
            }}
            onCampaignChange={setCampaign}
          />
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatRange(range)}
            {previous ? ` · comparado com ${formatRange(previous)}` : ""}
          </p>
        </div>

        {metricsQuery.isError ? (
          <StaleAlert onRetry={() => void metricsQuery.refetch()} retrying={metricsQuery.isFetching} />
        ) : null}
        {leadsError ? (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>{leadsOffline ? "Sem conexão" : "Não foi possível carregar os leads do CRM"}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              {leadsOffline
                ? "Os leads deste período ainda não foram baixados neste aparelho. O CPL real e o comparativo com os leads ficam indisponíveis até reconectar."
                : "O CPL real e o comparativo com os leads ficam indisponíveis."}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void leadsQuery.refetch()}
                disabled={leadsQuery.isFetching}
              >
                <RefreshCwIcon aria-hidden="true" className={leadsQuery.isFetching ? "animate-spin" : undefined} />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <AdsKpis kpis={view.kpis} changes={view.changes} leadsLoading={leadsLoading} leadsError={leadsError} />

        <AdsCharts
          series={view.series}
          granularity={view.granularity}
          comparisonSeries={view.comparisonSeries}
          comparisonGranularity={view.comparisonGranularity}
          kpis={view.kpis}
          leadsLoading={leadsLoading}
          leadsError={leadsError}
        />

        <CampaignBreakdown campaigns={view.campaigns} leadsWithoutCampaign={leadsError ? 0 : view.kpis.leadsWithoutCampaign} />

        <MetricsHistory
          key={`${range.from}|${range.to}|${campaign ?? ""}`}
          rows={view.metrics}
          canEdit={isAdmin}
          onEdit={openEdit}
          onDelete={askDelete}
          emptyAction={
            selection !== "all"
              ? {
                  label: "Ver todo o período",
                  variant: "outline",
                  onClick: () => {
                    setSelection("all");
                    setCustomRange(null);
                  },
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Google Ads"
        description="Investimento e desempenho das campanhas cruzados com os leads reais do CRM (CPL real)."
        actions={headerActions}
      >
        {!isAdmin ? (
          <p className="text-muted-foreground bg-muted/60 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs">
            <EyeIcon aria-hidden="true" className="size-3.5" />
            Modo leitura — as métricas são lançadas pelo gestor de tráfego.
          </p>
        ) : null}
      </PageHeader>

      {content}

      {isAdmin ? (
        <>
          <MetricFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            metric={editing}
            allMetrics={allMetrics}
            campaignOptions={campaignOptions}
            todayKey={today}
          />
          <CsvImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            allMetrics={allMetrics}
            campaignOptions={campaignOptions}
            todayKey={today}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            destructive
            title="Excluir lançamento?"
            description={
              deleteTarget
                ? `As métricas de ${formatDateKey(deleteTarget.date)} – ${deleteTarget.campaign} (${formatCurrency(
                    Number(deleteTarget.cost),
                  )} de custo) serão excluídas. Os leads do CRM não são afetados.`
                : undefined
            }
            confirmLabel="Excluir"
            onConfirm={() => (deleteTarget ? deleteMutation.mutateAsync(deleteTarget.id) : undefined)}
          />
        </>
      ) : null}
    </div>
  );
}

function StaleAlert({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <Alert>
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Mostrando dados salvos no aparelho</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        Não foi possível atualizar as métricas agora.
        <Button type="button" size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
          <RefreshCwIcon aria-hidden="true" className={retrying ? "animate-spin" : undefined} />
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}
