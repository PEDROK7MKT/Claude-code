"use client";

import * as React from "react";
import { QueryClient, isServer, type Query } from "@tanstack/react-query";
import { PersistQueryClientProvider, type PersistQueryClientProviderProps } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { clear as idbClear, createStore, del as idbDel, get as idbGet, set as idbSet, type UseStore } from "idb-keyval";
import { isRetryableError } from "@/lib/errors";

/** Chave do cache persistido no IndexedDB. */
export const PERSISTED_CACHE_KEY = "idc-crm-cache";
/** Mude quando o formato dos dados em cache mudar: descarta caches antigos. */
export const PERSISTED_CACHE_BUSTER = "idc-crm-v1";
/** Cache offline vale por 7 dias. */
export const PERSISTED_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const STALE_TIME = 30 * 1000;
const GC_TIME = 24 * 60 * 60 * 1000;
const MAX_RETRIES = 2;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        // Tenta a rede mesmo "offline" (navigator.onLine mente) e usa o cache persistido
        networkMode: "offlineFirst",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        // Sem fila offline: a mutation falha na hora e o toast avisa "Sem conexão com o servidor"
        networkMode: "offlineFirst",
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * QueryClient do app. No navegador é um singleton (sobrevive a re-renderizações
 * e é o mesmo usado por clearPersistedCache); no servidor, um novo por requisição.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

// -----------------------------------------------------------------------------
// Persistência no IndexedDB (idb-keyval) — nunca acessada no servidor
// -----------------------------------------------------------------------------

type AsyncStorage = NonNullable<Parameters<typeof createAsyncStoragePersister>[0]["storage"]>;

let idbStore: UseStore | undefined;

/** Banco próprio ("idc-crm" / "query-cache"), criado só no primeiro uso (createStore abre o IndexedDB). */
function getIdbStore(): UseStore {
  idbStore ??= createStore("idc-crm", "query-cache");
  return idbStore;
}

function hasIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

/** Storage tolerante a falhas: sem IndexedDB (modo privado antigo, cota cheia) o app segue sem cache offline. */
const idbStorage: AsyncStorage = {
  getItem: async (key) => {
    try {
      return (await idbGet<string>(key, getIdbStore())) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await idbSet(key, value, getIdbStore());
    } catch {
      // cota excedida / IndexedDB indisponível: ignora
    }
  },
  removeItem: async (key) => {
    try {
      await idbDel(key, getIdbStore());
    } catch {
      // ignora
    }
  },
};

const persister = createAsyncStoragePersister({
  // undefined no servidor → persister "no-op" (SSR-safe)
  storage: hasIndexedDb() ? idbStorage : undefined,
  key: PERSISTED_CACHE_KEY,
  throttleTime: 1000,
});

/** Só queries com sucesso; `meta: { persist: false }` numa query evita gravá-la no IndexedDB. */
function shouldPersistQuery(query: Query): boolean {
  return query.state.status === "success" && query.meta?.persist !== false;
}

const persistOptions: PersistQueryClientProviderProps["persistOptions"] = {
  persister,
  maxAge: PERSISTED_CACHE_MAX_AGE,
  buster: PERSISTED_CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: shouldPersistQuery,
    // mutations pausadas não são retomadas (não há mutationFn padrão registrada)
    shouldDehydrateMutation: () => false,
  },
};

/**
 * Limpa o cache em memória e o IndexedDB — chamar no logout, ANTES de sair
 * (ex.: `await clearPersistedCache(); window.location.assign("/auth/signout")`).
 */
export async function clearPersistedCache(): Promise<void> {
  if (isServer) return;
  const client = getQueryClient();
  await client.cancelQueries();
  client.clear();
  await persister.removeClient();
  if (hasIndexedDb()) {
    try {
      await idbClear(getIdbStore());
    } catch {
      // ignora
    }
  }
}

/** QueryClientProvider com cache persistido no IndexedDB (offline-first). */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(getQueryClient);
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
}
