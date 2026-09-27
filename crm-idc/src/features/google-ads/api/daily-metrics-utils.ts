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
  /** yyyy-MM-dd (também aceita dd/MM/yyyy) */
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

/**
 * Converte datas digitadas/importadas em yyyy-MM-dd: aceita "2026-03-05", "05/03/2026",
 * "5/3/2026", "05-03-2026" e "05.03.2026" (dia/mês/ano, padrão brasileiro). Inválida → null.
 */
export function parseDateKey(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  let y: number;
  let m: number;
  let d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(v);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const key = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return isValidDateKey(key) ? key : null;
}

function nonNegative(value: number | null | undefined, label: string, decimals: number): number {
  if (value == null) return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new AppError(`${label}: valor inválido.`);
  if (n < 0) throw new AppError(`${label}: o valor não pode ser negativo.`);
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Valida e normaliza uma linha: data yyyy-MM-dd válida, campanha pelo nome canônico,
 * inteiros ≥ 0 (conversões fracionadas do Google Ads são arredondadas — coluna INTEGER)
 * e custo ≥ 0 com 2 casas. Lança AppError (pt-BR).
 */
export function sanitizeDailyMetric(input: DailyMetricInput): SanitizedDailyMetric {
  const date = parseDateKey(input.date);
  if (!date) throw new AppError(`Data inválida${input.date ? `: "${input.date}"` : ""}. Use dd/mm/aaaa ou aaaa-mm-dd.`);
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
