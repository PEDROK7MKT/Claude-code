"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDaysIcon, EllipsisVerticalIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PhoneLink } from "@/components/shared/phone-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadQuickActions, useLeadStatusPending } from "@/features/leads/components/status";
import { SERVICE_LABEL } from "@/lib/constants";
import { formatDateTime, formatTime } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";
import { isAwaitingAttendance, type AppointmentDay } from "../../lib/dentist-dashboard";
import { ListSkeleton } from "./list-skeleton";

export interface WeekAppointmentsCardProps {
  days: ReadonlyArray<AppointmentDay<Lead>> | null;
  /** "21/09 – 27/09/2026" */
  weekLabel: string;
  now: number;
  loading: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** "Agendamentos da semana" (seg–dom): consultas agendadas/confirmadas agrupadas por dia. */
export function WeekAppointmentsCard({
  days,
  weekLabel,
  now,
  loading,
  onRetry,
  retrying,
  className,
}: WeekAppointmentsCardProps) {
  const total = days?.reduce((sum, day) => sum + day.items.length, 0) ?? 0;

  return (
    <Card className={cn("min-w-0 gap-4", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <CalendarDaysIcon className="size-4" />
          </span>
          <h2 className="text-base leading-tight font-semibold">Agendamentos da semana</h2>
        </CardTitle>
        <CardDescription>
          <span className="tabular-nums">{weekLabel}</span> · agendados e confirmados
        </CardDescription>
        {days && total > 0 ? (
          <CardAction>
            <Badge variant="secondary" className="tabular-nums">
              {formatNumber(total)} {total === 1 ? "consulta" : "consultas"}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        {loading ? (
          <ListSkeleton rows={4} label="Carregando agenda da semana…" />
        ) : !days ? (
          <ErrorState size="sm" onRetry={onRetry} retrying={retrying} />
        ) : days.length === 0 ? (
          <EmptyState
            size="sm"
            icon={CalendarDaysIcon}
            title="Nenhum agendamento nesta semana"
            description="Leads em contato podem ser agendados pela lista de leads ou pelo kanban."
            action={{ label: "Ver leads em contato", href: "/leads?status=em_contato", variant: "outline" }}
          />
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <section
                key={day.dateKey}
                aria-label={`${day.heading}${day.isToday ? " (hoje)" : ""}`}
                className={cn(
                  "rounded-xl px-3 py-2",
                  day.isToday ? "bg-primary/5 ring-primary/20 ring-1" : day.isPast ? "opacity-90" : undefined,
                )}
              >
                <h3 className="flex items-center gap-2 py-1 text-sm font-semibold">
                  <span className={cn(day.isToday ? "text-primary" : "text-foreground")}>{day.heading}</span>
                  {day.isToday ? (
                    <Badge className="h-5 px-1.5 text-[10px] tracking-wide uppercase">Hoje</Badge>
                  ) : null}
                  <span className="text-muted-foreground ml-auto text-xs font-normal tabular-nums">
                    {formatNumber(day.items.length)}
                  </span>
                </h3>
                <ul className="divide-y">
                  {day.items.map((lead) => (
                    <AppointmentRow key={lead.id} lead={lead} awaiting={isAwaitingAttendance(lead, now)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentRow({ lead, awaiting }: { lead: Lead; awaiting: boolean }) {
  const pending = useLeadStatusPending(lead.id);
  const service = lead.service ? SERVICE_LABEL[lead.service] : null;

  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-3 py-3">
      <time
        dateTime={lead.scheduled_at ?? undefined}
        title={formatDateTime(lead.scheduled_at)}
        className={cn("pt-0.5 text-sm font-semibold tabular-nums", awaiting ? "text-amber-700" : "text-foreground")}
      >
        {formatTime(lead.scheduled_at)}
      </time>

      <div className="min-w-0 space-y-1">
        <Link
          href={`/leads/${lead.id}`}
          className="text-foreground block truncate rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {lead.name}
        </Link>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <PhoneLink phone={lead.phone} name={lead.name} className="text-xs" />
          {service ? <span className="truncate">{service}</span> : null}
          <StatusBadge status={lead.status} />
        </div>
        {awaiting ? (
          <p className="flex items-center gap-1 text-xs font-medium text-amber-700">
            <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
            Horário passou — registre se compareceu
          </p>
        ) : null}
      </div>

      <LeadQuickActions
        lead={lead}
        layout="menu"
        size="sm"
        align="end"
        trigger={
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Alterar status de ${lead.name}`}>
            {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <EllipsisVerticalIcon aria-hidden="true" />}
          </Button>
        }
      />
    </li>
  );
}
