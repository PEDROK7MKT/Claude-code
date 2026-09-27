import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { BRAND } from "@/lib/constants";
import { PNG_ICON_SIZES, appIconDataUri, appIconSvg, pngIconUrl, sparklePath } from "./brand-icon";

const ICON_SVG = fileURLToPath(new URL("../../../app/icon.svg", import.meta.url));

/** Pontos extremos de todos os comandos M/Q/C de um path absoluto (aproximação da caixa). */
function pathPoints(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const points: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]]);
  return points;
}

describe("icon.svg", () => {
  it("é exatamente o SVG gerado (fonte única do desenho)", () => {
    expect(readFileSync(ICON_SVG, "utf8").trim()).toBe(appIconSvg("favicon"));
  });

  it("usa as cores da marca", () => {
    const svg = appIconSvg("favicon");
    expect(svg).toContain(BRAND.primary);
    expect(svg).toContain(BRAND.accent);
    expect(svg).toContain('viewBox="0 0 64 64"');
  });
});

describe("ícone maskable (Android/iOS)", () => {
  const svg = appIconSvg("maskable");

  it("fundo sangrado, sem transparência nos cantos", () => {
    expect(svg).toContain('<rect width="512" height="512" fill="url(#bg)"/>');
    expect(svg).not.toContain("rx=");
  });

  it("dente e brilho dentro da zona segura (círculo de raio 40%)", () => {
    const transform = svg.match(/translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)/);
    expect(transform).not.toBeNull();
    const [tx, ty, s] = transform!.slice(1).map(Number);
    // caixa do dente no viewBox 24
    const corners: Array<[number, number]> = [
      [3.3, 3.2],
      [20.7, 3.2],
      [3.3, 21],
      [20.7, 21],
    ].map(([x, y]) => [tx + x * s, ty + y * s]);

    const sparkle = svg.match(/<path d="(M[^"]+Z)" fill="#E8B931"/);
    expect(sparkle).not.toBeNull();

    const safeRadius = 512 * 0.4;
    for (const [x, y] of [...corners, ...pathPoints(sparkle![1])]) {
      expect(Math.hypot(x - 256, y - 256)).toBeLessThanOrEqual(safeRadius);
    }
  });
});

describe("helpers", () => {
  it("sparklePath é fechado e centrado", () => {
    const d = sparklePath(10, 10, 5);
    expect(d.startsWith("M10 5")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("15 10");
    expect(d).toContain("10 15");
    expect(d).toContain("5 10");
  });

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
