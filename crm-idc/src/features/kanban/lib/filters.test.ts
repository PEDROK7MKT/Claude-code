import { describe, expect, it } from "vitest";

import {
  EMPTY_KANBAN_FILTERS,
  clearKanbanFilters,
  countActiveFilters,
  filterKanbanLeads,
  finalsCutoffIso,
  foldText,
  hasActiveFilters,
  matchesKanbanFilters,
  matchesSearch,
  normalizeKanbanSearch,
  parseKanbanParams,
  serializeKanbanParams,
  type KanbanFilters,
} from "./filters";
import { makeLead } from "./test-fixtures";

describe("parseKanbanParams / serializeKanbanParams", () => {
  it("lê busca, fonte, serviço e finalizados antigos", () => {
    expect(parseKanbanParams("?q=%20Maria%20%20Silva&fonte=gmn,google_ads&servico=implante&antigos=1")).toEqual({
      q: "Maria Silva",
      source: ["google_ads", "gmn"],
      service: ["implante"],
      showOldFinals: true,
    });
  });

  it("aceita parâmetros repetidos e descarta valores inválidos", () => {
    const params = new URLSearchParams();
    params.append("fonte", "INSTAGRAM");
    params.append("fonte", "facebook");
    params.append("servico", "canal,xyz");
    params.set("antigos", "0");
    expect(parseKanbanParams(params)).toEqual({
      q: "",
      source: ["instagram"],
      service: ["canal"],
      showOldFinals: false,
    });
  });

  it("gera query string canônica e faz ida e volta", () => {
    const filters: KanbanFilters = {
      q: "  joão ",
      source: ["gmn", "google_ads"],
      service: ["canal", "implante"],
      showOldFinals: true,
    };
    const query = serializeKanbanParams(filters);
    expect(query).toBe("q=jo%C3%A3o&fonte=google_ads%2Cgmn&servico=implante%2Ccanal&antigos=1");
    expect(parseKanbanParams(query)).toEqual({ ...filters, q: "joão", source: ["google_ads", "gmn"], service: ["implante", "canal"] });
    expect(serializeKanbanParams(EMPTY_KANBAN_FILTERS)).toBe("");
  });

  it("limita o tamanho da busca", () => {
    expect(normalizeKanbanSearch("a".repeat(150))).toHaveLength(100);
    expect(normalizeKanbanSearch(null)).toBe("");
  });
});

describe("filtros ativos", () => {
  it("conta busca, fonte e serviço, mas não o toggle de antigos", () => {
    expect(countActiveFilters({ ...EMPTY_KANBAN_FILTERS, showOldFinals: true })).toBe(0);
    expect(hasActiveFilters({ ...EMPTY_KANBAN_FILTERS, q: "  " })).toBe(false);
    expect(countActiveFilters({ q: "ana", source: ["gmn"], service: ["canal", "implante"], showOldFinals: false })).toBe(3);
  });

  it("limpar mantém a preferência de finalizados antigos", () => {
    expect(clearKanbanFilters({ q: "ana", source: ["gmn"], service: [], showOldFinals: true })).toEqual({
      ...EMPTY_KANBAN_FILTERS,
      showOldFinals: true,
    });
  });
});

describe("matchesSearch", () => {
  const lead = makeLead({ name: "José Antônio Souza", phone: "77987654321" });

  it("ignora acentos, caixa e ordem das palavras", () => {
    expect(foldText("JOSÉ Antônio")).toBe("jose antonio");
    expect(matchesSearch(lead, "jose")).toBe(true);
    expect(matchesSearch(lead, "souza antonio")).toBe(true);
    expect(matchesSearch(lead, "maria")).toBe(false);
    expect(matchesSearch(lead, "")).toBe(true);
  });

  it("busca pelos dígitos do telefone em qualquer formato", () => {
    expect(matchesSearch(lead, "(77) 98765")).toBe(true);
    expect(matchesSearch(lead, "+55 77 98765-4321")).toBe(true);
    expect(matchesSearch(lead, "4321")).toBe(true);
    expect(matchesSearch(lead, "1111")).toBe(false);
  });
});

describe("matchesKanbanFilters / filterKanbanLeads", () => {
  const leads = [
    makeLead({ id: "1", name: "Ana", source: "gmn", service: "implante" }),
    makeLead({ id: "2", name: "Bruno", source: "google_ads", service: "canal" }),
    makeLead({ id: "3", name: "Ana Paula", source: "google_ads", service: null }),
  ];

  it("combina fonte, serviço e busca", () => {
    const filters: KanbanFilters = { q: "ana", source: ["google_ads"], service: [], showOldFinals: false };
    expect(filterKanbanLeads(leads, filters).map((l) => l.id)).toEqual(["3"]);
    expect(
      filterKanbanLeads(leads, { ...EMPTY_KANBAN_FILTERS, service: ["implante", "canal"] }).map((l) => l.id),
    ).toEqual(["1", "2"]);
  });

  it("lead sem serviço não passa no filtro de serviço", () => {
    expect(matchesKanbanFilters(leads[2], { ...EMPTY_KANBAN_FILTERS, service: ["implante"] })).toBe(false);
  });

  it("sem filtros devolve uma cópia de tudo", () => {
    const out = filterKanbanLeads(leads, EMPTY_KANBAN_FILTERS);
    expect(out).toEqual(leads);
    expect(out).not.toBe(leads);
  });
});

describe("finalsCutoffIso", () => {
  it("é a meia-noite de Barreiras de 30 dias atrás", () => {
    // 12/03/2026 09:00 em Barreiras (12:00Z) → 10/02/2026 00:00 (03:00Z)
    expect(finalsCutoffIso("2026-03-12T12:00:00Z")).toBe("2026-02-10T03:00:00.000Z");
  });

  it("usa o dia de Barreiras, não o UTC", () => {
    // 12/03 01:30Z ainda é 11/03 22:30 em Barreiras → 09/02
    expect(finalsCutoffIso("2026-03-12T01:30:00Z")).toBe("2026-02-09T03:00:00.000Z");
  });

  it("fica estável ao longo do dia (chave de cache)", () => {
    expect(finalsCutoffIso("2026-03-12T03:00:00Z")).toBe(finalsCutoffIso("2026-03-13T02:59:00Z"));
    expect(finalsCutoffIso("2026-03-12T12:00:00Z", 7)).toBe("2026-03-05T03:00:00.000Z");
  });
});
