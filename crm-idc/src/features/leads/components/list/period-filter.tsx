"use client";

import * as React from "react";
import { CalendarRangeIcon } from "lucide-react";

import { DateRangePicker, type DateKeyRange } from "@/components/shared/date-time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  isPeriodSelectValue,
  PERIOD_SELECT_OPTIONS,
  periodSelectValue,
  type PeriodSelectValue,
} from "@/features/leads/lib/list-filters";
import { customPeriodSeed, type LeadListPeriod } from "@/features/leads/lib/list-params";
import { todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface PeriodFilterProps {
  period: LeadListPeriod | null;
  onChange: (period: LeadListPeriod | null) => void;
  /** Relógio da lista (ms) — base dos atalhos e do "Personalizado" */
  now: number;
  /** `inline` (barra do desktop) ou `stacked` (painel do celular) */
  layout?: "inline" | "stacked";
  className?: string;
}

/**
 * Período de entrada do lead: atalhos (Hoje, 7 dias, 30 dias, Mês atual) ou
 * intervalo personalizado no calendário. Os dias são do fuso da clínica.
 */
export function PeriodFilter({ period, onChange, now, layout = "inline", className }: PeriodFilterProps) {
  const labelId = React.useId();
  const triggerId = React.useId();
  const value = periodSelectValue(period);
  const today = todayKey(now);

  const handleSelect = (next: string) => {
    if (!isPeriodSelectValue(next) || next === value) return;
    onChange(toPeriod(next, period, now));
  };

  const handleRange = (range: DateKeyRange | null) => {
    onChange(range ? { kind: "custom", from: range.from, to: range.to } : null);
  };

  const customRange: DateKeyRange | null =
    period?.kind === "custom" ? { from: period.from, to: period.to ?? today } : null;

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "inline" ? "flex-wrap items-center" : "flex-col",
        className,
      )}
    >
      <span id={labelId} className="sr-only">
        Período de entrada
      </span>
      <Select value={value} onValueChange={handleSelect}>
        <SelectTrigger
          id={triggerId}
          aria-labelledby={`${labelId} ${triggerId}`}
          data-active={value !== "all"}
          className={cn(
            "data-[active=true]:border-primary/40 data-[active=true]:bg-primary/5 data-[active=true]:text-primary",
            layout === "inline" ? "w-44" : "h-10 w-full",
          )}
        >
          <CalendarRangeIcon aria-hidden="true" className="opacity-70" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {PERIOD_SELECT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {customRange ? (
        <DateRangePicker
          value={customRange}
          onChange={handleRange}
          maxDate={today}
          clearable
          aria-label="Intervalo personalizado de entrada"
          className={layout === "inline" ? "w-auto" : "h-10 w-full"}
        />
      ) : null}
    </div>
  );
}

function toPeriod(value: PeriodSelectValue, current: LeadListPeriod | null, now: number): LeadListPeriod | null {
  if (value === "all") return null;
  if (value === "custom") return customPeriodSeed(current, now);
  return { kind: "preset", key: value };
}
