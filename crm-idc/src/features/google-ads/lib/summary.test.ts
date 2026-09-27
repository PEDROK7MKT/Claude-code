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

const lead = (
  status: LeadStatus,
  source: LeadSource = "google_ads",
  campaign: string | null = "IDC | Implante Dentário",
  created_at = "2026-09-01T12:00:00-03:00",
) => ({
  status,
  source,
  campaign,
  created_at,
});

/** Lead do Google Ads criado em `created_at` (campanha padrão). */
const leadAt = (status: LeadStatus, created_at: string) => lead(status, "google_ads", "IDC | Implante Dentário", created_at);

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
      leadsOnMetricDays: 4,
      scheduledOnMetricDays: 2,
      leadsOutsideMetricDays: 0,
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

  it("leads de dias sem lançamento ficam fora do CPL real (regra 7: custo do dia × leads do dia)", () => {
    // "Mês atual" no dia 2: só o dia 1 lançado (R$ 100, 5 leads) + 5 leads hoje, ainda sem lançamento
    const day1 = Array.from({ length: 5 }, (_, i) => leadAt(i < 2 ? "agendado" : "novo", "2026-09-01T10:00:00-03:00"));
    const today = Array.from({ length: 5 }, (_, i) => leadAt(i < 3 ? "confirmado" : "novo", "2026-09-02T09:00:00-03:00"));
    const kpis = computeAdsKpis([metric("2026-09-01", 1000, 50, 100, 5)], [...day1, ...today]);
    expect(kpis).toMatchObject({
      cost: 100,
      crmLeads: 10,
      crmScheduled: 5,
      leadsOnMetricDays: 5,
      scheduledOnMetricDays: 2,
      leadsOutsideMetricDays: 5,
      realCpl: 20,
      realCostPerScheduled: 50,
    });
  });

  it("agrupa o dia do lead no fuso da clínica (22:30 em Barreiras ainda é o dia anterior)", () => {
    // 2026-09-02T01:30Z = 01/09 22:30 em America/Bahia → conta no dia 01, que tem lançamento
    const kpis = computeAdsKpis(
      [metric("2026-09-01", 100, 10, 60, 1)],
      [leadAt("novo", "2026-09-02T01:30:00Z"), leadAt("novo", "2026-09-02T03:30:00Z")],
    );
    expect(kpis).toMatchObject({ crmLeads: 2, leadsOnMetricDays: 1, leadsOutsideMetricDays: 1, realCpl: 60 });
  });

  it("sem nenhum dia lançado o CPL real fica indefinido (custo desconhecido, não R$ 0,00)", () => {
    const kpis = computeAdsKpis([], [leadAt("agendado", "2026-09-02T09:00:00-03:00")]);
    expect(kpis).toMatchObject({ cost: 0, crmLeads: 1, leadsOutsideMetricDays: 1, realCpl: null, realCostPerScheduled: null });
  });
});

describe("compareAdsKpis", () => {
  it("sem período anterior oculta as variações", () => {
    const current = computeAdsKpis([metric("2026-09-01", 100, 10, 50, 1)], [lead("novo")]);
    expect(Object.values(compareAdsKpis(current, null)).every((v) => v === undefined)).toBe(true);
  });

  it("variação percentual e razões sem base", () => {
    const current = computeAdsKpis(
      [metric("2026-09-02", 200, 20, 100, 2)],
      [leadAt("novo", "2026-09-02T10:00:00-03:00"), leadAt("agendado", "2026-09-02T11:00:00-03:00")],
    );
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

  it("período atual parcial não gera melhora falsa no CPL real", () => {
    // anterior: dia todo lançado (R$ 100 / 5 leads = R$ 20); atual: igual + leads de hoje sem lançamento
    const previous = computeAdsKpis(
      [metric("2026-08-01", 1000, 50, 100, 5)],
      Array.from({ length: 5 }, () => leadAt("novo", "2026-08-01T10:00:00-03:00")),
    );
    const current = computeAdsKpis(
      [metric("2026-09-01", 1000, 50, 100, 5)],
      [
        ...Array.from({ length: 5 }, () => leadAt("novo", "2026-09-01T10:00:00-03:00")),
        ...Array.from({ length: 5 }, () => leadAt("novo", "2026-09-02T10:00:00-03:00")),
      ],
    );
    expect(current.realCpl).toBe(20);
    expect(compareAdsKpis(current, previous).realCpl).toBe(0);
  });
});
