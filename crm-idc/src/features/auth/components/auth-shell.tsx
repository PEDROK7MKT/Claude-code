import * as React from "react";

import { BrandBackdrop } from "@/features/shell/components/brand-backdrop";

interface AuthShellProps {
  children: React.ReactNode;
  /** Nome da clínica no rodapé (spec §12: "Instituto Décio Carrilho — Painel de Gestão"). */
  clinicName?: string;
}

/** Moldura das telas de autenticação: fundo clean com a marca e conteúdo centralizado. */
export function AuthShell({ children, clinicName = "Instituto Décio Carrilho" }: AuthShellProps) {
  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center px-4 py-10 sm:py-16">
      <BrandBackdrop />
      <main className="flex w-full max-w-sm flex-col items-center">{children}</main>
      <footer className="text-muted-foreground mt-8 text-center text-xs text-balance">
        {`${clinicName} — Painel de Gestão`}
      </footer>
    </div>
  );
}

/** Card branco do login: sombra sutil e filete teal → dourado no topo. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card text-card-foreground ring-border/70 w-full overflow-hidden rounded-2xl shadow-[0_18px_50px_-24px_rgb(13_110_110/0.4)] ring-1">
      <div aria-hidden="true" className="via-primary to-gold from-primary h-1 bg-linear-to-r" />
      <div className="flex flex-col gap-6 px-6 py-8 sm:px-8">{children}</div>
    </div>
  );
}
