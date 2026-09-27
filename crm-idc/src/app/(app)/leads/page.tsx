import type { Metadata } from "next";
import { Suspense } from "react";

import { LeadsListSkeleton } from "@/features/leads/components/list/leads-list-skeleton";
import { LeadsListView } from "@/features/leads/components/list/leads-list-view";

export const metadata: Metadata = {
  title: "Leads",
};

/**
 * /leads — lista de leads com busca, filtros, ordenação e paginação (spec §4.3).
 * O estado fica na URL (?q=&status=&fonte=&servico=&periodo=|de=&ate=&ordem=&pagina=);
 * a view lê com useSearchParams, por isso fica dentro de <Suspense>.
 */
export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsListSkeleton />}>
      <LeadsListView />
    </Suspense>
  );
}
