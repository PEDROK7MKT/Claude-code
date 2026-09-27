"use client";

import * as React from "react";
import { onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const NETWORK_TOAST_ID = "network-status";

let onlineManagerWired = false;

/**
 * Liga o onlineManager do TanStack aos eventos online/offline do navegador e ao
 * estado inicial (`navigator.onLine`) — por padrão ele assume "online" ao iniciar.
 */
function wireOnlineManager(): void {
  if (onlineManagerWired || typeof window === "undefined") return;
  onlineManagerWired = true;
  onlineManager.setEventListener((setOnline) => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update, false);
    window.addEventListener("offline", update, false);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  });
}

function subscribeOnline(onChange: () => void): () => void {
  return onlineManager.subscribe(onChange);
}

/** `true` quando há conexão (segundo o onlineManager do TanStack). No servidor, sempre `true`. */
export function useOnlineStatus(): boolean {
  return React.useSyncExternalStore(
    subscribeOnline,
    () => onlineManager.isOnline(),
    () => true,
  );
}

/** Toast persistente enquanto offline; "Conexão restabelecida" ao voltar. */
function NetworkStatusToasts() {
  React.useEffect(() => {
    wireOnlineManager();
    let wasOffline = false;
    const show = (online: boolean) => {
      if (!online) {
        wasOffline = true;
        toast.warning("Você está offline — exibindo dados salvos", {
          id: NETWORK_TOAST_ID,
          duration: Number.POSITIVE_INFINITY,
        });
      } else if (wasOffline) {
        wasOffline = false;
        toast.success("Conexão restabelecida", { id: NETWORK_TOAST_ID, duration: 4000 });
      }
    };
    show(onlineManager.isOnline());
    return onlineManager.subscribe(show);
  }, []);
  return null;
}

/** Providers globais do app (layout raiz): React Query persistido, tooltips, toasts e status de rede. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider delayDuration={200}>
        {children}
        <NetworkStatusToasts />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryProvider>
  );
}
