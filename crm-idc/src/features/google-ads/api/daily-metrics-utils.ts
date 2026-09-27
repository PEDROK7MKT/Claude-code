/**
 * Validação/normalização de métricas diárias do Google Ads antes de gravar
 * (formulário e importação CSV). Funções puras.
 */
import { AppError } from "@/lib/errors";
import { canonicalCampaignName } from "@/lib/utm";
import type { DailyMetric } from "@/types/database";

/** Dados de uma linha de métrica (formulário/CSV). `id` presente = edição de linha existente. */
export interface DailyMetricInput {
  id?: string;
  /** yyyy-MM-dd */
  date: string;
  campaign: string;
  impressions?: number | null;
  clicks?: number | null;
  /** R$ */
  cost?: number | null;
  conversions?: number | null;
}

export type SanitizedDailyMetric = Pick<DailyMetric, "date" | "campaign" | "impressions" | "clicks" | "cost" | "conversions">;

/** yyyy-MM-dd que existe no calendário (ex.: rejeita 2026-02-30). */
export function isValidDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function nonNegative(value: number | null | undefined, label: string, decimals: number): number {
  if (value == null) return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new AppError(`${label} inválido.`);
  if (n < 0) throw new AppError(`${label} não pode ser negativo.`);
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Valida e normaliza uma linha: data yyyy-MM-dd válida, campanha pelo nome canônico,
 * inteiros ≥ 0 (conversões fracionadas do Google Ads são arredondadas — coluna INTEGER)
 * e custo ≥ 0 com 2 casas. Lança AppError (pt-BR).
 */
export function sanitizeDailyMetric(input: DailyMetricInput): SanitizedDailyMetric {
  const date = (input.date ?? "").trim().slice(0, 10);
  if (!isValidDateKey(date)) throw new AppError(`Data inválida${input.date ? `: "${input.date}"` : ""}. Use o formato dd/mm/aaaa.`);
  const campaign = canonicalCampaignName(input.campaign);
  if (!campaign) throw new AppError("Informe a campanha.");
  return {
    date,
    campaign,
    impressions: nonNegative(input.impressions, "Impressões", 0),
    clicks: nonNegative(input.clicks, "Cliques", 0),
    cost: nonNegative(input.cost, "Custo", 2),
    conversions: nonNegative(input.conversions, "Conversões", 0),
  };
}

/** Chave de unicidade igual à do banco: (date, lower(btrim(campaign))). */
export function dailyMetricKey(row: Pick<DailyMetric, "date" | "campaign">): string {
  return `${row.date}|${row.campaign.trim().toLocaleLowerCase("pt-BR")}`;
}

/**
 * Remove linhas repetidas (mesma data e campanha) mantendo a ÚLTIMA ocorrência —
 * o upsert falharia com duas linhas iguais no mesmo lote.
 */
export function dedupeDailyMetrics<T extends Pick<DailyMetric, "date" | "campaign">>(
  rows: readonly T[],
): { rows: T[]; duplicates: number } {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    const key = dailyMetricKey(row);
    byKey.delete(key); // reinsere no fim: preserva a ordem da última ocorrência
    byKey.set(key, row);
  }
  return { rows: [...byKey.values()], duplicates: rows.length - byKey.size };
}
