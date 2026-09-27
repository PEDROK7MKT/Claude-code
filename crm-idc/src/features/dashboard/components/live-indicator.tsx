"use client";

import { useOnlineStatus } from "@/components/providers/app-providers";
import { useRealtimeConnected } from "@/components/providers/realtime-provider";
import { cn } from "@/lib/utils";

export interface LiveIndicatorProps {
  /**
   * Há dados salvos na tela. `false` quando, offline, nada foi baixado neste
   * aparelho ainda (ex.: dia novo): não promete "dados salvos" que não existem.
   */
  hasSavedData?: boolean;
  className?: string;
}

/** "Ao vivo" quando o Realtime está conectado (spec §6.3: KPIs em tempo real). */
export function LiveIndicator({ hasSavedData = true, className }: LiveIndicatorProps) {
  const connected = useRealtimeConnected();
  const online = useOnlineStatus();

  if (!online) {
    return (
      <span role="status" className={cn("text-muted-foreground inline-flex items-center gap-1.5 text-xs", className)}>
        <span aria-hidden="true" className="bg-muted-foreground/50 size-2 rounded-full" />
        {hasSavedData ? "Offline — exibindo dados salvos" : "Offline — aguardando conexão"}
      </span>
    );
  }

  if (!connected) return null;

  return (
    <span
      role="status"
      title="Os números se atualizam sozinhos quando um lead chega ou muda de status"
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-green-700", className)}
    >
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
      </span>
      Ao vivo
    </span>
  );
}
