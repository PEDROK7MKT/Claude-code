/**
 * Edição do lead: só os campos realmente alterados vão para o banco
 * (evita sobrescrever mudanças feitas por outra pessoa em campos não tocados).
 */
import type { Lead } from "@/types/database";

import { LEAD_FIELD_LABEL, type LeadFormField, type LeadFormOutput, type LeadFormValues } from "./form-schema";

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

/**
 * Mesmos valores de formulário (campos de texto)? Usado para saber se o lead
 * mudou no servidor (Realtime/outra aba) e o formulário precisa ser atualizado.
 */
export function sameFormValues(a: LeadFormValues, b: LeadFormValues): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as Array<keyof LeadFormValues>);
  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }
  return true;
}

/** Campos marcados como alterados pelo react-hook-form (formState.dirtyFields). */
export function dirtyFieldNames(dirtyFields: Partial<Record<keyof LeadFormValues, boolean | undefined>>): Array<keyof LeadFormValues> {
  return (Object.keys(dirtyFields) as Array<keyof LeadFormValues>).filter((key) => dirtyFields[key] === true);
}

const FORM_KEY_ORDER: ReadonlyArray<keyof LeadFormValues> = [
  "name",
  "phone",
  "source",
  "campaignOption",
  "campaignOther",
  "keyword",
  "ad_group",
  "landing_page",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "service",
  "service_detail",
  "estimated_value",
  "assigned_to",
  "notes",
];

function formKeyLabel(key: keyof LeadFormValues): string {
  return key === "campaignOption" || key === "campaignOther" ? LEAD_FIELD_LABEL.campaign : LEAD_FIELD_LABEL[key];
}

/** Rótulos dos campos alterados no formulário, na ordem da tela e sem repetição ("Campanha" uma vez). */
export function dirtyFieldLabels(names: ReadonlyArray<keyof LeadFormValues>): string[] {
  const labels: string[] = [];
  for (const key of FORM_KEY_ORDER) {
    if (!names.includes(key)) continue;
    const label = formKeyLabel(key);
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}
