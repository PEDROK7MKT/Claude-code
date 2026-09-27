"use client";

import * as React from "react";
import { toast } from "sonner";

import { clearAllOfflineCaches } from "./clear-offline-caches";
import { SW_MESSAGES, SW_PATH, selectWarmCacheAssets } from "./lib/cache-strategy";

const UPDATE_TOAST_ID = "sw-update";
/** Procura versão nova do SW de hora em hora e ao voltar para a aba (no máx. a cada 5 min). */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const UPDATE_CHECK_MIN_GAP_MS = 5 * 60 * 1000;

/**
 * Registra o service worker (/sw.js) — só em produção e se o navegador suportar.
 * Quando uma versão nova fica esperando, mostra o toast "Nova versão disponível"
 * com "Atualizar", que ativa a versão nova e recarrega a página.
 */
export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // no dev os chunks não têm hash: um SW de um `next start` anterior serviria código velho
      void unregisterServiceWorkers();
      return;
    }

    const controller = new AbortController();
    // falhas aqui nunca derrubam o app: ele só fica sem cache offline de páginas
    const start = () => void setupServiceWorker(controller.signal).catch(() => undefined);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true, signal: controller.signal });

    return () => controller.abort();
  }, []);

  return null;
}

async function setupServiceWorker(signal: AbortSignal): Promise<void> {
  const container = navigator.serviceWorker;
  const wasControlled = container.controller !== null;
  let hadController = wasControlled;
  let reloadRequested = false;

  container.addEventListener(
    "controllerchange",
    () => {
      if (reloadRequested) {
        window.location.reload();
        return;
      }
      // sem controle antes = 1ª instalação (clients.claim): a página continua como está
      if (hadController) {
        // versão nova ativada em outra aba
        toast.info("O IDC CRM foi atualizado", {
          id: UPDATE_TOAST_ID,
          description: "Recarregue a página para usar a versão nova.",
          duration: Number.POSITIVE_INFINITY,
          action: { label: "Recarregar", onClick: () => window.location.reload() },
        });
      }
      hadController = true;
    },
    { signal },
  );

  let registration: ServiceWorkerRegistration;
  try {
    registration = await container.register(SW_PATH, { scope: "/", updateViaCache: "none" });
  } catch {
    // registro recusado (ex.: modo privado): o app segue sem cache offline de páginas
    return;
  }
  if (signal.aborted) return;

  const promptUpdate = (worker: ServiceWorker) => {
    toast("Nova versão disponível", {
      id: UPDATE_TOAST_ID,
      description: "Atualize para carregar a versão mais recente do IDC CRM.",
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: "Atualizar",
        onClick: () => {
          reloadRequested = true;
          worker.postMessage({ type: SW_MESSAGES.skipWaiting });
        },
      },
    });
  };

  // versão nova já esperando (ex.: deploy enquanto a aba estava fechada)
  if (registration.waiting && container.controller) promptUpdate(registration.waiting);

  registration.addEventListener(
    "updatefound",
    () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        // "installed" com um SW no controle = atualização (na 1ª instalação não há controle)
        if (installing.state === "installed" && container.controller) promptUpdate(installing);
      });
    },
    { signal },
  );

  let lastCheck = Date.now();
  const checkForUpdate = () => {
    if (!navigator.onLine || Date.now() - lastCheck < UPDATE_CHECK_MIN_GAP_MS) return;
    lastCheck = Date.now();
    registration.update().catch(() => undefined);
  };
  const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
  signal.addEventListener("abort", () => window.clearInterval(interval));
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") checkForUpdate();
    },
    { signal },
  );

  // 1ª visita: a página carregou antes do SW — guarda ela e os assets já baixados
  if (!wasControlled) {
    const ready = await container.ready;
    if (!signal.aborted) warmCache(ready.active);
  }
}

function warmCache(worker: ServiceWorker | null): void {
  if (!worker) return;
  const loaded = performance.getEntriesByType("resource").map((entry) => entry.name);
  worker.postMessage({
    type: SW_MESSAGES.warmCache,
    page: window.location.href,
    assets: selectWarmCacheAssets(loaded, window.location.origin),
  });
}

async function unregisterServiceWorkers(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const ours = registrations.filter((r) =>
      [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_PATH)),
    );
    if (ours.length === 0) return;
    await Promise.all(ours.map((r) => r.unregister()));
    await clearAllOfflineCaches();
  } catch {
    // ignora
  }
}
