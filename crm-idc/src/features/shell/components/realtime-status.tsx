"use client";

import * as React from "react";

import { useRealtimeConnected } from "@/components/providers/realtime-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Ponto de status do Supabase Realtime no header (verde = ativo; âmbar pulsando = reconectando). */
export function RealtimeStatus({ className }: { className?: string }) {
  const connected = useRealtimeConnected();
  const label = connected ? "Atualização em tempo real ativa" : "Atualização em tempo real reconectando…";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="status"
          tabIndex={0}
          aria-label={label}
          className={cn(
            "focus-visible:ring-ring/50 inline-flex size-8 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]",
            className,
          )}
        >
          {/* texto da região viva: anuncia quando a conexão cai ou volta */}
          <span className="sr-only">{label}</span>
          <span aria-hidden="true" className="relative flex size-2.5">
            {connected ? null : (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full ring-2",
                connected ? "bg-success ring-success/20" : "bg-amber-500 ring-amber-500/20",
              )}
            />
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
