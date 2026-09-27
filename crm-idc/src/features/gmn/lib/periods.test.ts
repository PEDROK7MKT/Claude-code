import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  detectPreset,
  findExactPeriod,
  findOverlappingPeriods,
  findPreviousRow,
  formatPeriod,
  formatPeriodShort,
  lastMonthRange,
  lastWeekRange,
  periodLengthDays,
  presetRange,
  rangesOverlap,
  suggestDefaultPeriod,
} from "./periods";

// domingo, 27/09/2026 10:00 em Barreiras (13:00 UTC)
const NOW = "2026-09-27T13:00:00Z";

const rows = [
  { id: "ago", period_start: "2026-08-01", period_end: "2026-08-31" },
  { id: "jul", period_start: "2026-07-01", period_end: "2026-07-31" },
  { id: "sem", period_start: "2026-08-24", period_end: "2026-08-30" },
];

describe("aritmética de datas-calendário", () => {
  it("soma dias atravessando meses/anos e conta a duração inclusiva", () => {
    expect(addDaysToKey("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysToKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(periodLengthDays("2026-08-01", "2026-08-31")).toBe(31);
    expect(periodLengthDays("2026-09-14", "2026-09-14")).toBe(1);
  });
});

describe("atalhos de período", () => {
  it("semana passada = segunda a domingo anteriores à semana corrente", () => {
    expect(lastWeekRange(NOW)).toEqual({ from: "2026-09-14", to: "2026-09-20" });
    // segunda-feira 28/09 → semana passada é 21–27/09
    expect(lastWeekRange("2026-09-28T12:00:00Z")).toEqual({ from: "2026-09-21", to: "2026-09-27" });
  });

  it("usa o fuso da clínica: 01:00 UTC de segunda ainda é domingo em Barreiras", () => {
    expect(lastWeekRange("2026-09-28T01:00:00Z")).toEqual({ from: "2026-09-14", to: "2026-09-20" });
  });

  it("mês passado completo, inclusive na virada do ano e em fevereiro", () => {
    expect(lastMonthRange(NOW)).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    expect(lastMonthRange("2026-01-15T12:00:00Z")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(lastMonthRange("2028-03-10T12:00:00Z")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(presetRange("last-month", NOW)).toEqual(lastMonthRange(NOW));
  });

  it("detecta o atalho correspondente ao intervalo", () => {
    expect(detectPreset(null, NOW)).toBeNull();
    expect(detectPreset({ from: "2026-09-14", to: "2026-09-20" }, NOW)).toBe("last-week");
    expect(detectPreset({ from: "2026-08-01", to: "2026-08-31" }, NOW)).toBe("last-month");
    expect(detectPreset({ from: "2026-08-02", to: "2026-08-31" }, NOW)).toBe("custom");
  });
});

describe("sobreposição", () => {
  it("intervalos inclusivos que se tocam em um dia se sobrepõem", () => {
    expect(rangesOverlap({ from: "2026-08-01", to: "2026-08-31" }, { from: "2026-08-31", to: "2026-09-06" })).toBe(true);
    expect(rangesOverlap({ from: "2026-08-01", to: "2026-08-31" }, { from: "2026-09-01", to: "2026-09-30" })).toBe(false);
  });

  it("lista registros sobrepostos ignorando o que está em edição", () => {
    const range = { from: "2026-08-15", to: "2026-09-14" };
    expect(findOverlappingPeriods(range, rows).map((r) => r.id)).toEqual(["ago", "sem"]);
    expect(findOverlappingPeriods(range, rows, "ago").map((r) => r.id)).toEqual(["sem"]);
    expect(findOverlappingPeriods({ from: "2026-09-01", to: "2026-09-30" }, rows)).toEqual([]);
  });

  it("encontra período idêntico", () => {
    expect(findExactPeriod({ from: "2026-08-01", to: "2026-08-31" }, rows)?.id).toBe("ago");
    expect(findExactPeriod({ from: "2026-08-01", to: "2026-08-31" }, rows, "ago")).toBeNull();
  });
});

describe("registro anterior e sugestão", () => {
  it("registro anterior é o mais recente que termina antes do início", () => {
    expect(findPreviousRow({ from: "2026-09-01", to: "2026-09-30" }, rows)?.id).toBe("ago");
    expect(findPreviousRow({ from: "2026-08-01", to: "2026-08-31" }, rows)?.id).toBe("jul");
    expect(findPreviousRow({ from: "2026-07-01", to: "2026-07-31" }, rows)).toBeNull();
  });

  it("sugere o mês passado, ou a semana passada se o último registro é semanal", () => {
    expect(suggestDefaultPeriod([], NOW)).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    // agosto já registrado → sem sugestão
    expect(suggestDefaultPeriod(rows.slice(0, 2), NOW)).toBeNull();
    const weekly = [{ id: "w", period_start: "2026-09-07", period_end: "2026-09-13" }];
    expect(suggestDefaultPeriod(weekly, NOW)).toEqual({ from: "2026-09-14", to: "2026-09-20" });
  });
});

describe("rótulos", () => {
  it("formata o período completo e curto", () => {
    expect(formatPeriod("2026-08-01", "2026-08-31")).toBe("01/08/2026 – 31/08/2026");
    expect(formatPeriod("2026-08-01", "2026-08-01")).toBe("01/08/2026");
    expect(formatPeriodShort("2026-08-01", "2026-08-31")).toBe("01/08 – 31/08/2026");
    expect(formatPeriodShort("2025-12-29", "2026-01-04")).toBe("29/12/2025 – 04/01/2026");
  });
});
