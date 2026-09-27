import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  IDC_COLORS,
  IDC_MARK,
  PNG_ICON_SIZES,
  appIconDataUri,
  appIconSvg,
  iconScale,
  markTranslate,
  pngIconUrl,
} from "./brand-icon";

const ICON_SVG = fileURLToPath(new URL("../../../app/icon.svg", import.meta.url));

describe("icon.svg", () => {
  it("é exatamente o SVG gerado (fonte única do desenho)", () => {
    expect(readFileSync(ICON_SVG, "utf8").trim()).toBe(appIconSvg("favicon"));
  });

  it("usa as cores do logo do IDC (grafite, dourado e cinza)", () => {
    const svg = appIconSvg("favicon");
    expect(svg).toContain(IDC_COLORS.background);
    expect(svg).toContain(IDC_COLORS.gold);
    expect(svg).toContain(IDC_COLORS.gray);
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('rx="14"');
  });

  it("centraliza as letras no ícone", () => {
    const [tx, ty] = markTranslate("favicon");
    const s = iconScale("favicon");
    const { x1, y1, x2, y2 } = IDC_MARK.bounds;
    expect(tx + ((x1 + x2) / 2) * s).toBeCloseTo(32, 1);
    expect(ty + ((y1 + y2) / 2) * s).toBeCloseTo(32, 1);
  });
});

describe("ícone maskable (Android/iOS)", () => {
  const svg = appIconSvg("maskable");

  it("fundo sangrado, sem transparência nos cantos", () => {
    expect(svg).toContain(`<rect width="512" height="512" fill="${IDC_COLORS.background}"/>`);
    expect(svg).not.toContain("rx=");
  });

  it("letras dentro da zona segura (círculo de raio 40%)", () => {
    const [tx, ty] = markTranslate("maskable");
    const s = iconScale("maskable");
    const { x1, y1, x2, y2 } = IDC_MARK.bounds;
    const corners: Array<[number, number]> = [
      [x1, y1],
      [x2, y1],
      [x1, y2],
      [x2, y2],
    ].map(([x, y]) => [tx + x * s, ty + y * s]);
    for (const [x, y] of corners) {
      expect(Math.hypot(x - 256, y - 256)).toBeLessThanOrEqual(512 * 0.4);
    }
  });
});

describe("helpers", () => {
  it("data URI decodifica para o SVG", () => {
    const uri = appIconDataUri("maskable");
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(uri.split(",")[1])).toBe(appIconSvg("maskable"));
  });

  it("PNGs em tamanhos de instalação, com URL terminando em .png", () => {
    expect(PNG_ICON_SIZES.map((i) => i.size)).toEqual([180, 192, 512]);
    for (const { id, size } of PNG_ICON_SIZES) {
      expect(id).toBe(`${size}.png`);
      expect(pngIconUrl(id)).toMatch(/^\/apple-icon\/\d+\.png$/);
    }
  });
});
