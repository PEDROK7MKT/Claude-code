"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  parseLeadListParams,
  patchLeadListParams,
  serializeLeadListParams,
  type LeadListParams,
} from "@/features/leads/lib/list-params";

export interface UseLeadListParamsResult {
  /** Estado atual lido da URL (valores inválidos já descartados) */
  params: LeadListParams;
  /** Substitui o estado inteiro */
  replace: (next: LeadListParams) => void;
  /** Aplica mudanças; volta para a página 1, a menos que o patch defina `page` */
  update: (patch: Partial<LeadListParams>) => void;
}

/**
 * Estado da lista de leads na query string (?q=&status=&fonte=&servico=&periodo=|de=&ate=&ordem=&pagina=).
 * Grava com `history.replaceState` (API nativa integrada ao router do Next): atualiza
 * `useSearchParams` sem ida ao servidor, sem rolar a página e funcionando offline.
 */
export function useLeadListParams(): UseLeadListParamsResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = searchParams.toString();
  const params = React.useMemo(() => parseLeadListParams(query), [query]);

  const replace = React.useCallback(
    (next: LeadListParams) => {
      const nextQuery = serializeLeadListParams(next);
      const currentQuery = window.location.search.replace(/^\?/, "");
      if (nextQuery === currentQuery) return;
      window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [pathname],
  );

  const update = React.useCallback(
    (patch: Partial<LeadListParams>) => {
      // Parte da URL atual (e não do último render) para não perder mudanças feitas no mesmo tick
      replace(patchLeadListParams(parseLeadListParams(window.location.search), patch));
    },
    [replace],
  );

  return { params, replace, update };
}
