/**
 * Fábricas de dados para os testes do relatório (não usar no app).
 */
import type { DailyMetric, GmnMetric, Lead } from "@/types/database";

let sequence = 0;

export function makeLead(overrides: Partial<Lead> = {}): Lead {
  sequence += 1;
  const createdAt = overrides.created_at ?? "2026-03-10T15:00:00.000Z";
  return {
    id: `lead-${String(sequence).padStart(4, "0")}`,
    name: "Maria Silva",
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
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  };
}

export function makeMetric(overrides: Partial<DailyMetric> = {}): DailyMetric {
  sequence += 1;
  return {
    id: `metric-${sequence}`,
    date: "2026-03-10",
    campaign: "IDC | Urgência e Canal",
    impressions: 1000,
    clicks: 40,
    cost: 100,
    conversions: 2,
    leads_total: 0,
    leads_agendados: 0,
    created_by: null,
    created_at: "2026-03-11T12:00:00.000Z",
    updated_at: "2026-03-11T12:00:00.000Z",
    ...overrides,
  };
}

export function makeGmn(overrides: Partial<GmnMetric> = {}): GmnMetric {
  sequence += 1;
  return {
    id: `gmn-${sequence}`,
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    search_views: 500,
    maps_views: 300,
    website_clicks: 40,
    direction_requests: 25,
    phone_calls: 18,
    total_reviews: 188,
    average_rating: 4.9,
    new_reviews: 5,
    notes: null,
    created_by: null,
    created_at: "2026-04-01T12:00:00.000Z",
    updated_at: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

/** n leads criados às 12:00 (Bahia) em dias consecutivos a partir de `firstDay` (yyyy-MM-dd). */
export function leadsOnDays(count: number, firstDay: string, overrides: Partial<Lead> = {}): Lead[] {
  const [y, m, d] = firstDay.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    makeLead({ created_at: new Date(Date.UTC(y, m - 1, d + i, 15, 0, 0)).toISOString(), ...overrides }),
  );
}
