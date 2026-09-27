import { test } from "vitest";
import { formatAppointment, formatRelative, formatDateTime } from "@/lib/dates";
test("x", () => {
  console.log(formatAppointment("2026-09-29T17:30:00Z"), "|", formatAppointment("2026-09-27T12:00:00Z"), "|", formatDateTime("2026-09-27T12:00:00Z"), "|", formatRelative(Date.now() - 3600_000));
});
