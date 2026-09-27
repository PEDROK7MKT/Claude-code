/**
 * Colunas do kanban do funil (spec §4.4): ordem, agrupamento, ordenação dos
 * cards e alvos válidos de arraste (regra 2). Funções puras — columns.test.ts.
 */
import { LEAD_STATUSES, STATUS_META } from "@/lib/constants";
import { canTransition, isLeadStatus } from "@/lib/lead-status";
import type { Lead, LeadStatus } from "@/types/database";

/** Blocos do quadro, na ordem do desenho da spec. */
export type KanbanColumnGroup = "funil" | "resultado" | "encerrado";

/** Aparência da coluna: etapas em andamento, sucesso (compareceu) ou apagada (saídas do funil). */
export type KanbanColumnTone = "active" | "success" | "muted";

/** Critério de ordenação dos cards dentro da coluna. */
export type KanbanColumnSort = "created_asc" | "scheduled_asc" | "updated_desc";

export interface KanbanColumnDef {
  status: LeadStatus;
  group: KanbanColumnGroup;
  tone: KanbanColumnTone;
  /** Coluna "finalizada": por padrão só mostra leads atualizados nos últimos 30 dias */
  final: boolean;
  sort: KanbanColumnSort;
}

/**
 * [Novo] → [Em Contato] → [Agendado] → [Confirmado] → [Compareceu] ↘ [Não Compareceu]
 * [Cancelado] [Perdido]
 */
export const KANBAN_COLUMNS: readonly KanbanColumnDef[] = [
  { status: "novo", group: "funil", tone: "active", final: false, sort: "created_asc" },
  { status: "em_contato", group: "funil", tone: "active", final: false, sort: "created_asc" },
  { status: "agendado", group: "funil", tone: "active", final: false, sort: "scheduled_asc" },
  { status: "confirmado", group: "funil", tone: "active", final: false, sort: "scheduled_asc" },
  { status: "compareceu", group: "resultado", tone: "success", final: true, sort: "updated_desc" },
  { status: "nao_compareceu", group: "resultado", tone: "muted", final: true, sort: "updated_desc" },
  { status: "cancelado", group: "encerrado", tone: "muted", final: true, sort: "updated_desc" },
  { status: "perdido", group: "encerrado", tone: "muted", final: true, sort: "updated_desc" },
];

export const KANBAN_GROUPS: ReadonlyArray<{ id: KanbanColumnGroup; label: string }> = [
  { id: "funil", label: "Em andamento" },
  { id: "resultado", label: "Resultado da consulta" },
  { id: "encerrado", label: "Encerrados" },
];

/** Status em andamento: sempre carregados por completo. */
export const ACTIVE_STATUSES: readonly LeadStatus[] = KANBAN_COLUMNS.filter((c) => !c.final).map((c) => c.status);

/** Status finalizados/laterais: por padrão só os atualizados na janela de dias abaixo. */
export const FINAL_STATUSES: readonly LeadStatus[] = KANBAN_COLUMNS.filter((c) => c.final).map((c) => c.status);

export const FINALS_WINDOW_DAYS = 30;

const COLUMN_BY_STATUS = new Map(KANBAN_COLUMNS.map((column) => [column.status, column]));

export function getKanbanColumn(status: LeadStatus): KanbanColumnDef {
  const column = COLUMN_BY_STATUS.get(status);
  if (!column) throw new Error(`Coluna desconhecida: ${status}`);
  return column;
}

export function columnsOfGroup(group: KanbanColumnGroup): KanbanColumnDef[] {
  return KANBAN_COLUMNS.filter((column) => column.group === group);
}

// -----------------------------------------------------------------------------
// Ids do dnd-kit
// -----------------------------------------------------------------------------

const COLUMN_ID_PREFIX = "coluna:";

export function columnDroppableId(status: LeadStatus): string {
  return `${COLUMN_ID_PREFIX}${status}`;
}

