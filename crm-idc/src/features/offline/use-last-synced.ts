"use client";

import * as React from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants";
import { latestUpdatedAt } from "./lib/last-sync";

/**
 * Instante da última sincronização bem-sucedida (maior `dataUpdatedAt`) das queries
 * sob `queryKey` — por padrão, todos os leads. Sobrevive ao recarregamento porque o
 * cache é restaurado do IndexedDB. `null` quando ainda não há dados salvos.
 */
export function useLastSyncedAt(queryKey: QueryKey = QUERY_KEYS.leads): number | null {
  const queryCache = useQueryClient().getQueryCache();
  // chave estável mesmo se o chamador passar um array novo a cada render
  const keyHash = JSON.stringify(queryKey);
  const stableKey = React.useMemo(() => JSON.parse(keyHash) as QueryKey, [keyHash]);

  const subscribe = React.useCallback((onChange: () => void) => queryCache.subscribe(onChange), [queryCache]);
  const getSnapshot = React.useCallback(
    () => latestUpdatedAt(queryCache.findAll({ queryKey: stableKey }).map((q) => q.state.dataUpdatedAt)),
    [queryCache, stableKey],
  );

  const latest = React.useSyncExternalStore(subscribe, getSnapshot, () => 0);
  return latest > 0 ? latest : null;
}

/** Relógio compartilhado: um único timer por intervalo, só enquanto há componentes inscritos. */
interface ClockStore {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => number;
}

const clockStores = new Map<number, ClockStore>();

function createClockStore(intervalMs: number): ClockStore {
  let now = 0;
  let timer: number | undefined;
  const listeners = new Set<() => void>();

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      // valor fresco ao inscrever: o React compara o snapshot logo após a inscrição
      now = Date.now();
      timer ??= window.setInterval(() => {
        now = Date.now();
        listeners.forEach((listener) => listener());
      }, intervalMs);
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0) {
          window.clearInterval(timer);
          timer = undefined;
        }
      };
    },
    getSnapshot() {
      if (now === 0) now = Date.now();
      return now;
    },
  };
}

function getClockStore(intervalMs: number): ClockStore {
  let store = clockStores.get(intervalMs);
  if (!store) {
    store = createClockStore(intervalMs);
    clockStores.set(intervalMs, store);
  }
  return store;
}

const getServerNow = () => 0;

/** "Agora" (ms), atualizado a cada `intervalMs` enquanto o componente estiver montado. */
export function useNow(intervalMs = 30_000): number {
  const store = getClockStore(intervalMs);
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, getServerNow);
}
