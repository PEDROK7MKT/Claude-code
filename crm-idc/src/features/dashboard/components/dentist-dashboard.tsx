"use client";

import * as React from "react";
import Link from "next/link";
import { KanbanSquareIcon, UsersIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-context";
import { useLeads } from "@/features/leads/api/leads-queries";
import { useWhatsappMessage } from "@/features/settings/api/app-settings";
import { formatMonthYear, startOfDateKey } from "@/lib/dates";
import { firstName } from "@/lib/format";
import { APPOINTMENT_STATUSES } from "@/lib/metrics";
import type { LeadsQueryOptions } from "@/features/leads/api/leads-queries";
import { useNow } from "@/hooks/use-now";
import {
  getDentistDashboardRanges,
  groupAppointmentsByDay,
  sortWaitingLeads,
  summarizeAttendance,
  summarizeNewLeads,
} from "../lib/dentist-dashboard";
import { capitalize, longDateLabel } from "../lib/labels";
import { formatRangeLabel } from "../lib/period";
import { queryLoadState } from "../lib/query-state";
import { AttendanceCard } from "./dentist/attendance-card";
import { NewLeadsTodayCard } from "./dentist/new-leads-today-card";
import { WaitingLeadsCard } from "./dentist/waiting-leads-card";
import { WeekAppointmentsCard } from "./dentist/week-appointments-card";
import { LiveIndicator } from "./live-indicator";

/** Fila de espera: todos os leads em "novo" (poucos por natureza — são respondidos no dia). */
const WAITING_QUERY: LeadsQueryOptions = { status: ["novo"] };

/**
 * Dashboard simplificado do dentista (spec §4.2): leads novos hoje, agenda da
 * semana com ações rápidas, comparecimento do mês e fila de leads aguardando
 * resposta. Tudo em tempo real via invalidação de ["leads"] pelo Realtime.
 */
export function DentistDashboard() {
  const { profile } = useSession();
  const { now, today } = useNow();
  // mensagem do WhatsApp personalizada em Configurações (a mesma da lista, do kanban e do detalhe)
  const whatsappMessage = useWhatsappMessage();
  // Intervalos por dia: as chaves das consultas só mudam à meia-noite
  const ranges = React.useMemo(() => getDentistDashboardRanges(startOfDateKey(today)), [today]);
  const appointmentsQueryOptions = React.useMemo<LeadsQueryOptions>(
    () => ({ ...ranges.appointmentsQuery, status: [...APPOINTMENT_STATUSES] }),
    [ranges],
  );

  const recentQuery = useLeads(ranges.recentQuery);
  const appointmentsQuery = useLeads(appointmentsQueryOptions);
  const waitingQuery = useLeads(WAITING_QUERY);

  const recent = recentQuery.data;
  const appointments = appointmentsQuery.data;
  const waiting = waitingQuery.data;

  const newLeads = React.useMemo(() => (recent ? summarizeNewLeads(recent, ranges) : null), [recent, ranges]);
  const weekDays = React.useMemo(
    () => (appointments ? groupAppointmentsByDay(appointments, ranges.week, now) : null),
    [appointments, ranges, now],
  );
  const attendance = React.useMemo(
    () => (appointments ? summarizeAttendance(appointments, ranges.month, now) : null),
    [appointments, ranges, now],
  );
  const waitingLeads = React.useMemo(() => (waiting ? sortWaitingLeads(waiting) : null), [waiting]);

  // Offline sem cópia neste aparelho (ex.: dia novo — as chaves incluem a data) a
  // consulta fica pausada: cada card mostra "Sem conexão" em vez de esqueleto sem fim
  const recentState = queryLoadState(recentQuery);
  const appointmentsState = queryLoadState(appointmentsQuery);
  const waitingState = queryLoadState(waitingQuery);
  const hasSavedData = [recentState, appointmentsState, waitingState].some((state) => state !== "offline");

  const name = firstName(profile.full_name);

  return (
    <div className="space-y-6">
      <PageHeader
        title={name ? `Olá, ${name}` : "Dashboard"}
        description={`${longDateLabel(startOfDateKey(today))} · resumo do dia e da semana`}
        actions={
          <>
            <LiveIndicator hasSavedData={hasSavedData} className="order-last md:order-first" />
            <Button asChild variant="outline" size="sm">
              <Link href="/kanban">
                <KanbanSquareIcon aria-hidden="true" />
                Kanban
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/leads">
                <UsersIcon aria-hidden="true" />
                Ver leads
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <NewLeadsTodayCard
          summary={newLeads}
          loading={recentState === "loading"}
          offline={recentState === "offline"}
          onRetry={() => void recentQuery.refetch()}
          retrying={recentQuery.isFetching}
        />
        <AttendanceCard
          summary={attendance}
          monthLabel={capitalize(formatMonthYear(ranges.month.from))}
          loading={appointmentsState === "loading"}
          offline={appointmentsState === "offline"}
          onRetry={() => void appointmentsQuery.refetch()}
          retrying={appointmentsQuery.isFetching}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <WeekAppointmentsCard
          className="lg:col-span-3"
          days={weekDays}
          weekLabel={formatRangeLabel(ranges.week)}
          now={now}
          whatsappMessage={whatsappMessage}
          loading={appointmentsState === "loading"}
          offline={appointmentsState === "offline"}
          onRetry={() => void appointmentsQuery.refetch()}
          retrying={appointmentsQuery.isFetching}
        />
        <WaitingLeadsCard
          className="lg:col-span-2"
          leads={waitingLeads}
          now={now}
          whatsappMessage={whatsappMessage}
          loading={waitingState === "loading"}
          offline={waitingState === "offline"}
          onRetry={() => void waitingQuery.refetch()}
          retrying={waitingQuery.isFetching}
        />
      </div>
    </div>
  );
}
