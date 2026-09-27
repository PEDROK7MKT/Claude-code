"use client";

import * as React from "react";
import { FilterXIcon, MegaphoneIcon, StethoscopeIcon } from "lucide-react";

import { SourceBadge } from "@/components/shared/source-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LeadSearchInput } from "@/features/leads/components/list/lead-search-input";
import { MultiSelectFilter } from "@/features/leads/components/list/multi-select-filter";
import { FINALS_WINDOW_DAYS } from "@/features/kanban/lib/columns";
import { hasActiveFilters, type KanbanFilters } from "@/features/kanban/lib/filters";
import { LEAD_SOURCES, SERVICES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface KanbanToolbarProps {
  filters: KanbanFilters;
  update: (patch: Partial<KanbanFilters>) => void;
  onClear: () => void;
  className?: string;
}

/** Busca (nome/telefone), fonte, serviço e o toggle "Mostrar finalizados antigos". */
export function KanbanToolbar({ filters, update, onClear, className }: KanbanToolbarProps) {
  const switchId = React.useId();
  const hintId = React.useId();

  return (
    <section
      aria-label="Busca e filtros"
      className={cn("flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center", className)}
    >
      <LeadSearchInput value={filters.q} onSearch={(q) => update({ q })} className="min-w-0 lg:w-80 lg:flex-none" />
      <div role="group" aria-label="Filtros" className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter
          label="Fonte"
          icon={MegaphoneIcon}
          options={LEAD_SOURCES}
          selected={filters.source}
          onChange={(source) => update({ source })}
          renderOption={(option) => (
            <SourceBadge source={option.value} variant="plain" className="text-foreground text-sm" />
          )}
        />
        <MultiSelectFilter
          label="Serviço"
          icon={StethoscopeIcon}
          options={SERVICES}
          selected={filters.service}
          onChange={(service) => update({ service })}
        />
        {hasActiveFilters(filters) ? (
          <Button type="button" variant="ghost" onClick={onClear} className="text-muted-foreground">
            <FilterXIcon aria-hidden="true" />
            Limpar filtros
          </Button>
        ) : null}
      </div>
      <div className="flex min-h-9 items-center gap-2.5 lg:ml-auto">
        <Switch
          id={switchId}
          checked={filters.showOldFinals}
          onCheckedChange={(checked) => update({ showOldFinals: checked })}
          aria-describedby={hintId}
        />
        <Label htmlFor={switchId} className="cursor-pointer font-normal">
          Mostrar finalizados antigos
        </Label>
        <span id={hintId} className="sr-only">
          Por padrão, as colunas Compareceu, Não compareceu, Cancelado e Perdido mostram só os leads atualizados nos
          últimos {FINALS_WINDOW_DAYS} dias.
        </span>
      </div>
    </section>
  );
}
