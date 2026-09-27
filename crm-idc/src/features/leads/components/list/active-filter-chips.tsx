"use client";

import * as React from "react";
import { CalendarRangeIcon, FilterXIcon, SearchIcon, StethoscopeIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  filterChipRemoveLabel,
  getFilterChips,
  removeFilterChip,
  type FilterChip,
} from "@/features/leads/lib/list-filters";
import type { LeadListParams } from "@/features/leads/lib/list-params";
import { SOURCE_COLORS, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ActiveFilterChipsProps {
  params: LeadListParams;
  /** Novo estado sem o filtro removido (já na página 1) */
  onChange: (next: LeadListParams) => void;
  onClear: () => void;
  className?: string;
}

/**
 * Filtros aplicados como chips removíveis + "Limpar filtros". Ao remover um
 * chip, o foco passa para o chip seguinte (ou para "Limpar filtros").
 */
export function ActiveFilterChips({ params, onChange, onClear, className }: ActiveFilterChipsProps) {
  const chips = getFilterChips(params);
  const listRef = React.useRef<HTMLUListElement>(null);
  const pendingFocus = React.useRef<number | null>(null);

  // Depois que a URL atualiza e o chip some, devolve o foco para um vizinho
  React.useEffect(() => {
    const index = pendingFocus.current;
    if (index === null) return;
    pendingFocus.current = null;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-chip-action]");
    if (!buttons?.length) return;
    buttons[Math.min(index, buttons.length - 1)]?.focus();
  }, [chips.length]);

  if (chips.length === 0) return null;

  const remove = (chip: FilterChip, index: number) => {
    pendingFocus.current = index;
    onChange(removeFilterChip(params, chip));
  };

  return (
    <ul ref={listRef} aria-label="Filtros ativos" className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip, index) => (
        <li key={chip.id} className="max-w-full min-w-0">
          <span
            className={cn(
              "bg-card text-foreground inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-xs font-medium",
              chip.kind === "status" && cn("border-transparent ring-1 ring-inset", STATUS_META[chip.value].badgeClass),
            )}
          >
            <ChipIcon chip={chip} />
            <span className={cn("truncate", chip.kind === "status" && "lowercase")}>{chip.label}</span>
            <button
              type="button"
              data-chip-action
              onClick={() => remove(chip, index)}
              aria-label={filterChipRemoveLabel(chip)}
              // área de toque de 28px (after:) sem aumentar o chip
              className="hover:bg-foreground/10 focus-visible:ring-ring/50 relative inline-flex size-5 shrink-0 items-center justify-center rounded-full opacity-70 transition-colors outline-none after:absolute after:-inset-1 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]"
            >
              <XIcon aria-hidden="true" className="size-3" />
            </button>
          </span>
        </li>
      ))}
      <li>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-chip-action
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
        >
          <FilterXIcon aria-hidden="true" className="size-3.5" />
          Limpar filtros
        </Button>
      </li>
    </ul>
  );
}

function ChipIcon({ chip }: { chip: FilterChip }) {
  switch (chip.kind) {
    case "search":
      return <SearchIcon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />;
    case "source":
      return (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: SOURCE_COLORS[chip.value] }}
        />
      );
    case "service":
      return <StethoscopeIcon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />;
    case "period":
      return <CalendarRangeIcon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />;
    case "status":
      return null;
  }
}
