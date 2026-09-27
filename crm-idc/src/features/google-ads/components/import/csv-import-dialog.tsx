"use client";

import * as React from "react";
import { DownloadIcon, FileSpreadsheetIcon, InfoIcon, Loader2Icon, TriangleAlertIcon, UploadIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useImportDailyMetrics } from "@/features/google-ads/api/daily-metrics";
import { dailyMetricKey } from "@/features/google-ads/api/daily-metrics-utils";
import {
  CSV_FIELD_LABEL,
  CSV_TEMPLATE_FILENAME,
  buildCsvTemplate,
  decodeCsvBytes,
  parseGoogleAdsCsv,
  toImportInputs,
  type CsvParseResult,
} from "@/features/google-ads/lib/csv";
import { addDaysToKey } from "@/features/google-ads/lib/periods";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { DailyMetric } from "@/types/database";
import { CsvDropzone } from "./csv-dropzone";
import { CsvPreview } from "./csv-preview";
import { downloadTextFile } from "./download-file";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const DELIMITER_LABEL: Record<CsvParseResult["delimiter"], string> = {
  ";": "ponto e vírgula",
  ",": "vírgula",
  "\t": "tabulação",
};

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allMetrics: readonly DailyMetric[];
  campaignOptions: readonly string[];
  todayKey: string;
}

