/**
 * Filtros da lista de leads: atalhos de status, chips removíveis e rótulos do
 * período. Funções puras (testadas em list-filters.test.ts).
 */
import { SERVICE_LABEL, SOURCE_LABEL, STATUS_META } from "@/lib/constants";
import { formatDateKey, PERIOD_OPTIONS, type PeriodKey } from "@/lib/dates";
import type { LeadSource, LeadStatus, ServiceType } from "@/types/database";

import { patchLeadListParams, type LeadListParams, type LeadListPeriod } from "./list-params";

// -----------------------------------------------------------------------------
// Atalhos de status ("abas" rápidas)
// -----------------------------------------------------------------------------

export interface StatusQuickFilter {
  id: "todos" | "novos" | "em_contato" | "agendados" | "compareceram" | "sem_sucesso";
  label: string;
  /** Descrição para leitores de tela / tooltip */
  description: string;
  statuses: readonly LeadStatus[];
}

export const STATUS_QUICK_FILTERS: readonly StatusQuickFilter[] = [
  { id: "todos", label: "Todos", description: "Todos os status", statuses: [] },
  { id: "novos", label: "Novos", description: "Aguardando o primeiro contato", statuses: ["novo"] },
  { id: "em_contato", label: "Em contato", description: "Recepção já respondeu", statuses: ["em_contato"] },
  {
    id: "agendados",
    label: "Agendados",
    description: "Consulta marcada ou confirmada",
    statuses: ["agendado", "confirmado"],
  },
  { id: "compareceram", label: "Compareceram", description: "Vieram à consulta", statuses: ["compareceu"] },
  {
    id: "sem_sucesso",
    label: "Faltas e perdas",
    description: "Não compareceu, cancelado ou perdido",
    statuses: ["nao_compareceu", "cancelado", "perdido"],
  },
];

/** Atalho que corresponde exatamente aos status selecionados (null se for uma combinação livre). */
export function matchQuickFilter(statuses: readonly LeadStatus[]): StatusQuickFilter | null {
  const selected = new Set(statuses);
  return (
    STATUS_QUICK_FILTERS.find(
      (filter) => filter.statuses.length === selected.size && filter.statuses.every((status) => selected.has(status)),
    ) ?? null
  );
}

/** Liga/desliga um valor mantendo a ordem canônica (`order`). */
export function toggleListValue<T extends string>(values: readonly T[], value: T, order: readonly T[]): T[] {
  const set = new Set(values);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return order.filter((item) => set.has(item));
}

// -----------------------------------------------------------------------------
// Período
// -----------------------------------------------------------------------------

/** Valor do seletor de período: sem filtro, atalho ou datas personalizadas. */
export type PeriodSelectValue = "all" | PeriodKey | "custom";

export const PERIOD_SELECT_OPTIONS: ReadonlyArray<{ value: PeriodSelectValue; label: string }> = [
  { value: "all", label: "Qualquer data" },
  ...PERIOD_OPTIONS,
  { value: "custom", label: "Personalizado" },
];

export function periodSelectValue(period: LeadListPeriod | null): PeriodSelectValue {
  if (!period) return "all";
  return period.kind === "preset" ? period.key : "custom";
}

export function isPeriodSelectValue(value: unknown): value is PeriodSelectValue {
  return typeof value === "string" && PERIOD_SELECT_OPTIONS.some((option) => option.value === value);
}

/** "Últimos 7 dias" · "05/09/2026" · "01/09/2026 – 10/09/2026" · "Desde 01/09/2026" */
export function periodLabel(period: LeadListPeriod): string {
  if (period.kind === "preset") {
    return PERIOD_OPTIONS.find((option) => option.value === period.key)?.label ?? "Período";
  }
  if (!period.to) return `Desde ${formatDateKey(period.from)}`;
  if (period.from === period.to) return formatDateKey(period.from);
  return `${formatDateKey(period.from)} – ${formatDateKey(period.to)}`;
}

// -----------------------------------------------------------------------------
// Chips de filtros ativos
// -----------------------------------------------------------------------------

export type FilterChip =
  | { id: string; kind: "search"; label: string }
  | { id: string; kind: "status"; value: LeadStatus; label: string }
  | { id: string; kind: "source"; value: LeadSource; label: string }
  | { id: string; kind: "service"; value: ServiceType; label: string }
  | { id: string; kind: "period"; label: string };

/** Um chip por valor ativo, na ordem: busca, status, fonte, serviço, período. */
export function getFilterChips(params: LeadListParams): FilterChip[] {
  const chips: FilterChip[] = [];
  if (params.q) chips.push({ id: "search", kind: "search", label: `“${params.q}”` });
  for (const value of params.status) {
    chips.push({ id: `status:${value}`, kind: "status", value, label: STATUS_META[value].label });
  }
  for (const value of params.source) {
    chips.push({ id: `source:${value}`, kind: "source", value, label: SOURCE_LABEL[value] });
  }
  for (const value of params.service) {
    chips.push({ id: `service:${value}`, kind: "service", value, label: SERVICE_LABEL[value] });
  }
  if (params.period) chips.push({ id: "period", kind: "period", label: `Entrada: ${periodLabel(params.period)}` });
  return chips;
}

/** Texto acessível do botão de remover o chip. */
export function filterChipRemoveLabel(chip: FilterChip): string {
  switch (chip.kind) {
    case "search":
      return `Remover busca ${chip.label}`;
    case "status":
      return `Remover filtro de status ${chip.label}`;
    case "source":
      return `Remover filtro de fonte ${chip.label}`;
    case "service":
      return `Remover filtro de serviço ${chip.label}`;
    case "period":
      return `Remover filtro de período (${chip.label})`;
  }
}

/** Estado sem o filtro do chip (volta para a página 1). */
export function removeFilterChip(params: LeadListParams, chip: FilterChip): LeadListParams {
  switch (chip.kind) {
    case "search":
      return patchLeadListParams(params, { q: "" });
    case "status":
      return patchLeadListParams(params, { status: params.status.filter((value) => value !== chip.value) });
    case "source":
      return patchLeadListParams(params, { source: params.source.filter((value) => value !== chip.value) });
    case "service":
      return patchLeadListParams(params, { service: params.service.filter((value) => value !== chip.value) });
    case "period":
      return patchLeadListParams(params, { period: null });
  }
}
