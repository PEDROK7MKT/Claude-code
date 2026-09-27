"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PhoneLink } from "@/components/shared/phone-link";
import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { StatusChangeMenu } from "@/features/leads/components/status";
import { formatEntryAge, leadDetailHref } from "@/features/leads/lib/list-display";
import type { LeadListSort, LeadListSortColumn } from "@/features/leads/lib/list-params";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";

import { AppointmentInfo } from "./appointment-info";
import { openInNewTab, rowClickIntent } from "./row-navigation";
import { SortableHead } from "./sortable-head";
import { flashFreshRow } from "./use-fresh-lead-ids";

export interface LeadsTableProps {
  rows: readonly Lead[];
  sort: LeadListSort;
  onSort: (column: LeadListSortColumn) => void;
  /** Relógio da lista (ms) — "Hoje", atrasados, "há X" */
  now: number;
  /** Leads que acabaram de chegar (destaque) */
  freshIds: ReadonlySet<string>;
  /** Próxima página/filtro carregando (mantém a anterior esmaecida) */
  busy?: boolean;
  className?: string;
}

/** Tabela de leads (≥ md): colunas ordenáveis e linha inteira clicável → detalhe. */
export function LeadsTable({ rows, sort, onSort, now, freshIds, busy = false, className }: LeadsTableProps) {
  return (
    <div
      aria-busy={busy}
      className={cn(
        "bg-card overflow-hidden rounded-xl border shadow-xs transition-opacity duration-200",
        busy && "opacity-60",
        className,
      )}
    >
      <Table>
        <TableCaption className="sr-only">
          Lista de leads. Abra o detalhe pelo nome; o status e o telefone têm ações próprias.
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <SortableHead column="name" sort={sort} onSort={onSort} className="pl-4" />
            <SortableHead column="phone" sort={sort} onSort={onSort} />
            <SortableHead column="source" sort={sort} onSort={onSort} />
            <SortableHead column="service" sort={sort} onSort={onSort} />
            <SortableHead column="status" sort={sort} onSort={onSort} />
            <SortableHead column="created_at" sort={sort} onSort={onSort} />
            <SortableHead column="scheduled_at" sort={sort} onSort={onSort} className="pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((lead) => (
            <LeadTableRow key={lead.id} lead={lead} now={now} fresh={freshIds.has(lead.id)} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LeadTableRow({ lead, now, fresh }: { lead: Lead; now: number; fresh: boolean }) {
  const router = useRouter();
  const href = leadDetailHref(lead.id);

  const handleClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const intent = rowClickIntent(event);
    if (intent === "same") router.push(href);
    else if (intent === "new-tab") openInNewTab(href);
  };

  return (
    <TableRow
      ref={fresh ? flashFreshRow : undefined}
      data-fresh={fresh || undefined}
      onClick={handleClick}
      onAuxClick={(event) => {
        if (event.button === 1 && rowClickIntent(event) === "new-tab") openInNewTab(href);
      }}
      className="focus-within:bg-muted/40 cursor-pointer"
    >
      <TableCell className="max-w-64 py-3 pl-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={href}
            title={lead.name}
            className="text-foreground hover:text-primary focus-visible:ring-ring/50 truncate rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
          >
            {lead.name}
          </Link>
          {fresh ? (
            <Badge variant="gold" className="shrink-0">
              agora
            </Badge>
          ) : null}
        </div>
        {lead.service_detail ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs" title={lead.service_detail}>
            {lead.service_detail}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="px-3">
        <PhoneLink phone={lead.phone} name={lead.name} />
      </TableCell>
      <TableCell className="max-w-48 px-3">
        <SourceBadge source={lead.source} variant="plain" className="text-foreground" />
        {lead.campaign ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs" title={lead.campaign}>
            {lead.campaign}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="max-w-48 px-3">
        {lead.service ? (
          <span className="block truncate" title={SERVICE_LABEL[lead.service]}>
            {SERVICE_LABEL[lead.service]}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="px-3">
        <StatusChangeMenu lead={lead} />
      </TableCell>
      <TableCell className="px-3">
        <time
          dateTime={lead.created_at}
          title={`Entrou ${formatEntryAge(lead.created_at, now)}`}
          className="tabular-nums"
        >
          {formatDateTime(lead.created_at)}
        </time>
      </TableCell>
      <TableCell className="pr-4 pl-3">
        <AppointmentInfo lead={lead} now={now} />
      </TableCell>
    </TableRow>
  );
}
