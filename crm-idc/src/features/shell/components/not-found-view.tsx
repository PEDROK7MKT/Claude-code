import * as React from "react";
import { FileQuestionIcon, MapPinOffIcon } from "lucide-react";

import type { AppSettings } from "@/types/database";
import { DashboardLinkButton, GoBackButton } from "./status-actions";
import { StatusPage } from "./status-page";

interface NotFoundViewProps {
  variant: "fullscreen" | "inline";
  /** Marca (logo/nome) para a versão de página inteira. */
  settings?: Pick<AppSettings, "logo_url" | "clinic_name" | "crm_name">;
}

/** 404 em pt-BR: endereço inexistente (página inteira) ou registro não encontrado (dentro do app). */
export function NotFoundView({ variant, settings }: NotFoundViewProps) {
  const fullscreen = variant === "fullscreen";
  return (
    <StatusPage
      variant={variant}
      icon={fullscreen ? MapPinOffIcon : FileQuestionIcon}
      eyebrow="Erro 404"
      title={fullscreen ? "Página não encontrada" : "Não encontramos o que você procura"}
      description={
        fullscreen
          ? "O endereço acessado não existe ou foi movido. Confira o link ou volte ao painel."
          : "O registro ou a página pode ter sido removido, ou o link está incorreto."
      }
      actions={
        <>
          <GoBackButton />
          <DashboardLinkButton />
        </>
      }
      logoUrl={settings?.logo_url}
      clinicName={settings?.clinic_name}
      crmName={settings?.crm_name}
    />
  );
}
