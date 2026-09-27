/**
 * Funções puras da camada de dados de leads: chaves de query, normalização de
 * filtros, busca segura no PostgREST e atualizações otimistas do cache.
 * (Sem React/Supabase — testadas em lead-query-utils.test.ts.)
 */
import type { QueryKey } from "@tanstack/react-query";
import { PAGE_SIZE, QUERY_KEYS, STATUS_META } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { normalizePhone } from "@/lib/format";
import { canTransition, requiresSchedule, transitionErrorMessage } from "@/lib/lead-status";
import { canonicalCampaignName } from "@/lib/utm";
import type { Lead, LeadInsert, LeadSource, LeadStatus, ServiceType } from "@/types/database";

// -----------------------------------------------------------------------------
// Filtros
// -----------------------------------------------------------------------------

export type SortDirection = "asc" | "desc";

/** Filtros da lista paginada de leads (/leads). */
export interface LeadFilters {
  /** Nome (ilike) OU dígitos do telefone */
  search?: string;
  status?: LeadStatus[];
  source?: LeadSource[];
  service?: ServiceType[];
  /** ISO inclusivo */
  createdFrom?: string;
  /** ISO exclusivo */
  createdTo?: string;
  sortBy?: keyof Lead;
  sortDir?: SortDirection;
  /** 1-based */
  page?: number;
  /** Padrão PAGE_SIZE (20) */
  pageSize?: number;
}

export interface NormalizedLeadFilters {
  search?: string;
  status?: LeadStatus[];
  source?: LeadSource[];
  service?: ServiceType[];
  createdFrom?: string;
  createdTo?: string;
  sortBy: keyof Lead;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}

/** Opções das consultas NÃO paginadas (dashboard, kanban, relatórios). */
export interface LeadsQueryOptions {
  /** created_at >= (ISO) */
  createdFrom?: string;
  /** created_at < (ISO) */
  createdTo?: string;
  /** scheduled_at >= (ISO) */
  scheduledFrom?: string;
  /** scheduled_at < (ISO) */
  scheduledTo?: string;
  status?: LeadStatus[];
  source?: LeadSource[];
  /** updated_at >= (ISO) */
  updatedSince?: string;
  /** Máximo de linhas (padrão: todas) */
  limit?: number;
}

export const MAX_PAGE_SIZE = 1000;

/** Colunas aceitas em `sortBy` (protege contra valores vindos da URL). */
export const LEAD_SORTABLE_COLUMNS = [
  "name",
  "phone",
  "source",
  "service",
  "status",
  "campaign",
  "keyword",
  "created_at",
  "updated_at",
  "scheduled_at",
  "contacted_at",
  "confirmed_at",
  "attended_at",
  "estimated_value",
] as const satisfies ReadonlyArray<keyof Lead>;

function uniqueSorted<T extends string>(values: readonly T[] | undefined): T[] | undefined {
  if (!values?.length) return undefined;
  return [...new Set(values)].sort();
}

function cleanString(value: string | null | undefined): string | undefined {
  const v = value?.replace(/\s+/g, " ").trim();
  return v ? v : undefined;
}

/** Normaliza filtros para que combinações equivalentes compartilhem a mesma chave de cache. */
export function normalizeLeadFilters(filters: LeadFilters = {}): NormalizedLeadFilters {
  const sortBy = (LEAD_SORTABLE_COLUMNS as readonly string[]).includes(filters.sortBy ?? "")
    ? (filters.sortBy as keyof Lead)
    : "created_at";
  const page = Number.isFinite(filters.page) ? Math.max(1, Math.floor(filters.page as number)) : 1;
  const rawSize = Number.isFinite(filters.pageSize) ? Math.floor(filters.pageSize as number) : PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));
  const out: NormalizedLeadFilters = {
    sortBy,
    sortDir: filters.sortDir === "asc" ? "asc" : "desc",
    page,
    pageSize,
  };
  const search = cleanString(filters.search);
  if (search) out.search = search;
  const status = uniqueSorted(filters.status);
  if (status) out.status = status;
  const source = uniqueSorted(filters.source);
  if (source) out.source = source;
  const service = uniqueSorted(filters.service);
  if (service) out.service = service;
  const createdFrom = cleanString(filters.createdFrom);
  if (createdFrom) out.createdFrom = createdFrom;
  const createdTo = cleanString(filters.createdTo);
  if (createdTo) out.createdTo = createdTo;
  return out;
}

