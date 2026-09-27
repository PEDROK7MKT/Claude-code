/**
 * Regra 4 — leads duplicados: resumo dos leads que já usam o telefone e
 * sugestão de qual deles vincular (parent_lead_id) ao novo cadastro.
 */
import { STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import type { Lead, LeadStatus } from "@/types/database";

/** Status em que o lead ainda está em andamento no funil. */
export const OPEN_LEAD_STATUSES: readonly LeadStatus[] = ["novo", "em_contato", "agendado", "confirmado"];

export function isOpenLead(status: LeadStatus): boolean {
  return OPEN_LEAD_STATUSES.includes(status);
}

type DuplicateLead = Pick<Lead, "id" | "name" | "status" | "created_at" | "updated_at">;

/** Mais recentes primeiro (entrada), com desempate estável pelo id. */
export function sortDuplicates<T extends DuplicateLead>(leads: readonly T[]): T[] {
  return [...leads].sort((a, b) => {
    const diff = Date.parse(b.created_at) - Date.parse(a.created_at);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

/**
 * Lead sugerido para vincular: o mais recente ainda em andamento (é o contato
 * que a recepção está tratando); sem nenhum em andamento, o mais recente.
 */
export function suggestParentLead<T extends DuplicateLead>(leads: readonly T[]): T | null {
  const sorted = sortDuplicates(leads);
  return sorted.find((lead) => isOpenLead(lead.status)) ?? sorted[0] ?? null;
}

export interface DuplicateSummary {
  count: number;
  openCount: number;
  latest: DuplicateLead | null;
  title: string;
  description: string;
}

function displayName(name: string): string {
  return name.trim() || "Sem nome";
}

/** Textos do alerta de telefone já cadastrado. */
export function summarizeDuplicates(leads: readonly DuplicateLead[]): DuplicateSummary {
  const sorted = sortDuplicates(leads);
  const latest = sorted[0] ?? null;
  const count = sorted.length;
  const openCount = sorted.filter((lead) => isOpenLead(lead.status)).length;

  if (!latest) {
    return { count: 0, openCount: 0, latest: null, title: "", description: "" };
  }

  const latestText = `${displayName(latest.name)} (${STATUS_META[latest.status].label}), cadastrado em ${formatDate(latest.created_at)}`;
  const title = count === 1 ? "Telefone já cadastrado" : `Telefone já cadastrado em ${count} leads`;
  let description =
    count === 1 ? `Existe um lead com este telefone: ${latestText}.` : `O mais recente é ${latestText}.`;
  if (openCount > 0) {
    description +=
      openCount === 1 && count === 1
        ? " Ele ainda está em andamento no funil."
        : ` ${openCount === 1 ? "1 deles ainda está" : `${openCount} deles ainda estão`} em andamento no funil.`;
  }
  return { count, openCount, latest, title, description };
}

/**
 * Título do card de contatos com o mesmo telefone no detalhe do lead:
 * "Contatos anteriores deste telefone" quando todos entraram antes dele.
 */
export function samePhoneTitle(
  lead: Pick<Lead, "created_at">,
  others: ReadonlyArray<Pick<Lead, "created_at">>,
): string {
  const current = Date.parse(lead.created_at);
  const allBefore = others.every((other) => Date.parse(other.created_at) < current);
  return allBefore ? "Contatos anteriores deste telefone" : "Outros contatos deste telefone";
}
