"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { FilterXIcon, HandIcon, MousePointerClickIcon, SquareKanbanIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useStatusChange } from "@/features/leads/components/status";
import { boardSummary } from "@/features/kanban/lib/card";
import {
  FINALS_WINDOW_DAYS,
  KANBAN_GROUPS,
  columnsOfGroup,
  getDropTargets,
  groupLeadsByColumn,
} from "@/features/kanban/lib/columns";
import { filterKanbanLeads, hasActiveFilters, type KanbanFilters } from "@/features/kanban/lib/filters";
import { canTransition } from "@/lib/lead-status";
import type { Lead, LeadStatus } from "@/types/database";

import {
  KANBAN_ANNOUNCEMENTS,
  KANBAN_MEASURING,
  KANBAN_SCREEN_READER_INSTRUCTIONS,
  kanbanCollisionDetection,
  leadFromDragData,
  statusFromDropData,
  useKanbanSensors,
} from "../hooks/use-kanban-dnd";
import { usePendingMoves } from "../hooks/use-pending-moves";
import { CARD_FOCUS_ATTRIBUTE, KanbanCardOverlay } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";

export interface KanbanBoardProps {
  /** Leads carregados (em andamento + finalizados da janela) */
  leads: readonly Lead[];
  filters: KanbanFilters;
  now: number;
  /** Colunas finalizadas ainda carregando */
  finalsLoading: boolean;
  /** Colunas finalizadas falharam (as em andamento continuam na tela) */
  finalsError: boolean;
  retrying: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onShowOldFinals: () => void;
  whatsappMessage?: string;
}

type MoveOrigin = "pointer" | "keyboard" | "menu";

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
};

/**
 * Devolve o foco ao card depois de mover pelo menu ou teclado (o card muda de
 * coluna e é remontado). Espera os diálogos fecharem e não rouba o foco se o
 * usuário já está em outro lugar.
 */
function restoreCardFocus(leadId: string) {
  window.setTimeout(() => {
    const focused = document.activeElement;
    const lost = !focused || focused === document.body || !focused.isConnected;
    const target = document.querySelector<HTMLElement>(`[${CARD_FOCUS_ATTRIBUTE}="${CSS.escape(leadId)}"]`);
    if (target && lost) target.focus();
  }, 260);
}

/**
 * Quadro do funil com drag & drop (spec §4.4): colunas na ordem do funil,
 * contador por coluna, destaque dos destinos permitidos (regra 2) e mudança
 * de status pela RPC (o histórico é gravado automaticamente). Agendar abre a
 * agenda; perdido/cancelado pedem confirmação; o card aparece no destino na
 * hora e volta se o pedido for cancelado ou falhar.
 */
