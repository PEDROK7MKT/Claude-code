import { describe, expect, it } from "vitest";

import type { Lead } from "@/types/database";

import {
  changedFieldLabels,
  diffLeadChanges,
  dirtyFieldLabels,
  dirtyFieldNames,
  hasLeadChanges,
  sameFormValues,
} from "./form-diff";
import { emptyLeadFormValues, leadFormSchema, leadToFormValues } from "./form-schema";

const LEAD: Lead = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ana Lima",
  phone: "77987654321",
  notes: null,
  source: "gmn",
  campaign: null,
  keyword: null,
  ad_group: null,
  landing_page: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  service: "canal",
  service_detail: "dor no dente 36",
  status: "em_contato",
  contacted_at: "2026-03-01T13:00:00.000Z",
  scheduled_at: null,
  confirmed_at: null,
  attended_at: null,
  estimated_value: 1500,
  parent_lead_id: null,
  created_by: null,
  assigned_to: null,
  created_at: "2026-03-01T12:00:00.000Z",
  updated_at: "2026-03-01T13:00:00.000Z",
};

describe("diffLeadChanges", () => {
  it("sem alterações → objeto vazio", () => {
    const output = leadFormSchema.parse(leadToFormValues(LEAD));
    const changes = diffLeadChanges(LEAD, output);
    expect(changes).toEqual({});
    expect(hasLeadChanges(changes)).toBe(false);
  });

  it("só os campos alterados, no formato do banco", () => {
    const values = { ...leadToFormValues(LEAD), name: "Ana Lima Souza", phone: "(77) 3611-2233", notes: "Retornar" };
    const changes = diffLeadChanges(LEAD, leadFormSchema.parse(values));
    expect(changes).toEqual({ name: "Ana Lima Souza", phone: "7736112233", notes: "Retornar" });
    expect(hasLeadChanges(changes)).toBe(true);
  });

  it("valor igual em outra representação não conta como alteração", () => {
    const values = { ...leadToFormValues(LEAD), estimated_value: "1500" };
    expect(diffLeadChanges(LEAD, leadFormSchema.parse(values))).toEqual({});
    // valores numéricos vindos como string do PostgREST (DECIMAL)
    const fromDb = { ...LEAD, estimated_value: "1500.00" as unknown as number };
    expect(diffLeadChanges(fromDb, leadFormSchema.parse(leadToFormValues(LEAD)))).toEqual({});
  });

  it("limpar um campo envia null", () => {
    const values = { ...leadToFormValues(LEAD), service_detail: "  ", estimated_value: "" };
    expect(diffLeadChanges(LEAD, leadFormSchema.parse(values))).toEqual({ service_detail: null, estimated_value: null });
  });

  it("texto nulo no banco e vazio no formulário são iguais", () => {
    const output = leadFormSchema.parse({ ...leadToFormValues(LEAD), keyword: "" });
    expect(diffLeadChanges({ ...LEAD, keyword: "" }, output)).toEqual({});
  });
});

describe("changedFieldLabels", () => {
  it("rótulos na ordem do formulário", () => {
    expect(changedFieldLabels({ notes: "x", name: "y", utm_source: "google" })).toEqual(["Nome", "utm_source", "Notas"]);
    expect(changedFieldLabels({})).toEqual([]);
  });
});

describe("sameFormValues / dirtyFieldNames", () => {
  it("compara todos os campos", () => {
    expect(sameFormValues(leadToFormValues(LEAD), leadToFormValues({ ...LEAD }))).toBe(true);
    expect(sameFormValues(leadToFormValues(LEAD), leadToFormValues({ ...LEAD, notes: "novo" }))).toBe(false);
    expect(sameFormValues(emptyLeadFormValues(), emptyLeadFormValues({ keyword: "x" }))).toBe(false);
  });

  it("lista só os campos marcados como alterados", () => {
    expect(dirtyFieldNames({ name: true, phone: false, notes: undefined, keyword: true })).toEqual(["name", "keyword"]);
    expect(dirtyFieldNames({})).toEqual([]);
  });
});

describe("dirtyFieldLabels", () => {
  it("ordem do formulário, campanha uma vez só", () => {
    expect(dirtyFieldLabels(["notes", "campaignOther", "campaignOption", "name"])).toEqual(["Nome", "Campanha", "Notas"]);
    expect(dirtyFieldLabels(["utm_term"])).toEqual(["utm_term"]);
    expect(dirtyFieldLabels([])).toEqual([]);
  });
});
