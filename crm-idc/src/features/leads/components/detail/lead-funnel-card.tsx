import * as React from "react";
import { CheckIcon, XIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFunnelSteps, funnelProgress, type FunnelStep, type FunnelStepState } from "@/features/leads/lib/lead-funnel";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/database";

const STATE_LABEL: Record<FunnelStepState, string> = {
  done: "concluída",
  current: "próxima etapa",
  upcoming: "pendente",
  missed: "interrompida",
};

type FunnelLead = Pick<Lead, "status" | "created_at" | "contacted_at" | "scheduled_at" | "confirmed_at" | "attended_at">;

/**
 * Linha do tempo do funil: Entrada → Contato → Agendamento → Confirmação →
 * Comparecimento, com as datas (dd/MM/yyyy HH:mm, Barreiras/BA). Horizontal quando
 * o card tem largura (container query), vertical no celular e em colunas estreitas.
 */
export function LeadFunnelCard({ lead }: { lead: FunnelLead }) {
  const steps = buildFunnelSteps(lead);
  const { completed, total } = funnelProgress(steps);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Funil do lead</h2>
        </CardTitle>
        <CardDescription className="tabular-nums">
          {completed} de {total} etapas concluídas
        </CardDescription>
      </CardHeader>
      <CardContent className="@container">
        <ol aria-label="Etapas do funil" className="grid @lg:grid-cols-5">
          {steps.map((step, index) => (
            <FunnelStepItem
              key={step.key}
              step={step}
              last={index === steps.length - 1}
              connectorDone={step.state === "done" && steps[index + 1]?.state === "done"}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function FunnelStepItem({ step, last, connectorDone }: { step: FunnelStep; last: boolean; connectorDone: boolean }) {
  const active = step.state === "current" || step.state === "missed";

  return (
    <li
      aria-current={active ? "step" : undefined}
      className="relative flex gap-3 pb-5 last:pb-0 @lg:flex-col @lg:items-center @lg:gap-2 @lg:pb-0 @lg:text-center"
    >
      {!last ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 rounded-full",
            "@lg:top-[15px] @lg:bottom-auto @lg:left-[calc(50%+1.25rem)] @lg:h-0.5 @lg:w-[calc(100%-2.5rem)] @lg:translate-x-0",
            connectorDone ? "bg-primary" : "bg-border",
          )}
        />
      ) : null}

      <StepMarker state={step.state} />

      <div className="min-w-0 pt-1 @lg:px-1 @lg:pt-0">
        <p
          className={cn(
            "text-sm font-medium",
            step.state === "upcoming" ? "text-muted-foreground" : "text-foreground",
            step.state === "missed" && "text-destructive",
          )}
        >
          {step.label}
          <span className="sr-only"> — {STATE_LABEL[step.state]}</span>
        </p>
        {step.date ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            <time dateTime={step.date}>{formatDateTime(step.date)}</time>
          </p>
        ) : null}
        {step.description ? (
          <p
            className={cn(
              "text-xs",
              step.state === "current" ? "text-primary font-medium" : "text-muted-foreground",
              step.state === "missed" && "text-destructive font-medium",
            )}
          >
            {step.description}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function StepMarker({ state }: { state: FunnelStepState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
        state === "done" && "border-primary bg-primary text-primary-foreground",
        state === "current" && "border-primary bg-card text-primary ring-primary/15 ring-4",
        state === "upcoming" && "border-border bg-card text-muted-foreground border-dashed",
        state === "missed" && "border-destructive/60 bg-destructive/10 text-destructive",
      )}
    >
      {state === "done" ? <CheckIcon className="size-4" strokeWidth={3} /> : null}
      {state === "missed" ? <XIcon className="size-4" strokeWidth={3} /> : null}
      {state === "current" ? <span className="bg-primary size-2.5 animate-pulse rounded-full motion-reduce:animate-none" /> : null}
    </span>
  );
}
