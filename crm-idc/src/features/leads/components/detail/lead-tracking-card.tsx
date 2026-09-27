"use client";

import * as React from "react";
import { MegaphoneIcon } from "lucide-react";

import { SourceBadge } from "@/components/shared/source-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  buildOriginRows,
  buildUtmRows,
  describeLeadEntry,
  hasTrackingInfo,
  type TrackingRow,
} from "@/features/leads/lib/lead-tracking";
import { cn } from "@/lib/utils";
import type { Lead, Profile } from "@/types/database";

import { CopyButton } from "./copy-button";

export interface LeadTrackingCardProps {
  lead: Lead;
  profiles?: readonly Profile[];
}

/** "Origem e rastreamento": fonte, campanha, palavra-chave, grupo, página e utm_* (copiáveis). */
export function LeadTrackingCard({ lead, profiles }: LeadTrackingCardProps) {
  const originRows = buildOriginRows(lead);
  const utmRows = buildUtmRows(lead);
  const hasUtm = utmRows.some((row) => row.value !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <MegaphoneIcon aria-hidden="true" className="text-primary size-4" />
            Origem e rastreamento
          </h2>
        </CardTitle>
        <CardDescription>Entrada: {describeLeadEntry(lead, profiles)}.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid gap-2.5">
          {originRows.map((row) =>
            row.key === "source" ? (
              <TrackingItem key={row.key} row={row}>
                <SourceBadge source={lead.source} />
              </TrackingItem>
            ) : (
              <TrackingItem key={row.key} row={row} />
            ),
          )}
        </dl>

        {!hasTrackingInfo(lead) ? (
          <p className="text-muted-foreground text-xs">
            Sem dados de campanha. Em “Dados do lead”, use “Colar URL de origem” para preencher a partir do link que o
            paciente acessou.
          </p>
        ) : null}

        <Separator />

        <div className="grid gap-2.5">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Parâmetros UTM</h3>
          {hasUtm ? (
            <dl className="grid gap-2.5">
              {utmRows.map((row) => (
                <TrackingItem key={row.key} row={row} />
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum UTM registrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingItem({ row, children }: { row: TrackingRow; children?: React.ReactNode }) {
  const copyable = row.value !== null && row.key !== "source";
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_1.75rem] items-center gap-x-2 text-sm">
      <dt className={cn("text-muted-foreground truncate", row.technical && row.key.startsWith("utm_") && "font-mono text-xs")}>
        {row.label}
      </dt>
      <dd className={cn("min-w-0", row.value === null && "text-muted-foreground")}>
        {children ?? (
          <span className={cn("block break-words", row.technical && "font-mono text-xs break-all")}>
            {row.value ?? "—"}
          </span>
        )}
      </dd>
      <dd className="flex justify-end">{copyable && row.value ? <CopyButton value={row.value} label={row.label} /> : null}</dd>
    </div>
  );
}
