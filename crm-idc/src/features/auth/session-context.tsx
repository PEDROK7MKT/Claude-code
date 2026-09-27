"use client";

import * as React from "react";
import type { Profile, UserRole } from "@/types/database";
import { useSignOutFromOtherTabs } from "./hooks/use-sign-out";

export interface SessionValue {
  profile: Profile;
  email: string | null;
  userId: string;
  role: UserRole;
  /** Gestor de tráfego ativo: vê e edita tudo */
  isAdmin: boolean;
}

const SessionContext = React.createContext<SessionValue | null>(null);

interface SessionProviderProps {
  profile: Profile;
  email: string | null;
  children: React.ReactNode;
}

/**
 * Sessão do usuário logado para componentes cliente. Montado no layout autenticado
 * (`src/app/(app)/layout.tsx`) com os dados de `requireSession()`. Também encerra esta
 * aba quando o usuário clica em "Sair" em outra aba (apaga o cache e volta ao login).
 */
export function SessionProvider({ profile, email, children }: SessionProviderProps) {
  useSignOutFromOtherTabs();
  const value = React.useMemo<SessionValue>(
    () => ({
      profile,
      email,
      userId: profile.id,
      role: profile.role,
      isAdmin: profile.role === "admin" && profile.active,
    }),
    [profile, email],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}

/** Usuário logado: `{ profile, email, isAdmin, role, userId }`. */
export function useSession(): SessionValue {
  const session = React.useContext(SessionContext);
  if (!session) {
    throw new Error(
      "useSession() precisa estar dentro de <SessionProvider>. Use-o apenas em componentes renderizados " +
        "pelo layout autenticado (src/app/(app)/layout.tsx), que recebe o profile de requireSession().",
    );
  }
  return session;
}
