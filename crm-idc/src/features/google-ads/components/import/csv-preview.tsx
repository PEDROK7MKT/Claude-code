"use client";

import * as React from "react";
import { CircleCheckIcon, CircleXIcon, CopyIcon, RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CsvField, CsvPreviewRow } from "@/features/google-ads/lib/csv";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Máximo de linhas desenhadas na prévia (o import usa todas as válidas). */
export const MAX_PREVIEW_ROWS = 300;

const INVALID_CELL = "bg-destructive/10 text-destructive font-medium";

function numberCell(value: number | null, format: (n: number) => string): string {
  return value === null ? "—" : format(value);
}

function cellClass(row: CsvPreviewRow, field: CsvField, extra?: string): string {
  return cn(extra, row.invalidFields.includes(field) && INVALID_CELL);
}

export function RowStatusBadge({ row }: { row: CsvPreviewRow }) {
  if (row.status === "invalid") {
    return (
      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
        <CircleXIcon aria-hidden="true" />
        Com erro
      </Badge>
    );
  }
  if (row.status === "duplicate") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CopyIcon aria-hidden="true" />
        Repetida
      </Badge>
    );
  }
  if (row.replacesExisting) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800">
        <RefreshCwIcon aria-hidden="true" />
        Atualiza
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-green-600/25 bg-green-500/10 text-green-700">
      <CircleCheckIcon aria-hidden="true" />
      Válida
    </Badge>
  );
}

function RowMessages({ row }: { row: CsvPreviewRow }) {
  if (!row.errors.length && !row.warnings.length) return null;
  return (
    <ul className="space-y-0.5 text-xs">
      {row.errors.map((message) => (
        <li key={`e-${message}`} className="text-destructive">
          {message}
        </li>
      ))}
      {row.warnings.map((message) => (
        <li key={`w-${message}`} className="text-amber-700">
          {message}
        </li>
      ))}
    </ul>
  );
}

/** Prévia das linhas do CSV: tabela no desktop, cards no mobile; erros destacados por célula. */
export function CsvPreview({ rows }: { rows: readonly CsvPreviewRow[] }) {
  const visible = rows.slice(0, MAX_PREVIEW_ROWS);

  return (
    <div className="space-y-2">
      <ul className="max-h-[45vh] space-y-2 overflow-y-auto md:hidden" aria-label="Prévia das linhas">
        {visible.map((row) => (
          <li
            key={row.line}
            className={cn(
              "space-y-2 rounded-lg border p-3 text-sm",
              row.status === "invalid" && "border-destructive/40 bg-destructive/5",
              row.status === "duplicate" && "opacity-70",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium tabular-nums">
                  <span className={cellClass(row, "date", "rounded px-0.5")}>
                    {row.date ? formatDateKey(row.date) : row.rawDate || "sem data"}
                  </span>{" "}
                  <span className="text-muted-foreground text-xs font-normal">linha {row.line}</span>
                </p>
                <p className={cellClass(row, "campaign", "text-muted-foreground rounded px-0.5 break-words")}>
                  {row.campaign ?? "sem campanha"}
                </p>
              </div>
              <RowStatusBadge row={row} />
            </div>
            <dl className="grid grid-cols-4 gap-2 text-xs">
              <MobileStat label="Impr." value={numberCell(row.impressions, formatNumber)} invalid={row.invalidFields.includes("impressions")} />
              <MobileStat label="Cliques" value={numberCell(row.clicks, formatNumber)} invalid={row.invalidFields.includes("clicks")} />
              <MobileStat label="Custo" value={numberCell(row.cost, formatCurrency)} invalid={row.invalidFields.includes("cost")} />
              <MobileStat label="Conv." value={numberCell(row.conversions, formatNumber)} invalid={row.invalidFields.includes("conversions")} />
            </dl>
            <RowMessages row={row} />
          </li>
        ))}
      </ul>

      <div className="hidden max-h-[45vh] overflow-y-auto rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14">Linha</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead className="text-right">Impr.</TableHead>
              <TableHead className="text-right">Cliques</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {visible.map((row) => (
              <TableRow
                key={row.line}
                className={cn(
                  "align-top",
                  row.status === "invalid" && "bg-destructive/5 hover:bg-destructive/10",
                  row.status === "duplicate" && "text-muted-foreground",
                )}
              >
                <TableCell className="text-muted-foreground">{row.line}</TableCell>
                <TableCell className={cellClass(row, "date")}>
                  {row.date ? formatDateKey(row.date) : row.rawDate || "—"}
                </TableCell>
                <TableCell className={cellClass(row, "campaign", "max-w-52 truncate")} title={row.campaign ?? undefined}>
                  {row.campaign ?? "—"}
                </TableCell>
                <TableCell className={cellClass(row, "impressions", "text-right")}>
                  {numberCell(row.impressions, formatNumber)}
                </TableCell>
                <TableCell className={cellClass(row, "clicks", "text-right")}>
                  {numberCell(row.clicks, formatNumber)}
                </TableCell>
                <TableCell className={cellClass(row, "cost", "text-right")}>
                  {numberCell(row.cost, formatCurrency)}
                </TableCell>
                <TableCell className={cellClass(row, "conversions", "text-right")}>
                  {numberCell(row.conversions, formatNumber)}
                </TableCell>
                <TableCell className="min-w-56 whitespace-normal">
                  <div className="space-y-1">
                    <RowStatusBadge row={row} />
                    <RowMessages row={row} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length > visible.length ? (
        <p className="text-muted-foreground text-xs">
          Mostrando {formatNumber(visible.length)} de {formatNumber(rows.length)} linhas. Todas as linhas válidas serão
          importadas.
        </p>
      ) : null}
    </div>
  );
}

function MobileStat({ label, value, invalid }: { label: string; value: string; invalid: boolean }) {
  return (
    <div className={cn("min-w-0 rounded px-1 py-0.5", invalid && INVALID_CELL)}>
      <dt className="text-muted-foreground truncate">{label}</dt>
      <dd className="truncate tabular-nums">{value}</dd>
    </div>
  );
}
