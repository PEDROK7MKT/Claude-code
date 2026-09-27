"use client";

import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { pageRangeLabel, paginationItems } from "@/features/leads/lib/list-display";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface LeadsPaginationProps {
  /** Página exibida (1-based) */
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  /** Link da página (mesma URL com `pagina=`) — permite abrir em nova aba */
  hrefFor: (page: number) => string;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Clique simples navega na própria lista; Ctrl/⌘/Shift/botão do meio seguem o link. */
function isPlainClick(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

const DISABLED_LINK = "pointer-events-none opacity-50";

/**
 * "Mostrando 21–40 de 137" + paginação. No celular: anterior · "2 de 7" · próxima;
 * a partir de `sm`, números de página com reticências.
 */
export function LeadsPagination({
  page,
  pageCount,
  pageSize,
  total,
  hrefFor,
  onPageChange,
  className,
}: LeadsPaginationProps) {
  const go = (target: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    if (target !== page) onPageChange(target);
  };

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  return (
    <div className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}>
      <p className="text-muted-foreground text-sm tabular-nums">{pageRangeLabel(page, pageSize, total)}</p>
      {pageCount > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={hasPrev ? hrefFor(page - 1) : undefined}
                onClick={hasPrev ? go(page - 1) : undefined}
                aria-disabled={!hasPrev || undefined}
                tabIndex={hasPrev ? undefined : -1}
                className={cn(!hasPrev && DISABLED_LINK)}
              />
            </PaginationItem>

            <PaginationItem className="sm:hidden">
              <span className="text-muted-foreground px-2 text-sm tabular-nums">
                <span className="sr-only">Página </span>
                {formatNumber(page)} de {formatNumber(pageCount)}
              </span>
            </PaginationItem>

            {paginationItems(page, pageCount).map((item) =>
              typeof item === "number" ? (
                <PaginationItem key={item} className="hidden sm:list-item">
                  <PaginationLink
                    href={hrefFor(item)}
                    onClick={go(item)}
                    isActive={item === page}
                    aria-label={item === page ? `Página ${item}, atual` : `Ir para a página ${item}`}
                    className="tabular-nums"
                  >
                    {formatNumber(item)}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item} className="hidden sm:list-item">
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={hasNext ? hrefFor(page + 1) : undefined}
                onClick={hasNext ? go(page + 1) : undefined}
                aria-disabled={!hasNext || undefined}
                tabIndex={hasNext ? undefined : -1}
                className={cn(!hasNext && DISABLED_LINK)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
