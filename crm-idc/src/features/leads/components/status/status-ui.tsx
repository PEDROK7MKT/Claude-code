"use client";

import * as React from "react";
import {
  BanIcon,
  CalendarCheckIcon,
  CalendarPlusIcon,
  CalendarSyncIcon,
  CalendarXIcon,
  CircleDotIcon,
  MessageCircleIcon,
  RotateCcwIcon,
  UserCheckIcon,
  UserXIcon,
  type LucideIcon,
} from "lucide-react";

import type { LeadStatus } from "@/types/database";

import { isReschedule, type StatusActionTone } from "./status-actions";

/** Ícone da ação `from → to` (ex.: reagendar usa o calendário com setas). */
export function statusActionIcon(from: LeadStatus, to: LeadStatus): LucideIcon {
  switch (to) {
    case "novo":
      return CircleDotIcon;
    case "em_contato":
      return from === "perdido" ? RotateCcwIcon : MessageCircleIcon;
    case "agendado":
      return isReschedule(from) ? CalendarSyncIcon : CalendarPlusIcon;
    case "confirmado":
      return CalendarCheckIcon;
    case "compareceu":
      return UserCheckIcon;
    case "nao_compareceu":
      return UserXIcon;
    case "cancelado":
      return CalendarXIcon;
    case "perdido":
      return BanIcon;
  }
}

/** Variante do Button para cada tom de ação. */
export function toneButtonVariant(tone: StatusActionTone): "default" | "outline" {
  return tone === "primary" ? "default" : "outline";
}

/** Classes extras do Button para ações "destrutivas" (contorno com texto vermelho). */
export const DANGER_OUTLINE_CLASS =
  "text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20";

function stop(event: React.SyntheticEvent) {
  event.stopPropagation();
}

/**
 * Handlers que impedem que cliques/teclas cheguem a linhas clicáveis ou cards
 * arrastáveis (kanban) que contêm o componente. Eventos de React atravessam
 * portais, então menus e diálogos abertos daqui também precisam deles.
 */
export const stopPropagationHandlers = {
  onClick: stop,
  onDoubleClick: stop,
  onPointerDown: stop,
  onMouseDown: stop,
  onTouchStart: stop,
  onKeyDown: stop,
} as const;

/**
 * Envolve conteúdo (normalmente portais: diálogos, menus) sem gerar caixa no
 * layout e isola os eventos do elemento pai.
 */
export function EventBoundary({ children }: { children: React.ReactNode }) {
  return (
    <span className="contents" {...stopPropagationHandlers}>
      {children}
    </span>
  );
}
