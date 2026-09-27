import { describe, expect, it } from "vitest";

import { LEAD_STATUSES } from "@/lib/constants";
import { allowedTransitions } from "@/lib/lead-status";
import type { LeadStatus } from "@/types/database";

import {
  defaultScheduleIso,
  describeAllowedTransitions,
  getConfirmCopy,
  getQuickActions,
  getScheduleCopy,
  getStatusAction,
  getStatusChangeOptions,
  isPastSchedule,
  nextBusinessDayKey,
  statusActionLabel,
  statusChangeFlow,
  unavailableActionReason,
} from "./status-actions";

const lead = (status: LeadStatus, scheduled_at: string | null = null) => ({ name: "Maria Silva", status, scheduled_at });

describe("statusChangeFlow", () => {
  it("agendado pede data, perdido/cancelado pedem confirmação, o resto é direto", () => {
    expect(statusChangeFlow("agendado")).toBe("schedule");
    expect(statusChangeFlow("perdido")).toBe("confirm");
    expect(statusChangeFlow("cancelado")).toBe("confirm");
    for (const status of ["em_contato", "confirmado", "compareceu", "nao_compareceu"] as const) {
      expect(statusChangeFlow(status)).toBe("immediate");
    }
  });
});

describe("statusActionLabel", () => {
  it("usa verbos contextuais", () => {
    expect(statusActionLabel("novo", "em_contato")).toBe("Em contato");
    expect(statusActionLabel("perdido", "em_contato")).toBe("Reativar");
    expect(statusActionLabel("em_contato", "agendado")).toBe("Marcar como agendado");
    expect(statusActionLabel("nao_compareceu", "agendado")).toBe("Reagendar");
    expect(statusActionLabel("cancelado", "agendado")).toBe("Reagendar");
    expect(statusActionLabel("agendado", "confirmado")).toBe("Confirmar presença");
    expect(statusActionLabel("agendado", "cancelado")).toBe("Cancelar agendamento");
    expect(statusActionLabel("confirmado", "cancelado")).toBe("Cancelar agendamento");
    expect(statusActionLabel("em_contato", "cancelado")).toBe("Marcar como cancelado");
    expect(statusActionLabel("novo", "perdido")).toBe("Marcar como perdido");
  });
});

describe("getStatusAction", () => {
  it("marca o próximo passo recomendado como primário", () => {
    const action = getStatusAction("agendado", "confirmado");
    expect(action).toMatchObject({ allowed: true, recommended: true, tone: "primary", disabledReason: null });
  });

  it("ações de confirmação são 'danger'", () => {
    expect(getStatusAction("agendado", "perdido").tone).toBe("danger");
  });

  it("explica por que a ação está indisponível", () => {
    const action = getStatusAction("novo", "compareceu");
    expect(action.allowed).toBe(false);
    expect(action.disabledReason).toBe('Indisponível para leads "novo". Próximas etapas: "em contato" ou "perdido".');
  });
});

describe("unavailableActionReason", () => {
  it("status final", () => {
    expect(unavailableActionReason("compareceu", "perdido")).toBe(
      'Leads "compareceu" não mudam mais de status (status final).',
    );
  });

  it("mesmo status", () => {
    expect(unavailableActionReason("agendado", "agendado")).toBe('O lead já está como "agendado".');
  });

  it("null quando permitido", () => {
    expect(unavailableActionReason("confirmado", "nao_compareceu")).toBeNull();
  });
});

describe("describeAllowedTransitions", () => {
  it("lista as próximas etapas", () => {
    expect(describeAllowedTransitions("agendado")).toBe(
      'Próximas etapas a partir de "agendado": "confirmado", "cancelado" ou "perdido".',
    );
    expect(describeAllowedTransitions("compareceu")).toBe('"compareceu" é um status final: não há próximas etapas.');
  });
});

describe("getQuickActions", () => {
  it("buttons: ações principais sempre presentes + contextuais válidas", () => {
    const actions = getQuickActions("novo", "buttons");
    expect(actions.map((a) => a.to)).toEqual(["em_contato", "agendado", "compareceu", "nao_compareceu", "perdido"]);
    expect(actions.filter((a) => a.allowed).map((a) => a.to)).toEqual(["em_contato", "perdido"]);
  });

  it("buttons: confirmado mostra comparecimento e cancelamento", () => {
    const actions = getQuickActions("confirmado", "buttons");
    expect(actions.map((a) => [a.to, a.allowed])).toEqual([
      ["agendado", false],
      ["compareceu", true],
      ["nao_compareceu", true],
      ["cancelado", true],
      ["perdido", false],
    ]);
  });

  it("menu: somente transições permitidas", () => {
    for (const status of LEAD_STATUSES) {
      const actions = getQuickActions(status, "menu");
      expect(actions.every((a) => a.allowed)).toBe(true);
      expect(new Set(actions.map((a) => a.to))).toEqual(new Set(allowedTransitions(status)));
    }
  });

  it("status final não tem ações no menu", () => {
    expect(getQuickActions("compareceu", "menu")).toEqual([]);
    expect(getQuickActions("compareceu", "buttons").every((a) => !a.allowed)).toBe(true);
  });
});

