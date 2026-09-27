"use client";

import * as React from "react";
import { ArrowDownUpIcon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  mobileSortOptions,
  parseSortKey,
  sortKey,
  sortLabel,
  type LeadListSort,
} from "@/features/leads/lib/list-params";
import { cn } from "@/lib/utils";

export interface SortSelectProps {
  sort: LeadListSort;
  onChange: (sort: LeadListSort) => void;
  className?: string;
}

/** Ordenação no celular, onde não há cabeçalho de tabela para clicar. */
export function SortSelect({ sort, onChange, className }: SortSelectProps) {
  const labelId = React.useId();
  const triggerId = React.useId();
  const options = mobileSortOptions(sort);

  return (
    <div className={cn("space-y-2.5", className)}>
      <label id={labelId} htmlFor={triggerId} className="text-sm font-medium">
        Ordenar por
      </label>
      <Select
        value={sortKey(sort)}
        onValueChange={(value) => {
          const next = parseSortKey(value);
          if (next) onChange(next);
        }}
      >
        <SelectTrigger id={triggerId} aria-labelledby={`${labelId} ${triggerId}`} className="h-10 w-full">
          <ArrowDownUpIcon aria-hidden="true" className="opacity-70" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((option) => (
            <SelectItem key={sortKey(option)} value={sortKey(option)}>
              {sortLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
