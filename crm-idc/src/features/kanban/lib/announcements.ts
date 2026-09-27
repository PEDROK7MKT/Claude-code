/**
 * Textos de acessibilidade do arraste (leitores de tela) em pt-BR.
 * Funções puras — announcements.test.ts.
 */
import { STATUS_META } from "@/lib/constants";
import { canTransition } from "@/lib/lead-status";
import type { LeadStatus } from "@/types/database";

/** Instruções lidas ao focar o nome do lead no card (aria-describedby). */
export const KANBAN_DRAG_INSTRUCTIONS =
  "Enter abre o lead. Para mover o card, pressione Espaço, use as setas para a esquerda e para a direita " +
  "para escolher a coluna e pressione Espaço ou Enter para soltar; Esc cancela. " +
  "Também é possível usar o menu Mover para.";

export interface DragAnnouncementArgs {
  name: string;
  from: LeadStatus;
  /** Coluna sob o card (null = fora das colunas) */
  over: LeadStatus | null;
}

function column(status: LeadStatus): string {
  return `"${STATUS_META[status].title}"`;
}

function who(name: string): string {
  return name.trim() || "Lead sem nome";
}

export function announceDragStart(name: string, from: LeadStatus): string {
  return `${who(name)} selecionado na coluna ${column(from)}. Use as setas para a esquerda e para a direita para escolher a coluna de destino.`;
}

export function announceDragOver({ name, from, over }: DragAnnouncementArgs): string {
  if (!over) return `${who(name)} não está sobre nenhuma coluna.`;
  if (over === from) return `${who(name)} sobre a coluna de origem, ${column(over)}.`;
  if (!canTransition(from, over)) return `${who(name)} sobre a coluna ${column(over)}: movimento não permitido.`;
  return `${who(name)} sobre a coluna ${column(over)}.`;
}

export function announceDragEnd({ name, from, over }: DragAnnouncementArgs): string {
  if (!over || over === from) return `${who(name)} continua na coluna ${column(from)}.`;
  if (!canTransition(from, over)) {
    return `Movimento não permitido de ${column(from)} para ${column(over)}. ${who(name)} voltou para ${column(from)}.`;
  }
  return `${who(name)} solto na coluna ${column(over)}.`;
}

export function announceDragCancel({ name, from }: Pick<DragAnnouncementArgs, "name" | "from">): string {
  return `Movimento cancelado. ${who(name)} voltou para a coluna ${column(from)}.`;
}

/** Rótulo do contador da coluna: "1 lead" · "12 leads". */
export function columnCountLabel(count: number): string {
  return `${count} ${count === 1 ? "lead" : "leads"}`;
}
