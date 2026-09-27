"use client";

import * as React from "react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import {
  nextSort,
  SORT_COLUMN_LABEL,
  sortDirectionLabel,
  type LeadListSort,
  type LeadListSortColumn,
} from "@/features/leads/lib/list-params";
import { cn } from "@/lib/utils";

export interface SortableHeadProps {
  column: LeadListSortColumn;
  sort: LeadListSort;
  onSort: (column: LeadListSortColumn) => void;
  className?: string;
}

/** Cabeçalho clicável: alterna crescente/decrescente e expõe `aria-sort` na coluna ativa. */
export function SortableHead({ column, sort, onSort, className }: SortableHeadProps) {
  const active = sort.column === column;
  const label = SORT_COLUMN_LABEL[column];
  const next = nextSort(sort, column);
  const Icon = !active ? ArrowUpDownIcon : sort.dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
  const hint = `Ordenar por ${label.toLowerCase()}: ${sortDirectionLabel(next)}`;

  return (
    <TableHead
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
      className={cn("h-11 px-3", className)}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        title={hint}
        data-active={active}
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 data-[active=true]:text-foreground -ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold tracking-wide uppercase transition-colors outline-none focus-visible:ring-[3px]"
      >
        {label}
        <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", !active && "opacity-40")} />
        <span className="sr-only">. {hint}</span>
      </button>
    </TableHead>
  );
}
