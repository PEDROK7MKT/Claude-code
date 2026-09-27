import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { dailyMetricKey, dedupeDailyMetrics, isValidDateKey, parseDateKey, sanitizeDailyMetric } from "./daily-metrics-utils";

describe("isValidDateKey / parseDateKey", () => {
  it("valida datas do calendário", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2028-02-29")).toBe(true);
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("2026-1-01")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
  });

  it.each([
    ["2026-03-05", "2026-03-05"],
    ["2026-3-5", "2026-03-05"],
    ["2026-03-05T00:00:00Z", "2026-03-05"],
    ["05/03/2026", "2026-03-05"],
    ["5/3/2026", "2026-03-05"],
    ["05-03-2026", "2026-03-05"],
    ["05.03.2026", "2026-03-05"],
    [" 31/12/2026 ", "2026-12-31"],
  ])("%j → %s", (input, expected) => {
    expect(parseDateKey(input)).toBe(expected);
  });

  it.each([["31/02/2026"], ["2026/03/05"], ["03/2026"], ["ontem"], [""]])("%j → null", (input) => {
    expect(parseDateKey(input)).toBeNull();
  });

  it("nulos", () => {
    expect(parseDateKey(null)).toBeNull();
    expect(parseDateKey(undefined)).toBeNull();
  });
});

describe("sanitizeDailyMetric", () => {
  it("normaliza campanha, arredonda inteiros e centavos", () => {
    expect(
      sanitizeDailyMetric({
        date: "05/03/2026",
        campaign: " idc_implante ",
        impressions: 1200.4,
        clicks: 35,
        cost: 123.456,
        conversions: 2.5,
      }),
    ).toEqual({
      date: "2026-03-05",
      campaign: "IDC | Implante Dentário",
      impressions: 1200,
      clicks: 35,
      cost: 123.46,
      conversions: 3,
    });
  });

  it("campos ausentes viram 0", () => {
    expect(sanitizeDailyMetric({ date: "2026-03-05", campaign: "Outra" })).toEqual({
      date: "2026-03-05",
      campaign: "Outra",
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
    });
  });

  it("erros de validação em pt-BR", () => {
    expect(() => sanitizeDailyMetric({ date: "2026-02-30", campaign: "A" })).toThrow(AppError);
    expect(() => sanitizeDailyMetric({ date: "2026-02-30", campaign: "A" })).toThrow(/Data inválida/);
    expect(() => sanitizeDailyMetric({ date: "2026-03-05", campaign: "  " })).toThrow("Informe a campanha.");
    expect(() => sanitizeDailyMetric({ date: "2026-03-05", campaign: "A", cost: -1 })).toThrow(/não pode ser negativo/);
    expect(() => sanitizeDailyMetric({ date: "2026-03-05", campaign: "A", clicks: Number.NaN })).toThrow(/inválido/);
  });
});

describe("dedupeDailyMetrics", () => {
  it("mantém a última ocorrência de mesma data e campanha (sem diferenciar maiúsculas)", () => {
    const rows = [
      { date: "2026-03-05", campaign: "IDC | Implante Dentário", cost: 10 },
      { date: "2026-03-05", campaign: "IDC | Urgência e Canal", cost: 20 },
      { date: "2026-03-05", campaign: "idc | implante dentário ", cost: 30 },
      { date: "2026-03-06", campaign: "IDC | Implante Dentário", cost: 40 },
    ];
    const { rows: unique, duplicates } = dedupeDailyMetrics(rows);
    expect(duplicates).toBe(1);
    expect(unique.map((r) => r.cost)).toEqual([20, 30, 40]);
  });

  it("chave igual à do índice único do banco", () => {
    expect(dailyMetricKey({ date: "2026-03-05", campaign: " IDC | A " })).toBe(dailyMetricKey({ date: "2026-03-05", campaign: "idc | a" }));
  });
});
