import "server-only";

import { createSupabaseLeadRepository } from "@/features/webhook/api/lead-repository";
import { readWebhookConfig } from "@/features/webhook/lib/config";
import { PUBLIC_RATE_LIMIT } from "@/features/webhook/lib/constants";
import { createLeadWebhookHandler } from "@/features/webhook/lib/handler";
import { createRateLimiter } from "@/features/webhook/lib/rate-limit";
import type { WebhookLeadRepository } from "@/features/webhook/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

// Estado por instância do servidor: contador do rate limit e cliente service role
const publicRateLimiter = createRateLimiter(PUBLIC_RATE_LIMIT);
let repository: WebhookLeadRepository | null = null;

/** Handler do webhook ligado às dependências reais (env, Supabase service role, console). */
export const leadWebhook = createLeadWebhookHandler({
  getConfig: () => readWebhookConfig(process.env),
  getRepository: () => {
    repository ??= createSupabaseLeadRepository(createAdminClient());
    return repository;
  },
  rateLimiter: publicRateLimiter,
});
