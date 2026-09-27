/**
 * Limpeza dos caches do service worker a partir da página (o Cache Storage é
 * compartilhado entre a página e o SW do mesmo domínio).
 */
import { CACHE_PREFIX } from "./lib/cache-strategy";

async function deleteCaches(match: (name: string) => boolean): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const names = await caches.keys();
    await Promise.all(names.filter(match).map((name) => caches.delete(name)));
  } catch {
    // Cache Storage indisponível (modo privado antigo): nada a limpar
  }
}

/**
 * Apaga as cópias de páginas salvas (contêm o nome/e-mail da sessão). O SW já faz
 * isso ao passar por /auth/signout; chamar também no logout, junto com
 * `clearPersistedCache()`, cobre abas sem SW no controle.
 */
export function clearOfflinePageCaches(): Promise<void> {
  return deleteCaches(
    (name) => name.startsWith(`${CACHE_PREFIX}-pages-`) || name.startsWith(`${CACHE_PREFIX}-runtime-`),
  );
}

/** Apaga todos os caches do app (usado no desenvolvimento, onde o SW não roda). */
export function clearAllOfflineCaches(): Promise<void> {
  return deleteCaches((name) => name.startsWith(`${CACHE_PREFIX}-`));
}
