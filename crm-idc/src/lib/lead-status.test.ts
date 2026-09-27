import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, STATUS_META, STATUS_TRANSITIONS } from "@/lib/constants";
import {
  allowedTransitions,
  canTransition,
  isLeadStatus,
  isScheduledStatus,
  requiresConfirmation,
  requiresSchedule,
  statusLabel,
  statusTitle,
  transitionErrorMessage,
} from "@/lib/lead-status";
import type { LeadStatus } from "@/types/database";

/** Spec §10, regra 2 — fluxo permitido (copiado literalmente da especificação). */
const SPEC_ALLOWED: Record<LeadStatus, LeadStatus[]> = {
  novo: ["em_contato", "perdido"],
  em_contato: ["agendado", "perdido", "cancelado"],
  agendado: ["confirmado", "cancelado", "perdido"],
  confirmado: ["compareceu", "nao_compareceu", "cancelado"],
  nao_compareceu: ["agendado"],
  cancelado: ["agendado"],
  perdido: ["em_contato"],
  compareceu: [],
};

const ALL_PAIRS = LEAD_STATUSES.flatMap((from) => LEAD_STATUSES.map((to) => [from, to] as const));

describe("canTransition — matriz completa da regra 2", () => {
  it.each(ALL_PAIRS)("%s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(SPEC_ALLOWED[from].includes(to));
  });

  it("STATUS_TRANSITIONS espelha exatamente a spec", () => {
    for (const status of LEAD_STATUSES) {
      expect([...STATUS_TRANSITIONS[status]].sort()).toEqual([...SPEC_ALLOWED[status]].sort());
    }
  });

  it("mesmo status nunca é transição", () => {
    for (const status of LEAD_STATUSES) expect(canTransition(status, status)).toBe(false);
  });

  it("nenhum status volta para novo (regra 1: só na criação)", () => {
    for (const status of LEAD_STATUSES) expect(canTransition(status, "novo")).toBe(false);
  });

  it("compareceu é final", () => {
    expect(allowedTransitions("compareceu")).toEqual([]);
  });

  it("reagendar a partir de não compareceu e cancelado; reativar perdido", () => {
    expect(canTransition("nao_compareceu", "agendado")).toBe(true);
    expect(canTransition("cancelado", "agendado")).toBe(true);
    expect(canTransition("perdido", "em_contato")).toBe(true);
    expect(canTransition("perdido", "agendado")).toBe(false);
  });

  it("não pula etapas do funil", () => {
    expect(canTransition("novo", "agendado")).toBe(false);
    expect(canTransition("em_contato", "confirmado")).toBe(false);
    expect(canTransition("agendado", "compareceu")).toBe(false);
    expect(canTransition("agendado", "nao_compareceu")).toBe(false);
  });
});

describe("regras auxiliares", () => {
  it("requiresSchedule só para agendado (regra 3)", () => {
    for (const status of LEAD_STATUSES) expect(requiresSchedule(status)).toBe(status === "agendado");
  });

  it("requiresConfirmation para perdido e cancelado", () => {
    for (const status of LEAD_STATUSES) {
      expect(requiresConfirmation(status)).toBe(status === "perdido" || status === "cancelado");
    }
  });

  it("isScheduledStatus: agendado, confirmado, compareceu (KPIs)", () => {
    const scheduled = LEAD_STATUSES.filter(isScheduledStatus);
    expect(scheduled).toEqual(["agendado", "confirmado", "compareceu"]);
  });

  it("isLeadStatus", () => {
    for (const status of LEAD_STATUSES) expect(isLeadStatus(status)).toBe(true);
    expect(isLeadStatus("NOVO")).toBe(false);
    expect(isLeadStatus("")).toBe(false);
    expect(isLeadStatus(null)).toBe(false);
    expect(isLeadStatus(1)).toBe(false);
  });

  it("rótulos", () => {
    expect(statusLabel("nao_compareceu")).toBe("não compareceu");
    expect(statusTitle("em_contato")).toBe("Em contato");
    expect(statusLabel(null)).toBe("—");
    expect(statusTitle(undefined)).toBe("—");
    for (const status of LEAD_STATUSES) {
      expect(STATUS_META[status].label).toBe(STATUS_META[status].label.toLowerCase());
      expect(STATUS_META[status].color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe("transitionErrorMessage", () => {
  it("lista os destinos permitidos", () => {
    expect(transitionErrorMessage("novo", "agendado")).toBe(
      'Não é possível mover de "novo" para "agendado". A partir de "novo" é permitido: "em contato", "perdido".',
    );
  });

  it("explica que compareceu é final", () => {
    expect(transitionErrorMessage("compareceu", "cancelado")).toBe(
      'Não é possível mover de "compareceu" para "cancelado". Leads com status "compareceu" são finais.',
    );
  });

  it("usa rótulos amigáveis", () => {
    expect(transitionErrorMessage("confirmado", "novo")).toContain('"não compareceu"');
  });
});