/** Importação de métricas via CSV (somente admin): arquivo → prévia validada → import das linhas válidas. */
export function CsvImportDialog({ open, onOpenChange, allMetrics, campaignOptions, todayKey }: CsvImportDialogProps) {
  const importMutation = useImportDailyMetrics();
  const [session, setSession] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((s) => s + 1);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && importMutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar métricas (CSV)</DialogTitle>
          <DialogDescription>
            Envie o relatório do Google Ads segmentado por dia ou preencha o modelo. Você confere tudo antes de importar.
          </DialogDescription>
        </DialogHeader>
        <CsvImporter
          key={session}
          allMetrics={allMetrics}
          campaignOptions={campaignOptions}
          todayKey={todayKey}
          importMutation={importMutation}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface LoadedFile {
  name: string;
  size: number;
  text: string;
}

interface CsvImporterProps {
  allMetrics: readonly DailyMetric[];
  campaignOptions: readonly string[];
  todayKey: string;
  importMutation: ReturnType<typeof useImportDailyMetrics>;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${formatNumber(bytes)} B`;
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} KB`;
  return `${formatDecimal(bytes / (1024 * 1024))} MB`;
}

function CsvImporter({ allMetrics, campaignOptions, todayKey, importMutation, onClose }: CsvImporterProps) {
  const [file, setFile] = React.useState<LoadedFile | null>(null);
  const [reading, setReading] = React.useState(false);
  const [readError, setReadError] = React.useState<string | null>(null);
  const [defaultCampaign, setDefaultCampaign] = React.useState<string | null>(null);
  const [onlyIssues, setOnlyIssues] = React.useState(false);

  const existingKeys = React.useMemo(
    () => new Set(allMetrics.map((m) => dailyMetricKey({ date: m.date.slice(0, 10), campaign: m.campaign }))),
    [allMetrics],
  );

  const result = React.useMemo(
    () =>
      file
        ? parseGoogleAdsCsv(file.text, {
            todayKey,
            defaultCampaign,
            knownCampaigns: campaignOptions,
            existingKeys,
          })
        : null,
    [file, todayKey, defaultCampaign, campaignOptions, existingKeys],
  );
  const inputs = React.useMemo(() => (result && !result.error ? toImportInputs(result) : []), [result]);
  const issueRows = React.useMemo(
    () => (result ? result.rows.filter((row) => row.status !== "valid" || row.warnings.length > 0) : []),
    [result],
  );
  const pending = importMutation.isPending;

  const handleFile = async (selected: File) => {
    setReadError(null);
    if (selected.size > MAX_FILE_BYTES) {
      setReadError(`O arquivo tem ${formatBytes(selected.size)}. O limite é 5 MB — divida o relatório por período.`);
      return;
    }
    if (!/\.(csv|tsv|txt)$/i.test(selected.name)) {
      setReadError("Envie um arquivo .csv (planilhas .xlsx: use “Salvar como → CSV”).");
      return;
    }
    setReading(true);
    try {
      const buffer = await selected.arrayBuffer();
      setFile({ name: selected.name, size: selected.size, text: decodeCsvBytes(new Uint8Array(buffer)) });
      setDefaultCampaign(null);
      setOnlyIssues(false);
    } catch {
      setReadError("Não foi possível ler o arquivo. Tente novamente.");
    } finally {
      setReading(false);
    }
  };

  const handleImport = async () => {
    if (!inputs.length) return;
    try {
      await importMutation.mutateAsync(inputs);
      onClose();
    } catch {
      // toast de erro exibido pelo hook; mantém a prévia aberta
    }
  };

  const downloadTemplate = () => {
    downloadTextFile(CSV_TEMPLATE_FILENAME, buildCsvTemplate(addDaysToKey(todayKey, -1)));
  };

  const previewRows = onlyIssues ? issueRows : (result?.rows ?? []);

  return (
    <>
      <div className="grid min-w-0 gap-4">
        {!file ? (
          <>
            <CsvDropzone onFile={handleFile} busy={reading} disabled={reading} />
            {readError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>Arquivo não aceito</AlertTitle>
                <AlertDescription>{readError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="bg-muted/40 text-muted-foreground grid gap-1.5 rounded-lg p-4 text-sm">
              <p className="text-foreground flex items-center gap-2 font-medium">
                <InfoIcon aria-hidden="true" className="size-4" />
                Como exportar do Google Ads
              </p>
              <p>
                Em <strong className="text-foreground font-medium">Campanhas</strong>, escolha o período, clique em{" "}
                <strong className="text-foreground font-medium">Segmentar → Tempo → Dia</strong> e depois em{" "}
                <strong className="text-foreground font-medium">Download → .csv</strong>. Colunas em português ou
                inglês, com ou sem cabeçalho (ordem: data, campanha, impressões, cliques, custo, conversões). Linhas de
                total são ignoradas.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileSpreadsheetIcon aria-hidden="true" className="text-primary size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(file.size)}
                    {result && !result.error
                      ? ` · separador ${DELIMITER_LABEL[result.delimiter]} · números no formato ${
                          result.numberFormat === "br" ? "brasileiro (1.234,56)" : "americano (1,234.56)"
                        } · ${result.hasHeader ? "com cabeçalho" : "sem cabeçalho"}`
                      : null}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)} disabled={pending}>
                <XIcon aria-hidden="true" />
                Trocar arquivo
              </Button>
            </div>

            {result?.error ? (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>Não foi possível ler as métricas</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : result ? (
              <>
                <div className="flex flex-wrap gap-2" aria-live="polite">
                  <Badge variant="outline" className="border-green-600/25 bg-green-500/10 text-green-700">
                    {formatNumber(result.counts.valid)} {result.counts.valid === 1 ? "válida" : "válidas"}
                  </Badge>
                  {result.counts.invalid > 0 ? (
                    <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                      {formatNumber(result.counts.invalid)} com erro
                    </Badge>
                  ) : null}
                  {result.counts.duplicate > 0 ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      {formatNumber(result.counts.duplicate)} {result.counts.duplicate === 1 ? "repetida" : "repetidas"}
                    </Badge>
                  ) : null}
                  {result.counts.replacing > 0 ? (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800">
                      {formatNumber(result.counts.replacing)} {result.counts.replacing === 1 ? "atualiza" : "atualizam"}{" "}
                      lançamento existente
                    </Badge>
                  ) : null}
                  {result.skipped.totals > 0 ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      {formatNumber(result.skipped.totals)} {result.skipped.totals === 1 ? "linha" : "linhas"} de total
                      ignorada{result.skipped.totals === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>

                {result.missingColumns.length > 0 ? (
                  <Alert>
                    <InfoIcon aria-hidden="true" />
                    <AlertTitle>Colunas ausentes no arquivo</AlertTitle>
                    <AlertDescription>
                      {result.missingColumns.map((field) => CSV_FIELD_LABEL[field]).join(", ")}{" "}
                      {result.missingColumns.length === 1 ? "será gravada" : "serão gravadas"} como 0.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {result.campaignColumnMissing ? (
                  <div className="grid gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <Label htmlFor="csv-default-campaign" className="text-sm leading-snug">
                      O arquivo não tem coluna de campanha. A qual campanha pertencem estas linhas?
                    </Label>
                    <Select value={defaultCampaign ?? ""} onValueChange={(value) => setDefaultCampaign(value)}>
                      <SelectTrigger id="csv-default-campaign" className="w-full sm:w-64">
                        <SelectValue placeholder="Selecione a campanha" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {campaignOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {issueRows.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Switch id="csv-only-issues" checked={onlyIssues} onCheckedChange={setOnlyIssues} />
                    <Label htmlFor="csv-only-issues" className="text-sm font-normal">
                      Mostrar só linhas com erro ou aviso ({formatNumber(issueRows.length)})
                    </Label>
                  </div>
                ) : null}

                <CsvPreview rows={previewRows} />
              </>
            ) : null}
          </>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button type="button" variant="ghost" onClick={downloadTemplate} className="sm:mr-auto">
          <DownloadIcon aria-hidden="true" />
          Baixar modelo CSV
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} disabled={pending || inputs.length === 0}>
            {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <UploadIcon aria-hidden="true" />}
            {inputs.length > 0
              ? `Importar ${formatNumber(inputs.length)} ${inputs.length === 1 ? "linha" : "linhas"}`
              : "Importar"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
