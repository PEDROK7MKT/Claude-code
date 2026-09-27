import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bahiaLocalToIso,
  currentMonthKey,
  eachDateKey,
  formatAppointment,
  formatDate,
  formatDateKey,
  formatDateTime,
  formatMonthYear,
  formatRelative,
  formatTime,
  getCurrentWeekRange,
  getMonthRange,
  getPeriodRanges,
  nowBahia,
  startOfDateKey,
  toBahia,
  toDateKey,
  todayKey,
  type DateRange,
} from "@/lib/dates";

/** Serializa um DateRange para comparar com strings ISO. */
function iso(range: DateRange) {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    fromKey: range.fromKey,
    toKey: range.toKey,
  };
}

describe("toDateKey / toBahia (fuso America/Bahia, UTC-3)", () => {
  it("usa a data-calendário de Barreiras, não a UTC", () => {
    expect(toDateKey("2026-03-02T01:30:00Z")).toBe("2026-03-01");
    expect(toDateKey("2026-03-02T02:59:59.999Z")).toBe("2026-03-01");
    expect(toDateKey("2026-03-02T03:00:00.000Z")).toBe("2026-03-02");
  });

  it("vira o ano à meia-noite local", () => {
    expect(toDateKey("2027-01-01T02:59:59Z")).toBe("2026-12-31");
    expect(toDateKey("2027-01-01T03:00:00Z")).toBe("2027-01-01");
  });

  it("aceita Date e timestamp numérico", () => {
    const d = new Date("2026-06-15T02:00:00Z");
    expect(toDateKey(d)).toBe("2026-06-14");
    expect(toDateKey(d.getTime())).toBe("2026-06-14");
  });

  it("toBahia expõe hora local e preserva o instante", () => {
    const d = toBahia("2026-03-10T17:30:00Z");
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
    expect(d.getTime()).toBe(Date.parse("2026-03-10T17:30:00Z"));
  });

  it("nowBahia está no fuso da clínica", () => {
    expect(nowBahia().timeZone).toBe("America/Bahia");
  });

  it("todayKey usa o fuso da clínica", () => {
    expect(todayKey("2026-04-01T02:59:59Z")).toBe("2026-03-31");
    expect(todayKey("2026-04-01T03:00:00Z")).toBe("2026-04-01");
  });
});

describe("formatação", () => {
  it("formatDate / formatDateTime / formatTime", () => {
    expect(formatDate("2026-03-02T01:30:00Z")).toBe("01/03/2026");
    expect(formatDateTime("2026-03-10T17:30:00.000Z")).toBe("10/03/2026 14:30");
    expect(formatDateTime("2026-03-11T02:15:00Z")).toBe("10/03/2026 23:15");
    expect(formatTime("2026-03-10T03:05:00Z")).toBe("00:05");
  });

  it("retorna — para vazio/nulo", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
    expect(formatTime("")).toBe("—");
    expect(formatAppointment(null)).toBe("—");
    expect(formatRelative(null)).toBe("—");
  });

  it("formatDateKey não converte fuso (colunas DATE)", () => {
    expect(formatDateKey("2026-03-05")).toBe("05/03/2026");
    expect(formatDateKey("2026-12-31T00:00:00")).toBe("31/12/2026");
    expect(formatDateKey(null)).toBe("—");
    expect(formatDateKey("")).toBe("—");
  });

  it("formatAppointment e formatMonthYear em pt-BR", () => {
    expect(formatAppointment("2026-03-10T17:30:00Z")).toBe("terça, 10/03 às 14:30");
    expect(formatMonthYear("2026-03-15T12:00:00Z")).toBe("março de 2026");
    // 1º de abril 01:00 UTC ainda é março em Barreiras
    expect(formatMonthYear("2026-04-01T01:00:00Z")).toBe("março de 2026");
  });

  describe("formatRelative", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("descreve o tempo decorrido", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
      expect(formatRelative("2026-03-10T10:00:00Z")).toBe("há 2 horas");
      expect(formatRelative("2026-03-07T12:00:00Z")).toBe("há 3 dias");
    });
  });
});

