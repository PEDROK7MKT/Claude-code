"use client";

import * as React from "react";
import { CalendarClockIcon, PencilIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateLead } from "@/features/leads/api/leads-mutations";
import { useClock } from "@/features/leads/components/list/use-clock";
import { LeadQuickActions, ScheduleDialog, type ScheduleDialogValues } from "@/features/leads/components/status";
import { appendAppointmentNote, canEditAppointment, isSameAppointment } from "@/features/leads/lib/lead-appointment";
import { formatAppointment, formatDateTime, formatRelative } from "@/lib/dates";
import type { Lead } from "@/types/database";

/**
 * Ações rápidas (spec §4.3): Marcar como agendado (agenda), Compareceu, Não
 * compareceu, Perdido e as contextuais — e, com a consulta marcada, o ajuste do horário.
 */
export function LeadActionsCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Ações rápidas</h2>
        </CardTitle>
        <CardDescription>Atualize o status conforme o atendimento avança — tudo fica no histórico.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <LeadQuickActions lead={lead} layout="buttons" />
        {canEditAppointment(lead.status) ? <AppointmentEditor lead={lead} /> : null}
      </CardContent>
    </Card>
  );
}

/** Consulta marcada (agendado/confirmado) com "Alterar horário" — sem mudar o status. */
function AppointmentEditor({ lead }: { lead: Lead }) {
  const [open, setOpen] = React.useState(false);
  const update = useUpdateLead();
  // atualiza "em 2 dias"/"há 1 hora" com a página aberta
  useClock();

  const handleSubmit = async ({ scheduledAt, note }: ScheduleDialogValues) => {
    const same = isSameAppointment(lead.scheduled_at, scheduledAt);
    const notes = appendAppointmentNote(lead.notes, {
      previous: same ? null : lead.scheduled_at,
      next: scheduledAt,
      note,
    });
    if (same && !notes) return; // nada mudou: só fecha
    await update.mutateAsync({
      id: lead.id,
      changes: { ...(same ? {} : { scheduled_at: scheduledAt }), ...(notes ? { notes } : {}) },
    });
  };

  return (
    <div className="bg-primary/5 border-primary/15 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
        >
          <CalendarClockIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Consulta marcada</p>
          {lead.scheduled_at ? (
            <p className="text-foreground font-semibold first-letter:uppercase">
              <time dateTime={lead.scheduled_at}>{formatAppointment(lead.scheduled_at)}</time>
              <span className="text-muted-foreground font-normal"> · {formatRelative(lead.scheduled_at)}</span>
            </p>
          ) : (
            <p className="text-foreground font-medium">Sem horário registrado</p>
          )}
          {lead.scheduled_at ? (
            <p className="text-muted-foreground text-xs tabular-nums">{formatDateTime(lead.scheduled_at)} (Barreiras/BA)</p>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <PencilIcon aria-hidden="true" />
        {lead.scheduled_at ? "Alterar horário" : "Definir horário"}
      </Button>

      <ScheduleDialog
        open={open}
        onOpenChange={setOpen}
        lead={lead}
        onSubmit={handleSubmit}
        defaultScheduledAt={lead.scheduled_at}
        showTransition={false}
        title="Alterar horário da consulta"
        description={
          <>
            O status continua <StatusBadge status={lead.status} className="align-middle" />. Se preencher a
            observação, ela é adicionada às notas do lead.
          </>
        }
        submitLabel="Salvar horário"
        // sem mudança de status não há registro no histórico: a nota vai para as anotações
        noteHint="É adicionada às notas do lead."
      />
    </div>
  );
}