export function statusFromColumnId(id: unknown): LeadStatus | null {
  if (typeof id !== "string" || !id.startsWith(COLUMN_ID_PREFIX)) return null;
  const status = id.slice(COLUMN_ID_PREFIX.length);
  return isLeadStatus(status) ? status : null;
}

// -----------------------------------------------------------------------------
// Ordenação e agrupamento
// -----------------------------------------------------------------------------

/** Instante (ms) de um ISO; null quando ausente/inválido. */
function toTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
}

/** Ascendente com nulos por último. */
function compareAsc(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function compareId(a: Pick<Lead, "id">, b: Pick<Lead, "id">): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

type SortableLead = Pick<Lead, "id" | "created_at" | "updated_at" | "scheduled_at">;

const COMPARATORS: Record<KanbanColumnSort, (a: SortableLead, b: SortableLead) => number> = {
  // quem espera há mais tempo primeiro
  created_asc: (a, b) => compareAsc(toTime(a.created_at), toTime(b.created_at)) || compareId(a, b),
  // próxima consulta primeiro; sem data no fim
  scheduled_asc: (a, b) =>
    compareAsc(toTime(a.scheduled_at), toTime(b.scheduled_at)) ||
    compareAsc(toTime(a.created_at), toTime(b.created_at)) ||
    compareId(a, b),
  // movimentação mais recente primeiro
  updated_desc: (a, b) =>
    compareAsc(toTime(b.updated_at), toTime(a.updated_at)) || compareId(a, b),
};

/** Ordena os cards de uma coluna conforme o critério dela (não altera o array recebido). */
export function sortColumnLeads<T extends SortableLead>(status: LeadStatus, leads: readonly T[]): T[] {
  const compare = COMPARATORS[getKanbanColumn(status).sort];
  return [...leads].sort(compare);
}

export type KanbanColumnsData<T extends SortableLead & Pick<Lead, "status"> = Lead> = Record<LeadStatus, T[]>;

/** Distribui os leads pelas colunas (todas presentes, mesmo vazias), já ordenados. */
export function groupLeadsByColumn<T extends SortableLead & Pick<Lead, "status">>(
  leads: readonly T[],
): KanbanColumnsData<T> {
  const groups = Object.fromEntries(LEAD_STATUSES.map((status) => [status, [] as T[]])) as KanbanColumnsData<T>;
  for (const lead of leads) groups[lead.status]?.push(lead);
  for (const status of LEAD_STATUSES) groups[status] = sortColumnLeads(status, groups[status]);
  return groups;
}

// -----------------------------------------------------------------------------
// Alvos de arraste
// -----------------------------------------------------------------------------

/**
 * Estado de uma coluna durante o arraste de um card que está em `from`:
 * - idle: nada sendo arrastado
 * - source: coluna de origem
 * - valid: transição permitida (regra 2)
 * - invalid: transição não permitida
 */
export type DropTargetState = "idle" | "source" | "valid" | "invalid";

export function getDropTargetState(from: LeadStatus | null | undefined, column: LeadStatus): DropTargetState {
  if (!from) return "idle";
  if (from === column) return "source";
  return canTransition(from, column) ? "valid" : "invalid";
}

/** Estado de todas as colunas para um arraste a partir de `from`. */
export function getDropTargets(from: LeadStatus | null | undefined): Record<LeadStatus, DropTargetState> {
  return Object.fromEntries(
    LEAD_STATUSES.map((status) => [status, getDropTargetState(from, status)]),
  ) as Record<LeadStatus, DropTargetState>;
}

/** O card pode ser arrastado? (compareceu é final: não há para onde ir) */
export function isMovableStatus(status: LeadStatus): boolean {
  return LEAD_STATUSES.some((to) => canTransition(status, to));
}

/** "Novo", "Em contato"… (título da coluna) */
export function columnTitle(status: LeadStatus): string {
  return STATUS_META[status].title;
}
