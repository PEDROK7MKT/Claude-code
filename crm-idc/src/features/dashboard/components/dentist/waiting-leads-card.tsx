"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, BellRingIcon, ClockIcon, Loader2Icon, MessageSquareReplyIcon, PartyPopperIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeadStatusPending, useStatusChange } from "@/features/leads/components/status";
import { SERVICE_LABEL, SOURCE_LABEL } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";
import { countWaitingByLevel, waitingLevel, type WaitingLevel } from "../../lib/dentist-dashboard";
import { ListSkeleton } from "./list-skeleton";

/** Quantos leads a fila mostra antes do "Ver todos". */
const MAX_VISIBLE = 8;

const LEVEL_CLASS: Record<WaitingLevel, string> = {
  ok: "text-muted-foreground",
  warning: "text-amber-700 font-medium",
  critical: "text-red-700 font-semibold",
};

const LEVEL_SR: Record<WaitingLevel, string> = {
  ok: "",
  warning: " (esperando há mais de 2 horas)",
  critical: " (esperando há mais de 24 horas)",
};

export interface WaitingLeadsCardProps {
  /** Leads em "novo", do mais antigo para o mais recente */
  leads: readonly Lead[] | null;
  now: number;
  loading: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** "Leads aguardando resposta" (status novo): quem espera há mais tempo primeiro + "Em contato" em um clique. */
export function WaitingLeadsCard({ leads, now, loading, onRetry, retrying, className }: WaitingLeadsCardProps) {
  const { requestChange, dialogs } = useStatusChange();
  const visible = leads?.slice(0, MAX_VISIBLE) ?? [];
  const total = leads?.length ?? 0;
  const counts = React.useMemo(() => countWaitingByLevel(leads ?? [], now), [leads, now]);

  return (
    <Card className={cn("min-w-0 gap-4", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700">
            <BellRingIcon className="size-4" />
          </span>
          <h2 className="text-base leading-tight font-semibold">Leads aguardando resposta</h2>
        </CardTitle>
        <CardDescription>Status “novo”, de quem espera há mais tempo</CardDescription>
        {leads && total > 0 ? (
          <CardAction>
            <Badge className="bg-blue-600 tabular-nums text-white">{formatNumber(total)}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        {loading ? (
          <ListSkeleton rows={4} label="Carregando leads aguardando resposta…" />
        ) : !leads ? (
          <ErrorState size="sm" onRetry={onRetry} retrying={retrying} />
        ) : total === 0 ? (
          <EmptyState
            size="sm"
            icon={PartyPopperIcon}
            title="Nenhum lead aguardando resposta"
            description="Todos os contatos novos já foram respondidos. Os próximos aparecem aqui na hora."
          />
        ) : (
          <div className="space-y-3">
            {counts.critical > 0 || counts.warning > 0 ? (
              <p className="flex flex-wrap gap-2 px-1 text-xs">
                {counts.critical > 0 ? (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-medium text-red-700 tabular-nums">
                    {formatNumber(counts.critical)} há mais de 24 h
                  </span>
                ) : null}
                {counts.warning > 0 ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-800 tabular-nums">
                    {formatNumber(counts.warning)} há mais de 2 h
                  </span>
                ) : null}
              </p>
            ) : null}

            <ul className="divide-y">
              {visible.map((lead) => (
                <WaitingLeadRow
                  key={lead.id}
                  lead={lead}
                  level={waitingLevel(lead.created_at, now)}
                  onContact={() => void requestChange(lead, "em_contato")}
                />
              ))}
            </ul>

            {total > visible.length ? (
              <Button asChild variant="ghost" size="sm" className="text-primary w-full">
                <Link href="/leads?status=novo">
                  Ver todos os {formatNumber(total)} leads novos
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
        )}
        {dialogs}
      </CardContent>
    </Card>
  );
}

function WaitingLeadRow({ lead, level, onContact }: { lead: Lead; level: WaitingLevel; onContact: () => void }) {
  const pending = useLeadStatusPending(lead.id);
  const service = lead.service ? SERVICE_LABEL[lead.service] : null;

  return (
    <li
      className={cn(
        "flex items-center gap-3 border-l-2 py-3 pl-2.5",
        level === "critical" ? "border-l-red-500" : level === "warning" ? "border-l-amber-500" : "border-l-transparent",
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <Link
          href={`/leads/${lead.id}`}
          className="text-foreground block truncate rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {lead.name}
        </Link>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className={cn("inline-flex items-center gap-1", LEVEL_CLASS[level])}>
            <ClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <time dateTime={lead.created_at} title={`Chegou em ${formatDateTime(lead.created_at)}`}>
              {formatRelative(lead.created_at)}
            </time>
            <span className="sr-only">{LEVEL_SR[level]}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{service ?? SOURCE_LABEL[lead.source]}</span>
        </p>
      </div>

      <WhatsAppButton phone={lead.phone} name={lead.name} iconOnly size="sm" variant="outline" />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onContact}
        disabled={pending}
        aria-label={`Marcar ${lead.name} como em contato`}
      >
        {pending ? (
          <Loader2Icon aria-hidden="true" className="animate-spin" />
        ) : (
          <MessageSquareReplyIcon aria-hidden="true" />
        )}
        <span className="hidden min-[400px]:inline">Em contato</span>
      </Button>
    </li>
  );
}
