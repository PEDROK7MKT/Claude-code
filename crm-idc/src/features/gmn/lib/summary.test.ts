import { describe, expect, it } from "vitest";
import {
  buildGmnSeries,
  buildReviewsHighlight,
  compareLatestPeriods,
  findComparablePrevious,
  ratingAxisDomain,
  ratingAxisTicks,
  reviewsAxis,
  sortByPeriodDesc,
  starFills,
  toRating,
  totalViews,
  type GmnRow,
} from "./summary";

function row(id: string, start: string, end: string, overrides: Partial<GmnRow> = {}): GmnRow {
  return {
    id,
    period_start: start,
    period_end: end,
    search_views: 0,
    maps_views: 0,
    website_clicks: 0,
    direction_requests: 0,
    phone_calls: 0,
    total_reviews: 0,
    average_rating: null,
    new_reviews: 0,
    ...overrides,
  };
}

const jul = row("jul", "2026-07-01", "2026-07-31", {
  search_views: 2000,
  maps_views: 800,
  website_clicks: 80,
  direction_requests: 50,
  phone_calls: 40,
  total_reviews: 185,
  average_rating: 4.8,
  new_reviews: 8,
});
const ago = row("ago", "2026-08-01", "2026-08-31", {
  search_views: 2200,
  maps_views: 900,
  website_clicks: 100,
  direction_requests: 45,
  phone_calls: 40,
  total_reviews: 197,
  average_rating: 4.9,
  new_reviews: 12,
});
const semana = row("sem", "2026-09-07", "2026-09-13", { total_reviews: 199, new_reviews: 2 });

describe("básicos", () => {
  it("toRating aceita número/string e rejeita vazio", () => {
    expect(toRating(4.9)).toBe(4.9);
    expect(toRating("4.9" as unknown as number)).toBe(4.9);
    expect(toRating(null)).toBeNull();
    expect(toRating("")).toBeNull();
  });

  it("visualizações totais e ordenação por período", () => {
    expect(totalViews(ago)).toBe(3100);
    expect(sortByPeriodDesc([jul, semana, ago]).map((r) => r.id)).toEqual(["sem", "ago", "jul"]);
    const sameEnd = row("x", "2026-08-25", "2026-08-31");
    expect(sortByPeriodDesc([ago, sameEnd]).map((r) => r.id)).toEqual(["x", "ago"]);
  });
});

describe("buildGmnSeries", () => {
  it("gera série cronológica com rótulo dd/MM/yyyy do fim do período", () => {
    const series = buildGmnSeries([ago, jul]);
    expect(series.map((p) => p.label)).toEqual(["31/07/2026", "31/08/2026"]);
    expect(series[1]).toMatchObject({
      id: "ago",
      searchViews: 2200,
      mapsViews: 900,
      totalViews: 3100,
      websiteClicks: 100,
      directionRequests: 45,
      phoneCalls: 40,
      totalReviews: 197,
      averageRating: 4.9,
      newReviews: 12,
    });
  });
});

describe("compareLatestPeriods", () => {
  it("compara o último mês com o mês anterior", () => {
    const c = compareLatestPeriods([jul, ago]);
    expect(c?.latest.id).toBe("ago");
    expect(c?.previous?.id).toBe("jul");
    expect(c?.kpis.totalViews).toEqual({ current: 3100, previous: 2800, change: (300 / 2800) * 100 });
    expect(c?.kpis.websiteClicks.change).toBe(25);
    expect(c?.kpis.directionRequests.change).toBe(-10);
    expect(c?.kpis.phoneCalls.change).toBe(0);
    expect(c?.kpis.newReviews.change).toBe(50);
  });

  it("não compara semana com mês: sem período equivalente → sem base", () => {
    const c = compareLatestPeriods([jul, ago, semana]);
    expect(c?.latest.id).toBe("sem");
    expect(c?.previous).toBeNull();
    expect(c?.kpis.newReviews).toEqual({ current: 2, previous: null, change: null });
  });

  it("ignora períodos que se sobrepõem ao último", () => {
    const overlapping = row("o", "2026-07-15", "2026-08-14");
    expect(findComparablePrevious([jul, ago, overlapping], ago)?.id).toBe("jul");
  });

  it("variação sem base quando o anterior é zero", () => {
    const a = row("a", "2026-07-01", "2026-07-31");
    const b = row("b", "2026-08-01", "2026-08-31", { phone_calls: 5 });
    expect(compareLatestPeriods([a, b])?.kpis.phoneCalls.change).toBeNull();
    expect(compareLatestPeriods([a, b])?.kpis.websiteClicks.change).toBe(0);
  });

  it("null sem registros", () => {
    expect(compareLatestPeriods([])).toBeNull();
  });
});

