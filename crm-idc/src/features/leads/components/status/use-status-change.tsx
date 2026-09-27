"use client";

import * as React from "react";
import { useMutationState } from "@tanstack/react-query";
import { toast } from "sonner";

import { CHANGE_LEAD_STATUS_MUTATION_KEY, useChangeLeadStatus } from "@/features/leads/api/leads-mutations";
import { getErrorMessage } from "@/lib/errors";
import { canTransition, transitionErrorMessage } from "@/lib/lead-status";
import type { Lead, LeadStatus } from "@/types/database";

import { ScheduleDialog } from "./schedule-dialog";
import { statusChangeFlow, type StatusChangeFlow } from "./status-actions";
import { StatusConfirmDialog } from "./status-confirm-dialog";

/** Mesma mutationKey de useChangeLeadStatus (leads-mutations.ts). */
export const CHANGE_STATUS_MUTATION_KEY = CHANGE_LEAD_STATUS_MUTATION_KEY;

export interface StatusChangeRequest {
  /** Lead como estava quando a mudança foi pedida */
  lead: Lead;
  to: LeadStatus;
}

/**
 * - success: status alterado no banco
 * - error: falhou (o toast de erro já foi exibido e o cache, restaurado)
 * - cancelled: o usuário fechou o diálogo de agendamento/confirmação
 * - invalid: transição não permitida (regra 2) — toast de erro exibido
 * - unchanged: o lead já estava nesse status (nada a fazer)
 */
export type StatusChangeOutcome = "success" | "error" | "cancelled" | "invalid" | "unchanged";

export interface StatusChangeResult {
  outcome: StatusChangeOutcome;
  /** Lead atualizado (success) ou como estava antes (demais casos) */
  lead: Lead;
  to: LeadStatus;
  error?: Error;
}

export interface StatusChangeCallbacks {
  onSuccess?: (lead: Lead, request: StatusChangeRequest) => void;
  /**
   * A cada tentativa que falhar. Em diálogos o usuário pode tentar de novo,
   * então isso não encerra o pedido — use onSettled para o desfecho final.
   */
  onError?: (error: Error, request: StatusChangeRequest) => void;
  /** Diálogo fechado sem concluir (ex.: kanban devolve o card à coluna original). */
  onCancelled?: (request: StatusChangeRequest) => void;
  /** Exatamente uma vez por pedido, com o desfecho final. */
  onSettled?: (result: StatusChangeResult, request: StatusChangeRequest) => void;
}

export interface RequestChangeOptions extends StatusChangeCallbacks {
  /** Nota para o histórico (pré-preenche o campo nos diálogos). */
  note?: string | null;
}

export type UseStatusChangeOptions = StatusChangeCallbacks;

export interface UseStatusChangeResult {
  /**
   * Pede a mudança de status: valida a transição, abre o diálogo quando
   * necessário (agendar → data/hora; perdido/cancelado → confirmação) ou aplica
   * direto. A Promise nunca rejeita: resolve com o desfecho.
   */
  requestChange: (lead: Lead, to: LeadStatus, options?: RequestChangeOptions) => Promise<StatusChangeResult>;
  /** Renderize em qualquer lugar da árvore (os diálogos usam portal). */
  dialogs: React.ReactNode;
  /** Alguma mudança pedida por este hook está sendo salva. */
  isPending: boolean;
  /** O diálogo de agendamento/confirmação está aberto. */
  isDialogOpen: boolean;
}

interface ChangeInput {
  scheduledAt?: string | null;
  note?: string | null;
}

/** Um pedido de mudança; garante que onSettled/Promise sejam resolvidos uma única vez. */
class PendingStatusChange implements StatusChangeRequest {
  readonly flow: StatusChangeFlow;
  readonly promise: Promise<StatusChangeResult>;
  private resolvePromise: (result: StatusChangeResult) => void = () => undefined;
  private done = false;

