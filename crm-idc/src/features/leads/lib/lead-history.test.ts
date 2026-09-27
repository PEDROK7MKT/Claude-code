import { describe, expect, it } from "vitest";

import type { LeadStatus } from "@/types/database";

import {
  SYSTEM_ACTOR_LABEL,
  historyActorName,
  historyEntryTitle,
  historyNote,
  isCreationEntry,
  isSystemEntry,
} from "./lead-history";

const t = (old_status: LeadStatus | null, new_status: LeadStatus) => historyEntryTitle({ old_status, new_status });

describe("lead-history", () => {
  it("criação do lead", () => {
    expect(isCreationEntry({ old_status: null })).toBe(true);
    expect(isCreationEntry({ old_status: "novo" })).toBe(false);
    expect(t(null, "novo")).toBe("Lead cadastrado");
  });

  it("títulos das mudanças de status", () => {
    expect(t("novo", "em_contato")).toBe("Contato iniciado");
    expect(t("perdido", "em_contato")).toBe("Lead reativado");
    expect(t("em_contato", "agendado")).toBe("Consulta agendada");
    expect(t("cancelado", "agendado")).toBe("Consulta reagendada");
    expect(t("nao_compareceu", "agendado")).toBe("Consulta reagendada");
    expect(t("agendado", "confirmado")).toBe("Presença confirmada");
    expect(t("confirmado", "compareceu")).toBe("Paciente compareceu");
    expect(t("confirmado", "nao_compareceu")).toBe("Paciente não compareceu");
    expect(t("agendado", "cancelado")).toBe("Agendamento cancelado");
    expect(t("novo", "perdido")).toBe("Marcado como perdido");
  });

  it("autor: perfil, sistema/webhook ou usuário sem perfil visível", () => {
    expect(historyActorName({ old_status: null, new_status: "novo", changed_by: "u1", profile: { full_name: " Dra. Ana " } })).toBe(
      "Dra. Ana",
    );
    expect(historyActorName({ old_status: null, new_status: "novo", changed_by: null, profile: null })).toBe(
      SYSTEM_ACTOR_LABEL,
    );
    expect(historyActorName({ old_status: null, new_status: "novo", changed_by: "u1", profile: null })).toBe("Usuário");
    expect(isSystemEntry({ changed_by: null })).toBe(true);
    expect(isSystemEntry({ changed_by: "u1" })).toBe(false);
  });

  it("nota vazia vira null", () => {
    expect(historyNote("  ")).toBeNull();
    expect(historyNote(null)).toBeNull();
    expect(historyNote(" paciente pediu retorno ")).toBe("paciente pediu retorno");
  });
});
