import { describe, expect, it } from "vitest";
import type { LeadSource, LeadStatus } from "@/types/database";
import { compareAdsKpis, computeAdsKpis } from "./summary";

const metric = (date: string, impressions: number, clicks: number, cost: number, conversions: number) => ({
  date,
  impressions,
  clicks,
  cost,
  conversions,
});

const lead = (status: LeadStatus, source: LeadSource = "google_ads", campaign: string | null = "IDC | Implante Dentário") => ({
  status,
  source,
  campaign,
});

describe("computeAdsKpis", () => {
  it("soma o Google Ads e calcula o CPL real com os leads do CRM (regra 7)", () => {
    const kpis = computeAdsKpis(
      [metric("2026-09-01", 1000, 50, 150, 4), metric("2026-09-01", 500, 25, 75, 1), metric("2026-09-02", 500, 25, 75, 0)],
      [lead("novo"), lead("agendado"), lead("compareceu"), lead("perdido", "google_ads", null), lead("agendado", "gmn")],
    );
    expect(kpis).toMatchObject({
      impressions: 2000,
      clicks: 100,
      cost: 300,
      conversions: 5,
      ctr: 5,
      cpc: 3,
      costPerConversion: 60,
      crmLeads: 4,
      crmScheduled: 2,
      realCpl: 75,
      realCostPerScheduled: 150,
      leadsWithoutCampaign: 1,
      daysWithData: 2,
    });
  });

  it("razões sem base ficam null", () => {
    const kpis = computeAdsKpis([], []);
    expect(kpis).toMatchObject({ cost: 0, ctr: null, cpc: null, costPerConversion: null, realCpl: null, realCostPerScheduled: null });
  });

  it("custo sem leads: CPL real indefinido", () => {
    expect(computeAdsKpis([metric("2026-09-01", 100, 10, 50, 1)], []).realCpl).toBeNull();
  });
});

describe("compareAdsKpis", () => {
  it("sem período anterior oculta as variações", () => {
    const current = computeAdsKpis([metric("2026-09-01", 100, 10, 50, 1)], [lead("novo")]);
    expect(Object.values(compareAdsKpis(current, null)).every((v) => v === undefined)).toBe(true);
  });

  it("variação percentual e razões sem base", () => {
    const current = computeAdsKpis([metric("2026-09-02", 200, 20, 100, 2)], [lead("novo"), lead("agendado")]);
    const previous = computeAdsKpis([metric("2026-09-01", 100, 10, 50, 0)], [lead("novo")]);
    const changes = compareAdsKpis(current, previous);
    expect(changes.cost).toBe(100);
    expect(changes.impressions).toBe(100);
    expect(changes.crmLeads).toBe(100);
    expect(changes.ctr).toBe(0);
    expect(changes.realCpl).toBe(0);
    // conversões: anterior 0 → sem base
    expect(changes.conversions).toBeNull();
    expect(changes.costPerConversion).toBeNull();
    // agendamentos: anterior sem agendamento → custo por agendamento sem base
    expect(changes.realCostPerScheduled).toBeNull();
  });
});