describe("buildReviewsHighlight", () => {
  it("nota, total e variações vs registro anterior", () => {
    const h = buildReviewsHighlight([jul, ago]);
    expect(h).toMatchObject({ rating: 4.9, totalReviews: 197, reviewsDelta: 12, ratingDelta: 0.1, ratingFromPeriodEnd: null });
  });

  it("usa a última nota informada quando o último registro não tem nota", () => {
    const h = buildReviewsHighlight([jul, ago, semana]);
    expect(h?.latest.id).toBe("sem");
    expect(h?.rating).toBe(4.9);
    expect(h?.ratingFromPeriodEnd).toBe("2026-08-31");
    expect(h?.reviewsDelta).toBe(2);
    expect(h?.ratingDelta).toBeNull();
  });

  it("primeiro registro não tem variação", () => {
    const h = buildReviewsHighlight([ago]);
    expect(h?.reviewsDelta).toBeNull();
    expect(h?.ratingDelta).toBeNull();
    expect(buildReviewsHighlight([])).toBeNull();
  });
});

describe("eixo da nota e estrelas", () => {
  it("domínio 4–5 por padrão e desce em passos de 0,5", () => {
    expect(ratingAxisDomain([4.8, 4.9, null])).toEqual([4, 5]);
    expect(ratingAxisDomain([])).toEqual([4, 5]);
    expect(ratingAxisDomain([3.7, 4.9])).toEqual([3.5, 5]);
    expect(ratingAxisDomain([0.2])).toEqual([0, 5]);
  });

  it("marcas do eixo", () => {
    expect(ratingAxisTicks([4, 5])).toEqual([4, 4.5, 5]);
    expect(ratingAxisTicks([3.5, 5])).toEqual([3.5, 4, 4.5, 5]);
    expect(ratingAxisTicks([0, 5])).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("eixo das avaliações com folga e marcas redondas", () => {
    expect(reviewsAxis([153, 197])).toEqual({ domain: [0, 300], ticks: [0, 100, 200, 300] });
    expect(reviewsAxis([62])).toEqual({ domain: [0, 100], ticks: [0, 25, 50, 75, 100] });
    expect(reviewsAxis([1500])).toEqual({ domain: [0, 2000], ticks: [0, 500, 1000, 1500, 2000] });
    expect(reviewsAxis([])).toEqual({ domain: [0, 4], ticks: [0, 1, 2, 3, 4] });
    expect(reviewsAxis([0, 3])).toEqual({ domain: [0, 4], ticks: [0, 1, 2, 3, 4] });
    // o topo sempre deixa a barra mais alta abaixo de ~77% da altura
    for (const max of [9, 48, 130, 313, 999, 4321]) {
      const { domain, ticks } = reviewsAxis([max]);
      expect(domain[1]).toBeGreaterThanOrEqual(max * 1.3);
      expect(ticks.at(-1)).toBe(domain[1]);
      expect(ticks.every((t) => Number.isInteger(t))).toBe(true);
    }
  });

  it("preenchimento parcial das estrelas", () => {
    expect(starFills(4.3)).toEqual([1, 1, 1, 1, 0.3]);
    expect(starFills(5)).toEqual([1, 1, 1, 1, 1]);
    expect(starFills(null)).toEqual([0, 0, 0, 0, 0]);
    expect(starFills(7)).toEqual([1, 1, 1, 1, 1]);
    expect(starFills(0.5)).toEqual([0.5, 0, 0, 0, 0]);
  });
});
