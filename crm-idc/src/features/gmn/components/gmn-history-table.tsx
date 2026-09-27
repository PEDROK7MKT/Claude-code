"use client";

import * as React from "react";
import { PencilIcon, StarIcon, Trash2Icon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteGmnMetric } from "@/features/gmn/api/gmn-metrics";
import { formatDecimal, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GmnMetric } from "@/types/database";
import { formatPeriod, periodLengthDays } from "../lib/periods";
import { pluralize } from "../lib/ranking";
import { toRating } from "../lib/summary";

/** Quantos registros aparecem antes de "Mostrar todos". */
const INITIAL_ROWS = 12;

export interface GmnHistoryTableProps {
  /** Registros do mais recente para o mais antigo */
  rows: readonly GmnMetric[];
  isAdmin: boolean;
  onEdit: (metric: GmnMetric) => void;
}

/** Histórico de períodos do GMN: tabela (md+) e cards empilhados (mobile). Admin edita/exclui. */
export function GmnHistoryTable({ rows, isAdmin, onEdit }: GmnHistoryTableProps) {
  const deleteMetric = useDeleteGmnMetric();
  const [showAll, setShowAll] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  // mantém o alvo durante a animação de fechamento do diálogo
  const [deleteTarget, setDeleteTarget] = React.useState<GmnMetric | null>(null);

  const visible = showAll ? rows : rows.slice(0, INITIAL_ROWS);
  const hidden = rows.length - visible.length;

  const askDelete = (metric: GmnMetric) => {
    setDeleteTarget(metric);
    setDeleteOpen(true);
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Histórico de períodos</h2>
        </CardTitle>
        <CardDescription>
          {pluralize(rows.length, "período registrado", "períodos registrados")}, do mais recente para o mais antigo
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desktop: tabela */}
        <div className="hidden md:block">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Busca</TableHead>
                <TableHead className="text-right">Maps</TableHead>
                <TableHead className="text-right">Site</TableHead>
                <TableHead className="text-right">Rotas</TableHead>
                <TableHead className="text-right">Ligações</TableHead>
                <TableHead className="text-right">Avaliações</TableHead>
                <TableHead className="text-right">Nota</TableHead>
                {isAdmin ? (
                  <TableHead className="w-24 text-right">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="max-w-[18rem] align-top">
                    <p className="font-medium whitespace-nowrap">{formatPeriod(metric.period_start, metric.period_end)}</p>
                    <p className="text-muted-foreground truncate text-xs" title={metric.notes ?? undefined}>
                      {durationLabel(metric)}
                      {metric.notes ? ` · ${metric.notes}` : ""}
                    </p>
                  </TableCell>
                  <NumberCell value={metric.search_views} />
                  <NumberCell value={metric.maps_views} />
                  <NumberCell value={metric.website_clicks} />
                  <NumberCell value={metric.direction_requests} />
                  <NumberCell value={metric.phone_calls} />
                  <TableCell className="text-right align-top tabular-nums">
                    <p className="font-medium">{formatNumber(metric.total_reviews)}</p>
                    <p className="text-muted-foreground text-xs">+{formatNumber(metric.new_reviews)} novas</p>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <RatingValue rating={toRating(metric.average_rating)} />
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right align-top">
                      <div className="flex justify-end gap-1">
                        <IconAction label={`Editar ${formatPeriod(metric.period_start, metric.period_end)}`} onClick={() => onEdit(metric)}>
                          <PencilIcon />
                        </IconAction>
                        <IconAction
                          label={`Excluir ${formatPeriod(metric.period_start, metric.period_end)}`}
                          onClick={() => askDelete(metric)}
                          destructive
                        >
                          <Trash2Icon />
                        </IconAction>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: cards empilhados */}
        <ul className="space-y-3 md:hidden">
          {visible.map((metric) => (
            <li key={metric.id} className="bg-card space-y-3 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{formatPeriod(metric.period_start, metric.period_end)}</p>
                  <p className="text-muted-foreground text-xs">{durationLabel(metric)}</p>
                </div>
                <RatingValue rating={toRating(metric.average_rating)} />
              </div>
              <dl className="grid grid-cols-3 gap-x-3 gap-y-2.5 text-sm">
                <Stat label="Busca" value={metric.search_views} />
                <Stat label="Maps" value={metric.maps_views} />
                <Stat label="Site" value={metric.website_clicks} />
                <Stat label="Rotas" value={metric.direction_requests} />
                <Stat label="Ligações" value={metric.phone_calls} />
                <div className="min-w-0">
                  <dt className="text-muted-foreground text-xs">Avaliações</dt>
                  <dd className="font-medium tabular-nums">
                    {formatNumber(metric.total_reviews)}{" "}
                    <span className="text-muted-foreground text-xs font-normal">+{formatNumber(metric.new_reviews)}</span>
                  </dd>
                </div>
              </dl>
              {metric.notes ? <p className="text-muted-foreground text-xs break-words">{metric.notes}</p> : null}
              {isAdmin ? (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onEdit(metric)}>
                    <PencilIcon aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive flex-1"
                    onClick={() => askDelete(metric)}
                  >
                    <Trash2Icon aria-hidden="true" />
                    Excluir
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {hidden > 0 || showAll ? (
          <div className="flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Mostrar menos" : `Mostrar todos (${formatNumber(rows.length)})`}
            </Button>
          </div>
        ) : null}
      </CardContent>

      {isAdmin ? (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          destructive
          title="Excluir este período?"
          description={
            deleteTarget
              ? `O registro de ${formatPeriod(deleteTarget.period_start, deleteTarget.period_end)} será excluído ` +
                "permanentemente. Os gráficos, os KPIs e o comparativo serão recalculados."
              : undefined
          }
          confirmLabel="Excluir"
          onConfirm={() => (deleteTarget ? deleteMetric.mutateAsync(deleteTarget.id) : undefined)}
        />
      ) : null}
    </Card>
  );
}

function durationLabel(metric: Pick<GmnMetric, "period_start" | "period_end">): string {
  return pluralize(periodLengthDays(metric.period_start, metric.period_end), "dia", "dias");
}

function NumberCell({ value }: { value: number }) {
  return <TableCell className="text-right align-top tabular-nums">{formatNumber(value)}</TableCell>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium tabular-nums">{formatNumber(value)}</dd>
    </div>
  );
}

function RatingValue({ rating }: { rating: number | null }) {
  if (rating == null) {
    return (
      <span className="text-muted-foreground text-sm">
        —<span className="sr-only">sem nota</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
      <StarIcon aria-hidden="true" className="text-gold size-3.5" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">nota </span>
      {formatDecimal(rating)}
    </span>
  );
}

function IconAction({
  label,
  onClick,
  destructive = false,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          className={cn(destructive && "text-destructive hover:text-destructive hover:bg-destructive/10")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
