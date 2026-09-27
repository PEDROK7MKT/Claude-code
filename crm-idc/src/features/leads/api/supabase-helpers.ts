/**
 * Utilitários de acesso a dados compartilhados pelos hooks de `src/features/*\/api`.
 */
import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { AppError, SESSION_EXPIRED_MESSAGE, isNetworkError } from "@/lib/errors";

/** Máximo de linhas por requisição do PostgREST (max-rows padrão do Supabase). */
export const FETCH_BATCH_SIZE = 1000;

interface FetchInBatchesOptions<T> {
  /** Máximo de linhas no total (padrão: todas) */
  limit?: number;
  batchSize?: number;
  /** Remove repetidas (linhas deslocadas entre lotes por inserções concorrentes) */
  getKey?: (row: T) => string;
}

/**
 * Busca todas as linhas em lotes (`.range(from, to)`) até acabar ou atingir `limit`.
 * `fetchRange(from, to)` recebe índices inclusivos, como `.range()`.
 */
export async function fetchInBatches<T>(
  fetchRange: (from: number, to: number) => PromiseLike<T[]>,
  { limit = Number.POSITIVE_INFINITY, batchSize = FETCH_BATCH_SIZE, getKey }: FetchInBatchesOptions<T> = {},
): Promise<T[]> {
  const rows: T[] = [];
  const seen = new Set<string>();
  let offset = 0;
  while (rows.length < limit) {
    const size = Math.min(batchSize, limit - rows.length);
    const batch = await fetchRange(offset, offset + size - 1);
    for (const row of batch) {
      if (getKey) {
        const key = getKey(row);
        if (seen.has(key)) continue;
        seen.add(key);
      }
      rows.push(row);
      if (rows.length >= limit) break;
    }
    if (batch.length < size) break;
    offset += size;
  }
  return rows;
}

/** Id do usuário logado (valida o token no Auth). Sem sessão → AppError de sessão expirada. */
export async function requireUserId(supabase: TypedSupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error && isNetworkError(error)) throw error;
  const id = data.user?.id;
  if (!id) throw new AppError(SESSION_EXPIRED_MESSAGE, "session_expired");
  return id;
}

/** UUID gerado no cliente (permite conhecer o id antes do insert); undefined se indisponível. */
export function newClientId(): string | undefined {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return undefined;
}

/** Divide um array em pedaços de `size`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