export function KanbanBoard({
  leads,
  filters,
  now,
  finalsLoading,
  finalsError,
  retrying,
  onRetry,
  onClearFilters,
  onShowOldFinals,
  whatsappMessage,
}: KanbanBoardProps) {
  const dndId = React.useId();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sensors = useKanbanSensors();
  const { requestChange, dialogs } = useStatusChange();
  const pending = usePendingMoves(leads);
  const { beginMove, endMove, markSaved } = pending;
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);

  const filtered = hasActiveFilters(filters);
  const visible = React.useMemo(() => filterKanbanLeads(pending.leads, filters), [pending.leads, filters]);
  const columns = React.useMemo(() => groupLeadsByColumn(visible), [visible]);
  const dropTargets = React.useMemo(() => getDropTargets(activeLead?.status), [activeLead?.status]);

  /** Pede a mudança (valida, abre diálogo quando preciso, salva) e cuida do card pendente. */
  const moveLead = React.useCallback(
    (lead: Lead, to: LeadStatus, origin: MoveOrigin) => {
      if (lead.status === to) return;
      // Arrastado: o card fica no destino enquanto o diálogo decide
      const preMove = origin !== "menu" && canTransition(lead.status, to);
      if (preMove) beginMove(lead, to);
      void requestChange(lead, to, {
        onSettled: (result) => {
          if (preMove) endMove(lead.id);
          if (result.outcome === "success") markSaved(result.lead);
          if (origin !== "pointer") restoreCardFocus(lead.id);
        },
      });
    },
    [beginMove, endMove, markSaved, requestChange],
  );

  const moveFromMenu = React.useCallback((lead: Lead, to: LeadStatus) => moveLead(lead, to, "menu"), [moveLead]);

  const handleDragStart = React.useCallback(({ active }: DragStartEvent) => {
    setActiveLead(leadFromDragData(active.data.current));
  }, []);

  const handleDragEnd = React.useCallback(
    ({ active, over, activatorEvent }: DragEndEvent) => {
      setActiveLead(null);
      const lead = leadFromDragData(active.data.current);
      const to = over ? statusFromDropData(over.data.current, over.id) : null;
      if (!lead || !to || to === lead.status) return; // mesma coluna ou fora do quadro: nada muda
      // transição inválida: o hook mostra o erro e o card volta sozinho
      moveLead(lead, to, activatorEvent instanceof KeyboardEvent ? "keyboard" : "pointer");
    },
    [moveLead],
  );

  const handleDragCancel = React.useCallback(() => setActiveLead(null), []);

  const total = pending.leads.length;
  const summary = boardSummary(visible.length, total, filtered);
  const finalsCaption = filters.showOldFinals ? "Todos os períodos" : `Últimos ${FINALS_WINDOW_DAYS} dias`;

  if (!finalsLoading && !finalsError && total === 0) {
    return (
      <>
        <EmptyState
          icon={SquareKanbanIcon}
          title="Nenhum lead no funil"
          description={
            filters.showOldFinals
              ? "Assim que um lead for cadastrado (ou chegar pelo site), ele aparece na coluna Novo."
              : `Nenhum lead em andamento nem finalizado nos últimos ${FINALS_WINDOW_DAYS} dias.`
          }
          action={{ label: "Cadastrar lead", href: "/leads/novo" }}
          secondaryAction={
            filters.showOldFinals ? undefined : { label: "Mostrar finalizados antigos", onClick: onShowOldFinals }
          }
          className="bg-card rounded-xl border"
        />
        {dialogs}
      </>
    );
  }

  if (filtered && visible.length === 0 && !finalsLoading) {
    return (
      <>
        <EmptyState
          icon={FilterXIcon}
          title="Nenhum lead encontrado"
          description="Nenhum card corresponde à busca e aos filtros atuais."
          action={{ label: "Limpar filtros", onClick: onClearFilters, icon: FilterXIcon }}
          className="bg-card rounded-xl border"
        />
        {dialogs}
      </>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <p aria-live="polite" className="text-foreground/80 font-medium tabular-nums">
          {summary}
        </p>
        <p className="flex items-center gap-1.5">
          <MousePointerClickIcon aria-hidden="true" className="hidden size-3.5 md:inline" />
          <HandIcon aria-hidden="true" className="size-3.5 md:hidden" />
          <span className="hidden md:inline">Arraste os cards entre as colunas ou use o menu ⋮ de cada card.</span>
          <span className="md:hidden">Toque e segure um card para arrastar, ou use o menu ⋮.</span>
        </p>
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        measuring={KANBAN_MEASURING}
        accessibility={{
          announcements: KANBAN_ANNOUNCEMENTS,
          screenReaderInstructions: KANBAN_SCREEN_READER_INSTRUCTIONS,
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          role="region"
          aria-label="Quadro do funil"
          tabIndex={0}
          data-dragging={activeLead ? true : undefined}
          className="focus-visible:ring-ring/50 -mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto overscroll-x-contain px-4 pt-1 pb-4 outline-none [scrollbar-width:thin] focus-visible:ring-[3px] data-[dragging=true]:snap-none md:-mx-6 md:snap-none md:scroll-px-6 md:px-6"
        >
          <div className="flex w-max items-stretch gap-6">
            {KANBAN_GROUPS.map((group) => (
              <BoardGroup key={group.id} label={group.label}>
                {columnsOfGroup(group.id).map((column) => (
                  <KanbanColumn
                    key={column.status}
                    column={column}
                    leads={columns[column.status]}
                    dropState={dropTargets[column.status]}
                    now={now}
                    overlays={pending.overlays}
                    onMove={moveFromMenu}
                    whatsappMessage={whatsappMessage}
                    loading={column.final && finalsLoading}
                    error={column.final && finalsError ? { onRetry, retrying } : null}
                    caption={column.final ? finalsCaption : null}
                  />
                ))}
              </BoardGroup>
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={reduceMotion ? null : DROP_ANIMATION} zIndex={60}>
          {activeLead ? <KanbanCardOverlay lead={activeLead} now={now} /> : null}
        </DragOverlay>
      </DndContext>

      {dialogs}
    </div>
  );
}

function BoardGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="text-muted-foreground px-1 text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </h2>
      <div className="flex flex-1 items-stretch gap-3">{children}</div>
    </section>
  );
}
