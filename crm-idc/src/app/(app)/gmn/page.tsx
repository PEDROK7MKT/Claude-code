import type { Metadata } from "next";

import { GmnView } from "@/features/gmn/components/gmn-view";
import { getAppSettings } from "@/features/settings/api/server";

export const metadata: Metadata = {
  title: "Google Meu Negócio",
};

/** /gmn — métricas do Google Meu Negócio (admin registra; dentista visualiza). */
export default async function GmnPage() {
  // concorrentes vindos do servidor: o comparativo já abre com os dados salvos em Configurações
  const settings = await getAppSettings();
  return <GmnView initialSettings={settings} />;
}
