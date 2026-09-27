import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar-constants";
import { LOGIN_PATH } from "@/features/auth/lib/redirect";
import { getAppSettings } from "@/features/settings/api/server";
import { AppShell } from "@/features/shell/app-shell";
import { parseSidebarCookie } from "@/features/shell/lib/sidebar-state";
import { requireSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

/** Layout autenticado: exige sessão ativa e monta sidebar + header + providers de sessão/Realtime. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  // sem Supabase configurado, o /login explica o que falta
  if (!isSupabaseConfigured()) redirect(LOGIN_PATH);

  // requireSession() redireciona sem sessão (/login) ou com usuário desativado (/auth/signout?reason=inactive)
  const [session, cookieStore, settings] = await Promise.all([requireSession(), cookies(), getAppSettings()]);

  return (
    <AppShell
      profile={session.profile}
      email={session.email}
      settings={settings}
      sidebarOpen={parseSidebarCookie(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value)}
    >
      {children}
    </AppShell>
  );
}
