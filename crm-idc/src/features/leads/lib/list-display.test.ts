import { describe, expect, it } from "vitest";

import {
  findFreshLeadIds,
  formatEntryAge,
  formatLeadCount,
  getAppointmentDisplay,
  leadDetailHref,
  leadsHeaderDescription,
  pageRange,
  pageRangeLabel,
  paginationItems,
  recentFreshIds,
  showResultsLabel,
} from "./list-display";

// 27/09/2026 10:00 em Barreiras (13:00 UTC)
const NOW = new Date("2026-09-27T13:00:00.000Z");

describe("leadDetailHref", () => {
  it("monta a rota de detalhe", () => {
    expect(leadDetailHref("7f0c9b3e-1d2a-4c5b-8e9f-0a1b2c3d4e5f")).toBe("/leads/7f0c9b3e-1d2a-4c5b-8e9f-0a1b2c3d4e5f");
    expect(leadDetailHref("a/b")).toBe("/leads/a%2Fb");
  });
});

describe("formatEntryAge", () => {
  it("formata o tempo desde a entrada em relação ao relógio da lista", () => {
    expect(formatEntryAge("2026-09-27T12:59:30.000Z", NOW)).toBe("agora mesmo");
    expect(formatEntryAge("2026-09-27T13:00:30.000Z", NOW)).toBe("agora mesmo");
    expect(formatEntryAge("2026-09-27T12:55:00.000Z", NOW)).toBe("há 5 minutos");
    expect(formatEntryAge("2026-09-27T11:00:00.000Z", NOW)).toBe("há 2 horas");
    expect(formatEntryAge("2026-09-20T13:00:00.000Z", NOW)).toBe("há 7 dias");
    expect(formatEntryAge("invalida", NOW)).toBe("—");
  });
});

describe("contagem", () => {
  it("formata o total de leads", () => {
    expect(formatLeadCount(0)).toBe("0 leads");
    expect(formatLeadCount(1)).toBe("1 lead");
    expect(formatLeadCount(1234)).toBe("1.234 leads");
  });

  it("descreve o total no cabeçalho", () => {
    expect(leadsHeaderDescription(137, false)).toBe("137 leads no total");
    expect(leadsHeaderDescription(1, true)).toBe("1 lead encontrado com os filtros atuais");
    expect(leadsHeaderDescription(12, true)).toBe("12 leads encontrados com os filtros atuais");
  });
});

describe("showResultsLabel", () => {
  it("descreve o botão que fecha o painel de filtros", () => {
    expect(showResultsLabel(undefined)).toBe("Ver resultados");
    expect(showResultsLabel(0)).toBe("Nenhum lead encontrado");
    expect(showResultsLabel(1)).toBe("Ver 1 lead");
    expect(showResultsLabel(1234)).toBe("Ver 1.234 leads");
  });
});

describe("pageRange / pageRangeLabel", () => {
  it("calcula o intervalo exibido", () => {
    expect(pageRange(2, 20, 137)).toEqual({ from: 21, to: 40, total: 137 });
    expect(pageRange(7, 20, 137)).toEqual({ from: 121, to: 137, total: 137 });
    expect(pageRange(1, 20, 0)).toEqual({ from: 0, to: 0, total: 0 });
  });

  it("gera o texto 'Mostrando 21–40 de 137'", () => {
    expect(pageRangeLabel(2, 20, 137)).toBe("Mostrando 21–40 de 137");
    expect(pageRangeLabel(1, 20, 5)).toBe("Mostrando 1–5 de 5");
    expect(pageRangeLabel(60, 20, 1500)).toBe("Mostrando 1.181–1.200 de 1.500");
    expect(pageRangeLabel(1, 20, 0)).toBe("Nenhum lead");
  });
});

