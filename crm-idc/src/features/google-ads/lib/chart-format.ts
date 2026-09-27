/**
 * Formatação curta para eixos dos gráficos (pt-BR). Os tooltips usam os formatos
 * completos de @/lib/format (formatCurrency, formatPercent, formatNumber).
 */
const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const integerCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const centsCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compactNumber = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const percentNumber = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Normaliza espaços não separáveis do Intl para espaço comum (SVG/PDF). */
function plain(text: string): string {
  return text.replace(/\s/g, " ");
}

/** R$ 0,85 · R$ 12 · R$ 1,2 mil */
export function formatAxisCurrency(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1000) return plain(compactCurrency.format(value));
  if (abs >= 10 || value === 0) return plain(integerCurrency.format(value));
  return plain(centsCurrency.format(value));
}

/** 4% · 4,5% */
export function formatAxisPercent(value: number): string {
  if (!Number.isFinite(value)) return "";
  return `${percentNumber.format(value)}%`;
}

/** 12 · 1,2 mil */
export function formatAxisCount(value: number): string {
  if (!Number.isFinite(value)) return "";
  return plain(Math.abs(value) >= 1000 ? compactNumber.format(value) : String(Math.round(value)));
}
