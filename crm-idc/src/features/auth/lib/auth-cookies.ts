/**
 * Cookies de sessão do Supabase (@supabase/ssr): `sb-<ref>-auth-token`, divididos em
 * `.0`, `.1`… quando grandes, e `sb-<ref>-auth-token-code-verifier` (PKCE).
 */
const SUPABASE_AUTH_COOKIE = /^sb-.+-auth-token(?:-code-verifier)?(?:\.\d+)?$/;

export function isSupabaseAuthCookie(name: string): boolean {
  return SUPABASE_AUTH_COOKIE.test(name);
}

/** Nomes dos cookies de sessão do Supabase numa string no formato de `document.cookie`. */
export function supabaseAuthCookieNames(cookieString: string): string[] {
  const names = new Set<string>();
  for (const part of cookieString.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && isSupabaseAuthCookie(name)) names.add(name);
  }
  return [...names];
}

/**
 * Valor para `document.cookie` que apaga o cookie. Os do @supabase/ssr são host-only e
 * com `path=/` (padrão da lib, sem `domain`): o mesmo escopo precisa ser repetido aqui.
 */
export function expiredCookieAssignment(name: string): string {
  return `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}
