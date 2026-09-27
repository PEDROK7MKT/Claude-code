"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { LockIcon, PaletteIcon, TrophyIcon, UsersIcon, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/features/auth/session-context";
import type { AppSettings } from "@/types/database";
import {
  SETTINGS_TABS,
  SETTINGS_TAB_PARAM,
  buildSettingsTabSearch,
  isSettingsTab,
  parseSettingsTab,
  type SettingsTab,
} from "../lib/tabs";
import { BrandingForm } from "./branding/branding-form";
import { CompetitorsEditor } from "./competitors/competitors-editor";
import { UsersPanel } from "./users/users-panel";

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  usuarios: UsersIcon,
  concorrentes: TrophyIcon,
  personalizacao: PaletteIcon,
};

export interface SettingsViewProps {
  /** Aba lida de ?aba= no servidor (usada enquanto a URL não muda no cliente) */
  initialTab: SettingsTab;
  /** Configurações do servidor (getAppSettings) — formulários abrem sem piscar */
  initialSettings: AppSettings;
}

/** /configuracoes (só admin — spec §4.8): Usuários, Concorrentes e Personalização. */
export function SettingsView({ initialTab, initialSettings }: SettingsViewProps) {
  const { isAdmin } = useSession();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get(SETTINGS_TAB_PARAM);
  const tab = rawTab === null ? initialTab : parseSettingsTab(rawTab);
  const [dirtyTabs, setDirtyTabs] = React.useState<Partial<Record<SettingsTab, boolean>>>({});

  const markDirty = React.useCallback((key: SettingsTab, dirty: boolean) => {
    setDirtyTabs((prev) => (Boolean(prev[key]) === dirty ? prev : { ...prev, [key]: dirty }));
  }, []);
  const onCompetitorsDirty = React.useCallback((dirty: boolean) => markDirty("concorrentes", dirty), [markDirty]);
  const onBrandingDirty = React.useCallback((dirty: boolean) => markDirty("personalizacao", dirty), [markDirty]);

  const changeTab = (value: string) => {
    if (!isSettingsTab(value)) return;
    // History API nativa: integra com useSearchParams sem nova requisição ao servidor
    window.history.replaceState(null, "", buildSettingsTabSearch(searchParams.toString(), value));
  };

  if (!isAdmin) {
    // o servidor já redireciona (requireAdmin); cobre sessão alterada no meio do uso
    return (
      <EmptyState
        icon={LockIcon}
        title="Acesso restrito"
        description="Somente o gestor de tráfego (admin) pode acessar as configurações."
        action={{ label: "Voltar ao dashboard", href: "/dashboard" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Usuários com acesso ao CRM, concorrentes do comparativo do Google e identidade visual."
      />

      <Tabs value={tab} onValueChange={changeTab} className="gap-6">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-flex sm:h-9 sm:w-fit" aria-label="Seções de configurações">
          {SETTINGS_TABS.map(({ value, label }) => {
            const Icon = TAB_ICONS[value];
            const dirty = Boolean(dirtyTabs[value]);
            return (
              <TabsTrigger key={value} value={value} className="relative min-w-0 px-2 py-1.5 sm:px-4">
                <Icon aria-hidden="true" className="hidden sm:block" />
                <span className="truncate">{label}</span>
                {dirty ? (
                  <>
                    <span aria-hidden="true" className="bg-gold ring-card absolute top-1 right-1 size-2 rounded-full ring-2" />
                    <span className="sr-only"> (alterações não salvas)</span>
                  </>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* forceMount: trocar de aba não perde edições ainda não salvas */}
        <TabsContent value="usuarios" forceMount className="data-[state=inactive]:hidden">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="concorrentes" forceMount className="data-[state=inactive]:hidden">
          <CompetitorsEditor initialSettings={initialSettings} onDirtyChange={onCompetitorsDirty} />
        </TabsContent>
        <TabsContent value="personalizacao" forceMount className="data-[state=inactive]:hidden">
          <BrandingForm initialSettings={initialSettings} onDirtyChange={onBrandingDirty} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
