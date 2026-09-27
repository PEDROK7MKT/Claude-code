import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/features/auth/lib/redirect";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/** Rotas acessíveis sem login. */
const PUBLIC_PATHS = ["/login", "/auth", "/api/webhook", "/offline"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Renova a sessão do Supabase a cada requisição e protege as rotas do app.
 * - Sem sessão em rota privada → /login?next=...
 * - Com sessão em /login → /dashboard
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims(): a sessão precisa ser renovada aqui.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (isAuthenticated && pathname === "/login") {
    // Já logado: respeita um ?next= seguro (caminho relativo interno), senão vai ao dashboard
    const next = getSafeNextPath(request.nextUrl.searchParams.get("next")) ?? "/dashboard";
    // Só pathname/search/hash do destino: a origem é sempre a da requisição (nunca `//host`)
    const url = request.nextUrl.clone();
    const target = new URL(next, "http://idc.invalid");
    url.pathname = target.pathname;
    url.search = target.search;
    url.hash = target.hash;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
