"use client";

import * as React from "react";

/**
 * Observa uma media query CSS. No servidor (e na hidratação) retorna
 * `serverFallback`, evitando divergência de markup.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}
