/**
 * Ranking do IDC frente aos concorrentes no Google (spec §4.6 e §7).
 * Ordena por número de avaliações (desempate pela nota). Funções puras.
 */
import { isSelfName } from "@/features/settings/lib/competitors";
import { formatNumber } from "@/lib/format";
import type { Competitor } from "@/types/database";

/** Rótulo da clínica no comparativo. */
export const IDC_LABEL = "IDC";

export interface IdcStanding {
  /** Nota média mais recente (null se nunca informada) */
  rating: number | null;
  /** Total de avaliações do período mais recente */
  reviews: number;
}

export interface RankingEntry {
  /** Chave estável para listas React */
  key: string;
  name: string;
  rating: number | null;
  reviews: number;
  isIdc: boolean;
  /** Posição por avaliações (1 = mais avaliações). Empates exatos dividem a posição. */
  position: number;
}

export interface CompetitorRanking {
  /** Todas as clínicas, da maior para a menor quantidade de avaliações */
  entries: RankingEntry[];
  /** Linha do IDC (null quando ainda não há dados do GMN) */
  idc: RankingEntry | null;
  total: number;
  /** Clínica com mais avaliações (o próprio IDC quando ele lidera) */
  leader: RankingEntry | null;
  /** Avaliações que faltam para o IDC alcançar o líder (0 quando lidera ou empata) */
  gapToLeader: number | null;
  /** Concorrente imediatamente acima do IDC (null quando o IDC lidera) */
  nextAbove: RankingEntry | null;
  gapToNext: number | null;
  /** Melhor concorrente abaixo do IDC quando ele lidera (vantagem) */
  runnerUp: RankingEntry | null;
  leadMargin: number | null;
  /** Maior quantidade de avaliações (escala das barras) */
  maxReviews: number;
}

function ratingValue(rating: number | null): number {
  return rating ?? -1;
}

/** `a` está estritamente à frente de `b`? (mais avaliações; empate → nota maior) */
function isAhead(a: Pick<RankingEntry, "reviews" | "rating">, b: Pick<RankingEntry, "reviews" | "rating">): boolean {
  if (a.reviews !== b.reviews) return a.reviews > b.reviews;
  return ratingValue(a.rating) > ratingValue(b.rating);
}

function compareEntries(a: Omit<RankingEntry, "position">, b: Omit<RankingEntry, "position">): number {
  if (a.reviews !== b.reviews) return b.reviews - a.reviews;
  const byRating = ratingValue(b.rating) - ratingValue(a.rating);
  if (byRating !== 0) return byRating;
  // empate exato: IDC primeiro (destaque), depois ordem alfabética
  if (a.isIdc !== b.isIdc) return a.isIdc ? -1 : 1;
  return a.name.localeCompare(b.name, "pt-BR");
}

/**
 * Monta o ranking por número de avaliações.
 * `idc` null = ainda não há registro do GMN (só os concorrentes aparecem).
 */
export function buildCompetitorRanking(
  competitors: readonly Competitor[],
  idc: IdcStanding | null,
): CompetitorRanking {
  const base: Array<Omit<RankingEntry, "position">> = competitors
    // concorrente com o nome da própria clínica não vira linha duplicada (mesma regra do editor)
    .filter((c) => c.name.trim() && !isSelfName(c.name))
    .map((c, index) => ({
      key: `competitor-${index}-${c.name}`,
      name: c.name.trim(),
      rating: Number.isFinite(c.rating) ? c.rating : null,
      reviews: Number.isFinite(c.reviews) ? Math.max(0, Math.round(c.reviews)) : 0,
      isIdc: false,
    }));

  if (idc) {
    base.push({
      key: "idc",
      name: IDC_LABEL,
      rating: idc.rating != null && Number.isFinite(idc.rating) ? idc.rating : null,
      reviews: Math.max(0, Math.round(idc.reviews)),
      isIdc: true,
    });
  }

  const sorted = [...base].sort(compareEntries);
  const entries: RankingEntry[] = sorted.map((entry) => ({
    ...entry,
    position: 1 + sorted.filter((other) => isAhead(other, entry)).length,
  }));

  const idcEntry = entries.find((e) => e.isIdc) ?? null;
  // sem ninguém à frente, o IDC ordena primeiro (inclusive em empate exato)
  const leader = entries[0] ?? null;
  const maxReviews = entries.reduce((max, e) => Math.max(max, e.reviews), 0);

  let gapToLeader: number | null = null;
  let nextAbove: RankingEntry | null = null;
  let gapToNext: number | null = null;
  let runnerUp: RankingEntry | null = null;
  let leadMargin: number | null = null;

  if (idcEntry) {
    const ahead = entries.filter((e) => !e.isIdc && isAhead(e, idcEntry));
    if (ahead.length) {
      const top = ahead[0];
      gapToLeader = Math.max(0, top.reviews - idcEntry.reviews);
      nextAbove = ahead[ahead.length - 1];
      gapToNext = Math.max(0, nextAbove.reviews - idcEntry.reviews);
    } else {
      gapToLeader = 0;
      runnerUp = entries.find((e) => !e.isIdc) ?? null;
      leadMargin = runnerUp ? idcEntry.reviews - runnerUp.reviews : null;
    }
  }

  return {
    entries,
    idc: idcEntry,
    total: entries.length,
    leader,
    gapToLeader,
    nextAbove,
    gapToNext,
    runnerUp,
    leadMargin,
    maxReviews,
  };
}

