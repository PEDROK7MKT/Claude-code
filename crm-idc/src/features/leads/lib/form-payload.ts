/**
 * Formulário → mutations: cadastro (useCreateLead) e edição (useUpdateLead).
 * O status nunca é enviado (regra 1: o banco cria sempre como "novo"; depois,
 * só muda pelas ações de status).
 */
import type { Lead } from "@/types/database";

import { diffLeadChanges, type LeadChanges } from "./form-diff";
import type { LeadFormOutput } from "./form-schema";

/** Campos do insert: os do formulário + vínculo opcional com um lead existente (regra 4). */
export type CreateLeadPayload = LeadFormOutput & { parent_lead_id: string | null };

export function toCreateLeadPayload(output: LeadFormOutput, parentLeadId: string | null = null): CreateLeadPayload {
  // cópia explícita: garante que nada além dos campos do formulário (ex.: status) vá para o insert
  return {
    name: output.name,
    phone: output.phone,
    source: output.source,
    campaign: output.campaign,
    keyword: output.keyword,
    ad_group: output.ad_group,
    landing_page: output.landing_page,
    utm_source: output.utm_source,
    utm_medium: output.utm_medium,
    utm_campaign: output.utm_campaign,
    utm_term: output.utm_term,
    utm_content: output.utm_content,
    service: output.service,
    service_detail: output.service_detail,
    estimated_value: output.estimated_value,
    assigned_to: output.assigned_to,
    notes: output.notes,
    parent_lead_id: parentLeadId,
  };
}

/** Só os campos alterados em relação ao lead salvo (objeto vazio = nada a salvar). */
export function toUpdateLeadChanges(lead: Lead, output: LeadFormOutput): LeadChanges {
  return diffLeadChanges(lead, output);
}
