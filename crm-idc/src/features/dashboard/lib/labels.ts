/**
 * Rótulos de datas-calendário (yyyy-MM-dd) no fuso America/Bahia para gráficos e listas.
 */
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfDateKey, toBahia } from "@/lib/dates";

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

/** Rótulo completo do tooltip dos gráficos diários: "sáb, 26/09/2026". */
export function tooltipDayLabel(dateKey: string): string {
  return format(bahiaDay(dateKey), "EEE, dd/MM/yyyy", { locale: ptBR });
}

/** Corta textos longos para eixos estreitos ("implante dentário barr…"). */
export function truncateLabel(text: string, max: number): string {
  const clean = text.trim();
  if (max < 2 || clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}
