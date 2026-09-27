import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/constants";
import { brandCssVariables, safeHexColor } from "./branding";

describe("safeHexColor", () => {
  it("aceita #RRGGBB e #RGB, normalizando para #RRGGBB maiúsculo", () => {
    expect(safeHexColor("#0d6e6e", "#000000")).toBe("#0D6E6E");
    expect(safeHexColor("  #E8B931 ", "#000000")).toBe("#E8B931");
    expect(safeHexColor("#abc", "#000000")).toBe("#AABBCC");
  });

  it("rejeita valores que poderiam injetar CSS", () => {
    expect(safeHexColor("red", "#000000")).toBe("#000000");
    expect(safeHexColor("#0D6E6E; background: url(x)", "#000000")).toBe("#000000");
    expect(safeHexColor("#12345", "#000000")).toBe("#000000");
    expect(safeHexColor(null, "#000000")).toBe("#000000");
    expect(safeHexColor(123, "#000000")).toBe("#000000");
  });
});

describe("brandCssVariables", () => {
  it("usa as cores das configurações", () => {
    expect(brandCssVariables({ primary_color: "#123456", accent_color: "#abcdef" })).toEqual({
      "--brand-primary": "#123456",
      "--brand-accent": "#ABCDEF",
    });
  });

  it("cai nos padrões do IDC", () => {
    expect(brandCssVariables(null)).toEqual({ "--brand-primary": BRAND.primary, "--brand-accent": BRAND.accent });
    expect(brandCssVariables({ primary_color: "teal" })).toEqual({
      "--brand-primary": BRAND.primary,
      "--brand-accent": BRAND.accent,
    });
  });
});
