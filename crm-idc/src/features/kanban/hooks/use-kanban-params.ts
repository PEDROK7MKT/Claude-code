"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  parseKanbanParams,
  patchKanbanFilters,
  serializeKanbanParams,
  type KanbanFilters,
} from "@/features/kanban/lib/filters";

export interface UseKanbanParamsResult {
  filters: KanbanFilters;
  /** Substitui todos os filtros */
  replace: (next: KanbanFilters) => void;
  /** Aplica mudanças parciais */
  update: (patch: Partial<KanbanFilters>) => void;
}

/**
 * Filtros do kanban na query string (?q=&fonte=&servico=&antigos=1).
 * Grava com `history.replaceState` (integrado ao router do Next): atualiza
 * `useSearchParams` sem ida ao servidor e funcionando offline.
 */
export function useKanbanParams(): UseKanbanParamsResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = searchParams.toString();
  const filters = React.useMemo(() => parseKanbanParams(query), [query]);

  const replace = React.useCallback(
    (next: KanbanFilters) => {
      const nextQuery = serializeKanbanParams(next);
      const currentQuery = window.location.search.replace(/^\?/, "");
      if (nextQuery === currentQuery) return;
      window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [pathname],
  );

  const update = React.useCallback(
    (patch: Partial<KanbanFilters>) => {
      // parte da URL atual (e não do último render) para não perder mudanças do mesmo tick
      replace(patchKanbanFilters(parseKanbanParams(window.location.search), patch));
    },
    [replace],
  );

  return { filters, replace, update };
}
