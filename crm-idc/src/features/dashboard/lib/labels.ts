/**
 * Rótulos de datas-calendário (yyyy-MM-dd) no fuso America/Bahia para gráficos e listas.
 */
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfDateKey, toBahia, type DateInput } from "@/lib/dates";

function bahiaDay(dateKey: string) {
  return toBahia(startOfDateKey(dateKey));
}

/** Primeira letra maiúscula ("setembro de 2026" → "Setembro de 2026"). */
export function capitalize(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1) : text;
}

/** Cabeçalho de dia da agenda: "Segunda, 22/09" · "Sábado, 27/09". */
export function weekdayHeading(dateKey: string): string {
  const day = bahiaDay(dateKey);
  const weekday = format(day, "EEEE", { locale: ptBR }).replace(/-feira$/, "");
  return `${capitalize(weekday)}, ${format(day, "dd/MM")}`;
}

/** Rótulo completo do tooltip dos gráficos diários: "sábado, 26/09/2026" (ptBR "EEE" = "terça"). */
export function tooltipDayLabel(dateKey: string): string {
  return format(bahiaDay(dateKey), "EEE, dd/MM/yyyy", { locale: ptBR });
}

/** Data por extenso para saudações: "Quinta-feira, 24 de setembro". */
export function longDateLabel(input: DateInput): string {
  return capitalize(format(toBahia(input), "EEEE, d 'de' MMMM", { locale: ptBR }));
}

/** Corta textos longos para eixos estreitos ("implante dentário barr…"). */
export function truncateLabel(text: string, max: number): string {
  const clean = text.trim();
  if (max < 2 || clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export interface AxisLabelWidthOptions {
  /** Largura média de um caractere em px (≈ 0,56 × tamanho da fonte) */
  charWidth?: number;
  /** Respiro entre o rótulo e a barra */
  padding?: number;
  min?: number;
  max?: number;
}

/**
 * Largura do eixo de categorias a partir do rótulo mais longo — determinística
 * (não depende de medir texto no DOM, que não existe no servidor/primeiro render).
 */
export function axisLabelWidth(labels: readonly string[], options: AxisLabelWidthOptions = {}): number {
  const { charWidth = 6.8, padding = 12, min = 48, max = 140 } = options;
  const longest = labels.reduce((acc, label) => Math.max(acc, label.length), 0);
  return Math.round(Math.min(max, Math.max(min, longest * charWidth + padding)));
}
