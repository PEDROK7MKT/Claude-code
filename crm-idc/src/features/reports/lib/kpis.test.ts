import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";
import { buildReportKpis, changeTone, formatChange, type ReportKpi } from "./kpis";
import { buildMonthReport, type MonthReportInput } from "./report";
import { leadsOnDays, makeGmn, makeLead, makeMetric } from "./test-fixtures";

function kpisFor(input: Partial<MonthReportInput>): Map<string, ReportKpi> {
  const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: [], ...input });
  return new Map(buildReportKpis(report).map((k) => [k.id, k]));
}

describe("buildReportKpis", () => {
  it("lista os 12 KPIs na ordem do resumo", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: [] });
    expect(buildReportKpis(report).map((k) => k.id)).toEqual([
      "leads",
      "scheduled",
      "schedulingRate",
      "attended",
      "attendanceRate",
      "investment",
      "costPerLead",
      "costPerScheduled",
      "costPerGoogleAdsLead",
      "clicks",
      "ctr",
      "gmnRating",
    ]);
  });

  it("calcula valores e variação vs mês anterior", () => {
    const march = [
      ...leadsOnDays(3, "2026-03-02", { status: "agendado", scheduled_at: "2026-03-20T12:00:00.000Z" }),
      ...leadsOnDays(2, "2026-03-10", { status: "compareceu", scheduled_at: "2026-03-12T12:00:00.000Z" }),
      ...leadsOnDays(5, "2026-03-15", { source: "instagram" }),
    ];
    const february = leadsOnDays(8, "2026-02-02");
    const all = [...march, ...february];
    const kpis = kpisFor({
      leads: all,
      previousLeads: all,
      metrics: [makeMetric({ date: "2026-03-02", cost: 500, clicks: 100, impressions: 2000 })],
      previousMetrics: [makeMetric({ date: "2026-02-05", cost: 400, clicks: 80, impressions: 2000 })],
      gmnMetrics: [makeGmn()],
    });

    expect(kpis.get("leads")).toMatchObject({ value: "10", change: 25, hint: "5 vieram do Google Ads" });
    expect(kpis.get("scheduled")).toMatchObject({ value: "5", change: null });
    expect(kpis.get("schedulingRate")).toMatchObject({ value: "50%", hint: "5 de 10 leads" });
    expect(kpis.get("attended")).toMatchObject({ value: "2", hint: "nenhuma falta registrada" });
    expect(kpis.get("attendanceRate")).toMatchObject({ value: "100%", hint: "2 de 2 consultas" });
    expect(kpis.get("investment")).toMatchObject({ value: formatCurrency(500), change: 25, hint: "1 dia com métricas" });
    // CPL: 500/10 = 50 vs 400/8 = 50 → 0%
    expect(kpis.get("costPerLead")).toMatchObject({ value: formatCurrency(50), change: 0, invertChange: true });
    expect(kpis.get("costPerScheduled")).toMatchObject({ value: formatCurrency(100), change: null });
    // regra 7: só o lead do Google Ads de 02/03 (único dia lançado) entra no CPL real
    expect(kpis.get("costPerGoogleAdsLead")).toMatchObject({
      value: formatCurrency(500),
      invertChange: true,
      hint: "investimento ÷ 1 lead do Google Ads dos dias lançados",
    });
    expect(kpis.get("clicks")).toMatchObject({ value: "100", change: 25, hint: "2.000 impressões" });
    expect(kpis.get("ctr")).toMatchObject({ value: "5%", change: 25 });
    expect(kpis.get("gmnRating")).toMatchObject({ value: "4,9", hint: "188 avaliações · até 31/03/2026" });
    expect(kpis.get("gmnRating")?.change).toBeUndefined();
  });

  it("sem mês anterior carregado, oculta as variações", () => {
    const kpis = kpisFor({ leads: leadsOnDays(2, "2026-03-02") });
    expect(kpis.get("leads")?.change).toBeUndefined();
    expect(kpis.get("scheduled")?.change).toBeUndefined();
  });

  it("mês anterior sem leads: sem base de comparação (null)", () => {
    const leads = leadsOnDays(2, "2026-03-02");
    const kpis = kpisFor({ leads, previousLeads: [] });
    expect(kpis.get("leads")?.change).toBeNull();
  });

  it("sem métricas do Google Ads: valores '—' e texto explicativo", () => {
    const leads = [makeLead()];
    const empty = kpisFor({ leads, previousLeads: [], metrics: [], previousMetrics: [] });
    expect(empty.get("investment")).toMatchObject({ value: "—", hint: "Sem métricas do Google Ads no mês" });
    expect(empty.get("investment")?.change).toBeUndefined();
    expect(empty.get("costPerLead")?.value).toBe("—");
    expect(empty.get("clicks")?.value).toBe("—");
    expect(empty.get("ctr")?.value).toBe("—");

    const unavailable = kpisFor({ leads, metrics: null });
    expect(unavailable.get("investment")?.hint).toBe("Métricas do Google Ads indisponíveis");
  });

  it("métricas só no mês atual: variação sem base (null)", () => {
    const kpis = kpisFor({
      leads: [makeLead()],
      previousLeads: [],
      metrics: [makeMetric({ date: "2026-03-05" })],
      previousMetrics: [],
    });
    expect(kpis.get("investment")?.change).toBeNull();
  });

  it("sem GMN registrado", () => {
    const kpis = kpisFor({ gmnMetrics: [] });
    expect(kpis.get("gmnRating")).toMatchObject({ value: "—", hint: "Sem registro do Google Meu Negócio" });
  });

  it("singular nos textos auxiliares", () => {
    const kpis = kpisFor({
      leads: [makeLead({ status: "nao_compareceu", scheduled_at: "2026-03-12T12:00:00.000Z" })],
    });
    expect(kpis.get("leads")?.hint).toBe("1 veio do Google Ads");
    expect(kpis.get("schedulingRate")?.hint).toBe("0 de 1 lead");
    expect(kpis.get("attended")?.hint).toBe("1 falta registrada");
    expect(kpis.get("attendanceRate")).toMatchObject({ value: "0%", hint: "0 de 1 consulta" });
  });
});

describe("formatChange / changeTone", () => {
  it("formata a variação com sinal", () => {
    expect(formatChange(12.4)).toBe("+12%");
    expect(formatChange(-8.6)).toBe("-9%");
    expect(formatChange(0.3)).toBe("0%");
    expect(formatChange(1250)).toBe("+1.250%");
    expect(formatChange(null)).toBeNull();
    expect(formatChange(undefined)).toBeNull();
  });

  it("classifica a direção considerando métricas de custo", () => {
    expect(changeTone(10)).toBe("good");
    expect(changeTone(-10)).toBe("bad");
    expect(changeTone(10, true)).toBe("bad");
    expect(changeTone(-10, true)).toBe("good");
    expect(changeTone(0.2)).toBe("neutral");
    expect(changeTone(null)).toBe("neutral");
  });
});
