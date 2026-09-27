import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegister } from "@/features/offline/sw-register";
import { getAppSettings } from "@/features/settings/api/server";
import { inter } from "@/features/shell/fonts";
import { brandCssVariables } from "@/features/shell/lib/branding";

/** Nome do CRM vem de Configurações → Personalização (padrão "IDC CRM"). */
export async function generateMetadata(): Promise<Metadata> {
  const { crm_name, clinic_name } = await getAppSettings();
  return {
    title: { default: crm_name, template: `%s · ${crm_name}` },
    description: `Painel de gestão de leads, funil de agendamentos e marketing digital do ${clinic_name}.`,
    applicationName: crm_name,
    // app privado: fora dos buscadores
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    formatDetection: { telephone: false, email: false, address: false },
    appleWebApp: { capable: true, title: crm_name, statusBarStyle: "default" },
    // manifest: gerado por src/app/manifest.ts
  };
}

export const viewport: Viewport = {
  themeColor: "#0D6E6E",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getAppSettings();
  // cores da marca (validadas) sobrescrevem as variáveis do tema em globals.css
  const brandStyle = brandCssVariables(settings) as CSSProperties;

  return (
    <html lang="pt-BR" className={inter.variable} style={brandStyle}>
      <body className="bg-background text-foreground min-h-svh font-sans antialiased">
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
