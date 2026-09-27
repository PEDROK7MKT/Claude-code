"use client";

import * as React from "react";
import { ArrowRightIcon, BotIcon, HistoryIcon, SparklesIcon, UserRoundIcon } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadHistory, type LeadHistoryEntry } from "@/features/leads/api/leads-queries";
import { StatusActionIcon } from "@/features/leads/components/status/status-ui";
import {
  historyActorName,
  historyEntryTitle,
  historyNote,
  isCreationEntry,
  isSystemEntry,
} from "@/features/leads/lib/lead-history";
import { STATUS_META } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { RelativeTime } from "./relative-time";

const INITIAL_VISIBLE = 8;

/** Histórico de status (spec §4.3): quem mudou, quando, de → para e a observação. Mais recente primeiro. */
export function LeadHistoryCard({ leadId }: { leadId: string }) {
  const history = useLeadHistory(leadId);
  const [expanded, setExpanded] = React.useState(false);
  const entries = history.data ?? [];
  const visible = expanded ? entries : entries.slice(0, INITIAL_VISIBLE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <HistoryIcon aria-hidden="true" className="text-primary size-4" />
            Histórico
          </h2>
        </CardTitle>
        <CardDescription>Cada mudança de status, com autor, data e observação.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.isPending ? (
          <HistorySkeleton />
        ) : history.isError && entries.length === 0 ? (
          <ErrorState
            size="sm"
            title="Não foi possível carregar o histórico"
            message={getErrorMessage(history.error)}
            onRetry={() => void history.refetch()}
            retrying={history.isFetching}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            size="sm"
            icon={HistoryIcon}
            title="Sem registros ainda"
            description="As mudanças de status aparecem aqui assim que acontecerem."
            action={{ label: "Ir para as ações rápidas", href: "#acoes-rapidas", variant: "outline" }}
          />
        ) : (
          <>
            <ol aria-label="Histórico de mudanças de status" className="grid">
              {visible.map((entry, index) => (
                <HistoryItem key={entry.id} entry={entry} last={index === visible.length - 1} />
              ))}
            </ol>
            {entries.length > INITIAL_VISIBLE ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Mostrar menos" : `Mostrar todo o histórico (${entries.length})`}
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({ entry, last }: { entry: LeadHistoryEntry; last: boolean }) {
  const color = STATUS_META[entry.new_status].color;
  const note = historyNote(entry.note);
  const system = isSystemEntry(entry);
  const ActorIcon = system ? BotIcon : UserRoundIcon;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last ? <span aria-hidden="true" className="bg-border absolute top-9 bottom-1 left-4 w-px -translate-x-1/2" /> : null}
      <span
        aria-hidden="true"
        className="relative flex size-8 shrink-0 items-center justify-center rounded-full"
        // cor do status de destino (hex) com fundo suave
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {isCreationEntry(entry) || entry.old_status === null ? (
          <SparklesIcon className="size-4" />
        ) : (
          <StatusActionIcon from={entry.old_status} to={entry.new_status} className="size-4" />
        )}
      </span>

      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="text-foreground text-sm leading-8 font-medium">{historyEntryTitle(entry)}</p>
        <div className="-mt-1 flex flex-wrap items-center gap-1.5">
          {entry.old_status !== null ? (
            <>
              <StatusBadge status={entry.old_status} />
              <ArrowRightIcon aria-hidden="true" className="text-muted-foreground size-3.5" />
              <span className="sr-only">para</span>
            </>
          ) : null}
          <StatusBadge status={entry.new_status} />
        </div>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          <ActorIcon aria-hidden="true" className="size-3.5" />
          <span className={cn(!system && "text-foreground font-medium")}>{historyActorName(entry)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatDateTime(entry.created_at)}</span>
          <span aria-hidden="true">·</span>
          <RelativeTime value={entry.created_at} className="no-underline" />
        </p>
        {note ? (
          <blockquote className="bg-muted/60 text-foreground rounded-md border-l-2 px-3 py-2 text-sm break-words whitespace-pre-wrap">
            {note}
          </blockquote>
        ) : null}
      </div>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div role="status" aria-busy="true" className="grid gap-5">
      <span className="sr-only">Carregando histórico…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-5 w-3/5 rounded-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
