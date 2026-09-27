import { describe, expect, it } from "vitest";
import { formatAxisCount, formatAxisCurrency, formatAxisPercent } from "./chart-format";

describe("formatação dos eixos", () => {
  it("moeda: centavos abaixo de R$ 10, inteiro até mil, compacto acima", () => {
    expect(formatAxisCurrency(0)).toBe("R$ 0");
    expect(formatAxisCurrency(0.85)).toBe("R$ 0,85");
    expect(formatAxisCurrency(12.4)).toBe("R$ 12");
    expect(formatAxisCurrency(1234)).toBe("R$ 1,2 mil");
    expect(formatAxisCurrency(Number.NaN)).toBe("");
  });

  it("percentual e contagem", () => {
    expect(formatAxisPercent(4)).toBe("4%");
    expect(formatAxisPercent(4.56)).toBe("4,6%");
    expect(formatAxisCount(12)).toBe("12");
    expect(formatAxisCount(1500)).toBe("1,5 mil");
  });
});
