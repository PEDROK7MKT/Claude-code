/**
 * Dados de pacientes guardados neste navegador pela sessão (só no cliente).
 */
import { clearPersistedCache } from "@/components/providers/query-provider";
import { clearOfflinePageCaches } from "@/features/offline/clear-offline-caches";

/**
 * Apaga o cache do React Query (memória + IndexedDB) e as páginas salvas pelo service
 * worker (inclui abas que o SW ainda não controla). Nunca lança: uma falha do IndexedDB
 * ou do Cache Storage não pode impedir o logout nem o login.
 */
export async function clearLocalSessionData(): Promise<void> {
  await Promise.allSettled([clearPersistedCache(), clearOfflinePageCaches()]);
}
