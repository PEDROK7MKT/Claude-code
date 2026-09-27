import { describe, expect, it } from "vitest";
import { buildReportChartSpecs, chartSpec } from "./charts";
import { buildMonthReport } from "./report";
import { leadsOnDays, makeMetric } from "./test-fixtures";

describe("buildReportChartSpecs", () => {
  it("mês sem leads: nenhum gráfico disponível", () => {
    const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: [], metrics: [] });
    expect(buildReportChartSpecs(report).map((s) => s.available)).toEqual([false, false, false, false]);
  });

  it("legendas e disponibilidade com dados", () => {
    const leads = [...leadsOnDays(3, "2026-03-02"), ...leadsOnDays(1, "2026-03-09", { source: "instagram" })];
    const report = buildMonthReport({
      monthKey: "2026-03",
      today: "2026-09-27",
      leads,
      metrics: [makeMetric({ date: "2026-03-02" })],
    });
    const specs = buildReportChartSpecs(report);
    expect(specs.map((s) => [s.id, s.span, s.available])).toEqual([
      ["leads-per-day", "full", true],
      ["sources", "half", true],
      ["status-funnel", "half", true],
      ["ads-vs-crm", "full", true],
    ]);
    expect(chartSpec(specs, "sources").legend).toEqual([
      { label: "Google Ads", color: "#0D6E6E", value: "3 · 75%" },
      { label: "Instagram", color: "#EC4899", value: "1 · 25%" },
    ]);
    expect(chartSpec(specs, "leads-per-day").legend.map((l) => l.line)).toEqual(["solid", "dashed"]);
    expect(chartSpec(specs, "leads-per-day").description).toBe(
      "Entrada de leads em março de 2026, com linha de tendência.",
    );
  });

  it("mês em andamento descreve o recorte até hoje; sem métricas não há comparativo", () => {
    const report = buildMonthReport({ monthKey: "2026-09", today: "2026-09-27", leads: leadsOnDays(2, "2026-09-02"), metrics: [] });
    const specs = buildReportChartSpecs(report);
    expect(chartSpec(specs, "leads-per-day").description).toBe(
      "Entrada de leads de 01/09/2026 até hoje (27/09/2026), com linha de tendência.",
    );
    expect(chartSpec(specs, "ads-vs-crm").available).toBe(false);
  });
});
