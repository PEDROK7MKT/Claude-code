/**
 * Estado da lista de leads (/leads) na URL: busca, filtros, período, ordenação e
 * página. Tudo é lido e gravado na query string para que links como
 * `/leads?status=novo` (dashboard) e `/leads?fonte=google_ads&periodo=7d` funcionem.
 * Valores inválidos são ignorados. Funções puras (testadas em list-params.test.ts).
 */
import { LEAD_SOURCES, LEAD_STATUSES, PAGE_SIZE, SERVICES } from "@/lib/constants";
import {
  bahiaLocalToIso,
  getPeriodRanges,
  PERIOD_OPTIONS,
  todayKey,
  type DateInput,
  type PeriodKey,
} from "@/lib/dates";
import type { LeadFilters } from "@/features/leads/api/lead-query-utils";
import type { Lead, LeadSource, LeadStatus, ServiceType } from "@/types/database";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type SortDirection = "asc" | "desc";

/** Colunas ordenáveis da tabela (nomes das colunas no banco). */
export const LEAD_LIST_SORT_COLUMNS = [
  "name",
  "phone",
  "source",
  "service",
  "status",
  "created_at",
  "scheduled_at",
] as const satisfies ReadonlyArray<keyof Lead>;

export type LeadListSortColumn = (typeof LEAD_LIST_SORT_COLUMNS)[number];

export interface LeadListSort {
  column: LeadListSortColumn;
  dir: SortDirection;
}

/** Período de entrada: atalho relativo (hoje, 7 dias…) ou datas fixas (yyyy-MM-dd, Bahia). */
export type LeadListPeriod =
  | { kind: "preset"; key: PeriodKey }
  /** `to` null = sem limite final ("desde …") */
  | { kind: "custom"; from: string; to: string | null };

export interface LeadListParams {
  /** Busca por nome ou telefone (já normalizada: espaços colapsados) */
  q: string;
  status: LeadStatus[];
  source: LeadSource[];
  service: ServiceType[];
  period: LeadListPeriod | null;
  sort: LeadListSort;
  /** 1-based */
  page: number;
}

/** Nomes dos parâmetros na URL (em português, como o resto do app). */
export const LIST_PARAM = {
  search: "q",
  status: "status",
  source: "fonte",
  service: "servico",
  period: "periodo",
  from: "de",
  to: "ate",
  sort: "ordem",
  page: "pagina",
} as const;

type ListParamName = keyof typeof LIST_PARAM;

/** Aliases aceitos na leitura (links antigos/externos, ex.: `/leads?source=google_ads`). */
const PARAM_ALIASES: Record<ListParamName, readonly string[]> = {
  search: ["q", "busca", "search"],
  status: ["status"],
  source: ["fonte", "source"],
  service: ["servico", "service"],
  period: ["periodo", "period"],
  from: ["de", "from"],
  to: ["ate", "to"],
  sort: ["ordem", "sort"],
  page: ["pagina", "page"],
};

const PERIOD_ALIASES: Record<string, PeriodKey> = {
  today: "today",
  hoje: "today",
  "7d": "7d",
  "7dias": "7d",
  "30d": "30d",
  "30dias": "30d",
  month: "month",
  mes: "month",
  "mês": "month",
};

export const DEFAULT_LEAD_LIST_SORT: LeadListSort = { column: "created_at", dir: "desc" };

export const SEARCH_MAX_LENGTH = 100;
export const MAX_PAGE = 10_000;

export const EMPTY_LEAD_LIST_PARAMS: LeadListParams = {
  q: "",
  status: [],
  source: [],
  service: [],
  period: null,
  sort: DEFAULT_LEAD_LIST_SORT,
  page: 1,
};

const STATUS_ORDER: readonly LeadStatus[] = LEAD_STATUSES;
const SOURCE_ORDER: readonly LeadSource[] = LEAD_SOURCES.map((s) => s.value);
const SERVICE_ORDER: readonly ServiceType[] = SERVICES.map((s) => s.value);

// -----------------------------------------------------------------------------
// Leitura
// -----------------------------------------------------------------------------

interface SearchParamsReader {
  getAll(name: string): string[];
}

export type SearchParamsInput =
  | string
  | SearchParamsReader
  | Record<string, string | readonly string[] | undefined>;

function toReader(input: SearchParamsInput): SearchParamsReader {
  if (typeof input === "string") return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
  if (typeof (input as SearchParamsReader).getAll === "function") return input as SearchParamsReader;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input as Record<string, string | readonly string[] | undefined>)) {
    if (value == null) continue;
    for (const item of typeof value === "string" ? [value] : value) params.append(key, item);
  }
  return params;
}

