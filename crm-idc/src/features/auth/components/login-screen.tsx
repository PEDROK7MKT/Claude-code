import * as React from "react";

import { BrandLogo } from "@/features/shell/components/brand-logo";
import type { AppSettings } from "@/types/database";
import { AuthCard } from "./auth-shell";
import { LoginForm } from "./login-form";
import { SupabaseConfigNotice } from "./login-notices";

interface LoginScreenProps {
  settings: Pick<AppSettings, "logo_url" | "clinic_name" | "crm_name">;
  next: string | null;
  inactive: boolean;
  /** `false` quando faltam as variáveis NEXT_PUBLIC_SUPABASE_* */
  configured: boolean;
}

/** Tela de login (spec §12): card branco centralizado com o logo do IDC no topo. */
export function LoginScreen({ settings, next, inactive, configured }: LoginScreenProps) {
  return (
    <AuthCard>
      <BrandLogo logoUrl={settings.logo_url} clinicName={settings.clinic_name} crmName={settings.crm_name} />
      <div className="space-y-1 text-center">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">Acesse o painel</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Entre com o e-mail e a senha fornecidos pelo administrador.
        </p>
      </div>
      {configured ? <LoginForm next={next} inactive={inactive} /> : <SupabaseConfigNotice />}
    </AuthCard>
  );
}
