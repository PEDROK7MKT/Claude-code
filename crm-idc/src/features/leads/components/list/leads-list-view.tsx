"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useLeadsList } from "@/features/leads/api/leads-queries";
import { leadsHeaderDescription, recentFreshIds } from "@/features/leads/lib/list-display";
import {
  buildLeadListHref,
  clearLeadListFilters,
  hasActiveFilters,
  nextSort,
  serializeLeadListParams,
  toLeadFilters,
  type LeadListSortColumn,
} from "@/features/leads/lib/list-params";
import { useWhatsappMessage } from "@/features/settings/api/app-settings";

import { ActiveFilterChips } from "./active-filter-chips";
import { LeadSearchInput } from "./lead-search-input";
import { LeadsFilterBar } from "./leads-filter-bar";
import { LeadsFilterSheet } from "./leads-filter-sheet";
import { LeadsPagination } from "./leads-pagination";
import { LeadsResults } from "./leads-results";
import { rememberLeadListHref } from "./list-return-href";
import { StatusQuickFilters } from "./status-quick-filters";
import { useClock } from "./use-clock";
import { useFreshLeadIds } from "./use-fresh-lead-ids";
import { useLeadListParams } from "./use-lead-list-params";

/** Leva o topo da lista para a tela ao trocar de página a partir do rodapé. */
function revealTop(node: HTMLElement | null) {
  if (!node || node.getBoundingClientRect().top >= 72) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
}

/**
 * /leads — lista de leads (spec §4.3): busca, filtros, ordenação e paginação
 * no servidor, com todo o estado na URL. Tabela no desktop, cards no celular.
 * Leads novos chegam sozinhos pelo Realtime (invalidação de ["leads"]).
 * Leads nunca são excluídos (regra 5) — só marcados como perdido pelo menu de status.
 */
export function LeadsListView() {
  const { params, replace, update } = useLeadListParams();
  const now = useClock();
  const filters = React.useMemo(() => toLeadFilters(params, now), [params, now]);
  const query = useLeadsList(filters);
  const { data, isPlaceholderData } = query;
  const filtered = hasActiveFilters(params);
  const resultsRef = React.useRef<HTMLElement>(null);
  // mensagem do WhatsApp personalizada em Configurações (a mesma do detalhe e do kanban)
  const whatsappMessage = useWhatsappMessage();

  // A página exibida pode ter sido ajustada (filtros encolheram o total): reflete na URL
  const shownPage = data && !isPlaceholderData ? data.page : undefined;
  React.useEffect(() => {
    if (shownPage !== undefined && shownPage !== params.page) update({ page: shownPage });
  }, [shownPage, params.page, update]);

  // "Voltar para leads" no detalhe volta para esta busca/filtros/página
  React.useEffect(() => {
    rememberLeadListHref(buildLeadListHref(params));
  }, [params]);

  const freshIds = useFreshLeadIds(
    serializeLeadListParams(params),
    isPlaceholderData ? undefined : data?.rows,
    query.dataUpdatedAt,
  );
  const highlighted = React.useMemo(
    () => recentFreshIds(freshIds, data?.rows ?? [], now),
    [freshIds, data?.rows, now],
  );

  const clearFilters = () => replace(clearLeadListFilters(params));
  const handleSort = (column: LeadListSortColumn) => update({ sort: nextSort(params.sort, column) });
  const goToPage = (page: number) => {
    update({ page });
    revealTop(resultsRef.current);
  };

  let description: string | undefined;
  if (data) description = leadsHeaderDescription(data.total, filtered);
  else if (!query.isError && query.fetchStatus !== "paused") description = "Carregando leads…";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description={description ? <span aria-live="polite">{description}</span> : undefined}
        actions={
          <Button asChild>
            <Link href="/leads/novo">
              <PlusIcon aria-hidden="true" />
              Novo lead
            </Link>
          </Button>
        }
      />

      <section aria-label="Busca e filtros" className="space-y-3">
        <div className="flex gap-2 md:flex-wrap md:items-center">
          <LeadSearchInput
            value={params.q}
            onSearch={(q) => update({ q })}
            busy={isPlaceholderData}
            className="min-w-0 flex-1 md:w-72 md:flex-none lg:w-80"
          />
          <LeadsFilterSheet
            params={params}
            update={update}
            total={data && !isPlaceholderData ? data.total : null}
            now={now}
            className="md:hidden"
          />
          <LeadsFilterBar params={params} update={update} now={now} className="hidden md:flex" />
        </div>
        <StatusQuickFilters status={params.status} onChange={(status) => update({ status })} />
        <ActiveFilterChips params={params} onChange={replace} onClear={clearFilters} />
      </section>

      <section ref={resultsRef} aria-label="Resultados" className="scroll-mt-20 space-y-4">
        <LeadsResults
          query={query}
          sort={params.sort}
          onSort={handleSort}
          filtered={filtered}
          onClearFilters={clearFilters}
          now={now}
          freshIds={highlighted}
          whatsappMessage={whatsappMessage}
        />
        {data && data.total > 0 ? (
          <LeadsPagination
            page={isPlaceholderData ? params.page : data.page}
            pageCount={data.pageCount}
            pageSize={data.pageSize}
            total={data.total}
            hrefFor={(page) => buildLeadListHref({ ...params, page })}
            onPageChange={goToPage}
          />
        ) : null}
      </section>
    </div>
  );
}
