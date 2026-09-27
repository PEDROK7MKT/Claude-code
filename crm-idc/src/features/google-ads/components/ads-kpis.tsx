"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarCheckIcon,
  CoinsIcon,
  EyeIcon,
  type LucideIcon,
  MinusIcon,
  MousePointerClickIcon,
  PercentIcon,
  ReceiptIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdsKpiChanges, AdsKpis } from "@/features/google-ads/lib/summary";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdsKpisProps {
  kpis: AdsKpis;
  changes: AdsKpiChanges;
  /** Leads do CRM ainda carregando (KPIs que dependem deles mostram skeleton) */
  leadsLoading: boolean;
  leadsError: boolean;
}

function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

/** "Fonte Google Ads · 2 sem campanha · 3 em dias sem lançamento" */
function leadsHint(kpis: AdsKpis): string {
  const parts = ["Fonte Google Ads"];
  if (kpis.leadsWithoutCampaign > 0) parts.push(plural(kpis.leadsWithoutCampaign, "sem campanha", "sem campanha"));
  // regra 7: leads de dias ainda sem lançamento (ex.: hoje) não entram no CPL real
  if (kpis.leadsOutsideMetricDays > 0) {
    parts.push(`${formatNumber(kpis.leadsOutsideMetricDays)} em dias sem lançamento`);
  }
  return parts.join(" · ");
}

/** KPIs do período: CPL real em destaque (regra 7) + desempenho do Google Ads. */
export function AdsKpis({ kpis, changes, leadsLoading, leadsError }: AdsKpisProps) {
  const leadValue = (value: React.ReactNode) => (leadsError ? "—" : value);

  return (
    <section aria-labelledby="ads-kpis-title" className="space-y-4">
      <h2 id="ads-kpis-title" className="sr-only">
        Indicadores do período
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          variant="highlight"
          title="CPL real"
          icon={TargetIcon}
          value={leadValue(formatCurrency(kpis.realCpl))}
          hint="Investimento ÷ leads dos dias com lançamento"
          change={leadsError ? undefined : changes.realCpl}
          invertChange
          loading={leadsLoading}
        />
        <KpiCard
          title="Custo por agendamento real"
          icon={CalendarCheckIcon}
          value={leadValue(formatCurrency(kpis.realCostPerScheduled))}
          hint={
            leadsError
              ? "Leads indisponíveis"
              : kpis.leadsOutsideMetricDays > 0
                ? `${plural(kpis.scheduledOnMetricDays, "agendamento", "agendamentos")} em dias com lançamento`
                : plural(kpis.scheduledOnMetricDays, "agendamento", "agendamentos")
          }
          change={leadsError ? undefined : changes.realCostPerScheduled}
          invertChange
          loading={leadsLoading}
        />
        <KpiCard
          title="Leads reais no CRM"
          icon={UsersIcon}
          value={leadValue(formatNumber(kpis.crmLeads))}
          hint={leadsError ? "Leads indisponíveis" : leadsHint(kpis)}
          change={leadsError ? undefined : changes.crmLeads}
          loading={leadsLoading}
        />
        <KpiCard
          title="Investimento"
          icon={WalletIcon}
          value={formatCurrency(kpis.cost)}
          hint={plural(kpis.daysWithData, "dia com lançamento", "dias com lançamento")}
          change={changes.cost}
        />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base">Desempenho no Google Ads</CardTitle>
          <CardDescription>Números lançados das campanhas no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <MetricTile icon={EyeIcon} label="Impressões" value={formatNumber(kpis.impressions)} change={changes.impressions} />
            <MetricTile icon={MousePointerClickIcon} label="Cliques" value={formatNumber(kpis.clicks)} change={changes.clicks} />
            <MetricTile icon={PercentIcon} label="CTR" value={formatPercent(kpis.ctr, 2)} change={changes.ctr} />
            <MetricTile icon={CoinsIcon} label="CPC médio" value={formatCurrency(kpis.cpc)} change={changes.cpc} invert />
            <MetricTile
              icon={TrophyIcon}
              label="Conversões (Google Ads)"
              value={formatNumber(kpis.conversions)}
              change={changes.conversions}
            />
            <MetricTile
              icon={ReceiptIcon}
              label="Custo por conversão"
              value={formatCurrency(kpis.costPerConversion)}
              change={changes.costPerConversion}
              invert
            />
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  change,
  invert = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change: number | null | undefined;
  invert?: boolean;
}) {
  return (
    <div className="bg-muted/40 flex min-w-0 flex-col gap-1.5 rounded-lg border p-3">
      <dt className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs font-medium">
        <Icon aria-hidden="true" className="text-primary size-3.5 shrink-0" />
        <span className="truncate" title={label}>
          {label}
        </span>
      </dt>
      <dd className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-foreground text-lg leading-tight font-semibold tracking-tight tabular-nums sm:text-xl">
          {value}
        </span>
        {change !== undefined ? <DeltaChip change={change} invert={invert} /> : null}
      </dd>
    </div>
  );
}

/** Variação compacta vs período anterior (verde = melhora; custo em queda é melhora). */
function DeltaChip({ change, invert }: { change: number | null; invert: boolean }) {
  if (change === null || !Number.isFinite(change)) {
    return (
      <span className="text-muted-foreground text-[11px]" title="Sem base de comparação no período anterior">
        —<span className="sr-only"> sem base de comparação</span>
      </span>
    );
  }
  const magnitude = Math.round(Math.abs(change) * 10) / 10;
  const direction = magnitude === 0 ? "flat" : change > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") !== invert;
  const Arrow = direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : MinusIcon;
  const text = formatPercent(magnitude);
  const verb = direction === "up" ? "Aumento" : direction === "down" ? "Queda" : "Sem variação";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        good === null ? "bg-muted text-muted-foreground" : good ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700",
      )}
    >
      <Arrow aria-hidden="true" className="size-3" />
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">
        {direction === "flat" ? `${verb} vs período anterior` : `${verb} de ${text} vs período anterior`}
      </span>
    </span>
  );
}

