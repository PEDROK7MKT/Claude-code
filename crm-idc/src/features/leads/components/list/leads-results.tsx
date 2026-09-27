"use client";

import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  FilterXIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchXIcon,
  TriangleAlertIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { LeadsPage } from "@/features/leads/api/leads-queries";
import type { LeadListSort, LeadListSortColumn } from "@/features/leads/lib/list-params";
import { useIsMobile } from "@/hooks/use-mobile";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { LeadsCardList } from "./leads-card-list";
import { LeadsTable } from "./leads-table";

export interface LeadsResultsProps {
  query: UseQueryResult<LeadsPage>;
  sort: LeadListSort;
  onSort: (column: LeadListSortColumn) => void;
  /** Há busca/filtros aplicados (define qual estado vazio mostrar) */
  filtered: boolean;
  onClearFilters: () => void;
  now: number;
  freshIds: ReadonlySet<string>;
  /** Modelo da mensagem do WhatsApp (Configurações); padrão: DEFAULT_WHATSAPP_MESSAGE */
  whatsappMessage?: string;
}

const PANEL = "bg-card rounded-xl border shadow-xs";

/**
 * Resultado da lista: esqueleto no primeiro carregamento, erro com "Tentar
 * novamente", aviso offline, estados vazios (nenhum lead × nenhum resultado) e a
 * tabela (≥ md) ou os cards (< md). A página anterior fica esmaecida enquanto a próxima carrega.
 */
export function LeadsResults({
  query,
  sort,
  onSort,
  filtered,
  onClearFilters,
  now,
  freshIds,
  whatsappMessage,
}: LeadsResultsProps) {
  const isMobile = useIsMobile();
  const { data } = query;
  const retry = () => void query.refetch();
  // sem internet o TanStack pausa a consulta (não é erro): avisa em vez de carregar para sempre
  const offline = query.fetchStatus === "paused";

  if (!data) {
    if (query.isError) {
      return (
        <div className={PANEL}>
          <ErrorState
            title="Não foi possível carregar os leads"
            message={getErrorMessage(query.error)}
            onRetry={retry}
            retrying={query.isFetching}
          />
        </div>
      );
    }
    if (offline) {
      return (
        <div className={PANEL}>
          <EmptyState
            icon={WifiOffIcon}
            title="Sem conexão com a internet"
            description="Esta lista ainda não foi carregada neste aparelho. Ela aparece assim que a conexão voltar."
          />
        </div>
      );
    }
    return <TableSkeleton rows={10} columns={7} />;
  }

  const busy = query.isPlaceholderData;

  let notice: React.ReactNode = null;
  if (busy && offline) {
    notice = (
      <Alert>
        <WifiOffIcon aria-hidden="true" />
        <AlertTitle>Sem conexão</AlertTitle>
        <AlertDescription>
          Mostrando o resultado anterior. A busca e os filtros serão aplicados quando a internet voltar.
        </AlertDescription>
      </Alert>
    );
  } else if (query.isRefetchError) {
    notice = (
      <Alert variant="destructive">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>Não foi possível atualizar a lista</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {getErrorMessage(query.error)}
            <span className="block text-xs opacity-80">Os dados exibidos podem estar desatualizados.</span>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={retry} disabled={query.isFetching}>
            <RefreshCwIcon aria-hidden="true" className={cn(query.isFetching && "animate-spin")} />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  let content: React.ReactNode;
  if (data.rows.length === 0) {
    content = (
      <div aria-busy={busy} className={cn(PANEL, "transition-opacity duration-200", busy && "opacity-60")}>
        {filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="Nenhum lead encontrado"
            description="Nenhum lead corresponde à busca e aos filtros selecionados. Tente outros termos ou limpe os filtros."
            action={{ label: "Limpar filtros", onClick: onClearFilters, icon: FilterXIcon }}
          />
        ) : (
          <EmptyState
            icon={UsersIcon}
            title="Nenhum lead cadastrado ainda"
            description="Os contatos que chegam pelo WhatsApp, telefone ou site aparecem aqui. Cadastre o primeiro para começar a acompanhar o funil."
            action={{ label: "Cadastrar primeiro lead", href: "/leads/novo", icon: PlusIcon }}
          />
        )}
      </div>
    );
  } else if (isMobile) {
    content = (
      <LeadsCardList rows={data.rows} now={now} freshIds={freshIds} busy={busy} whatsappMessage={whatsappMessage} />
    );
  } else {
    content = (
      <LeadsTable
        rows={data.rows}
        sort={sort}
        onSort={onSort}
        now={now}
        freshIds={freshIds}
        busy={busy}
        whatsappMessage={whatsappMessage}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notice}
      {content}
    </div>
  );
}
