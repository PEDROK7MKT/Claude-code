/**
 * Movimentos pendentes do kanban: o card aparece na coluna de destino na hora
 * (arrastado aguardando o diálogo, sendo salvo ou salvo mas ainda não
 * confirmado pelo refetch) e volta sozinho se o pedido for cancelado ou falhar.
 * Funções puras — pending-moves.test.ts.
 */
import { applyStatusChange, isLeadRow } from "@/features/leads/api/lead-query-utils";
import { isLeadStatus } from "@/lib/lead-status";
import type { Lead, LeadStatus } from "@/types/database";

/**
 * - awaiting: solto numa coluna, aguardando o diálogo (agendar / confirmar)
 * - saving: mudança sendo salva (qualquer tela — detalhe, lista ou kanban)
 * - saved: salvo; aguardando os dados do servidor refletirem a mudança
 */
export type PendingMoveKind = "awaiting" | "saving" | "saved";

export interface AwaitingMove {
  /** Lead como estava ao ser solto */
  lead: Lead;
  to: LeadStatus;
  /** ms */
  startedAt: number;
}

export interface SavingChange {
  lead: Lead;
  to: LeadStatus;
  scheduledAt: string | null;
  /** ms (mutation.state.submittedAt) */
  submittedAt: number;
}

export interface SavedMove {
  /** Lead devolvido pela RPC change_lead_status */
  lead: Lead;
  /** ms */
  savedAt: number;
}

export interface LeadOverlay {
  lead: Lead;
  kind: PendingMoveKind;
}

/** Depois disso um movimento salvo deixa de sobrepor os dados (proteção contra refetch que nunca chega). */
export const SAVED_MOVE_TTL_MS = 60_000;

function isoAt(ms: number): string {
  return new Date(Number.isFinite(ms) && ms > 0 ? ms : 0).toISOString();
}

/** Extrai uma mudança em andamento das variáveis de useChangeLeadStatus (ou null se o formato não bater). */
export function parseSavingChange(variables: unknown, submittedAt: number): SavingChange | null {
  if (typeof variables !== "object" || variables === null) return null;
  const { lead, to, scheduledAt } = variables as { lead?: unknown; to?: unknown; scheduledAt?: unknown };
  if (!isLeadRow(lead) || !isLeadStatus(to)) return null;
  return { lead, to, scheduledAt: typeof scheduledAt === "string" ? scheduledAt : null, submittedAt };
}

function timeOf(iso: string | null | undefined): number {
  const time = iso ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/**
 * Junta listas de leads (ex.: em andamento + finalizados) sem repetir ids —
 * se o mesmo lead aparece em duas (refetch em momentos diferentes), vale a
 * versão com `updated_at` mais recente. Mantém a ordem de primeira aparição.
 */
export function mergeLeadLists(...lists: ReadonlyArray<readonly Lead[] | null | undefined>): Lead[] {
  const byId = new Map<string, Lead>();
  for (const list of lists) {
    for (const lead of list ?? []) {
      const current = byId.get(lead.id);
      if (!current || timeOf(lead.updated_at) > timeOf(current.updated_at)) byId.set(lead.id, lead);
    }
  }
  return [...byId.values()];
}

/** Os dados do servidor já refletem (ou superaram) o movimento salvo? */
export function isSavedMoveConfirmed(saved: Pick<Lead, "updated_at">, current: Pick<Lead, "updated_at"> | undefined): boolean {
  if (!current) return false;
  return timeOf(current.updated_at) >= timeOf(saved.updated_at);
}

/** Movimentos salvos que ainda precisam sobrepor os dados (não confirmados e dentro do TTL). */
export function liveSavedMoves(
  saved: readonly SavedMove[],
  dataById: ReadonlyMap<string, Lead>,
  nowMs: number,
  ttlMs = SAVED_MOVE_TTL_MS,
): SavedMove[] {
  return saved.filter(
    (move) => nowMs - move.savedAt <= ttlMs && !isSavedMoveConfirmed(move.lead, dataById.get(move.lead.id)),
  );
}

export interface PendingMovesInput {
  awaiting: readonly AwaitingMove[];
  saving: readonly SavingChange[];
  saved: readonly SavedMove[];
}

/**
 * Sobreposições por lead. Precedência: salvando > aguardando diálogo > salvo
 * (a intenção mais recente vence).
 */
export function buildLeadOverlays(
  { awaiting, saving, saved }: PendingMovesInput,
  data: readonly Lead[],
  nowMs: number,
): Map<string, LeadOverlay> {
  const dataById = new Map(data.map((lead) => [lead.id, lead]));
  const overlays = new Map<string, LeadOverlay>();

  for (const move of liveSavedMoves(saved, dataById, nowMs)) {
    overlays.set(move.lead.id, { lead: move.lead, kind: "saved" });
  }
  for (const move of awaiting) {
    overlays.set(move.lead.id, {
      lead: applyStatusChange(move.lead, move.to, null, isoAt(move.startedAt)),
      kind: "awaiting",
    });
  }
  for (const change of saving) {
    overlays.set(change.lead.id, {
      lead: applyStatusChange(change.lead, change.to, change.scheduledAt, isoAt(change.submittedAt)),
      kind: "saving",
    });
  }
  return overlays;
}

/**
 * Aplica as sobreposições aos dados: substitui os leads existentes e inclui os
 * que sumiram dos dados (a atualização otimista tira o lead da consulta do
 * status antigo antes de a consulta do novo status ser recarregada).
 */
export function applyLeadOverlays(data: readonly Lead[], overlays: ReadonlyMap<string, LeadOverlay>): Lead[] {
  if (overlays.size === 0) return [...data];
  const seen = new Set<string>();
  const out = data.map((lead) => {
    seen.add(lead.id);
    return overlays.get(lead.id)?.lead ?? lead;
  });
  for (const [id, overlay] of overlays) {
    if (!seen.has(id)) out.push(overlay.lead);
  }
  return out;
}

/** Indicador do card: aguardando diálogo ou salvando (movimento já salvo não mostra nada). */
export function visiblePendingKind(overlay: LeadOverlay | undefined): Exclude<PendingMoveKind, "saved"> | null {
  if (!overlay || overlay.kind === "saved") return null;
  return overlay.kind;
}

/** Acrescenta/substitui um movimento salvo e descarta os vencidos. */
export function addSavedMove(saved: readonly SavedMove[], lead: Lead, nowMs: number, ttlMs = SAVED_MOVE_TTL_MS): SavedMove[] {
  return [
    ...saved.filter((move) => move.lead.id !== lead.id && nowMs - move.savedAt <= ttlMs),
    { lead, savedAt: nowMs },
  ];
}

/** Acrescenta/substitui o movimento aguardando diálogo de um lead. */
export function addAwaitingMove(awaiting: readonly AwaitingMove[], move: AwaitingMove): AwaitingMove[] {
  return [...awaiting.filter((item) => item.lead.id !== move.lead.id), move];
}

/** Remove o movimento aguardando de um lead (mesma referência quando não há o que remover). */
export function removeAwaitingMove(awaiting: readonly AwaitingMove[], leadId: string): readonly AwaitingMove[] {
  const next = awaiting.filter((item) => item.lead.id !== leadId);
  return next.length === awaiting.length ? awaiting : next;
}
