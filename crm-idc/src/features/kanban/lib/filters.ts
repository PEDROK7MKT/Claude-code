/**
 * Filtros do kanban (busca, fonte, serviço, finalizados antigos) — estado na
 * URL (?q=&fonte=&servico=&antigos=1) e aplicação no cliente sobre os leads
 * já carregados. Funções puras — filters.test.ts.
 */
import { subDays } from "date-fns";

import { buildLeadListHref } from "@/features/leads/lib/list-params";
import { LEAD_SOURCES, SERVICES } from "@/lib/constants";
import { startOfDateKey, toBahia, toDateKey, type DateInput } from "@/lib/dates";
import { foldText, searchPhoneDigits } from "@/lib/format";
import type { Lead, LeadSource, ServiceType } from "@/types/database";

import { FINALS_WINDOW_DAYS } from "./columns";

export interface KanbanFilters {
  /** Nome ou telefone */
  q: string;
  source: LeadSource[];
  service: ServiceType[];
  /** Inclui leads finalizados (compareceu, não compareceu, cancelado, perdido) de qualquer data */
  showOldFinals: boolean;
}

export const EMPTY_KANBAN_FILTERS: KanbanFilters = { q: "", source: [], service: [], showOldFinals: false };

/** Nomes dos parâmetros na URL (mesmos da lista de leads para busca/fonte/serviço). */
export const KANBAN_PARAM = {
  q: "q",
  source: "fonte",
  service: "servico",
  showOldFinals: "antigos",
} as const;

export const KANBAN_SEARCH_MAX_LENGTH = 100;

const SOURCE_ORDER: readonly LeadSource[] = LEAD_SOURCES.map((s) => s.value);
const SERVICE_ORDER: readonly ServiceType[] = SERVICES.map((s) => s.value);

/** Colapsa espaços e limita o tamanho do termo. */
export function normalizeKanbanSearch(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, KANBAN_SEARCH_MAX_LENGTH).trim();
}

/** Valores válidos de uma lista (aceita repetidos e separados por vírgula), na ordem canônica. */
function parseList<T extends string>(values: readonly string[], order: readonly T[]): T[] {
  const wanted = new Set(
    values
      .flatMap((value) => value.split(","))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  return order.filter((value) => wanted.has(value));
}

function toSearchParams(input: string | URLSearchParams): URLSearchParams {
  return typeof input === "string" ? new URLSearchParams(input.replace(/^\?/, "")) : input;
}

/** Lê os filtros da query string (valores inválidos são descartados). */
export function parseKanbanParams(input: string | URLSearchParams): KanbanFilters {
  const params = toSearchParams(input);
  const old = params.get(KANBAN_PARAM.showOldFinals);
  return {
    q: normalizeKanbanSearch(params.get(KANBAN_PARAM.q)),
    source: parseList(params.getAll(KANBAN_PARAM.source), SOURCE_ORDER),
    service: parseList(params.getAll(KANBAN_PARAM.service), SERVICE_ORDER),
    showOldFinals: old === "1" || old === "true" || old === "sim",
  };
}

/** Query string canônica (sem "?"); vazia quando não há filtros. */
export function serializeKanbanParams(filters: KanbanFilters): string {
  const params = new URLSearchParams();
  const q = normalizeKanbanSearch(filters.q);
  if (q) params.set(KANBAN_PARAM.q, q);
  const source = parseList(filters.source, SOURCE_ORDER);
  if (source.length) params.set(KANBAN_PARAM.source, source.join(","));
  const service = parseList(filters.service, SERVICE_ORDER);
  if (service.length) params.set(KANBAN_PARAM.service, service.join(","));
  if (filters.showOldFinals) params.set(KANBAN_PARAM.showOldFinals, "1");
  return params.toString();
}

export function patchKanbanFilters(filters: KanbanFilters, patch: Partial<KanbanFilters>): KanbanFilters {
  return { ...filters, ...patch };
}

/** Quantos filtros de conteúdo estão ativos (busca, fonte, serviço) — o toggle de antigos não conta. */
export function countActiveFilters(filters: KanbanFilters): number {
  return (
    (normalizeKanbanSearch(filters.q) ? 1 : 0) + (filters.source.length ? 1 : 0) + (filters.service.length ? 1 : 0)
  );
}

export function hasActiveFilters(filters: KanbanFilters): boolean {
  return countActiveFilters(filters) > 0;
}

/** Remove busca, fonte e serviço (mantém a preferência de finalizados antigos). */
export function clearKanbanFilters(filters: KanbanFilters): KanbanFilters {
  return { ...EMPTY_KANBAN_FILTERS, showOldFinals: filters.showOldFinals };
}

/**
 * "Ver lista": abre /leads com a mesma busca, fonte e serviço do quadro
 * (parâmetros compartilhados). O toggle de finalizados antigos é só do kanban.
 */
export function kanbanLeadListHref(filters: KanbanFilters): string {
  return buildLeadListHref({ q: filters.q, source: filters.source, service: filters.service });
}

// -----------------------------------------------------------------------------
// Aplicação no cliente
// -----------------------------------------------------------------------------

/**
 * Busca do kanban (mesma regra da lista /leads): todas as palavras no nome (sem
 * acento/caixa) OU, se o termo parece telefone, os dígitos contidos no telefone.
 */
export function matchesSearch(lead: Pick<Lead, "name" | "phone">, search: string): boolean {
  const term = normalizeKanbanSearch(search);
  if (!term) return true;
  const digits = searchPhoneDigits(term);
  if (digits && lead.phone.includes(digits)) return true;
  const name = foldText(lead.name);
  return foldText(term)
    .split(" ")
    .every((word) => name.includes(word));
}

export function matchesKanbanFilters(
  lead: Pick<Lead, "name" | "phone" | "source" | "service">,
  filters: KanbanFilters,
): boolean {
  if (filters.source.length && !filters.source.includes(lead.source)) return false;
  if (filters.service.length && (!lead.service || !filters.service.includes(lead.service))) return false;
  return matchesSearch(lead, filters.q);
}

export function filterKanbanLeads<T extends Pick<Lead, "name" | "phone" | "source" | "service">>(
  leads: readonly T[],
  filters: KanbanFilters,
): T[] {
  if (!hasActiveFilters(filters)) return [...leads];
  return leads.filter((lead) => matchesKanbanFilters(lead, filters));
}

// -----------------------------------------------------------------------------
// Janela dos finalizados
// -----------------------------------------------------------------------------

/**
 * Início (00:00 em America/Bahia, como ISO UTC) do dia de `FINALS_WINDOW_DAYS`
 * dias atrás. Estável durante o dia inteiro → chave de cache estável.
 */
export function finalsCutoffIso(now: DateInput = Date.now(), days = FINALS_WINDOW_DAYS): string {
  return startOfDateKey(toDateKey(subDays(toBahia(now), days))).toISOString();
}
