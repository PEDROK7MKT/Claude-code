import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isNetworkError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
}

type SessionState =
  | { status: "ok"; session: SessionContext }
  | { status: "anonymous" }
  | { status: "inactive" };

const getSessionState = cache(async (): Promise<SessionState> => {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();
  // Falha de rede/5xx do Auth não é "deslogado": deixa o error boundary oferecer "Tentar novamente"
  // (tratar como anônimo causaria loop /login ↔ /dashboard, já que o proxy valida o JWT localmente).
  if (error && (isNetworkError(error) || (typeof error.status === "number" && error.status >= 500))) throw error;
  if (error || !userData.user) return { status: "anonymous" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();
  // Erro transitório do banco não pode desativar/deslogar o usuário
  if (profileError) throw profileError;
  if (!profile || !profile.active) return { status: "inactive" };

  return { status: "ok", session: { userId: userData.user.id, email: userData.user.email ?? null, profile } };
});

/**
 * Exige login (Server Components / Actions).
 * - Sem sessão (ou sessão revogada no Auth) → /auth/signout → /login
 * - Sessão válida mas usuário desativado/sem profile → /auth/signout?reason=inactive
 * Passa sempre pela rota que apaga os cookies sb-*-auth-token: se o Auth revogou a sessão
 * (usuário excluído, senha redefinida pelo admin, timeout) mas o JWT ainda não expirou, o
 * proxy (getClaims, validação local) continuaria vendo a sessão em /login e mandaria de volta
 * ao dashboard — loop /login ↔ /dashboard até o JWT expirar. Sem cookies é só um salto a mais.
 */
export async function requireSession(): Promise<SessionContext> {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect("/auth/signout");
  if (state.status === "inactive") redirect("/auth/signout?reason=inactive");
  return state.session;
}

/** Exige perfil admin. Dentista é redirecionado para o dashboard. */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireSession();
  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}
