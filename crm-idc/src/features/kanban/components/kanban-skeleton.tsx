import * as React from "react";

import { PageHeaderSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { KANBAN_COLUMNS, KANBAN_GROUPS, columnsOfGroup } from "@/features/kanban/lib/columns";
import { cn } from "@/lib/utils";

// Quantidade de cards por coluna (determinística → sem divergência de hidratação)
const CARDS_PER_COLUMN = [3, 2, 2, 1, 2, 1, 1, 2] as const;
const NAME_WIDTHS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2"] as const;

function ColumnSkeleton({ index, muted }: { index: number; muted: boolean }) {
  const cards = CARDS_PER_COLUMN[index % CARDS_PER_COLUMN.length];
  return (
    <div className={cn("flex w-[280px] shrink-0 flex-col rounded-xl border bg-zinc-200/50", muted && "border-dashed")}>
      <div className="flex items-center gap-2 px-3 pt-3.5 pb-2">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-6 w-8 rounded-full" />
      </div>
      <div className="flex min-h-28 flex-col gap-2 px-2 pb-2 md:min-h-40">
        {Array.from({ length: cards }, (_, card) => (
          <div key={card} className="bg-card space-y-2.5 rounded-lg border p-3">
            <Skeleton className={cn("h-4", NAME_WIDTHS[(index + card) % NAME_WIDTHS.length])} />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <div className="border-t pt-2">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Colunas do quadro carregando (mesmo layout rolável do quadro real). */
export function KanbanBoardSkeleton({ announce = true, className }: { announce?: boolean; className?: string }) {
  return (
    <div
      role={announce ? "status" : undefined}
      aria-busy={announce || undefined}
      aria-hidden={announce ? undefined : true}
      className={cn("-mx-4 overflow-x-hidden px-4 pt-1 pb-4 md:-mx-6 md:px-6", className)}
    >
      {announce ? <span className="sr-only">Carregando quadro…</span> : null}
      <div className="flex w-max gap-6">
        {KANBAN_GROUPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <Skeleton className="mx-1 h-3 w-28" />
            <div className="flex gap-3">
              {columnsOfGroup(group.id).map((column) => (
                <ColumnSkeleton
                  key={column.status}
                  index={KANBAN_COLUMNS.indexOf(column)}
                  muted={column.tone === "muted"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Página do kanban carregando (loading.tsx e fallback do Suspense). */
export function KanbanSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Carregando o kanban…</span>
      <PageHeaderSkeleton />
      <div aria-hidden="true" className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full rounded-md md:h-9 lg:w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <Skeleton className="h-5 w-56 lg:ml-auto" />
      </div>
      <KanbanBoardSkeleton announce={false} />
    </div>
  );
}
