import { describe, expect, it } from "vitest";
import type { LeadSource, LeadStatus } from "@/types/database";
import {
  buildAdminKpis,
  buildStatusSeries,
  buildTrendSeries,
  filterMetricsByRange,
  getAdminDashboardRanges,
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
  it("7 dias: gráfico de 30 dias e consulta única cobrindo tudo", () => {
    const r = getAdminDashboardRanges("7d", NOW);
    expect(r.current.fromKey).toBe("2026-09-18");
    expect(r.current.toKey).toBe("2026-09-24");
    expect(r.previous.fromKey).toBe("2026-09-11");
    expect(r.previous.toKey).toBe("2026-09-17");
    expect(r.trend.fromKey).toBe("2026-08-26");
    expect(r.trend.toKey).toBe("2026-09-24");
    expect(r.leadsQuery).toEqual({
      createdFrom: "2026-08-26T03:00:00.000Z",
      createdTo: "2026-09-25T03:00:00.000Z",
    });
    expect(r.metricsQuery).toEqual({ fromKey: "2026-09-11", toKey: "2026-09-24" });
  });

  it("hoje: compara com ontem; gráfico continua com 30 dias", () => {
    const r = getAdminDashboardRanges("today", NOW);
    expect(r.current.fromKey).toBe("2026-09-24");
    expect(r.previous.fromKey).toBe("2026-09-23");
    expect(r.trend.fromKey).toBe("2026-08-26");
    expect(r.leadsQuery.createdFrom).toBe("2026-08-26T03:00:00.000Z");
    expect(r.metricsQuery).toEqual({ fromKey: "2026-09-23", toKey: "2026-09-24" });
  });

  it("30 dias: gráfico = período; consulta começa no período anterior", () => {
    const r = getAdminDashboardRanges("30d", NOW);
    expect(r.trend).toEqual(r.current);
    expect(r.previous.fromKey).toBe("2026-07-27");
    expect(r.leadsQuery.createdFrom).toBe("2026-07-27T03:00:00.000Z");
  });

  it("mês atual curto: gráfico usa os últimos 30 dias", () => {
    const r = getAdminDashboardRanges("month", NOW);
    expect(r.current.fromKey).toBe("2026-09-01");
    expect(r.previous.fromKey).toBe("2026-08-01");
    expect(r.previous.toKey).toBe("2026-08-24");
    expect(r.trend.fromKey).toBe("2026-08-26");
    expect(r.leadsQuery.createdFrom).toBe("2026-08-01T03:00:00.000Z");
  });

  it("mês de 31 dias completo: gráfico cobre o mês inteiro", () => {
    const r = getAdminDashboardRanges("month", "2026-08-31T20:00:00Z");
    expect(r.current.fromKey).toBe("2026-08-01");
    expect(r.trend.fromKey).toBe("2026-08-01");
    expect(r.trend.toKey).toBe("2026-08-31");
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
    const { current, previous } = splitLeadsByPeriod(leads, ranges);
    expect(current).toHaveLength(2);
    expect(previous).toHaveLength(1);
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
    lead("x", "agendado"),
    lead("x", "confirmado"),
    lead("x", "compareceu", "gmn"),
    lead("x", "novo", "instagram"),
  ];
  const previousLeads = [lead("x", "agendado"), lead("x", "perdido")];

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

  it("aceita custo DECIMAL vindo como string", () => {
    const k = buildAdminKpis({
      currentLeads: [lead("x")],
      previousLeads: [],
      currentMetrics: [{ date: "2026-09-20", cost: "10.10" as unknown as number }, metricRow("2026-09-21", 0.2)],
      previousMetrics: [],
    });
    expect(k.investment.value).toBe(10.3);
  });
});

describe("buildTrendSeries", () => {
  const range = getAdminDashboardRanges("7d", NOW).current; // 18/09 a 24/09

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
    expect(s.points[0]).toMatchObject({ date: "2026-09-18", label: "18/09", tooltipLabel: "sex, 18/09/2026" });
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
    expect(series[0]).toMatchObject({ novo: 1, agendado: 1, total: 2, tooltipLabel: "qui, 24/09/2026" });
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
