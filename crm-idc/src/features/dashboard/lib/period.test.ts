import { describe, expect, it } from "vitest";
import {
  buildPeriodSearch,
  comparisonLabel,
  DEFAULT_PERIOD,
  formatRangeLabel,
  isPeriodKey,
  parsePeriodParam,
  PERIOD_CHOICES,
  PERIOD_PARAM,
} from "./period";

describe("parsePeriodParam", () => {
  it("aceita os quatro períodos válidos", () => {
    expect(parsePeriodParam("today")).toBe("today");
    expect(parsePeriodParam("7d")).toBe("7d");
    expect(parsePeriodParam("30d")).toBe("30d");
    expect(parsePeriodParam("month")).toBe("month");
  });

  it("usa 30 dias quando ausente ou inválido", () => {
    expect(DEFAULT_PERIOD).toBe("30d");
    expect(parsePeriodParam(undefined)).toBe("30d");
    expect(parsePeriodParam(null)).toBe("30d");
    expect(parsePeriodParam("")).toBe("30d");
    expect(parsePeriodParam("90d")).toBe("30d");
    expect(parsePeriodParam("__proto__")).toBe("30d");
  });

  it("ignora espaços/maiúsculas e usa o primeiro valor repetido", () => {
    expect(parsePeriodParam(" Month ")).toBe("month");
    expect(parsePeriodParam(["7d", "today"])).toBe("7d");
    expect(parsePeriodParam([])).toBe("30d");
  });

  it("isPeriodKey só aceita strings conhecidas", () => {
    expect(isPeriodKey("today")).toBe(true);
    expect(isPeriodKey(7)).toBe(false);
    expect(isPeriodKey("hoje")).toBe(false);
  });
});

describe("PERIOD_CHOICES", () => {
  it("tem rótulos curtos e longos em pt-BR na ordem do seletor", () => {
    expect(PERIOD_CHOICES.map((c) => c.label)).toEqual(["Hoje", "7 dias", "30 dias", "Mês atual"]);
    expect(PERIOD_CHOICES.map((c) => c.longLabel)).toEqual(["Hoje", "Últimos 7 dias", "Últimos 30 dias", "Mês atual"]);
  });
});

describe("buildPeriodSearch", () => {
  it("grava o período explicitamente, inclusive o padrão", () => {
    expect(buildPeriodSearch("", "7d")).toBe(`?${PERIOD_PARAM}=7d`);
    expect(buildPeriodSearch("?periodo=7d", "30d")).toBe("?periodo=30d");
  });

  it("preserva outros parâmetros", () => {
    expect(buildPeriodSearch("?foo=1&periodo=today", "month")).toBe("?foo=1&periodo=month");
    expect(buildPeriodSearch("foo=a+b", "today")).toBe("?foo=a+b&periodo=today");
  });
});

describe("comparisonLabel", () => {
  it("descreve o período de comparação", () => {
    expect(comparisonLabel("today")).toBe("vs ontem");
    expect(comparisonLabel("7d")).toBe("vs 7 dias anteriores");
    expect(comparisonLabel("30d")).toBe("vs 30 dias anteriores");
    expect(comparisonLabel("month")).toBe("vs mesmo período do mês anterior");
  });
});

describe("formatRangeLabel", () => {
  it("um único dia", () => {
    expect(formatRangeLabel({ fromKey: "2026-09-27", toKey: "2026-09-27" })).toBe("27/09/2026");
  });

  it("mesmo ano: início curto", () => {
    expect(formatRangeLabel({ fromKey: "2026-08-29", toKey: "2026-09-27" })).toBe("29/08 – 27/09/2026");
  });

  it("anos diferentes: datas completas", () => {
    expect(formatRangeLabel({ fromKey: "2025-12-29", toKey: "2026-01-04" })).toBe("29/12/2025 – 04/01/2026");
  });
});
