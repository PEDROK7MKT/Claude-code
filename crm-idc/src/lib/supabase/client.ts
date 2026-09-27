"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

let browserClient: TypedSupabaseClient | undefined;

/** Cliente Supabase do navegador (singleton). Respeita RLS com a sessão do usuário. */
export function createClient(): TypedSupabaseClient {
  if (!browserClient) {
    // retry: false — o TanStack Query já faz as novas tentativas; evita ~7s extras antes do erro offline
    browserClient = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { retry: false } });
  }
  return browserClient;
}
