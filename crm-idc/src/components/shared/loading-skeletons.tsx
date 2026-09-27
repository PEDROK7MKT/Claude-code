import * as React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Região acessível: anuncia "Carregando…" uma única vez para leitores de tela. */
function LoadingRegion({
  className,
  children,
  label = "Carregando…",
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className} {...props}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// Larguras determinísticas (sem Math.random → sem divergência de hidratação)
const CELL_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5", "w-3/5"] as const;
const cellWidth = (row: number, col: number) => CELL_WIDTHS[(row * 7 + col * 3) % CELL_WIDTHS.length];
const BAR_HEIGHTS = [45, 70, 55, 85, 60, 95, 50, 75, 65, 80, 40, 70] as const;

// -----------------------------------------------------------------------------
// Blocos internos (sem região de status própria)
// -----------------------------------------------------------------------------

function TableBlock({ rows, columns, mobileCards }: { rows: number; columns: number; mobileCards: boolean }) {
  return (
    <>
      <div className={cn("bg-card overflow-hidden rounded-xl border", mobileCards && "hidden md:block")}>
        <div className="bg-muted/40 flex items-center gap-4 border-b px-4 py-3">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
            {Array.from({ length: columns }, (_, col) => (
              <div key={col} className="flex-1">
                <Skeleton className={cn("h-4", cellWidth(row, col))} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {mobileCards ? (
        <div className="space-y-3 md:hidden">
          {Array.from({ length: Math.min(rows, 5) }, (_, row) => (
            <div key={row} className="bg-card space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function ChartBlock({ height, withHeader }: { height: number; withHeader: boolean }) {
  return (
    <Card className="h-full">
      {withHeader ? (
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeader>
      ) : null}
      <CardContent>
        <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
          {BAR_HEIGHTS.map((h, i) => (
            <Skeleton
              key={i}
              className={cn("flex-1 rounded-b-none", i >= 8 && "hidden sm:block")}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Esqueleto de um card de KPI (mesmo layout do KpiCard). */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-4 py-5", className)}>
      <div className="flex items-center gap-2.5 px-5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-end justify-between gap-4 px-5">
        <Skeleton className="h-9 w-20" />
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  );
}

/** Título + descrição + ações, no mesmo layout do PageHeader. */
export function PageHeaderSkeleton({ withActions = true, className }: { withActions?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withActions ? (
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Esqueletos exportados (cada um é uma região de carregamento)
// -----------------------------------------------------------------------------

export interface TableSkeletonProps extends React.ComponentProps<"div"> {
  rows?: number;
  columns?: number;
  /** Abaixo de `md` exibe cards empilhados, como as tabelas reais no mobile (padrão true). */
  mobileCards?: boolean;
}

export function TableSkeleton({ rows = 8, columns = 5, mobileCards = true, className, ...props }: TableSkeletonProps) {
  return (
    <LoadingRegion className={cn("w-full", className)} label="Carregando tabela…" {...props}>
      <TableBlock rows={rows} columns={columns} mobileCards={mobileCards} />
    </LoadingRegion>
  );
}

export interface CardGridSkeletonProps extends React.ComponentProps<"div"> {
  count?: number;
}

/** Grade de cards de KPI (ajuste as colunas via `className`). */
export function CardGridSkeleton({ count = 4, className, ...props }: CardGridSkeletonProps) {
  return (
    <LoadingRegion className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </LoadingRegion>
  );
}

export interface ChartSkeletonProps extends React.ComponentProps<"div"> {
  /** Altura da área do gráfico em px (padrão 300). */
  height?: number;
  /** Mostra o cabeçalho (título/descrição) do card (padrão true). */
  withHeader?: boolean;
}

export function ChartSkeleton({ height = 300, withHeader = true, className, ...props }: ChartSkeletonProps) {
  return (
    <LoadingRegion className={className} label="Carregando gráfico…" {...props}>
      <ChartBlock height={height} withHeader={withHeader} />
    </LoadingRegion>
  );
}

export interface FormSkeletonProps extends React.ComponentProps<"div"> {
  fields?: number;
}

/** Formulário em card (cadastro de lead, configurações). */
export function FormSkeleton({ fields = 6, className, ...props }: FormSkeletonProps) {
  return (
    <LoadingRegion className={className} label="Carregando formulário…" {...props}>
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: fields }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>
    </LoadingRegion>
  );
}

export interface PageSkeletonProps extends React.ComponentProps<"div"> {
  /** Quantidade de cards de KPI (0 oculta; padrão 4). */
  kpis?: number;
  /** Quantidade de gráficos (0 oculta; padrão 2). */
  charts?: number;
  /** Linhas de uma tabela abaixo dos gráficos (0 oculta; padrão 0). */
  tableRows?: number;
}

/** Página inteira para `loading.tsx`: cabeçalho + KPIs + gráficos (+ tabela opcional). */
export function PageSkeleton({ kpis = 4, charts = 2, tableRows = 0, className, ...props }: PageSkeletonProps) {
  return (
    <LoadingRegion className={cn("space-y-6", className)} label="Carregando página…" {...props}>
      <PageHeaderSkeleton />
      {kpis > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: kpis }, (_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      ) : null}
      {charts > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: charts }, (_, i) => (
            <ChartBlock key={i} height={260} withHeader />
          ))}
        </div>
      ) : null}
      {tableRows > 0 ? <TableBlock rows={tableRows} columns={5} mobileCards /> : null}
    </LoadingRegion>
  );
}
