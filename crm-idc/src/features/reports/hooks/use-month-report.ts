"use client";

import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";

import { useDailyMetrics } from "@/features/google-ads/api/daily-metrics";
import { useGmnMetrics } from "@/features/gmn/api/gmn-metrics";
import { useLeads } from "@/features/leads/api/leads-queries";
import { getMonthRange } from "@/lib/dates";
import { filterByCreatedAt } from "@/lib/metrics";
import type { Lead } from "@/types/database";
import { shiftMonth } from "../lib/month";
import { buildMonthReport, type MonthReport } from "../lib/report";

/** Fonte de dados secundária indisponível (o relatório sai sem ela). */
export type ReportSourceKey = "metrics" | "gmn";

export interface MonthReportState {
  report: MonthReport | null;
  /** Leads do mês selecionado (sem os do mês anterior) */
  leads: Lead[] | undefined;
  /** Primeira carga dos leads (nada em cache) */
  isLoading: boolean;
  /** Offline e nada salvo neste aparelho: consulta pausada até reconectar */
  isOfflineEmpty: boolean;
  /** Erro dos leads sem dados para mostrar */
  error: Error | null;
  isRefetching: boolean;
  /** Métricas do Google Ads / GMN ainda carregando */
  adsLoading: boolean;
  gmnLoading: boolean;
  /** Fontes secundárias que falharam ou estão pausadas (offline) */
  unavailable: ReportSourceKey[];
  /** Todas as fontes resolvidas (com dados, erro ou offline) — libera o PDF */
  settled: boolean;
  retry: () => void;
}

/** Carregando de verdade (não conta consulta pausada por falta de conexão). */
function isLoadingQuery(query: UseQueryResult<unknown>): boolean {
  return query.isPending && query.fetchStatus === "fetching";
}

/** Sem dados por erro ou por estar offline sem cache. */
function isUnavailable(query: UseQueryResult<unknown>): boolean {
  return query.data === undefined && (query.isError || query.fetchStatus === "paused");
}

/**
 * Dados do relatório mensal: leads e métricas diárias do mês selecionado e do
 * anterior (uma consulta cada, cobrindo os dois meses) e o histórico do GMN.
 */
export function useMonthReport(monthKey: string, today: string): MonthReportState {
  const previousKey = shiftMonth(monthKey, -1);
  const range = React.useMemo(() => getMonthRange(monthKey), [monthKey]);
  const previousRange = React.useMemo(() => getMonthRange(previousKey), [previousKey]);

  const leadsQuery = useLeads({ createdFrom: previousRange.from.toISOString(), createdTo: range.to.toISOString() });
  const metricsQuery = useDailyMetrics({ fromKey: previousRange.fromKey, toKey: range.toKey });
  const gmnQuery = useGmnMetrics();

  const allLeads = leadsQuery.data;
  const metrics = metricsQuery.data ?? null;
  const gmnMetrics = gmnQuery.data ?? null;

  const report = React.useMemo(() => {
    if (!allLeads) return null;
    return buildMonthReport({
      monthKey,
      today,
      leads: allLeads,
      previousLeads: allLeads,
      metrics,
      previousMetrics: metrics,
      gmnMetrics,
    });
  }, [allLeads, metrics, gmnMetrics, monthKey, today]);

  const leads = React.useMemo(
    () => (allLeads ? filterByCreatedAt(allLeads, range.from, range.to) : undefined),
    [allLeads, range],
  );

  const unavailable: ReportSourceKey[] = [];
  if (isUnavailable(metricsQuery)) unavailable.push("metrics");
  if (isUnavailable(gmnQuery)) unavailable.push("gmn");

  const { refetch: refetchLeads } = leadsQuery;
  const { refetch: refetchMetrics } = metricsQuery;
  const { refetch: refetchGmn } = gmnQuery;
  const retry = React.useCallback(() => {
    void refetchLeads();
    void refetchMetrics();
    void refetchGmn();
  }, [refetchLeads, refetchMetrics, refetchGmn]);

  return {
    report,
    leads,
    isLoading: leadsQuery.isPending && leadsQuery.fetchStatus !== "paused",
    isOfflineEmpty: leadsQuery.isPending && leadsQuery.fetchStatus === "paused",
    error: leadsQuery.isError && !leadsQuery.data ? leadsQuery.error : null,
    isRefetching: leadsQuery.isFetching || metricsQuery.isFetching || gmnQuery.isFetching,
    adsLoading: isLoadingQuery(metricsQuery),
    gmnLoading: isLoadingQuery(gmnQuery),
    unavailable,
    settled: Boolean(allLeads) && !isLoadingQuery(metricsQuery) && !isLoadingQuery(gmnQuery),
    retry,
  };
}
