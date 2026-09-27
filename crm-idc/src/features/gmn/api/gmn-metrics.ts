import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchInBatches, requireUserId } from "@/features/leads/api/supabase-helpers";
import { QUERY_KEYS } from "@/lib/constants";
import { AppError, NOT_FOUND_MESSAGE, getErrorMessage } from "@/lib/errors";
import { createClient, type TypedSupabaseClient } from "@/lib/supabase/client";
import type { GmnMetric } from "@/types/database";
import { sanitizeGmnMetric, type GmnMetricInput } from "./gmn-metrics-utils";

export type { GmnMetricInput, SanitizedGmnMetric } from "./gmn-metrics-utils";
export { sanitizeGmnMetric } from "./gmn-metrics-utils";

export const gmnMetricsKeys = {
  root: QUERY_KEYS.gmnMetrics,
  list: () => [...QUERY_KEYS.gmnMetrics, "list"] as const,
};

/** Todos os registros do GMN, do período mais recente para o mais antigo. */
export async function fetchGmnMetrics(supabase: TypedSupabaseClient, signal?: AbortSignal): Promise<GmnMetric[]> {
  return fetchInBatches<GmnMetric>(
    async (from, to) => {
      let query = supabase
        .from("gmn_metrics")
        .select("*")
        .order("period_end", { ascending: false })
        .order("period_start", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (signal) query = query.abortSignal(signal);
      const { data } = await query.throwOnError();
      return data;
    },
    { getKey: (row) => row.id },
  );
}

/** Histórico do GMN ordenado por period_end desc. */
export function useGmnMetrics(): UseQueryResult<GmnMetric[]> {
  return useQuery({
    queryKey: gmnMetricsKeys.list(),
    queryFn: ({ signal }) => fetchGmnMetrics(createClient(), signal),
  });
}

/** Registro mais recente do GMN (null se não houver) — compartilha o cache de useGmnMetrics. */
export function useLatestGmnMetric(): UseQueryResult<GmnMetric | null> {
  return useQuery({
    queryKey: gmnMetricsKeys.list(),
    queryFn: ({ signal }) => fetchGmnMetrics(createClient(), signal),
    select: (rows) => rows[0] ?? null,
  });
}

function invalidateGmn(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gmnMetrics });
}

/** Cria (sem `id`) ou edita (com `id`) um registro do GMN. */
export function useSaveGmnMetric(): UseMutationResult<GmnMetric, Error, GmnMetricInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.gmnMetrics, "save"],
    mutationFn: async (input: GmnMetricInput) => {
      const row = sanitizeGmnMetric(input);
      const supabase = createClient();
      if (input.id) {
        const { data } = await supabase
          .from("gmn_metrics")
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
        .from("gmn_metrics")
        .insert({ ...row, created_by: userId })
        .select("*")
        .single()
        .throwOnError();
      return data;
    },
    onSuccess: (_data, input) => {
      toast.success(input.id ? "Métricas do GMN atualizadas" : "Métricas do GMN salvas");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateGmn(queryClient),
  });
}

/** Exclui um registro do GMN (só admin — RLS). */
export function useDeleteGmnMetric(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.gmnMetrics, "delete"],
    mutationFn: async (id: string) => {
      const { data } = await createClient().from("gmn_metrics").delete().eq("id", id).select("id").throwOnError();
      // RLS não gera erro no DELETE: 0 linhas = sem permissão (ou já excluído)
      if (!data.length) throw new AppError(NOT_FOUND_MESSAGE);
    },
    onSuccess: () => {
      toast.success("Registro do GMN excluído");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateGmn(queryClient),
  });
}
