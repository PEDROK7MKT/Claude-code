/**
 * Web App Manifest do IDC CRM (instalação no Android/iOS/desktop).
 * Servido por src/app/manifest.ts em /manifest.webmanifest.
 */
import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/constants";
import { PNG_ICON_SIZES, pngIconUrl } from "./brand-icon";
import { START_PATH } from "./cache-strategy";

export const APP_NAME = "IDC CRM — Instituto Décio Carrilho";
export const APP_SHORT_NAME = "IDC CRM";

type ManifestIcon = NonNullable<MetadataRoute.Manifest["icons"]>[number];

function pngIcons(purpose: "any" | "maskable"): ManifestIcon[] {
  return PNG_ICON_SIZES.filter(({ size }) => size >= 192).map(({ id, size }) => ({
    src: pngIconUrl(id),
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose,
  }));
}

const SHORTCUT_ICON: ManifestIcon[] = [{ src: pngIconUrl("192.png"), sizes: "192x192", type: "image/png" }];

export function buildWebManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: "Gestão de leads, funil de agendamentos e marketing digital do Instituto Décio Carrilho.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: START_PATH,
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    theme_color: BRAND.primary,
    background_color: BRAND.secondary,
    categories: ["business", "medical", "productivity"],
    prefer_related_applications: false,
    // abrir o app de novo reaproveita a janela já aberta
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, ...pngIcons("any"), ...pngIcons("maskable")],
    shortcuts: [
      {
        name: "Novo lead",
        short_name: "Novo lead",
        description: "Cadastrar um lead manualmente",
        url: "/leads/novo",
        icons: SHORTCUT_ICON,
      },
      { name: "Kanban", short_name: "Kanban", description: "Funil de leads por status", url: "/kanban", icons: SHORTCUT_ICON },
      { name: "Leads", short_name: "Leads", description: "Lista de leads", url: "/leads", icons: SHORTCUT_ICON },
    ],
  };
}
