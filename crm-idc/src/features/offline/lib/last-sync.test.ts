import { describe, expect, it } from "vitest";
import { describeLastSync, latestUpdatedAt } from "./last-sync";

// 27/09/2026 14:30 em America/Bahia (UTC-3)
const NOW = Date.parse("2026-09-27T17:30:00Z");
const MIN = 60 * 1000;

describe("describeLastSync", () => {
  it("sem dados salvos", () => {
    expect(describeLastSync(null, NOW)).toBeNull();
    expect(describeLastSync(undefined, NOW)).toBeNull();
    expect(describeLastSync(0, NOW)).toBeNull();
    expect(describeLastSync(Number.NaN, NOW)).toBeNull();
  });

  it("menos de 1 minuto (ou relógio adiantado)", () => {
    expect(describeLastSync(NOW - 20 * 1000, NOW)?.relative).toBe("agora há pouco");
    expect(describeLastSync(NOW + 5 * MIN, NOW)?.relative).toBe("agora há pouco");
  });

  it("minutos", () => {
    expect(describeLastSync(NOW - 5 * MIN, NOW)).toEqual({ relative: "há 5 min", absolute: "27/09/2026 14:25" });
    expect(describeLastSync(NOW - 59 * MIN, NOW)?.relative).toBe("há 59 min");
  });

  it("hoje, no fuso da clínica", () => {
    expect(describeLastSync(Date.parse("2026-09-27T11:05:00Z"), NOW)?.relative).toBe("hoje às 08:05");
    // 03:10 UTC = 00:10 na Bahia: ainda é "hoje"
    expect(describeLastSync(Date.parse("2026-09-27T03:10:00Z"), NOW)?.relative).toBe("hoje às 00:10");
  });

  it("ontem", () => {
    // 02:50 UTC de 27/09 = 23:50 de 26/09 na Bahia
    expect(describeLastSync(Date.parse("2026-09-27T02:50:00Z"), NOW)).toEqual({
      relative: "ontem às 23:50",
      absolute: "26/09/2026 23:50",
    });
  });

  it("dias anteriores: data dd/MM/yyyy", () => {
    expect(describeLastSync(Date.parse("2026-09-20T15:00:00Z"), NOW)).toEqual({
      relative: "em 20/09/2026",
      absolute: "20/09/2026 12:00",
    });
  });
});

describe("latestUpdatedAt", () => {
  it("maior timestamp válido", () => {
    expect(latestUpdatedAt([10, 30, 20])).toBe(30);
    expect(latestUpdatedAt([])).toBe(0);
    expect(latestUpdatedAt([0, Number.NaN, 5])).toBe(5);
  });
});
