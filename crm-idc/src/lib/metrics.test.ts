import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, SOURCE_COLORS } from "@/lib/constants";
import {
  adsDailySeries,
  appointmentsInRange,
  attendanceRate,
  computeLeadKpis,
  countBySource,
  countByStatus,
  filterByCreatedAt,
  groupDailyMetricsByCampaign,
  leadsPerDay,
  linearTrend,
  statusPerDay,
  sumAdsCost,
  summarizeDailyMetrics,
  topKeywords,
} from "@/lib/metrics";
import type { DailyMetric, Lead, LeadSource, LeadStatus } from "@/types/database";

let seq = 0;

function makeLead(overrides: Partial<Lead> = {}): Lead {
  seq++;
  return {
    id: `lead-${seq}`,
    name: `Lead ${seq}`,
    phone: "77987654321",
    notes: null,
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
    status: "novo",
    contacted_at: null,
    scheduled_at: null,
    confirmed_at: null,
    attended_at: null,
    estimated_value: null,
    parent_lead_id: null,
    created_by: null,
    assigned_to: null,
    created_at: "2026-03-10T15:00:00Z",
    updated_at: "2026-03-10T15:00:00Z",
    ...overrides,
  };
}

function makeMetric(overrides: Partial<DailyMetric> = {}): DailyMetric {
  seq++;
  return {
    id: `metric-${seq}`,
    date: "2026-03-10",
    campaign: "IDC | Urgência e Canal",
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    leads_total: 0,
    leads_agendados: 0,
    created_by: null,
    created_at: "2026-03-10T15:00:00Z",
    updated_at: "2026-03-10T15:00:00Z",
    ...overrides,
  };
}

const leadsWith = (entries: Array<[LeadStatus, LeadSource]>) =>
  entries.map(([status, source]) => makeLead({ status, source }));

describe("computeLeadKpis", () => {
  const leads = leadsWith([
    ["novo", "google_ads"],
    ["novo", "gmn"],
    ["em_contato", "google_ads"],
    ["agendado", "google_ads"],
    ["agendado", "instagram"],
    ["confirmado", "google_ads"],
    ["compareceu", "google_ads"],
    ["nao_compareceu", "indicacao"],
    ["cancelado", "google_ads"],
    ["perdido", "outro"],
  ]);

  it("calcula taxa de agendamento e custos (spec §4.2)", () => {
    const k = computeLeadKpis(leads, 500);
    expect(k.total).toBe(10);
    expect(k.scheduled).toBe(4); // agendado ×2 + confirmado + compareceu
    expect(k.schedulingRate).toBeCloseTo(40);
    expect(k.investment).toBe(500);
    expect(k.costPerLead).toBeCloseTo(50);
    expect(k.costPerScheduled).toBeCloseTo(125);
    expect(k.googleAdsLeads).toBe(6);
    expect(k.costPerGoogleAdsLead).toBeCloseTo(83.3333, 3);
    expect(k.googleAdsScheduled).toBe(3);
    expect(k.costPerGoogleAdsScheduled).toBeCloseTo(166.6667, 3);
  });

  it("sem leads: razões nulas", () => {
    const k = computeLeadKpis([], 0);
    expect(k).toEqual({
      total: 0,
      scheduled: 0,
      schedulingRate: null,
      investment: 0,
      costPerLead: null,
      costPerScheduled: null,
      googleAdsLeads: 0,
      costPerGoogleAdsLead: null,
      googleAdsScheduled: 0,
      costPerGoogleAdsScheduled: null,
    });
  });

  it("com investimento e sem agendamentos: custo por agendamento indefinido", () => {
    const k = computeLeadKpis(leadsWith([["novo", "gmn"]]), 100);
    expect(k.costPerLead).toBe(100);
    expect(k.costPerScheduled).toBeNull();
    expect(k.costPerGoogleAdsLead).toBeNull();
  });

  it("sem investimento: custo por lead é zero", () => {
    expect(computeLeadKpis(leadsWith([["novo", "gmn"]]), 0).costPerLead).toBe(0);
  });

  it("arredonda o investimento para centavos", () => {
    expect(computeLeadKpis([], 0.1 + 0.2).investment).toBe(0.3);
  });
});

