import "server-only";

import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/types/database";
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from "./defaults";

/**
 * Configurações do CRM no servidor (layout, login, metadata) — deduplicado por requisição.
 * app_settings é legível até por visitantes (RLS). Nunca lança: sem Supabase
 * configurado ou em caso de erro, devolve os padrões (COMPETITORS, DEFAULT_WHATSAPP_MESSAGE...).
 */
export const getAppSettings = cache(async (): Promise<AppSettings> => {
  if (!isSupabaseConfigured()) return normalizeAppSettings(null);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return normalizeAppSettings(null);
    return normalizeAppSettings(data);
  } catch (err) {
    // erros internos do Next (cookies() em rota estática, redirect...) precisam subir
    unstable_rethrow(err);
    return { ...DEFAULT_APP_SETTINGS };
  }
});
