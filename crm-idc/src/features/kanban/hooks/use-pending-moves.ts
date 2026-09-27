"use client";

import * as React from "react";
import { useMutationState } from "@tanstack/react-query";

import { CHANGE_STATUS_MUTATION_KEY } from "@/features/leads/components/status";
import {
  addAwaitingMove,
  addSavedMove,
  applyLeadOverlays,
  buildLeadOverlays,
  parseSavingChange,
  removeAwaitingMove,
  type AwaitingMove,
  type LeadOverlay,
  type SavedMove,
  type SavingChange,
} from "@/features/kanban/lib/pending-moves";
import type { Lead, LeadStatus } from "@/types/database";

export interface UsePendingMovesResult {
  /** Dados com os movimentos pendentes aplicados (card já na coluna de destino) */
  leads: Lead[];
  overlays: ReadonlyMap<string, LeadOverlay>;
  /** Card solto numa coluna: aparece lá enquanto o diálogo decide */
  beginMove: (lead: Lead, to: LeadStatus) => void;
  /** Pedido encerrado (sucesso, erro, cancelado): tira o card do estado "aguardando" */
  endMove: (leadId: string) => void;
  /** Mudança salva: mantém o card no destino até os dados do servidor refletirem */
  markSaved: (lead: Lead) => void;
}

function isSavingChange(value: SavingChange | null): value is SavingChange {
  return value !== null;
}

/**
 * Sobreposição local dos movimentos do kanban. Junta três fontes:
 * cards soltos aguardando diálogo (estado local), mudanças de status sendo
 * salvas em qualquer tela (cache de mutations do TanStack) e mudanças salvas
 * ainda não refletidas pelo refetch. Cancelou ou falhou → o card volta sozinho.
 */
export function usePendingMoves(data: readonly Lead[]): UsePendingMovesResult {
  const [awaiting, setAwaiting] = React.useState<readonly AwaitingMove[]>([]);
  const [saved, setSaved] = React.useState<readonly SavedMove[]>([]);

  const savingRaw = useMutationState({
    filters: { mutationKey: CHANGE_STATUS_MUTATION_KEY, status: "pending" },
    select: (mutation) => parseSavingChange(mutation.state.variables, mutation.state.submittedAt),
  });
  const saving = React.useMemo(() => savingRaw.filter(isSavingChange), [savingRaw]);

  const overlays = React.useMemo(
    () => buildLeadOverlays({ awaiting, saving, saved }, data),
    [awaiting, saving, saved, data],
  );
  const leads = React.useMemo(() => applyLeadOverlays(data, overlays), [data, overlays]);

  const beginMove = React.useCallback((lead: Lead, to: LeadStatus) => {
    const move: AwaitingMove = { lead, to, startedAt: Date.now() };
    setAwaiting((current) => addAwaitingMove(current, move));
  }, []);

  const endMove = React.useCallback((leadId: string) => {
    setAwaiting((current) => removeAwaitingMove(current, leadId));
  }, []);

  // dados mais recentes para descartar movimentos já confirmados ao registrar um novo
  const dataRef = React.useRef(data);
  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const markSaved = React.useCallback((lead: Lead) => {
    setSaved((current) => addSavedMove(current, lead, dataRef.current));
  }, []);

  return { leads, overlays, beginMove, endMove, markSaved };
}
