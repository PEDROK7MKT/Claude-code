"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { PhoneLink } from "@/components/shared/phone-link";
import { SourceBadge } from "@/components/shared/source-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { formatNumber, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";
import {
  DEFAULT_REPORT_SORT,
  INITIAL_SORT_DIR,
  REPORT_SORT_LABEL,
  isStaleAppointment,
  pageWindow,
  paginate,
  reportTableTotals,
  sortReportLeads,
  toggleSort,
  type ReportSort,
  type ReportSortKey,
  type ReportTableTotals,
} from "../lib/table";

const PAGE_SIZE = 25;
const SORT_KEYS = Object.keys(REPORT_SORT_LABEL) as ReportSortKey[];

function isSortKey(value: string): value is ReportSortKey {
  return (SORT_KEYS as readonly string[]).includes(value);
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

function serviceLabel(lead: Pick<Lead, "service">): string {
  return lead.service ? (SERVICE_LABEL[lead.service] ?? lead.service) : "—";
}

interface ReportLeadsTableProps {
  leads: readonly Lead[];
  monthLabel: string;
  /** Modelo da mensagem do WhatsApp (Configurações); padrão: DEFAULT_WHATSAPP_MESSAGE. */
  whatsappMessage?: string;
}

/** Leads que entraram no mês, com o status atual: tabela ordenável (desktop) e cards (mobile). */
export function ReportLeadsTable({ leads, monthLabel, whatsappMessage }: ReportLeadsTableProps) {
  const [sort, setSort] = React.useState<ReportSort>(DEFAULT_REPORT_SORT);
  const [page, setPage] = React.useState(1);
  const listRef = React.useRef<HTMLDivElement>(null);

  const sorted = React.useMemo(() => sortReportLeads(leads, sort), [leads, sort]);
  const current = paginate(sorted, page, PAGE_SIZE);
  const totals = React.useMemo(() => reportTableTotals(leads), [leads]);

  const changeSort = (next: ReportSort) => {
    setSort(next);
    setPage(1);
  };

  const goToPage = (next: number) => {
    setPage(next);
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <Card className="gap-0 overflow-hidden py-0" ref={listRef}>
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Leads do período</CardTitle>
        <CardDescription>
          {plural(totals.leads, "lead entrou", "leads entraram")} em {monthLabel} · status atual de cada um
        </CardDescription>
        <CardAction className="md:hidden">
          <MobileSort sort={sort} onChange={changeSort} />
        </CardAction>
      </CardHeader>

      {/* desktop/tablet: tabela */}
      <div className="hidden md:block">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <SortableHead column="name" sort={sort} onSort={changeSort} className="pl-6" />
              <SortableHead column="source" sort={sort} onSort={changeSort} />
              <SortableHead column="service" sort={sort} onSort={changeSort} />
              <SortableHead column="status" sort={sort} onSort={changeSort} />
              <SortableHead column="created_at" sort={sort} onSort={changeSort} />
              <SortableHead column="scheduled_at" sort={sort} onSort={changeSort} className="pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.rows.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="py-2.5 pl-6">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-foreground hover:text-primary focus-visible:ring-ring/50 block max-w-[220px] truncate rounded-sm font-medium outline-none focus-visible:ring-[3px]"
                  >
                    {lead.name}
                  </Link>
                  <PhoneLink
                    phone={lead.phone}
                    name={lead.name}
                    message={whatsappMessage}
                    showIcon={false}
                    className="text-xs"
                  />
                </TableCell>
                <TableCell>
                  <SourceBadge source={lead.source} variant="plain" />
                </TableCell>
                <TableCell className={cn(!lead.service && "text-muted-foreground")}>{serviceLabel(lead)}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="tabular-nums">{formatDateTime(lead.created_at)}</TableCell>
                <TableCell className="pr-6 tabular-nums">
                  <AppointmentText lead={lead} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TotalsRow totals={totals} />
          </TableFooter>
        </Table>
      </div>

      {/* mobile: cards empilhados */}
      <ul className="divide-y md:hidden" aria-label={`Leads de ${monthLabel}`}>
        {current.rows.map((lead) => (
          <li key={lead.id}>
            <LeadCard lead={lead} />
          </li>
        ))}
      </ul>
      <MobileTotals totals={totals} />

      {current.pageCount > 1 ? (
        <div className="flex flex-col items-center gap-3 border-t px-4 py-3 sm:flex-row sm:justify-between sm:px-6 print:hidden">
          <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
            Mostrando {formatNumber(current.from)}–{formatNumber(current.to)} de {formatNumber(sorted.length)}
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPreviousButton disabled={current.page === 1} onClick={() => goToPage(current.page - 1)} />
              </PaginationItem>
              {pageWindow(current.page, current.pageCount).map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`} className="hidden sm:block">
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item} className="hidden sm:block">
                    <PaginationButton
                      isActive={item === current.page}
                      aria-label={`Página ${item}`}
                      onClick={() => goToPage(item)}
                    >
                      {item}
                    </PaginationButton>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNextButton
                  disabled={current.page === current.pageCount}
                  onClick={() => goToPage(current.page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </Card>
  );
}

function SortableHead({
  column,
  sort,
  onSort,
  className,
}: {
  column: ReportSortKey;
  sort: ReportSort;
  onSort: (sort: ReportSort) => void;
  className?: string;
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDownIcon : sort.dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("h-11", className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("-ml-2 h-8 gap-1 px-2 font-medium", active ? "text-foreground" : "text-muted-foreground")}
        onClick={() => onSort(toggleSort(sort, column))}
      >
        {REPORT_SORT_LABEL[column]}
        <Icon aria-hidden="true" className={cn("size-3.5", !active && "opacity-60")} />
        <span className="sr-only">
          {active ? `(ordenado ${sort.dir === "asc" ? "crescente" : "decrescente"})` : "(ordenar)"}
        </span>
      </Button>
    </TableHead>
  );
}

function AppointmentText({ lead }: { lead: Pick<Lead, "status" | "scheduled_at"> }) {
  if (!lead.scheduled_at) return <span className="text-muted-foreground">—</span>;
  if (isStaleAppointment(lead)) {
    return (
      <span className="text-muted-foreground line-through" title="Consulta cancelada ou lead perdido">
        {formatDateTime(lead.scheduled_at)}
        <span className="sr-only"> (consulta sem efeito)</span>
      </span>
    );
  }
  return <span>{formatDateTime(lead.scheduled_at)}</span>;
}

function TotalsRow({ totals }: { totals: ReportTableTotals }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="py-3 pl-6">
        <span className="font-semibold">Total</span>{" "}
        <span className="text-muted-foreground tabular-nums">· {plural(totals.leads, "lead", "leads")}</span>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {plural(totals.sources, "fonte", "fontes")} · {formatNumber(totals.googleAds)} Google Ads
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{plural(totals.services, "serviço", "serviços")}</TableCell>
      <TableCell className="tabular-nums">
        {plural(totals.scheduled, "agendado", "agendados")}
        <span className="text-muted-foreground"> · {plural(totals.attended, "compareceu", "compareceram")}</span>
      </TableCell>
      <TableCell />
      <TableCell className="pr-6 tabular-nums">{plural(totals.withAppointment, "consulta", "consultas")}</TableCell>
    </TableRow>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="hover:bg-muted/40 focus-visible:ring-ring/50 block px-4 py-3.5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground truncate font-medium">{lead.name}</p>
          <p className="text-muted-foreground text-xs tabular-nums">{formatPhone(lead.phone)}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="min-w-0">
          <dt className="text-muted-foreground">Fonte</dt>
          <dd className="mt-0.5">
            <SourceBadge source={lead.source} variant="plain" className="text-foreground" />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Serviço</dt>
          <dd className="mt-0.5 truncate">{serviceLabel(lead)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Entrada</dt>
          <dd className="mt-0.5 tabular-nums">{formatDateTime(lead.created_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Agendamento</dt>
          <dd className="mt-0.5 tabular-nums">
            <AppointmentText lead={lead} />
          </dd>
        </div>
      </dl>
    </Link>
  );
}

function MobileTotals({ totals }: { totals: ReportTableTotals }) {
  return (
    <dl className="bg-muted/50 grid grid-cols-2 gap-x-4 gap-y-2 border-t px-4 py-3 text-xs md:hidden">
      <div>
        <dt className="text-muted-foreground">Total de leads</dt>
        <dd className="text-sm font-semibold tabular-nums">{formatNumber(totals.leads)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Agendados</dt>
        <dd className="text-sm font-semibold tabular-nums">{formatNumber(totals.scheduled)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Compareceram</dt>
        <dd className="text-sm font-semibold tabular-nums">{formatNumber(totals.attended)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Google Ads</dt>
        <dd className="text-sm font-semibold tabular-nums">{formatNumber(totals.googleAds)}</dd>
      </div>
    </dl>
  );
}

function MobileSort({ sort, onChange }: { sort: ReportSort; onChange: (sort: ReportSort) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={sort.key}
        onValueChange={(key) => {
          if (isSortKey(key)) onChange({ key, dir: INITIAL_SORT_DIR[key] });
        }}
      >
        <SelectTrigger size="sm" aria-label="Ordenar por" className="w-[128px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {SORT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {REPORT_SORT_LABEL[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={sort.dir === "asc" ? "Ordem crescente (inverter)" : "Ordem decrescente (inverter)"}
        onClick={() => onChange({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
      >
        {sort.dir === "asc" ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />}
      </Button>
    </div>
  );
}
