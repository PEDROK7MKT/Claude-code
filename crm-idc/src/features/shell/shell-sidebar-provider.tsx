"use client";

import * as React from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TABLET_MEDIA_QUERY, resolveSidebarOpen, serializeSidebarCookie } from "./lib/sidebar-state";

interface ShellSidebarProviderProps {
  /** Preferência salva no cookie (lida no layout do servidor). */
  defaultOpen: boolean;
  children: React.ReactNode;
}

/**
 * SidebarProvider com o comportamento da spec §5:
 * desktop expandido (ou como o usuário deixou), tablet recolhido em ícones por padrão
 * (o usuário ainda pode expandir) e mobile com hambúrguer (Sheet do próprio provider).
 */
export function ShellSidebarProvider({ defaultOpen, children }: ShellSidebarProviderProps) {
  const isTablet = useMediaQuery(TABLET_MEDIA_QUERY);
  const [desktopOpen, setDesktopOpen] = React.useState(defaultOpen);
  const [tabletOpen, setTabletOpen] = React.useState(false);

  // Ao entrar/sair da faixa de tablet, volta ao padrão recolhido
  const [wasTablet, setWasTablet] = React.useState(isTablet);
  if (wasTablet !== isTablet) {
    setWasTablet(isTablet);
    setTabletOpen(false);
  }

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!isTablet) {
        setDesktopOpen(open);
        return;
      }
      setTabletOpen(open);
      // O SidebarProvider grava o cookie a cada mudança; no tablet ele deve continuar
      // guardando só a preferência do desktop (regravado depois da escrita do provider).
      queueMicrotask(() => {
        document.cookie = serializeSidebarCookie(desktopOpen);
      });
    },
    [isTablet, desktopOpen],
  );

  return (
    <SidebarProvider open={resolveSidebarOpen({ isTablet, desktopOpen, tabletOpen })} onOpenChange={handleOpenChange}>
      {children}
    </SidebarProvider>
  );
}
