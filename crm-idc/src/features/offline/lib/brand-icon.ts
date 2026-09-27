/**
 * Ícone do app (PWA / favicon): dente branco sobre teal com um brilho dourado.
 * Fonte única do desenho — gera o src/app/icon.svg (conferido por teste) e os PNGs
 * de src/app/apple-icon.tsx. Mesma silhueta do ToothIcon do shell.
 */
import { BRAND } from "@/lib/constants";

export const ICON_COLORS = {
  tealTop: "#138584",
  teal: BRAND.primary,
  tealBottom: "#095454",
  tooth: "#FFFFFF",
  shine: BRAND.primary,
  gold: BRAND.accent,
} as const;

/** Silhueta do dente (viewBox 24×24; caixa ≈ x 3,3–20,7 · y 3,2–21). */
export const TOOTH_PATH =
  "M7.4 3.2C4.9 3.2 3.3 5.2 3.3 7.8c0 2.1.7 3.5 1.3 4.9.6 1.5.9 3.2 1.2 5.2.3 1.9.9 3.1 2 3.1 1.2 0 1.6-1.3 1.9-2.9.3-1.8.8-3.1 2.3-3.1s2 1.3 2.3 3.1c.3 1.6.7 2.9 1.9 2.9 1.1 0 1.7-1.2 2-3.1.3-2 .6-3.7 1.2-5.2.6-1.4 1.3-2.8 1.3-4.9 0-2.6-1.6-4.6-4.1-4.6-1.9 0-2.8 1-4.6 1s-2.7-1-4.6-1Z";

/** Reflexo discreto na coroa do dente. */
export const TOOTH_SHINE_PATH = "M7.9 6.9c.7-.6 1.6-.7 2.4-.3";

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Estrela de 4 pontas (brilho) centrada em (cx, cy). */
export function sparklePath(cx: number, cy: number, r: number): string {
  const a = r * 0.2;
  const p = (x: number, y: number) => `${round(x)} ${round(y)}`;
  return [
    `M${p(cx, cy - r)}`,
    `Q${p(cx + a, cy - a)} ${p(cx + r, cy)}`,
    `Q${p(cx + a, cy + a)} ${p(cx, cy + r)}`,
    `Q${p(cx - a, cy + a)} ${p(cx - r, cy)}`,
    `Q${p(cx - a, cy - a)} ${p(cx, cy - r)}Z`,
  ].join("");
}

interface IconLayout {
  /** Lado do viewBox. */
  box: number;
  /** Raio dos cantos do fundo (0 = quadrado inteiro, para maskable/iOS). */
  radius: number;
  toothScale: number;
  /** Centro desejado do dente. */
  toothCenter: [number, number];
  sparkle: { cx: number; cy: number; r: number; ring: number };
  /** Ponto dourado extra (só nos tamanhos grandes). */
  dot?: { cx: number; cy: number; r: number };
}

/**
 * - `favicon`: 64×64, cantos arredondados, dente grande (legível a 16px).
 * - `maskable`: 512×512 sangrado; dente e brilho dentro da zona segura (círculo de 40%),
 *   serve para Android (maskable/any) e iOS (apple-touch-icon, sem transparência).
 */
const LAYOUTS: Record<"favicon" | "maskable", IconLayout> = {
  favicon: {
    box: 64,
    radius: 14,
    toothScale: 2.2,
    toothCenter: [31, 34.5],
    sparkle: { cx: 50.5, cy: 13.5, r: 9, ring: 2.5 },
  },
  maskable: {
    box: 512,
    radius: 0,
    toothScale: 13,
    toothCenter: [248, 270],
    sparkle: { cx: 364, cy: 148, r: 42, ring: 12 },
    dot: { cx: 408, cy: 214, r: 9 },
  },
};

export type AppIconVariant = keyof typeof LAYOUTS;

/** SVG completo do ícone (string), sem dependências externas. */
export function appIconSvg(variant: AppIconVariant): string {
  const l = LAYOUTS[variant];
  // centro da caixa do dente no viewBox 24 (x 3,3–20,7 · y 3,2–21)
  const tx = round(l.toothCenter[0] - 12 * l.toothScale);
  const ty = round(l.toothCenter[1] - 12.1 * l.toothScale);
  const { cx, cy, r, ring } = l.sparkle;
  const star = sparklePath(cx, cy, r);
  const rx = l.radius > 0 ? ` rx="${l.radius}"` : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.box} ${l.box}" width="${l.box}" height="${l.box}">`,
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${ICON_COLORS.tealTop}"/>`,
    `<stop offset="0.55" stop-color="${ICON_COLORS.teal}"/>`,
    `<stop offset="1" stop-color="${ICON_COLORS.tealBottom}"/>`,
    `</linearGradient></defs>`,
    `<rect width="${l.box}" height="${l.box}"${rx} fill="url(#bg)"/>`,
    `<g transform="translate(${tx} ${ty}) scale(${l.toothScale})">`,
    `<path d="${TOOTH_PATH}" fill="${ICON_COLORS.tooth}"/>`,
    `<path d="${TOOTH_SHINE_PATH}" fill="none" stroke="${ICON_COLORS.shine}" stroke-opacity="0.35" stroke-width="1.1" stroke-linecap="round"/>`,
    `</g>`,
    // anel teal separa o brilho do dente
    `<path d="${star}" fill="${ICON_COLORS.gold}" stroke="${ICON_COLORS.teal}" stroke-width="${ring}" stroke-linejoin="round" paint-order="stroke"/>`,
    l.dot ? `<circle cx="${l.dot.cx}" cy="${l.dot.cy}" r="${l.dot.r}" fill="${ICON_COLORS.gold}" fill-opacity="0.85"/>` : "",
    `</svg>`,
  ].join("");
}

/** `data:` URI do SVG (para <img> dentro do ImageResponse). */
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
