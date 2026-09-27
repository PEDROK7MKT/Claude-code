"use client";

import * as React from "react";
import { CalendarCheck2Icon } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND, STATUS_META } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { attendanceLevel, type AttendanceLevel, type AttendanceSummary } from "../../lib/dentist-dashboard";

const LEVEL_META: Record<AttendanceLevel, { color: string; label: string; className: string }> = {
  good: { color: BRAND.success, label: "Ótimo comparecimento", className: "text-green-700" },
  fair: { color: BRAND.warning, label: "Comparecimento regular", className: "text-yellow-800" },
  poor: { color: BRAND.error, label: "Muitas faltas", className: "text-red-700" },
  none: { color: BRAND.muted, label: "Sem consultas finalizadas", className: "text-muted-foreground" },
};

export interface AttendanceCardProps {
  summary: AttendanceSummary | null;
  /** "Setembro de 2026" */
  monthLabel: string;
  loading: boolean;
  /** Offline e sem cópia neste aparelho: "Sem conexão" + "Tentar novamente" no lugar do erro genérico. */
  offline?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** "Taxa de comparecimento do mês": compareceu / (compareceu + não compareceu), com anel de progresso. */
export function AttendanceCard({
  summary,
  monthLabel,
  loading,
  offline = false,
  onRetry,
  retrying,
  className,
}: AttendanceCardProps) {
  return (
    <Card className={cn("min-w-0 gap-4", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <CalendarCheck2Icon className="size-4" />
          </span>
          <h2 className="text-base leading-tight font-semibold">Taxa de comparecimento</h2>
        </CardTitle>
        <CardDescription>{monthLabel} · consultas do mês</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div role="status" className="flex items-center gap-5">
            <span className="sr-only">Carregando comparecimento…</span>
            <Skeleton className="size-28 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : !summary ? (
          <ErrorState
            size="sm"
            title={offline ? "Sem conexão com a internet" : undefined}
            message={offline ? "As consultas do mês ainda não foram baixadas neste aparelho." : undefined}
            onRetry={onRetry}
            retrying={retrying}
          />
        ) : (
          <AttendanceBody summary={summary} />
        )}
      </CardContent>
    </Card>
  );
}

function AttendanceBody({ summary }: { summary: AttendanceSummary }) {
  const level = attendanceLevel(summary.rate);
  const meta = LEVEL_META[level];
  const finished = summary.attended + summary.missed;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <ProgressRing value={summary.rate} color={meta.color} />
      <div className="w-full min-w-0 flex-1 space-y-3">
        <p className={cn("text-sm font-medium", meta.className)}>
          {meta.label}
          {finished > 0 ? (
            <span className="text-muted-foreground font-normal">
              {" "}
              · {formatNumber(summary.attended)} de {formatNumber(finished)}
            </span>
          ) : null}
        </p>
        <ul className="space-y-1.5 text-sm">
          <CountRow color={STATUS_META.compareceu.color} label="Compareceram" value={summary.attended} />
          <CountRow color={STATUS_META.nao_compareceu.color} label="Faltaram" value={summary.missed} />
          {summary.awaiting > 0 ? (
            <CountRow color={BRAND.warning} label="Aguardando registro" value={summary.awaiting} ring />
          ) : null}
          <CountRow color={STATUS_META.agendado.color} label="Ainda por vir" value={summary.upcoming} ring />
        </ul>
      </div>
    </div>
  );
}

function CountRow({ color, label, value, ring = false }: { color: string; label: string; value: number; ring?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={ring ? { boxShadow: `inset 0 0 0 2px ${color}` } : { backgroundColor: color }}
      />
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="text-foreground font-semibold tabular-nums">{formatNumber(value)}</span>
    </li>
  );
}

const RING_SIZE = 112;
const RING_STROKE = 10;

/** Anel de progresso: preenchimento na cor da faixa, trilho no mesmo tom mais claro. */
function ProgressRing({ value, color }: { value: number | null; color: string }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, Math.max(0, value ?? 0));
  const center = RING_SIZE / 2;

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        role="img"
        aria-label={value === null ? "Taxa de comparecimento indisponível" : `Taxa de comparecimento ${formatPercent(value)}`}
      >
        <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={RING_STROKE} />
        {value !== null && percent > 0 ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        ) : null}
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-foreground text-2xl leading-none font-bold tabular-nums">{formatPercent(value, 0)}</span>
        <span className="text-muted-foreground mt-1 text-[11px]">no mês</span>
      </div>
    </div>
  );
}
