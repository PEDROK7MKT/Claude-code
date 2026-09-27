/**
 * Utilitários do PDF: texto compatível com a Helvetica padrão do jsPDF
 * (WinAnsiEncoding — Latin-1 + pontuação tipográfica) e manipulação de cores.
 * Um único caractere fora dessa tabela faz o jsPDF codificar a linha inteira
 * em UTF-16 e o texto sai ilegível — por isso todo texto passa por toPdfText().
 */

/** Caracteres acima de U+00FF que existem na WinAnsiEncoding (0x80–0x9F). */
const WIN_ANSI_EXTRA = new Set(
  "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""),
);

/** Substituições legíveis para símbolos comuns fora da tabela. */
const REPLACEMENTS: Record<string, string> = {
  "→": "->",
  "←": "<-",
  "↔": "<->",
  "⇒": "=>",
  "↑": "+",
  "↓": "-",
  "▲": "+",
  "▼": "-",
  "★": "*",
  "☆": "*",
  "✓": "v",
  "✔": "v",
  "✗": "x",
  "✕": "x",
  "−": "-",
  "‐": "-",
  "‑": "-",
  "≥": ">=",
  "≤": "<=",
  "≠": "!=",
  "≈": "~",
  "⋅": "·",
  "‒": "–",
  "―": "—",
  "′": "'",
  "″": '"',
};

/** Espaços especiais (NBSP tem largura errada na métrica da Helvetica do jsPDF). */
const SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
/** Invisíveis: zero-width, marcas de direção, seletores de variação de emoji. */
const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF\u200E\u200F\uFE00-\uFE0F]/g;

function isEncodable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || char === "\n" || WIN_ANSI_EXTRA.has(char);
}

/**
 * Texto seguro para a Helvetica do jsPDF: mantém acentos do português (ã, ç, é…)
 * e a pontuação tipográfica (– — … “ ”), troca setas/estrelas por equivalentes
 * ASCII e remove emojis e outros símbolos sem glifo.
 */
export function toPdfText(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.replace(/\r\n?/g, "\n").replace(SPACES, " ").replace(INVISIBLE, "").replace(/\t/g, " ");
  let out = "";
  for (const char of normalized) {
    if (isEncodable(char)) {
      out += char;
      continue;
    }
    const replacement = REPLACEMENTS[char];
    if (replacement !== undefined) {
      out += replacement;
      continue;
    }
    // letras com diacríticos fora do Latin-1 (ő, ł…) → letra base
    const base = char.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
    if (base && [...base].every(isEncodable)) out += base;
    // demais (emojis, ideogramas, símbolos) são descartados
  }
  return out.replace(/ {2,}/g, " ");
}

export type Rgb = [number, number, number];

/** "#0D6E6E" → [13, 110, 110]. Aceita #RGB; inválido → cinza. */
export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(h)) return [107, 114, 128];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Mistura com branco: amount 0 = cor original, 1 = branco (fundos suaves de badge). */
export function tint(hex: string, amount: number): Rgb {
  const t = Math.min(1, Math.max(0, amount));
  return hexToRgb(hex).map((c) => Math.round(c + (255 - c) * t)) as Rgb;
}

/** Mistura com preto: amount 0 = cor original, 1 = preto (texto forte de badge). */
export function shade(hex: string, amount: number): Rgb {
  const t = Math.min(1, Math.max(0, amount));
  return hexToRgb(hex).map((c) => Math.round(c * (1 - t))) as Rgb;
}
