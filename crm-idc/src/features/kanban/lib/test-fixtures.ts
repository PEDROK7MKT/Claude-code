/** Lead de exemplo para os testes do kanban (não usado pela aplicação). */
import type { Lead } from "@/types/database";

export function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
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
    created_at: "2026-03-10T15:00:00Z",
    updated_at: "2026-03-10T15:00:00Z",
    ...overrides,
  };
}