export function normalizeLeadsQueryOptions(opts: LeadsQueryOptions = {}): LeadsQueryOptions {
  const out: LeadsQueryOptions = {};
  for (const key of ["createdFrom", "createdTo", "scheduledFrom", "scheduledTo", "updatedSince"] as const) {
    const value = cleanString(opts[key]);
    if (value) out[key] = value;
  }
  const status = uniqueSorted(opts.status);
  if (status) out.status = status;
  const source = uniqueSorted(opts.source);
  if (source) out.source = source;
  if (opts.limit != null && Number.isFinite(opts.limit)) out.limit = Math.max(1, Math.floor(opts.limit));
  return out;
}

// -----------------------------------------------------------------------------
// Chaves de query — tudo sob ["leads"]: invalidate(["leads"]) atualiza lista,
// kanban, dashboard, detalhe, histórico e contador de novos.
// -----------------------------------------------------------------------------

export const leadKeys = {
  root: QUERY_KEYS.leads,
  lists: () => [...QUERY_KEYS.leads, "list"] as const,
  list: (filters: LeadFilters) => [...QUERY_KEYS.leads, "list", normalizeLeadFilters(filters)] as const,
  collections: () => [...QUERY_KEYS.leads, "collection"] as const,
  collection: (opts: LeadsQueryOptions) => [...QUERY_KEYS.leads, "collection", normalizeLeadsQueryOptions(opts)] as const,
  detail: (id: string) => QUERY_KEYS.lead(id),
  history: (id: string) => QUERY_KEYS.leadHistory(id),
  newCount: () => QUERY_KEYS.newLeadsCount,
  byPhone: (phone: string, excludeId?: string | null) =>
    [...QUERY_KEYS.leads, "by-phone", phone, excludeId ?? null] as const,
};

// -----------------------------------------------------------------------------
// Busca (PostgREST .or())
// -----------------------------------------------------------------------------

/** Escapa curingas do LIKE (% _ \) para busca literal. */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, "\\$&");
}