/** 5 → "5º" */
export function ordinal(position: number): string {
  return `${position}º`;
}

/** Singular/plural simples: (1, "avaliação", "avaliações") → "1 avaliação". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${Math.abs(count) === 1 ? singular : plural}`;
}

/** "IDC está em 5º de 8 em número de avaliações" (null sem dados do IDC). */
export function rankingHeadline(ranking: CompetitorRanking): string | null {
  const { idc, total } = ranking;
  if (!idc) return null;
  if (total === 1) return `${IDC_LABEL} ainda não tem concorrentes cadastrados para comparação`;
  const tied = ranking.entries.some((e) => !e.isIdc && e.position === idc.position);
  return `${IDC_LABEL} está em ${ordinal(idc.position)} de ${total} em número de avaliações${tied ? " (empatado)" : ""}`;
}

/**
 * Distância para o líder (ou vantagem, quando o IDC lidera):
 * "faltam 116 avaliações para alcançar Quero Sorrir".
 */
export function rankingGapMessage(ranking: CompetitorRanking): string | null {
  const { idc } = ranking;
  if (!idc) return null;

  const top = ranking.entries.find((e) => !e.isIdc);
  if (ranking.nextAbove && top && ranking.gapToLeader != null) {
    if (ranking.gapToLeader === 0) {
      return `mesmo número de avaliações que ${top.name}, que tem nota maior`;
    }
    const verb = ranking.gapToLeader === 1 ? "falta" : "faltam";
    return `${verb} ${pluralize(ranking.gapToLeader, "avaliação", "avaliações")} para alcançar ${top.name}`;
  }

  if (ranking.runnerUp && ranking.leadMargin != null) {
    if (ranking.leadMargin === 0) return `empatado em avaliações com ${ranking.runnerUp.name}, com nota igual ou maior`;
    return `${pluralize(ranking.leadMargin, "avaliação", "avaliações")} à frente de ${ranking.runnerUp.name}`;
  }
  return null;
}

/** Próximo degrau, quando diferente do líder: "faltam 16 avaliações para passar DENTEBRAS". */
export function nextStepMessage(ranking: CompetitorRanking): string | null {
  const { idc, nextAbove, gapToNext } = ranking;
  const top = ranking.entries.find((e) => !e.isIdc);
  if (!idc || !nextAbove || gapToNext == null || !top || nextAbove.key === top.key) return null;
  // passar = superar (uma avaliação a mais que o concorrente)
  const needed = gapToNext + 1;
  const verb = needed === 1 ? "falta" : "faltam";
  return `${verb} ${pluralize(needed, "avaliação", "avaliações")} para passar ${nextAbove.name}`;
}

/** Percentual (0–100) de avaliações do IDC em relação ao líder — barra de progresso. */
export function progressToLeader(ranking: CompetitorRanking): number | null {
  const { idc } = ranking;
  const top = ranking.entries.find((e) => !e.isIdc);
  if (!idc || !top) return null;
  if (!ranking.nextAbove) return 100;
  if (top.reviews <= 0) return 100;
  return Math.min(100, Math.max(0, (idc.reviews / top.reviews) * 100));
}
