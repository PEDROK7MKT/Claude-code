"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent, safeDivide } from "@/lib/format";
import { summarizeDailyMetrics, type CampaignSummary } from "@/lib/metrics";

interface CampaignBreakdownProps {
  campaigns: readonly CampaignSummary[];
  /** Leads google_ads sem campanha informada no período */
  leadsWithoutCampaign: number;
}

interface Totals {
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  leadsTotal: number;
  leadsAgendados: number;
  costPerLead: number | null;
  costPerScheduled: number | null;
}

function totalsOf(campaigns: readonly CampaignSummary[]): Totals {
  const ads = summarizeDailyMetrics(campaigns.map((c) => ({ date: "", ...c })));
  const leadsTotal = campaigns.reduce((sum, c) => sum + c.leadsTotal, 0);
  const leadsAgendados = campaigns.reduce((sum, c) => sum + c.leadsAgendados, 0);
  return {
    ...ads,
    leadsTotal,
    leadsAgendados,
    costPerLead: safeDivide(ads.cost, leadsTotal),
    costPerScheduled: safeDivide(ads.cost, leadsAgendados),
  };
}

/** Totais por campanha (leads contados pelo banco nos dias com lançamento). */
export function CampaignBreakdown({ campaigns, leadsWithoutCampaign }: CampaignBreakdownProps) {
  const totals = React.useMemo(() => totalsOf(campaigns), [campaigns]);
  if (!campaigns.length) return null;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Por campanha</CardTitle>
        <CardDescription>
          Leads e agendamentos contados automaticamente pelo CRM nos dias com lançamento de cada campanha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mobile: cards empilhados */}
        <ul className="space-y-3 md:hidden">
          {campaigns.map((c) => (
            <li key={c.campaign} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium break-words">{c.campaign}</p>
                <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(c.cost)}</p>
              </div>
              <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                <Stat label="Cliques" value={formatNumber(c.clicks)} />
                <Stat label="CTR" value={formatPercent(c.ctr, 2)} />
                <Stat label="CPC" value={formatCurrency(c.cpc)} />
                <Stat label="Conversões" value={formatNumber(c.conversions)} />
                <Stat label="Leads CRM" value={formatNumber(c.leadsTotal)} />
                <Stat label="Agendados" value={formatNumber(c.leadsAgendados)} />
                <Stat label="CPL real" value={formatCurrency(c.costPerLead)} strong />
                <Stat label="Custo/agend." value={formatCurrency(c.costPerScheduled)} />
                <Stat label="Dias" value={formatNumber(c.days)} />
              </dl>
            </li>
          ))}
        </ul>

        {/* md+: tabela (rola na horizontal se faltar espaço) */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Impr.</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead className="text-right">Leads CRM</TableHead>
                <TableHead className="text-right">Agend.</TableHead>
                <TableHead className="text-right">CPL real</TableHead>
                <TableHead className="text-right">Custo/agend.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {campaigns.map((c) => (
                <TableRow key={c.campaign}>
                  <TableCell className="max-w-64 truncate font-medium" title={c.campaign}>
                    {c.campaign}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(c.cost)}</TableCell>
                  <TableCell className="text-right">{formatNumber(c.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(c.clicks)}</TableCell>
                  <TableCell className="text-right">{formatPercent(c.ctr, 2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.cpc)}</TableCell>
                  <TableCell className="text-right">{formatNumber(c.conversions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(c.leadsTotal)}</TableCell>
                  <TableCell className="text-right">{formatNumber(c.leadsAgendados)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(c.costPerLead)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.costPerScheduled)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {campaigns.length > 1 ? (
              <TableFooter className="tabular-nums">
                <TableRow className="hover:bg-transparent">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.cost)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.clicks)}</TableCell>
                  <TableCell className="text-right">{formatPercent(totals.ctr, 2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.cpc)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.conversions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.leadsTotal)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.leadsAgendados)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.costPerLead)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.costPerScheduled)}</TableCell>
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>

        {leadsWithoutCampaign > 0 ? (
          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {leadsWithoutCampaign === 1
                ? "1 lead do Google Ads está sem campanha informada: ele conta nos leads reais do período, mas não aparece nesta tabela."
                : `${formatNumber(leadsWithoutCampaign)} leads do Google Ads estão sem campanha informada: eles contam nos leads reais do período, mas não aparecem nesta tabela.`}
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground truncate text-xs">{label}</dt>
      <dd className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
