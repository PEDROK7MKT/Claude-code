import { describe, expect, it } from "vitest";

import { LEAD_STATUSES } from "@/lib/constants";

import {
  ACTIVE_STATUSES,
  FINAL_STATUSES,
  KANBAN_COLUMNS,
  KANBAN_GROUPS,
  columnDroppableId,
  columnsOfGroup,
  getDropTargetState,
  getDropTargets,
  groupLeadsByColumn,
  isMovableStatus,
  sortColumnLeads,
  statusFromColumnId,
} from "./columns";
import { makeLead } from "./test-fixtures";

describe("KANBAN_COLUMNS", () => {
  it("segue a ordem do funil da spec e cobre todos os status", () => {
    expect(KANBAN_COLUMNS.map((c) => c.status)).toEqual([
      "novo",
      "em_contato",
      "agendado",
      "confirmado",
      "compareceu",
      "nao_compareceu",
      "cancelado",
      "perdido",
    ]);
    expect([...KANBAN_COLUMNS.map((c) => c.status)].sort()).toEqual([...LEAD_STATUSES].sort());
  });

  it("separa status em andamento e finalizados", () => {
    expect(ACTIVE_STATUSES).toEqual(["novo", "em_contato", "agendado", "confirmado"]);
    expect(FINAL_STATUSES).toEqual(["compareceu", "nao_compareceu", "cancelado", "perdido"]);
  });

  it("agrupa em andamento, resultado e encerrados; saídas do funil ficam apagadas", () => {
    expect(KANBAN_GROUPS.map((g) => g.id)).toEqual(["funil", "resultado", "encerrado"]);
    expect(columnsOfGroup("resultado").map((c) => c.status)).toEqual(["compareceu", "nao_compareceu"]);
    expect(columnsOfGroup("encerrado").map((c) => c.status)).toEqual(["cancelado", "perdido"]);
    expect(KANBAN_COLUMNS.filter((c) => c.tone === "muted").map((c) => c.status)).toEqual([
      "nao_compareceu",
      "cancelado",
      "perdido",
    ]);
  });
});

describe("ids das colunas", () => {
  it("faz ida e volta e rejeita valores estranhos", () => {
    expect(statusFromColumnId(columnDroppableId("agendado"))).toBe("agendado");
    expect(statusFromColumnId("coluna:xyz")).toBeNull();
    expect(statusFromColumnId("agendado")).toBeNull();
    expect(statusFromColumnId(42)).toBeNull();
  });
});

describe("sortColumnLeads", () => {
  it("novo/em contato: quem espera há mais tempo primeiro", () => {
    const a = makeLead({ id: "a", created_at: "2026-03-10T12:00:00Z" });
    const b = makeLead({ id: "b", created_at: "2026-03-09T12:00:00Z" });
    const c = makeLead({ id: "c", created_at: "2026-03-11T12:00:00+00:00" });
    expect(sortColumnLeads("novo", [a, b, c]).map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("agendado/confirmado: próxima consulta primeiro e sem data no fim", () => {
    const later = makeLead({ id: "later", scheduled_at: "2026-03-20T13:00:00Z" });
    const sooner = makeLead({ id: "sooner", scheduled_at: "2026-03-15T13:00:00Z" });
    const none = makeLead({ id: "none", scheduled_at: null });
    expect(sortColumnLeads("confirmado", [none, later, sooner]).map((l) => l.id)).toEqual(["sooner", "later", "none"]);
  });

  it("finalizados: movimentação mais recente primeiro", () => {
    const old = makeLead({ id: "old", updated_at: "2026-03-01T12:00:00Z" });
    const recent = makeLead({ id: "recent", updated_at: "2026-03-05T12:00:00Z" });
    expect(sortColumnLeads("perdido", [old, recent]).map((l) => l.id)).toEqual(["recent", "old"]);
  });

  it("desempata pelo id (ordem estável) e não altera o array original", () => {
    const leads = [makeLead({ id: "z" }), makeLead({ id: "m" })];
    expect(sortColumnLeads("novo", leads).map((l) => l.id)).toEqual(["m", "z"]);
    expect(leads.map((l) => l.id)).toEqual(["z", "m"]);
  });
});

describe("groupLeadsByColumn", () => {
  it("distribui por status, com todas as colunas presentes", () => {
    const groups = groupLeadsByColumn([
      makeLead({ id: "1", status: "novo" }),
      makeLead({ id: "2", status: "agendado", scheduled_at: "2026-03-20T13:00:00Z" }),
      makeLead({ id: "3", status: "agendado", scheduled_at: "2026-03-18T13:00:00Z" }),
    ]);
    expect(Object.keys(groups).sort()).toEqual([...LEAD_STATUSES].sort());
    expect(groups.novo.map((l) => l.id)).toEqual(["1"]);
    expect(groups.agendado.map((l) => l.id)).toEqual(["3", "2"]);
    expect(groups.perdido).toEqual([]);
  });
});

describe("alvos de arraste (regra 2)", () => {
  it("classifica origem, destino válido e inválido", () => {
    expect(getDropTargetState(null, "novo")).toBe("idle");
    expect(getDropTargetState("novo", "novo")).toBe("source");
    expect(getDropTargetState("novo", "em_contato")).toBe("valid");
    expect(getDropTargetState("novo", "perdido")).toBe("valid");
    expect(getDropTargetState("novo", "agendado")).toBe("invalid");
    expect(getDropTargetState("cancelado", "agendado")).toBe("valid");
    expect(getDropTargetState("perdido", "em_contato")).toBe("valid");
  });

  it("monta o mapa de todas as colunas", () => {
    const targets = getDropTargets("confirmado");
    expect(targets).toEqual({
      novo: "invalid",
      em_contato: "invalid",
      agendado: "invalid",
      confirmado: "source",
      compareceu: "valid",
      nao_compareceu: "valid",
      cancelado: "valid",
      perdido: "invalid",
    });
    expect(Object.values(getDropTargets(undefined)).every((s) => s === "idle")).toBe(true);
  });

  it("compareceu é final: o card não pode ser arrastado", () => {
    expect(isMovableStatus("compareceu")).toBe(false);
    expect(isMovableStatus("nao_compareceu")).toBe(true);
    expect(isMovableStatus("novo")).toBe(true);
  });
});
