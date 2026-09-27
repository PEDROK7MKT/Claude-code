import { describe, expect, it } from "vitest";

import { appendAppointmentNote, appointmentNoteLine, canEditAppointment, isSameAppointment } from "./lead-appointment";

// 12/03/2026 09:00 e 13/03/2026 14:30 em Barreiras (GMT-3)
const PREVIOUS = "2026-03-12T12:00:00.000Z";
const NEXT = "2026-03-13T17:30:00.000Z";
const NOW = "2026-03-10T13:15:00.000Z";

describe("lead-appointment", () => {
  it("horário editável só com consulta marcada", () => {
    expect(canEditAppointment("agendado")).toBe(true);
    expect(canEditAppointment("confirmado")).toBe(true);
    expect(canEditAppointment("em_contato")).toBe(false);
    expect(canEditAppointment("compareceu")).toBe(false);
    expect(canEditAppointment("cancelado")).toBe(false);
  });

  it("isSameAppointment compara até o minuto", () => {
    expect(isSameAppointment("2026-03-12T12:00:00.000Z", "2026-03-12T12:00:30Z")).toBe(true);
    expect(isSameAppointment(PREVIOUS, NEXT)).toBe(false);
    expect(isSameAppointment(null, undefined)).toBe(true);
    expect(isSameAppointment(PREVIOUS, null)).toBe(false);
  });

  it("linha da remarcação no fuso de Barreiras", () => {
    expect(appointmentNoteLine({ previous: PREVIOUS, next: NEXT, note: " paciente  pediu à tarde ", now: NOW })).toBe(
      "[10/03/2026 10:15] Consulta remarcada de quinta, 12/03 às 09:00 para sexta, 13/03 às 14:30 — paciente pediu à tarde",
    );
    expect(appointmentNoteLine({ previous: null, next: NEXT, note: "ok", now: NOW })).toBe(
      "[10/03/2026 10:15] Consulta marcada para sexta, 13/03 às 14:30 — ok",
    );
  });

  it("sem observação não altera as notas", () => {
    expect(appointmentNoteLine({ previous: PREVIOUS, next: NEXT, note: "  ", now: NOW })).toBeNull();
    expect(appendAppointmentNote("Notas", { previous: PREVIOUS, next: NEXT, note: null, now: NOW })).toBeNull();
  });

  it("acrescenta ao final das notas existentes", () => {
    const notes = appendAppointmentNote("Prefere manhã\n", { previous: PREVIOUS, next: NEXT, note: "mudou", now: NOW });
    expect(notes).toBe(
      "Prefere manhã\n\n[10/03/2026 10:15] Consulta remarcada de quinta, 12/03 às 09:00 para sexta, 13/03 às 14:30 — mudou",
    );
    expect(appendAppointmentNote(null, { previous: PREVIOUS, next: NEXT, note: "mudou", now: NOW })).toMatch(/^\[10\/03/);
  });
});
