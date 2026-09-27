/**
 * Formulário de período do GMN: schema zod (valores como texto, aceitando
 * "1.520" e "4,9"), conversão de/para o registro do banco. Funções puras.
 */
import { z } from "zod";
import type { GmnMetricInput } from "@/features/gmn/api/gmn-metrics-utils";
import { formatDecimal } from "@/lib/format";
import type { GmnMetric } from "@/types/database";
import type { PeriodRange } from "./periods";

/** Limite da coluna INTEGER do Postgres. */
const MAX_INTEGER = 2_147_483_647;

export const GMN_COUNTER_FIELDS = [
  "search_views",
  "maps_views",
  "website_clicks",
  "direction_requests",
  "phone_calls",
  "total_reviews",
  "new_reviews",
] as const;
export type GmnCounterField = (typeof GMN_COUNTER_FIELDS)[number];

export interface GmnFieldMeta {
  label: string;
  /** Onde encontrar o número no painel do Google Business Profile */
  hint: string;
}

export const GMN_FIELD_META: Record<GmnCounterField | "average_rating", GmnFieldMeta> = {
  search_views: {
    label: "Visualizações na busca",
    hint: "Desempenho → Visualizações: Pesquisa Google (celular + computador)",
  },
  maps_views: {
    label: "Visualizações no Maps",
    hint: "Desempenho → Visualizações: Google Maps (celular + computador)",
  },
  website_clicks: { label: "Cliques no site", hint: "Desempenho → Interações: Cliques no site" },
  direction_requests: { label: "Solicitações de rota", hint: "Desempenho → Interações: Rotas" },
  phone_calls: { label: "Ligações", hint: "Desempenho → Interações: Ligações" },
  total_reviews: { label: "Total de avaliações", hint: "Perfil da clínica → Avaliações (número total)" },
  average_rating: { label: "Nota média", hint: "Perfil da clínica → nota exibida ao lado das estrelas" },
  new_reviews: { label: "Avaliações novas", hint: "Avaliações recebidas dentro do período" },
};

/** Inteiro com ou sem separador de milhar pt-BR: "1520", "1.520", "1 520". */
const INTEGER_RE = /^(\d+|\d{1,3}(\.\d{3})+)$/;

/** Erro de validação de um contador (texto) — null quando válido. */
export function counterInputError(value: string): string | null {
  const text = value.replace(/\s/g, "");
  if (!text) return "Informe um número (use 0 se não houver).";
  if (!INTEGER_RE.test(text)) return "Use apenas números inteiros (ex.: 1.520).";
  if (Number(text.replace(/\./g, "")) > MAX_INTEGER) return "Valor muito alto.";
  return null;
}

/** "1.520" → 1520 · "" / inválido → null */
export function parseCounterInput(value: string): number | null {
  if (counterInputError(value)) return null;
  return Number(value.replace(/[\s.]/g, ""));
}

/** Erro de validação da nota (texto; vazio é permitido) — null quando válida. */
export function ratingInputError(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+([.,]\d+)?$/.test(text)) return "Informe uma nota entre 0 e 5 (ex.: 4,9).";
  const n = Number(text.replace(",", "."));
  if (n < 0 || n > 5) return "A nota deve estar entre 0 e 5.";
  if (!/^\d+([.,]\d)?$/.test(text)) return "Use no máximo uma casa decimal (ex.: 4,9).";
  return null;
}

/** "4,9" → 4.9 · "" → null (nota não informada) · inválida → undefined */
export function parseRatingInput(value: string): number | null | undefined {
  const text = value.trim();
  if (!text) return null;
  if (ratingInputError(text)) return undefined;
  return Number(text.replace(",", "."));
}

const counter = z.string().superRefine((value, ctx) => {
  const message = counterInputError(value);
  if (message) ctx.addIssue({ code: "custom", message });
});

export const gmnFormSchema = z
  .object({
    period: z.object({ from: z.string(), to: z.string() }).nullable(),
    search_views: counter,
    maps_views: counter,
    website_clicks: counter,
    direction_requests: counter,
    phone_calls: counter,
    total_reviews: counter,
    average_rating: z.string().superRefine((value, ctx) => {
      const message = ratingInputError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
    new_reviews: counter,
    notes: z.string().max(1000, "Use no máximo 1.000 caracteres."),
  })
  .superRefine((values, ctx) => {
    if (!values.period) {
      ctx.addIssue({ code: "custom", path: ["period"], message: "Selecione o período." });
    } else if (values.period.to < values.period.from) {
      ctx.addIssue({ code: "custom", path: ["period"], message: "O fim do período deve ser depois do início." });
    }
    const total = parseCounterInput(values.total_reviews);
    const fresh = parseCounterInput(values.new_reviews);
    if (total != null && fresh != null && fresh > total) {
      ctx.addIssue({
        code: "custom",
        path: ["new_reviews"],
        message: "Avaliações novas não podem ser mais que o total de avaliações.",
      });
    }
  });

export type GmnFormValues = z.infer<typeof gmnFormSchema>;

/** Formulário vazio (novo registro), opcionalmente com um período sugerido. */
export function emptyGmnFormValues(period: PeriodRange | null = null): GmnFormValues {
  return {
    period,
    search_views: "",
    maps_views: "",
    website_clicks: "",
    direction_requests: "",
    phone_calls: "",
    total_reviews: "",
    average_rating: "",
    new_reviews: "",
    notes: "",
  };
}

/** Registro do banco → valores do formulário (edição). */
export function metricToFormValues(metric: GmnMetric): GmnFormValues {
  const rating = metric.average_rating == null ? null : Number(metric.average_rating);
  return {
    period: { from: metric.period_start, to: metric.period_end },
    search_views: String(metric.search_views),
    maps_views: String(metric.maps_views),
    website_clicks: String(metric.website_clicks),
    direction_requests: String(metric.direction_requests),
    phone_calls: String(metric.phone_calls),
    total_reviews: String(metric.total_reviews),
    average_rating: rating != null && Number.isFinite(rating) ? formatDecimal(rating) : "",
    new_reviews: String(metric.new_reviews),
    notes: metric.notes ?? "",
  };
}

/** Valores validados do formulário → entrada de useSaveGmnMetric (com `id` na edição). */
export function formValuesToInput(values: GmnFormValues, id?: string | null): GmnMetricInput {
  if (!values.period) throw new Error("Período não informado");
  const rating = parseRatingInput(values.average_rating);
  return {
    ...(id ? { id } : {}),
    period_start: values.period.from,
    period_end: values.period.to,
    search_views: parseCounterInput(values.search_views) ?? 0,
    maps_views: parseCounterInput(values.maps_views) ?? 0,
    website_clicks: parseCounterInput(values.website_clicks) ?? 0,
    direction_requests: parseCounterInput(values.direction_requests) ?? 0,
    phone_calls: parseCounterInput(values.phone_calls) ?? 0,
    total_reviews: parseCounterInput(values.total_reviews) ?? 0,
    average_rating: rating ?? null,
    new_reviews: parseCounterInput(values.new_reviews) ?? 0,
    notes: values.notes.trim() || null,
  };
}

/** Sugestão de "avaliações novas" pelo total do registro anterior (nunca negativa). */
export function suggestNewReviews(totalReviews: number | null, previousTotal: number | null | undefined): number | null {
  if (totalReviews == null || previousTotal == null) return null;
  return Math.max(0, totalReviews - previousTotal);
}
