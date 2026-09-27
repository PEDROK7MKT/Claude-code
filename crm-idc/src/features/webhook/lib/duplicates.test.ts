import { describe, expect, it } from "vitest";
import { duplicateNote, isRecentRepeat, latestLead, linkDuplicate } from "@/features/webhook/lib/duplicates";
import type { ExistingLead, WebhookLeadInsert } from "@/features/webhook/lib/types";

function existing(overrides: Partial<ExistingLead> = {}): ExistingLead {
  return {
    id: "lead-1",
    name: "Maria Silva",
    status: "em_contato",
    created_at: "2026-03-10T15:00:00.000Z",
    updated_at: "2026-03-10T15:00:00.000Z",
    ...overrides,
  };
}

const baseLead: WebhookLeadInsert = {
  name: "Maria S.",
  phone: "77987654321",
  source: "google_ads",
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
  notes: "Mensagem: Oi",
  parent_lead_id: null,
};

describe("latestLead", () => {
  it("escolhe o mais recente pela data de entrada", () => {
    const leads = [
      existing({ id: "a", created_at: "2026-01-01T10:00:00Z" }),
      existing({ id: "b", created_at: "2026-03-01T10:00:00Z" }),
      existing({ id: "c", created_at: "2026-02-01T10:00:00Z" }),
    ];
    expect(latestLead(leads)?.id).toBe("b");
  });

  it("sem leads → null", () => {
    expect(latestLead([])).toBeNull();
  });
});

describe("duplicateNote", () => {
  it("usa a data no fuso da clínica (America/Bahia)", () => {
    // 01:30 UTC do dia 02 = 22:30 do dia 01 em Barreiras
    expect(duplicateNote({ name: "Maria Silva", created_at: "2026-03-02T01:30:00Z" })).toBe(
      "Possível duplicado de Maria Silva (01/03/2026)",
    );
  });

  it("nome vazio não deixa a nota estranha", () => {
    expect(duplicateNote({ name: "  ", created_at: "2026-03-10T15:00:00Z" })).toBe(
      "Possível duplicado de lead sem nome (10/03/2026)",
    );
  });
});

describe("linkDuplicate", () => {
  it("vincula ao anterior e antepõe a nota", () => {
    expect(linkDuplicate(baseLead, existing())).toEqual({
      ...baseLead,
      parent_lead_id: "lead-1",
      notes: "Possível duplicado de Maria Silva (10/03/2026)\nMensagem: Oi",
    });
  });

  it("sem notas, fica só a nota de duplicado", () => {
    expect(linkDuplicate({ ...baseLead, notes: null }, existing()).notes).toBe(
      "Possível duplicado de Maria Silva (10/03/2026)",
    );
  });

  it("sem lead anterior, não muda nada", () => {
    expect(linkDuplicate(baseLead, null)).toBe(baseLead);
  });

  it("respeita o limite de 4000 caracteres das notas", () => {
    const linked = linkDuplicate({ ...baseLead, notes: "x".repeat(4000) }, existing());
    expect(linked.notes).toHaveLength(4000);
    expect(linked.notes?.startsWith("Possível duplicado de Maria Silva")).toBe(true);
  });
});

describe("isRecentRepeat", () => {
  const now = new Date("2026-03-10T15:01:00.000Z");

  it("mesmo contato há menos de 2 minutos, ainda 'novo' → reenvio", () => {
    expect(isRecentRepeat(existing({ status: "novo", created_at: "2026-03-10T15:00:00.000Z" }), now)).toBe(true);
  });

  it("mais de 2 minutos → novo lead (duplicado)", () => {
    expect(isRecentRepeat(existing({ status: "novo", created_at: "2026-03-10T14:58:59.000Z" }), now)).toBe(false);
  });

  it("lead já trabalhado pela recepção nunca é tratado como reenvio", () => {
    expect(isRecentRepeat(existing({ status: "em_contato", created_at: "2026-03-10T15:00:30.000Z" }), now)).toBe(false);
  });

  it("sem lead ou data inválida → false", () => {
    expect(isRecentRepeat(null, now)).toBe(false);
    expect(isRecentRepeat(existing({ status: "novo", created_at: "ontem" }), now)).toBe(false);
  });
});