describe("getStatusChangeOptions", () => {
  it("segue a ordem do funil", () => {
    expect(getStatusChangeOptions("em_contato").map((a) => a.to)).toEqual(["agendado", "cancelado", "perdido"]);
    expect(getStatusChangeOptions("perdido").map((a) => a.label)).toEqual(["Reativar"]);
  });
});

describe("getConfirmCopy", () => {
  it("perdido explica que o lead não é excluído", () => {
    const copy = getConfirmCopy(lead("novo"), "perdido");
    expect(copy.title).toBe("Marcar Maria Silva como perdido?");
    expect(copy.description).toContain("Leads não são excluídos");
    expect(copy.description).toContain("reativado");
    expect(copy.confirmLabel).toBe("Marcar como perdido");
  });

  it("perdido com consulta marcada avisa que ela deixa de contar", () => {
    // 2026-03-10 (terça) 14:30 em Barreiras
    const copy = getConfirmCopy(lead("agendado", "2026-03-10T17:30:00.000Z"), "perdido");
    expect(copy.description).toContain("terça, 10/03 às 14:30");
  });

  it("cancelado com agendamento fala em cancelar a consulta", () => {
    const copy = getConfirmCopy(lead("confirmado", "2026-03-10T17:30:00.000Z"), "cancelado");
    expect(copy.title).toBe("Cancelar o agendamento de Maria Silva?");
    expect(copy.description).toContain("A consulta de terça, 10/03 às 14:30 será marcada como cancelada");
    expect(copy.confirmLabel).toBe("Cancelar agendamento");
  });

  it("cancelado sem agendamento", () => {
    const copy = getConfirmCopy(lead("em_contato"), "cancelado");
    expect(copy.title).toBe("Marcar Maria Silva como cancelado?");
    expect(copy.confirmLabel).toBe("Marcar como cancelado");
  });

  it("nome vazio vira 'este lead'", () => {
    expect(getConfirmCopy({ name: "  ", status: "novo", scheduled_at: null }, "perdido").title).toBe(
      "Marcar este lead como perdido?",
    );
  });
});

describe("getScheduleCopy", () => {
  it("agendamento normal", () => {
    expect(getScheduleCopy(lead("em_contato"))).toMatchObject({
      title: "Agendar consulta",
      submitLabel: "Agendar",
      previous: null,
    });
  });

  it("reagendamento mostra a consulta anterior", () => {
    const copy = getScheduleCopy(lead("nao_compareceu", "2026-03-10T17:30:00.000Z"));
    expect(copy.title).toBe("Reagendar consulta");
    expect(copy.previous).toBe("Não compareceu à consulta de terça, 10/03 às 14:30.");
    expect(getScheduleCopy(lead("cancelado", "2026-03-10T17:30:00.000Z")).previous).toBe(
      "A consulta de terça, 10/03 às 14:30 foi cancelada.",
    );
  });
});

describe("nextBusinessDayKey / defaultScheduleIso", () => {
  it("dia útil seguinte no fuso de Barreiras", () => {
    // quarta 2026-03-11 10:00 BA
    expect(nextBusinessDayKey("2026-03-11T13:00:00.000Z")).toBe("2026-03-12");
    // sexta → segunda
    expect(nextBusinessDayKey("2026-03-13T13:00:00.000Z")).toBe("2026-03-16");
    // sábado → segunda
    expect(nextBusinessDayKey("2026-03-14T13:00:00.000Z")).toBe("2026-03-16");
    // domingo → segunda
    expect(nextBusinessDayKey("2026-03-15T13:00:00.000Z")).toBe("2026-03-16");
  });

  it("usa o dia de Barreiras, não o UTC", () => {
    // 2026-03-13 23:30 BA (sexta) = 2026-03-14 02:30 UTC (sábado)
    expect(nextBusinessDayKey("2026-03-14T02:30:00.000Z")).toBe("2026-03-16");
  });

  it("sugere 09:00 de Barreiras (12:00 UTC)", () => {
    expect(defaultScheduleIso("2026-03-11T13:00:00.000Z")).toBe("2026-03-12T12:00:00.000Z");
  });
});

describe("isPastSchedule", () => {
  const now = Date.parse("2026-03-11T13:00:00.000Z");

  it("considera a folga de 15 minutos", () => {
    expect(isPastSchedule("2026-03-11T12:50:00.000Z", now)).toBe(false);
    expect(isPastSchedule("2026-03-11T12:44:00.000Z", now)).toBe(true);
    expect(isPastSchedule("2026-03-12T12:00:00.000Z", now)).toBe(false);
  });

  it("valores vazios/inválidos não são passado", () => {
    expect(isPastSchedule(null, now)).toBe(false);
    expect(isPastSchedule("abc", now)).toBe(false);
  });

  it("aceita Date e ISO como 'agora'", () => {
    expect(isPastSchedule("2026-03-11T12:00:00.000Z", new Date(now))).toBe(true);
    expect(isPastSchedule("2026-03-11T12:00:00.000Z", "2026-03-11T13:00:00.000Z")).toBe(true);
  });
});
