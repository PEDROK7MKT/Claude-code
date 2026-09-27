import { describe, expect, it } from "vitest";

import { LEAD_STATUSES } from "@/lib/constants";

import {
  filterChipRemoveLabel,
  getFilterChips,
  isPeriodSelectValue,
  matchQuickFilter,
  periodLabel,
  periodSelectValue,
  removeFilterChip,
  STATUS_QUICK_FILTERS,
  toggleListValue,
} from "./list-filters";
import { EMPTY_LEAD_LIST_PARAMS, type LeadListParams } from "./list-params";

function params(patch: Partial<LeadListParams> = {}): LeadListParams {
  return { ...EMPTY_LEAD_LIST_PARAMS, ...patch };
}

describe("STATUS_QUICK_FILTERS", () => {
  it("não sobrepõe status entre os atalhos e cobre o funil inteiro", () => {
    const all = STATUS_QUICK_FILTERS.flatMap((filter) => filter.statuses);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...LEAD_STATUSES].sort());
  });
});

describe("matchQuickFilter", () => {
  it("encontra o atalho equivalente, independente da ordem", () => {
    expect(matchQuickFilter([])?.id).toBe("todos");
    expect(matchQuickFilter(["novo"])?.id).toBe("novos");
    expect(matchQuickFilter(["confirmado", "agendado"])?.id).toBe("agendados");
    expect(matchQuickFilter(["perdido", "cancelado", "nao_compareceu"])?.id).toBe("sem_sucesso");
  });

  it("retorna null para combinações livres", () => {
    expect(matchQuickFilter(["agendado"])).toBeNull();
    expect(matchQuickFilter(["novo", "em_contato"])).toBeNull();
  });
});

describe("toggleListValue", () => {
  it("liga e desliga mantendo a ordem canônica", () => {
    expect(toggleListValue(["perdido"], "novo", LEAD_STATUSES)).toEqual(["novo", "perdido"]);
    expect(toggleListValue(["novo", "perdido"], "novo", LEAD_STATUSES)).toEqual(["perdido"]);
    expect(toggleListValue([], "agendado", LEAD_STATUSES)).toEqual(["agendado"]);
  });
});

describe("período", () => {
  it("mapeia o valor do seletor", () => {
    expect(periodSelectValue(null)).toBe("all");
    expect(periodSelectValue({ kind: "preset", key: "7d" })).toBe("7d");
    expect(periodSelectValue({ kind: "custom", from: "2026-09-01", to: null })).toBe("custom");
    expect(isPeriodSelectValue("month")).toBe(true);
    expect(isPeriodSelectValue("custom")).toBe(true);
    expect(isPeriodSelectValue("ontem")).toBe(false);
  });

  it("gera rótulos em pt-BR", () => {
    expect(periodLabel({ kind: "preset", key: "today" })).toBe("Hoje");
    expect(periodLabel({ kind: "preset", key: "30d" })).toBe("Últimos 30 dias");
    expect(periodLabel({ kind: "custom", from: "2026-09-05", to: "2026-09-05" })).toBe("05/09/2026");
    expect(periodLabel({ kind: "custom", from: "2026-09-01", to: "2026-09-10" })).toBe("01/09/2026 – 10/09/2026");
    expect(periodLabel({ kind: "custom", from: "2026-09-01", to: null })).toBe("Desde 01/09/2026");
  });
});

describe("chips de filtros", () => {
  const full = params({
    q: "maria",
    status: ["novo", "agendado"],
    source: ["google_ads"],
    service: ["implante"],
    period: { kind: "preset", key: "7d" },
    page: 4,
  });

  it("gera um chip por valor ativo", () => {
    expect(getFilterChips(EMPTY_LEAD_LIST_PARAMS)).toEqual([]);
    expect(getFilterChips(full).map((chip) => [chip.id, chip.label])).toEqual([
      ["search", "“maria”"],
      ["status:novo", "novo"],
      ["status:agendado", "agendado"],
      ["source:google_ads", "Google Ads"],
      ["service:implante", "Implante Dentário"],
      ["period", "Entrada: Últimos 7 dias"],
    ]);
  });

  it("remove somente o filtro do chip e volta para a página 1", () => {
    const chips = getFilterChips(full);
    const byId = (id: string) => chips.find((chip) => chip.id === id)!;

    expect(removeFilterChip(full, byId("search"))).toEqual({ ...full, q: "", page: 1 });
    expect(removeFilterChip(full, byId("status:novo"))).toEqual({ ...full, status: ["agendado"], page: 1 });
    expect(removeFilterChip(full, byId("source:google_ads"))).toEqual({ ...full, source: [], page: 1 });
    expect(removeFilterChip(full, byId("service:implante"))).toEqual({ ...full, service: [], page: 1 });
    expect(removeFilterChip(full, byId("period"))).toEqual({ ...full, period: null, page: 1 });
  });

  it("descreve o botão de remover para leitores de tela", () => {
    const [search, status] = getFilterChips(full);
    expect(filterChipRemoveLabel(search)).toBe("Remover busca “maria”");
    expect(filterChipRemoveLabel(status)).toBe("Remover filtro de status novo");
  });
});
