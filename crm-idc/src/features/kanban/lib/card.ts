/**
 * Conteúdo do card e textos do quadro. Funções puras — card.test.ts.
 */
import { SERVICE_LABEL } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { Lead, LeadStatus } from "@/types/database";

/** Status em que o card destaca a data da consulta. */
export const APPOINTMENT_CARD_STATUSES: readonly LeadStatus[] = ["agendado", "confirmado"];

export function showsAppointment(status: LeadStatus): boolean {
  return APPOINTMENT_CARD_STATUSES.includes(status);
}

/** "Implante Dentário" · "Outro — Bruxismo" · null quando não informado. */
export function cardServiceLabel(lead: Pick<Lead, "service" | "service_detail">): string | null {
  if (!lead.service) return lead.service_detail?.trim() || null;
  const label = SERVICE_LABEL[lead.service];
  const detail = lead.service_detail?.trim();
  return lead.service === "outro" && detail ? `${label} — ${detail}` : label;
}

/** Descrição do cabeçalho: "47 leads no quadro" · "3 de 47 leads com os filtros atuais". */
export function boardSummary(visible: number, total: number, filtered: boolean): string {
  const noun = (n: number) => (n === 1 ? "lead" : "leads");
  if (!filtered) return `${formatNumber(total)} ${noun(total)} no quadro`;
  return `${formatNumber(visible)} de ${formatNumber(total)} ${noun(total)} com os filtros atuais`;
}
