import Link from "next/link";
import { SettingsIcon, StarIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDecimal, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ordinal, type CompetitorRanking as Ranking, type RankingEntry } from "../lib/ranking";

export interface CompetitorRankingProps {
  ranking: Ranking;
  /** Admin vê o atalho para editar os concorrentes em Configurações */
  isAdmin: boolean;
  className?: string;
}

/** Comparativo com concorrentes de Barreiras, ordenado por número de avaliações. */
export function CompetitorRanking({ ranking, isAdmin, className }: CompetitorRankingProps) {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader>
        <CardTitle>Comparativo com concorrentes</CardTitle>
        <CardDescription>Clínicas de Barreiras por número de avaliações no Google</CardDescription>
        {isAdmin ? (
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/configuracoes">
                <SettingsIcon aria-hidden="true" />
                Editar
                <span className="sr-only"> concorrentes</span>
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        {ranking.entries.length === 0 ? (
          <EmptyState
            size="sm"
            icon={UsersIcon}
            title="Nenhum concorrente cadastrado"
            description="Cadastre os concorrentes em Configurações para comparar as avaliações."
          />
        ) : (
          <>
            <div
              aria-hidden="true"
              className="text-muted-foreground mb-1 flex items-center gap-3 px-3 text-[11px] font-medium tracking-wide uppercase"
            >
              <span className="w-7 shrink-0">#</span>
              <span className="flex-1">Clínica</span>
              <span className="w-10 text-right">Nota</span>
              <span className="w-12 text-right">Aval.</span>
            </div>
            <ol aria-label="Ranking por número de avaliações" className="space-y-1">
              {ranking.entries.map((entry) => (
                <RankingRow key={entry.key} entry={entry} maxReviews={ranking.maxReviews} />
              ))}
            </ol>
            {!ranking.idc ? (
              <p className="text-muted-foreground mt-3 px-3 text-xs">
                Registre um período para ver a posição do IDC no ranking.
              </p>
            ) : null}
          </>
        )}
      </CardContent>

      <CardFooter className="text-muted-foreground text-xs">
        Nota e avaliações dos concorrentes são valores fixos, atualizados manualmente em Configurações. O IDC usa
        o último período registrado.
      </CardFooter>
    </Card>
  );
}

function RankingRow({ entry, maxReviews }: { entry: RankingEntry; maxReviews: number }) {
  const width = maxReviews > 0 ? Math.max(2, (entry.reviews / maxReviews) * 100) : 0;
  const isFirst = entry.position === 1;

  return (
    <li
      aria-current={entry.isIdc ? "true" : undefined}
      className={cn("rounded-lg px-3 py-2.5", entry.isIdc && "bg-primary/5 ring-primary/25 ring-1")}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            entry.isIdc
              ? "bg-primary text-primary-foreground"
              : isFirst
                ? "bg-gold/20 text-gold-foreground"
                : "bg-muted text-muted-foreground",
          )}
        >
          <span className="sr-only">Posição </span>
          {ordinal(entry.position)}
        </span>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn("truncate text-sm", entry.isIdc ? "text-primary font-semibold" : "font-medium")}>
                {entry.name}
              </span>
              {entry.isIdc ? <Badge className="h-4 px-1.5 text-[10px] leading-none">você</Badge> : null}
            </div>
            <span className="text-muted-foreground inline-flex w-10 shrink-0 items-center justify-end gap-0.5 text-sm tabular-nums">
              <StarIcon aria-hidden="true" className="text-gold size-3.5" fill="currentColor" strokeWidth={0} />
              <span className="sr-only">nota </span>
              {entry.rating == null ? "—" : formatDecimal(entry.rating)}
            </span>
            <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatNumber(entry.reviews)}
              <span className="sr-only"> avaliações</span>
            </span>
          </div>
          <div aria-hidden="true" className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", entry.isIdc ? "bg-primary" : "bg-muted-foreground/30")}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
