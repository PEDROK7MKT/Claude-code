import type { Metadata } from "next";

import { OfflineView } from "@/features/offline/offline-view";

export const metadata: Metadata = {
  title: "Sem conexão",
};

/**
 * Fallback offline: pré-carregado pelo service worker (public/sw.js) e servido quando
 * uma navegação falha sem cópia salva. Síncrona e sem dados — abre inteira do cache.
 */
export default function OfflinePage() {
  return <OfflineView />;
}
