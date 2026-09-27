import { describe, expect, it } from "vitest";
import { SOURCE_COLORS } from "@/lib/constants";
import type { SourceSlice } from "@/lib/metrics";
import {
  OTHER_SOURCES_COLOR,
  buildMonthReport,
  foldSourceSlices,
  formatDayTooltip,
  formatReportPeriod,
  gmnSnapshotForMonth,
  topService,
} from "./report";
import { leadsOnDays, makeGmn, makeLead, makeMetric } from "./test-fixtures";

describe("buildMonthReport — limites do mês no fuso da Bahia", () => {
  it("usa a data local (America/Bahia) para decidir o mês do lead", () => {
    const report = buildMonthReport({
      monthKey: "2026-03",
      today: "2026-09-27",
      leads: [
        // 28/02 23:00 em Barreiras → fevereiro
        makeLead({ created_at: "2026-03-01T02:00:00.000Z" }),
        // 01/03 00:30 em Barreiras → março
        makeLead({ created_at: "2026-03-01T03:30:00.000Z" }),
        // 31/03 23:00 em Barreiras → março
        makeLead({ created_at: "2026-04-01T02:00:00.000Z" }),
      ],
    });
    expect(report.current.kpis.total).toBe(2);
    expect(report.range.fromKey).toBe("2026-03-01");
    expect(report.range.toKey).toBe("2026-03-31");
    expect(report.monthLabel).toBe("março de 2026");
    expect(report.previousMonthKey).toBe("2026-02");
    expect(report.previousMonthLabel).toBe("fevereiro de 2026");
    expect(formatReportPeriod(report)).toBe("01/03/2026 a 31/03/2026");
  });

  it("separa mês atual e anterior mesmo vindo de uma única consulta", () => {
    const march = leadsOnDays(3, "2026-03-05");
    const february = leadsOnDays(2, "2026-02-10");
    const all = [...march, ...february];
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: all, previousLeads: all });
    expect(report.current.kpis.total).toBe(3);
    expect(report.previous?.kpis.total).toBe(2);
  });

  it("previous é null quando os leads do mês anterior não estão disponíveis", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: leadsOnDays(2, "2026-03-05") });
    expect(report.previous).toBeNull();
  });
});

describe("buildMonthReport — funil", () => {
  const leads = [
    makeLead({ status: "novo" }),
    makeLead({ status: "agendado", scheduled_at: "2026-03-20T12:00:00.000Z" }),
    makeLead({ status: "confirmado", scheduled_at: "2026-03-21T12:00:00.000Z" }),
    makeLead({ status: "compareceu", scheduled_at: "2026-03-15T12:00:00.000Z" }),
    makeLead({ status: "compareceu", scheduled_at: "2026-03-16T12:00:00.000Z" }),
    makeLead({ status: "nao_compareceu", scheduled_at: "2026-03-17T12:00:00.000Z" }),
    makeLead({ status: "perdido", source: "instagram" }),
  ];
  const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads });

  it("conta agendamentos, comparecimentos e faltas", () => {
    expect(report.current.kpis.scheduled).toBe(4);
    expect(report.current.attended).toBe(2);
    expect(report.current.missed).toBe(1);
    expect(report.current.attendanceRate).toBeCloseTo(66.667, 2);
  });

  it("monta as barras do funil na ordem dos status, com participação", () => {
    expect(report.statusBars.map((b) => b.status)).toEqual([
      "novo",
      "em_contato",
      "agendado",
      "confirmado",
      "compareceu",
      "nao_compareceu",
      "cancelado",
      "perdido",
    ]);
    const attended = report.statusBars.find((b) => b.status === "compareceu");
    expect(attended?.value).toBe(2);
    expect(attended?.share).toBeCloseTo((2 / 7) * 100, 5);
    expect(attended?.label).toBe("Compareceu");
  });

  it("ordena as fontes por volume", () => {
    expect(report.sources.map((s) => s.source)).toEqual(["google_ads", "instagram"]);
  });
});

