import { describe, expect, it } from "vitest";
import type { LeadSource, LeadStatus } from "@/types/database";
import {
  buildAdminKpis,
  buildStatusSeries,
  buildTrendSeries,
  filterMetricsByRange,
  getAdminDashboardRanges,
  getDashboardFetchWindow,
  kpiChange,
  sourceShares,
  splitLeadsByPeriod,
  statusTotals,
} from "./admin-dashboard";

// Quinta-feira, 24/09/2026 12:00 em Barreiras
const NOW = "2026-09-24T15:00:00Z";

interface TestLead {
  created_at: string;
  status: LeadStatus;
  source: LeadSource;
}

function lead(created_at: string, status: LeadStatus = "novo", source: LeadSource = "google_ads"): TestLead {
  return { created_at, status, source };
}

function metricRow(date: string, cost: number) {
  return { date, cost };
}

describe("getAdminDashboardRanges", () => {
  it("7 dias: compara com os 7 anteriores; gráfico de 30 dias", () => {
    const r = getAdminDashboardRanges("7d", NOW);
    expect(r.currentRange.fromKey).toBe("2026-09-18");
    expect(r.currentRange.toKey).toBe("2026-09-24");
    expect(r.previousRange.fromKey).toBe("2026-09-11");
    expect(r.previousRange.toKey).toBe("2026-09-17");
    expect(r.trendRange.fromKey).toBe("2026-08-26");
    expect(r.trendRange.toKey).toBe("2026-09-24");
  });

  it("hoje: compara com ontem; gráfico continua com 30 dias", () => {
    const r = getAdminDashboardRanges("today", NOW);
    expect(r.currentRange.fromKey).toBe("2026-09-24");
    expect(r.currentRange.toKey).toBe("2026-09-24");
    expect(r.previousRange.fromKey).toBe("2026-09-23");
    expect(r.trendRange.fromKey).toBe("2026-08-26");
  });

  it("30 dias: gráfico = período", () => {
    const r = getAdminDashboardRanges("30d", NOW);
    expect(r.trendRange).toEqual(r.currentRange);
    expect(r.previousRange.fromKey).toBe("2026-07-27");
    expect(r.previousRange.toKey).toBe("2026-08-25");
  });

  it("mês atual curto: gráfico usa os últimos 30 dias", () => {
    const r = getAdminDashboardRanges("month", NOW);
    expect(r.currentRange.fromKey).toBe("2026-09-01");
    expect(r.previousRange.fromKey).toBe("2026-08-01");
    expect(r.previousRange.toKey).toBe("2026-08-24");
    expect(r.trendRange.fromKey).toBe("2026-08-26");
  });

  it("mês de 31 dias completo: gráfico cobre o mês inteiro", () => {
    const r = getAdminDashboardRanges("month", "2026-08-31T20:00:00Z");
    expect(r.currentRange.fromKey).toBe("2026-08-01");
    expect(r.trendRange.fromKey).toBe("2026-08-01");
    expect(r.trendRange.toKey).toBe("2026-08-31");
  });
});

describe("getDashboardFetchWindow", () => {
  it("cobre todos os períodos e comparações com uma única consulta", () => {
    const w = getDashboardFetchWindow(NOW);
    // o mais antigo: início dos 30 dias anteriores (27/07)
    expect(w.leadsQuery).toEqual({
      createdFrom: "2026-07-27T03:00:00.000Z",
      createdTo: "2026-09-25T03:00:00.000Z",
    });
    expect(w.metricsQuery).toEqual({ fromKey: "2026-07-27", toKey: "2026-09-24" });
    for (const period of ["today", "7d", "30d", "month"] as const) {
      const r = getAdminDashboardRanges(period, NOW);
      for (const range of [r.currentRange, r.previousRange, r.trendRange]) {
        expect(range.from.getTime()).toBeGreaterThanOrEqual(Date.parse(w.leadsQuery.createdFrom));
        expect(range.to.getTime()).toBeLessThanOrEqual(Date.parse(w.leadsQuery.createdTo));
        expect(range.fromKey >= w.metricsQuery.fromKey).toBe(true);
      }
    }
  });

  it("no fim do mês, o mês anterior pode começar antes dos 60 dias", () => {
    // 31/10: 30 dias anteriores começam em 02/09; mês anterior em 01/09
    const w = getDashboardFetchWindow("2026-10-31T15:00:00Z");
    expect(w.metricsQuery.fromKey).toBe("2026-09-01");
    expect(w.leadsQuery.createdFrom).toBe("2026-09-01T03:00:00.000Z");
  });

  it("a chave só muda na virada do dia", () => {
    expect(getDashboardFetchWindow("2026-09-24T03:00:00Z")).toEqual(getDashboardFetchWindow("2026-09-25T02:59:59Z"));
  });
});

