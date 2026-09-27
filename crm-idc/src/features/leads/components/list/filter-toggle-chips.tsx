"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { toggleListValue, type FilterOption } from "@/features/leads/lib/list-filters";
import { cn } from "@/lib/utils";

export interface FilterToggleChipsProps<T extends string> {
  /** Título do grupo ("Status", "Fonte"…) */
  label: string;
  options: ReadonlyArray<FilterOption<T>>;
  selected: readonly T[];
  onChange: (next: T[]) => void;
  /** Cor da bolinha de cada opção (status e fonte usam as cores dos gráficos) */
  colorOf?: (value: T) => string;
  className?: string;
}

/**
 * Grupo de chips liga/desliga (painel de filtros no celular): alvos de toque
 * grandes, `aria-pressed` e seleção múltipla aplicada na hora.
 */
export function FilterToggleChips<T extends string>({
  label,
  options,
  selected,
  onChange,
  colorOf,
  className,
}: FilterToggleChipsProps<T>) {
  const labelId = React.useId();
  const order = React.useMemo(() => options.map((option) => option.value), [options]);

  return (
    <div role="group" aria-labelledby={labelId} className={cn("min-w-0 space-y-2.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p id={labelId} className="text-sm font-medium">
          {label}
        </p>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm text-xs underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
          >
            Limpar ({selected.length})
            <span className="sr-only"> — {label.toLowerCase()}</span>
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const pressed = selected.includes(option.value);
          return (
            <Toggle
              key={option.value}
              variant="outline"
              pressed={pressed}
              onPressedChange={() => onChange(toggleListValue(selected, option.value, order))}
              className="data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary h-9 rounded-full px-3 font-normal data-[state=on]:font-medium"
            >
              {pressed ? (
                <CheckIcon aria-hidden="true" className="size-3.5" />
              ) : colorOf ? (
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorOf(option.value) }}
                />
              ) : null}
              {option.label}
            </Toggle>
          );
        })}
      </div>
    </div>
  );
}