  constructor(
    readonly id: number,
    readonly lead: Lead,
    readonly to: LeadStatus,
    private readonly options: RequestChangeOptions,
    private readonly hookOptions: () => StatusChangeCallbacks,
  ) {
    this.flow = statusChangeFlow(to);
    this.promise = new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  get note(): string | null {
    return this.options.note ?? null;
  }

  private get info(): StatusChangeRequest {
    return { lead: this.lead, to: this.to };
  }

  private listeners(): StatusChangeCallbacks[] {
    return [this.options, this.hookOptions()];
  }

  succeeded(updated: Lead): void {
    if (this.done) return;
    for (const listener of this.listeners()) listener.onSuccess?.(updated, this.info);
    this.finish({ outcome: "success", lead: updated, to: this.to });
  }

  failed(error: Error, final: boolean): void {
    if (this.done) return;
    for (const listener of this.listeners()) listener.onError?.(error, this.info);
    if (final) this.finish({ outcome: "error", lead: this.lead, to: this.to, error });
  }

  cancelled(): void {
    if (this.done) return;
    for (const listener of this.listeners()) listener.onCancelled?.(this.info);
    this.finish({ outcome: "cancelled", lead: this.lead, to: this.to });
  }

  rejected(outcome: "invalid" | "unchanged"): void {
    this.finish({ outcome, lead: this.lead, to: this.to });
  }

  private finish(result: StatusChangeResult): void {
    if (this.done) return;
    this.done = true;
    try {
      for (const listener of this.listeners()) listener.onSettled?.(result, this.info);
    } finally {
      this.resolvePromise(result);
    }
  }
}

/**
 * Orquestra a mudança de status de um lead — usado pelo detalhe do lead, pela
 * lista e pelo kanban. Toasts de sucesso/erro vêm de useChangeLeadStatus.
 *
 * ```tsx
 * const { requestChange, dialogs } = useStatusChange({ onSettled: (r) => r.outcome !== "success" && resetDrag() });
 * // onDragEnd: requestChange(lead, overColumnStatus)
 * return <>{board}{dialogs}</>;
 * ```
 */
export function useStatusChange(options: UseStatusChangeOptions = {}): UseStatusChangeResult {
  const { mutateAsync } = useChangeLeadStatus();
  const [inFlight, setInFlight] = React.useState(0);
  const [dialogRequest, setDialogRequest] = React.useState<PendingStatusChange | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Callbacks do hook sempre na versão mais recente, sem recriar requestChange.
  const optionsRef = React.useRef(options);
  React.useEffect(() => {
    optionsRef.current = options;
  });
  const activeRef = React.useRef<PendingStatusChange | null>(null);
  const sequenceRef = React.useRef(0);

  // Desmontou com um diálogo aberto: o pedido conta como cancelado.
  React.useEffect(
    () => () => {
      const active = activeRef.current;
      activeRef.current = null;
      active?.cancelled();
    },
    [],
  );

  const run = React.useCallback(
    async (request: PendingStatusChange, input: ChangeInput): Promise<Lead> => {
      let updated: Lead;
      setInFlight((count) => count + 1);
      try {
        updated = await mutateAsync({
          lead: request.lead,
          to: request.to,
          scheduledAt: input.scheduledAt ?? null,
          note: input.note !== undefined ? input.note : request.note,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(getErrorMessage(err));
        // Em diálogos o usuário pode tentar de novo; mudança direta termina aqui.
        request.failed(error, request.flow === "immediate");
        throw error;
      } finally {
        setInFlight((count) => count - 1);
      }
      request.succeeded(updated);
      return updated;
    },
    [mutateAsync],
  );

  const requestChange = React.useCallback(
    (lead: Lead, to: LeadStatus, requestOptions: RequestChangeOptions = {}): Promise<StatusChangeResult> => {
      sequenceRef.current += 1;
      const request = new PendingStatusChange(sequenceRef.current, lead, to, requestOptions, () => optionsRef.current);

      if (lead.status === to) {
        request.rejected("unchanged");
        return request.promise;
      }
      if (!canTransition(lead.status, to)) {
        toast.error(transitionErrorMessage(lead.status, to));
        request.rejected("invalid");
        return request.promise;
      }

      if (request.flow === "immediate") {
        run(request, {}).catch(() => {
          // desfecho já registrado em request.failed (toast exibido pela mutation)
        });
        return request.promise;
      }

      // Um novo pedido substitui o diálogo anterior, se houver.
      activeRef.current?.cancelled();
      activeRef.current = request;
      setDialogRequest(request);
      setDialogOpen(true);
      return request.promise;
    },
    [run],
  );

  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    setDialogOpen(open);
    if (open) return;
    const active = activeRef.current;
    activeRef.current = null;
    active?.cancelled(); // sem efeito se já foi concluído com sucesso
  }, []);

  let dialogs: React.ReactNode = null;
  if (dialogRequest?.flow === "schedule") {
    dialogs = (
      <ScheduleDialog
        key={dialogRequest.id}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        lead={dialogRequest.lead}
        defaultNote={dialogRequest.note}
        onSubmit={({ scheduledAt, note }) => run(dialogRequest, { scheduledAt, note })}
      />
    );
  } else if (dialogRequest?.flow === "confirm") {
    dialogs = (
      <StatusConfirmDialog
        key={dialogRequest.id}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        lead={dialogRequest.lead}
        to={dialogRequest.to}
        defaultNote={dialogRequest.note}
        onConfirm={(note) => run(dialogRequest, { note })}
      />
    );
  }

  return { requestChange, dialogs, isPending: inFlight > 0, isDialogOpen: dialogOpen };
}

function pendingLeadId(variables: unknown): string | null {
  if (typeof variables !== "object" || variables === null || !("lead" in variables)) return null;
  const { lead } = variables;
  if (typeof lead !== "object" || lead === null || !("id" in lead)) return null;
  return typeof lead.id === "string" ? lead.id : null;
}

/**
 * Há uma mudança de status deste lead sendo salva — em qualquer componente
 * (detalhe, lista, kanban). Útil para desabilitar ações e mostrar carregamento.
 */
export function useLeadStatusPending(leadId: string | null | undefined): boolean {
  const pendingIds = useMutationState({
    filters: { mutationKey: CHANGE_STATUS_MUTATION_KEY, status: "pending" },
    select: (mutation) => pendingLeadId(mutation.state.variables),
  });
  return leadId != null && pendingIds.includes(leadId);
}
