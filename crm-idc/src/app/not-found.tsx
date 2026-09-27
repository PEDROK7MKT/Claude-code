import type { Metadata } from "next";

import { NotFoundView } from "@/features/shell/components/not-found-view";
import { getAppSettings } from "@/features/settings/api/server";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

/** 404 global (URLs sem rota): página inteira com a marca, fora do shell. */
export default async function NotFound() {
  const settings = await getAppSettings();
  return <NotFoundView variant="fullscreen" settings={settings} />;
}
