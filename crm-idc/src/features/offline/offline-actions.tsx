"use client";

import * as React from "react";
import { LayoutDashboardIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { START_PATH } from "./lib/cache-strategy";

/** Espera antes de recarregar sozinho quando a conexão volta (deixa o aviso aparecer). */
const AUTO_RELOAD_DELAY_MS = 1200;

/**
 * Ações da página offline. São links de verdade (documento inteiro), não next/link:
 * funcionam mesmo se o JavaScript desta página não estiver no cache, e a navegação
 * passa pelo service worker, que serve a última cópia salva.
 */
export function OfflineActions() {
  const [reloading, setReloading] = React.useState(false);

  return (
    <>
      <Button asChild variant="outline">
        <a href={START_PATH}>
          <LayoutDashboardIcon aria-hidden="true" />
          Ir para o dashboard
        </a>
      </Button>
      <Button asChild>
        {/* href="" = recarrega o endereço atual (que é a página que falhou, não /offline) */}
        <a
          href=""
          aria-busy={reloading || undefined}
          onClick={(event) => {
            event.preventDefault();
            setReloading(true);
            window.location.reload();
          }}
        >
          <RefreshCwIcon aria-hidden="true" className={reloading ? "animate-spin" : undefined} />
          {reloading ? "Tentando…" : "Tentar novamente"}
        </a>
      </Button>
    </>
  );
}

/** Aviso (região viva) e recarga automática quando o navegador volta a ficar online. */
export function OfflineAutoRetry() {
  const [reconnecting, setReconnecting] = React.useState(false);

  React.useEffect(() => {
    let timer: number | undefined;
    const onOnline = () => {
      setReconnecting(true);
      timer = window.setTimeout(() => window.location.reload(), AUTO_RELOAD_DELAY_MS);
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <p role="status" aria-live="polite" className={reconnecting ? "text-primary font-medium" : undefined}>
      {reconnecting
        ? "Conexão restabelecida — recarregando…"
        : "Quando a conexão voltar, esta página recarrega sozinha."}
    </p>
  );
}
