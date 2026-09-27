import { describe, expect, it } from "vitest";
import { capitalize, tooltipDayLabel, truncateLabel, weekdayHeading } from "./labels";

describe("weekdayHeading", () => {
  it("dia da semana sem '-feira', com inicial maiúscula", () => {
    expect(weekdayHeading("2026-09-21")).toBe("Segunda, 21/09");
    expect(weekdayHeading("2026-09-23")).toBe("Quarta, 23/09");
    expect(weekdayHeading("2026-09-26")).toBe("Sábado, 26/09");
    expect(weekdayHeading("2026-09-27")).toBe("Domingo, 27/09");
  });

  it("não depende do fuso da máquina (TZ=UTC nos testes)", () => {
    // 01/03 00:00 em Barreiras = 03:00 UTC; o dia continua sendo domingo 01/03
    expect(weekdayHeading("2026-03-01")).toBe("Domingo, 01/03");
  });
});

describe("tooltipDayLabel", () => {
  it("dia abreviado + data completa", () => {
    expect(tooltipDayLabel("2026-09-26")).toBe("sáb, 26/09/2026");
    expect(tooltipDayLabel("2026-09-21")).toBe("seg, 21/09/2026");
  });
});

describe("capitalize", () => {
  it("primeira letra maiúscula", () => {
    expect(capitalize("setembro de 2026")).toBe("Setembro de 2026");
    expect(capitalize("ótimo")).toBe("Ótimo");
    expect(capitalize("")).toBe("");
  });
});

describe("truncateLabel", () => {
  it("mantém textos curtos (sem espaços extras)", () => {
    expect(truncateLabel("  dentista  ", 12)).toBe("dentista");
  });

  it("corta com reticências dentro do limite", () => {
    const out = truncateLabel("implante dentário barreiras", 18);
    expect(out).toBe("implante dentário…");
    expect(out.length).toBeLessThanOrEqual(18);
  });

  it("não remove texto com limite inválido", () => {
    expect(truncateLabel("abc", 1)).toBe("abc");
  });
});
