import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
}

/**
 * Usuário logado + profile (deduplicado por requisição).
 * Retorna null se não houver sessão, profile, ou se o usuário estiver desativado.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const state = await getSessionState();
  return state.status === "ok" ? state.session : null;
});

type SessionState =
  | { status: "ok"; session: SessionContext }
  | { status: "anonymous" }
  | { status: "inactive" };

const getSessionState = cache(async (): Promise<SessionState> => {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return { status: "anonymous" };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
  if (!profile || !profile.active) return { status: "inactive" };

  return { status: "ok", session: { userId: userData.user.id, email: userData.user.email ?? null, profile } };
});

/**
 * Exige login (Server Components / Actions).
 * - Sem sessão → /login
 * - Sessão válida mas usuário desativado/sem profile → /auth/signout?reason=inactive
 *   (encerra a sessão antes de voltar ao login, evitando loop login ↔ dashboard)
 */
export async function requireSession(): Promise<SessionContext> {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect("/login");
  if (state.status === "inactive") redirect("/auth/signout?reason=inactive");
  return state.session;
}

/** Exige perfil admin. Dentista é redirecionado para o dashboard. */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireSession();
  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}