/** Valor entre aspas para filtros .or() do PostgREST (vírgulas, parênteses e pontos ficam seguros). */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/[\\"]/g, "\\$&")}"`;
}

/**
 * Filtro para `.or()` da busca: nome contém o termo (ilike) OU, se o termo parece
 * telefone, o telefone contém os dígitos. Retorna null para busca vazia.
 */
export function buildLeadSearchFilter(search: string | null | undefined): string | null {
  const term = cleanString(search ?? undefined);
  if (!term) return null;
  const parts = [`name.ilike.${quotePostgrestValue(`%${escapeLikePattern(term)}%`)}`];
  if (/^[\d\s()+.-]+$/.test(term)) {
    let digits = term.replace(/\D/g, "");
    if (digits.length >= 12 && digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length >= 2) parts.push(`phone.ilike.%${digits}%`);
  }
  return parts.join(",");
}

// -----------------------------------------------------------------------------
// Sanitização de campos do lead (formulários, webhook)
// -----------------------------------------------------------------------------

/** Campos que o cliente nunca envia: status só muda pela RPC; datas do funil e autoria são do banco. */
const DB_CONTROLLED_FIELDS = [
  "id",
  "status",
  "created_by",
  "created_at",
  "updated_at",
  "contacted_at",
  "confirmed_at",
  "attended_at",
] as const;

export type LeadEditableFields = Omit<LeadInsert, (typeof DB_CONTROLLED_FIELDS)[number]>;

const OPTIONAL_TEXT_FIELDS = [
  "notes",
  "keyword",
  "ad_group",
  "landing_page",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "service_detail",
] as const satisfies ReadonlyArray<keyof LeadEditableFields>;

export const INVALID_PHONE_MESSAGE = "Telefone inválido. Informe DDD + número (10 ou 11 dígitos).";

function trimmedOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v : null;
}

/**
 * Limpa campos editáveis do lead: remove campos controlados pelo banco, faz trim
 * (texto vazio → null), normaliza telefone (lança AppError se inválido) e usa o
 * nome canônico da campanha. Só inclui as chaves presentes em `input`.
 */
export function sanitizeLeadFields(input: Partial<LeadEditableFields> & Record<string, unknown>): Partial<LeadEditableFields> {
  const out: Partial<LeadEditableFields> = {};
  const has = (key: string) => Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined;

  if (has("name")) {
    const name = typeof input.name === "string" ? input.name.replace(/\s+/g, " ").trim() : "";
    if (!name) throw new AppError("Informe o nome do lead.");
    out.name = name;
  }
  if (has("phone")) {
    const phone = normalizePhone(typeof input.phone === "string" ? input.phone : null);
    if (!phone) throw new AppError(INVALID_PHONE_MESSAGE);
    out.phone = phone;
  }
  if (has("source")) {
    if (!input.source) throw new AppError("Informe a fonte do lead.");
    out.source = input.source;
  }
  if (has("service")) out.service = input.service || null;
  if (has("campaign")) out.campaign = canonicalCampaignName(typeof input.campaign === "string" ? input.campaign : null);
  for (const key of OPTIONAL_TEXT_FIELDS) {
    if (has(key)) out[key] = trimmedOrNull(input[key]);
  }
  if (has("scheduled_at")) {
    const value = trimmedOrNull(input.scheduled_at);
    if (value && Number.isNaN(Date.parse(value))) throw new AppError("Data da consulta inválida.");
    out.scheduled_at = value ? new Date(value).toISOString() : null;
  }
  if (has("estimated_value")) {
    const value = input.estimated_value;
    if (value === null || (value as unknown) === "") out.estimated_value = null;
    else {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) throw new AppError("Valor estimado inválido.");
      out.estimated_value = Math.round(n * 100) / 100;
    }
  }
  if (has("assigned_to")) out.assigned_to = trimmedOrNull(input.assigned_to);
  if (has("parent_lead_id")) out.parent_lead_id = trimmedOrNull(input.parent_lead_id);
  return out;
}

// -----------------------------------------------------------------------------
// Mudança de status (validação no cliente + espelho dos triggers para o otimista)
// -----------------------------------------------------------------------------

export interface StatusChangeArgs {
  to: LeadStatus;
  scheduledAt?: string | null;
  note?: string | null;
}

export interface NormalizedStatusChange {
  /** ISO UTC — só quando `to` exige agendamento */
  scheduledAt: string | null;
  note: string | null;
}

/** Regra 3 + limpeza da nota (sem checar a transição). */
export function normalizeStatusChange(args: StatusChangeArgs): NormalizedStatusChange {
  const note = trimmedOrNull(args.note);
  if (!requiresSchedule(args.to)) return { scheduledAt: null, note };
  const raw = trimmedOrNull(args.scheduledAt);
  if (!raw) throw new AppError("Informe a data e hora da consulta para agendar o lead.");
  const time = Date.parse(raw);
  if (Number.isNaN(time)) throw new AppError("Data da consulta inválida.");
  return { scheduledAt: new Date(time).toISOString(), note };
}

/** Regras 2 e 3 no cliente: lança AppError (pt-BR) se a mudança não for permitida. */
export function validateStatusChange(current: Pick<Lead, "status">, args: StatusChangeArgs): NormalizedStatusChange {
  if (current.status === args.to) {
    throw new AppError(`O lead já está como "${STATUS_META[args.to].label}".`);
  }
  if (!canTransition(current.status, args.to)) {
    throw new AppError(transitionErrorMessage(current.status, args.to));
  }
  return normalizeStatusChange(args);
}

/** Aplica a mudança de status localmente, espelhando as datas automáticas do trigger enforce_lead_rules. */
export function applyStatusChange(lead: Lead, to: LeadStatus, scheduledAt: string | null, nowIso: string): Lead {
  const next: Lead = { ...lead, status: to, updated_at: nowIso };
  switch (to) {
    case "em_contato":
      next.contacted_at = lead.contacted_at ?? nowIso;
      break;
    case "agendado":
      next.contacted_at = lead.contacted_at ?? nowIso;
      next.scheduled_at = scheduledAt ?? lead.scheduled_at;
      next.confirmed_at = null;
      next.attended_at = null;
      break;
    case "confirmado":
      next.confirmed_at = lead.confirmed_at ?? nowIso;
      break;
    case "compareceu":
      next.attended_at = lead.attended_at ?? nowIso;
      break;
    default:
      break;
  }
  return next;
}

// -----------------------------------------------------------------------------
// Cache: localizar/substituir um lead em qualquer formato de dado sob ["leads"]
// -----------------------------------------------------------------------------

export interface LeadsPage {
  rows: Lead[];
  total: number;
  /** Página efetivamente retornada (1-based) — pode ser menor que a pedida se os filtros encolheram o total */
  page: number;
  pageCount: number;
  pageSize: number;
}

export function isLeadRow(value: unknown): value is Lead {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.phone === "string" && typeof v.status === "string" && "source" in v;
}

export function isLeadsPage(value: unknown): value is LeadsPage {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as LeadsPage).rows) &&
    typeof (value as LeadsPage).total === "number"
  );
}

/**
 * Substitui o lead `id` (via `update`) dentro de um dado de cache — lead único,
 * array de leads ou página. Retorna undefined quando nada muda (setQueryData ignora).
 */
export function updateLeadInData(data: unknown, id: string, update: (lead: Lead) => Lead): unknown {
  if (isLeadRow(data)) return data.id === id ? update(data) : undefined;
  if (Array.isArray(data)) {
    const index = data.findIndex((item) => isLeadRow(item) && item.id === id);
    if (index === -1) return undefined;
    const copy = data.slice();
    copy[index] = update(data[index] as Lead);
    return copy;
  }
  if (isLeadsPage(data)) {
    const rows = updateLeadInData(data.rows, id, update);
    return rows === undefined ? undefined : { ...data, rows };
  }
  return undefined;
}

/** Substitui o lead pelo registro vindo do servidor em qualquer formato de cache. */
export function replaceLeadInData(data: unknown, lead: Lead): unknown {
  return updateLeadInData(data, lead.id, (current) => ({ ...current, ...lead }));
}

/** Procura a versão mais recente de um lead nos caches (detalhe tem prioridade). */
export function findLeadInCaches(entries: ReadonlyArray<readonly [QueryKey, unknown]>, id: string): Lead | undefined {
  let found: Lead | undefined;
  for (const [key, data] of entries) {
    if (key[1] === "detail" && isLeadRow(data) && data.id === id) return data;
    if (found) continue;
    const list = isLeadsPage(data) ? data.rows : Array.isArray(data) ? data : null;
    const match = list?.find((item): item is Lead => isLeadRow(item) && item.id === id);
    if (match) found = match;
  }
  return found;
}

function filterStatuses(key: QueryKey): readonly LeadStatus[] | undefined {
  const params = key[2];
  if ((key[1] === "list" || key[1] === "collection") && typeof params === "object" && params !== null) {
    const status = (params as { status?: LeadStatus[] }).status;
    return status?.length ? status : undefined;
  }
  return undefined;
}

/**
 * Dado otimista de UMA query sob ["leads"] após a mudança de status de `next`:
 * - listas/coleções filtradas por status que não inclui o novo status → remove o lead
 * - demais formatos com o lead → substitui
 * - contador de novos → ajusta
 * Retorna undefined quando a query não é afetada.
 */
export function applyOptimisticLead(key: QueryKey, data: unknown, next: Lead, previousStatus: LeadStatus): unknown {
  if (data === undefined) return undefined;

  if (key.length === QUERY_KEYS.newLeadsCount.length && key.every((part, i) => part === QUERY_KEYS.newLeadsCount[i])) {
    if (typeof data !== "number" || previousStatus === next.status) return undefined;
    const delta = (next.status === "novo" ? 1 : 0) - (previousStatus === "novo" ? 1 : 0);
    return delta === 0 ? undefined : Math.max(0, data + delta);
  }

  const statuses = filterStatuses(key);
  if (statuses && !statuses.includes(next.status)) {
    if (isLeadsPage(data)) {
      const rows = data.rows.filter((row) => row.id !== next.id);
      if (rows.length === data.rows.length) return undefined;
      const total = Math.max(0, data.total - 1);
      return { ...data, rows, total, pageCount: Math.max(1, Math.ceil(total / data.pageSize)) };
    }
    if (Array.isArray(data)) {
      const rows = data.filter((row) => !(isLeadRow(row) && row.id === next.id));
      return rows.length === data.length ? undefined : rows;
    }
  }

  return updateLeadInData(data, next.id, () => next);
}

/** Página a partir do total (sempre ≥ 1). */
export function pageCountFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}
