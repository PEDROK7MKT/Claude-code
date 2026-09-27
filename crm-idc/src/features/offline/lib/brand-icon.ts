/**
 * Ícone do app (PWA / favicon): monograma "iDC" recortado do logo original do
 * Instituto Décio Carrilho ("i" dourado, "DC" cinza) sobre fundo branco.
 * Fonte única — gera o src/app/icon.svg (conferido por teste) e os PNGs de
 * src/app/apple-icon.tsx. O logo completo fica em public/brand/.
 */
import { IDC_MARK_PNG } from "./brand-assets";

/** Cores amostradas do logo original. */
export const IDC_COLORS = {
  gold: "#DBB16F",
  gray: "#AAAAAA",
  background: "#FFFFFF",
} as const;

/** Arquivos do logo servidos de public/brand. */
export const IDC_LOGO_URL = "/brand/idc-logo.png";
export const IDC_MARK_URL = "/brand/idc-mark.png";

/** Proporção largura/altura do monograma (≈ 2:1). */
export const IDC_MARK_RATIO = IDC_MARK_PNG.width / IDC_MARK_PNG.height;

/** `data:` URI do PNG do monograma (fundo transparente). */
export function markPngDataUri(): string {
  return `data:image/png;base64,${IDC_MARK_PNG.base64}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

interface IconLayout {
  /** Lado do viewBox. */
  box: number;
  /** Raio dos cantos do fundo (0 = quadrado inteiro, para maskable/iOS). */
  radius: number;
  /** Largura do monograma em relação ao lado do ícone. */
  markWidth: number;
}

/**
 * - `favicon`: 64×64, cantos arredondados, monograma largo (legível a 16px).
 * - `maskable`: 512×512 sangrado; monograma dentro da zona segura (círculo de 40%),
 *   serve para Android (maskable/any) e iOS (apple-touch-icon, sem transparência).
 */
const LAYOUTS: Record<"favicon" | "maskable", IconLayout> = {
  favicon: { box: 64, radius: 14, markWidth: 0.9 },
  maskable: { box: 512, radius: 0, markWidth: 0.66 },
};

export type AppIconVariant = keyof typeof LAYOUTS;

/** Caixa do monograma centralizado no ícone. */
export function markBox(variant: AppIconVariant): { x: number; y: number; width: number; height: number } {
  const l = LAYOUTS[variant];
  const width = round(l.box * l.markWidth);
  const height = round(width / IDC_MARK_RATIO);
  return { x: round((l.box - width) / 2), y: round((l.box - height) / 2), width, height };
}

/** SVG completo do ícone (string), sem dependências externas. */
export function appIconSvg(variant: AppIconVariant): string {
  const l = LAYOUTS[variant];
  const m = markBox(variant);
  const rx = l.radius > 0 ? ` rx="${l.radius}"` : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.box} ${l.box}" width="${l.box}" height="${l.box}">`,
    `<rect width="${l.box}" height="${l.box}"${rx} fill="${IDC_COLORS.background}"/>`,
    `<image href="${markPngDataUri()}" x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}"/>`,
    `</svg>`,
  ].join("");
}

/** `data:` URI do SVG do ícone. */
export function appIconDataUri(variant: AppIconVariant): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(appIconSvg(variant))}`;
}

/** Tamanhos PNG gerados por src/app/apple-icon.tsx (ids viram /apple-icon/<id>). */
export const PNG_ICON_SIZES = [
  { id: "180.png", size: 180 },
  { id: "192.png", size: 192 },
  { id: "512.png", size: 512 },
] as const;

export type PngIconId = (typeof PNG_ICON_SIZES)[number]["id"];

/** URL pública de um PNG gerado (termina em .png: fica fora do proxy de autenticação). */
export function pngIconUrl(id: PngIconId): string {
  return `/apple-icon/${id}`;
}
