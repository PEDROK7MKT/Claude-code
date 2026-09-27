import * as React from "react";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, StoreIcon, TrophyIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDateKey } from "@/lib/dates";
import { formatDecimal, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GmnMetric } from "@/types/database";
import { formatPeriod, formatPeriodShort } from "../lib/periods";
import {
  nextStepMessage,
  pluralize,
  progressToLeader,
  rankingGapMessage,
  rankingHeadline,
  type CompetitorRanking,
} from "../lib/ranking";
import type { ReviewsHighlight } from "../lib/summary";
import { StarRating } from "./star-rating";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface GmnRatingHighlightProps {
  highlight: ReviewsHighlight<GmnMetric>;
  ranking: CompetitorRanking;
  className?: string;
}

/** Card de destaque: nota atual (estrelas), total de avaliações, variação e posição no ranking. */
export function GmnRatingHighlight({ highlight, ranking, className }: GmnRatingHighlightProps) {
  const { latest, previous, rating, ratingFromPeriodEnd, totalReviews, reviewsDelta, ratingDelta } = highlight;
  const headline = rankingHeadline(ranking);
  const gap = rankingGapMessage(ranking);
  const nextStep = nextStepMessage(ranking);
  const progress = progressToLeader(ranking);
  const topCompetitor = ranking.entries.find((e) => !e.isIdc) ?? null;

  return (
    <Card
      className={cn("bg-primary text-primary-foreground border-primary relative gap-5 overflow-hidden", className)}
    >
      {/* formas decorativas */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/5" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 -bottom-20 size-40 rounded-full bg-white/5" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-base">
          <StoreIcon aria-hidden="true" className="size-4" />
          Nota no Google
        </CardTitle>
        <CardDescription className="text-primary-foreground/75">
          Último período: {formatPeriod(latest.period_start, latest.period_end)}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="text-6xl leading-none font-bold tracking-tight">
            <span className="sr-only">Nota média </span>
            {rating == null ? "—" : formatDecimal(rating)}
          </p>
          <div className="space-y-1.5 pb-1">
            <StarRating rating={rating} size="lg" emptyClassName="text-white/25" />
            <p className="text-primary-foreground/85 text-sm">
              <span className="font-semibold text-white tabular-nums">{formatNumber(totalReviews)}</span>{" "}
              {totalReviews === 1 ? "avaliação" : "avaliações"}
            </p>
          </div>
        </div>

        {rating == null ? (
          <p className="text-primary-foreground/80 text-xs">Nota média ainda não informada.</p>
        ) : ratingFromPeriodEnd ? (
          <p className="text-primary-foreground/80 text-xs">
            Nota informada no período encerrado em {formatDateKey(ratingFromPeriodEnd)}.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {previous ? (
            <>
              <DeltaPill value={reviewsDelta} text={formatReviewsDelta(reviewsDelta)} />
              <DeltaPill value={ratingDelta} text={formatRatingDelta(ratingDelta)} />
              <span className="text-primary-foreground/70 text-xs">
                vs {formatPeriodShort(previous.period_start, previous.period_end)}
              </span>
            </>
          ) : (
            <span className="text-primary-foreground/75 text-xs">
              Primeiro período registrado — a variação aparece a partir do próximo.
            </span>
          )}
        </div>

        {headline ? (
          <>
            <Separator className="bg-white/15" />
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="flex items-start gap-2 text-sm font-semibold text-white">
                  <TrophyIcon aria-hidden="true" className="text-gold mt-0.5 size-4 shrink-0" />
                  {headline}
                </p>
                {gap ? <p className="text-primary-foreground/80 pl-6 text-sm">{capitalize(gap)}</p> : null}
              </div>
              {progress != null && topCompetitor && ranking.nextAbove ? (
                <div className="space-y-1.5">
                  <Progress
                    value={progress}
                    aria-label={`Avaliações do IDC em relação a ${topCompetitor.name}`}
                    className="h-2 bg-white/20"
                    indicatorClassName="bg-gold"
                  />
                  <div className="text-primary-foreground/75 flex justify-between gap-3 text-xs tabular-nums">
                    <span>IDC · {formatNumber(totalReviews)}</span>
                    <span className="truncate text-right">
                      {topCompetitor.name} · {formatNumber(topCompetitor.reviews)}
                    </span>
                  </div>
                </div>
              ) : null}
              {nextStep ? <p className="text-primary-foreground/75 text-xs">Próximo degrau: {nextStep}.</p> : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatReviewsDelta(delta: number | null): string {
  if (delta == null) return "—";
  if (delta === 0) return "nenhuma avaliação nova";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${pluralize(Math.abs(delta), "avaliação", "avaliações")}`;
}

function formatRatingDelta(delta: number | null): string {
  if (delta == null) return "nota sem comparação";
  if (delta === 0) return "nota estável";
  return `nota ${delta > 0 ? "+" : "−"}${formatDecimal(Math.abs(delta))}`;
}

/** Pílula de variação sobre o fundo teal (seta + texto; nunca só cor). */
function DeltaPill({ value, text }: { value: number | null; text: string }) {
  const Icon: React.ElementType = value == null || value === 0 ? MinusIcon : value > 0 ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
      <Icon aria-hidden="true" className="size-3.5" />
      {text}
    </span>
  );
}
