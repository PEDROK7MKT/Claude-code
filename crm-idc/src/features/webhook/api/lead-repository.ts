import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WebhookLeadInsert, WebhookLeadRepository } from "@/features/webhook/lib/types";
import type { Database } from "@/types/database";

/**
 * Repositório do webhook sobre o cliente SERVICE ROLE (ignora RLS — só é usado
 * depois da autenticação do webhook). As regras de negócio continuam valendo:
 * os triggers forçam status "novo", registram o histórico e atualizam os
 * contadores de daily_metrics.
 */
export function createSupabaseLeadRepository(client: SupabaseClient<Database>): WebhookLeadRepository {
  return {
    async findLeadsByPhone(phone) {
      const { data, error } = await client
        .from("leads")
        .select("id, name, status, created_at, updated_at")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },

    async insertLead(lead: WebhookLeadInsert) {
      const { data, error } = await client.from("leads").insert(lead).select("id").single();
      if (error) throw error;
      return { id: data.id };
    },
  };
}
