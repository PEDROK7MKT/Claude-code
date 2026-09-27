"use client";

import * as React from "react";

import { clearLocalSessionData } from "../lib/local-session";
import { LOGIN_PATH, SIGN_OUT_PATH } from "../lib/redirect";
import { expireSupabaseAuthCookies, requestServerSignOut } from "../lib/sign-out";
import { broadcastSignOut, subscribeToSignOut } from "../lib/sign-out-broadcast";

/**
 * Logout ("Sair"):
 * 1. encerra a sessão no servidor (POST /auth/signout) e apaga os cookies da sessão também
 *    no navegador — offline a rota não roda, e o usuário continuaria logado. Sem cookies,
 *    um refetch que ainda aconteça nesta aba já não traz dados de pacientes;
 * 2. limpa o cache offline (memória + IndexedDB + páginas do SW) ANTES de sair da página,
 *    para que os dados não fiquem no aparelho;
 * 3. avisa as outras abas abertas (depois dos cookies: elas vão ao /login já sem sessão);
 * 4. navega (documento inteiro) para o /login — ou, se o servidor não respondeu, para
 *    /auth/signout, que conclui o logout quando a conexão voltar.
 */
export function useSignOut(): { signOut: () => Promise<void>; signingOut: boolean } {
  const [signingOut, setSigningOut] = React.useState(false);

  const signOut = React.useCallback(async () => {
    setSigningOut(true);
    const signedOut = await requestServerSignOut();
    expireSupabaseAuthCookies();
    await clearLocalSessionData();
    broadcastSignOut();
    window.location.assign(signedOut ? LOGIN_PATH : SIGN_OUT_PATH);
  }, []);

  return { signOut, signingOut };
}

/**
 * "Sair" em outra aba: apaga os dados desta aba (o cache em memória seria gravado de volta
 * no IndexedDB no próximo refetch) e volta ao login. Montado pelo SessionProvider, ou seja,
 * em toda página autenticada.
 */
export function useSignOutFromOtherTabs(): void {
  React.useEffect(() => {
    let handled = false;
    return subscribeToSignOut(() => {
      if (handled) return;
      handled = true;
      void clearLocalSessionData().finally(() => window.location.replace(LOGIN_PATH));
    });
  }, []);
}
