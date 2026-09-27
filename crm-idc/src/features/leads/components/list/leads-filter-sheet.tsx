"use client";

import * as React from "react";
import { FilterXIcon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { showResultsLabel } from "@/features/leads/lib/list-display";
import {
  filterButtonLabel,
  SERVICE_FILTER_OPTIONS,
  SOURCE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/features/leads/lib/list-filters";
import { countPanelFilters, type LeadListParams } from "@/features/leads/lib/list-params";
import { SOURCE_COLORS, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadSource, LeadStatus } from "@/types/database";

import { FilterToggleChips } from "./filter-toggle-chips";
import { PeriodFilter } from "./period-filter";
import { SortSelect } from "./sort-select";

export interface LeadsFilterSheetProps {
  params: LeadListParams;
  update: (patch: Partial<LeadListParams>) => void;
  /** Total encontrado com os filtros atuais (null enquanto carrega) */
  total: number | null;
  now: number;
  className?: string;
}

const statusColor = (status: LeadStatus) => STATUS_META[status].color;
const sourceColor = (source: LeadSource) => SOURCE_COLORS[source];

/**
 * Filtros no celular: botão "Filtros (3)" abre um painel inferior com
 * ordenação, status, fonte, serviço e período. Cada toque já filtra a lista;
 * o rodapé mostra quantos leads ficaram.
 */
export function LeadsFilterSheet({ params, update, total, now, className }: LeadsFilterSheetProps) {
  const active = countPanelFilters(params);
  // limpa só o que está no painel (a busca e a ordenação continuam)
  const clearPanel = () => update({ status: [], source: [], service: [], period: null });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-active={active > 0}
          className={cn(
            "data-[active=true]:border-primary/40 data-[active=true]:bg-primary/5 data-[active=true]:text-primary h-10 shrink-0",
            className,
          )}
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          <span className="tabular-nums">{filterButtonLabel(params)}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-2xl p-0">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Filtros e ordenação</SheetTitle>
          <SheetDescription>A lista é atualizada a cada escolha.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
          <SortSelect sort={params.sort} onChange={(sort) => update({ sort })} />
          <Separator />
          <FilterToggleChips
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            selected={params.status}
            onChange={(status) => update({ status })}
            colorOf={statusColor}
          />
          <FilterToggleChips
            label="Fonte"
            options={SOURCE_FILTER_OPTIONS}
            selected={params.source}
            onChange={(source) => update({ source })}
            colorOf={sourceColor}
          />
          <FilterToggleChips
            label="Serviço"
            options={SERVICE_FILTER_OPTIONS}
            selected={params.service}
            onChange={(service) => update({ service })}
          />
          <div className="space-y-2.5">
            {/* o seletor já tem rótulo acessível próprio */}
            <p aria-hidden="true" className="text-sm font-medium">
              Período de entrada
            </p>
            <PeriodFilter period={params.period} onChange={(period) => update({ period })} now={now} layout="stacked" />
          </div>
        </div>

        <SheetFooter className="bg-card flex-row gap-2 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" className="h-10 flex-1" disabled={active === 0} onClick={clearPanel}>
            <FilterXIcon aria-hidden="true" />
            Limpar
          </Button>
          <SheetClose asChild>
            <Button type="button" className="h-10 flex-[2] tabular-nums">
              {showResultsLabel(total)}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