describe("countByStatus", () => {
  it("inclui todos os status, inclusive zerados", () => {
    const counts = countByStatus(leadsWith([["novo", "gmn"], ["novo", "gmn"], ["perdido", "gmn"]]));
    expect(Object.keys(counts).sort()).toEqual([...LEAD_STATUSES].sort());
    expect(counts.novo).toBe(2);
    expect(counts.perdido).toBe(1);
    expect(counts.agendado).toBe(0);
  });
});

describe("countBySource", () => {
  it("ordena desc, sem zeros, com rótulo e cor", () => {
    const slices = countBySource(
      leadsWith([
        ["novo", "gmn"],
        ["novo", "google_ads"],
        ["novo", "google_ads"],
        ["novo", "instagram"],
        ["novo", "gmn"],
        ["novo", "google_ads"],
      ]),
    );
    expect(slices).toEqual([
      { source: "google_ads", label: "Google Ads", value: 3, color: SOURCE_COLORS.google_ads },
      { source: "gmn", label: "Google Meu Negócio", value: 2, color: SOURCE_COLORS.gmn },
      { source: "instagram", label: "Instagram", value: 1, color: SOURCE_COLORS.instagram },
    ]);
  });

  it("empate segue a ordem de LEAD_SOURCES", () => {
    const slices = countBySource(leadsWith([["novo", "outro"], ["novo", "indicacao"], ["novo", "google_organico"]]));
    expect(slices.map((s) => s.source)).toEqual(["google_organico", "indicacao", "outro"]);
  });

  it("vazio → []", () => {
    expect(countBySource([])).toEqual([]);
  });
});

describe("topKeywords", () => {
  it("agrupa sem diferenciar maiúsculas, espaços e marcadores do Google Ads", () => {
    const leads = [
      "Dentista Barreiras",
      "dentista  barreiras",
      "[dentista barreiras]",
      '"dentista barreiras"',
      " DENTISTA BARREIRAS ",
      "+dentista +barreiras",
      "implante dentário",
      "Implante Dentário",
      "canal",
      "",
      "   ",
      null,
    ].map((keyword) => makeLead({ keyword }));
    expect(topKeywords(leads)).toEqual([
      { keyword: "dentista barreiras", count: 6 },
      { keyword: "implante dentário", count: 2 },
      { keyword: "canal", count: 1 },
    ]);
  });

  it("limita a N e desempata pela primeira ocorrência", () => {
    const leads = ["a", "b", "c", "d", "e", "f", "b"].map((keyword) => makeLead({ keyword }));
    expect(topKeywords(leads, 3)).toEqual([
      { keyword: "b", count: 2 },
      { keyword: "a", count: 1 },
      { keyword: "c", count: 1 },
    ]);
    expect(topKeywords(leads)).toHaveLength(5);
    expect(topKeywords(leads, 0)).toEqual([]);
  });
});

describe("leadsPerDay", () => {
  it("agrupa pelo dia de Barreiras e preenche dias vazios", () => {
    const leads = [
      makeLead({ created_at: "2026-03-02T01:30:00Z" }), // 01/03 22:30
      makeLead({ created_at: "2026-03-02T03:00:00Z" }), // 02/03 00:00
      makeLead({ created_at: "2026-03-02T20:00:00Z" }),
      makeLead({ created_at: "2026-02-20T12:00:00Z" }), // fora do intervalo
    ];
    expect(leadsPerDay(leads, "2026-03-01", "2026-03-03")).toEqual([
      { date: "2026-03-01", label: "01/03", count: 1 },
      { date: "2026-03-02", label: "02/03", count: 2 },
      { date: "2026-03-03", label: "03/03", count: 0 },
    ]);
  });
});

describe("linearTrend", () => {
  it("casos triviais", () => {
    expect(linearTrend([])).toEqual([]);
    expect(linearTrend([5])).toEqual([5]);
    expect(linearTrend([2, 2, 2])).toEqual([2, 2, 2]);
  });

  it("reta perfeita é reproduzida", () => {
    linearTrend([1, 3, 5, 7]).forEach((v, i) => expect(v).toBeCloseTo(1 + 2 * i));
  });

  it("mínimos quadrados", () => {
    const fitted = linearTrend([1, 3, 2, 4]);
    [1.3, 2.1, 2.9, 3.7].forEach((expected, i) => expect(fitted[i]).toBeCloseTo(expected));
    // a soma dos valores ajustados é igual à soma dos observados
    expect(fitted.reduce((a, b) => a + b, 0)).toBeCloseTo(10);
  });

  it("tendência de queda", () => {
    const fitted = linearTrend([10, 8, 6, 4]);
    expect(fitted[0]).toBeCloseTo(10);
    expect(fitted[3]).toBeCloseTo(4);
  });
});

