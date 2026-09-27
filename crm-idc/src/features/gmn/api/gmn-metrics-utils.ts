/**
 * Validação dos registros do Google Meu Negócio (formulário). Funções puras.
 */
import { parseDateKey } from "@/features/google-ads/api/daily-metrics-utils";
import { AppError } from "@/lib/errors";
import type { GmnMetric } from "@/types/database";

/** Dados do formulário do GMN. `id` presente = edição. */
export interface GmnMetricInput {
  id?: string;
  /** yyyy-MM-dd (também aceita dd/MM/yyyy) */
  period_start: string;
  period_end: string;
  search_views?: number | null;
  maps_views?: number | null;
  website_clicks?: number | null;
  direction_requests?: number | null;
  phone_calls?: number | null;
  total_reviews?: number | null;
  /** 0 a 5, uma casa decimal */
  average_rating?: number | null;
  new_reviews?: number | null;
  notes?: string | null;
}

export type SanitizedGmnMetric = Omit<GmnMetric, "id" | "created_by" | "created_at" | "updated_at">;

const INTEGER_FIELDS = [
  ["search_views", "Visualizações na busca"],
  ["maps_views", "Visualizações no Maps"],
  ["website_clicks", "Cliques no site"],
  ["direction_requests", "Solicitações de rota"],
  ["phone_calls", "Ligações"],
  ["total_reviews", "Total de avaliações"],
  ["new_reviews", "Avaliações novas"],
] as const satisfies ReadonlyArray<readonly [keyof GmnMetricInput & keyof GmnMetric, string]>;

/** Valida período, contadores ≥ 0 (inteiros) e nota entre 0 e 5. Lança AppError (pt-BR). */
export function sanitizeGmnMetric(input: GmnMetricInput): SanitizedGmnMetric {
  const periodStart = parseDateKey(input.period_start);
  const periodEnd = parseDateKey(input.period_end);
  if (!periodStart) throw new AppError("Informe uma data de início válida.");
  if (!periodEnd) throw new AppError("Informe uma data de fim válida.");
  if (periodEnd < periodStart) throw new AppError("O fim do período deve ser igual ou posterior ao início.");

  const counters = {} as Record<(typeof INTEGER_FIELDS)[number][0], number>;
  for (const [field, label] of INTEGER_FIELDS) {
    const raw = input[field];
    const n = raw == null ? 0 : Number(raw);
    if (!Number.isFinite(n)) throw new AppError(`${label}: valor inválido.`);
    if (n < 0) throw new AppError(`${label}: o valor não pode ser negativo.`);
    counters[field] = Math.round(n);
  }

  let averageRating: number | null = null;
  if (input.average_rating != null) {
    const rating = Number(input.average_rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new AppError("A nota média deve estar entre 0 e 5.");
    averageRating = Math.round(rating * 10) / 10;
  }

  const notes = input.notes?.trim() || null;
  return { period_start: periodStart, period_end: periodEnd, ...counters, average_rating: averageRating, notes };
}
