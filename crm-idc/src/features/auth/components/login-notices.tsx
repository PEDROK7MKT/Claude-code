import * as React from "react";
import { SettingsIcon, UserXIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { INACTIVE_ACCOUNT_MESSAGE } from "../lib/login";

/** Aviso para usuário desativado (?reason=inactive ou profile inativo no login). */
export function InactiveAccountNotice() {
  return (
    <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
      <UserXIcon aria-hidden="true" className="text-amber-600" />
      <AlertTitle>Acesso desativado</AlertTitle>
      <AlertDescription className="text-amber-900/80">{INACTIVE_ACCOUNT_MESSAGE}</AlertDescription>
    </Alert>
  );
}

/** Substitui o formulário quando as variáveis do Supabase não foram configuradas. */
export function SupabaseConfigNotice() {
  return (
    <Alert className="border-primary/25 bg-primary/5">
      <SettingsIcon aria-hidden="true" className="text-primary" />
      <AlertTitle>Configuração pendente</AlertTitle>
      <AlertDescription>
        <p>
          O login ainda não está disponível: defina as variáveis{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.8em]">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.8em]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          (arquivo <code className="font-mono text-[0.8em]">.env.local</code> ou painel da Vercel) e reinicie o
          servidor.
        </p>
        <p>O passo a passo está em supabase/README.md.</p>
      </AlertDescription>
    </Alert>
  );
}
