import * as React from "react";

import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { SessionProvider } from "@/features/auth/session-context";
import type { AppSettings, Profile } from "@/types/database";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { ShellSidebarProvider } from "./shell-sidebar-provider";

interface AppShellProps {
  profile: Profile;
  email: string | null;
  settings: AppSettings;
  /** Preferência da sidebar no desktop (cookie). */
  sidebarOpen: boolean;
  children: React.ReactNode;
}

export const MAIN_CONTENT_ID = "conteudo";

/**
 * Shell autenticado (spec §5): sessão, Realtime, sidebar fixa à esquerda e
 * conteúdo fluido à direita com header fixo. Montado por src/app/(app)/layout.tsx.
 */
export function AppShell({ profile, email, settings, sidebarOpen, children }: AppShellProps) {
  return (
    <SessionProvider profile={profile} email={email}>
      <RealtimeProvider>
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="bg-primary text-primary-foreground focus-visible:ring-ring/50 sr-only z-50 rounded-md px-3 py-2 text-sm font-medium shadow-md outline-none focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus-visible:ring-[3px]"
        >
          Pular para o conteúdo
        </a>
        <ShellSidebarProvider defaultOpen={sidebarOpen}>
          <AppSidebar initialSettings={settings} />
          <SidebarInset>
            <AppHeader />
            <div
              id={MAIN_CONTENT_ID}
              tabIndex={-1}
              className="mx-auto w-full max-w-[1400px] min-w-0 flex-1 px-4 py-6 outline-none md:px-6 md:py-8"
            >
              {children}
            </div>
          </SidebarInset>
        </ShellSidebarProvider>
      </RealtimeProvider>
    </SessionProvider>
  );
}
