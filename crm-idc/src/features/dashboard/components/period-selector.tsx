"use client";

import * as React from "react";
import { CalendarRangeIcon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PeriodKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { isPeriodKey, PERIOD_CHOICES } from "../lib/period";

export interface PeriodSelectorProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  className?: string;
}

/** Seletor de período: botões segmentados no desktop, Select compacto no celular. */
export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const labelId = React.useId();
  const triggerId = React.useId();
  const handleChange = (next: string) => {
    // ToggleGroup "single" envia "" ao clicar no item já ativo — mantém o período
    if (isPeriodKey(next) && next !== value) onChange(next);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <span id={labelId} className="sr-only">
        Período
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        onValueChange={handleChange}
        aria-labelledby={labelId}
        className="bg-card hidden md:flex"
      >
        {PERIOD_CHOICES.map((choice) => (
          <ToggleGroupItem
            key={choice.value}
            value={choice.value}
            aria-label={choice.longLabel}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 whitespace-nowrap"
          >
            {choice.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger id={triggerId} size="sm" aria-labelledby={`${labelId} ${triggerId}`} className="w-full min-w-44 md:hidden">
          <CalendarRangeIcon aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {PERIOD_CHOICES.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.longLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