describe("filterMetricsByRange / splitLeadsByPeriod", () => {
  it("filtra métricas por data-calendário inclusiva", () => {
    const rows = [metricRow("2026-09-10", 1), metricRow("2026-09-11", 2), metricRow("2026-09-17", 3), metricRow("2026-09-18", 4)];
    expect(filterMetricsByRange(rows, { fromKey: "2026-09-11", toKey: "2026-09-17" }).map((m) => m.cost)).toEqual([2, 3]);
  });

  it("separa atual × anterior pelo fuso da clínica", () => {
    const ranges = getAdminDashboardRanges("today", NOW);
    const leads = [
      lead("2026-09-24T02:59:00Z"), // 23/09 23:59 Bahia → ontem
      lead("2026-09-24T03:00:00Z"), // 24/09 00:00 → hoje
      lead("2026-09-24T20:00:00Z"), // hoje
      lead("2026-09-22T12:00:00Z"), // fora dos dois
    ];
    const { periodLeads, previousLeads } = splitLeadsByPeriod(leads, ranges);
    expect(periodLeads).toHaveLength(2);
    expect(previousLeads).toHaveLength(1);
  });
});

describe("kpiChange", () => {
  it("variação percentual", () => {
    expect(kpiChange(12, 10)).toBeCloseTo(20);
    expect(kpiChange(5, 10)).toBeCloseTo(-50);
    expect(kpiChange(0, 0)).toBe(0);
  });

  it("sem base de comparação → null", () => {
    expect(kpiChange(5, 0)).toBeNull();
    expect(kpiChange(null, 10)).toBeNull();
    expect(kpiChange(10, null)).toBeNull();
    expect(kpiChange(Number.NaN, 10)).toBeNull();
  });
});

