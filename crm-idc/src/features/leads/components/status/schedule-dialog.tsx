"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, HistoryIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { DateTimePicker } from "@/components/shared/date-time-picker";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { todayKey } from "@/lib/dates";
import type { Lead } from "@/types/database";

import {
  DEFAULT_SCHEDULE_TIME,
  SCHEDULE_MINUTE_STEP,
  STATUS_NOTE_MAX_LENGTH,
  defaultScheduleIso,
  getScheduleCopy,
  isPastSchedule,
} from "./status-actions";

const PAST_SCHEDULE_MESSAGE =
  "Esse horário já passou. Para registrar uma consulta que já aconteceu, marque “Agendamento retroativo”.";

const scheduleFormSchema = z
  .object({
    /** ISO UTC; null enquanto data/hora estão incompletas */
    scheduledAt: z.string().nullable(),
    retroactive: z.boolean(),
    note: z
      .string()
      .trim()
      .max(STATUS_NOTE_MAX_LENGTH, `A observação pode ter no máximo ${STATUS_NOTE_MAX_LENGTH} caracteres.`),
  })
  .superRefine((values, ctx) => {
    if (!values.scheduledAt) {
      ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Informe a data e o horário da consulta." });
      return;
    }
    if (!values.retroactive && isPastSchedule(values.scheduledAt)) {
      ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: PAST_SCHEDULE_MESSAGE });
    }
  });

type ScheduleFormInput = z.input<typeof scheduleFormSchema>;
type ScheduleFormOutput = z.output<typeof scheduleFormSchema>;

export interface ScheduleDialogValues {
  /** Data/hora da consulta em ISO UTC (digitada no fuso de Barreiras/BA) */
  scheduledAt: string;
  note: string | null;
}

export interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Pick<Lead, "name" | "status" | "scheduled_at">;
  /**
   * Chamado com os valores validados. Se retornar Promise, o diálogo fica em
   * carregamento, fecha no sucesso e continua aberto se rejeitar (o erro é
   * exibido pelo chamador — ex.: toast da mutation).
   */
  onSubmit: (values: ScheduleDialogValues) => void | Promise<unknown>;
  /** Sugestão inicial (ISO). Padrão: próximo dia útil às 09:00. */
  defaultScheduledAt?: string | null;
  defaultNote?: string | null;
  /** Textos padrão vêm de getScheduleCopy (agendar × reagendar). */
  title?: string;
  description?: React.ReactNode;
  submitLabel?: string;
  /** Mostra a transição "status atual → agendado" (padrão: true). */
  showTransition?: boolean;
}

/**
 * Agendar/reagendar consulta: data e horário (fuso America/Bahia, de 15 em 15
 * minutos) obrigatórios — regra 3 — e observação opcional para o histórico.
 * Horários no passado só com "Agendamento retroativo" marcado.
 */
