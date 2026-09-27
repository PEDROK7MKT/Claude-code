"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";

/** Falha inesperada ao renderizar o dashboard (as consultas têm tratamento próprio em cada card). */
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <ErrorState
        title="Não foi possível exibir o dashboard"
        message="Ocorreu um erro inesperado. Tente novamente; se continuar, recarregue a página."
        onRetry={retry}
      />
    </Card>
  );
}
