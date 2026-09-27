import { CONFIRM_STATUSES, LEAD_STATUSES, SCHEDULED_STATUSES, STATUS_META, STATUS_TRANSITIONS } from "@/lib/constants";
import type { LeadStatus } from "@/types/database";

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

/** Regra 2: a transição `from → to` é permitida? (mesmo status = não é transição) */
export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: LeadStatus): readonly LeadStatus[] {
  return STATUS_TRANSITIONS[from];
}

/** Regra 3: mudar para "agendado" exige data/hora da consulta. */
export function requiresSchedule(to: LeadStatus): boolean {
  return to === "agendado";
}

/** Mudanças que pedem confirmação do usuário (perdido, cancelado). */
export function requiresConfirmation(to: LeadStatus): boolean {
  return CONFIRM_STATUSES.includes(to);
}

export function isScheduledStatus(status: LeadStatus): boolean {
  return (SCHEDULED_STATUSES as readonly LeadStatus[]).includes(status);
}

export function statusLabel(status: LeadStatus | null | undefined): string {
  return status ? STATUS_META[status].label : "—";
}

export function statusTitle(status: LeadStatus | null | undefined): string {
  return status ? STATUS_META[status].title : "—";
}

/** Mensagem amigável quando a transição não é permitida. */
export function transitionErrorMessage(from: LeadStatus, to: LeadStatus): string {
  const allowed = allowedTransitions(from);
  const base = `Não é possível mover de "${STATUS_META[from].label}" para "${STATUS_META[to].label}".`;
  if (!allowed.length) return `${base} Leads com status "${STATUS_META[from].label}" são finais.`;
  return `${base} A partir de "${STATUS_META[from].label}" é permitido: ${allowed
    .map((s) => `"${STATUS_META[s].label}"`)
    .join(", ")}.`;
}
