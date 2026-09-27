"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange, Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { bahiaLocalToIso, formatDateKey, formatTime, toDateKey, todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Conversões
// O DayPicker trabalha com Date no fuso do navegador; aqui ele só representa uma
// data-calendário (yyyy-MM-dd). A conversão para instante UTC é feita sempre no
// fuso America/Bahia via @/lib/dates — nunca pelo fuso do navegador.
// -----------------------------------------------------------------------------

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** yyyy-MM-dd → Date (meia-noite local), apenas para exibição no calendário. */
function keyToCalendarDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date do calendário → yyyy-MM-dd. */
function calendarDateToKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Aceita yyyy-MM-dd, ISO ou Date e devolve a data-calendário no fuso da clínica. */
function toKey(input: string | Date): string {
  return typeof input === "string" && DATE_KEY_RE.test(input) ? input : toDateKey(input);
}

function isValidInstant(value: string | null | undefined): value is string {
  return !!value && !Number.isNaN(new Date(value).getTime());
}

function sameInstant(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  return new Date(a).getTime() === new Date(b).getTime();
}

function buildDisabled(minDate?: string | Date, maxDate?: string | Date): Matcher[] | undefined {
  const matchers: Matcher[] = [];
  if (minDate) matchers.push({ before: keyToCalendarDate(toKey(minDate)) });
  if (maxDate) matchers.push({ after: keyToCalendarDate(toKey(maxDate)) });
  return matchers.length ? matchers : undefined;
}

