"use client";

import * as React from "react";

import { useLeads } from "@/features/leads/api/leads-queries";
import { ACTIVE_STATUSES, FINAL_STATUSES } from "@/features/kanban/lib/columns";
import { finalsCutoffIso } from "@/features/kanban/lib/filters";
import { mergeLeadLists } from "@/features/kanban/lib/pending-moves";
import type { Lead } from "@/types/database";

export type KanbanDataStatus =
  /** primeira carga, sem dados */
  | "loading"
  /** sem conexão e sem cache */
  | "offline"
  /** falhou e não há dados para mostrar */
  | "error"
  | "ready";

export interface KanbanLeadsResult {
  status: KanbanDataStatus;
  /** Leads em andamento + finalizados da janela (sem duplicados) */
  leads: Lead[];
  /** Colunas finalizadas ainda carregando (ex.: acabou de ligar "finalizados antigos") */
  finalsLoading: boolean;
  /** Colunas finalizadas falharam, mas as em andamento estão na tela */
  finalsError: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

const ACTIVE = [...ACTIVE_STATUSES];
const FINALS = [...FINAL_STATUSES];

/**
 * Dados do quadro: todos os leads em andamento + os finalizados atualizados nos
 * últimos 30 dias (ou todos, com `showOldFinals`). O RealtimeProvider invalida
 * ["leads"] a cada mudança, então o quadro acompanha outros usuários sozinho.
 */
export function useKanbanLeads(showOldFinals: boolean, now: number): KanbanLeadsResult {
  const updatedSince = showOldFinals ? undefined : finalsCutoffIso(now);
  const active = useLeads({ status: ACTIVE });
  const finals = useLeads({ status: FINALS, updatedSince });

  const leads = React.useMemo(() => mergeLeadLists(active.data, finals.data), [active.data, finals.data]);

  const refetchActive = active.refetch;
  const refetchFinals = finals.refetch;
  const refetch = React.useCallback(() => {
    void refetchActive();
    void refetchFinals();
  }, [refetchActive, refetchFinals]);

  let status: KanbanDataStatus = "ready";
  if (!active.data) {
    if (active.isError) status = "error";
    else if (active.fetchStatus === "paused") status = "offline";
    else status = "loading";
  }

  return {
    status,
    leads,
    finalsLoading: !finals.data && !finals.isError && finals.fetchStatus !== "paused",
    finalsError: !finals.data && (finals.isError || finals.fetchStatus === "paused"),
    isFetching: active.isFetching || finals.isFetching,
    error: active.error ?? finals.error ?? null,
    refetch,
  };
}
