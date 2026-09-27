/**
 * Situação de uma consulta do dashboard para a interface. Função pura.
 */
import type { FetchStatus } from "@tanstack/react-query";

/**
 * - `loading`: primeira carga em andamento (esqueleto).
 * - `offline`: sem internet e sem cópia neste aparelho — a consulta fica pausada até reconectar.
 * - `error`: falhou e não há cópia salva ("Tentar novamente").
 * - `ready`: há dados (da rede ou do cache do IndexedDB).
 */
export type QueryLoadState = "loading" | "offline" | "error" | "ready";

export interface QueryLoadInput {
  data: unknown;
  isError: boolean;
  fetchStatus: FetchStatus;
}

/**
 * Sem conexão e sem cache (primeiro acesso no aparelho, cache limpo no logout ou
 * um dia novo — as chaves das consultas do dashboard incluem a data), o TanStack
 * deixa a consulta "pending" com `fetchStatus: "paused"`. Isso não é carregamento:
 * tratar como tal deixaria o esqueleto na tela para sempre.
 */
export function queryLoadState(query: QueryLoadInput): QueryLoadState {
  if (query.data !== undefined) return "ready";
  if (query.isError) return "error";
  if (query.fetchStatus === "paused") return "offline";
  return "loading";
}
