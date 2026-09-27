import { describe, expect, it } from "vitest";
import type { LeadStatus } from "@/types/database";
import {
  attendanceLevel,
  countWaitingByLevel,
  getDentistDashboardRanges,
  groupAppointmentsByDay,
  isAwaitingAttendance,
  sortWaitingLeads,
  summarizeAttendance,
  summarizeNewLeads,
  WAITING_CRITICAL_MS,
  WAITING_WARNING_MS,
  waitingLevel,
} from "./dentist-dashboard";

// Quinta-feira, 24/09/2026 12:00 em Barreiras (15:00 UTC)
const NOW = "2026-09-24T15:00:00Z";

interface Appt {
  id: string;
  scheduled_at: string | null;
  status: LeadStatus;
}

function appt(id: string, scheduled_at: string | null, status: LeadStatus = "agendado"): Appt {
  return { id, scheduled_at, status };
}

describe("getDentistDashboardRanges", () => {
  it("hoje, ontem, semana (seg–dom) e mês no fuso da clínica", () => {
    const r = getDentistDashboardRanges(NOW);
    expect(r.today.fromKey).toBe("2026-09-24");
    expect(r.yesterday.fromKey).toBe("2026-09-23");
    expect(r.week.fromKey).toBe("2026-09-21");
    expect(r.week.toKey).toBe("2026-09-27");
    expect(r.month.fromKey).toBe("2026-09-01");
    expect(r.month.toKey).toBe("2026-09-30");
    expect(r.recentQuery).toEqual({
      createdFrom: "2026-09-23T03:00:00.000Z",
      createdTo: "2026-09-25T03:00:00.000Z",
    });
    expect(r.appointmentsQuery).toEqual({
      scheduledFrom: "2026-09-01T03:00:00.000Z",
      scheduledTo: "2026-10-01T03:00:00.000Z",
    });
  });

  it("semana que cruza o mês amplia a consulta de consultas", () => {
    const r = getDentistDashboardRanges("2026-09-30T15:00:00Z"); // quarta
    expect(r.week.fromKey).toBe("2026-09-28");
    expect(r.week.toKey).toBe("2026-10-04");
    expect(r.appointmentsQuery).toEqual({
      scheduledFrom: "2026-09-01T03:00:00.000Z",
      scheduledTo: "2026-10-05T03:00:00.000Z",
    });
  });

  it("domingo à noite ainda é a mesma semana", () => {
    const r = getDentistDashboardRanges("2026-09-28T02:30:00Z"); // dom 27/09 23:30
    expect(r.week.fromKey).toBe("2026-09-21");
    expect(r.today.fromKey).toBe("2026-09-27");
  });
});

describe("summarizeNewLeads", () => {
  const ranges = getDentistDashboardRanges(NOW);

  it("conta hoje × ontem e quantos de hoje seguem em novo", () => {
    const s = summarizeNewLeads(
      [
        { created_at: "2026-09-24T03:00:00Z", status: "novo" },
        { created_at: "2026-09-24T14:00:00Z", status: "em_contato" },
        { created_at: "2026-09-24T14:30:00Z", status: "novo" },
        { created_at: "2026-09-24T02:59:59Z", status: "novo" }, // 23/09 23:59
        { created_at: "2026-09-23T12:00:00Z", status: "agendado" },
      ],
      ranges,
    );
    expect(s).toEqual({ today: 3, yesterday: 2, change: 50, stillNew: 2 });
  });

  it("sem leads ontem → sem base de comparação", () => {
    const s = summarizeNewLeads([{ created_at: "2026-09-24T14:00:00Z", status: "novo" }], ranges);
    expect(s.change).toBeNull();
    expect(summarizeNewLeads([], ranges)).toEqual({ today: 0, yesterday: 0, change: 0, stillNew: 0 });
  });
});

describe("groupAppointmentsByDay", () => {
  const { week } = getDentistDashboardRanges(NOW);

  it("agrupa por dia (Bahia), em ordem, só agendado/confirmado", () => {
    const days = groupAppointmentsByDay(
      [
        appt("c", "2026-09-24T18:00:00Z", "confirmado"), // qui 15:00
        appt("a", "2026-09-22T02:30:00Z"), // seg 21/09 23:30 Bahia
        appt("b", "2026-09-24T12:00:00Z"), // qui 09:00
        appt("x", "2026-09-24T13:00:00Z", "cancelado"),
        appt("y", "2026-09-23T13:00:00Z", "compareceu"),
        appt("z", "2026-09-28T13:00:00Z"), // próxima semana
        appt("n", null),
      ],
      week,
      NOW,
    );
    expect(days.map((d) => [d.dateKey, d.heading, d.isToday, d.isPast, d.items.map((i) => i.id)])).toEqual([
      ["2026-09-21", "Segunda, 21/09", false, true, ["a"]],
      ["2026-09-24", "Quinta, 24/09", true, false, ["b", "c"]],
    ]);
  });

  it("aceita outros status", () => {
    const days = groupAppointmentsByDay([appt("y", "2026-09-23T13:00:00Z", "compareceu")], week, NOW, ["compareceu"]);
    expect(days).toHaveLength(1);
    expect(groupAppointmentsByDay([], week, NOW)).toEqual([]);
  });
});

