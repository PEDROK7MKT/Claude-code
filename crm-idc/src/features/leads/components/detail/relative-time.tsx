"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClock } from "@/features/leads/components/list/use-clock";
import { formatEntryAge } from "@/features/leads/lib/list-display";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface RelativeTimeProps {
  /** ISO (UTC) */
  value: string;
  /** Texto antes do relativo: "Entrou" → "Entrou há 3 dias" */
  prefix?: string;
  className?: string;
}

/**
 * "há 3 dias" que se atualiza sozinho, com a data completa (dd/MM/yyyy HH:mm,
 * America/Bahia) no tooltip e para leitores de tela.
 */
export function RelativeTime({ value, prefix, className }: RelativeTimeProps) {
  const now = useClock();
  const full = formatDateTime(value);
  const relative = formatEntryAge(value, now);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={value}
          tabIndex={0}
          className={cn(
            "focus-visible:ring-ring/50 cursor-default rounded-sm tabular-nums underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-[3px]",
            className,
          )}
        >
          {prefix ? `${prefix} ` : null}
          {relative}
          <span className="sr-only"> ({full})</span>
        </time>
      </TooltipTrigger>
      <TooltipContent>{full}</TooltipContent>
    </Tooltip>
  );
}