describe("statusPerDay", () => {
  it("empilha pelo status atual no dia de criação", () => {
    const leads = [
      makeLead({ created_at: "2026-03-01T12:00:00Z", status: "novo" }),
      makeLead({ created_at: "2026-03-01T13:00:00Z", status: "agendado" }),
      makeLead({ created_at: "2026-03-02T02:00:00Z", status: "perdido" }), // 01/03 23:00 em Barreiras
      makeLead({ created_at: "2026-03-02T12:00:00Z", status: "compareceu" }),
    ];
    const series = statusPerDay(leads, "2026-03-01", "2026-03-03");
    expect(series).toHaveLength(3);
    expect(series[0]).toMatchObject({ date: "2026-03-01", label: "01/03", total: 3, novo: 1, agendado: 1, perdido: 1 });
    expect(series[1]).toMatchObject({ date: "2026-03-02", total: 1, compareceu: 1, novo: 0 });
    expect(series[2].total).toBe(0);
    for (const status of LEAD_STATUSES) expect(series[2][status]).toBe(0);
  });
});

describe("Google Ads", () => {
  it("sumAdsCost soma em centavos e aceita DECIMAL como string", () => {
    expect(sumAdsCost([{ cost: 0.1 }, { cost: 0.2 }])).toBe(0.3);
    expect(sumAdsCost([{ cost: "10.50" as unknown as number }, { cost: 4.5 }])).toBe(15);
    expect(sumAdsCost([])).toBe(0);
  });

  it("summarizeDailyMetrics calcula CTR, CPC e custo por conversão", () => {
    const totals = summarizeDailyMetrics([
      makeMetric({ impressions: 1000, clicks: 50, cost: 100, conversions: 4 }),
      makeMetric({ impressions: 1000, clicks: 30, cost: 60, conversions: 4 }),
    ]);
    expect(totals).toEqual({ impressions: 2000, clicks: 80, cost: 160, conversions: 8, ctr: 4, cpc: 2, costPerConversion: 20 });
    expect(summarizeDailyMetrics([])).toEqual({
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      ctr: null,
      cpc: null,
      costPerConversion: null,
    });
  });

  it("adsDailySeries soma campanhas por dia e cruza com leads google_ads do CRM", () => {
    const metrics = [
      makeMetric({ date: "2026-03-01", campaign: "A", impressions: 500, clicks: 20, cost: 40, conversions: 2 }),
      makeMetric({ date: "2026-03-01", campaign: "B", impressions: 500, clicks: 30, cost: 60, conversions: 3 }),
      makeMetric({ date: "2026-03-03", campaign: "A", impressions: 100, clicks: 0, cost: 0, conversions: 0 }),
    ];
    const leads = [
      makeLead({ source: "google_ads", created_at: "2026-03-01T12:00:00Z" }),
      makeLead({ source: "google_ads", created_at: "2026-03-02T02:00:00Z" }), // 01/03 23:00
      makeLead({ source: "gmn", created_at: "2026-03-01T12:00:00Z" }),
      makeLead({ source: "google_ads", created_at: "2026-03-02T12:00:00Z" }),
    ];
    const series = adsDailySeries(metrics, leads, "2026-03-01", "2026-03-03");
    expect(series[0]).toEqual({
      date: "2026-03-01",
      label: "01/03",
      impressions: 1000,
      clicks: 50,
      cost: 100,
      conversions: 5,
      ctr: 5,
      cpc: 2,
      costPerConversion: 20,
      crmLeads: 2,
      costPerCrmLead: 50,
    });
    expect(series[1]).toMatchObject({ date: "2026-03-02", cost: 0, ctr: null, cpc: null, costPerConversion: null, crmLeads: 1 });
    expect(series[1].costPerCrmLead).toBe(0);
    expect(series[2]).toMatchObject({ impressions: 100, clicks: 0, ctr: 0, cpc: null, crmLeads: 0, costPerCrmLead: null });
  });

  it("groupDailyMetricsByCampaign agrupa sem diferenciar maiúsculas e ordena por custo", () => {
    const groups = groupDailyMetricsByCampaign([
      makeMetric({ date: "2026-03-01", campaign: "IDC | Implante Dentário", cost: 50, clicks: 10, impressions: 100, leads_total: 2, leads_agendados: 1 }),
      makeMetric({ date: "2026-03-02", campaign: " idc | implante dentário ", cost: 50, clicks: 15, impressions: 400, leads_total: 3, leads_agendados: 0 }),
      makeMetric({ date: "2026-03-01", campaign: "IDC | Urgência e Canal", cost: 200, clicks: 40, impressions: 1000, conversions: 5, leads_total: 0 }),
    ]);
    expect(groups.map((g) => g.campaign)).toEqual(["IDC | Urgência e Canal", "IDC | Implante Dentário"]);
    expect(groups[1]).toMatchObject({
      impressions: 500,
      clicks: 25,
      cost: 100,
      leadsTotal: 5,
      leadsAgendados: 1,
      costPerLead: 20,
      costPerScheduled: 100,
      ctr: 5,
      cpc: 4,
      costPerConversion: null,
      days: 2,
    });
    expect(groups[0]).toMatchObject({ costPerLead: null, costPerConversion: 40, days: 1 });
  });
});