describe("bahiaLocalToIso / startOfDateKey", () => {
  it("converte data+hora digitadas em Barreiras para UTC", () => {
    expect(bahiaLocalToIso("2026-03-10", "14:30")).toBe("2026-03-10T17:30:00.000Z");
    expect(bahiaLocalToIso("2026-03-10")).toBe("2026-03-10T03:00:00.000Z");
  });

  it("horário noturno cai no dia seguinte em UTC", () => {
    expect(bahiaLocalToIso("2026-12-31", "23:30")).toBe("2027-01-01T02:30:00.000Z");
  });

  it("ida e volta preserva a data-calendário", () => {
    for (const key of ["2026-01-01", "2026-02-28", "2028-02-29", "2026-12-31"]) {
      expect(toDateKey(bahiaLocalToIso(key, "00:00"))).toBe(key);
      expect(toDateKey(bahiaLocalToIso(key, "23:59"))).toBe(key);
    }
  });

  it("startOfDateKey é 00:00 de Barreiras (03:00 UTC)", () => {
    expect(startOfDateKey("2026-03-01").toISOString()).toBe("2026-03-01T03:00:00.000Z");
  });
});

describe("eachDateKey", () => {
  it("é inclusivo e atravessa o fim do mês", () => {
    expect(eachDateKey("2026-02-27", "2026-03-02")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("inclui 29/02 em ano bissexto", () => {
    expect(eachDateKey("2028-02-28", "2028-03-01")).toEqual(["2028-02-28", "2028-02-29", "2028-03-01"]);
  });

  it("um único dia e intervalo invertido", () => {
    expect(eachDateKey("2026-03-05", "2026-03-05")).toEqual(["2026-03-05"]);
    expect(eachDateKey("2026-03-06", "2026-03-05")).toEqual([]);
  });

  it("atravessa o ano", () => {
    expect(eachDateKey("2026-12-30", "2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  });
});

describe("getPeriodRanges", () => {
  // domingo, 15/03/2026 12:00 em Barreiras
  const NOW = "2026-03-15T15:00:00Z";

  it("today: hoje × ontem", () => {
    const r = getPeriodRanges("today", NOW);
    expect(r.label).toBe("Hoje");
    expect(iso(r.current)).toEqual({
      from: "2026-03-15T03:00:00.000Z",
      to: "2026-03-16T03:00:00.000Z",
      fromKey: "2026-03-15",
      toKey: "2026-03-15",
    });
    expect(iso(r.previous)).toEqual({
      from: "2026-03-14T03:00:00.000Z",
      to: "2026-03-15T03:00:00.000Z",
      fromKey: "2026-03-14",
      toKey: "2026-03-14",
    });
  });

  it("7d: 7 dias incluindo hoje × 7 dias antes", () => {
    const r = getPeriodRanges("7d", NOW);
    expect(iso(r.current)).toMatchObject({ fromKey: "2026-03-09", toKey: "2026-03-15" });
    expect(iso(r.previous)).toMatchObject({ fromKey: "2026-03-02", toKey: "2026-03-08" });
    expect(r.previous.to.getTime()).toBe(r.current.from.getTime());
  });

  it("30d atravessa meses", () => {
    const r = getPeriodRanges("30d", NOW);
    expect(iso(r.current)).toEqual({
      from: "2026-02-14T03:00:00.000Z",
      to: "2026-03-16T03:00:00.000Z",
      fromKey: "2026-02-14",
      toKey: "2026-03-15",
    });
    expect(iso(r.previous)).toMatchObject({ fromKey: "2026-01-15", toKey: "2026-02-13" });
  });

  it("períodos atual e anterior têm a mesma duração (today/7d/30d)", () => {
    for (const period of ["today", "7d", "30d"] as const) {
      const r = getPeriodRanges(period, NOW);
      const current = r.current.to.getTime() - r.current.from.getTime();
      const previous = r.previous.to.getTime() - r.previous.from.getTime();
      expect(previous).toBe(current);
      expect(eachDateKey(r.current.fromKey, r.current.toKey)).toHaveLength(period === "today" ? 1 : period === "7d" ? 7 : 30);
    }
  });

  it("month: do dia 1 até hoje × mesmo trecho do mês anterior", () => {
    const r = getPeriodRanges("month", NOW);
    expect(r.label).toBe("Mês atual");
    expect(iso(r.current)).toEqual({
      from: "2026-03-01T03:00:00.000Z",
      to: "2026-03-16T03:00:00.000Z",
      fromKey: "2026-03-01",
      toKey: "2026-03-15",
    });
    expect(iso(r.previous)).toEqual({
      from: "2026-02-01T03:00:00.000Z",
      to: "2026-02-16T03:00:00.000Z",
      fromKey: "2026-02-01",
      toKey: "2026-02-15",
    });
  });

  it("month no dia 31: mês anterior mais curto é limitado ao seu último dia", () => {
    const r = getPeriodRanges("month", "2026-03-31T12:00:00Z");
    expect(iso(r.current)).toMatchObject({ fromKey: "2026-03-01", toKey: "2026-03-31" });
    expect(iso(r.previous)).toEqual({
      from: "2026-02-01T03:00:00.000Z",
      to: "2026-03-01T03:00:00.000Z",
      fromKey: "2026-02-01",
      toKey: "2026-02-28",
    });
  });

  it("month em 29/03 de ano não bissexto e em 31/05", () => {
    expect(iso(getPeriodRanges("month", "2026-03-29T12:00:00Z").previous)).toMatchObject({
      fromKey: "2026-02-01",
      toKey: "2026-02-28",
    });
    expect(iso(getPeriodRanges("month", "2026-05-31T12:00:00Z").previous)).toMatchObject({
      fromKey: "2026-04-01",
      toKey: "2026-04-30",
    });
  });

  it("month em janeiro compara com dezembro do ano anterior", () => {
    const r = getPeriodRanges("month", "2026-01-15T12:00:00Z");
    expect(iso(r.current)).toMatchObject({ fromKey: "2026-01-01", toKey: "2026-01-15" });
    expect(iso(r.previous)).toMatchObject({ fromKey: "2025-12-01", toKey: "2025-12-15" });
  });

  it("borda da meia-noite: 02:30 UTC de 01/03 ainda é 28/02 em Barreiras", () => {
    const today = getPeriodRanges("today", "2026-03-01T02:30:00Z");
    expect(iso(today.current)).toMatchObject({ fromKey: "2026-02-28", toKey: "2026-02-28" });
    const month = getPeriodRanges("month", "2026-03-01T02:30:00Z");
    expect(iso(month.current)).toEqual({
      from: "2026-02-01T03:00:00.000Z",
      to: "2026-03-01T03:00:00.000Z",
      fromKey: "2026-02-01",
      toKey: "2026-02-28",
    });
    expect(iso(month.previous)).toMatchObject({ fromKey: "2026-01-01", toKey: "2026-01-28" });
  });

  it("borda da meia-noite: 03:00 UTC de 01/03 já é março", () => {
    const month = getPeriodRanges("month", "2026-03-01T03:00:00Z");
    expect(iso(month.current)).toMatchObject({ fromKey: "2026-03-01", toKey: "2026-03-01" });
    expect(iso(month.previous)).toMatchObject({ fromKey: "2026-02-01", toKey: "2026-02-01" });
  });

  it("7d atravessando o início do mês", () => {
    const r = getPeriodRanges("7d", "2026-03-03T12:00:00Z");
    expect(iso(r.current)).toMatchObject({ fromKey: "2026-02-25", toKey: "2026-03-03" });
  });
});

describe("getMonthRange", () => {
  it("fevereiro comum e bissexto", () => {
    expect(iso(getMonthRange("2026-02"))).toEqual({
      from: "2026-02-01T03:00:00.000Z",
      to: "2026-03-01T03:00:00.000Z",
      fromKey: "2026-02-01",
      toKey: "2026-02-28",
    });
    expect(getMonthRange("2028-02").toKey).toBe("2028-02-29");
  });

  it("dezembro termina no início de janeiro do ano seguinte", () => {
    expect(iso(getMonthRange("2026-12"))).toEqual({
      from: "2026-12-01T03:00:00.000Z",
      to: "2027-01-01T03:00:00.000Z",
      fromKey: "2026-12-01",
      toKey: "2026-12-31",
    });
  });
});

describe("getCurrentWeekRange (segunda a domingo)", () => {
  it("domingo pertence à semana iniciada na segunda anterior", () => {
    expect(iso(getCurrentWeekRange("2026-03-15T15:00:00Z"))).toEqual({
      from: "2026-03-09T03:00:00.000Z",
      to: "2026-03-16T03:00:00.000Z",
      fromKey: "2026-03-09",
      toKey: "2026-03-15",
    });
  });

  it("domingo 23:30 em Barreiras (segunda em UTC) ainda é a mesma semana", () => {
    expect(getCurrentWeekRange("2026-03-16T02:30:00Z").fromKey).toBe("2026-03-09");
  });

  it("segunda 00:00 em Barreiras inicia nova semana", () => {
    expect(iso(getCurrentWeekRange("2026-03-16T03:00:00Z"))).toMatchObject({ fromKey: "2026-03-16", toKey: "2026-03-22" });
  });
});

describe("currentMonthKey", () => {
  it("usa o mês de Barreiras", () => {
    expect(currentMonthKey("2026-04-01T02:59:59Z")).toBe("2026-03");
    expect(currentMonthKey("2026-04-01T03:00:00Z")).toBe("2026-04");
  });
});
