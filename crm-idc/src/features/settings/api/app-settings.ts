"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/constants";
import { AppError, NOT_FOUND_MESSAGE, getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { AppSettings, Profile } from "@/types/database";
import { DEFAULT_APP_SETTINGS, normalizeAppSettings, sanitizeAppSettingsUpdate, type AppSettingsUpdate } from "./defaults";

export type { AppSettingsUpdate } from "./defaults";

/**
 * Configurações do CRM (nome, logo, cores, concorrentes, mensagem do WhatsApp).
 * Passe `initialData` vindo de getAppSettings() (servidor) para evitar flash.
 * Enquanto carrega, `data` cai nos padrões.
 */
export function useAppSettings(initialData?: AppSettings): UseQueryResult<AppSettings> {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: async ({ signal }) => {
      const { data } = await createClient()
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .abortSignal(signal)
        .maybeSingle()
        .throwOnError();
      return normalizeAppSettings(data);
    },
    // dado do servidor conta como recém-buscado; sem ele, mostra os padrões até carregar
    initialData,
    placeholderData: initialData ? undefined : DEFAULT_APP_SETTINGS,
    staleTime: 5 * 60 * 1000,
  });
}

/** Salva configurações (só admin — RLS). Depois, chame router.refresh() para atualizar a marca no layout. */
export function useUpdateAppSettings(): UseMutationResult<AppSettings, Error, AppSettingsUpdate> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...QUERY_KEYS.settings, "update"],
    mutationFn: async (patch: AppSettingsUpdate) => {
      const changes = sanitizeAppSettingsUpdate(patch);
      if (Object.keys(changes).length === 0) throw new AppError("Nenhuma alteração para salvar.");
      const { data } = await createClient()
        .from("app_settings")
        .update(changes)
        .eq("id", 1)
        .select("*")
        .maybeSingle()
        .throwOnError();
      // RLS: UPDATE sem permissão não gera erro, apenas 0 linhas
      if (!data) throw new AppError(NOT_FOUND_MESSAGE);
      return normalizeAppSettings(data);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEYS.settings, settings);
      toast.success("Configurações salvas");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings }),
  });
}

/** Usuários do CRM (profiles), por nome. Criar/desativar usuário é feito no servidor (service role). */
export function useProfiles({ enabled = true }: { enabled?: boolean } = {}): UseQueryResult<Profile[]> {
  return useQuery({
    queryKey: QUERY_KEYS.profiles,
    queryFn: async ({ signal }) => {
      const { data } = await createClient()
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true })
        .abortSignal(signal)
        .throwOnError();
      return data;
    },
    enabled,
  });
}
