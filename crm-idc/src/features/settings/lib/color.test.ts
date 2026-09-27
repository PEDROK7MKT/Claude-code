import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/constants";
import {
  assessAccentColor,
  assessPrimaryColor,
  contrastLevel,
  contrastRatio,
  formatContrastRatio,
  hexToRgb,
  isHexColor,
  normalizeHexInput,
  relativeLuminance,
} from "./color";

describe("isHexColor / normalizeHexInput", () => {
  it("aceita só #RRGGBB no formato estrito", () => {
    expect(isHexColor("#0D6E6E")).toBe(true);
    expect(isHexColor("#0d6e6e")).toBe(true);
    expect(isHexColor("0D6E6E")).toBe(false);
    expect(isHexColor("#0D6")).toBe(false);
    expect(isHexColor("teal")).toBe(false);
    expect(isHexColor(null)).toBe(false);
  });

  it("normaliza o que foi digitado", () => {
    expect(normalizeHexInput("0d6e6e")).toBe("#0D6E6E");
    expect(normalizeHexInput(" #0d6e6e ")).toBe("#0D6E6E");
    expect(normalizeHexInput("#abc")).toBe("#AABBCC");
    expect(normalizeHexInput("#abcd")).toBeNull();
    expect(normalizeHexInput("#GGGGGG")).toBeNull();
    expect(normalizeHexInput("")).toBeNull();
    expect(normalizeHexInput(undefined)).toBeNull();
  });
});

describe("contraste WCAG", () => {
  it("hexToRgb", () => {
    expect(hexToRgb("#0D6E6E")).toEqual({ r: 13, g: 110, b: 110 });
    expect(() => hexToRgb("xyz")).toThrow(RangeError);
  });

  it("luminância dos extremos", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("razões conhecidas", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    // simétrica
    expect(contrastRatio("#0D6E6E", "#FFFFFF")).toBeCloseTo(contrastRatio("#FFFFFF", "#0D6E6E"), 10);
    // #767676 é o cinza mais claro com 4,5:1 no branco
    expect(contrastRatio("#767676", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeLessThan(4.5);
  });

  it("formata em pt-BR arredondando para baixo", () => {
    expect(formatContrastRatio(4.49)).toBe("4,4:1");
    expect(formatContrastRatio(21)).toBe("21,0:1");
  });

  it("níveis", () => {
    expect(contrastLevel(8)).toBe("aaa");
    expect(contrastLevel(5)).toBe("aa");
    expect(contrastLevel(3.2)).toBe("aa-large");
    expect(contrastLevel(2)).toBe("fail");
  });
});

describe("avaliação das cores da marca", () => {
  it("cores padrão do IDC não geram aviso", () => {
    expect(assessPrimaryColor(BRAND.primary).warning).toBeNull();
    expect(assessPrimaryColor(BRAND.primary).level).toBe("aa");
    expect(assessAccentColor(BRAND.accent).warning).toBeNull();
  });

  it("primária clara demais avisa sobre o texto branco", () => {
    const yellow = assessPrimaryColor("#FACC15");
    expect(yellow.level).toBe("fail");
    expect(yellow.warning).toMatch(/muito baixo/);
    const mid = assessPrimaryColor("#0D9488");
    expect(mid.level).toBe("aa-large");
    expect(mid.warning).toMatch(/4,5:1/);
  });

  it("destaque quase branco ou escuro demais avisa", () => {
    expect(assessAccentColor("#FFFDF5").warning).toMatch(/quase invisível/);
    expect(assessAccentColor("#1A1A1A").warning).toMatch(/texto escuro/);
  });
});
