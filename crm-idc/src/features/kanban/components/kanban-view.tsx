"use client";

import * as React from "react";
import Link from "next/link";
import { ListIcon, PlusIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useWhatsappMessage } from "@/features/settings/api/app-settings";
import { useClock } from "@/features/leads/components/list/use-clock";
import { clearKanbanFilters, kanbanLeadListHref } from "@/features/kanban/lib/filters";
import { getErrorMessage } from "@/lib/errors";

import { useKanbanLeads } from "../hooks/use-kanban-leads";
import { useKanbanParams } from "../hooks/use-kanban-params";
import { KanbanBoard } from "./kanban-board";
import { KanbanBoardSkeleton } from "./kanban-skeleton";
import { KanbanToolbar } from "./kanban-toolbar";

/**
 * /kanban — funil em colunas com drag & drop (spec §4.4). Filtros na URL
 * (?q=&fonte=&servico=&antigos=1); dados atualizados pelo Realtime quando
 * outro usuário move um card (spec §6.3).
 */
export function KanbanView() {
  const { filters, replace, update } = useKanbanParams();
  const now = useClock();
  const data = useKanbanLeads(filters.showOldFinals, now);
  const whatsappMessage = useWhatsappMessage();

  const clearFilters = React.useCallback(() => replace(clearKanbanFilters(filters)), [replace, filters]);
  const showOldFinals = React.useCallback(() => update({ showOldFinals: true }), [update]);

  let content: React.ReactNode;
  if (data.status === "loading") {
    content = <KanbanBoardSkeleton />;
  } else if (data.status === "offline") {
    content = (
      <EmptyState
        icon={WifiOffIcon}
        title="Sem conexão"
        description="Os leads ainda não foram baixados neste aparelho. O quadro aparece assim que a conexão voltar."
        action={{ label: "Tentar novamente", onClick: data.refetch, icon: RefreshCwIcon, variant: "outline" }}
        className="bg-card rounded-xl border"
      />
    );
  } else if (data.status === "error") {
    content = (
      <ErrorState
        title="Não foi possível carregar o quadro"
        message={data.error ? getErrorMessage(data.error) : undefined}
        onRetry={data.refetch}
        retrying={data.isFetching}
        className="bg-card rounded-xl border"
      />
    );
  } else {
    content = (
      <KanbanBoard
        leads={data.leads}
        filters={filters}
        now={now}
        finalsLoading={data.finalsLoading}
        finalsError={data.finalsError}
        retrying={data.isFetching}
        onRetry={data.refetch}
        onClearFilters={clearFilters}
        onShowOldFinals={showOldFinals}
        whatsappMessage={whatsappMessage}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kanban do funil"
        description="Arraste os cards entre as colunas para atualizar o status — a mudança fica registrada no histórico do lead."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={kanbanLeadListHref(filters)}>
                <ListIcon aria-hidden="true" />
                Ver lista
              </Link>
            </Button>
            <Button asChild>
              <Link href="/leads/novo">
                <PlusIcon aria-hidden="true" />
                Novo lead
              </Link>
            </Button>
          </>
        }
      />
      <KanbanToolbar filters={filters} update={update} onClear={clearFilters} />
      {content}
    </div>
  );
}
