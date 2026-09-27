import { keepPreviousData, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { normalizePhone } from "@/lib/format";
import { createClient, type TypedSupabaseClient } from "@/lib/supabase/client";
import type { Lead, LeadHistory } from "@/types/database";
import {
  buildLeadSearchFilter,
  findLeadInCaches,
  leadKeys,
  normalizeLeadFilters,
  normalizeLeadsQueryOptions,
  pageCountFor,
  type LeadFilters,
  type LeadsPage,
  type LeadsQueryOptions,
  type NormalizedLeadFilters,
} from "./lead-query-utils";
import { fetchInBatches } from "./supabase-helpers";

export type { LeadFilters, LeadsPage, LeadsQueryOptions } from "./lead-query-utils";
export { leadKeys } from "./lead-query-utils";

/** Registro do histórico com o nome de quem alterou. */
export type LeadHistoryEntry = LeadHistory & { profile: { full_name: string } | null };

// -----------------------------------------------------------------------------
// Fetchers (usáveis fora de React, ex.: exportação CSV/PDF)
// -----------------------------------------------------------------------------

function leadsListQuery(supabase: TypedSupabaseClient, f: NormalizedLeadFilters, head: boolean) {
  let query = supabase.from("leads").select("*", { count: "exact", head });
  const search = buildLeadSearchFilter(f.search);
  if (search) query = query.or(search);
  if (f.status) query = query.in("status", f.status);
  if (f.source) query = query.in("source", f.source);
  if (f.service) query = query.in("service", f.service);
  if (f.createdFrom) query = query.gte("created_at", f.createdFrom);
  if (f.createdTo) query = query.lt("created_at", f.createdTo);
  return query;
}

function errorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err ? String((err as { code: unknown }).code) : undefined;
}

/**
 * Uma página de leads filtrada/ordenada no servidor (`count: "exact"`).
 * Se a página pedida passou do fim (filtros encolheram o total), devolve a última página válida.
 */
export async function fetchLeadsPage(
  supabase: TypedSupabaseClient,
  filters: LeadFilters = {},
  signal?: AbortSignal,
): Promise<LeadsPage> {
  const f = normalizeLeadFilters(filters);

  const runPage = async (page: number): Promise<LeadsPage> => {
    const from = (page - 1) * f.pageSize;
    let query = leadsListQuery(supabase, f, false)
      .order(f.sortBy, { ascending: f.sortDir === "asc", nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, from + f.pageSize - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, count } = await query.throwOnError();
    const total = count ?? data.length;
    return { rows: data, total, page, pageCount: pageCountFor(total, f.pageSize), pageSize: f.pageSize };
  };

  try {
    return await runPage(f.page);
  } catch (err) {
    // PGRST103: offset além do total (416 Range Not Satisfiable)
    if (errorCode(err) !== "PGRST103" || f.page === 1) throw err;
    let countQuery = leadsListQuery(supabase, f, true);
    if (signal) countQuery = countQuery.abortSignal(signal);
    const { count } = await countQuery.throwOnError();
    const lastPage = pageCountFor(count ?? 0, f.pageSize);
    return runPage(Math.min(f.page, lastPage));
  }
}

/**
 * Todos os leads que atendem às opções (sem paginação), buscados em lotes de 1000.
 * Ordenados por created_at desc.
 */
export async function fetchLeads(
  supabase: TypedSupabaseClient,
  opts: LeadsQueryOptions = {},
  signal?: AbortSignal,
): Promise<Lead[]> {
  const o = normalizeLeadsQueryOptions(opts);
  return fetchInBatches<Lead>(
    async (from, to) => {
      let query = supabase.from("leads").select("*");
      if (o.createdFrom) query = query.gte("created_at", o.createdFrom);
      if (o.createdTo) query = query.lt("created_at", o.createdTo);
      if (o.scheduledFrom) query = query.gte("scheduled_at", o.scheduledFrom);
      if (o.scheduledTo) query = query.lt("scheduled_at", o.scheduledTo);
      if (o.updatedSince) query = query.gte("updated_at", o.updatedSince);
      if (o.status) query = query.in("status", o.status);
      if (o.source) query = query.in("source", o.source);
      query = query.order("created_at", { ascending: false }).order("id", { ascending: true }).range(from, to);
      if (signal) query = query.abortSignal(signal);
      const { data } = await query.throwOnError();
      return data;
    },
    { limit: o.limit, getKey: (lead) => lead.id },
  );
}

export async function fetchLead(supabase: TypedSupabaseClient, id: string, signal?: AbortSignal): Promise<Lead | null> {
  let query = supabase.from("leads").select("*").eq("id", id);
  if (signal) query = query.abortSignal(signal);
  const { data } = await query.maybeSingle().throwOnError();
  return data;
}

export async function fetchLeadHistory(
  supabase: TypedSupabaseClient,
  leadId: string,
  signal?: AbortSignal,
): Promise<LeadHistoryEntry[]> {
  let query = supabase
    .from("lead_history")
    .select("*, profile:profiles!lead_history_changed_by_fkey(full_name)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (signal) query = query.abortSignal(signal);
  const { data } = await query.throwOnError();
  return data;
}

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

/**
 * Lista paginada de /leads (filtros, busca, ordenação e paginação no servidor).
 * Mantém a página anterior visível enquanto a próxima carrega (`isPlaceholderData`).
 * `data.page` é a página realmente exibida — sincronize o estado da UI com ela.
 */
export function useLeadsList(filters: LeadFilters = {}): UseQueryResult<LeadsPage> {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: ({ signal }) => fetchLeadsPage(createClient(), filters, signal),
    placeholderData: keepPreviousData,
  });
}

