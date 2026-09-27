import { AuthShell } from "@/features/auth/components/auth-shell";
import { getAppSettings } from "@/features/settings/api/server";

/** Telas públicas de autenticação: fundo da marca, card centralizado e rodapé discreto. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const settings = await getAppSettings();
  return <AuthShell clinicName={settings.clinic_name}>{children}</AuthShell>;
}
