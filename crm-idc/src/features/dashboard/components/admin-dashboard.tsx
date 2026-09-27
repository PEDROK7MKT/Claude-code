"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ChartColumnStackedIcon,
  ChartLineIcon,
  ChartPieIcon,
  KeyRoundIcon,
  MinusIcon,
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { useDailyMetrics } from "@/features/google-ads/api/daily-metrics";
import { useLeads } from "@/features/leads/api/leads-queries";
import { startOfDateKey, type PeriodKey } from "@/lib/dates";
import { formatDecimal, formatNumber } from "@/lib/format";
import { topKeywords } from "@/lib/metrics";
import { useNow } from "../hooks/use-now";
import {
  buildAdminKpis,
  buildStatusSeries,
  buildTrendSeries,
  filterMetricsByRange,
  getAdminDashboardRanges,
  getDashboardFetchWindow,
  sourceShares,
  splitLeadsByPeriod,
  statusTotals,
  type TrendDirection,
} from "../lib/admin-dashboard";
import {
  buildPeriodSearch,
  comparisonLabel,
  comparisonSentence,
  formatRangeLabel,
  parsePeriodParam,
  PERIOD_CHOICES,
  PERIOD_PARAM,
} from "../lib/period";
import { AdminKpiGrid } from "./admin-kpi-grid";
import { ChartHeadline, DashboardChartCard, type ChartErrorState } from "./charts/dashboard-chart-card";
import { KeywordsBarChart } from "./charts/keywords-bar-chart";
import { LeadsTrendChart } from "./charts/leads-trend-chart";
import { SourceDonutChart } from "./charts/source-donut-chart";
import { StatusStackedChart } from "./charts/status-stacked-chart";
import { GmnSummaryCard } from "./gmn-summary-card";
import { LiveIndicator } from "./live-indicator";
import { PeriodSelector } from "./period-selector";

const NEW_LEAD_ACTION = { label: "Cadastrar lead", href: "/leads/novo", icon: PlusIcon } as const;

export interface AdminDashboardProps {
  /** Período lido de ?periodo= no servidor (usado enquanto a URL não tem o parâmetro). */
  initialPeriod: PeriodKey;
}

/**
 * Dashboard do gestor de tráfego (spec §4.2): KPIs com variação vs período
 * anterior, gráficos de leads e card do GMN. Uma única consulta de leads e uma
 * de métricas cobrem todos os períodos; trocar o período só recorta em memória
 * e atualiza a URL (sem ida ao servidor — funciona offline). O Realtime invalida
 * ["leads"], então tudo se atualiza sozinho quando um lead chega ou muda.
 */
