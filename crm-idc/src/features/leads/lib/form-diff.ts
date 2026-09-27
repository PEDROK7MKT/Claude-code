/**
 * Edição do lead: só os campos realmente alterados vão para o banco
 * (evita sobrescrever mudanças feitas por outra pessoa em campos não tocados).
 */
import type { Lead } from "@/types/database";

import { LEAD_FIELD_LABEL, type LeadFormField, type LeadFormOutput } from "./form-schema";

export type LeadChanges = Partial<LeadFormOutput>;

const FORM_FIELDS = Object.keys(LEAD_FIELD_LABEL) as LeadFormField[];

function sameValue(field: LeadFormField, current: unknown, next: unknown): boolean {
  if (field === "estimated_value") {
    const a = current === null || current === undefined || current === "" ? null : Number(current);
    const b = next === null || next === undefined ? null : Number(next);
    if (a === null || b === null) return a === b;
    return Math.round(a * 100) === Math.round(b * 100);
  }
  const a = typeof current === "string" ? current.trim() || null : (current ?? null);
  const b = typeof next === "string" ? next.trim() || null : (next ?? null);
  return a === b;
}

/** Campos de `next` diferentes do lead salvo. Objeto vazio = nada a salvar. */
export function diffLeadChanges(lead: Pick<Lead, LeadFormField>, next: LeadFormOutput): LeadChanges {
  const changes: Record<string, unknown> = {};
  for (const field of FORM_FIELDS) {
    if (!sameValue(field, lead[field], next[field])) changes[field] = next[field];
  }
  return changes as LeadChanges;
}

export function hasLeadChanges(changes: LeadChanges): boolean {
  return Object.keys(changes).length > 0;
}

/** Rótulos dos campos alterados, na ordem do formulário. */
export function changedFieldLabels(changes: LeadChanges): string[] {
  return FORM_FIELDS.filter((field) => field in changes).map((field) => LEAD_FIELD_LABEL[field]);
}
