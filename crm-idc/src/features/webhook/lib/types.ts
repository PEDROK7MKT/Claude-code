import type { Lead, LeadSource, ServiceType } from "@/types/database";

/**
 * Como a requisição foi autorizada:
 * - "secret": integração de servidor com WEBHOOK_SECRET (confiável);
 * - "public": navegador de uma origem em WEBHOOK_ALLOWED_ORIGINS, sem segredo
 *   (limitada: rate limit por IP, honeypot, nome + telefone obrigatórios).
 */
export type WebhookAuthMode = "secret" | "public";

/** Erro de validação de um campo, devolvido no JSON de resposta 400. */
export interface WebhookFieldError {
  field: string;
  message: string;
}

/** Linha que o webhook grava em `leads` (status fica "novo" — o banco garante). */
export interface WebhookLeadInsert {
  name: string;
  phone: string;
  source: LeadSource;
  campaign: string | null;
  keyword: string | null;
  ad_group: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  service: ServiceType | null;
  service_detail: string | null;
  notes: string | null;
  parent_lead_id: string | null;
}

/** Lead já existente com o mesmo telefone (regra 4). */
export type ExistingLead = Pick<Lead, "id" | "name" | "status" | "created_at" | "updated_at">;

/** Acesso ao banco injetado no handler (service role em produção, fake nos testes). */
export interface WebhookLeadRepository {
  /** Leads com exatamente este telefone normalizado, mais recentes primeiro. */
  findLeadsByPhone(phone: string): Promise<ExistingLead[]>;
  insertLead(lead: WebhookLeadInsert): Promise<{ id: string }>;
}

/** Corpo das respostas JSON do webhook. */
export type WebhookResponseBody =
  | { ok: true; id: string | null; duplicate_of: string | null; repeated?: true }
  | { ok: false; error: string; fields?: WebhookFieldError[] };
