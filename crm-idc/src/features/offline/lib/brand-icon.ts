/**
 * Ícone do app (PWA / favicon): monograma "iDC" do Instituto Décio Carrilho —
 * "i" dourado e "DC" cinza sobre grafite, como no logo da clínica.
 * Fonte única do desenho — gera o src/app/icon.svg (conferido por teste), os PNGs
 * de src/app/apple-icon.tsx e o selo BrandMark do shell.
 */

export const IDC_COLORS = {
  background: "#2B2B2B",
  gold: "#E2B272",
  gray: "#A7A7A7",
} as const;

/**
 * Monograma desenhado num espaço 100×100 (letras ocupam x 12–87 · y 20–80,
 * centro ≈ 49,5 × 50). Pontos usados pelo teste da zona segura.
 */
export const IDC_MARK = {
  /** Pingo do "i" */
  dot: { cx: 19, cy: 27, r: 6.5 },
  /** Haste do "i" (folha inclinada) */
  stem: "M17.5 37.5C23.5 41 27 51 26.2 62.5C25.6 71.5 22.6 77.5 16.6 80C13.2 72 12 62.5 12.8 53C13.4 45.5 15.2 40.5 17.5 37.5Z",
  /** "D" com haste grossa e bojo de contraste (evenodd) */
  d: "M31 22H44C62 22 72 34 72 50C72 66 62 78 44 78H31ZM37.5 24.6V75.4H44C58.5 75.4 66 65 66 50C66 35 58.5 24.6 44 24.6Z",
  /** "C" grande sobreposto ao "D" */
  c: "M86.7 31.4A25 25 0 1 0 86.7 68.6L85.5 66.3A21 21 0 1 1 85.5 33.7Z",
  /** Caixa das letras no espaço 100×100 */
  bounds: { x1: 12, y1: 20, x2: 87, y2: 80 },
} as const;

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Letras do monograma (sem fundo) como elementos SVG. */
export function idcMarkShapes(): string {
  const { dot, stem, d, c } = IDC_MARK;
  return [
    `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${IDC_COLORS.gold}"/>`,
    `<path d="${stem}" fill="${IDC_COLORS.gold}"/>`,
    `<path d="${d}" fill="${IDC_COLORS.gray}" fill-rule="evenodd"/>`,
    `<path d="${c}" fill="${IDC_COLORS.gray}"/>`,
  ].join("");
}

interface IconLayout {
  /** Lado do viewBox. */
  box: number;
  /** Raio dos cantos do fundo (0 = quadrado inteiro, para maskable/iOS). */
  radius: number;
  /** Escala do espaço 100×100 do monograma. */
  scale: number;
}

/**
 * - `favicon`: 64×64, cantos arredondados, letras grandes (legível a 16px).
 * - `maskable`: 512×512 sangrado; letras dentro da zona segura (círculo de 40%),
 *   serve para Android (maskable/any) e iOS (apple-touch-icon, sem transparência).
 */
const LAYOUTS: Record<"favicon" | "maskable", IconLayout> = {
  favicon: { box: 64, radius: 14, scale: 0.64 },
  maskable: { box: 512, radius: 0, scale: 3.9 },
};

export type AppIconVariant = keyof typeof LAYOUTS;

/** Deslocamento que centraliza as letras (centro da caixa) no ícone. */
export function markTranslate(variant: AppIconVariant): [number, number] {
  const l = LAYOUTS[variant];
  const { x1, y1, x2, y2 } = IDC_MARK.bounds;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return [round(l.box / 2 - cx * l.scale), round(l.box / 2 - cy * l.scale)];
}

/** SVG completo do ícone (string), sem dependências externas. */
export function appIconSvg(variant: AppIconVariant): string {
  const l = LAYOUTS[variant];
  const [tx, ty] = markTranslate(variant);
  const rx = l.radius > 0 ? ` rx="${l.radius}"` : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.box} ${l.box}" width="${l.box}" height="${l.box}">`,
    `<rect width="${l.box}" height="${l.box}"${rx} fill="${IDC_COLORS.background}"/>`,
    `<g transform="translate(${tx} ${ty}) scale(${l.scale})">`,
    idcMarkShapes(),
    `</g>`,
    `</svg>`,
  ].join("");
}

/** Escala usada por um variante (exposta para o teste da zona segura). */
export function iconScale(variant: AppIconVariant): number {
  return LAYOUTS[variant].scale;
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