describe("buildMonthReport — Google Ads", () => {
  const leads = leadsOnDays(4, "2026-03-10");

  it("unavailable: sem métricas carregadas, custos ficam nulos", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads, metrics: null });
    expect(report.current.adsState).toBe("unavailable");
    expect(report.current.ads).toBeNull();
    expect(report.current.kpis.costPerLead).toBeNull();
    expect(report.current.kpis.costPerGoogleAdsLead).toBeNull();
    expect(report.adsComparison).toBeNull();
  });

  it("empty: consulta sem dias lançados não vira custo R$ 0,00", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads, metrics: [] });
    expect(report.current.adsState).toBe("empty");
    expect(report.current.kpis.costPerLead).toBeNull();
    expect(report.current.kpis.investment).toBe(0);
  });

  it("ready: soma o mês, ignora dias de outros meses e cruza com os leads do CRM", () => {
    const metrics = [
      makeMetric({ date: "2026-03-10", cost: 150, clicks: 60, impressions: 1500, conversions: 3 }),
      makeMetric({ date: "2026-03-11", cost: 50, clicks: 20, impressions: 500, conversions: 1 }),
      makeMetric({ date: "2026-02-28", cost: 999, clicks: 1, impressions: 1, conversions: 0 }),
    ];
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads, metrics });
    expect(report.current.adsState).toBe("ready");
    expect(report.current.ads?.cost).toBe(200);
    expect(report.current.ads?.clicks).toBe(80);
    expect(report.current.adsDays).toBe(2);
    expect(report.current.kpis.costPerLead).toBe(50);
    // regra 7: só os leads google_ads dos dias lançados (10 e 11/03) entram no CPL real
    expect(report.current.kpis.googleAdsLeads).toBe(4);
    expect(report.current.kpis.costPerGoogleAdsLead).toBe(100);

    const comparison = report.adsComparison ?? [];
    expect(comparison).toHaveLength(31);
    const day10 = comparison.find((p) => p.date === "2026-03-10");
    expect(day10).toMatchObject({ conversions: 3, crmLeads: 1, label: "10/03" });
    // dia sem lançamento: conversões null (lacuna), leads do CRM contados
    const day12 = comparison.find((p) => p.date === "2026-03-12");
    expect(day12).toMatchObject({ conversions: null, crmLeads: 1 });
  });
});

describe("buildMonthReport — CPL real Google Ads (regra 7)", () => {
  it("mês em andamento: leads de anúncio de hoje (sem lançamento) não baixam o CPL real", () => {
    const leads = [
      makeLead({ created_at: "2026-09-20T15:00:00.000Z", status: "agendado" }),
      makeLead({ created_at: "2026-09-21T15:00:00.000Z" }),
      // hoje (27/09): custo ainda não lançado
      makeLead({ created_at: "2026-09-27T13:00:00.000Z", status: "agendado" }),
      makeLead({ created_at: "2026-09-27T14:00:00.000Z" }),
      makeLead({ created_at: "2026-09-27T14:30:00.000Z", source: "gmn" }),
    ];
    const metrics = [makeMetric({ date: "2026-09-20", cost: 120 }), makeMetric({ date: "2026-09-21", cost: 80 })];
    const report = buildMonthReport({ monthKey: "2026-09", today: "2026-09-27", leads, metrics });
    const k = report.current.kpis;
    expect(k.googleAdsLeads).toBe(4);
    expect(k.costPerGoogleAdsLead).toBe(100); // 200 / 2, não 200 / 4
    expect(k.costPerGoogleAdsScheduled).toBe(200); // 1 agendamento nos dias lançados
    // o CPL geral (spec) segue investimento ÷ todos os leads do mês
    expect(k.costPerLead).toBe(40);
  });

  it("anúncios só em dias sem lançamento: CPL real indefinido", () => {
    const leads = [makeLead({ created_at: "2026-09-27T13:00:00.000Z" })];
    const metrics = [makeMetric({ date: "2026-09-20", cost: 50 })];
    const report = buildMonthReport({ monthKey: "2026-09", today: "2026-09-27", leads, metrics });
    expect(report.current.kpis.costPerGoogleAdsLead).toBeNull();
    expect(report.current.kpis.costPerGoogleAdsScheduled).toBeNull();
    expect(report.current.kpis.costPerLead).toBe(50);
  });
});

describe("buildMonthReport — mês em andamento", () => {
  it("corta as séries em hoje e marca como parcial", () => {
    const report = buildMonthReport({
      monthKey: "2026-09",
      today: "2026-09-27",
      leads: leadsOnDays(5, "2026-09-01"),
      metrics: [makeMetric({ date: "2026-09-02" })],
    });
    expect(report.isPartial).toBe(true);
    expect(report.throughKey).toBe("2026-09-27");
    expect(report.perDay).toHaveLength(27);
    expect(report.adsComparison).toHaveLength(27);
  });

  it("mês fechado vai até o último dia", () => {
    const report = buildMonthReport({ monthKey: "2026-02", today: "2026-09-27", leads: [] });
    expect(report.isPartial).toBe(false);
    expect(report.perDay).toHaveLength(28);
  });
});

describe("buildMonthReport — série diária", () => {
  it("inclui tendência e rótulos de tooltip", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: leadsOnDays(3, "2026-03-01") });
    expect(report.perDay[0]).toMatchObject({ date: "2026-03-01", label: "01/03", count: 1 });
    expect(report.perDay[0].tooltipLabel).toBe("domingo, 01/03/2026");
    expect(report.perDay.every((d) => d.trend !== null && d.trend >= 0)).toBe(true);
  });

  it("sem tendência com menos de 3 dias", () => {
    const report = buildMonthReport({ monthKey: "2026-09", today: "2026-09-02", leads: [] });
    expect(report.perDay).toHaveLength(2);
    expect(report.perDay.every((d) => d.trend === null)).toBe(true);
  });

  it("formatDayTooltip usa o dia da semana em pt-BR", () => {
    expect(formatDayTooltip("2026-03-03")).toBe("terça, 03/03/2026");
  });
});

