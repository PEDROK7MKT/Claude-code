"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import { QUERY_KEYS, SOURCE_LABEL } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/types/database";

/** Por quanto tempo um lead criado nesta aba é ignorado pelo toast de "Novo lead". */
const LOCAL_CREATION_TTL = 2 * 60 * 1000;
/** Agrupa rajadas de eventos (ex.: importação) numa única invalidação. */
const INVALIDATE_DEBOUNCE = 300;

const locallyCreatedLeadIds = new Set<string>();

/**
 * Marca um lead como criado nesta aba (chamado por useCreateLead ANTES do insert,
 * com o id gerado no cliente) para não exibir o toast "Novo lead" para quem o cadastrou.
 */
export function markLeadCreatedLocally(id: string): void {
  locallyCreatedLeadIds.add(id);
  setTimeout(() => locallyCreatedLeadIds.delete(id), LOCAL_CREATION_TTL);
}

const RealtimeConnectedContext = React.createContext(false);

/** `true` enquanto o canal Realtime (leads + daily_metrics) está inscrito. */
export function useRealtimeConnected(): boolean {
  return React.useContext(RealtimeConnectedContext);
}

let channelSeq = 0;

/**
 * Supabase Realtime do app autenticado: mantém leads/kanban/dashboard e métricas
 * atualizados quando outro usuário (ou o webhook) altera dados, e avisa novos leads.
 * Deve ficar dentro do QueryProvider (layout autenticado).
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const routerRef = React.useRef(router);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    routerRef.current = router;
  }, [router]);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    let hasSubscribed = false;
    let disposed = false;

    /** Invalida um prefixo de queries com debounce; leads em mutação são invalidados no onSettled dela. */
    const scheduleInvalidate = (queryKey: readonly string[]) => {
      const id = queryKey.join("/");
      const current = timers.get(id);
      if (current) clearTimeout(current);
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          if (disposed) return;
          if (queryKey[0] === QUERY_KEYS.leads[0] && queryClient.isMutating({ mutationKey: QUERY_KEYS.leads }) > 0) {
            return;
          }
          void queryClient.invalidateQueries({ queryKey });
        }, INVALIDATE_DEBOUNCE),
      );
    };

    const onLeadChange = (payload: RealtimePostgresChangesPayload<Lead>) => {
      scheduleInvalidate(QUERY_KEYS.leads);
      if (payload.eventType !== "INSERT") return;
      const lead = payload.new;
      if (!lead?.id || locallyCreatedLeadIds.has(lead.id)) return;
      toast.info(`Novo lead: ${lead.name}`, {
        id: `new-lead-${lead.id}`,
        description: lead.source ? SOURCE_LABEL[lead.source] : undefined,
        duration: 10_000,
        action: {
          label: "Ver",
          onClick: () => routerRef.current.push(`/leads/${lead.id}`),
        },
      });
    };

    const channel: RealtimeChannel = supabase
      .channel(`crm-changes-${Date.now().toString(36)}-${++channelSeq}`)
      .on<Lead>("postgres_changes", { event: "*", schema: "public", table: "leads" }, onLeadChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, () =>
        scheduleInvalidate(QUERY_KEYS.dailyMetrics),
      )
      .subscribe((status) => {
        if (disposed) return;
        const isSubscribed = status === "SUBSCRIBED";
        setConnected(isSubscribed);
        if (isSubscribed) {
          // Reconexão: eventos perdidos enquanto o canal estava fora — recarrega tudo
          if (hasSubscribed) {
            scheduleInvalidate(QUERY_KEYS.leads);
            scheduleInvalidate(QUERY_KEYS.dailyMetrics);
          }
          hasSubscribed = true;
        }
      });

    return () => {
      disposed = true;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return <RealtimeConnectedContext value={connected}>{children}</RealtimeConnectedContext>;
}
