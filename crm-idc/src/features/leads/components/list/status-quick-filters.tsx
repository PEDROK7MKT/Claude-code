"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { matchQuickFilter, STATUS_QUICK_FILTERS } from "@/features/leads/lib/list-filters";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";

export interface StatusQuickFiltersProps {
  status: readonly LeadStatus[];
  onChange: (status: LeadStatus[]) => void;
  className?: string;
}

/**
 * Atalhos de status (Todos, Novos, Em contato, Agendados…). Nenhum fica marcado
 * quando a seleção de status é uma combinação livre feita no filtro de status.
 */
export function StatusQuickFilters({ status, onChange, className }: StatusQuickFiltersProps) {
  const active = matchQuickFilter(status)?.id ?? "";

  const handleChange = (id: string) => {
    // "single" envia "" ao clicar no atalho já ativo — mantém a seleção
    const filter = STATUS_QUICK_FILTERS.find((item) => item.id === id);
    if (filter && id !== active) onChange([...filter.statuses]);
  };

  return (
    // rolagem horizontal própria no celular (sem rolar a página)
    <div className={cn("-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]", className)}>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={active}
        onValueChange={handleChange}
        aria-label="Atalhos de status"
        className="bg-card"
      >
        {STATUS_QUICK_FILTERS.map((filter) => (
          <ToggleGroupItem
            key={filter.id}
            value={filter.id}
            title={filter.description}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex-none px-3 whitespace-nowrap"
          >
            {filter.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
