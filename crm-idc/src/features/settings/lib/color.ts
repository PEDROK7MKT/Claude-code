/**
 * Cores da marca (Personalização): validação #RRGGBB e contraste WCAG.
 * Funções puras.
 */
import { APP_LOCALE } from "@/lib/constants";

export const HEX_COLOR_RE = /^#[0-9A-F]{6}$/i;
export const WHITE = "#FFFFFF";
/** Texto escuro usado sobre o acento dourado (--gold-foreground em globals.css). */
export const ACCENT_FOREGROUND = "#3D2F00";

/** Contraste mínimo WCAG AA para texto normal. */
export const MIN_TEXT_CONTRAST = 4.5;
/** Contraste mínimo WCAG AA para texto grande / elementos gráficos. */
export const MIN_LARGE_CONTRAST = 3;
/** Abaixo disso a cor praticamente some sobre o fundo branco dos cards. */
export const MIN_VISIBLE_ON_WHITE = 1.4;

/** Cor no formato estrito #RRGGBB? */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_RE.test(value);
}

/**
 * Normaliza o que foi digitado: aceita "0d6e6e", "#0d6e6e", "#0D6", " #0d6e6e ".
 * Retorna #RRGGBB maiúsculo ou null se não for uma cor hex.
 */
export function normalizeHexInput(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  let hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHexInput(hex);
  if (!normalized) throw new RangeError(`Cor inválida: ${hex}`);
  const n = Number.parseInt(normalized.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** Luminância relativa (WCAG 2.x), de 0 (preto) a 1 (branco). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Razão de contraste WCAG entre duas cores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** "4,5:1" — arredonda para baixo para nunca exagerar o contraste. */
export function formatContrastRatio(ratio: number): string {
  const floored = Math.floor(ratio * 10) / 10;
  return `${floored.toLocaleString(APP_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}:1`;
}

export type ContrastLevel = "aaa" | "aa" | "aa-large" | "fail";

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "aaa";
  if (ratio >= MIN_TEXT_CONTRAST) return "aa";
  if (ratio >= MIN_LARGE_CONTRAST) return "aa-large";
  return "fail";
}

export interface ColorAssessment {
  /** Contraste da cor com o branco */
  ratioOnWhite: number;
  level: ContrastLevel;
  /** Aviso para o admin (null quando a cor é adequada) */
  warning: string | null;
}

/**
 * Cor primária: fundo de botões/menu ativo com texto BRANCO e cor de links sobre
 * cards brancos — precisa de contraste AA (4,5:1) com o branco.
 */
export function assessPrimaryColor(hex: string): ColorAssessment {
  const ratio = contrastRatio(hex, WHITE);
  const level = contrastLevel(ratio);
  let warning: string | null = null;
  if (ratio < MIN_LARGE_CONTRAST) {
    warning = `Contraste muito baixo com o branco (${formatContrastRatio(ratio)}). Textos de botões e links ficarão difíceis de ler — escolha um tom mais escuro.`;
  } else if (ratio < MIN_TEXT_CONTRAST) {
    warning = `Contraste de ${formatContrastRatio(ratio)} com o branco, abaixo do mínimo recomendado (4,5:1). Textos pequenos em botões podem ficar difíceis de ler.`;
  }
  return { ratioOnWhite: ratio, level, warning };
}

/**
 * Cor de destaque: detalhe decorativo sobre fundo branco e fundo de badges com
 * texto escuro (como o dourado padrão). Avisa se some no branco ou se o texto
 * escuro dos badges fica ilegível.
 */
export function assessAccentColor(hex: string): ColorAssessment {
  const ratio = contrastRatio(hex, WHITE);
  const level = contrastLevel(ratio);
  let warning: string | null = null;
  if (ratio < MIN_VISIBLE_ON_WHITE) {
    warning = `Cor muito clara: quase invisível sobre o fundo branco (${formatContrastRatio(ratio)}). Escolha um tom mais forte.`;
  } else {
    const onBadge = contrastRatio(hex, ACCENT_FOREGROUND);
    if (onBadge < MIN_TEXT_CONTRAST) {
      warning = `Cor escura demais para destaque: o texto escuro dos badges fica com contraste de ${formatContrastRatio(onBadge)}. Prefira um tom mais claro e vibrante.`;
    }
  }
  return { ratioOnWhite: ratio, level, warning };
}
