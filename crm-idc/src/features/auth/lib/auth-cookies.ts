/**
 * Cookies de sessão do Supabase (@supabase/ssr): `sb-<ref>-auth-token`, divididos em
 * `.0`, `.1`… quando grandes, e `sb-<ref>-auth-token-code-verifier` (PKCE).
 */
const SUPABASE_AUTH_COOKIE = /^sb-.+-auth-token(?:-code-verifier)?(?:\.\d+)?$/;

export function isSupabaseAuthCookie(name: string): boolean {
  return SUPABASE_AUTH_COOKIE.test(name);
}
