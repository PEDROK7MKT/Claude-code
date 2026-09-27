import { describe, expect, it } from "vitest";

import type { LeadStatus } from "@/types/database";

import { isOpenLead, samePhoneTitle, sortDuplicates, suggestParentLead, summarizeDuplicates } from "./lead-duplicates";

function lead(id: string, status: LeadStatus, createdAt: string, name = `Lead ${id}`) {
  return { id, name, status, created_at: createdAt, updated_at: createdAt };
}

const OLD_LOST = lead("a", "perdido", "2026-01-10T12:00:00.000Z", "Carlos");
const MID_OPEN = lead("b", "em_contato", "2026-02-10T12:00:00.000Z", "Carlos Silva");
const NEW_DONE = lead("c", "compareceu", "2026-03-10T12:00:00.000Z", "Carlos S.");

describe("lead-duplicates", () => {
  it("isOpenLead", () => {
    expect(isOpenLead("novo")).toBe(true);
    expect(isOpenLead("confirmado")).toBe(true);
    expect(isOpenLead("compareceu")).toBe(false);
    expect(isOpenLead("perdido")).toBe(false);
  });

  it("ordena do mais recente para o mais antigo (desempate estável pelo id)", () => {
    expect(sortDuplicates([OLD_LOST, NEW_DONE, MID_OPEN]).map((l) => l.id)).toEqual(["c", "b", "a"]);
    const tie = [lead("z", "novo", "2026-01-01T00:00:00Z"), lead("y", "novo", "2026-01-01T00:00:00Z")];
    expect(sortDuplicates(tie).map((l) => l.id)).toEqual(["y", "z"]);
  });

  it("sugere o lead em andamento mais recente; sem nenhum, o mais recente", () => {
    expect(suggestParentLead([OLD_LOST, NEW_DONE, MID_OPEN])?.id).toBe("b");
    expect(suggestParentLead([OLD_LOST, NEW_DONE])?.id).toBe("c");
    expect(suggestParentLead([])).toBeNull();
  });

  it("resume um único lead", () => {
    const summary = summarizeDuplicates([MID_OPEN]);
    expect(summary.count).toBe(1);
    expect(summary.title).toBe("Telefone já cadastrado");
    expect(summary.description).toBe(
      "Existe um lead com este telefone: Carlos Silva (em contato), cadastrado em 10/02/2026. Ele ainda está em andamento no funil.",
    );
  });

  it("resume vários leads", () => {
    const summary = summarizeDuplicates([OLD_LOST, MID_OPEN, NEW_DONE]);
    expect(summary.title).toBe("Telefone já cadastrado em 3 leads");
    expect(summary.latest?.id).toBe("c");
    expect(summary.openCount).toBe(1);
    expect(summary.description).toBe(
      "O mais recente é Carlos S. (compareceu), cadastrado em 10/03/2026. 1 deles ainda está em andamento no funil.",
    );
  });

  it("vazio", () => {
    expect(summarizeDuplicates([])).toEqual({ count: 0, openCount: 0, latest: null, title: "", description: "" });
  });

  it("data de cadastro no fuso de Barreiras (America/Bahia)", () => {
    // 01:30 UTC = 22:30 do dia anterior em Barreiras
    const late = lead("d", "perdido", "2026-03-02T01:30:00.000Z", "  ");
    expect(summarizeDuplicates([late]).description).toContain("Sem nome (perdido), cadastrado em 01/03/2026");
  });
});

describe("samePhoneTitle", () => {
  it("anteriores quando todos entraram antes; senão 'outros'", () => {
    expect(samePhoneTitle(NEW_DONE, [OLD_LOST, MID_OPEN])).toBe("Contatos anteriores deste telefone");
    expect(samePhoneTitle(MID_OPEN, [OLD_LOST, NEW_DONE])).toBe("Outros contatos deste telefone");
    expect(samePhoneTitle(MID_OPEN, [])).toBe("Contatos anteriores deste telefone");
  });
});