export function AdminDashboard({ initialPeriod }: AdminDashboardProps) {
  const searchParams = useSearchParams();
  const rawPeriod = searchParams.get(PERIOD_PARAM);
  const period = rawPeriod === null ? initialPeriod : parsePeriodParam(rawPeriod);

  const changePeriod = (next: PeriodKey) => {
    // History API nativa: integra com useSearchParams sem recarregar a rota
    window.history.replaceState(null, "", buildPeriodSearch(searchParams.toString(), next));
  };

  // Os intervalos só mudam na virada do dia (as chaves das consultas ficam estáveis)
  const { today } = useNow();
  const ranges = React.useMemo(() => getAdminDashboardRanges(period, startOfDateKey(today)), [period, today]);
  const fetchWindow = React.useMemo(() => getDashboardFetchWindow(startOfDateKey(today)), [today]);

  const leadsQuery = useLeads(fetchWindow.leadsQuery);
  const metricsQuery = useDailyMetrics(fetchWindow.metricsQuery);
  const leads = leadsQuery.data;
  const metrics = metricsQuery.data;

  const view = React.useMemo(() => {
    if (!leads) return null;
    const { periodLeads, previousLeads } = splitLeadsByPeriod(leads, ranges);
    return {
      periodLeads,
      previousLeads,
      trend: buildTrendSeries(leads, ranges.trendRange),
      statusSeries: buildStatusSeries(periodLeads, ranges.currentRange),
      statusTotals: statusTotals(periodLeads),
      sources: sourceShares(periodLeads),
      keywords: topKeywords(periodLeads, 5),
    };
  }, [leads, ranges]);

  const kpis = React.useMemo(() => {
    if (!view) return null;
    const rows = metrics ?? [];
    return buildAdminKpis({
      currentLeads: view.periodLeads,
      previousLeads: view.previousLeads,
      currentMetrics: filterMetricsByRange(rows, ranges.currentRange),
      previousMetrics: filterMetricsByRange(rows, ranges.previousRange),
    });
  }, [view, metrics, ranges]);

  const leadsLoading = leadsQuery.isPending;
  const leadsFailed = leadsQuery.isError && !leads;
  const metricsError: ChartErrorState | null =
    metricsQuery.isError && !metrics
      ? { onRetry: () => void metricsQuery.refetch(), retrying: metricsQuery.isFetching }
      : null;

  const periodChoice = PERIOD_CHOICES.find((choice) => choice.value === period) ?? PERIOD_CHOICES[2];
  const currentLabel = formatRangeLabel(ranges.currentRange);
  const periodText = `${periodChoice.longLabel} · ${currentLabel}`;
  const trendDays = view?.trend.points.length ?? 30;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          <>
            {periodChoice.longLabel} · <span className="tabular-nums">{currentLabel}</span>, {comparisonSentence(period)}.
          </>
        }
        actions={
          <>
            <LiveIndicator className="order-last md:order-first" />
            <PeriodSelector value={period} onChange={changePeriod} className="w-full sm:w-auto" />
          </>
        }
      />

      {leadsFailed ? null : (
        <AdminKpiGrid
          kpis={kpis}
          leadsLoading={leadsLoading}
          metricsLoading={metricsQuery.isPending}
          metricsError={metricsError}
          changeLabel={comparisonLabel(period)}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {leadsFailed ? (
            <Card>
              <ErrorState
                title="Não foi possível carregar os leads"
                onRetry={() => void leadsQuery.refetch()}
                retrying={leadsQuery.isFetching}
              />
            </Card>
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <DashboardChartCard
                className="lg:col-span-2"
                title="Leads por dia"
                description={
                  <>
                    Últimos {trendDays} dias · <span className="tabular-nums">{formatRangeLabel(ranges.trendRange)}</span>
                  </>
                }
                action={
                  view ? (
                    <ChartHeadline
                      value={`${formatNumber(view.trend.total)} ${view.trend.total === 1 ? "lead" : "leads"}`}
                      label={<TrendSummary direction={view.trend.direction} average={view.trend.averagePerDay} />}
                    />
                  ) : null
                }
                loading={leadsLoading}
                empty={
                  view && view.trend.total === 0
                    ? {
                        icon: ChartLineIcon,
                        title: "Nenhum lead nos últimos 30 dias",
                        description: "Os leads cadastrados ou recebidos pelo webhook aparecem aqui automaticamente.",
                        action: NEW_LEAD_ACTION,
                      }
                    : null
                }
              >
                {view ? <LeadsTrendChart points={view.trend.points} rangeLabel={formatRangeLabel(ranges.trendRange)} /> : null}
              </DashboardChartCard>

              <DashboardChartCard
                className="lg:col-span-2"
                title="Leads por status"
                description={
                  period === "today"
                    ? "Leads de hoje pelo status atual"
                    : `${periodText} · leads por dia de entrada e status atual`
                }
                action={
                  view ? (
                    <ChartHeadline value={formatNumber(view.periodLeads.length)} label="leads no período" />
                  ) : null
                }
                loading={leadsLoading}
                skeletonHeight={period === "today" ? 120 : 260}
                empty={
                  view && view.periodLeads.length === 0
                    ? {
                        icon: ChartColumnStackedIcon,
                        title: "Nenhum lead no período",
                        description: "Escolha um período maior ou cadastre um novo lead.",
                        action: NEW_LEAD_ACTION,
                      }
                    : null
                }
              >
                {view ? (
                  <StatusStackedChart data={view.statusSeries} totals={view.statusTotals} rangeLabel={periodText} />
                ) : null}
              </DashboardChartCard>

              <DashboardChartCard
                title="Leads por fonte"
                description={periodText}
                loading={leadsLoading}
                skeletonHeight={220}
                empty={
                  view && view.sources.length === 0
                    ? {
                        icon: ChartPieIcon,
                        title: "Nenhum lead no período",
                        description: "A origem dos leads (Google Ads, GMN, Instagram…) aparece aqui.",
                      }
                    : null
                }
              >
                {view ? <SourceDonutChart slices={view.sources} rangeLabel={periodText} /> : null}
              </DashboardChartCard>

              <DashboardChartCard
                title="Top 5 palavras-chave"
                description={`${periodText} · por número de leads`}
                loading={leadsLoading}
                skeletonHeight={220}
                empty={
                  view && view.keywords.length === 0
                    ? {
                        icon: KeyRoundIcon,
                        title: "Nenhuma palavra-chave no período",
                        description:
                          "Informe a palavra-chave ao cadastrar leads do Google Ads (ou envie utm_term pelo webhook) para ver o ranking.",
                        action: { label: "Ver leads do Google Ads", href: "/leads?source=google_ads", variant: "outline" },
                      }
                    : null
                }
              >
                {view ? <KeywordsBarChart keywords={view.keywords} rangeLabel={periodText} /> : null}
              </DashboardChartCard>
            </div>
          )}
        </div>

        <GmnSummaryCard className="xl:self-start" />
      </div>
    </div>
  );
}

const TREND_META: Record<TrendDirection, { icon: typeof TrendingUpIcon; label: string; className: string }> = {
  up: { icon: TrendingUpIcon, label: "tendência de alta", className: "text-green-700" },
  down: { icon: TrendingDownIcon, label: "tendência de queda", className: "text-red-700" },
  flat: { icon: MinusIcon, label: "tendência estável", className: "text-muted-foreground" },
};

function TrendSummary({ direction, average }: { direction: TrendDirection; average: number }) {
  const meta = TREND_META[direction];
  const Icon = meta.icon;
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-1.5">
      <span className="tabular-nums">média {formatDecimal(average)}/dia</span>
      <span aria-hidden="true">·</span>
      <span className={`inline-flex items-center gap-0.5 font-medium ${meta.className}`}>
        <Icon aria-hidden="true" className="size-3.5" />
        {meta.label}
      </span>
    </span>
  );
}
