import { describe, expect, it } from "vitest";
import { sanitizeGmnMetric } from "./gmn-metrics-utils";

describe("sanitizeGmnMetric", () => {
  it("normaliza período, contadores e nota", () => {
    expect(
      sanitizeGmnMetric({
        period_start: "01/03/2026",
        period_end: "2026-03-31",
        search_views: 1520.6,
        maps_views: 830,
        website_clicks: null,
        direction_requests: 41,
        phone_calls: 12,
        total_reviews: 98,
        average_rating: 4.87,
        new_reviews: 3,
        notes: "  mês bom ",
      }),
    ).toEqual({
      period_start: "2026-03-01",
      period_end: "2026-03-31",
      search_views: 1521,
      maps_views: 830,
      website_clicks: 0,
      direction_requests: 41,
      phone_calls: 12,
      total_reviews: 98,
      average_rating: 4.9,
      new_reviews: 3,
      notes: "mês bom",
    });
  });

  it("nota ausente fica nula e notas vazias viram null", () => {
    const r = sanitizeGmnMetric({ period_start: "2026-03-01", period_end: "2026-03-01", notes: "   " });
    expect(r.average_rating).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("valida período, negativos e nota", () => {
    expect(() => sanitizeGmnMetric({ period_start: "2026-03-10", period_end: "2026-03-01" })).toThrow(/fim do período/);
    expect(() => sanitizeGmnMetric({ period_start: "x", period_end: "2026-03-01" })).toThrow(/início/);
    expect(() => sanitizeGmnMetric({ period_start: "2026-03-01", period_end: "2026-02-30" })).toThrow(/fim válida/);
    expect(() => sanitizeGmnMetric({ period_start: "2026-03-01", period_end: "2026-03-02", phone_calls: -1 })).toThrow(/Ligações/);
    expect(() => sanitizeGmnMetric({ period_start: "2026-03-01", period_end: "2026-03-02", average_rating: 5.1 })).toThrow(/entre 0 e 5/);
  });
});
