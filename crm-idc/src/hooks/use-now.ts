"use client";

import * as React from "react";
import { todayKey } from "@/lib/dates";

/**
 * Instante atual (ms) que avança a cada `intervalMs` — mantém "há X" e a virada
 * do dia atualizados com a tela aberta. `today` (yyyy-MM-dd, Bahia) só muda à
 * meia-noite: use-o como dependência de memos de intervalos para não recriar
 * as chaves das consultas a cada minuto.
 */
export function useNow(intervalMs = 60_000): { now: number; today: string } {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    // Ao voltar para a aba (celular bloqueado, aba em segundo plano), atualiza na hora.
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return { now, today: todayKey(now) };
}
