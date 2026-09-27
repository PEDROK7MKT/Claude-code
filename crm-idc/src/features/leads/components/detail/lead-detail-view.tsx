"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, InfoIcon } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { useLead } from "@/features/leads/api/leads-queries";
import { useLeadListReturnHref } from "@/features/leads/components/list/list-return-href";
import { useProfiles, useWhatsappMessage } from "@/features/settings/api/app-settings";
import { getErrorMessage } from "@/lib/errors";
import type { Lead } from "@/types/database";

import { LeadActionsCard } from "./lead-actions-card";
import { LeadDetailSkeleton } from "./lead-detail-skeleton";
import { LeadEditCard } from "./lead-edit-card";
import { LeadFunnelCard } from "./lead-funnel-card";
import { LeadHeaderCard } from "./lead-header-card";
import { LeadHistoryCard } from "./lead-history-card";
import { LeadMobileActionBar } from "./lead-mobile-action-bar";
import { LeadNotFoundState } from "./lead-not-found-state";
import { LeadTrackingCard } from "./lead-tracking-card";
import { LinkedLeadsCard } from "./linked-leads-card";

/**
 * /leads/[id] — detalhe e edição do lead (spec §4.3). Carrega pelo cache (lista,
 * kanban, IndexedDB) e se mantém atualizado pelo Realtime (invalidação de ["leads"]).
 */
export function LeadDetailView({ leadId }: { leadId: string }) {
  const lead = useLead(leadId);

  if (lead.isPending) return <LeadDetailSkeleton />;
  if (!lead.data) {
    if (lead.isError) {
      return (
        <ErrorState
          title="Não foi possível carregar o lead"
          message={getErrorMessage(lead.error)}
          onRetry={() => void lead.refetch()}
          retrying={lead.isFetching}
        />
      );
    }
    return <LeadNotFoundState />;
  }
  return <LeadDetail lead={lead.data} />;
}

function LeadDetail({ lead }: { lead: Lead }) {
  const profiles = useProfiles();
  const whatsappMessage = useWhatsappMessage();
  // volta para a lista como estava (busca, filtros, página) nesta aba
  const backHref = useLeadListReturnHref();

  return (
    // pb extra no celular: a barra de ações fixa não cobre o fim da página
    <div className="space-y-6 pb-24 md:pb-0">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 w-fit">
        <Link href={backHref}>
          <ArrowLeftIcon aria-hidden="true" />
          Voltar para leads
        </Link>
      </Button>

      <LeadHeaderCard lead={lead} whatsappMessage={whatsappMessage} profiles={profiles.data} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)]">
        <div className="grid min-w-0 gap-6">
          <div id="acoes-rapidas" className="scroll-mt-20">
            <LeadActionsCard lead={lead} />
          </div>
          <LeadFunnelCard lead={lead} />
          <LeadEditCard lead={lead} />
        </div>

        <div className="grid min-w-0 gap-6">
          <LeadHistoryCard leadId={lead.id} />
          <LeadTrackingCard lead={lead} profiles={profiles.data} />
          <LinkedLeadsCard lead={lead} />
          <p className="text-muted-foreground flex items-start gap-2 px-1 text-xs">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Leads não são excluídos. Para encerrar, marque como perdido.
          </p>
        </div>
      </div>

      <LeadMobileActionBar lead={lead} whatsappMessage={whatsappMessage} />
    </div>
  );
}