/** Todos os valores de um parâmetro (inclusive aliases), na ordem da URL. */
function readAll(reader: SearchParamsReader, name: ListParamName): string[] {
  return PARAM_ALIASES[name].flatMap((key) => reader.getAll(key));
}

function readFirst(reader: SearchParamsReader, name: ListParamName): string | null {
  const value = readAll(reader, name)
    .map((v) => v.trim())
    .find((v) => v !== "");
  return value ?? null;
}

/** "novo,agendado" e/ou `status=novo&status=agendado` → valores válidos, sem repetição, na ordem canônica. */
function readList<T extends string>(reader: SearchParamsReader, name: ListParamName, order: readonly T[]): T[] {
  const wanted = new Set(
    readAll(reader, name)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim().toLowerCase()),
  );
  return order.filter((value) => wanted.has(value));
}

/** Colapsa espaços e limita o tamanho do termo de busca. */
export function normalizeSearchTerm(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH).trim();
}

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** yyyy-MM-dd de uma data real (rejeita 2026-02-30, 2026-13-01…). */
export function isValidDateKey(value: string | null | undefined): value is string {
  const match = DATE_KEY_RE.exec(value ?? "");
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Dia seguinte de uma data-calendário (yyyy-MM-dd), sem depender de fuso. */
export function nextDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function isPeriodKey(value: unknown): value is PeriodKey {
  return typeof value === "string" && PERIOD_OPTIONS.some((option) => option.value === value);
}

function readPeriod(reader: SearchParamsReader): LeadListPeriod | null {
  // Datas explícitas são mais específicas que o atalho
  const from = readFirst(reader, "from");
  if (isValidDateKey(from)) {
    const to = readFirst(reader, "to");
    if (!isValidDateKey(to)) return { kind: "custom", from, to: null };
    return from <= to ? { kind: "custom", from, to } : { kind: "custom", from: to, to: from };
  }
  const preset = PERIOD_ALIASES[readFirst(reader, "period")?.toLowerCase() ?? ""];
  return preset ? { kind: "preset", key: preset } : null;
}

export function isSortColumn(value: unknown): value is LeadListSortColumn {
  return typeof value === "string" && (LEAD_LIST_SORT_COLUMNS as readonly string[]).includes(value);
}

/** Direção inicial ao ordenar por uma coluna: datas de entrada mais recentes primeiro; o resto crescente. */
export function defaultSortDirection(column: LeadListSortColumn): SortDirection {
  return column === "created_at" ? "desc" : "asc";
}

function readSort(reader: SearchParamsReader): LeadListSort {
  const raw = readFirst(reader, "sort")?.toLowerCase();
  if (!raw) return DEFAULT_LEAD_LIST_SORT;
  const [column, dir] = raw.split(/[.:]/);
  if (!isSortColumn(column)) return DEFAULT_LEAD_LIST_SORT;
  if (dir === "asc" || dir === "desc") return { column, dir };
  return { column, dir: defaultSortDirection(column) };
}

function readPage(reader: SearchParamsReader): number {
  const raw = readFirst(reader, "page");
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return page >= 1 && page <= MAX_PAGE ? page : 1;
}

/** Query string (ou objeto `searchParams`) → estado da lista. Valores inválidos são ignorados. */
export function parseLeadListParams(input: SearchParamsInput): LeadListParams {
  const reader = toReader(input);
  return {
    q: normalizeSearchTerm(readFirst(reader, "search")),
    status: readList(reader, "status", STATUS_ORDER),
    source: readList(reader, "source", SOURCE_ORDER),
    service: readList(reader, "service", SERVICE_ORDER),
    period: readPeriod(reader),
    sort: readSort(reader),
    page: readPage(reader),
  };
}

// -----------------------------------------------------------------------------
// Escrita
// -----------------------------------------------------------------------------

function isDefaultSort(sort: LeadListSort): boolean {
  return sort.column === DEFAULT_LEAD_LIST_SORT.column && sort.dir === DEFAULT_LEAD_LIST_SORT.dir;
}

function canonicalList<T extends string>(values: readonly T[], order: readonly T[]): T[] {
  const set = new Set(values);
  return order.filter((value) => set.has(value));
}

/**
 * Estado → query string canônica (sem "?"), omitindo valores padrão.
 * Listas usam vírgula legível: `status=novo,agendado`.
 */
export function serializeLeadListParams(params: LeadListParams): string {
  const parts: string[] = [];
  const add = (key: string, value: string) => parts.push(`${key}=${encodeURIComponent(value).replace(/%2C/gi, ",")}`);

  const q = normalizeSearchTerm(params.q);
  if (q) add(LIST_PARAM.search, q);
  const status = canonicalList(params.status, STATUS_ORDER);
  if (status.length) add(LIST_PARAM.status, status.join(","));
  const source = canonicalList(params.source, SOURCE_ORDER);
  if (source.length) add(LIST_PARAM.source, source.join(","));
  const service = canonicalList(params.service, SERVICE_ORDER);
  if (service.length) add(LIST_PARAM.service, service.join(","));

  const period = params.period;
  if (period?.kind === "preset" && isPeriodKey(period.key)) {
    add(LIST_PARAM.period, period.key);
  } else if (period?.kind === "custom" && isValidDateKey(period.from)) {
    add(LIST_PARAM.from, period.from);
    if (isValidDateKey(period.to)) add(LIST_PARAM.to, period.to);
  }

  if (!isDefaultSort(params.sort) && isSortColumn(params.sort.column)) {
    add(LIST_PARAM.sort, `${params.sort.column}.${params.sort.dir === "asc" ? "asc" : "desc"}`);
  }
  if (Number.isInteger(params.page) && params.page > 1) add(LIST_PARAM.page, String(params.page));
  return parts.join("&");
}

/** Link para a lista com os filtros (ex.: `buildLeadListHref({ status: ["novo"] })` → "/leads?status=novo"). */
export function buildLeadListHref(params: Partial<LeadListParams> = {}, pathname = "/leads"): string {
  const query = serializeLeadListParams({ ...EMPTY_LEAD_LIST_PARAMS, ...params });
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * "Voltar para leads": o último endereço da lista guardado (filtros, ordem e página),
 * relido como estado da lista — só volta para /leads, nunca para outro caminho.
 * Ausente ou inválido → "/leads".
 */
export function leadListReturnHref(stored: string | null | undefined): string {
  const match = typeof stored === "string" ? /^\/leads(?:\?(.*))?$/.exec(stored) : null;
  return buildLeadListHref(match ? parseLeadListParams(match[1] ?? "") : {});
}

/**
 * Aplica mudanças ao estado. Qualquer mudança de busca, filtro ou ordenação
 * volta para a página 1 (a menos que o próprio patch defina a página).
 */
export function patchLeadListParams(params: LeadListParams, patch: Partial<LeadListParams>): LeadListParams {
  const next: LeadListParams = { ...params, ...patch };
  if (patch.q !== undefined) next.q = normalizeSearchTerm(patch.q);
  if (patch.page === undefined) next.page = 1;
  return next;
}

/** Remove busca, filtros e período (mantém a ordenação). */
export function clearLeadListFilters(params: LeadListParams): LeadListParams {
  return { ...EMPTY_LEAD_LIST_PARAMS, sort: params.sort };
}

export function hasActiveFilters(params: LeadListParams): boolean {
  return (
    params.q !== "" ||
    params.status.length > 0 ||
    params.source.length > 0 ||
    params.service.length > 0 ||
    params.period !== null
  );
}

/** Quantidade de filtros do painel (status, fonte, serviço e período — a busca fica fora): "Filtros (3)". */
export function countPanelFilters(params: LeadListParams): number {
  return params.status.length + params.source.length + params.service.length + (params.period ? 1 : 0);
}

/** Próxima ordenação ao clicar no cabeçalho: mesma coluna inverte; outra coluna usa a direção inicial dela. */
export function nextSort(current: LeadListSort, column: LeadListSortColumn): LeadListSort {
  if (current.column === column) return { column, dir: current.dir === "asc" ? "desc" : "asc" };
  return { column, dir: defaultSortDirection(column) };
}

/** Rótulo de cada coluna ordenável (cabeçalhos da tabela e seletor de ordenação no celular). */
export const SORT_COLUMN_LABEL: Record<LeadListSortColumn, string> = {
  name: "Nome",
  phone: "Telefone",
  source: "Fonte",
  service: "Serviço",
  status: "Status",
  created_at: "Data de entrada",
  scheduled_at: "Agendamento",
};

// Fonte e serviço são ordenados pelo código gravado no banco, não pelo rótulo — por isso "crescente".
const SORT_DIRECTION_LABEL: Record<LeadListSortColumn, Record<SortDirection, string>> = {
  name: { asc: "A–Z", desc: "Z–A" },
  status: { asc: "A–Z", desc: "Z–A" },
  phone: { asc: "crescente", desc: "decrescente" },
  source: { asc: "crescente", desc: "decrescente" },
  service: { asc: "crescente", desc: "decrescente" },
  created_at: { asc: "mais antigos primeiro", desc: "mais recentes primeiro" },
  scheduled_at: { asc: "mais cedo primeiro", desc: "mais tarde primeiro" },
};

/** "Nome: A–Z" · "Data de entrada: mais recentes primeiro" */
export function sortLabel(sort: LeadListSort): string {
  return `${SORT_COLUMN_LABEL[sort.column]}: ${SORT_DIRECTION_LABEL[sort.column][sort.dir]}`;
}

/** "a–z", "mais recentes primeiro"… (sem o nome da coluna) */
export function sortDirectionLabel(sort: LeadListSort): string {
  return SORT_DIRECTION_LABEL[sort.column][sort.dir];
}

/** Valor serializado de uma ordenação ("created_at.desc"), usado em selects. */
export function sortKey(sort: LeadListSort): string {
  return `${sort.column}.${sort.dir}`;
}

export function parseSortKey(value: string): LeadListSort | null {
  const [column, dir] = value.split(".");
  return isSortColumn(column) && (dir === "asc" || dir === "desc") ? { column, dir } : null;
}

/** Ordenações oferecidas no celular (sem cabeçalho de tabela); a atual é incluída se não estiver na lista. */
export const MOBILE_SORT_OPTIONS: readonly LeadListSort[] = [
  { column: "created_at", dir: "desc" },
  { column: "created_at", dir: "asc" },
  { column: "scheduled_at", dir: "asc" },
  { column: "scheduled_at", dir: "desc" },
  { column: "name", dir: "asc" },
  { column: "name", dir: "desc" },
];

export function mobileSortOptions(current: LeadListSort): LeadListSort[] {
  const exists = MOBILE_SORT_OPTIONS.some((option) => sortKey(option) === sortKey(current));
  return exists ? [...MOBILE_SORT_OPTIONS] : [...MOBILE_SORT_OPTIONS, current];
}

// -----------------------------------------------------------------------------
// Período → intervalo e filtros da consulta
// -----------------------------------------------------------------------------

export interface PeriodDateRange {
  /** yyyy-MM-dd (inclusive) */
  fromKey: string;
  /** yyyy-MM-dd (inclusive); null = sem limite final */
  toKey: string | null;
}

/** Datas-calendário (Bahia) do período. Atalhos são relativos a `now`. */
export function resolvePeriodRange(period: LeadListPeriod | null, now: DateInput = Date.now()): PeriodDateRange | null {
  if (!period) return null;
  if (period.kind === "custom") return { fromKey: period.from, toKey: period.to };
  const { fromKey, toKey } = getPeriodRanges(period.key, now).current;
  return { fromKey, toKey };
}

/** Intervalo inicial ao escolher "Personalizado": o período atual, ou os últimos 30 dias. */
export function customPeriodSeed(period: LeadListPeriod | null, now: DateInput = Date.now()): LeadListPeriod {
  const range = resolvePeriodRange(period, now) ?? getPeriodRanges("30d", now).current;
  return { kind: "custom", from: range.fromKey, to: range.toKey ?? todayKey(now) };
}

/**
 * Estado da URL → filtros de `useLeadsList`. O período vira instantes UTC do
 * início do dia (00:00 em America/Bahia): `createdFrom` inclusivo e
 * `createdTo` exclusivo (início do dia seguinte ao último dia).
 */
export function toLeadFilters(params: LeadListParams, now: DateInput = Date.now()): LeadFilters {
  const filters: LeadFilters = {
    sortBy: params.sort.column,
    sortDir: params.sort.dir,
    page: params.page,
    pageSize: PAGE_SIZE,
  };
  if (params.q) filters.search = params.q;
  if (params.status.length) filters.status = [...params.status];
  if (params.source.length) filters.source = [...params.source];
  if (params.service.length) filters.service = [...params.service];
  const range = resolvePeriodRange(params.period, now);
  if (range) {
    filters.createdFrom = bahiaLocalToIso(range.fromKey);
    if (range.toKey) filters.createdTo = bahiaLocalToIso(nextDateKey(range.toKey));
  }
  return filters;
}
