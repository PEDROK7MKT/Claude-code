/**
 * Histórico do lead (lead_history, spec §4.3 "quem mudou, quando, nota"):
 * títulos e autoria das entradas da linha do tempo.
 */
import type { LeadHistory, LeadStatus } from "@/types/database";

/** Autor exibido quando a mudança não tem usuário (webhook, service role, seed). */
export const SYSTEM_ACTOR_LABEL = "Sistema/Webhook";

type HistoryEntryLike = Pick<LeadHistory, "old_status" | "new_status" | "changed_by"> & {
  profile?: { full_name: string | null } | null;
};

/** Entrada de criação do lead (trigger AFTER INSERT grava old_status = null). */
export function isCreationEntry(entry: Pick<LeadHistory, "old_status">): boolean {
  return entry.old_status === null;
}

/** Quem fez a mudança: nome do perfil, "Sistema/Webhook" sem usuário ou "Usuário" se o perfil não está visível. */
export function historyActorName(entry: HistoryEntryLike): string {
  const name = entry.profile?.full_name?.trim();
  if (name) return name;
  return entry.changed_by ? "Usuário" : SYSTEM_ACTOR_LABEL;
}

export function isSystemEntry(entry: Pick<LeadHistory, "changed_by">): boolean {
  return !entry.changed_by;
}

/** Título da entrada no passado ("Consulta agendada", "Lead reativado"…). */
export function historyEntryTitle(entry: Pick<LeadHistory, "old_status" | "new_status">): string {
  const from = entry.old_status;
  if (from === null) return "Lead cadastrado";
  const to: LeadStatus = entry.new_status;
  switch (to) {
    case "novo":
      return "Voltou para novo";
    case "em_contato":
      return from === "perdido" ? "Lead reativado" : "Contato iniciado";
    case "agendado":
      return from === "cancelado" || from === "nao_compareceu" ? "Consulta reagendada" : "Consulta agendada";
    case "confirmado":
      return "Presença confirmada";
    case "compareceu":
      return "Paciente compareceu";
    case "nao_compareceu":
      return "Paciente não compareceu";
    case "cancelado":
      return "Agendamento cancelado";
    case "perdido":
      return "Marcado como perdido";
  }
}

/** Nota limpa (sem espaços sobrando); vazia → null. */
export function historyNote(note: string | null | undefined): string | null {
  const value = (note ?? "").trim();
  return value ? value : null;
}
