import * as React from "react";

import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const QUICK_FILTER_WIDTHS = ["w-16", "w-20", "w-24", "w-24", "w-28", "w-32"] as const;

/** Barra de busca + filtros enquanto a lista carrega (mesmo layout da real). */
export function LeadsToolbarSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("space-y-3", className)}>
      <div className="flex gap-2 md:flex-wrap md:items-center">
        <Skeleton className="h-10 flex-1 md:h-9 md:w-72 md:flex-none lg:w-80" />
        <Skeleton className="h-10 w-28 md:hidden" />
        <div className="hidden gap-2 md:flex">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {QUICK_FILTER_WIDTHS.map((width, index) => (
          <Skeleton key={index} className={cn("h-8 shrink-0", width)} />
        ))}
      </div>
    </div>
  );
}

/** Página /leads carregando: cabeçalho, filtros e tabela (cards no celular). */
export function LeadsListSkeleton() {
  return (
    <div className="space-y-5">
      {/* cabeçalho no layout do PageHeader: título, total e "Novo lead" */}
      <div aria-hidden="true" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <LeadsToolbarSkeleton />
      <TableSkeleton rows={10} columns={7} />
    </div>
  );
}
