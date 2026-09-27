import { describe, expect, it } from "vitest";
import { bucketKey, buildAdsChartSeries, hasSeriesValues, pickGranularity } from "./series";

const metric = (date: string, impressions: number, clicks: number, cost: number, conversions: number) => ({
  date,
  impressions,
  clicks,
  cost,
  conversions,
});

describe("pickGranularity / bucketKey", () => {
  it("dia até ~3 meses, semana até ~1 ano, depois mês", () => {
    expect(pickGranularity({ from: "2026-07-01", to: "2026-09-27" })).toBe("day");
    expect(pickGranularity({ from: "2026-01-01", to: "2026-09-27" })).toBe("week");
    expect(pickGranularity({ from: "2024-01-01", to: "2026-09-27" })).toBe("month");
  });

  it("semana começa na segunda-feira", () => {
    expect(bucketKey("2026-09-27", "week")).toBe("2026-09-21"); // domingo → segunda anterior
    expect(bucketKey("2026-09-21", "week")).toBe("2026-09-21");
    expect(bucketKey("2026-09-27", "month")).toBe("2026-09-01");
    expect(bucketKey("2026-09-27", "day")).toBe("2026-09-27");
  });
});

describe("buildAdsChartSeries", () => {
  const range = { from: "2026-09-01", to: "2026-09-03" };

  it("dias sem lançamento viram lacunas (null), mas os leads do CRM contam", () => {
    const series = buildAdsChartSeries(
      [metric("2026-09-01", 1000, 50, 100, 4), metric("2026-09-03", 0, 0, 0, 0)],
      [
        { created_at: "2026-09-02T15:00:00.000Z", source: "google_ads" },
        { created_at: "2026-09-02T16:00:00.000Z", source: "gmn" },
      ],
      range,
    );
    expect(series).toHaveLength(3);
    expect(series[0]).toMatchObject({
      key: "2026-09-01",
      label: "01/09",
      tooltipLabel: "ter, 01/09/2026",
      hasData: true,
      ctr: 5,
      cpc: 2,
      costPerConversion: 25,
      conversions: 4,
      crmLeads: 0,
    });
    expect(series[1]).toMatchObject({ hasData: false, ctr: null, cpc: null, conversions: null, cost: null, crmLeads: 1 });
    // dia lançado com zero: conversões 0 (dado real), razões indefinidas
    expect(series[2]).toMatchObject({ hasData: true, conversions: 0, ctr: null, cpc: null, costPerConversion: null });
  });

  it("agrupa por semana recalculando as razões pelos totais", () => {
    const series = buildAdsChartSeries(
      [metric("2026-09-07", 100, 10, 20, 1), metric("2026-09-08", 300, 10, 40, 1)],
      [],
      { from: "2026-09-06", to: "2026-09-13" },
      "week",
    );
    expect(series.map((p) => p.key)).toEqual(["2026-08-31", "2026-09-07"]);
    expect(series[0]).toMatchObject({ hasData: false, label: "06/09", tooltipLabel: "06/09/2026" });
    expect(series[1]).toMatchObject({
      hasData: true,
      label: "07/09",
      tooltipLabel: "07/09 a 13/09/2026",
      ctr: 5,
      cpc: 3,
      costPerConversion: 30,
    });
  });

  it("agrupa por mês com rótulos em português", () => {
    const series = buildAdsChartSeries([metric("2026-03-10", 10, 1, 5, 0)], [], { from: "2026-02-15", to: "2026-03-20" }, "month");
    expect(series.map((p) => [p.label, p.tooltipLabel])).toEqual([
      ["fev/26", "Fevereiro de 2026"],
      ["mar/26", "Março de 2026"],
    ]);
  });

  it("hasSeriesValues", () => {
    const series = buildAdsChartSeries([], [], range);
    expect(hasSeriesValues(series, "ctr")).toBe(false);
    expect(hasSeriesValues(series, "crmLeads")).toBe(true);
  });
});
