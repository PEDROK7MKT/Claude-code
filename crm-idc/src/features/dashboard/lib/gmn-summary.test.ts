import { describe, expect, it } from "vitest";
import { gmnPeriodDays, pickGmnComparison, summarizeGmn } from "./gmn-summary";

interface Row {
  id: string;
  period_start: string;
  period_end: string;
  created_at: string;
  search_views: number;
  website_clicks: number;
  direction_requests: number;
  total_reviews: number;
  average_rating: number | null;
  new_reviews: number;
}

function row(id: string, start: string, end: string, values: Partial<Row> = {}): Row {
  return {
    id,
    period_start: start,
    period_end: end,
    created_at: `${end}T12:00:00Z`,
    search_views: 0,
    website_clicks: 0,
    direction_requests: 0,
    total_reviews: 0,
    average_rating: null,
    new_reviews: 0,
    ...values,
  };
}

describe("gmnPeriodDays", () => {
  it("conta início e fim", () => {
    expect(gmnPeriodDays("2026-09-01", "2026-09-30")).toBe(30);
    expect(gmnPeriodDays("2026-09-21", "2026-09-27")).toBe(7);
    expect(gmnPeriodDays("2026-09-21", "2026-09-21")).toBe(1);
  });
});

describe("pickGmnComparison", () => {
  it("null sem registros", () => {
    expect(pickGmnComparison([])).toBeNull();
  });

  it("mais recente + anterior sem sobreposição, independente da ordem", () => {
    const aug = row("aug", "2026-08-01", "2026-08-31");
    const jul = row("jul", "2026-07-01", "2026-07-31");
    const sep = row("sep", "2026-09-01", "2026-09-30");
    const cmp = pickGmnComparison([jul, sep, aug]);
    expect(cmp?.latest.id).toBe("sep");
    expect(cmp?.previous?.id).toBe("aug");
  });

  it("pula registros sobrepostos ao mais recente", () => {
    const month = row("month", "2026-09-01", "2026-09-30");
    const week = row("week", "2026-09-21", "2026-09-27"); // dentro do mês
    const aug = row("aug", "2026-08-01", "2026-08-31");
    const cmp = pickGmnComparison([week, month, aug]);
    expect(cmp?.latest.id).toBe("month");
    expect(cmp?.previous?.id).toBe("aug");
  });

  it("um único registro: sem anterior", () => {
    const only = row("only", "2026-09-01", "2026-09-30");
    expect(pickGmnComparison([only])).toEqual({ latest: only, previous: null, latestRated: null });
  });

  it("latestRated: registro mais recente que tem nota (pula os sem nota)", () => {
    const sep = row("sep", "2026-09-01", "2026-09-30", { average_rating: null });
    const aug = row("aug", "2026-08-01", "2026-08-31", { average_rating: 4.8 });
    const jul = row("jul", "2026-07-01", "2026-07-31", { average_rating: 4.7 });
    expect(pickGmnComparison([jul, sep, aug])?.latestRated?.id).toBe("aug");
    const rated = row("rated", "2026-10-01", "2026-10-31", { average_rating: 4.9 });
    expect(pickGmnComparison([sep, rated, aug])?.latestRated?.id).toBe("rated");
  });
});

