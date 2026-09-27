import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseAuthCookie } from "@/features/auth/lib/auth-cookies";
import { buildSignOutRedirectPath } from "@/features/auth/lib/redirect";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Encerra a sessão e volta ao login (303). Usado pelo botão "Sair" (POST via fetch; se não
 * houve resposta, navegação até aqui ao voltar a conexão) e por requireSession() para
 * usuários desativados (?reason=inactive).
 * Funciona mesmo sem sessão ou sem conexão com o Supabase.
 */
async function signOutAndRedirect(request: NextRequest): Promise<NextResponse> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      // "local": encerra só este dispositivo (o dentista pode seguir logado no computador da clínica)
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Supabase indisponível: os cookies são removidos abaixo mesmo assim
    }
  }

  // Garante a remoção dos cookies de sessão mesmo se o signOut falhou (evita loop login ↔ dashboard)
  const cookieStore = await cookies();
  for (const { name } of request.cookies.getAll()) {
    if (isSupabaseAuthCookie(name)) cookieStore.delete(name);
  }

  const destination = new URL(buildSignOutRedirectPath(request.nextUrl.searchParams.get("reason")), request.url);
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}
