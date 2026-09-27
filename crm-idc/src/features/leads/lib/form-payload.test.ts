import { describe, expect, it } from "vitest";

import type { Lead } from "@/types/database";

import { toCreateLeadPayload, toUpdateLeadChanges } from "./form-payload";
import { emptyLeadFormValues, leadFormSchema, leadToFormValues, type LeadFormOutput } from "./form-schema";

const OUTPUT: LeadFormOutput = leadFormSchema.parse(
  emptyLeadFormValues({ name: "Paula", phone: "(77) 98765-4321", source: "gmn", notes: "Dor forte" }),
);

describe("toCreateLeadPayload", () => {
  it("copia os campos do formulário, sem status, com vínculo opcional", () => {
    const payload = toCreateLeadPayload(OUTPUT);
    expect(payload).toMatchObject({ name: "Paula", phone: "77987654321", source: "gmn", notes: "Dor forte" });
    expect(payload.parent_lead_id).toBeNull();
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("created_by");
    expect(toCreateLeadPayload(OUTPUT, "lead-antigo").parent_lead_id).toBe("lead-antigo");
  });

  it("ignora propriedades extras (ex.: status vindo de fora)", () => {
    const tainted = { ...OUTPUT, status: "agendado" } as LeadFormOutput;
    expect(toCreateLeadPayload(tainted)).not.toHaveProperty("status");
  });
});

describe("toUpdateLeadChanges", () => {
  it("envia só o que mudou", () => {
    const lead: Lead = {
      id: "1",
      name: "Paula",
      phone: "77987654321",
      notes: "Dor forte",
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
      service: null,
      service_detail: null,
      status: "novo",
      contacted_at: null,
      scheduled_at: null,
      confirmed_at: null,
      attended_at: null,
      estimated_value: null,
      parent_lead_id: null,
      created_by: null,
      assigned_to: null,
      created_at: "2026-03-01T12:00:00.000Z",
      updated_at: "2026-03-01T12:00:00.000Z",
    };
    expect(toUpdateLeadChanges(lead, OUTPUT)).toEqual({});
    const edited = leadFormSchema.parse({ ...leadToFormValues(lead), service: "canal" });
    expect(toUpdateLeadChanges(lead, edited)).toEqual({ service: "canal" });
  });
});