describe("topService", () => {
  it("ignora leads sem serviço e desempata pela ordem da lista", () => {
    expect(topService([{ service: null }, { service: null }])).toBeNull();
    expect(
      topService([{ service: "implante" }, { service: "canal" }, { service: "canal" }, { service: null }]),
    ).toEqual({ service: "canal", label: "Tratamento de Canal", count: 2 });
    expect(topService([{ service: "canal" }, { service: "implante" }])?.service).toBe("implante");
  });
});

describe("gmnSnapshotForMonth", () => {
  const range = { fromKey: "2026-03-01", toKey: "2026-03-31" };

  it("usa o registro mais recente que terminou até o fim do mês", () => {
    const rows = [
      makeGmn({ period_start: "2026-04-01", period_end: "2026-04-30", total_reviews: 195, average_rating: 5 }),
      makeGmn({ period_start: "2026-03-16", period_end: "2026-03-31", total_reviews: 188, new_reviews: 3 }),
      makeGmn({ period_start: "2026-03-01", period_end: "2026-03-15", total_reviews: 185, new_reviews: 2 }),
      makeGmn({ period_start: "2026-02-01", period_end: "2026-02-28", total_reviews: 183, new_reviews: 4 }),
    ];
    expect(gmnSnapshotForMonth(rows, range)).toEqual({
      rating: 4.9,
      totalReviews: 188,
      newReviewsInMonth: 5,
      periodStart: "2026-03-16",
      periodEnd: "2026-03-31",
    });
  });

  it("último lançamento do mês sem nota: usa a nota mais recente informada até o fim do mês", () => {
    const rows = [
      makeGmn({ period_start: "2026-04-01", period_end: "2026-04-07", average_rating: 3.1 }),
      makeGmn({ period_start: "2026-03-25", period_end: "2026-03-31", total_reviews: 190, average_rating: null }),
      makeGmn({ period_start: "2026-03-18", period_end: "2026-03-24", total_reviews: 188, average_rating: 4.7 }),
      makeGmn({ period_start: "2026-03-11", period_end: "2026-03-17", total_reviews: 186, average_rating: 4.6 }),
    ];
    expect(gmnSnapshotForMonth(rows, range)).toMatchObject({
      rating: 4.7,
      totalReviews: 190,
      periodStart: "2026-03-25",
      periodEnd: "2026-03-31",
    });
  });

  it("nenhum registro até o mês com nota: rating null", () => {
    const rows = [makeGmn({ period_start: "2026-03-01", period_end: "2026-03-31", average_rating: null })];
    expect(gmnSnapshotForMonth(rows, range)).toMatchObject({ rating: null, totalReviews: 188 });
  });

  it("aceita nota como string e registro de meses anteriores", () => {
    const rows = [makeGmn({ period_start: "2026-01-01", period_end: "2026-01-31", average_rating: "4.8" as unknown as number })];
    expect(gmnSnapshotForMonth(rows, range)).toMatchObject({ rating: 4.8, newReviewsInMonth: 0 });
  });

  it("null sem registros até o mês", () => {
    expect(gmnSnapshotForMonth([makeGmn({ period_start: "2026-05-01", period_end: "2026-05-31" })], range)).toBeNull();
    expect(gmnSnapshotForMonth([], range)).toBeNull();
  });

  it("vira null no relatório quando o GMN não carregou", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: [], gmnMetrics: null });
    expect(report.gmn).toBeNull();
  });
});

describe("foldSourceSlices", () => {
  const slice = (source: SourceSlice["source"], value: number): SourceSlice => ({
    source,
    label: source,
    value,
    color: SOURCE_COLORS[source],
  });

  it("mantém até 6 fatias", () => {
    const slices = [slice("google_ads", 5), slice("gmn", 3)];
    expect(foldSourceSlices(slices)).toEqual(slices);
  });

  it("agrupa o excedente em Outras fontes, preservando as cores das fontes mantidas", () => {
    const slices = [
      slice("google_ads", 10),
      slice("gmn", 8),
      slice("instagram", 6),
      slice("indicacao", 5),
      slice("google_organico", 4),
      slice("retorno", 2),
      slice("outro", 1),
    ];
    const folded = foldSourceSlices(slices);
    expect(folded).toHaveLength(6);
    expect(folded[0].color).toBe(SOURCE_COLORS.google_ads);
    expect(folded[5]).toEqual({ source: "outras", label: "Outras fontes", value: 3, color: OTHER_SOURCES_COLOR });
  });
});
