"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRightIcon, Link2Icon, UsersRoundIcon } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLead, useLeadsByPhone } from "@/features/leads/api/leads-queries";
import { samePhoneTitle, sortDuplicates } from "@/features/leads/lib/lead-duplicates";
import { leadDetailHref } from "@/features/leads/lib/list-display";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import type { Lead } from "@/types/database";

/**
 * Leads vinculados (regra 4): o contato anterior a que este cadastro foi ligado
 * (parent_lead_id) e os demais leads com o mesmo telefone.
 */
export function LinkedLeadsCard({ lead }: { lead: Lead }) {
  const parent = useLead(lead.parent_lead_id);
  const samePhone = useLeadsByPhone(lead.phone, { excludeId: lead.id });
  const others = React.useMemo(
    () => sortDuplicates((samePhone.data ?? []).filter((other) => other.id !== lead.parent_lead_id)),
    [samePhone.data, lead.parent_lead_id],
  );
  const title = samePhoneTitle(lead, others);
  const parentLead = lead.parent_lead_id ? parent.data : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <UsersRoundIcon aria-hidden="true" className="text-primary size-4" />
            Contatos vinculados
          </h2>
        </CardTitle>
        <CardDescription>Cadastros anteriores do mesmo paciente.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {lead.parent_lead_id ? (
          <section aria-label="Lead anterior vinculado" className="grid gap-2">
            <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Link2Icon aria-hidden="true" className="size-3.5" />
              Vinculado a
            </h3>
            {parent.isPending ? (
              <Skeleton className="h-14 w-full rounded-lg" />
            ) : parentLead ? (
              <LinkedLeadRow lead={parentLead} />
            ) : (
              <p className="text-muted-foreground text-sm">O lead vinculado não está disponível.</p>
            )}
          </section>
        ) : null}

        <section aria-label={title} className="grid gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
          {samePhone.isPending ? (
            <div role="status" aria-busy="true" className="grid gap-2">
              <span className="sr-only">Carregando contatos…</span>
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : samePhone.isError ? (
            <ErrorState
              size="sm"
              title="Não foi possível buscar outros contatos"
              message={getErrorMessage(samePhone.error)}
              onRetry={() => void samePhone.refetch()}
              retrying={samePhone.isFetching}
            />
          ) : others.length === 0 ? (
            <EmptyState
              size="sm"
              icon={UsersRoundIcon}
              title="Nenhum outro contato com este telefone"
              description="Se o paciente entrar em contato de novo, cadastre e vincule a este lead."
              action={{ label: "Novo lead", href: "/leads/novo", variant: "outline" }}
            />
          ) : (
            <ul className="grid gap-2">
              {others.map((other) => (
                <li key={other.id}>
                  <LinkedLeadRow lead={other} linked={other.parent_lead_id === lead.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function LinkedLeadRow({ lead, linked = false }: { lead: Lead; linked?: boolean }) {
  return (
    <Link
      href={leadDetailHref(lead.id)}
      className="hover:bg-muted/50 focus-visible:ring-ring/50 group flex items-center gap-3 rounded-lg border p-3 outline-none focus-visible:ring-[3px]"
    >
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">{lead.name.trim() || "Sem nome"}</span>
          <StatusBadge status={lead.status} />
        </span>
        <span className="text-muted-foreground flex flex-wrap gap-x-2 text-xs tabular-nums">
          <span>Entrada: {formatDate(lead.created_at)}</span>
          {lead.service ? <span>{SERVICE_LABEL[lead.service]}</span> : null}
          {linked ? <span className="text-primary font-medium">vinculado a este lead</span> : null}
        </span>
      </span>
      <ChevronRightIcon
        aria-hidden="true"
        className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
