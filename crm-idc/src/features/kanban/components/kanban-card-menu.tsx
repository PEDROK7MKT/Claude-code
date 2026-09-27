"use client";

import * as React from "react";
import Link from "next/link";
import { EllipsisVerticalIcon, ExternalLinkIcon, MessageCircleIcon } from "lucide-react";

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
import { describeAllowedTransitions, getStatusChangeOptions, type StatusAction } from "@/features/leads/components/status";
import { EventBoundary, StatusActionIcon, useMenuStatusSelect } from "@/features/leads/components/status/status-ui";
import { leadDetailHref } from "@/features/leads/lib/list-display";
import { STATUS_META } from "@/lib/constants";
import { whatsappUrl } from "@/lib/format";
import type { Lead, LeadStatus } from "@/types/database";

export interface KanbanCardMenuProps {
  lead: Lead;
  /** Pede a mudança pelo quadro (diálogos únicos no nível do board) */
  onMove: (lead: Lead, to: LeadStatus) => void;
  disabled?: boolean;
  whatsappMessage?: string;
}

/**
 * "Mover para…" do card: alternativa ao arraste (teclado, leitor de tela,
 * toque). Lista só as transições permitidas (regra 2); agendar abre a agenda
 * e perdido/cancelado pedem confirmação — os diálogos ficam no quadro.
 */
export function KanbanCardMenu({ lead, onMove, disabled = false, whatsappMessage }: KanbanCardMenuProps) {
  const options = getStatusChangeOptions(lead.status);
  const funnel = options.filter((option) => option.tone !== "danger");
  const danger = options.filter((option) => option.tone === "danger");
  const { select, onCloseAutoFocus } = useMenuStatusSelect((to) => onMove(lead, to));

  return (
    <EventBoundary>
      <span data-no-dnd="" className="contents">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Mover ${lead.name} para…`}
              title="Mover para…"
              className="text-muted-foreground hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground relative z-10 size-8 shrink-0"
            >
              <EllipsisVerticalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64" onCloseAutoFocus={onCloseAutoFocus}>
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Mover para…</DropdownMenuLabel>
            {options.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-sm text-pretty">{describeAllowedTransitions(lead.status)}</p>
            ) : null}
            {funnel.length ? (
              <DropdownMenuGroup>
                {funnel.map((option) => (
                  <MoveOption key={option.to} from={lead.status} option={option} onSelect={select} />
                ))}
              </DropdownMenuGroup>
            ) : null}
            {funnel.length && danger.length ? <DropdownMenuSeparator /> : null}
            {danger.length ? (
              <DropdownMenuGroup>
                {danger.map((option) => (
                  <MoveOption key={option.to} from={lead.status} option={option} onSelect={select} />
                ))}
              </DropdownMenuGroup>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={leadDetailHref(lead.id)}>
                <ExternalLinkIcon aria-hidden="true" />
                Abrir lead
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={whatsappUrl(lead.phone, lead.name, whatsappMessage)} target="_blank" rel="noopener noreferrer">
                <MessageCircleIcon aria-hidden="true" className="text-green-600" />
                Conversar no WhatsApp
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </EventBoundary>
  );
}

function MoveOption({
  from,
  option,
  onSelect,
}: {
  from: LeadStatus;
  option: StatusAction;
  onSelect: (to: LeadStatus) => void;
}) {
  return (
    <DropdownMenuItem
      variant={option.tone === "danger" ? "destructive" : "default"}
      onSelect={() => onSelect(option.to)}
      className="items-start gap-2.5 py-2"
    >
      <StatusActionIcon from={from} to={option.to} className="mt-0.5" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          {option.label}
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_META[option.to].color }}
          />
        </span>
        {option.hint ? <span className="text-muted-foreground text-xs font-normal">{option.hint}</span> : null}
      </span>
    </DropdownMenuItem>
  );
}
