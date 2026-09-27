import type { Metadata } from "next";

import { getAppSettings } from "@/features/settings/api/server";
import { SettingsView } from "@/features/settings/components/settings-view";
import { SETTINGS_TAB_PARAM, parseSettingsTab } from "@/features/settings/lib/tabs";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Configurações",
};

/**
 * /configuracoes — só admin (dentista é redirecionado ao dashboard). Abas com link
 * direto: ?aba=usuarios|concorrentes|personalizacao (spec §4.8 e §11 "Primeiro acesso").
 */
export default async function ConfiguracoesPage({ searchParams }: PageProps<"/configuracoes">) {
  const [, settings, params] = await Promise.all([requireAdmin(), getAppSettings(), searchParams]);
  return <SettingsView initialTab={parseSettingsTab(params[SETTINGS_TAB_PARAM])} initialSettings={settings} />;
}
