import type { Metadata } from "next";

import { LoginScreen } from "@/features/auth/components/login-screen";
import { firstSearchParam, parseLoginReason } from "@/features/auth/lib/redirect";
import { getAppSettings } from "@/features/settings/api/server";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar",
};

/** /login — e-mail + senha (sem cadastro público; contas são criadas pelo admin). */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [params, settings] = await Promise.all([searchParams, getAppSettings()]);
  return (
    <LoginScreen
      settings={settings}
      next={firstSearchParam(params.next)}
      inactive={parseLoginReason(firstSearchParam(params.reason)) === "inactive"}
      configured={isSupabaseConfigured()}
    />
  );
}
