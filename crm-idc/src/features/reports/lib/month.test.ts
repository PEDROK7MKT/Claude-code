import { describe, expect, it } from "vitest";
import {
  capitalize,
  isMonthKey,
  monthLabel,
  monthName,
  monthNavigation,
  parseMonthParam,
  recentMonthOptions,
  resolveMonthKey,
  shiftMonth,
} from "./month";

describe("isMonthKey", () => {
  it("aceita yyyy-MM válidos", () => {
    expect(isMonthKey("2026-03")).toBe(true);
    expect(isMonthKey("2000-01")).toBe(true);
  });

  it("rejeita formatos e meses inválidos", () => {
    for (const value of ["2026-3", "2026-13", "2026-00", "26-03", "2026/03", "1999-12", "", null, 202603]) {
      expect(isMonthKey(value)).toBe(false);
    }
  });
});

describe("shiftMonth", () => {
  it("atravessa a virada de ano nos dois sentidos", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
    expect(shiftMonth("2026-03", 13)).toBe("2027-04");
    expect(shiftMonth("2026-03", -24)).toBe("2024-03");
    expect(shiftMonth("2026-03", 0)).toBe("2026-03");
  });
});

describe("parseMonthParam", () => {
  it("valida o parâmetro ?mes=", () => {
    expect(parseMonthParam("2026-03", "2026-09")).toBe("2026-03");
    expect(parseMonthParam(" 2026-03 ", "2026-09")).toBe("2026-03");
    expect(parseMonthParam(["2026-02", "2026-01"], "2026-09")).toBe("2026-02");
    expect(parseMonthParam("2026-09", "2026-09")).toBe("2026-09");
  });

  it("descarta ausente, malformado e mês futuro", () => {
    expect(parseMonthParam(undefined, "2026-09")).toBeNull();
    expect(parseMonthParam(null, "2026-09")).toBeNull();
    expect(parseMonthParam([], "2026-09")).toBeNull();
    expect(parseMonthParam("março", "2026-09")).toBeNull();
    expect(parseMonthParam("2026-10", "2026-09")).toBeNull();
  });

  it("resolveMonthKey cai no mês atual", () => {
    expect(resolveMonthKey("xx", "2026-09")).toBe("2026-09");
    expect(resolveMonthKey(undefined, "2026-09")).toBe("2026-09");
    expect(resolveMonthKey("2025-12", "2026-09")).toBe("2025-12");
  });
});

describe("rótulos", () => {
  it("formata o mês em pt-BR", () => {
    expect(monthLabel("2026-03")).toBe("março de 2026");
    expect(monthLabel("2025-12")).toBe("dezembro de 2025");
    expect(monthName("2026-02")).toBe("fevereiro");
    expect(capitalize("março de 2026")).toBe("Março de 2026");
    expect(capitalize("")).toBe("");
  });
});

describe("recentMonthOptions", () => {
  it("lista os últimos 24 meses, do atual para trás", () => {
    const options = recentMonthOptions("2026-09");
    expect(options).toHaveLength(24);
    expect(options[0]).toEqual({ value: "2026-09", label: "Setembro de 2026" });
    expect(options[1].value).toBe("2026-08");
    expect(options[23].value).toBe("2024-10");
  });

  it("inclui um mês selecionado fora da janela, em ordem", () => {
    const options = recentMonthOptions("2026-09", "2020-01");
    expect(options).toHaveLength(25);
    expect(options[24]).toEqual({ value: "2020-01", label: "Janeiro de 2020" });
  });

  it("não duplica o mês selecionado dentro da janela nem aceita futuro", () => {
    expect(recentMonthOptions("2026-09", "2026-03")).toHaveLength(24);
    expect(recentMonthOptions("2026-09", "2027-01")).toHaveLength(24);
  });
});

describe("monthNavigation", () => {
  it("desabilita avançar no mês atual", () => {
    expect(monthNavigation("2026-09", "2026-09")).toEqual({ previous: "2026-08", next: null });
  });

  it("desabilita voltar no mês mais antigo da lista", () => {
    expect(monthNavigation("2024-10", "2026-09")).toEqual({ previous: null, next: "2024-11" });
  });

  it("navega nos dois sentidos no meio da janela", () => {
    expect(monthNavigation("2026-01", "2026-09")).toEqual({ previous: "2025-12", next: "2026-02" });
  });
});
