/**
 * Regra 4 no webhook: telefone já cadastrado não bloqueia a entrada — o novo
 * lead é criado (status "novo") vinculado ao mais recente (parent_lead_id) e com
 * a nota "Possível duplicado de <nome> (<data>)" para a recepção decidir.
 */
import { FIELD_LIMITS, REPEAT_WINDOW_MS } from "@/features/webhook/lib/constants";
import { truncateText } from "@/features/webhook/lib/schema";
import type { ExistingLead, WebhookLeadInsert } from "@/features/webhook/lib/types";
import { sortDuplicates } from "@/features/leads/lib/lead-duplicates";
import { formatDate } from "@/lib/dates";

/** Lead mais recente (por data de entrada) entre os que têm o mesmo telefone. */
export function latestLead(leads: readonly ExistingLead[]): ExistingLead | null {
  return sortDuplicates(leads)[0] ?? null;
}

/** "Possível duplicado de Maria Silva (12/03/2026)" — data no fuso da clínica. */
export function duplicateNote(lead: Pick<ExistingLead, "name" | "created_at">): string {
  const name = lead.name.replace(/\s+/g, " ").trim() || "lead sem nome";
  return `Possível duplicado de ${name} (${formatDate(lead.created_at)})`;
}

/** Vincula o novo lead ao anterior e antepõe a nota de duplicado. */
export function linkDuplicate(lead: WebhookLeadInsert, parent: ExistingLead | null): WebhookLeadInsert {
  if (!parent) return lead;
  const notes = [duplicateNote(parent), lead.notes].filter(Boolean).join("\n");
  return { ...lead, parent_lead_id: parent.id, notes: truncateText(notes, FIELD_LIMITS.notes) };
}

/**
 * Reenvio do mesmo contato (clique duplo, nova tentativa após timeout): o lead
 * mais recente foi criado há menos de REPEAT_WINDOW_MS e ninguém mexeu nele ainda.
 */
export function isRecentRepeat(lead: ExistingLead | null, now: Date): boolean {
  if (!lead || lead.status !== "novo") return false;
  const createdAt = Date.parse(lead.created_at);
  if (!Number.isFinite(createdAt)) return false;
  return now.getTime() - createdAt < REPEAT_WINDOW_MS;
}