export function ScheduleDialog({ open, onOpenChange, ...formProps }: ScheduleDialogProps) {
  const [pending, setPending] = React.useState(false);

  const handleOpenChange = (next: boolean) => {
    // Não fecha (Esc, clique fora, X, Cancelar) enquanto salva.
    if (!next && pending) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-busy={pending || undefined} showCloseButton={!pending} className="sm:max-w-md">
        {/* Conteúdo montado a cada abertura: o formulário sempre começa limpo. */}
        <ScheduleForm
          {...formProps}
          pending={pending}
          onPendingChange={setPending}
          onDone={() => onOpenChange(false)}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleFormProps extends Omit<ScheduleDialogProps, "open" | "onOpenChange"> {
  pending: boolean;
  onPendingChange: (pending: boolean) => void;
  onDone: () => void;
  onCancel: () => void;
}

function ScheduleForm({
  lead,
  onSubmit,
  defaultScheduledAt,
  defaultNote,
  title,
  description,
  submitLabel,
  showTransition = true,
  pending,
  onPendingChange,
  onDone,
  onCancel,
}: ScheduleFormProps) {
  const copy = getScheduleCopy(lead);
  const [initial] = React.useState(() => {
    const scheduledAt = defaultScheduledAt ?? defaultScheduleIso();
    return { scheduledAt, past: isPastSchedule(scheduledAt) };
  });
  // Calculado no evento de mudança (não durante o render): o horário escolhido já passou?
  const [pastSelected, setPastSelected] = React.useState(initial.past);

  const form = useForm<ScheduleFormInput, unknown, ScheduleFormOutput>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      scheduledAt: initial.scheduledAt,
      retroactive: initial.past,
      note: defaultNote ?? "",
    },
  });
  const retroactive = useWatch({ control: form.control, name: "retroactive" });
  const note = useWatch({ control: form.control, name: "note" }) ?? "";

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.scheduledAt) return;
    onPendingChange(true);
    try {
      await onSubmit({ scheduledAt: values.scheduledAt, note: values.note || null });
      onDone();
    } catch {
      // Continua aberto para tentar de novo; o erro já foi comunicado pelo chamador.
    } finally {
      onPendingChange(false);
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title ?? copy.title}</DialogTitle>
        <DialogDescription>{description ?? copy.description}</DialogDescription>
      </DialogHeader>

      {showTransition || copy.previous ? (
        <div className="bg-muted/50 grid gap-2 rounded-md border p-3 text-sm">
          {showTransition ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="sr-only">Mudança de status:</span>
              <StatusBadge status={lead.status} />
              <ArrowRightIcon aria-hidden="true" className="text-muted-foreground size-4" />
              <StatusBadge status="agendado" />
            </div>
          ) : null}
          {copy.previous ? (
            <p className="text-muted-foreground flex items-start gap-2">
              <HistoryIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{copy.previous}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <Form {...form}>
        <form noValidate onSubmit={handleSubmit} className="grid gap-4">
          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Data e horário da consulta</FormLabel>
                <FormControl>
                  <DateTimePicker
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(iso) => {
                      field.onChange(iso);
                      setPastSelected(isPastSchedule(iso));
                    }}
                    minDate={retroactive ? undefined : todayKey()}
                    defaultTime={DEFAULT_SCHEDULE_TIME}
                    minuteStep={SCHEDULE_MINUTE_STEP}
                    disabled={pending}
                  />
                </FormControl>
                {!fieldState.error && pastSelected ? (
                  <FormDescription
                    role="status"
                    className={retroactive ? undefined : "flex items-start gap-1.5 text-amber-700"}
                  >
                    {retroactive ? (
                      "Será registrado como agendamento retroativo (horário que já passou)."
                    ) : (
                      <>
                        <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>{PAST_SCHEDULE_MESSAGE}</span>
                      </>
                    )}
                  </FormDescription>
                ) : (
                  <FormDescription>Horário de Barreiras/BA (GMT-3), de 15 em 15 minutos.</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="retroactive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3">
                <FormControl>
                  <Checkbox
                    ref={field.ref}
                    name={field.name}
                    checked={field.value}
                    onBlur={field.onBlur}
                    disabled={pending}
                    className="mt-0.5"
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true);
                      // o erro de "horário no passado" fica no campo da data: revalida
                      if (form.formState.isSubmitted) void form.trigger("scheduledAt");
                    }}
                  />
                </FormControl>
                <div className="grid gap-1">
                  <FormLabel className="font-normal">Agendamento retroativo</FormLabel>
                  <FormDescription className="text-xs">
                    Libera datas que já passaram, para registrar uma consulta marcada antes de ser lançada no CRM.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    maxLength={STATUS_NOTE_MAX_LENGTH}
                    disabled={pending}
                    placeholder="Ex.: avaliação para implante; paciente prefere horários pela manhã…"
                    className="max-h-40"
                  />
                </FormControl>
                <FormDescription className="flex justify-between gap-2 text-xs">
                  <span>Fica registrada no histórico do lead.</span>
                  <span className="shrink-0 tabular-nums">
                    {note.length}/{STATUS_NOTE_MAX_LENGTH}
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
              {submitLabel ?? copy.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
