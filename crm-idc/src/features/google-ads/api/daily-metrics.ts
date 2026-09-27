import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { chunk, fetchInBatches, requireUserId } from "@/features/leads/api/supabase-helpers";
import { QUERY_KEYS } from "@/lib/constants";
import { AppError, NOT_FOUND_MESSAGE, PERMISSION_ERROR_MESSAGE, getErrorMessage } from "@/lib/errors";
import { createClient, type TypedSupabaseClient } from "@/lib/supabase/client";
import type { DailyMetric } from "@/types/database";
import { dedupeDailyMetrics, sanitizeDailyMetric, type DailyMetricInput } from "./daily-metrics-utils";

export type { DailyMetricInput } from "./daily-metrics-utils";
export { dedupeDailyMetrics, isValidDateKey, sanitizeDailyMetric } from "./daily-metrics-utils";

/** Intervalo de datas-calendário (yyyy-MM-dd), ambos inclusivos. */
export interface DailyMetricsRange {
  fromKey?: string;
  toKey?: string;
}

export interface ImportDailyMetricsResult {
  /** Linhas recebidas */
  received: number;
  /** Linhas gravadas (inseridas ou atualizadas) */
  imported: number;
  /** Linhas repetidas (mesma data e campanha) descartadas — vale a última */
  duplicates: number;
}

const IMPORT_CHUNK_SIZE = 500;

export const dailyMetricsKeys = {
  root: QUERY_KEYS.dailyMetrics,
  list: (range: DailyMetricsRange = {}) =>
    [...QUERY_KEYS.dailyMetrics, "list", { fromKey: range.fromKey ?? null, toKey: range.toKey ?? null }] as const,
};

/** Métricas do intervalo (todas as campanhas), mais recentes primeiro. */
export async function fetchDailyMetrics(
  supabase: TypedSupabaseClient,
  range: DailyMetricsRange = {},
  signal?: AbortSignal,
): Promise<DailyMetric[]> {
  return fetchInBatches<DailyMetric>(
    async (from, to) => {
      let query = supabase.from("daily_metrics").select("*");
      if (range.fromKey) query = query.gte("date", range.fromKey);
      if (range.toKey) query = query.lte("date", range.toKey);
      query = query
        .order("date", { ascending: false })
        .order("campaign", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);
      if (signal) query = query.abortSignal(signal);
      const { data } = await query.throwOnError();
      return data;
    },
    { getKey: (row) => row.id },
  );
}

/** Métricas diárias do Google Ads de `fromKey` a `toKey` (inclusivos; omitidos = sem limite). */
export function useDailyMetrics(range: DailyMetricsRange = {}, { enabled = true }: { enabled?: boolean } = {}): UseQueryResult<DailyMetric[]> {
  return useQuery({
    queryKey: dailyMetricsKeys.list(range),
    queryFn: ({ signal }) => fetchDailyMetrics(createClient(), range, signal),
    enabled,
  });
}

function invalidateMetrics(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMetrics });
}

/**
 * Salva a métrica de um dia/campanha. Sem `id`: upsert por (date, campaign) — lançar
 * de novo o mesmo dia atualiza a linha. Com `id`: edita a linha (pode mudar data/campanha).
 */
export function useUpsertDailyMetric(): UseMutationResult<DailyMetric, Error, DailyMetricInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.dailyMetrics, "upsert"],
    mutationFn: async (input: DailyMetricInput) => {
      const row = sanitizeDailyMetric(input);
      const supabase = createClient();
      if (input.id) {
        const { data } = await supabase
          .from("daily_metrics")
          .update(row)
          .eq("id", input.id)
          .select("*")
          .maybeSingle()
          .throwOnError();
        if (!data) throw new AppError(NOT_FOUND_MESSAGE);
        return data;
      }
      const userId = await requireUserId(supabase);
      const { data } = await supabase
        .from("daily_metrics")
        .upsert({ ...row, created_by: userId }, { onConflict: "date,campaign" })
        .select("*")
        .single()
        .throwOnError();
      return data;
    },
    onSuccess: (_data, input) => {
      toast.success(input.id ? "Métrica atualizada" : "Métrica salva");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateMetrics(queryClient),
  });
}

function pluralMetrics(n: number): string {
  return n === 1 ? "1 métrica importada" : `${n.toLocaleString("pt-BR")} métricas importadas`;
}

/**
 * Importação em massa (CSV): valida cada linha, descarta repetidas (vale a última)
 * e faz upsert por (date, campaign) em lotes de 500.
 */
export function useImportDailyMetrics(): UseMutationResult<ImportDailyMetricsResult, Error, DailyMetricInput[]> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.dailyMetrics, "import"],
    mutationFn: async (inputs: DailyMetricInput[]) => {
      if (!inputs.length) throw new AppError("Nenhuma linha para importar.");
      const sanitized = inputs.map((input, index) => {
        try {
          return sanitizeDailyMetric(input);
        } catch (err) {
          throw new AppError(`Linha ${index + 1}: ${getErrorMessage(err)}`);
        }
      });
      const { rows, duplicates } = dedupeDailyMetrics(sanitized);

      const supabase = createClient();
      const userId = await requireUserId(supabase);
      let imported = 0;
      for (const batch of chunk(rows, IMPORT_CHUNK_SIZE)) {
        try {
          const { data } = await supabase
            .from("daily_metrics")
            .upsert(
              batch.map((row) => ({ ...row, created_by: userId })),
              { onConflict: "date,campaign" },
            )
            .select("id")
            .throwOnError();
          imported += data.length;
        } catch (err) {
          if (imported === 0) throw err;
          throw new AppError(
            `Importação interrompida: ${imported} de ${rows.length} linhas foram salvas. ${getErrorMessage(err)}`,
          );
        }
      }
      return { received: inputs.length, imported, duplicates };
    },
    onSuccess: (result) => {
      toast.success(pluralMetrics(result.imported), {
        description:
          result.duplicates > 0
            ? `${result.duplicates} linha(s) repetida(s) de mesma data e campanha foram ignoradas (vale a última).`
            : undefined,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateMetrics(queryClient),
  });
}

/** Exclui a métrica de um dia/campanha (só admin — RLS). */
export function useDeleteDailyMetric(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.dailyMetrics, "delete"],
    mutationFn: async (id: string) => {
      const { data } = await createClient().from("daily_metrics").delete().eq("id", id).select("id").throwOnError();
      // RLS não gera erro no DELETE: 0 linhas = sem permissão (ou já excluída)
      if (!data.length) throw new AppError(PERMISSION_ERROR_MESSAGE);
    },
    onSuccess: () => {
      toast.success("Métrica excluída");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateMetrics(queryClient),
  });
}