describe("buildAdminKpis", () => {
  const currentLeads = [
    lead("2026-09-20T12:00:00Z", "agendado"),
    lead("2026-09-21T12:00:00Z", "confirmado"),
    lead("2026-09-20T13:00:00Z", "compareceu", "gmn"),
    lead("2026-09-22T12:00:00Z", "novo", "instagram"),
  ];
  const previousLeads = [lead("2026-09-12T12:00:00Z", "agendado"), lead("2026-09-13T12:00:00Z", "perdido")];

  it("calcula KPIs e variações vs período anterior", () => {
    const k = buildAdminKpis({
      currentLeads,
      previousLeads,
      currentMetrics: [metricRow("2026-09-20", 100), metricRow("2026-09-20", 60), metricRow("2026-09-21", 40)],
      previousMetrics: [metricRow("2026-09-12", 100)],
    });
    expect(k.leads).toEqual({ value: 4, previous: 2, change: 100 });
    // 3 de 4 agendados (75%) vs 1 de 2 (50%) → +50%
    expect(k.schedulingRate.value).toBeCloseTo(75);
    expect(k.schedulingRate.change).toBeCloseTo(50);
    // investimento 200 / 4 leads = 50; anterior 100 / 2 = 50 → 0%
    expect(k.costPerLead).toEqual({ value: 50, previous: 50, change: 0 });
    // 200 / 3 agendamentos vs 100 / 1
    expect(k.costPerScheduled.value).toBeCloseTo(66.67, 1);
    expect(k.costPerScheduled.change).toBeCloseTo(-33.33, 1);
    expect(k.investment).toEqual({ value: 200, previous: 100, change: 100 });
    // só Google Ads: 2 leads de anúncio
    expect(k.costPerGoogleAdsLead).toBe(100);
    expect(k.adsDays).toBe(2);
    expect(k.hasAdsData).toBe(true);
    expect(k.hadAdsData).toBe(true);
  });

  it("sem lançamentos no período atual: custos indefinidos, sem variação", () => {
    const k = buildAdminKpis({
      currentLeads,
      previousLeads,
      currentMetrics: [],
      previousMetrics: [metricRow("2026-09-12", 100)],
    });
    expect(k.hasAdsData).toBe(false);
    expect(k.costPerLead.value).toBeNull();
    expect(k.costPerLead.change).toBeNull();
    expect(k.costPerScheduled.value).toBeNull();
    expect(k.costPerGoogleAdsLead).toBeNull();
    expect(k.investment.value).toBe(0);
    expect(k.investment.change).toBeNull();
    expect(k.adsDays).toBe(0);
  });

  it("sem lançamentos no período anterior: valores atuais sem base de comparação", () => {
    const k = buildAdminKpis({
      currentLeads,
      previousLeads,
      currentMetrics: [metricRow("2026-09-20", 80)],
      previousMetrics: [],
    });
    expect(k.costPerLead.value).toBe(20);
    expect(k.costPerLead.previous).toBeNull();
    expect(k.costPerLead.change).toBeNull();
    expect(k.investment.change).toBeNull();
  });

  it("divisão por zero: sem leads/agendamentos → null", () => {
    const k = buildAdminKpis({
      currentLeads: [],
      previousLeads: [],
      currentMetrics: [metricRow("2026-09-20", 80)],
      previousMetrics: [metricRow("2026-09-12", 50)],
    });
    expect(k.leads).toEqual({ value: 0, previous: 0, change: 0 });
    expect(k.schedulingRate.value).toBeNull();
    expect(k.schedulingRate.change).toBeNull();
    expect(k.costPerLead.value).toBeNull();
    expect(k.costPerScheduled.value).toBeNull();
    expect(k.investment.change).toBeCloseTo(60);
  });

  it("regra 7: 'Só Google Ads' ignora leads de anúncio de dias sem lançamento (ex.: hoje)", () => {
    const k = buildAdminKpis({
      currentLeads: [
        ...currentLeads,
        // hoje (24/09, 00:30 em Barreiras): ainda sem custo lançado
        lead("2026-09-24T03:30:00Z", "novo"),
        lead("2026-09-24T15:00:00Z", "agendado"),
      ],
      previousLeads,
      currentMetrics: [metricRow("2026-09-20", 160), metricRow("2026-09-21", 40)],
      previousMetrics: [],
    });
    // 200 / 2 leads de anúncio dos dias 20 e 21 (não 200 / 4)
    expect(k.costPerGoogleAdsLead).toBe(100);
    expect(k.current.googleAdsLeads).toBe(4);
    // o CPL geral (spec) continua dividindo pelo total de leads do período
    expect(k.costPerLead.value).toBeCloseTo(200 / 6);
  });

  it("regra 7: leads de anúncio só em dias sem lançamento → sem CPL de anúncio", () => {
    const k = buildAdminKpis({
      currentLeads: [lead("2026-09-24T15:00:00Z")],
      previousLeads: [],
      currentMetrics: [metricRow("2026-09-20", 50)],
      previousMetrics: [],
    });
    expect(k.costPerGoogleAdsLead).toBeNull();
    expect(k.current.googleAdsLeads).toBe(1);
  });

  it("aceita custo DECIMAL vindo como string", () => {
    const k = buildAdminKpis({
      currentLeads: [lead("2026-09-20T12:00:00Z")],
      previousLeads: [],
      currentMetrics: [{ date: "2026-09-20", cost: "10.10" as unknown as number }, metricRow("2026-09-21", 0.2)],
      previousMetrics: [],
    });
    expect(k.investment.value).toBe(10.3);
  });
});

