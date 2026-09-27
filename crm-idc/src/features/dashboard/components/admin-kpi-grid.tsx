"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarCheckIcon,
  CoinsIcon,
  RefreshCwIcon,
  TargetIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminKpis } from "../lib/admin-dashboard";
import type { ChartErrorState } from "./charts/dashboard-chart-card";

export interface AdminKpiGridProps {
  kpis: AdminKpis | null;
  /** Leads ainda carregando: todos os cards em esqueleto. */
  leadsLoading: boolean;
  /** Métricas do Google Ads carregando: só os cards de custo em esqueleto. */
  metricsLoading: boolean;
  /** Falha ao carregar o Google Ads (sem cache): custos "—" com "Tentar novamente". */
  metricsError: ChartErrorState | null;
  /** "vs ontem", "vs 7 dias anteriores"… */
  changeLabel: string;
  className?: string;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** KPIs do topo (spec §4.2 / §12): valor + ↑↓% vs período anterior. */
export function AdminKpiGrid({
  kpis,
  leadsLoading,
  metricsLoading,
  metricsError,
  changeLabel,
  className,
}: AdminKpiGridProps) {
  const costLoading = leadsLoading || (metricsLoading && !metricsError);
  const current = kpis?.current;
  const noAds = kpis !== null && !kpis.hasAdsData;

  // Linha auxiliar dos cards de custo quando não há o que calcular
  const errorHint = metricsError ? (
    <MetricsErrorHint onRetry={metricsError.onRetry} retrying={metricsError.retrying} />
  ) : null;
  const costFallbackHint = errorHint ?? (noAds ? "Sem lançamentos do Google Ads no período" : null);

  return (
    <section aria-label="Indicadores do período" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", className)}>
      <KpiCard
        title="Leads totais"
        icon={UsersIcon}
        loading={leadsLoading}
        value={formatNumber(current?.total ?? 0)}
        hint={current ? `${formatNumber(current.googleAdsLeads)} via Google Ads` : undefined}
        change={kpis?.leads.change}
        changeLabel={changeLabel}
      />
      <KpiCard
        title="Taxa de agendamento"
        icon={CalendarCheckIcon}
        loading={leadsLoading}
        value={formatPercent(kpis?.schedulingRate.value)}
        hint={current ? plural(current.scheduled, "agendamento", "agendamentos") : undefined}
        change={kpis?.schedulingRate.change}
        changeLabel={changeLabel}
      />
      <KpiCard
        title="Custo por lead"
        icon={CoinsIcon}
        loading={costLoading}
        value={metricsError ? "—" : formatCurrency(kpis?.costPerLead.value)}
        hint={
          costFallbackHint ??
          (kpis ? (
            <>
              Só Google Ads:{" "}
              {kpis.costPerGoogleAdsLead === null ? (
                "nenhum lead de anúncio"
              ) : (
                <span className="tabular-nums">{formatCurrency(kpis.costPerGoogleAdsLead)} por lead de anúncio</span>
              )}
            </>
          ) : undefined)
        }
        change={metricsError ? null : kpis?.costPerLead.change}
        changeLabel={changeLabel}
        invertChange
      />
      <KpiCard
        title="Custo por agendamento"
        icon={TargetIcon}
        loading={costLoading}
        value={metricsError ? "—" : formatCurrency(kpis?.costPerScheduled.value)}
        hint={costFallbackHint ?? (current ? plural(current.scheduled, "agendamento", "agendamentos") : undefined)}
        change={metricsError ? null : kpis?.costPerScheduled.change}
        changeLabel={changeLabel}
        invertChange
      />
      <KpiCard
        title="Investimento total"
        icon={WalletIcon}
        loading={costLoading}
        value={metricsError ? "—" : formatCurrency(kpis?.investment.value ?? 0)}
        hint={
          errorHint ??
          (noAds ? <NoAdsHint /> : kpis ? `Google Ads · ${plural(kpis.adsDays, "dia lançado", "dias lançados")}` : undefined)
        }
        change={metricsError ? null : kpis?.investment.change}
        changeLabel={changeLabel}
      />
    </section>
  );
}

function NoAdsHint() {
  return (
    <>
      Sem lançamentos do Google Ads.{" "}
      <Link
        href="/google-ads"
        className="text-primary rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Lançar métricas
      </Link>
    </>
  );
}

function MetricsErrorHint({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <>
      Erro ao carregar o Google Ads.{" "}
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="text-primary inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
      >
        <RefreshCwIcon aria-hidden="true" className={cn("size-3", retrying && "animate-spin")} />
        {retrying ? "Tentando…" : "Tentar novamente"}
      </button>
    </>
  );
}
