"use client";

import * as React from "react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { DASHBOARD_PATH } from "@/features/auth/lib/redirect";
import { useAppSettings } from "@/features/settings/api/app-settings";
import type { AppSettings } from "@/types/database";
import { BrandMark } from "./components/brand-logo";
import { NavMain } from "./components/nav-main";
import { NavUser } from "./components/nav-user";

interface AppSidebarProps {
  /** Configurações lidas no servidor (evita piscar o nome/logo padrão). */
  initialSettings?: AppSettings;
}

/**
 * Sidebar do app (spec §5): marca no topo, navegação, usuário e "Sair" no rodapé.
 * Desktop 240px, recolhível em ícones (tablet) e Sheet no celular.
 */
export function AppSidebar({ initialSettings }: AppSidebarProps) {
  const { data: settings } = useAppSettings(initialSettings);
  const { isMobile, setOpenMobile } = useSidebar();
  const crmName = settings?.crm_name ?? "IDC CRM";
  const clinicName = settings?.clinic_name ?? "Instituto Décio Carrilho";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={crmName} className="hover:bg-sidebar-accent/60">
              <Link
                href={DASHBOARD_PATH}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <BrandMark size="sm" logoUrl={settings?.logo_url} alt="" />
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className="text-foreground truncate text-sm font-semibold tracking-tight">{crmName}</span>
                  <span className="text-muted-foreground truncate text-xs">{clinicName}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
