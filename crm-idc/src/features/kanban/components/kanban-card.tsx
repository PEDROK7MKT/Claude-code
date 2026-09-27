"use client";

import * as React from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import {
  AlarmClockIcon,
  CalendarClockIcon,
  Clock3Icon,
  EllipsisVerticalIcon,
  HourglassIcon,
  Loader2Icon,
  SmartphoneIcon,
} from "lucide-react";

import { PhoneLink } from "@/components/shared/phone-link";
import { SourceBadge } from "@/components/shared/source-badge";
import { formatEntryAge, getAppointmentDisplay, leadDetailHref } from "@/features/leads/lib/list-display";
import { isMovableStatus } from "@/features/kanban/lib/columns";
import { cardServiceLabel, showsAppointment } from "@/features/kanban/lib/card";
import { STATUS_META } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

import type { DraggableLeadData } from "../hooks/use-kanban-dnd";
import { KanbanCardMenu } from "./kanban-card-menu";
import { ToothIcon } from "./tooth-icon";

/** Indicador de movimento pendente do card. */
export type KanbanCardPending = "awaiting" | "saving" | null;

/** Atributo com o id do lead no link do card (devolve o foco depois de mover pelo menu/teclado). */
export const CARD_FOCUS_ATTRIBUTE = "data-kanban-focus";

export interface KanbanCardProps {
  lead: Lead;
  /** Relógio do quadro (ms) — atualiza "há 2 horas" e consultas atrasadas */
  now: number;
  /** Movimento pendente (inclui mudanças salvas a partir de outras telas) */
  pending: KanbanCardPending;
  /** Coluna apagada (não compareceu, cancelado, perdido) */
  muted?: boolean;
  onMove: (lead: Lead, to: LeadStatus) => void;
  whatsappMessage?: string;
}

/**
 * Card do lead no kanban (spec §12): arrastável com mouse (6px), toque
 * (segurar 200ms) e teclado (Espaço no nome); clique abre o lead. Telefone e
 * menu "Mover para…" ficam acima do link que cobre o card e não iniciam arraste.
 */
export const KanbanCard = React.memo(function KanbanCard({
  lead,
  now,
  pending,
  muted = false,
  onMove,
  whatsappMessage,
}: KanbanCardProps) {
  const nameId = React.useId();
  const busy = pending !== null;
  const movable = isMovableStatus(lead.status) && !busy;

  const data: DraggableLeadData = { lead };
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: lead.id,
    data,
    disabled: !movable,
  });
  // teclado só no link do nome (Espaço pega o card); ponteiro/toque no card inteiro
  const { onKeyDown: dragKeyDown, ...pointerListeners } = listeners ?? {};
  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    dragKeyDown?.(event);
  };

  return (
    <article
      ref={setNodeRef}
      {...pointerListeners}
      aria-labelledby={nameId}
      aria-busy={busy || undefined}
      data-dragging={isDragging || undefined}
      data-pending={pending ?? undefined}
      className={cn(
        "group/card bg-card relative rounded-lg border p-3 shadow-xs select-none [-webkit-touch-callout:none]",
        "transition-[border-color,box-shadow,opacity] duration-200",
        "has-[[data-card-link]:hover]:border-primary/40 has-[[data-card-link]:hover]:shadow-md",
        "has-[[data-card-link]:focus-visible]:ring-ring/50 has-[[data-card-link]:focus-visible]:ring-[3px]",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300",
        muted && "bg-card/85",
        pending === "awaiting" && "border-primary/50 ring-primary/15 border-dashed ring-2",
        pending === "saving" && "opacity-80",
        isDragging && "border-primary/40 bg-card/60 border-dashed opacity-40 shadow-none",
      )}
    >
      <KanbanCardContent
        lead={lead}
        now={now}
        pending={pending}
        muted={muted}
        nameId={nameId}
        title={
          <Link
            ref={setActivatorNodeRef}
            href={leadDetailHref(lead.id)}
            draggable={false}
            data-card-link
            data-kanban-focus={lead.id}
            aria-describedby={movable ? attributes["aria-describedby"] : undefined}
            onKeyDown={handleKeyDown}
            className="rounded-sm outline-none [-webkit-touch-callout:none] after:absolute after:inset-0 after:rounded-lg"
          >
            <span className="line-clamp-2 break-words">{lead.name}</span>
          </Link>
        }
        phone={
          <span data-no-dnd="" className="relative z-10 min-w-0">
            <PhoneLink phone={lead.phone} name={lead.name} message={whatsappMessage} showIcon={false} />
          </span>
        }
        actions={
          <KanbanCardMenu lead={lead} onMove={onMove} disabled={busy} whatsappMessage={whatsappMessage} />
        }
      />
    </article>
  );
});

