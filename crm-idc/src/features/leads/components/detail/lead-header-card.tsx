"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClockIcon,
  Link2Icon,
  PhoneIcon,
  StethoscopeIcon,
  UserRoundCheckIcon,
  type LucideIcon,
} from "lucide-react";

import { SourceBadge } from "@/components/shared/source-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusChangeMenu } from "@/features/leads/components/status";
import { leadDetailHref } from "@/features/leads/lib/list-display";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatPhone } from "@/lib/format";
import type { Lead, Profile } from "@/types/database";

import { CopyButton } from "./copy-button";
import { RelativeTime } from "./relative-time";

export interface LeadHeaderCardProps {
  lead: Lead;
  whatsappMessage?: string;
  profiles?: readonly Profile[];
}

/**
 * Cabeçalho do detalhe: nome, status (com menu de mudança), telefone + WhatsApp,
 * entrada ("há X" com a data completa), fonte, serviço e responsável. A consulta
 * marcada fica no card de ações, onde o horário pode ser alterado.
 */
export function LeadHeaderCard({ lead, whatsappMessage, profiles }: LeadHeaderCardProps) {
  const assignee = lead.assigned_to ? profiles?.find((p) => p.id === lead.assigned_to)?.full_name : null;
  const service = lead.service ? SERVICE_LABEL[lead.service] : null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div aria-hidden="true" className="from-primary via-primary/70 to-accent h-1 bg-linear-to-r" />
      <CardContent className="grid gap-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight break-words">
              {lead.name.trim() || "Sem nome"}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChangeMenu lead={lead} />
              <SourceBadge source={lead.source} />
              {lead.parent_lead_id ? (
                <Link
                  href={leadDetailHref(lead.parent_lead_id)}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm text-xs font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
                >
                  <Link2Icon aria-hidden="true" className="size-3.5" />
                  Vinculado a um contato anterior
                </Link>
              ) : null}
            </div>
          </div>
          <WhatsAppButton
            phone={lead.phone}
            name={lead.name}
            message={whatsappMessage}
            label="Abrir WhatsApp"
            className="hidden w-fit sm:inline-flex"
          />
        </div>

        <dl className="text-muted-foreground grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <MetaItem icon={PhoneIcon} label="Telefone">
            <span className="text-foreground font-medium tabular-nums">{formatPhone(lead.phone)}</span>
            <CopyButton value={lead.phone} label="telefone" className="-my-1" />
          </MetaItem>
          <MetaItem icon={CalendarClockIcon} label="Entrada">
            <RelativeTime value={lead.created_at} prefix="Entrou" />
          </MetaItem>
          <MetaItem icon={StethoscopeIcon} label="Serviço">
            <span className={service ? "text-foreground" : undefined}>
              {service ?? "Serviço não informado"}
              {lead.service_detail ? <span className="text-muted-foreground"> · {lead.service_detail}</span> : null}
            </span>
          </MetaItem>
          <MetaItem icon={UserRoundCheckIcon} label="Responsável">
            <span className={assignee ? "text-foreground" : undefined}>{assignee ?? "Sem responsável"}</span>
          </MetaItem>
        </dl>
      </CardContent>
    </Card>
  );
}

function MetaItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <dt className="sr-only">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1">{children}</dd>
    </div>
  );
}
