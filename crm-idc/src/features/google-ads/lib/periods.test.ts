import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  earliestMetricKey,
  isKeyInRange,
  leadsInRange,
  metricsInRange,
  presetRange,
  previousRange,
  rangeLength,
  rangeToLeadWindow,
} from "./periods";

const TODAY = "2026-09-27";

describe("aritmética de datas-calendário", () => {
  it("soma dias atravessando meses e anos bissextos", () => {
    expect(addDaysToKey("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysToKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToKey("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("conta os dias do intervalo incluindo as pontas", () => {
    expect(rangeLength({ from: "2026-09-01", to: "2026-09-30" })).toBe(30);
    expect(rangeLength({ from: "2026-09-27", to: "2026-09-27" })).toBe(1);
  });

  it("verifica se a data está no intervalo", () => {
    const range = { from: "2026-09-01", to: "2026-09-30" };
    expect(isKeyInRange("2026-09-01", range)).toBe(true);
    expect(isKeyInRange("2026-09-30", range)).toBe(true);
    expect(isKeyInRange("2026-10-01", range)).toBe(false);
  });
});

describe("presetRange", () => {
  it("últimos N dias incluem hoje", () => {
    expect(presetRange("7d", TODAY)).toEqual({ from: "2026-09-21", to: TODAY });
    expect(presetRange("30d", TODAY)).toEqual({ from: "2026-08-29", to: TODAY });
    expect(presetRange("90d", TODAY)).toEqual({ from: "2026-06-30", to: TODAY });
  });

  it("mês atual e mês anterior", () => {
    expect(presetRange("month", TODAY)).toEqual({ from: "2026-09-01", to: TODAY });
    expect(presetRange("last_month", TODAY)).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    expect(presetRange("last_month", "2026-03-10")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(presetRange("last_month", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("todo o período começa na primeira métrica (sem métricas: últimos 30 dias)", () => {
    expect(presetRange("all", TODAY, "2025-11-03")).toEqual({ from: "2025-11-03", to: TODAY });
    expect(presetRange("all", TODAY, null)).toEqual({ from: "2026-08-29", to: TODAY });
  });
});

describe("previousRange", () => {
  it("mesma duração imediatamente antes", () => {
    expect(previousRange({ from: "2026-09-21", to: TODAY }, "7d")).toEqual({ from: "2026-09-14", to: "2026-09-20" });
    expect(previousRange({ from: "2026-09-10", to: "2026-09-12" }, "custom")).toEqual({
      from: "2026-09-07",
      to: "2026-09-09",
    });
  });

  it("mês atual compara com os mesmos dias do mês anterior", () => {
    expect(previousRange({ from: "2026-09-01", to: TODAY }, "month")).toEqual({ from: "2026-08-01", to: "2026-08-27" });
    expect(previousRange({ from: "2026-03-01", to: "2026-03-31" }, "month")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("mês anterior compara com o mês inteiro antes dele", () => {
    expect(previousRange({ from: "2026-09-01", to: "2026-09-30" }, "last_month")).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("todo o período não tem comparação", () => {
    expect(previousRange({ from: "2025-01-01", to: TODAY }, "all")).toBeNull();
  });
});

describe("filtros por intervalo", () => {
  it("janela de leads em UTC no fuso da Bahia (GMT-3)", () => {
    expect(rangeToLeadWindow({ from: "2026-09-01", to: "2026-09-30" })).toEqual({
      createdFrom: "2026-09-01T03:00:00.000Z",
      createdTo: "2026-10-01T03:00:00.000Z",
    });
  });

  it("leads criados às 22h de Barreiras contam no próprio dia", () => {
    const leads = [
      { id: "a", created_at: "2026-09-01T02:59:59.000Z" }, // 31/08 23:59 Bahia
      { id: "b", created_at: "2026-09-01T03:00:00.000Z" }, // 01/09 00:00
      { id: "c", created_at: "2026-10-01T01:30:00.000Z" }, // 30/09 22:30
      { id: "d", created_at: "2026-10-01T03:00:00.000Z" }, // 01/10
    ];
    expect(leadsInRange(leads, { from: "2026-09-01", to: "2026-09-30" }).map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("métricas no intervalo e primeira data", () => {
    const metrics = [{ date: "2026-09-02" }, { date: "2026-08-31" }, { date: "2026-09-30" }];
    expect(metricsInRange(metrics, { from: "2026-09-01", to: "2026-09-30" })).toHaveLength(2);
    expect(earliestMetricKey(metrics)).toBe("2026-08-31");
    expect(earliestMetricKey([])).toBeNull();
  });
});
