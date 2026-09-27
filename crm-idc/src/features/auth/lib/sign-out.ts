/**
 * Logout no navegador: encerra a sessão no servidor (POST /auth/signout) e apaga os
 * cookies da sessão aqui mesmo. Sem rede, a rota não roda (o service worker serve
 * /offline) e, sem esta limpeza, o próximo a abrir o CRM neste aparelho entraria
 * como o usuário que acabou de sair.
 */
import { expiredCookieAssignment, supabaseAuthCookieNames } from "./auth-cookies";
import { SIGN_OUT_PATH } from "./redirect";

/** Sem resposta nesse tempo, trata como offline (não deixa o botão "Saindo…" preso). */
export const SERVER_SIGN_OUT_TIMEOUT_MS = 8000;

/**
 * A rota responde 303 → /login; com `redirect: "manual"` o fetch devolve uma resposta
 * "opaqueredirect" (os Set-Cookie que apagam a sessão já foram aplicados).
 */
export function isServerSignOutResponse(response: Pick<Response, "type" | "ok">): boolean {
  return response.type === "opaqueredirect" || response.ok;
}

/**
 * Encerra a sessão no servidor (revoga o refresh token e apaga os cookies).
 * O service worker não intercepta POST. Retorna `false` offline, em erro ou por tempo esgotado.
 */
export async function requestServerSignOut(): Promise<boolean> {
  try {
    const response = await fetch(SIGN_OUT_PATH, {
      method: "POST",
      redirect: "manual",
      cache: "no-store",
      credentials: "same-origin",
      signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(SERVER_SIGN_OUT_TIMEOUT_MS) : undefined,
    });
    return isServerSignOutResponse(response);
  } catch {
    return false;
  }
}

/**
 * Apaga no próprio navegador os cookies de sessão do Supabase (o @supabase/ssr não os
 * marca como httpOnly). Inofensivo quando o servidor já os removeu.
 */
export function expireSupabaseAuthCookies(): void {
  if (typeof document === "undefined") return;
  for (const name of supabaseAuthCookieNames(document.cookie)) {
    document.cookie = expiredCookieAssignment(name);
  }
}
