"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, UserPlusIcon } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NewLeadsSummary } from "../../lib/dentist-dashboard";
import { DeltaPill } from "../delta-pill";

export interface NewLeadsTodayCardProps {
  summary: NewLeadsSummary | null;
  loading: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Card grande em destaque "Leads novos hoje" (spec §4.2 — dashboard do dentista). */
export function NewLeadsTodayCard({ summary, loading, onRetry, retrying, className }: NewLeadsTodayCardProps) {
  return (
    <Card
      aria-busy={loading || undefined}
      className={cn("bg-primary text-primary-foreground border-primary relative gap-4 overflow-hidden py-6", className)}
    >
      {/* Detalhe decorativo nas cores da marca */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
      <span aria-hidden="true" className="bg-gold/40 pointer-events-none absolute right-8 bottom-6 size-3 rounded-full" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <UserPlusIcon className="size-5" />
          </span>
          <h2 className="text-primary-foreground/90 text-base font-semibold">Leads novos hoje</h2>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-2">
        {loading ? (
          <div role="status" className="space-y-3">
            <span className="sr-only">Carregando leads de hoje…</span>
            <Skeleton className="h-14 w-24 bg-white/20" />
            <Skeleton className="h-4 w-40 bg-white/20" />
          </div>
        ) : !summary ? (
          <ErrorState
            size="sm"
            title="Não foi possível carregar"
            message="Verifique a conexão e tente de novo."
            onRetry={onRetry}
            retrying={retrying}
            className="text-primary-foreground [&_h3]:text-primary-foreground [&_p]:text-primary-foreground/80"
          />
        ) : (
          <>
            <p className="text-6xl leading-none font-bold tracking-tight tabular-nums">{formatNumber(summary.today)}</p>
            <div className="text-primary-foreground/85 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span>
                Ontem: <span className="font-semibold tabular-nums">{formatNumber(summary.yesterday)}</span>
              </span>
              <DeltaPill value={summary.change} context="vs ontem" tone="onPrimary" />
            </div>
            <p className="text-primary-foreground/85 text-sm">
              {summary.stillNew > 0
                ? `${formatNumber(summary.stillNew)} ${summary.stillNew === 1 ? "ainda aguarda" : "ainda aguardam"} a primeira resposta`
                : summary.today > 0
                  ? "Todos os leads de hoje já foram respondidos"
                  : "Nenhum lead chegou hoje até agora"}
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="relative">
        <Button asChild variant="secondary" className="text-primary bg-white hover:bg-white/90">
          <Link href="/leads?status=novo">
            Ver leads novos
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
