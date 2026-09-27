"use client";

import * as React from "react";
import { TriangleAlertIcon } from "lucide-react";

import { DashboardLinkButton, RetryButton } from "./status-actions";
import { StatusPage } from "./status-page";

/** Conteúdo do global-error.tsx: não depende de providers (o layout raiz falhou). */
export function GlobalErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      variant="fullscreen"
      tone="danger"
      icon={TriangleAlertIcon}
      eyebrow="Erro inesperado"
      title="Não foi possível abrir o CRM"
      description="Ocorreu uma falha ao carregar o painel. Tente novamente; se continuar, avise o administrador."
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
