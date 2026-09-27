"use client";

import { useOnlineStatus } from "@/components/providers/app-providers";
import { useRealtimeConnected } from "@/components/providers/realtime-provider";
import { cn } from "@/lib/utils";

/** "Ao vivo" quando o Realtime está conectado (spec §6.3: KPIs em tempo real). */
export function LiveIndicator({ className }: { className?: string }) {
  const connected = useRealtimeConnected();
  const online = useOnlineStatus();

  if (!online) {
    return (
      <span role="status" className={cn("text-muted-foreground inline-flex items-center gap-1.5 text-xs", className)}>
        <span aria-hidden="true" className="bg-muted-foreground/50 size-2 rounded-full" />
        Offline — exibindo dados salvos
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
