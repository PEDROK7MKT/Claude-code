import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { IDC_MARK_PNG } from "./brand-assets";
import {
  IDC_COLORS,
  IDC_LOGO_URL,
  IDC_MARK_RATIO,
  IDC_MARK_URL,
  PNG_ICON_SIZES,
  appIconDataUri,
  appIconSvg,
  markBox,
  markPngDataUri,
  pngIconUrl,
} from "./brand-icon";

const ICON_SVG = fileURLToPath(new URL("../../../app/icon.svg", import.meta.url));
const PUBLIC = fileURLToPath(new URL("../../../../public", import.meta.url));

describe("icon.svg", () => {
  it("é exatamente o SVG gerado (fonte única do desenho)", () => {
    expect(readFileSync(ICON_SVG, "utf8").trim()).toBe(appIconSvg("favicon"));
  });

  it("usa o monograma do logo original sobre fundo branco", () => {
    const svg = appIconSvg("favicon");
    expect(svg).toContain(`fill="${IDC_COLORS.background}"`);
    expect(svg).toContain(`href="${markPngDataUri()}"`);
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('rx="14"');
  });

  it("centraliza o monograma mantendo a proporção", () => {
    const m = markBox("favicon");
    expect(m.x + m.width / 2).toBeCloseTo(32, 1);
    expect(m.y + m.height / 2).toBeCloseTo(32, 1);
    expect(m.width / m.height).toBeCloseTo(IDC_MARK_RATIO, 1);
  });
});

describe("ícone maskable (Android/iOS)", () => {
  it("fundo sangrado, sem transparência nos cantos", () => {
    const svg = appIconSvg("maskable");
    expect(svg).toContain(`<rect width="512" height="512" fill="${IDC_COLORS.background}"/>`);
    expect(svg).not.toContain("rx=");
  });

  it("monograma dentro da zona segura (círculo de raio 40%)", () => {
    const { x, y, width, height } = markBox("maskable");
    for (const [cx, cy] of [
      [x, y],
      [x + width, y],
      [x, y + height],
      [x + width, y + height],
    ]) {
      expect(Math.hypot(cx - 256, cy - 256)).toBeLessThanOrEqual(512 * 0.4);
    }
  });
});

describe("arquivos do logo", () => {
  it("PNG embutido é um PNG válido do monograma (≈ 2:1)", () => {
    const bytes = Buffer.from(IDC_MARK_PNG.base64, "base64");
    expect(bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect(IDC_MARK_RATIO).toBeGreaterThan(1.8);
    expect(IDC_MARK_RATIO).toBeLessThan(2.2);
  });

  it("logo completo e monograma existem em public/brand", () => {
    expect(existsSync(`${PUBLIC}${IDC_LOGO_URL}`)).toBe(true);
    expect(existsSync(`${PUBLIC}${IDC_MARK_URL}`)).toBe(true);
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
