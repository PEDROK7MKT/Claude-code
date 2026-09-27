"use client";

import * as React from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { capitalize, monthLabel, monthNavigation, recentMonthOptions } from "../lib/month";

interface MonthPickerProps {
  value: string;
  /** Mês atual (yyyy-MM, fuso da clínica) — limite do seletor */
  currentMonth: string;
  onChange: (monthKey: string) => void;
  className?: string;
}

/** Seletor de mês do relatório: setas anterior/próximo + lista dos últimos 24 meses. */
export function MonthPicker({ value, currentMonth, onChange, className }: MonthPickerProps) {
  const options = React.useMemo(() => recentMonthOptions(currentMonth, value), [currentMonth, value]);
  const { previous, next } = monthNavigation(value, currentMonth);

  return (
    <div role="group" aria-label="Mês do relatório" className={cn("flex w-full items-center gap-1.5 sm:w-auto", className)}>
      <NavButton
        label={previous ? `Mês anterior: ${monthLabel(previous)}` : "Não há meses anteriores disponíveis"}
        disabled={!previous}
        onClick={() => previous && onChange(previous)}
      >
        <ChevronLeftIcon aria-hidden="true" />
      </NavButton>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label="Selecionar mês" className="min-w-0 flex-1 font-medium sm:w-52 sm:flex-none">
          <CalendarIcon aria-hidden="true" className="text-primary" />
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <NavButton
        label={next ? `Próximo mês: ${monthLabel(next)}` : `${capitalize(monthLabel(currentMonth))} é o mês atual`}
        disabled={!next}
        onClick={() => next && onChange(next)}
      >
        <ChevronRightIcon aria-hidden="true" />
      </NavButton>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* aria-disabled mantém o foco e o tooltip explicando por que está desabilitado */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={label}
          aria-disabled={disabled || undefined}
          className={cn("shrink-0", disabled && "cursor-not-allowed opacity-50")}
          onClick={() => {
            if (!disabled) onClick();
          }}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
