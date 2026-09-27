"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { BanIcon, CornerDownLeftIcon } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { columnCountLabel } from "@/features/kanban/lib/announcements";
import { columnDroppableId, type DropTargetState, type KanbanColumnDef } from "@/features/kanban/lib/columns";
import { visiblePendingKind, type LeadOverlay } from "@/features/kanban/lib/pending-moves";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

import type { DroppableColumnData } from "../hooks/use-kanban-dnd";
import { KanbanCard } from "./kanban-card";

export interface KanbanColumnProps {
  column: KanbanColumnDef;
  leads: readonly Lead[];
  /** Estado da coluna durante um arraste (válida, inválida, origem) */
  dropState: DropTargetState;
  now: number;
  overlays: ReadonlyMap<string, LeadOverlay>;
  onMove: (lead: Lead, to: LeadStatus) => void;
  whatsappMessage?: string;
  /** Dados desta coluna ainda carregando (finalizados) */
  loading?: boolean;
  /** Falha ao carregar os dados desta coluna (finalizados) */
  error?: { onRetry: () => void; retrying: boolean } | null;
  /** Legenda sob o título (ex.: "Últimos 30 dias") */
  caption?: string | null;
}

/** Fundo da coluna: um toque da cor do status sobre o cinza (hex da spec). */
function laneBackground(color: string, column: KanbanColumnDef, dropState: DropTargetState, isOver: boolean): string {
  if (isOver && dropState === "valid") return `color-mix(in srgb, ${color} 14%, #ffffff)`;
  if (column.tone === "muted") return "#efefef";
  return `color-mix(in srgb, ${color} 7%, #ebebeb)`;
}

/**
 * Coluna do funil (área de soltar): cabeçalho com cor, título e contador;
 * cards ordenados por data. Durante o arraste destaca se aceita o card
 * (regra 2) ou mostra "não permitido".
 */
export function KanbanColumn({
  column,
  leads,
  dropState,
  now,
  overlays,
  onMove,
  whatsappMessage,
  loading = false,
  error = null,
  caption,
}: KanbanColumnProps) {
  const headingId = React.useId();
  const meta = STATUS_META[column.status];
  const data: DroppableColumnData = { status: column.status };
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(column.status), data });
  const muted = column.tone === "muted";
  const count = leads.length;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-status={column.status}
      data-drop-state={dropState}
      data-over={isOver || undefined}
      style={{ backgroundColor: laneBackground(meta.color, column, dropState, isOver) }}
      className={cn(
        // bg-zinc-200/50: reserva para navegadores sem color-mix
        "relative flex w-[280px] shrink-0 snap-start flex-col rounded-xl border bg-zinc-200/50 transition-[box-shadow,background-color,border-color] duration-200",
        muted && "border-dashed",
        dropState === "valid" && "border-primary/40 ring-primary/25 ring-2",
        dropState === "valid" && isOver && "ring-primary shadow-lg",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[opacity,filter] duration-200",
          dropState === "invalid" && "opacity-50 saturate-50",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", muted && "opacity-50")}
          style={{ backgroundColor: meta.color }}
        />
        <header className="flex items-start gap-2 px-3 pt-3.5 pb-2">
          <span
            aria-hidden="true"
            className="mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ring-white"
            style={{ backgroundColor: meta.color }}
          />
          <div className="min-w-0 flex-1">
            <h3 id={headingId} className={cn("text-sm leading-6 font-semibold", muted && "text-foreground/75")}>
              {meta.title}
              <span className="sr-only">, {loading ? "carregando" : columnCountLabel(count)}</span>
            </h3>
            {caption ? <p className="text-muted-foreground -mt-0.5 text-[11px] leading-4">{caption}</p> : null}
          </div>
          <span
            className={cn(
              "bg-card inline-flex h-6 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-semibold tabular-nums",
              muted && "text-muted-foreground",
            )}
            aria-hidden="true"
            title={loading ? undefined : columnCountLabel(count)}
          >
            {loading ? "…" : count}
          </span>
        </header>

        <ul
          role="list"
          aria-labelledby={headingId}
          aria-busy={loading || undefined}
          className="flex min-h-28 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 [scrollbar-width:thin] max-md:max-h-[62dvh] md:max-h-[calc(100dvh-24rem)] md:min-h-40 lg:max-h-[calc(100dvh-22rem)]"
        >
          {loading ? (
            <ColumnSkeletonCards />
          ) : error ? (
            <li>
              <ErrorState
                size="sm"
                title="Não foi possível carregar"
                message="Verifique a conexão."
                onRetry={error.onRetry}
                retrying={error.retrying}
                className="bg-card/70 rounded-lg px-2 py-4"
              />
            </li>
          ) : count === 0 ? (
            <li className="text-muted-foreground flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-black/10 text-xs">
              Nenhum lead
            </li>
          ) : (
            leads.map((lead) => (
              <li key={lead.id}>
                <KanbanCard
                  lead={lead}
                  now={now}
                  pending={visiblePendingKind(overlays.get(lead.id))}
                  muted={muted}
                  onMove={onMove}
                  whatsappMessage={whatsappMessage}
                />
              </li>
            ))
          )}
        </ul>
      </div>

      <DropHint dropState={dropState} isOver={isOver} />
    </section>
  );
}

/** Aviso sobreposto (não mexe no layout durante o arraste). */
function DropHint({ dropState, isOver }: { dropState: DropTargetState; isOver: boolean }) {
  if (dropState === "invalid") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-14 flex justify-center px-3">
        <span className="bg-card text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
          <BanIcon className="size-3.5" />
          Não permitido
        </span>
      </div>
    );
  }
  if (dropState === "valid" && isOver) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
        <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-md">
          <CornerDownLeftIcon className="size-3.5" />
          Solte para mover
        </span>
      </div>
    );
  }
  return null;
}

function ColumnSkeletonCards() {
  return (
    <>
      {[0, 1].map((index) => (
        <li key={index} className="bg-card space-y-2.5 rounded-lg border p-3" aria-hidden="true">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </li>
      ))}
    </>
  );
}
