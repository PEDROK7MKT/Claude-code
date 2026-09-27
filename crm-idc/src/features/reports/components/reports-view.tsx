"use client";

import * as React from "react";
import { CalendarClockIcon, CalendarX2Icon, ChevronLeftIcon, ListIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/features/auth/session-context";
import { useAppSettings } from "@/features/settings/api/app-settings";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import type { AppSettings } from "@/types/database";
import { useMonthReport, type ReportSourceKey } from "../hooks/use-month-report";
import { useReportMonth } from "../hooks/use-report-month";
import { buildReportChartSpecs } from "../lib/charts";
import { buildReportKpis } from "../lib/kpis";
import { monthLabel, monthName, monthNavigation } from "../lib/month";
import { formatReportPeriod, type MonthReport } from "../lib/report";
import { buildReportSummary } from "../lib/summary";
import { MonthPicker } from "./month-picker";
import { ReportCharts } from "./report-charts";
import { ReportExportActions } from "./report-export-actions";
import { ReportKpiGrid } from "./report-kpi-grid";
import { ReportLeadsTable } from "./report-leads-table";
import { ReportSummaryCard } from "./report-summary-card";
import { ReportsContentSkeleton } from "./reports-skeleton";

/**
 * Impressão (bônus): esconde a navegação do app e os controles, deixando só o
 * relatório. O PDF gerado pelo botão continua sendo o formato oficial.
 */
const PRINT_CSS = `
@media print {
  [data-slot="sidebar"], [data-slot="sidebar-gap"], [data-slot="sidebar-container"],
  [data-slot="sidebar-rail"], [data-slot="sidebar-trigger"], [data-slot="sidebar-inset"] > header {
    display: none !important;
  }
  [data-slot="sidebar-wrapper"], [data-slot="sidebar-inset"] { margin: 0 !important; min-height: 0 !important; box-shadow: none !important; }
  [data-reports-page] [data-slot="card"] { box-shadow: none !important; }
}
`;

const UNAVAILABLE_LABEL: Record<ReportSourceKey, string> = {
  metrics: "métricas do Google Ads",
  gmn: "métricas do Google Meu Negócio",
};

export interface ReportsViewProps {
  /** Mês atual (yyyy-MM) e hoje (yyyy-MM-dd) no fuso da clínica, calculados no servidor */
  currentMonth: string;
  today: string;
  initialSettings?: AppSettings;
}

/** Página de relatório mensal (spec §4.7). Somente leitura para os dois perfis; exporta PDF e CSV. */
export function ReportsView({ currentMonth, today, initialSettings }: ReportsViewProps) {
  const { isAdmin } = useSession();
  const [monthKey, setMonth] = useReportMonth(currentMonth);
  const state = useMonthReport(monthKey, today);
  const settings = useAppSettings(initialSettings).data;
  const chartsRef = React.useRef<HTMLElement>(null);

  const { report, leads } = state;
  const kpis = React.useMemo(() => (report ? buildReportKpis(report) : []), [report]);
  const summary = React.useMemo(() => (report ? buildReportSummary(report) : []), [report]);
  const specs = React.useMemo(() => (report ? buildReportChartSpecs(report) : []), [report]);

  const clinicName = settings?.clinic_name ?? "Instituto Décio Carrilho";
  const crmName = settings?.crm_name ?? "IDC CRM";
  const label = monthLabel(monthKey);

  let content: React.ReactNode;
  if (state.isOfflineEmpty) {
    content = (
      <Card>
        <ErrorState
          title="Sem conexão com o servidor"
          message={`Os leads de ${label} ainda não foram salvos neste aparelho. Conecte-se à internet para gerar o relatório.`}
          onRetry={state.retry}
        />
      </Card>
    );
  } else if (state.isLoading || (!report && !state.error)) {
    content = <ReportsContentSkeleton />;
  } else if (state.error || !report || !leads) {
    content = (
      <Card>
        <ErrorState
          title="Não foi possível carregar o relatório"
          message={getErrorMessage(state.error)}
          onRetry={state.retry}
          retrying={state.isRefetching}
        />
      </Card>
    );
  } else if (leads.length === 0) {
    content = <NoLeadsState report={report} isAdmin={isAdmin} currentMonth={currentMonth} onMonthChange={setMonth} />;
  } else {
    content = (
      <div className="space-y-8">
        {report.isPartial ? (
          <Alert role="status" className="print:hidden">
            <CalendarClockIcon aria-hidden="true" />
            <AlertTitle>Mês em andamento</AlertTitle>
            <AlertDescription>
              Dados até hoje ({formatDateKey(today)}). A comparação com {monthName(report.previousMonthKey)} considera o
              mês anterior inteiro.
            </AlertDescription>
          </Alert>
        ) : null}

        {state.unavailable.length > 0 ? (
          <Alert variant="destructive" className="print:hidden">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Parte dos dados não carregou</AlertTitle>
            <AlertDescription>
              <p>
                O relatório foi montado sem as {state.unavailable.map((key) => UNAVAILABLE_LABEL[key]).join(" e ")}.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={state.retry} disabled={state.isRefetching}>
                <RefreshCwIcon aria-hidden="true" className={state.isRefetching ? "animate-spin" : undefined} />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section aria-labelledby="relatorio-resumo" className="space-y-4">
          <h2 id="relatorio-resumo" className="text-lg font-semibold tracking-tight">
            Resumo automático
          </h2>
          <ReportKpiGrid
            kpis={kpis}
            changeLabel={`vs ${monthName(report.previousMonthKey)}`}
            adsLoading={state.adsLoading}
            gmnLoading={state.gmnLoading}
          />
          <ReportSummaryCard
            paragraphs={summary}
            loading={state.adsLoading || state.gmnLoading}
            monthLabel={report.monthLabel}
          />
        </section>

        <section ref={chartsRef} aria-labelledby="relatorio-graficos" className="space-y-4">
          <h2 id="relatorio-graficos" className="text-lg font-semibold tracking-tight">
            Gráficos do período
          </h2>
          <ReportCharts report={report} specs={specs} isAdmin={isAdmin} adsLoading={state.adsLoading} />
        </section>

        <section aria-labelledby="relatorio-leads" className="space-y-4">
          <h2 id="relatorio-leads" className="sr-only">
            Leads do período
          </h2>
          <ReportLeadsTable key={monthKey} leads={leads} monthLabel={report.monthLabel} />
        </section>
      </div>
    );
  }

  return (
    <div data-reports-page className="space-y-6">
      <style>{PRINT_CSS}</style>
      <PageHeader
        title="Relatórios"
        description="Relatório mensal automático: indicadores, gráficos e leads do mês — pronto para exportar em PDF ou CSV."
        className="print:hidden"
      />

      {/* cabeçalho que só aparece na impressão */}
      <div className="hidden border-b pb-3 print:block">
        <p className="text-primary text-lg font-semibold">{clinicName}</p>
        <p className="text-sm">
          Relatório mensal — {label}
          {report ? ` · ${formatReportPeriod(report)}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <MonthPicker value={monthKey} currentMonth={currentMonth} onChange={setMonth} />
        <ReportExportActions
          report={report}
          leads={leads}
          kpis={kpis}
          summary={summary}
          chartSpecs={specs}
          chartsRef={chartsRef}
          clinicName={clinicName}
          crmName={crmName}
          settled={state.settled}
        />
      </div>

      {content}
    </div>
  );
}

function NoLeadsState({
  report,
  isAdmin,
  currentMonth,
  onMonthChange,
}: {
  report: MonthReport;
  isAdmin: boolean;
  currentMonth: string;
  onMonthChange: (monthKey: string) => void;
}) {
  const { previous } = monthNavigation(report.monthKey, currentMonth);
  const ads = report.current.ads;
  const investment = ads && ads.cost > 0 ? ` O Google Ads registrou ${formatCurrency(ads.cost)} de investimento no mês.` : "";
  const description = report.isPartial
    ? `Ainda não entrou nenhum lead em ${report.monthLabel}. Assim que os primeiros contatos chegarem, o relatório é montado automaticamente.${investment}`
    : `Não há leads cadastrados com entrada em ${report.monthLabel}, então não há relatório para exibir ou exportar.${investment}`;

  return (
    <Card>
      <EmptyState
        icon={CalendarX2Icon}
        title={`Nenhum lead em ${report.monthLabel}`}
        description={description}
        action={
          isAdmin
            ? { label: "Cadastrar lead", href: "/leads/novo", icon: PlusIcon }
            : { label: "Ver leads", href: "/leads", icon: ListIcon }
        }
        secondaryAction={
          previous
            ? { label: `Ver ${monthName(previous)}`, onClick: () => onMonthChange(previous), icon: ChevronLeftIcon }
            : undefined
        }
      />
    </Card>
  );
}
