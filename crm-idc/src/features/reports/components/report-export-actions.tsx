"use client";

import * as React from "react";
import { FileDownIcon, FileSpreadsheetIcon, LoaderCircleIcon, PrinterIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";
import type { ReportChartSpec } from "../lib/charts";
import { buildLeadsCsv, leadsCsvFileName } from "../lib/csv";
import { saveTextFile } from "../lib/download";
import type { ReportKpi } from "../lib/kpis";
import type { ReportPdfChart } from "../lib/pdf";
import type { MonthReport } from "../lib/report";
import { sortReportLeads } from "../lib/table";

interface ReportExportActionsProps {
  report: MonthReport | null;
  leads: readonly Lead[] | undefined;
  kpis: readonly ReportKpi[];
  summary: readonly string[];
  chartSpecs: readonly ReportChartSpec[];
  /** Região da página com os gráficos (os SVGs viram imagens no PDF) */
  chartsRef: React.RefObject<HTMLElement | null>;
  clinicName: string;
  crmName: string;
  /** Todas as fontes de dados resolvidas (o PDF espera as métricas) */
  settled: boolean;
  className?: string;
}

/** Botões "Exportar CSV", "Exportar PDF" e "Imprimir" do relatório mensal. */
export function ReportExportActions({
  report,
  leads,
  kpis,
  summary,
  chartSpecs,
  chartsRef,
  clinicName,
  crmName,
  settled,
  className,
}: ReportExportActionsProps) {
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const count = leads?.length ?? 0;
  const loading = !report || !leads;

  const blockedReason = loading
    ? "Carregando os dados do relatório…"
    : count === 0
      ? `Nenhum lead em ${report.monthLabel} para exportar`
      : null;
  const pdfBlockedReason = blockedReason ?? (settled ? null : "Aguarde as métricas do Google Ads e do GMN carregarem…");

  const exportCsv = () => {
    if (!report || !leads || blockedReason) return;
    try {
      const fileName = leadsCsvFileName(report.monthKey);
      saveTextFile(buildLeadsCsv(leads), fileName);
      toast.success("CSV exportado", {
        description: `${formatNumber(count)} ${count === 1 ? "lead" : "leads"} · ${fileName}`,
      });
    } catch {
      toast.error("Não foi possível exportar o CSV", { description: "Tente novamente em instantes." });
    }
  };

  const exportPdf = async () => {
    if (!report || !leads || pdfBlockedReason || exportingPdf) return;
    setExportingPdf(true);
    const toastId = toast.loading("Gerando PDF…", { description: `Relatório de ${report.monthLabel}` });
    try {
      // jsPDF e a captura dos gráficos só são baixados quando o usuário exporta
      const [{ exportReportPdf }, { captureReportCharts }] = await Promise.all([
        import("../lib/pdf"),
        import("../lib/chart-capture"),
      ]);
      const available = chartSpecs.filter((spec) => spec.available);
      const images = chartsRef.current
        ? await captureReportCharts(
            chartsRef.current,
            available.map((spec) => spec.id),
          )
        : new Map();
      const charts: ReportPdfChart[] = available.flatMap((spec) => {
        const image = images.get(spec.id);
        return image ? [{ ...spec, image }] : [];
      });
      const fileName = exportReportPdf({
        report,
        kpis,
        summary,
        leads: sortReportLeads(leads, { key: "created_at", dir: "asc" }),
        charts,
        clinicName,
        crmName,
      });
      toast.success("PDF gerado", {
        id: toastId,
        description:
          charts.length < available.length
            ? `${fileName} · alguns gráficos não puderam ser incluídos`
            : fileName,
      });
    } catch {
      toast.error("Não foi possível gerar o PDF", {
        id: toastId,
        description: "Tente novamente. Se o problema continuar, exporte os leads em CSV.",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className={cn("grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center", className)}>
      <ActionButton reason={blockedReason} onClick={exportCsv} variant="outline">
        <FileSpreadsheetIcon aria-hidden="true" />
        Exportar CSV
      </ActionButton>
      <ActionButton
        reason={exportingPdf ? null : pdfBlockedReason}
        onClick={() => void exportPdf()}
        busy={exportingPdf}
        variant="default"
      >
        {exportingPdf ? (
          <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
        ) : (
          <FileDownIcon aria-hidden="true" />
        )}
        {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
      </ActionButton>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Imprimir relatório"
            className="hidden sm:inline-flex"
            disabled={loading}
            onClick={() => window.print()}
          >
            <PrinterIcon aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Imprimir relatório</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Botão que continua focável quando bloqueado, com o motivo no tooltip. */
function ActionButton({
  reason,
  busy = false,
  onClick,
  variant,
  children,
}: {
  reason: string | null;
  busy?: boolean;
  onClick: () => void;
  variant: "default" | "outline";
  children: React.ReactNode;
}) {
  const blocked = reason !== null || busy;
  const button = (
    <Button
      type="button"
      variant={variant}
      aria-disabled={blocked || undefined}
      aria-busy={busy || undefined}
      className={cn("w-full sm:w-auto", blocked && "cursor-not-allowed opacity-60")}
      onClick={() => {
        if (!blocked) onClick();
      }}
    >
      {children}
    </Button>
  );
  if (!reason) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