describe("paginationItems", () => {
  it("lista todas as páginas quando cabem", () => {
    expect(paginationItems(1, 1)).toEqual([1]);
    expect(paginationItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(paginationItems(1, 0)).toEqual([1]);
  });

  it("usa reticências no início, no fim ou dos dois lados", () => {
    expect(paginationItems(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 20]);
    expect(paginationItems(4, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 20]);
    expect(paginationItems(7, 20)).toEqual([1, "ellipsis-start", 6, 7, 8, "ellipsis-end", 20]);
    expect(paginationItems(17, 20)).toEqual([1, "ellipsis-start", 16, 17, 18, 19, 20]);
    expect(paginationItems(20, 20)).toEqual([1, "ellipsis-start", 16, 17, 18, 19, 20]);
  });

  it("mantém sempre a mesma quantidade de itens e inclui a página atual", () => {
    for (let page = 1; page <= 30; page++) {
      const items = paginationItems(page, 30);
      expect(items).toHaveLength(7);
      expect(items).toContain(page);
    }
  });

  it("limita a página atual ao intervalo válido", () => {
    expect(paginationItems(99, 8)).toEqual([1, "ellipsis-start", 4, 5, 6, 7, 8]);
  });
});

describe("getAppointmentDisplay", () => {
  it("sem agendamento", () => {
    expect(getAppointmentDisplay({ status: "novo", scheduled_at: null }, NOW)).toEqual({
      tone: "none",
      label: "—",
      full: null,
      isToday: false,
    });
  });

  it("consulta de hoje ainda por vir", () => {
    const display = getAppointmentDisplay({ status: "confirmado", scheduled_at: "2026-09-27T17:30:00.000Z" }, NOW);
    expect(display).toEqual({ tone: "upcoming", label: "Hoje, 14:30", full: "27/09/2026 14:30", isToday: true });
  });

  it("consulta de hoje que já passou e continua agendada fica atrasada", () => {
    const display = getAppointmentDisplay({ status: "agendado", scheduled_at: "2026-09-27T11:00:00.000Z" }, NOW);
    expect(display.tone).toBe("overdue");
    expect(display.isToday).toBe(true);
    expect(display.label).toBe("Hoje, 08:00");
  });

  it("usa 'Amanhã' e 'Ontem' pelo calendário de Barreiras", () => {
    // 28/09 00:30 em Barreiras (03:30 UTC)
    expect(getAppointmentDisplay({ status: "agendado", scheduled_at: "2026-09-28T03:30:00.000Z" }, NOW).label).toBe(
      "Amanhã, 00:30",
    );
    const yesterday = getAppointmentDisplay({ status: "agendado", scheduled_at: "2026-09-26T20:00:00.000Z" }, NOW);
    expect(yesterday.label).toBe("Ontem, 17:00");
    expect(yesterday.tone).toBe("overdue");
    expect(yesterday.isToday).toBe(false);
  });

  it("datas mais distantes usam o dia da semana; outro ano mostra a data completa", () => {
    expect(getAppointmentDisplay({ status: "agendado", scheduled_at: "2026-09-29T17:30:00.000Z" }, NOW).label).toBe(
      "terça, 29/09 às 14:30",
    );
    expect(getAppointmentDisplay({ status: "agendado", scheduled_at: "2027-01-05T12:00:00.000Z" }, NOW).label).toBe(
      "05/01/2027 09:00",
    );
  });

  it("consultas resolvidas ou canceladas não ficam em destaque", () => {
    const at = "2026-09-27T17:30:00.000Z";
    expect(getAppointmentDisplay({ status: "compareceu", scheduled_at: at }, NOW)).toMatchObject({
      tone: "past",
      isToday: false,
    });
    expect(getAppointmentDisplay({ status: "nao_compareceu", scheduled_at: at }, NOW).tone).toBe("past");
    expect(getAppointmentDisplay({ status: "cancelado", scheduled_at: at }, NOW)).toMatchObject({
      tone: "inactive",
      isToday: false,
    });
    expect(getAppointmentDisplay({ status: "perdido", scheduled_at: at }, NOW).tone).toBe("inactive");
    expect(getAppointmentDisplay({ status: "em_contato", scheduled_at: at }, NOW).tone).toBe("inactive");
  });
});

describe("findFreshLeadIds", () => {
  const reference = Date.parse("2026-09-27T13:00:00.000Z");

  it("destaca só leads novos na lista e criados há pouco", () => {
    const rows = [
      { id: "a", created_at: "2026-09-27T12:59:30.000Z" },
      { id: "b", created_at: "2026-09-27T12:30:00.000Z" },
      { id: "c", created_at: "2026-09-27T12:59:50.000Z" },
    ];
    expect(findFreshLeadIds(["c"], rows, reference)).toEqual(["a"]);
  });

  it("não destaca nada quando a lista não mudou", () => {
    const rows = [{ id: "a", created_at: "2026-09-27T12:59:30.000Z" }];
    expect(findFreshLeadIds(["a"], rows, reference)).toEqual([]);
  });

  it("ignora datas inválidas e respeita a janela informada", () => {
    const rows = [
      { id: "a", created_at: "invalida" },
      { id: "b", created_at: "2026-09-27T12:58:00.000Z" },
    ];
    expect(findFreshLeadIds([], rows, reference, 60_000)).toEqual([]);
    expect(findFreshLeadIds([], rows, reference, 3 * 60_000)).toEqual(["b"]);
  });
});

describe("recentFreshIds", () => {
  const rows = [
    { id: "a", created_at: "2026-09-27T12:59:30.000Z" },
    { id: "b", created_at: "2026-09-27T12:55:00.000Z" },
    { id: "c", created_at: "2026-09-27T13:00:20.000Z" },
  ];

  it("mantém só os recém-chegados ainda dentro da janela", () => {
    const fresh = new Set(["a", "b", "c"]);
    expect([...recentFreshIds(fresh, rows, NOW.getTime())].sort()).toEqual(["a", "c"]);
  });

  it("devolve o mesmo conjunto quando nada expirou (sem re-renderizar à toa)", () => {
    const fresh = new Set(["a"]);
    expect(recentFreshIds(fresh, rows, NOW.getTime())).toBe(fresh);
    const none = new Set<string>();
    expect(recentFreshIds(none, rows, NOW.getTime())).toBe(none);
  });

  it("ignora ids fora da página e datas inválidas", () => {
    const fresh = new Set(["x", "d"]);
    expect(recentFreshIds(fresh, [...rows, { id: "d", created_at: "invalida" }], NOW.getTime()).size).toBe(0);
  });
});
