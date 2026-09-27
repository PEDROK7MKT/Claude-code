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
  type LucideProps,
} from "lucide-react";

import type { LeadStatus } from "@/types/database";

import { isReschedule, statusChangeFlow, type StatusActionTone } from "./status-actions";

/** Ícone da ação `from → to` (ex.: reagendar usa o calendário com setas). */
export function StatusActionIcon({ from, to, ...props }: { from: LeadStatus; to: LeadStatus } & LucideProps) {
  switch (to) {
    case "novo":
      return <CircleDotIcon aria-hidden="true" {...props} />;
    case "em_contato":
      return from === "perdido" ? (
        <RotateCcwIcon aria-hidden="true" {...props} />
      ) : (
        <MessageCircleIcon aria-hidden="true" {...props} />
      );
    case "agendado":
      return isReschedule(from) ? (
        <CalendarSyncIcon aria-hidden="true" {...props} />
      ) : (
        <CalendarPlusIcon aria-hidden="true" {...props} />
      );
    case "confirmado":
      return <CalendarCheckIcon aria-hidden="true" {...props} />;
    case "compareceu":
      return <UserCheckIcon aria-hidden="true" {...props} />;
    case "nao_compareceu":
      return <UserXIcon aria-hidden="true" {...props} />;
    case "cancelado":
      return <CalendarXIcon aria-hidden="true" {...props} />;
    case "perdido":
      return <BanIcon aria-hidden="true" {...props} />;
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
 * Seleção de status a partir de um DropdownMenu. Mudanças diretas são pedidas na
 * hora; as que abrem diálogo esperam o menu fechar e devolver o foco ao gatilho
 * (`onCloseAutoFocus`), para que o diálogo devolva o foco a ele ao fechar.
 */
export function useMenuStatusSelect(onRequest: (to: LeadStatus) => void): {
  select: (to: LeadStatus) => void;
  onCloseAutoFocus: () => void;
} {
  const deferredRef = React.useRef<LeadStatus | null>(null);
  return {
    select: (to) => {
      if (statusChangeFlow(to) === "immediate") onRequest(to);
      else deferredRef.current = to;
    },
    onCloseAutoFocus: () => {
      const to = deferredRef.current;
      deferredRef.current = null;
      if (to) onRequest(to);
    },
  };
}

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