describe("isAwaitingAttendance", () => {
  it("horário passado ainda agendado/confirmado", () => {
    expect(isAwaitingAttendance(appt("a", "2026-09-24T12:00:00Z"), NOW)).toBe(true);
    expect(isAwaitingAttendance(appt("a", "2026-09-24T12:00:00Z", "confirmado"), NOW)).toBe(true);
    expect(isAwaitingAttendance(appt("a", "2026-09-24T18:00:00Z"), NOW)).toBe(false);
    expect(isAwaitingAttendance(appt("a", "2026-09-24T12:00:00Z", "compareceu"), NOW)).toBe(false);
    expect(isAwaitingAttendance(appt("a", null), NOW)).toBe(false);
  });
});

describe("summarizeAttendance", () => {
  const { month } = getDentistDashboardRanges(NOW);

  it("taxa = compareceu / (compareceu + não compareceu), com pendências separadas", () => {
    const s = summarizeAttendance(
      [
        appt("1", "2026-09-02T12:00:00Z", "compareceu"),
        appt("2", "2026-09-03T12:00:00Z", "compareceu"),
        appt("3", "2026-09-04T12:00:00Z", "compareceu"),
        appt("4", "2026-09-05T12:00:00Z", "nao_compareceu"),
        appt("5", "2026-09-20T12:00:00Z", "confirmado"), // passou, sem registro
        appt("6", "2026-09-29T12:00:00Z", "agendado"), // futura
        appt("7", "2026-09-10T12:00:00Z", "cancelado"), // ignorada
        appt("8", "2026-08-31T12:00:00Z", "compareceu"), // outro mês
      ],
      month,
      NOW,
    );
    expect(s).toEqual({ attended: 3, missed: 1, awaiting: 1, upcoming: 1, rate: 75, total: 6 });
  });

  it("sem consultas finalizadas → taxa null", () => {
    const s = summarizeAttendance([appt("6", "2026-09-29T12:00:00Z")], month, NOW);
    expect(s.rate).toBeNull();
    expect(s.upcoming).toBe(1);
  });
});

describe("attendanceLevel", () => {
  it("faixas da taxa", () => {
    expect(attendanceLevel(null)).toBe("none");
    expect(attendanceLevel(Number.NaN)).toBe("none");
    expect(attendanceLevel(100)).toBe("good");
    expect(attendanceLevel(80)).toBe("good");
    expect(attendanceLevel(79.9)).toBe("fair");
    expect(attendanceLevel(60)).toBe("fair");
    expect(attendanceLevel(59)).toBe("poor");
  });
});

describe("waitingLevel", () => {
  const now = Date.parse(NOW);

  it("até 2 h ok, mais de 2 h âmbar, mais de 24 h vermelho", () => {
    expect(waitingLevel(now - 60_000, now)).toBe("ok");
    expect(waitingLevel(now - WAITING_WARNING_MS, now)).toBe("ok");
    expect(waitingLevel(now - WAITING_WARNING_MS - 1, now)).toBe("warning");
    expect(waitingLevel(now - WAITING_CRITICAL_MS, now)).toBe("warning");
    expect(waitingLevel(new Date(now - WAITING_CRITICAL_MS - 1).toISOString(), now)).toBe("critical");
  });

  it("conta a fila por nível", () => {
    const counts = countWaitingByLevel(
      [
        { created_at: new Date(now - 30 * 60_000).toISOString() },
        { created_at: new Date(now - 3 * 3_600_000).toISOString() },
        { created_at: new Date(now - 30 * 3_600_000).toISOString() },
        { created_at: new Date(now - 48 * 3_600_000).toISOString() },
      ],
      now,
    );
    expect(counts).toEqual({ ok: 1, warning: 1, critical: 2 });
  });
});

describe("sortWaitingLeads", () => {
  it("só status novo, do mais antigo para o mais recente", () => {
    const sorted = sortWaitingLeads([
      { id: "b", status: "novo" as LeadStatus, created_at: "2026-09-24T10:00:00Z" },
      { id: "c", status: "em_contato" as LeadStatus, created_at: "2026-09-20T10:00:00Z" },
      { id: "a", status: "novo" as LeadStatus, created_at: "2026-09-23T10:00:00Z" },
      { id: "d", status: "novo" as LeadStatus, created_at: "2026-09-24T10:00:00Z" },
    ]);
    expect(sorted.map((l) => l.id)).toEqual(["a", "b", "d"]);
  });
});
