import { useMutation, useQueryClient, type QueryKey, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { markLeadCreatedLocally } from "@/components/providers/realtime-provider";
import { QUERY_KEYS, STATUS_META } from "@/lib/constants";
import { AppError, NOT_FOUND_MESSAGE, getErrorMessage } from "@/lib/errors";
import { requiresSchedule } from "@/lib/lead-status";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadInsert, LeadStatus } from "@/types/database";
import {
  INVALID_PHONE_MESSAGE,
  applyOptimisticLead,
  applyStatusChange,
  findLeadInCaches,
  normalizeStatusChange,
  replaceLeadInData,
  sanitizeLeadFields,
  validateStatusChange,
  type LeadEditableFields,
} from "./lead-query-utils";
import { newClientId, requireUserId } from "./supabase-helpers";

/** Campos do cadastro (status nasce "novo"; datas do funil e autoria são do banco). */
export type CreateLeadInput = LeadEditableFields;

/** Campos editáveis de um lead existente (status só muda por useChangeLeadStatus). */
export type UpdateLeadInput = Partial<LeadEditableFields>;

export interface UpdateLeadVariables {
  id: string;
  changes: UpdateLeadInput;
}

export interface ChangeLeadStatusVariables {
  /** Lead como está na tela (a versão mais recente do cache é usada se existir) */
  lead: Lead;
  to: LeadStatus;
  /** ISO — obrigatório quando `to` = "agendado" */
  scheduledAt?: string | null;
  note?: string | null;
}

interface ChangeStatusContext {
  snapshot: Array<[QueryKey, unknown]>;
}

const LEADS_MUTATION_KEY = QUERY_KEYS.leads;

/** Substitui o lead em todos os caches sob ["leads"] (lista, coleções, detalhe). */
function writeLeadToCaches(queryClient: ReturnType<typeof useQueryClient>, lead: Lead): void {
  queryClient.setQueriesData({ queryKey: QUERY_KEYS.leads }, (old: unknown) => replaceLeadInData(old, lead));
  queryClient.setQueryData(QUERY_KEYS.lead(lead.id), lead);
}

function invalidateLeadData(queryClient: ReturnType<typeof useQueryClient>): Promise<unknown> {
  // leads_total/leads_agendados de daily_metrics são recalculados por trigger
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMetrics }),
  ]);
}

/**
 * Cadastra lead (sempre em "novo"). Normaliza o telefone, grava created_by e marca o
 * id como criado nesta aba (sem toast de Realtime para quem cadastrou).
 */
export function useCreateLead(): UseMutationResult<Lead, Error, CreateLeadInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...LEADS_MUTATION_KEY, "create"],
    mutationFn: async (input: CreateLeadInput) => {
      const fields = sanitizeLeadFields(input);
      if (!fields.name) throw new AppError("Informe o nome do lead.");
      if (!fields.phone) throw new AppError(INVALID_PHONE_MESSAGE);
      if (!fields.source) throw new AppError("Informe a fonte do lead.");

      const supabase = createClient();
      const userId = await requireUserId(supabase);
      const id = newClientId();
      if (id) markLeadCreatedLocally(id);

      // status omitido de propósito: o banco cria sempre como "novo" (regra 1)
      const payload: LeadInsert = {
        ...fields,
        name: fields.name,
        phone: fields.phone,
        source: fields.source,
        created_by: userId,
        ...(id ? { id } : {}),
      };
      const { data } = await supabase.from("leads").insert(payload).select("*").single().throwOnError();
      if (!id) markLeadCreatedLocally(data.id);
      return data;
    },
    onSuccess: (lead) => {
      queryClient.setQueryData(QUERY_KEYS.lead(lead.id), lead);
      toast.success("Lead cadastrado");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateLeadData(queryClient),
  });
}

/** Edita campos do lead (telefone normalizado; status e datas do funil nunca são enviados). */
export function useUpdateLead(): UseMutationResult<Lead, Error, UpdateLeadVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...LEADS_MUTATION_KEY, "update"],
    mutationFn: async ({ id, changes }: UpdateLeadVariables) => {
      const fields = sanitizeLeadFields(changes);
      if (Object.keys(fields).length === 0) throw new AppError("Nenhuma alteração para salvar.");
      const { data } = await createClient()
        .from("leads")
        .update(fields)
        .eq("id", id)
        .select("*")
        .maybeSingle()
        .throwOnError();
      if (!data) throw new AppError(NOT_FOUND_MESSAGE);
      return data;
    },
    onSuccess: (lead) => {
      writeLeadToCaches(queryClient, lead);
      toast.success("Lead atualizado");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateLeadData(queryClient),
  });
}

/**
 * Muda o status pela RPC change_lead_status (registra nota no histórico).
 * Valida no cliente (regras 2 e 3), atualiza otimisticamente todas as queries de
 * leads (lista, kanban, dashboard, detalhe, contador) e desfaz em caso de erro.
 */
export function useChangeLeadStatus(): UseMutationResult<Lead, Error, ChangeLeadStatusVariables, ChangeStatusContext> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...LEADS_MUTATION_KEY, "change-status"],
    onMutate: async (vars: ChangeLeadStatusVariables): Promise<ChangeStatusContext> => {
      const current = findLeadInCaches(queryClient.getQueriesData({ queryKey: QUERY_KEYS.leads }), vars.lead.id) ?? vars.lead;
      const { scheduledAt } = validateStatusChange(current, vars);

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.leads });

      const next = applyStatusChange(current, vars.to, scheduledAt, new Date().toISOString());
      const snapshot: Array<[QueryKey, unknown]> = [];
      for (const [key, data] of queryClient.getQueriesData({ queryKey: QUERY_KEYS.leads })) {
        const updated = applyOptimisticLead(key, data, next, current.status);
        if (updated === undefined) continue;
        snapshot.push([key, data]);
        queryClient.setQueryData(key, updated);
      }
      return { snapshot };
    },
    mutationFn: async (vars: ChangeLeadStatusVariables) => {
      const { scheduledAt, note } = normalizeStatusChange(vars);
      const { data } = await createClient()
        .rpc("change_lead_status", {
          p_lead_id: vars.lead.id,
          p_status: vars.to,
          p_scheduled_at: requiresSchedule(vars.to) ? scheduledAt : null,
          p_note: note,
        })
        .throwOnError();
      return data;
    },
    onSuccess: (lead, vars) => {
      if (lead && typeof lead === "object" && "id" in lead) writeLeadToCaches(queryClient, lead);
      toast.success(`Status alterado para ${STATUS_META[vars.to].label}`);
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(getErrorMessage(error));
    },
    onSettled: () => invalidateLeadData(queryClient),
  });
}
