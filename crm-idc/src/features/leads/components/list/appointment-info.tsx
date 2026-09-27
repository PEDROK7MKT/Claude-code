import * as React from "react";
import { AlarmClockIcon, CalendarClockIcon } from "lucide-react";

import { getAppointmentDisplay } from "@/features/leads/lib/list-display";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";

export interface AppointmentInfoProps {
  lead: Pick<Lead, "status" | "scheduled_at">;
  /** Instante de referência (ms) — vem do relógio da lista */
  now: number;
  className?: string;
}

/**
 * Coluna "Agendamento": consulta de hoje em destaque dourado, horário que já
 * passou (status ainda agendado/confirmado) em vermelho, consultas sem efeito
 * (cancelado/perdido) riscadas.
 */
export function AppointmentInfo({ lead, now, className }: AppointmentInfoProps) {
  const display = getAppointmentDisplay(lead, now);

  if (display.tone === "none" || !lead.scheduled_at) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sem agendamento</span>
      </span>
    );
  }

  const base = "inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums";

  if (display.tone === "overdue") {
    return (
      <time
        dateTime={lead.scheduled_at}
        title={`${display.full} — o horário já passou e o status não foi atualizado`}
        className={cn(base, "text-destructive font-medium", className)}
      >
        <AlarmClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
        {display.label}
        <span className="sr-only">(horário já passou — atualize o status)</span>
      </time>
    );
  }

  if (display.isToday) {
    return (
      <time
        dateTime={lead.scheduled_at}
        title={`Consulta hoje — ${display.full}`}
        className={cn(
          base,
          "bg-gold/15 text-gold-foreground ring-gold/40 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
          className,
        )}
      >
        <CalendarClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
        {display.label}
      </time>
    );
  }

  return (
    <time
      dateTime={lead.scheduled_at}
      title={display.full ?? undefined}
      className={cn(
        base,
        display.tone === "past" && "text-muted-foreground",
        display.tone === "inactive" && "text-muted-foreground line-through decoration-1",
        className,
      )}
    >
      {display.label}
      {display.tone === "inactive" ? <span className="sr-only">(agendamento sem efeito)</span> : null}
    </time>
  );
}
