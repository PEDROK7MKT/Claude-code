/**
 * Edição do horário da consulta no detalhe do lead (status agendado/confirmado):
 * a data muda por useUpdateLead({ scheduled_at }) — sem mudança de status, não
 * gera histórico —, então a observação opcional vai para as notas do lead.
 */
import { formatAppointment, formatDateTime, type DateInput } from "@/lib/dates";
import type { LeadStatus } from "@/types/database";

/** Status em que a consulta está marcada e o horário pode ser ajustado. */
export const APPOINTMENT_EDITABLE_STATUSES: readonly LeadStatus[] = ["agendado", "confirmado"];

export function canEditAppointment(status: LeadStatus): boolean {
  return APPOINTMENT_EDITABLE_STATUSES.includes(status);
}

/** Mesmo horário (ignora segundos/milissegundos)? */
export function isSameAppointment(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return a === b;
  return Math.floor(ta / 60_000) === Math.floor(tb / 60_000);
}

interface AppointmentNoteArgs {
  previous: string | null;
  next: string;
  note: string | null | undefined;
  now?: DateInput;
}

/**
 * Linha registrada nas notas ao alterar o horário com observação:
 * "[12/03/2026 10:15] Consulta remarcada de qua, 12/03 às 09:00 para qui, 13/03 às 14:30 — paciente pediu à tarde"
 */
export function appointmentNoteLine({ previous, next, note, now = Date.now() }: AppointmentNoteArgs): string | null {
  const text = (note ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  const change = previous
    ? `Consulta remarcada de ${formatAppointment(previous)} para ${formatAppointment(next)}`
    : `Consulta marcada para ${formatAppointment(next)}`;
  return `[${formatDateTime(now)}] ${change} — ${text}`;
}

/** Notas do lead com a linha da remarcação no final; sem observação, devolve null (não altera as notas). */
export function appendAppointmentNote(notes: string | null | undefined, args: AppointmentNoteArgs): string | null {
  const line = appointmentNoteLine(args);
  if (!line) return null;
  const current = (notes ?? "").trimEnd();
  return current ? `${current}\n\n${line}` : line;
}