describe("buildTrendSeries", () => {
  const range = getAdminDashboardRanges("7d", NOW).currentRange; // 18/09 a 24/09

  it("zera dias sem leads e ignora leads fora da janela", () => {
    const s = buildTrendSeries(
      [
        lead("2026-09-18T12:00:00Z"),
        lead("2026-09-18T13:00:00Z"),
        lead("2026-09-20T12:00:00Z"),
        lead("2026-09-25T04:00:00Z"), // amanhã
        lead("2026-09-17T12:00:00Z"), // antes
      ],
      range,
    );
    expect(s.points.map((p) => p.count)).toEqual([2, 0, 1, 0, 0, 0, 0]);
    expect(s.points[0]).toMatchObject({ date: "2026-09-18", label: "18/09", tooltipLabel: "sexta, 18/09/2026" });
    expect(s.total).toBe(3);
    expect(s.averagePerDay).toBeCloseTo(3 / 7);
  });

  it("tendência de alta, queda e estável", () => {
    const rising = buildTrendSeries(
      [lead("2026-09-22T12:00:00Z"), lead("2026-09-23T12:00:00Z"), lead("2026-09-24T12:00:00Z"), lead("2026-09-24T13:00:00Z")],
      range,
    );
    expect(rising.direction).toBe("up");
    expect(rising.slopePerDay).toBeGreaterThan(0);

    const falling = buildTrendSeries(
      [lead("2026-09-18T12:00:00Z"), lead("2026-09-18T13:00:00Z"), lead("2026-09-19T12:00:00Z")],
      range,
    );
    expect(falling.direction).toBe("down");

    const flat = buildTrendSeries(
      ["18", "19", "20", "21", "22", "23", "24"].map((d) => lead(`2026-09-${d}T12:00:00Z`)),
      range,
    );
    expect(flat.direction).toBe("flat");
    expect(buildTrendSeries([], range).direction).toBe("flat");
  });

  it("reta de tendência nunca fica negativa", () => {
    const s = buildTrendSeries(
      [lead("2026-09-18T12:00:00Z"), lead("2026-09-18T12:10:00Z"), lead("2026-09-18T12:20:00Z"), lead("2026-09-18T12:30:00Z")],
      range,
    );
    expect(s.points.every((p) => p.trend >= 0)).toBe(true);
    expect(s.points[0].trend).toBeGreaterThan(s.points[6].trend);
  });
});

describe("buildStatusSeries / statusTotals / sourceShares", () => {
  it("série diária por status com rótulo do tooltip", () => {
    const series = buildStatusSeries(
      [lead("2026-09-24T12:00:00Z", "novo"), lead("2026-09-24T13:00:00Z", "agendado")],
      { fromKey: "2026-09-24", toKey: "2026-09-24" },
    );
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ novo: 1, agendado: 1, total: 2, tooltipLabel: "quinta, 24/09/2026" });
  });

  it("totais por status na ordem do funil, só os presentes", () => {
    const totals = statusTotals([lead("x", "perdido"), lead("x", "novo"), lead("x", "novo"), lead("x", "compareceu")]);
    expect(totals.map((t) => [t.status, t.count])).toEqual([
      ["novo", 2],
      ["compareceu", 1],
      ["perdido", 1],
    ]);
    expect(totals[0]).toMatchObject({ title: "Novo", color: "#3B82F6", share: 50 });
    expect(statusTotals([])).toEqual([]);
  });

  it("participação por fonte com cor em `fill`", () => {
    const shares = sourceShares([lead("x", "novo", "gmn"), lead("x", "novo", "google_ads"), lead("x", "novo", "google_ads"), lead("x", "novo", "indicacao")]);
    expect(shares.map((s) => [s.source, s.value, s.share])).toEqual([
      ["google_ads", 2, 50],
      ["gmn", 1, 25],
      ["indicacao", 1, 25],
    ]);
    expect(shares[0].fill).toBe(shares[0].color);
    expect(sourceShares([])).toEqual([]);
  });
});
