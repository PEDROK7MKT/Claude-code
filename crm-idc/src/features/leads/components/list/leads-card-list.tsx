"use client";

import * as React from "react";
import Link from "next/link";

import { PhoneLink } from "@/components/shared/phone-link";
import { SourceBadge } from "@/components/shared/source-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { StatusChangeMenu } from "@/features/leads/components/status";
import { formatEntryAge, leadDetailHref } from "@/features/leads/lib/list-display";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";

import { AppointmentInfo } from "./appointment-info";
import { flashFreshOverlay } from "./use-fresh-lead-ids";

export interface LeadsCardListProps {
  rows: readonly Lead[];
  now: number;
  freshIds: ReadonlySet<string>;
  busy?: boolean;
  /** Modelo da mensagem do WhatsApp (Configurações); padrão: DEFAULT_WHATSAPP_MESSAGE */
  whatsappMessage?: string;
  className?: string;
}

/** Leads em cards empilhados (< md) — spec §5: "tabelas em mobile viram cards". */
export function LeadsCardList({ rows, now, freshIds, busy = false, whatsappMessage, className }: LeadsCardListProps) {
  return (
    <ul
      aria-label="Leads"
      aria-busy={busy}
      className={cn("space-y-3 transition-opacity duration-200", busy && "opacity-60", className)}
    >
      {rows.map((lead) => (
        <li key={lead.id}>
          <LeadCard lead={lead} now={now} fresh={freshIds.has(lead.id)} whatsappMessage={whatsappMessage} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Card inteiro clicável pelo link do nome (camada `after:` cobrindo o card);
 * status, telefone e WhatsApp ficam acima dela (`relative z-10`) com ação própria.
 */
interface LeadCardProps {
  lead: Lead;
  now: number;
  fresh: boolean;
  whatsappMessage?: string;
}

function LeadCard({ lead, now, fresh, whatsappMessage }: LeadCardProps) {
  const nameId = React.useId();
  const href = leadDetailHref(lead.id);

  return (
    <article
      aria-labelledby={nameId}
      className="bg-card has-[[data-card-link]:focus-visible]:ring-ring/50 has-[[data-card-link]:hover]:border-primary/30 relative rounded-xl border p-4 shadow-xs transition-[border-color,box-shadow] has-[[data-card-link]:focus-visible]:ring-[3px]"
    >
      {fresh ? (
        <span
          aria-hidden="true"
          ref={flashFreshOverlay}
          className="bg-gold/25 pointer-events-none absolute inset-0 rounded-xl opacity-0"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 id={nameId} className="flex min-w-0 items-center gap-2 leading-tight font-semibold">
            <Link
              href={href}
              data-card-link
              className="truncate outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              {lead.name}
            </Link>
            {fresh ? (
              <Badge variant="gold" className="shrink-0">
                agora
              </Badge>
            ) : null}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Entrou{" "}
            <time dateTime={lead.created_at} title={formatDateTime(lead.created_at)}>
              {formatEntryAge(lead.created_at, now)}
            </time>
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <StatusChangeMenu lead={lead} align="end" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <PhoneLink phone={lead.phone} name={lead.name} message={whatsappMessage} className="relative z-10 text-sm" />
        <WhatsAppButton
          phone={lead.phone}
          name={lead.name}
          message={whatsappMessage}
          size="sm"
          variant="outline"
          iconOnly
          className="relative z-10"
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t pt-3 text-sm">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs">Fonte</dt>
          <dd className="mt-0.5 min-w-0">
            <SourceBadge source={lead.source} variant="plain" className="text-foreground max-w-full" />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-xs">Serviço</dt>
          <dd className="mt-0.5 truncate">
            {lead.service ? SERVICE_LABEL[lead.service] : <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
        {lead.scheduled_at ? (
          <div className="col-span-2">
            <dt className="text-muted-foreground text-xs">Agendamento</dt>
            <dd className="mt-0.5">
              <AppointmentInfo lead={lead} now={now} />
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