/** Arredonda "HH:mm" para o múltiplo de `step` minutos mais próximo (sem passar de 23:59). */
function snapTime(time: string, step: number): string {
  const match = TIME_RE.exec(time);
  if (!match || step <= 1) return time;
  const total = Number(match[1]) * 60 + Number(match[2]);
  const snapped = Math.min(Math.round(total / step) * step, 24 * 60 - step);
  const hh = String(Math.floor(snapped / 60)).padStart(2, "0");
  const mm = String(snapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Props repassadas ao botão que abre o calendário (compatível com <FormControl>). */
type TriggerProps = Pick<
  React.ComponentProps<"button">,
  "id" | "ref" | "name" | "onBlur" | "aria-invalid" | "aria-describedby" | "aria-labelledby" | "aria-label"
>;

// -----------------------------------------------------------------------------
// DatePicker — data-calendário (yyyy-MM-dd)
// -----------------------------------------------------------------------------

export interface DatePickerProps extends TriggerProps {
  /** Data-calendário yyyy-MM-dd */
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Primeira data selecionável (yyyy-MM-dd, ISO ou Date) */
  minDate?: string | Date;
  /** Última data selecionável (yyyy-MM-dd, ISO ou Date) */
  maxDate?: string | Date;
  /** Mostra "Limpar" no calendário */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione a data",
  minDate,
  maxDate,
  clearable = false,
  disabled,
  className,
  align = "start",
  ...triggerProps
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const dateKey = value && DATE_KEY_RE.test(value) ? value : null;
  const selected = dateKey ? keyToCalendarDate(dateKey) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!dateKey}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className,
          )}
          {...triggerProps}
        >
          <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
          <span className="truncate">{dateKey ? formatDateKey(dateKey) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          today={keyToCalendarDate(todayKey())}
          disabled={buildDisabled(minDate, maxDate)}
          autoFocus
          onSelect={(date) => {
            if (date) onChange(calendarDateToKey(date));
            else if (clearable) onChange(null);
            setOpen(false);
          }}
        />
        {clearable && dateKey ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Limpar data
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

// -----------------------------------------------------------------------------
// DateTimePicker — instante ISO (UTC), digitado no fuso America/Bahia
// -----------------------------------------------------------------------------

export interface DateTimePickerProps extends TriggerProps {
  /** Instante ISO em UTC (ex.: leads.scheduled_at) */
  value?: string | null;
  /** Recebe ISO UTC quando data e hora estão completas; `null` quando incompleto/limpo. */
  onChange: (value: string | null) => void;
  minDate?: string | Date;
  maxDate?: string | Date;
  /** Hora sugerida ao escolher a data pela primeira vez (HH:mm). */
  defaultTime?: string;
  /** Intervalo dos horários em minutos (padrão 15). */
  minuteStep?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface DateTimeDraft {
  dateKey: string | null;
  time: string;
}

function splitIso(value: string | null | undefined): DateTimeDraft {
  if (!isValidInstant(value)) return { dateKey: null, time: "" };
  return { dateKey: toDateKey(value), time: formatTime(value) };
}

function draftToIso(draft: DateTimeDraft): string | null {
  if (!draft.dateKey || !TIME_RE.test(draft.time)) return null;
  return bahiaLocalToIso(draft.dateKey, draft.time);
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  maxDate,
  defaultTime = "09:00",
  minuteStep = 15,
  placeholder = "Selecione a data",
  disabled,
  className,
  id,
  ...triggerProps
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateTimeDraft>(() => splitIso(value));
  const timeInputId = React.useId();

  // Sincroniza quando o valor muda por fora (reset do form, outro usuário etc.).
  // Ecos do próprio onChange são ignorados comparando o instante.
  const externalIso = isValidInstant(value) ? value : null;
  if (value !== undefined && !sameInstant(externalIso, draftToIso(draft))) {
    setDraft(splitIso(externalIso));
  }

  const commit = (next: DateTimeDraft) => {
    setDraft(next);
    const iso = draftToIso(next);
    if (!sameInstant(iso, externalIso)) onChange(iso);
  };

  const selected = draft.dateKey ? keyToCalendarDate(draft.dateKey) : undefined;

  return (
    <div data-slot="date-time-picker" className={cn("flex w-full gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            data-empty={!draft.dateKey}
            className="data-[empty=true]:text-muted-foreground min-w-0 flex-1 justify-start text-left font-normal"
            {...triggerProps}
          >
            <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
            <span className="truncate">{draft.dateKey ? formatDateKey(draft.dateKey) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            today={keyToCalendarDate(todayKey())}
            disabled={buildDisabled(minDate, maxDate)}
            autoFocus
            onSelect={(date) => {
              if (date) {
                commit({
                  dateKey: calendarDateToKey(date),
                  time: TIME_RE.test(draft.time) ? draft.time : snapTime(defaultTime, minuteStep),
                });
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <label htmlFor={timeInputId} className="sr-only">
        Horário (fuso de Barreiras/BA)
      </label>
      <Input
        id={timeInputId}
        type="time"
        step={minuteStep * 60}
        value={draft.time}
        disabled={disabled}
        aria-invalid={triggerProps["aria-invalid"]}
        className="w-[7.5rem] shrink-0 tabular-nums"
        onChange={(event) => commit({ ...draft, time: event.target.value })}
        onBlur={(event) => {
          const snapped = snapTime(event.target.value, minuteStep);
          if (snapped !== draft.time) commit({ ...draft, time: snapped });
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// DateRangePicker — intervalo de datas-calendário (filtros, períodos do GMN)
// -----------------------------------------------------------------------------

export interface DateKeyRange {
  /** yyyy-MM-dd (inclusive) */
  from: string;
  /** yyyy-MM-dd (inclusive) */
  to: string;
}

export interface DateRangePickerProps extends TriggerProps {
  value?: DateKeyRange | null;
  /** Chamado ao aplicar/fechar o calendário (uma vez por seleção, não a cada clique). */
  onChange: (value: DateKeyRange | null) => void;
  placeholder?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  /** Meses exibidos lado a lado (padrão: 2 no desktop, 1 no mobile). */
  numberOfMonths?: number;
}

function formatRange(range: DateKeyRange): string {
  return range.from === range.to
    ? formatDateKey(range.from)
    : `${formatDateKey(range.from)} – ${formatDateKey(range.to)}`;
}

function toDayPickerRange(range: DateKeyRange | null | undefined): DayPickerRange | undefined {
  if (!range) return undefined;
  return { from: keyToCalendarDate(range.from), to: keyToCalendarDate(range.to) };
}

function fromDayPickerRange(range: DayPickerRange | undefined): DateKeyRange | null {
  if (!range?.from) return null;
  const from = calendarDateToKey(range.from);
  const to = range.to ? calendarDateToKey(range.to) : from;
  return from <= to ? { from, to } : { from: to, to: from };
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecione o período",
  minDate,
  maxDate,
  clearable = false,
  disabled,
  className,
  align = "start",
  numberOfMonths,
  ...triggerProps
}: DateRangePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DayPickerRange | undefined>(undefined);

  const commit = (range: DayPickerRange | undefined) => {
    const next = fromDayPickerRange(range);
    if (next) {
      if (!value || next.from !== value.from || next.to !== value.to) onChange(next);
    } else if (clearable && value) {
      onChange(null);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(toDayPickerRange(value));
    else commit(draft);
    setOpen(next);
  };

  const draftKeys = fromDayPickerRange(draft);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!value}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className,
          )}
          {...triggerProps}
        >
          <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
          <span className="truncate">{value ? formatRange(value) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          defaultMonth={draft?.from}
          numberOfMonths={numberOfMonths ?? (isMobile ? 1 : 2)}
          today={keyToCalendarDate(todayKey())}
          disabled={buildDisabled(minDate, maxDate)}
          autoFocus
        />
        <div className="flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs" aria-live="polite">
            {draftKeys ? formatRange(draftKeys) : "Clique na data inicial e depois na final."}
          </p>
          <div className="flex gap-2 sm:justify-end">
            {clearable ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!draft && !value}
                onClick={() => {
                  setDraft(undefined);
                  if (value) onChange(null);
                  setOpen(false);
                }}
              >
                Limpar
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={!draftKeys}
              onClick={() => {
                commit(draft);
                setOpen(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
