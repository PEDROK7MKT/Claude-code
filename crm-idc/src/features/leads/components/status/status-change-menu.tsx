"use client";

import * as React from "react";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

import { describeAllowedTransitions, getStatusChangeOptions, type StatusAction } from "./status-actions";
import { EventBoundary, useMenuStatusSelect } from "./status-ui";
import { useLeadStatusPending, useStatusChange, type StatusChangeResult } from "./use-status-change";

export interface StatusChangeMenuProps {
  lead: Lead;
  /**
   * Elemento que abre o menu. Padrão: o próprio badge de status, clicável
   * (em status final, sem próximas etapas, o badge é exibido sem menu).
   */
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  disabled?: boolean;
  /** Classes do gatilho padrão (badge). */
  className?: string;
  /** Chamado uma vez por mudança pedida, com o desfecho (sucesso, erro, cancelado…). */
  onStatusChange?: (result: StatusChangeResult) => void;
}

/**
 * Menu com todas as transições permitidas a partir do status atual (regra 2),
 * com prévia do badge de destino. Agendar abre a agenda; perdido/cancelado pedem
 * confirmação. Pode ficar dentro de linhas clicáveis e cards do kanban: cliques
 * e teclas não se propagam.
 */
export function StatusChangeMenu({
  lead,
  trigger,
  align = "start",
  disabled = false,
  className,
  onStatusChange,
}: StatusChangeMenuProps) {
  const { requestChange, dialogs, isPending } = useStatusChange(
    onStatusChange ? { onSettled: (result) => onStatusChange(result) } : undefined,
  );
  const busy = useLeadStatusPending(lead.id) || isPending;
  const options = getStatusChangeOptions(lead.status);
  const { select, onCloseAutoFocus } = useMenuStatusSelect((to: LeadStatus) => {
    void requestChange(lead, to);
  });

  if (!trigger && options.length === 0) {
    const finalHint = describeAllowedTransitions(lead.status);
    return (
      <span className={cn("inline-flex items-center", className)} title={finalHint}>
        <StatusBadge status={lead.status} />
        <span className="sr-only">. {finalHint}</span>
      </span>
    );
  }

  const funnel = options.filter((option) => option.tone !== "danger");
  const danger = options.filter((option) => option.tone === "danger");

  return (
    <EventBoundary>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled || busy}>
          {trigger ?? (
            <button
              type="button"
              aria-label={`Status: ${STATUS_META[lead.status].label}. Alterar status de ${lead.name}`}
              className={cn(
                "group/status focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed",
                // área de toque ≥ 24px (WCAG 2.5.8) sem mudar o visual do badge
                "relative after:absolute after:-inset-x-1 after:-inset-y-2",
                className,
              )}
            >
              <StatusBadge
                status={lead.status}
                className="transition-shadow group-hover/status:ring-2 group-data-[state=open]/status:ring-2"
              />
              {busy ? (
                <Loader2Icon aria-hidden="true" className="text-muted-foreground size-3.5 animate-spin" />
              ) : (
                <ChevronDownIcon
                  aria-hidden="true"
                  className="text-muted-foreground size-3.5 transition-transform group-data-[state=open]/status:rotate-180"
                />
              )}
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-56" onCloseAutoFocus={onCloseAutoFocus}>
          <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
            Status atual
            <StatusBadge status={lead.status} />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.length === 0 ? (
            <p className="text-muted-foreground max-w-64 px-2 py-1.5 text-sm">{describeAllowedTransitions(lead.status)}</p>
          ) : (
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Mover para</DropdownMenuLabel>
          )}
          {funnel.length ? (
            <DropdownMenuGroup>
              {funnel.map((option) => (
                <StatusOptionItem key={option.to} option={option} onSelect={select} />
              ))}
            </DropdownMenuGroup>
          ) : null}
          {funnel.length && danger.length ? <DropdownMenuSeparator /> : null}
          {danger.length ? (
            <DropdownMenuGroup>
              {danger.map((option) => (
                <StatusOptionItem key={option.to} option={option} onSelect={select} />
              ))}
            </DropdownMenuGroup>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </EventBoundary>
  );
}

function StatusOptionItem({ option, onSelect }: { option: StatusAction; onSelect: (to: LeadStatus) => void }) {
  // Rótulo de ação quando acrescenta informação ao badge (ex.: "Reagendar", "Confirmar presença").
  const actionLabel = option.label.toLowerCase() !== STATUS_META[option.to].label ? option.label : null;
  const detail = [actionLabel, option.hint].filter(Boolean).join(" · ");
  return (
    <DropdownMenuItem onSelect={() => onSelect(option.to)} className="justify-between gap-4">
      <StatusBadge status={option.to} />
      {detail ? <span className="text-muted-foreground text-xs">{detail}</span> : null}
    </DropdownMenuItem>
  );
}
