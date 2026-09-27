"use client";

import * as React from "react";

import { clearPersistedCache } from "@/components/providers/query-provider";
import { clearOfflinePageCaches } from "@/features/offline/clear-offline-caches";
import { SIGN_OUT_PATH } from "../lib/redirect";

/**
 * Logout: limpa o cache offline (memória + IndexedDB) ANTES de sair, para que os
 * dados não fiquem no aparelho, e navega (documento inteiro) para /auth/signout,
 * que encerra a sessão no servidor e volta ao /login.
 */
export function useSignOut(): { signOut: () => Promise<void>; signingOut: boolean } {
  const [signingOut, setSigningOut] = React.useState(false);

  const signOut = React.useCallback(async () => {
    setSigningOut(true);
    try {
      await clearPersistedCache();
    } catch {
      // sai mesmo se o IndexedDB falhar
    }
    try {
      // páginas salvas pelo service worker (inclui abas que o SW ainda não controla)
      await clearOfflinePageCaches();
    } catch {
      // idem
    }
    window.location.assign(SIGN_OUT_PATH);
  }, []);

  return { signOut, signingOut };
}
