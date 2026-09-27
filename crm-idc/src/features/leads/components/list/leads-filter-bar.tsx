"use client";

import * as React from "react";
import { CircleDotIcon, MegaphoneIcon, StethoscopeIcon } from "lucide-react";

import { SourceBadge } from "@/components/shared/source-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  SERVICE_FILTER_OPTIONS,
  SOURCE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/features/leads/lib/list-filters";
import type { LeadListParams } from "@/features/leads/lib/list-params";
import { cn } from "@/lib/utils";

import { MultiSelectFilter } from "./multi-select-filter";
import { PeriodFilter } from "./period-filter";

export interface LeadsFilterBarProps {
  params: LeadListParams;
  update: (patch: Partial<LeadListParams>) => void;
  now: number;
  className?: string;
}

/** Filtros em menus (≥ md): status, fonte, serviço e período de entrada. */
export function LeadsFilterBar({ params, update, now, className }: LeadsFilterBarProps) {
  return (
    <div role="group" aria-label="Filtros" className={cn("flex flex-wrap items-center gap-2", className)}>
      <MultiSelectFilter
        label="Status"
        icon={CircleDotIcon}
        options={STATUS_FILTER_OPTIONS}
        selected={params.status}
        onChange={(status) => update({ status })}
        renderOption={(option) => <StatusBadge status={option.value} />}
      />
      <MultiSelectFilter
        label="Fonte"
        icon={MegaphoneIcon}
        options={SOURCE_FILTER_OPTIONS}
        selected={params.source}
        onChange={(source) => update({ source })}
        renderOption={(option) => <SourceBadge source={option.value} variant="plain" className="text-foreground text-sm" />}
      />
      <MultiSelectFilter
        label="Serviço"
        icon={StethoscopeIcon}
        options={SERVICE_FILTER_OPTIONS}
        selected={params.service}
        onChange={(service) => update({ service })}
      />
      <PeriodFilter period={params.period} onChange={(period) => update({ period })} now={now} />
    </div>
  );
}
