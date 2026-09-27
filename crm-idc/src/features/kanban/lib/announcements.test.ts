import { describe, expect, it } from "vitest";

import {
  KANBAN_DRAG_INSTRUCTIONS,
  announceDragCancel,
  announceDragEnd,
  announceDragOver,
  announceDragStart,
  columnCountLabel,
} from "./announcements";

describe("anúncios do arraste", () => {
  it("instruções explicam abrir, mover e o menu alternativo", () => {
    expect(KANBAN_DRAG_INSTRUCTIONS).toContain("Enter abre o lead");
    expect(KANBAN_DRAG_INSTRUCTIONS).toContain("Espaço");
    expect(KANBAN_DRAG_INSTRUCTIONS).toContain("Mover para");
  });

  it("início", () => {
    expect(announceDragStart("Maria", "novo")).toBe(
      'Maria selecionado na coluna "Novo". Use as setas para a esquerda e para a direita para escolher a coluna de destino.',
    );
    expect(announceDragStart("  ", "novo")).toContain("Lead sem nome");
  });

  it("sobre uma coluna: origem, permitida, não permitida ou nenhuma", () => {
    expect(announceDragOver({ name: "Maria", from: "novo", over: "novo" })).toBe(
      'Maria sobre a coluna de origem, "Novo".',
    );
    expect(announceDragOver({ name: "Maria", from: "novo", over: "em_contato" })).toBe(
      'Maria sobre a coluna "Em contato".',
    );
    expect(announceDragOver({ name: "Maria", from: "novo", over: "agendado" })).toBe(
      'Maria sobre a coluna "Agendado": movimento não permitido.',
    );
    expect(announceDragOver({ name: "Maria", from: "novo", over: null })).toBe("Maria não está sobre nenhuma coluna.");
  });

  it("fim e cancelamento", () => {
    expect(announceDragEnd({ name: "Maria", from: "novo", over: "em_contato" })).toBe(
      'Maria solto na coluna "Em contato".',
    );
    expect(announceDragEnd({ name: "Maria", from: "novo", over: "confirmado" })).toBe(
      'Movimento não permitido de "Novo" para "Confirmado". Maria voltou para "Novo".',
    );
    expect(announceDragEnd({ name: "Maria", from: "novo", over: null })).toBe('Maria continua na coluna "Novo".');
    expect(announceDragCancel({ name: "Maria", from: "agendado" })).toBe(
      'Movimento cancelado. Maria voltou para a coluna "Agendado".',
    );
  });

  it("contador da coluna", () => {
    expect(columnCountLabel(0)).toBe("0 leads");
    expect(columnCountLabel(1)).toBe("1 lead");
    expect(columnCountLabel(12)).toBe("12 leads");
  });
});
