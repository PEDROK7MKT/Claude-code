"use client";

import * as React from "react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, HistoryIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { EmptyState, type EmptyStateAction } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DEFAULT_HISTORY_SORT,
  HISTORY_SORT_OPTIONS,
  pageWindow,
  paginate,
  rowCpl,
  rowCtr,
  sortHistory,
  sortValue,
  toggleSort,
  type HistorySort,
  type HistorySortKey,
} from "@/features/google-ads/lib/history";
import { PAGE_SIZE } from "@/lib/constants";
import { formatDateKey } from "@/lib/dates";
import { formatCurrency, formatNumber, formatPercent, safeDivide } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailyMetric } from "@/types/database";

interface MetricsHistoryProps {
  rows: readonly DailyMetric[];
  canEdit: boolean;
  onEdit: (row: DailyMetric) => void;
  onDelete: (row: DailyMetric) => void;
  /** CTA do estado vazio (ex.: "Ver todo o período") */
  emptyAction?: EmptyStateAction;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

function weekdayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function rowLabel(row: DailyMetric): string {
  return `${formatDateKey(row.date)} – ${row.campaign}`;
}

/** Histórico de lançamentos: ordenável por data/custo, 20 por página, cards no mobile. */
export function MetricsHistory({ rows, canEdit, onEdit, onDelete, emptyAction }: MetricsHistoryProps) {
  const [sort, setSort] = React.useState<HistorySort>(DEFAULT_HISTORY_SORT);
  const [page, setPage] = React.useState(1);
  const sorted = React.useMemo(() => sortHistory(rows, sort), [rows, sort]);
  const current = paginate(sorted, page, PAGE_SIZE);
  const headingRef = React.useRef<HTMLDivElement>(null);

  const goTo = (next: number) => {
    setPage(next);
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changeSort = (next: HistorySort) => {
    setSort(next);
    setPage(1);
  };

  return (
    <Card role="region" className="gap-4" aria-labelledby="ads-history-title">
      <CardHeader ref={headingRef} className="scroll-mt-20">
        <CardTitle id="ads-history-title" className="text-base">
          Histórico de lançamentos
        </CardTitle>
        <CardDescription>
          {rows.length === 1 ? "1 lançamento no período" : `${formatNumber(rows.length)} lançamentos no período`}
          {" · "}leads e agendados contados pelo CRM
        </CardDescription>
        {rows.length > 1 ? (
          <CardAction className="md:hidden">
            <Select
              value={sortValue(sort)}
              onValueChange={(value) => {
                const option = HISTORY_SORT_OPTIONS.find((o) => o.value === value);
                if (option) changeSort(option.sort);
              }}
            >
              <SelectTrigger size="sm" aria-label="Ordenar lançamentos">
                <ArrowUpDownIcon aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {HISTORY_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={HistoryIcon}
            title="Nenhum lançamento neste período"
            description="Ajuste o período ou a campanha para ver outros dias."
            action={emptyAction}
          />
        ) : (
          <>
            <ul className="space-y-3 md:hidden">
              {current.rows.map((row) => (
                <li key={row.id}>
                  <HistoryCard row={row} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead label="Data" column="date" sort={sort} onSort={(key) => changeSort(toggleSort(sort, key))} />
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Impr.</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <SortableHead
                      label="Custo"
                      column="cost"
                      sort={sort}
                      align="right"
                      onSort={(key) => changeSort(toggleSort(sort, key))}
                    />
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">Leads CRM</TableHead>
                    <TableHead className="text-right">Agend.</TableHead>
                    <TableHead className="text-right">CPL real</TableHead>
                    {canEdit ? (
                      <TableHead className="w-24 text-right">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {current.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="font-medium">{formatDateKey(row.date)}</span>{" "}
                        <span className="text-muted-foreground text-xs">{weekdayOf(row.date)}</span>
                      </TableCell>
                      <TableCell className="max-w-56 truncate" title={row.campaign}>
                        {row.campaign}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>
                      <TableCell className="text-right">{formatPercent(rowCtr(row), 2)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(row.cost))}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(safeDivide(Number(row.cost), Number(row.clicks)))}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(row.conversions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.leads_total)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.leads_agendados)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(rowCpl(row))}</TableCell>
                      {canEdit ? (
                        <TableCell className="text-right">
                          <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {current.pageCount > 1 ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
                  Mostrando {formatNumber(current.start)}–{formatNumber(current.end)} de {formatNumber(current.total)}
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPreviousButton disabled={current.page <= 1} onClick={() => goTo(current.page - 1)} />
                    </PaginationItem>
                    {pageWindow(current.page, current.pageCount).map((p, i) =>
                      p === null ? (
                        <PaginationItem key={`gap-${i}`} className="hidden sm:block">
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p} className={cn(p !== current.page && "hidden sm:block")}>
                          <PaginationButton
                            isActive={p === current.page}
                            aria-label={`Página ${p}`}
                            onClick={() => goTo(p)}
                          >
                            {p}
                          </PaginationButton>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNextButton
                        disabled={current.page >= current.pageCount}
                        onClick={() => goTo(current.page + 1)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SortableHead({
  label,
  column,
  sort,
  align = "left",
  onSort,
}: {
  label: string;
  column: HistorySortKey;
  sort: HistorySort;
  align?: "left" | "right";
  onSort: (column: HistorySortKey) => void;
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDownIcon : sort.direction === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn(align === "right" && "text-right")}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("-mx-2 h-8 gap-1 px-2", align === "right" && "-mr-2 ml-auto")}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon aria-hidden="true" className={cn("size-3.5", !active && "text-muted-foreground")} />
        <span className="sr-only">
          {active ? (sort.direction === "asc" ? " (crescente)" : " (decrescente)") : " (ordenar)"}
        </span>
      </Button>
    </TableHead>
  );
}

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: DailyMetric;
  onEdit: (row: DailyMetric) => void;
  onDelete: (row: DailyMetric) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar lançamento de ${rowLabel(row)}`}
            onClick={() => onEdit(row)}
          >
            <PencilIcon aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Excluir lançamento de ${rowLabel(row)}`}
            onClick={() => onDelete(row)}
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  );
}

function HistoryCard({
  row,
  canEdit,
  onEdit,
  onDelete,
}: {
  row: DailyMetric;
  canEdit: boolean;
  onEdit: (row: DailyMetric) => void;
  onDelete: (row: DailyMetric) => void;
}) {
  return (
    <article className="space-y-3 rounded-lg border p-4" aria-label={rowLabel(row)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium tabular-nums">
            {formatDateKey(row.date)} <span className="text-muted-foreground text-xs font-normal">{weekdayOf(row.date)}</span>
          </p>
          <p className="text-muted-foreground text-sm break-words">{row.campaign}</p>
        </div>
        {canEdit ? <RowActions row={row} onEdit={onEdit} onDelete={onDelete} /> : null}
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
        <CardStat label="Custo" value={formatCurrency(Number(row.cost))} strong />
        <CardStat label="Impressões" value={formatNumber(row.impressions)} />
        <CardStat label="Cliques" value={formatNumber(row.clicks)} />
        <CardStat label="CTR" value={formatPercent(rowCtr(row), 2)} />
        <CardStat label="CPC" value={formatCurrency(safeDivide(Number(row.cost), Number(row.clicks)))} />
        <CardStat label="Conversões" value={formatNumber(row.conversions)} />
        <CardStat label="Leads CRM" value={formatNumber(row.leads_total)} />
        <CardStat label="Agendados" value={formatNumber(row.leads_agendados)} />
        <CardStat label="CPL real" value={formatCurrency(rowCpl(row))} strong />
      </dl>
    </article>
  );
}

function CardStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground truncate text-xs">{label}</dt>
      <dd className={cn("tabular-nums", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}