describe("summarizeGmn", () => {
  it("períodos iguais: variação sobre o total; nota e avaliações em diferença absoluta", () => {
    const summary = summarizeGmn({
      latest: row("sep", "2026-09-01", "2026-09-30", {
        search_views: 1200,
        website_clicks: 90,
        direction_requests: 30,
        total_reviews: 188,
        average_rating: 4.9,
        new_reviews: 6,
      }),
      previous: row("aug", "2026-08-01", "2026-08-30", {
        search_views: 1000,
        website_clicks: 100,
        direction_requests: 30,
        total_reviews: 182,
        average_rating: 4.8,
      }),
    });
    expect(summary.normalized).toBe(false);
    expect(summary.searchViews).toEqual({ value: 1200, change: 20 });
    expect(summary.websiteClicks.change).toBeCloseTo(-10);
    expect(summary.directionRequests.change).toBe(0);
    expect(summary.rating).toEqual({ value: 4.9, diff: 0.1, fromPeriodEnd: null });
    expect(summary.totalReviews).toEqual({ value: 188, diff: 6, newReviews: 6 });
    expect(summary.previousPeriod).toEqual({ start: "2026-08-01", end: "2026-08-30" });
  });

  it("períodos de tamanhos diferentes: compara a média diária", () => {
    const summary = summarizeGmn({
      latest: row("week", "2026-09-21", "2026-09-27", { search_views: 70 }), // 10/dia
      previous: row("month", "2026-08-01", "2026-08-30", { search_views: 150 }), // 5/dia
    });
    expect(summary.normalized).toBe(true);
    expect(summary.searchViews.change).toBeCloseTo(100);
  });

  it("sem anterior: sem variações", () => {
    const summary = summarizeGmn({
      latest: row("sep", "2026-09-01", "2026-09-30", { search_views: 10, average_rating: 5, total_reviews: 3 }),
      previous: null,
    });
    expect(summary.searchViews).toEqual({ value: 10, change: null });
    expect(summary.rating.diff).toBeNull();
    expect(summary.totalReviews.diff).toBeNull();
    expect(summary.previousPeriod).toBeNull();
  });

  it("anterior zerado com valor atual → sem base; nota ausente → null", () => {
    const summary = summarizeGmn({
      latest: row("b", "2026-09-01", "2026-09-30", { website_clicks: 5, average_rating: null }),
      previous: row("a", "2026-08-01", "2026-08-30", { website_clicks: 0, average_rating: 4.9 }),
    });
    expect(summary.websiteClicks.change).toBeNull();
    expect(summary.rating).toEqual({ value: null, diff: null, fromPeriodEnd: null });
  });

  it("aceita DECIMAL como string", () => {
    const summary = summarizeGmn({
      latest: row("b", "2026-09-01", "2026-09-30", { average_rating: "4.9" as unknown as number }),
      previous: row("a", "2026-08-01", "2026-08-30", { average_rating: "4.7" as unknown as number }),
    });
    expect(summary.rating).toEqual({ value: 4.9, diff: 0.2, fromPeriodEnd: null });
  });

  it("registro mais recente sem nota: usa a última nota informada, sem variação", () => {
    const sep = row("sep", "2026-09-22", "2026-09-28", { average_rating: null, total_reviews: 190 });
    const week = row("week", "2026-09-15", "2026-09-21", { average_rating: null, total_reviews: 188 });
    const aug = row("aug", "2026-08-01", "2026-08-31", { average_rating: 4.8, total_reviews: 180 });
    const comparison = pickGmnComparison([aug, week, sep]);
    expect(comparison).not.toBeNull();
    const summary = summarizeGmn(comparison!);
    expect(summary.rating).toEqual({ value: 4.8, diff: null, fromPeriodEnd: "2026-08-31" });
    // avaliações e período continuam do registro mais recente
    expect(summary.totalReviews.value).toBe(190);
    expect(summary.periodEnd).toBe("2026-09-28");
  });

  it("nota do mais recente: sem fromPeriodEnd; variação só com as duas notas", () => {
    const sep = row("sep", "2026-09-01", "2026-09-30", { average_rating: 4.9 });
    const aug = row("aug", "2026-08-01", "2026-08-31", { average_rating: null });
    const jul = row("jul", "2026-07-01", "2026-07-31", { average_rating: 4.6 });
    const summary = summarizeGmn(pickGmnComparison([jul, aug, sep])!);
    expect(summary.rating).toEqual({ value: 4.9, diff: null, fromPeriodEnd: null });
  });

  it("nenhum registro com nota → null", () => {
    const summary = summarizeGmn(
      pickGmnComparison([row("sep", "2026-09-01", "2026-09-30"), row("aug", "2026-08-01", "2026-08-31")])!,
    );
    expect(summary.rating).toEqual({ value: null, diff: null, fromPeriodEnd: null });
  });
});
