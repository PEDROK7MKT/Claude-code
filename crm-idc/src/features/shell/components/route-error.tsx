"use client";

import * as React from "react";
import { TriangleAlertIcon, WifiOffIcon } from "lucide-react";

import { useOnlineStatus } from "@/components/providers/app-providers";
import { DashboardLinkButton, RetryButton } from "./status-actions";
import { StatusPage } from "./status-page";

export interface RouteErrorProps {
  error: Error & { digest?: string };
  /** `retry` do error boundary do Next (recarrega os dados da rota e re-renderiza). */
  retry: () => void;
  variant?: "fullscreen" | "inline";
}

/** Conteúdo dos arquivos error.tsx: mensagem pt-BR, "Tentar novamente" e "Voltar ao dashboard". */
export function RouteError({ error, retry, variant = "inline" }: RouteErrorProps) {
  const online = useOnlineStatus();

  React.useEffect(() => {
    // registra no console do navegador (em produção a mensagem do servidor vem genérica, com digest)
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      variant={variant}
      tone={online ? "danger" : "neutral"}
      icon={online ? TriangleAlertIcon : WifiOffIcon}
      eyebrow={online ? "Erro inesperado" : "Sem conexão"}
      title={online ? "Algo deu errado ao carregar esta página" : "Você está offline"}
      description={
        online
          ? "Tente novamente em instantes. Se o problema continuar, avise o administrador do CRM."
          : "Verifique sua conexão com a internet. Assim que ela voltar, tente novamente."
      }
      actions={
        <>
          <DashboardLinkButton variant="outline" />
          <RetryButton onRetry={retry} />
        </>
      }
      details={
        error.digest ? (
          <>
            Código do erro: <code className="font-mono tabular-nums">{error.digest}</code>
          </>
        ) : null
      }
    />
  );
}