describe("attendanceRate", () => {
  it("compareceu / (compareceu + não compareceu)", () => {
    const leads = leadsWith([
      ["compareceu", "gmn"],
      ["compareceu", "gmn"],
      ["compareceu", "gmn"],
      ["nao_compareceu", "gmn"],
      ["agendado", "gmn"],
      ["cancelado", "gmn"],
    ]);
    expect(attendanceRate(leads)).toBeCloseTo(75);
  });

  it("sem consultas concluídas → null", () => {
    expect(attendanceRate(leadsWith([["agendado", "gmn"]]))).toBeNull();
    expect(attendanceRate([])).toBeNull();
  });

  it("todos faltaram → 0", () => {
    expect(attendanceRate(leadsWith([["nao_compareceu", "gmn"]]))).toBe(0);
  });
});

describe("appointmentsInRange", () => {
  const from = "2026-03-09T03:00:00.000Z";
  const to = "2026-03-16T03:00:00.000Z";
  const leads = [
    makeLead({ id: "c", status: "confirmado", scheduled_at: "2026-03-12T13:00:00Z" }),
    makeLead({ id: "a", status: "agendado", scheduled_at: "2026-03-09T03:00:00Z" }), // início (inclusivo)
    makeLead({ id: "x", status: "agendado", scheduled_at: "2026-03-16T03:00:00Z" }), // fim (exclusivo)
    makeLead({ id: "b", status: "compareceu", scheduled_at: "2026-03-10T12:00:00Z" }),
    makeLead({ id: "cancel", status: "cancelado", scheduled_at: "2026-03-11T12:00:00Z" }),
    makeLead({ id: "lost", status: "perdido", scheduled_at: "2026-03-11T12:00:00Z" }),
    makeLead({ id: "none", status: "agendado", scheduled_at: null }),
  ];

  it("filtra [from, to), ignora cancelados/perdidos e ordena pela consulta", () => {
    expect(appointmentsInRange(leads, from, to).map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("aceita Date e lista de status personalizada", () => {
    const result = appointmentsInRange(leads, new Date(from), new Date(to), ["agendado", "confirmado"]);
    expect(result.map((l) => l.id)).toEqual(["a", "c"]);
  });
});

describe("filterByCreatedAt", () => {
  it("intervalo [from, to)", () => {
    const leads = [
      makeLead({ id: "in", created_at: "2026-03-01T03:00:00Z" }),
      makeLead({ id: "before", created_at: "2026-03-01T02:59:59Z" }),
      makeLead({ id: "end", created_at: "2026-03-02T03:00:00Z" }),
    ];
    expect(filterByCreatedAt(leads, "2026-03-01T03:00:00Z", "2026-03-02T03:00:00Z").map((l) => l.id)).toEqual(["in"]);
  });
});
