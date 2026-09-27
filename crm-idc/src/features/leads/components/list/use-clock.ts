"use client";

import * as React from "react";

/**
 * Instante atual (ms) que avança a cada `intervalMs` e ao voltar para a aba —
 * mantém "há 5 min", "Hoje" e agendamentos atrasados corretos com a lista aberta.
 */
export function useClock(intervalMs = 60_000): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}
