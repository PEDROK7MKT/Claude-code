"use client";

import * as React from "react";
import { ChevronDownIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

import { describeAllowedTransitions, getQuickActions, type QuickActionsLayout, type StatusAction } from "./status-actions";
import {
  DANGER_OUTLINE_CLASS,
  EventBoundary,
  StatusActionIcon,
  stopPropagationHandlers,
  toneButtonVariant,
  useMenuStatusSelect,
} from "./status-ui";
import { useLeadStatusPending, useStatusChange, type StatusChangeResult } from "./use-status-change";

export interface LeadQuickActionsProps {
  lead: Lead;
  /**
   * - "buttons" (padrão): ações principais sempre visíveis; as que não valem para
   *   o status atual ficam desabilitadas com tooltip explicando as próximas etapas.
   * - "menu": menu suspenso só com as ações válidas.
   */
  layout?: QuickActionsLayout;
  size?: "sm" | "default";
  className?: string;
  /** Layout "menu": elemento que abre o menu (padrão: botão "Alterar status"). */
  trigger?: React.ReactNode;
  /** Layout "menu": alinhamento do menu em relação ao gatilho. */
  align?: "start" | "center" | "end";
  disabled?: boolean;
  /** Chamado uma vez por mudança pedida, com o desfecho (sucesso, erro, cancelado…). */
  onStatusChange?: (result: StatusChangeResult) => void;
}

/**
 * Ações rápidas de status do lead (spec §4.3): Marcar como agendado (abre a
 * agenda), Compareceu, Não compareceu, Perdido e, quando são o próximo passo
 * válido, Em contato / Confirmar presença / Cancelar agendamento / Reativar / Reagendar.
 */
export function LeadQuickActions({
  lead,
  layout = "buttons",
  size = "default",
  className,
  trigger,
  align = "end",
  disabled = false,
  onStatusChange,
}: LeadQuickActionsProps) {
  const { requestChange, dialogs, isPending } = useStatusChange(
    onStatusChange ? { onSettled: (result) => onStatusChange(result) } : undefined,
  );
  const busy = useLeadStatusPending(lead.id) || isPending;
  const actions = getQuickActions(lead.status, layout);
  const request = (to: LeadStatus) => {
    void requestChange(lead, to);
  };

  if (layout === "menu") {
    return (
      <QuickActionsMenu
        lead={lead}
        actions={actions}
        size={size}
        className={className}
        trigger={trigger}
        align={align}
        disabled={disabled}
        busy={busy}
        onRequest={request}
        dialogs={dialogs}
      />
    );
  }

  return (
    <div
      role="group"
      aria-label={`Ações rápidas de status de ${lead.name}`}
      aria-busy={busy || undefined}
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...stopPropagationHandlers}
    >
      {actions.map((action) => (
        <QuickActionButton
          key={action.to}
          from={lead.status}
          action={action}
          size={size}
          disabled={disabled || busy}
          onRequest={request}
        />
      ))}
      <span
        role="status"
        className={cn("text-muted-foreground inline-flex items-center gap-1.5 text-xs", !busy && "sr-only")}
      >
        {busy ? (
          <>
            <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
            Salvando…
          </>
        ) : null}
      </span>
      {dialogs}
    </div>
  );
}

interface QuickActionButtonProps {
  from: LeadStatus;
  action: StatusAction;
  size: "sm" | "default";
  disabled: boolean;
  onRequest: (to: LeadStatus) => void;
}

function QuickActionButton({ from, action, size, disabled, onRequest }: QuickActionButtonProps) {
  const danger = action.tone === "danger";
  const className = cn(
    "flex-auto sm:flex-none",
    danger && DANGER_OUTLINE_CLASS,
    // Indisponível: continua focável (tooltip explica o motivo), sem efeito de hover.
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:shadow-none aria-disabled:hover:bg-card",
    danger ? "aria-disabled:hover:text-destructive" : "aria-disabled:hover:text-foreground",
  );

  if (!action.allowed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size={size}
            variant={toneButtonVariant(action.tone)}
            aria-disabled="true"
            className={className}
            // O tooltip não abre no toque (Radix): no celular, o toque mostra o motivo num aviso.
            onClick={() => {
              if (action.disabledReason) toast.info(action.disabledReason, { id: "status-action-unavailable" });
            }}
          >
            <StatusActionIcon from={from} to={action.to} />
            {action.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">{action.disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      variant={toneButtonVariant(action.tone)}
      disabled={disabled}
      title={action.hint ? `${action.label} (${action.hint})` : undefined}
      className={className}
      onClick={() => onRequest(action.to)}
    >
      <StatusActionIcon from={from} to={action.to} />
      {action.label}
    </Button>
  );
}

interface QuickActionsMenuProps {
  lead: Lead;
  actions: StatusAction[];
  size: "sm" | "default";
  className?: string;
  trigger?: React.ReactNode;
  align: "start" | "center" | "end";
  disabled: boolean;
  busy: boolean;
  onRequest: (to: LeadStatus) => void;
  dialogs: React.ReactNode;
}

function QuickActionsMenu({
  lead,
  actions,
  size,
  className,
  trigger,
  align,
  disabled,
  busy,
  onRequest,
  dialogs,
}: QuickActionsMenuProps) {
  const { select, onCloseAutoFocus } = useMenuStatusSelect(onRequest);
  const funnel = actions.filter((action) => action.tone !== "danger");
  const danger = actions.filter((action) => action.tone === "danger");

  const renderItem = (action: StatusAction) => (
    <DropdownMenuItem
      key={action.to}
      variant={action.tone === "danger" ? "destructive" : "default"}
      onSelect={() => select(action.to)}
    >
      <StatusActionIcon from={lead.status} to={action.to} />
      <span className={cn("flex-1", action.recommended && "font-medium")}>{action.label}</span>
      {action.hint ? <span className="text-muted-foreground text-xs">{action.hint}</span> : null}
    </DropdownMenuItem>
  );

  return (
    <EventBoundary>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled || busy}>
          {trigger ?? (
            <Button type="button" variant="outline" size={size} className={className}>
              {busy ? (
                <Loader2Icon aria-hidden="true" className="animate-spin" />
              ) : (
                <RefreshCwIcon aria-hidden="true" />
              )}
              Alterar status
              <ChevronDownIcon aria-hidden="true" className="text-muted-foreground" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-60" onCloseAutoFocus={onCloseAutoFocus}>
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Alterar status</DropdownMenuLabel>
          {actions.length === 0 ? (
            <p className="text-muted-foreground max-w-64 px-2 pb-1.5 text-sm">{describeAllowedTransitions(lead.status)}</p>
          ) : null}
          {funnel.length ? <DropdownMenuGroup>{funnel.map(renderItem)}</DropdownMenuGroup> : null}
          {funnel.length && danger.length ? <DropdownMenuSeparator /> : null}
          {danger.length ? <DropdownMenuGroup>{danger.map(renderItem)}</DropdownMenuGroup> : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </EventBoundary>
  );
}