/** Card "levantado" que acompanha o ponteiro durante o arraste (DragOverlay). */
export function KanbanCardOverlay({ lead, now }: { lead: Lead; now: number }) {
  const nameId = React.useId();
  return (
    <div
      aria-hidden="true"
      className="bg-card ring-primary/40 relative h-full cursor-grabbing rounded-lg border p-3 shadow-2xl ring-2 motion-safe:rotate-2"
    >
      <KanbanCardContent
        lead={lead}
        now={now}
        pending={null}
        nameId={nameId}
        title={<span className="line-clamp-2 break-words">{lead.name}</span>}
        phone={<span className="text-foreground tabular-nums">{formatPhone(lead.phone)}</span>}
        actions={
          <span className="text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center">
            <EllipsisVerticalIcon className="size-4" />
          </span>
        }
      />
    </div>
  );
}

interface KanbanCardContentProps {
  lead: Lead;
  now: number;
  pending: KanbanCardPending;
  muted?: boolean;
  nameId: string;
  title: React.ReactNode;
  phone: React.ReactNode;
  actions: React.ReactNode;
}

/** Conteúdo do card: nome, telefone, serviço, tempo desde a entrada e fonte (spec §12). */
function KanbanCardContent({ lead, now, pending, muted = false, nameId, title, phone, actions }: KanbanCardContentProps) {
  const service = cardServiceLabel(lead);

  return (
    <>
      <div className="flex items-start gap-1">
        <h4
          id={nameId}
          className={cn("min-w-0 flex-1 pt-1 text-sm leading-snug font-semibold", muted && "text-foreground/80")}
        >
          {title}
        </h4>
        <div className="-mt-0.5 -mr-1.5">{actions}</div>
      </div>

      {showsAppointment(lead.status) ? <CardAppointment lead={lead} now={now} awaiting={pending === "awaiting"} /> : null}

      <ul className="text-muted-foreground mt-2 space-y-1.5 text-[13px] leading-tight">
        <li className="flex min-w-0 items-center gap-2">
          <SmartphoneIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {phone}
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <ToothIcon className="size-3.5" />
          <span className="sr-only">Serviço: </span>
          {service ? (
            <span className="text-foreground/90 truncate">{service}</span>
          ) : (
            <span className="italic">Serviço não informado</span>
          )}
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <Clock3Icon aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="sr-only">Entrou </span>
          <time dateTime={lead.created_at} title={`Entrou em ${formatDateTime(lead.created_at)}`} className="tabular-nums">
            {formatEntryAge(lead.created_at, now)}
          </time>
        </li>
      </ul>

      <div className="mt-2.5 flex min-h-5 items-center justify-between gap-2 border-t pt-2">
        <SourceBadge source={lead.source} variant="plain" className="min-w-0 truncate" />
        <PendingIndicator pending={pending} />
      </div>
    </>
  );
}

function PendingIndicator({ pending }: { pending: KanbanCardPending }) {
  if (pending === "saving") {
    return (
      <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs">
        <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
        Salvando…
      </span>
    );
  }
  if (pending === "awaiting") {
    return (
      <span className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium">
        <HourglassIcon aria-hidden="true" className="size-3.5" />
        Aguardando…
      </span>
    );
  }
  return null;
}

/** Consulta em destaque (agendado/confirmado): hoje em dourado, atrasada em vermelho. */
function CardAppointment({ lead, now, awaiting }: { lead: Lead; now: number; awaiting: boolean }) {
  const base = "mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold ring-1 ring-inset";

  // arrastado para "Agendado": a data vem do diálogo
  if (awaiting && lead.status === "agendado") {
    return (
      <p className={cn(base, "text-primary ring-primary/30 bg-primary/5 font-medium")}>
        <CalendarClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
        Definindo data e hora…
      </p>
    );
  }

  const display = getAppointmentDisplay(lead, now);
  if (display.tone === "none" || !lead.scheduled_at) {
    return (
      <p className={cn(base, "bg-warning/10 ring-warning/40 font-medium text-yellow-800")}>
        <CalendarClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
        Consulta sem data definida
      </p>
    );
  }

  const overdue = display.tone === "overdue";
  return (
    <p
      className={cn(
        base,
        "tabular-nums",
        overdue
          ? "bg-destructive/10 text-destructive ring-destructive/30"
          : display.isToday
            ? "bg-gold/15 text-gold-foreground ring-gold/40"
            : STATUS_META[lead.status].badgeClass,
      )}
    >
      {overdue ? (
        <AlarmClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
      ) : (
        <CalendarClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
      )}
      <span className="sr-only">Consulta: </span>
      <time dateTime={lead.scheduled_at} title={display.full ?? undefined} className="truncate">
        {display.label}
      </time>
      {overdue ? <span className="ml-auto shrink-0 text-[11px] font-medium">horário passou</span> : null}
    </p>
  );
}
