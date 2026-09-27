"use client";

import * as React from "react";
import { hashKey, onlineManager, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";

import { leadKeys, useLeadsByPhone } from "@/features/leads/api/leads-queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AppError, NETWORK_ERROR_MESSAGE } from "@/lib/errors";
import { normalizePhone } from "@/lib/format";
import type { Lead } from "@/types/database";

const PHONE_CHECK_DELAY_MS = 400;
const PHONE_CHECK_TIMEOUT_MS = 15_000;
const PHONE_CHECK_ERROR = "Não foi possível verificar se o telefone já está cadastrado. Tente novamente.";

export interface PhoneDuplicates {
  /** Leads com o telefone digitado (vazio enquanto verifica ou se o telefone é inválido) */
  duplicates: Lead[];
  /** Telefone válido aguardando a consulta */
  checking: boolean;
  /**
   * Resultado confirmado para o telefone (só dígitos) — usado no envio do formulário,
   * quando a consulta com atraso (debounce) ainda não terminou.
   */
  check: (phoneDigits: string) => Promise<Lead[]>;
}

/**
 * Regra 4 — leads duplicados: consulta os leads com o mesmo telefone enquanto a
 * pessoa digita (com atraso) e permite confirmar o resultado no envio.
 */
export function usePhoneDuplicates(
  rawPhone: string,
  { excludeId = null, enabled = true }: { excludeId?: string | null; enabled?: boolean } = {},
): PhoneDuplicates {
  const queryClient = useQueryClient();
  const phone = enabled ? normalizePhone(rawPhone) : null;
  const debounced = useDebouncedValue(phone, PHONE_CHECK_DELAY_MS);
  // Telefone consultado sem esperar o atraso (envio logo após digitar).
  const [forced, setForced] = React.useState<string | null>(null);
  const active = forced !== null && forced === phone ? forced : debounced;

  const query = useLeadsByPhone(active, { excludeId, enabled: enabled && active !== null });
  const current = phone !== null && active === phone;

  const check = React.useCallback(
    async (phoneDigits: string): Promise<Lead[]> => {
      const key = leadKeys.byPhone(phoneDigits, excludeId);
      const state = queryClient.getQueryState<Lead[]>(key);
      if (state?.status === "success" && state.fetchStatus === "idle" && state.data) return state.data;
      if (!onlineManager.isOnline()) throw new AppError(NETWORK_ERROR_MESSAGE);
      setForced(phoneDigits);
      return waitForQueryData<Lead[]>(queryClient, key, PHONE_CHECK_TIMEOUT_MS);
    },
    [queryClient, excludeId],
  );

  return {
    duplicates: current && query.data ? query.data : [],
    checking: phone !== null && (!current || query.isPending),
    check,
  };
}

/**
 * Espera a query `queryKey` terminar (sucesso ou erro). A query precisa ter um
 * observador montado (aqui, o useLeadsByPhone acima, após setForced).
 */
function waitForQueryData<T>(queryClient: QueryClient, queryKey: QueryKey, timeoutMs: number): Promise<T> {
  const hash = hashKey(queryKey);
  const startedAt = Date.now();
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      window.clearTimeout(timer);
      fn();
    };
    const evaluate = () => {
      const state = queryClient.getQueryState<T>(queryKey);
      if (!state || state.fetchStatus !== "idle") return;
      if (state.status === "success" && state.data !== undefined) {
        const data = state.data;
        finish(() => resolve(data));
      } else if (state.status === "error" && state.errorUpdatedAt >= startedAt) {
        // erro antigo (de antes desta verificação) é ignorado: o observador vai buscar de novo
        finish(() => reject(state.error ?? new AppError(PHONE_CHECK_ERROR)));
      }
    };
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryHash === hash) evaluate();
    });
    const timer = window.setTimeout(() => finish(() => reject(new AppError(PHONE_CHECK_ERROR))), timeoutMs);
    evaluate();
  });
}
