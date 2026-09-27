import type { Metadata } from "next";
import { Suspense } from "react";

import { KanbanSkeleton } from "@/features/kanban/components/kanban-skeleton";
import { KanbanView } from "@/features/kanban/components/kanban-view";

export const metadata: Metadata = {
  title: "Kanban",
};

/**
 * /kanban — funil em colunas com drag & drop (spec §4.4). Os filtros ficam na
 * URL (?q=&fonte=&servico=&antigos=1) e a view lê com useSearchParams, por
 * isso fica dentro de <Suspense>.
 */
export default function KanbanPage() {
  return (
    <Suspense fallback={<KanbanSkeleton />}>
      <KanbanView />
    </Suspense>
  );
}