interface EnabledOption {
  enabled?: boolean;
}

/** Leads sem paginação (dashboard, kanban, relatórios). */
export function useLeads(opts: LeadsQueryOptions = {}, { enabled = true }: EnabledOption = {}): UseQueryResult<Lead[]> {
  return useQuery({
    queryKey: leadKeys.collection(opts),
    queryFn: ({ signal }) => fetchLeads(createClient(), opts, signal),
    enabled,
  });
}

/** Um lead (null se não existir). Usa a versão das listas em cache como placeholder instantâneo. */
export function useLead(id: string | null | undefined): UseQueryResult<Lead | null> {
  const queryClient = useQueryClient();
  const leadId = id ?? "";
  return useQuery<Lead | null>({
    queryKey: leadKeys.detail(leadId),
    queryFn: ({ signal }) => fetchLead(createClient(), leadId, signal),
    enabled: Boolean(id),
    placeholderData: () => findLeadInCaches(queryClient.getQueriesData({ queryKey: QUERY_KEYS.leads }), leadId),
  });
}

/** Histórico de status do lead (mais recente primeiro), com o nome de quem alterou. */
export function useLeadHistory(leadId: string | null | undefined): UseQueryResult<LeadHistoryEntry[]> {
  const id = leadId ?? "";
  return useQuery({
    queryKey: leadKeys.history(id),
    queryFn: ({ signal }) => fetchLeadHistory(createClient(), id, signal),
    enabled: Boolean(leadId),
  });
}

/** Quantidade de leads com status "novo" (badge da sidebar; atualizado pelo Realtime). */
export function useNewLeadsCount(): UseQueryResult<number> {
  return useQuery({
    queryKey: leadKeys.newCount(),
    queryFn: async ({ signal }) => {
      const { count } = await createClient()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "novo")
        .abortSignal(signal)
        .throwOnError();
      return count ?? 0;
    },
  });
}

interface LeadsByPhoneOptions extends EnabledOption {
  /** Ignora este lead (ex.: o próprio lead em edição) */
  excludeId?: string | null;
}

/**
 * Leads com o mesmo telefone (regra 4 — alerta de duplicado), mais recentes primeiro.
 * Aceita o telefone em qualquer formato; só consulta quando ele é válido.
 */
export function useLeadsByPhone(
  phoneDigits: string | null | undefined,
  { enabled = true, excludeId = null }: LeadsByPhoneOptions = {},
): UseQueryResult<Lead[]> {
  const phone = normalizePhone(phoneDigits) ?? "";
  return useQuery({
    queryKey: leadKeys.byPhone(phone, excludeId),
    queryFn: async ({ signal }) => {
      let query = createClient().from("leads").select("*").eq("phone", phone);
      if (excludeId) query = query.neq("id", excludeId);
      const { data } = await query
        .order("created_at", { ascending: false })
        .limit(20)
        .abortSignal(signal)
        .throwOnError();
      return data;
    },
    enabled: enabled && phone.length > 0,
    staleTime: 10_000,
  });
}
