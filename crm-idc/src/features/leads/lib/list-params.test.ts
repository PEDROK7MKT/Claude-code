import { describe, expect, it } from "vitest";

import { normalizeLeadFilters } from "@/features/leads/api/lead-query-utils";

import {
  buildLeadListHref,
  clearLeadListFilters,
  countPanelFilters,
  customPeriodSeed,
  DEFAULT_LEAD_LIST_SORT,
  EMPTY_LEAD_LIST_PARAMS,
  hasActiveFilters,
  isValidDateKey,
  leadListReturnHref,
  MOBILE_SORT_OPTIONS,
  mobileSortOptions,
  nextDateKey,
  nextSort,
  normalizeSearchTerm,
  parseLeadListParams,
  parseSortKey,
  patchLeadListParams,
  resolvePeriodRange,
  SEARCH_MAX_LENGTH,
  serializeLeadListParams,
  sortDirectionLabel,
  sortKey,
  sortLabel,
  toLeadFilters,
  type LeadListParams,
} from "./list-params";

// 27/09/2026 10:00 em Barreiras (13:00 UTC) — domingo
const NOW = new Date("2026-09-27T13:00:00.000Z");

function params(patch: Partial<LeadListParams> = {}): LeadListParams {
  return { ...EMPTY_LEAD_LIST_PARAMS, ...patch };
}

describe("parseLeadListParams", () => {
  it("retorna o estado padrão para uma URL vazia", () => {
    expect(parseLeadListParams("")).toEqual(EMPTY_LEAD_LIST_PARAMS);
    expect(parseLeadListParams("?")).toEqual(EMPTY_LEAD_LIST_PARAMS);
  });

  it("lê todos os parâmetros do formato canônico", () => {
    const result = parseLeadListParams(
      "?q=maria&status=novo,agendado&fonte=google_ads&servico=implante,canal&de=2026-09-01&ate=2026-09-10&ordem=name.asc&pagina=2",
    );
    expect(result).toEqual({
      q: "maria",
      status: ["novo", "agendado"],
      source: ["google_ads"],
      service: ["implante", "canal"],
      period: { kind: "custom", from: "2026-09-01", to: "2026-09-10" },
      sort: { column: "name", dir: "asc" },
      page: 2,
    });
  });

  it("aceita valores repetidos e aliases em inglês (links do dashboard)", () => {
    const result = parseLeadListParams("status=novo&status=agendado&source=google_ads&service=implante&page=3");
    expect(result.status).toEqual(["novo", "agendado"]);
    expect(result.source).toEqual(["google_ads"]);
    expect(result.service).toEqual(["implante"]);
    expect(result.page).toBe(3);
  });

  it("ignora valores inválidos, remove repetições e usa a ordem canônica do funil", () => {
    const result = parseLeadListParams("status=perdido,xyz,novo,novo, AGENDADO &fonte=tiktok&servico=");
    expect(result.status).toEqual(["novo", "agendado", "perdido"]);
    expect(result.source).toEqual([]);
    expect(result.service).toEqual([]);
  });

  it("normaliza a busca (espaços e tamanho máximo)", () => {
    expect(parseLeadListParams("q=%20%20maria%20%20%20silva%20").q).toBe("maria silva");
    expect(parseLeadListParams(`q=${"a".repeat(300)}`).q).toHaveLength(SEARCH_MAX_LENGTH);
    expect(parseLeadListParams("q=(77)%2098765-4321").q).toBe("(77) 98765-4321");
    expect(parseLeadListParams("q=&busca=joao").q).toBe("joao");
  });

  it("lê atalhos de período, inclusive em português", () => {
    expect(parseLeadListParams("periodo=7d").period).toEqual({ kind: "preset", key: "7d" });
    expect(parseLeadListParams("periodo=hoje").period).toEqual({ kind: "preset", key: "today" });
    expect(parseLeadListParams("periodo=mes").period).toEqual({ kind: "preset", key: "month" });
    expect(parseLeadListParams("periodo=ontem").period).toBeNull();
  });

  it("prefere datas explícitas, inverte intervalos ao contrário e aceita período aberto", () => {
    expect(parseLeadListParams("periodo=7d&de=2026-09-01&ate=2026-09-05").period).toEqual({
      kind: "custom",
      from: "2026-09-01",
      to: "2026-09-05",
    });
    expect(parseLeadListParams("de=2026-09-10&ate=2026-09-01").period).toEqual({
      kind: "custom",
      from: "2026-09-01",
      to: "2026-09-10",
    });
    expect(parseLeadListParams("de=2026-09-10").period).toEqual({ kind: "custom", from: "2026-09-10", to: null });
    expect(parseLeadListParams("de=2026-09-10&ate=lixo").period).toEqual({ kind: "custom", from: "2026-09-10", to: null });
  });

  it("ignora datas inválidas", () => {
    expect(parseLeadListParams("de=2026-02-30&ate=2026-03-01").period).toBeNull();
    expect(parseLeadListParams("de=10/09/2026").period).toBeNull();
    expect(parseLeadListParams("ate=2026-09-10").period).toBeNull();
  });

  it("valida a ordenação", () => {
    expect(parseLeadListParams("ordem=scheduled_at.desc").sort).toEqual({ column: "scheduled_at", dir: "desc" });
    expect(parseLeadListParams("ordem=name").sort).toEqual({ column: "name", dir: "asc" });
    expect(parseLeadListParams("ordem=created_at").sort).toEqual({ column: "created_at", dir: "desc" });
    expect(parseLeadListParams("ordem=notes.asc").sort).toEqual(DEFAULT_LEAD_LIST_SORT);
    expect(parseLeadListParams("ordem=name.sideways").sort).toEqual({ column: "name", dir: "asc" });
  });

  it("valida a página", () => {
    expect(parseLeadListParams("pagina=0").page).toBe(1);
    expect(parseLeadListParams("pagina=-2").page).toBe(1);
    expect(parseLeadListParams("pagina=2.5").page).toBe(1);
    expect(parseLeadListParams("pagina=abc").page).toBe(1);
    expect(parseLeadListParams("pagina=99999999").page).toBe(1);
    expect(parseLeadListParams("pagina=12").page).toBe(12);
  });

  it("aceita o objeto searchParams de uma página do Next e URLSearchParams", () => {
    expect(parseLeadListParams({ status: ["novo", "agendado"], fonte: "gmn", q: undefined })).toMatchObject({
      status: ["novo", "agendado"],
      source: ["gmn"],
      q: "",
    });
    expect(parseLeadListParams(new URLSearchParams("status=novo")).status).toEqual(["novo"]);
  });
});

describe("serializeLeadListParams", () => {
  it("omite valores padrão", () => {
    expect(serializeLeadListParams(EMPTY_LEAD_LIST_PARAMS)).toBe("");
  });

  it("gera a query string canônica com vírgulas legíveis", () => {
    const query = serializeLeadListParams(
      params({
        q: "maria silva",
        status: ["agendado", "novo"],
        source: ["gmn", "google_ads"],
        service: ["implante"],
        period: { kind: "custom", from: "2026-09-01", to: "2026-09-10" },
        sort: { column: "name", dir: "asc" },
        page: 2,
      }),
    );
    expect(query).toBe(
      "q=maria%20silva&status=novo,agendado&fonte=google_ads,gmn&servico=implante&de=2026-09-01&ate=2026-09-10&ordem=name.asc&pagina=2",
    );
  });

  it("grava o atalho de período e o período aberto", () => {
    expect(serializeLeadListParams(params({ period: { kind: "preset", key: "30d" } }))).toBe("periodo=30d");
    expect(serializeLeadListParams(params({ period: { kind: "custom", from: "2026-09-01", to: null } }))).toBe(
      "de=2026-09-01",
    );
  });

  it("codifica caracteres especiais da busca", () => {
    const query = serializeLeadListParams(params({ q: "joão & maria, 100%" }));
    expect(parseLeadListParams(query).q).toBe("joão & maria, 100%");
  });

  it("é o inverso de parseLeadListParams (ida e volta)", () => {
    const original = params({
      q: "(77) 98765-4321",
      status: ["em_contato", "perdido"],
      service: ["sono", "outro"],
      period: { kind: "preset", key: "month" },
      sort: { column: "scheduled_at", dir: "asc" },
      page: 4,
    });
    expect(parseLeadListParams(serializeLeadListParams(original))).toEqual(original);
  });
});

describe("buildLeadListHref", () => {
  it("monta links para a lista", () => {
    expect(buildLeadListHref()).toBe("/leads");
    expect(buildLeadListHref({ status: ["novo"] })).toBe("/leads?status=novo");
    expect(buildLeadListHref({ source: ["google_ads"], period: { kind: "preset", key: "7d" } })).toBe(
      "/leads?fonte=google_ads&periodo=7d",
    );
  });
});

describe("leadListReturnHref", () => {
  it("volta para a lista com os filtros e a página guardados", () => {
    expect(leadListReturnHref("/leads?status=novo&pagina=3")).toBe("/leads?status=novo&pagina=3");
    expect(leadListReturnHref("/leads?fonte=google_ads&periodo=7d&ordem=name.asc")).toBe(
      "/leads?fonte=google_ads&periodo=7d&ordem=name.asc",
    );
    expect(leadListReturnHref("/leads")).toBe("/leads");
  });

  it("descarta parâmetros inválidos e normaliza a query", () => {
    expect(leadListReturnHref("/leads?status=xyz&pagina=-2&foo=bar")).toBe("/leads");
  });

  it("ausente, de outra rota ou externo → /leads", () => {
    expect(leadListReturnHref(null)).toBe("/leads");
    expect(leadListReturnHref(undefined)).toBe("/leads");
    expect(leadListReturnHref("")).toBe("/leads");
    expect(leadListReturnHref("/leads/abc")).toBe("/leads");
    expect(leadListReturnHref("/kanban?status=novo")).toBe("/leads");
    expect(leadListReturnHref("//evil.example/leads")).toBe("/leads");
    expect(leadListReturnHref("https://evil.example/leads?status=novo")).toBe("/leads");
  });
});

describe("patchLeadListParams / clearLeadListFilters", () => {
  it("volta para a página 1 ao mudar filtros ou ordenação", () => {
    const current = params({ page: 5 });
    expect(patchLeadListParams(current, { status: ["novo"] }).page).toBe(1);
    expect(patchLeadListParams(current, { sort: { column: "name", dir: "asc" } }).page).toBe(1);
    expect(patchLeadListParams(current, { page: 6 }).page).toBe(6);
  });

  it("normaliza a busca", () => {
    expect(patchLeadListParams(params(), { q: "  ana   paula " }).q).toBe("ana paula");
  });

  it("limpa filtros mantendo a ordenação", () => {
    const current = params({
      q: "x",
      status: ["novo"],
      source: ["gmn"],
      service: ["canal"],
      period: { kind: "preset", key: "today" },
      sort: { column: "name", dir: "asc" },
      page: 3,
    });
    expect(clearLeadListFilters(current)).toEqual({ ...EMPTY_LEAD_LIST_PARAMS, sort: { column: "name", dir: "asc" } });
  });
});

describe("hasActiveFilters / countPanelFilters", () => {
  it("detecta filtros ativos", () => {
    expect(hasActiveFilters(EMPTY_LEAD_LIST_PARAMS)).toBe(false);
    expect(hasActiveFilters(params({ sort: { column: "name", dir: "asc" }, page: 3 }))).toBe(false);
    expect(hasActiveFilters(params({ q: "ana" }))).toBe(true);
    expect(hasActiveFilters(params({ period: { kind: "preset", key: "7d" } }))).toBe(true);
  });

  it("conta os filtros do painel (sem a busca)", () => {
    expect(
      countPanelFilters(
        params({ q: "ana", status: ["novo", "agendado"], source: ["gmn"], period: { kind: "preset", key: "7d" } }),
      ),
    ).toBe(4);
    expect(countPanelFilters(params({ q: "ana" }))).toBe(0);
  });
});

describe("nextSort", () => {
  it("inverte a direção na mesma coluna", () => {
    expect(nextSort({ column: "name", dir: "asc" }, "name")).toEqual({ column: "name", dir: "desc" });
    expect(nextSort({ column: "name", dir: "desc" }, "name")).toEqual({ column: "name", dir: "asc" });
  });

  it("usa a direção inicial da nova coluna", () => {
    expect(nextSort(DEFAULT_LEAD_LIST_SORT, "name")).toEqual({ column: "name", dir: "asc" });
    expect(nextSort({ column: "name", dir: "asc" }, "created_at")).toEqual({ column: "created_at", dir: "desc" });
    expect(nextSort(DEFAULT_LEAD_LIST_SORT, "scheduled_at")).toEqual({ column: "scheduled_at", dir: "asc" });
  });
});

describe("rótulos de ordenação", () => {
  it("descreve a ordenação em pt-BR", () => {
    expect(sortLabel({ column: "name", dir: "asc" })).toBe("Nome: A–Z");
    expect(sortLabel(DEFAULT_LEAD_LIST_SORT)).toBe("Data de entrada: mais recentes primeiro");
    expect(sortLabel({ column: "scheduled_at", dir: "asc" })).toBe("Agendamento: mais cedo primeiro");
    expect(sortDirectionLabel({ column: "source", dir: "desc" })).toBe("decrescente");
  });

  it("serializa e valida a chave usada nos selects", () => {
    expect(sortKey({ column: "name", dir: "desc" })).toBe("name.desc");
    expect(parseSortKey("scheduled_at.asc")).toEqual({ column: "scheduled_at", dir: "asc" });
    expect(parseSortKey("notes.asc")).toBeNull();
    expect(parseSortKey("name")).toBeNull();
  });

  it("inclui a ordenação atual nas opções do celular quando ela não está na lista", () => {
    expect(mobileSortOptions(DEFAULT_LEAD_LIST_SORT)).toEqual(MOBILE_SORT_OPTIONS);
    const withPhone = mobileSortOptions({ column: "phone", dir: "asc" });
    expect(withPhone).toHaveLength(MOBILE_SORT_OPTIONS.length + 1);
    expect(withPhone.at(-1)).toEqual({ column: "phone", dir: "asc" });
  });
});

describe("datas", () => {
  it("valida datas-calendário", () => {
    expect(isValidDateKey("2026-09-27")).toBe(true);
    expect(isValidDateKey("2028-02-29")).toBe(true);
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("2026-9-27")).toBe(false);
    expect(isValidDateKey(null)).toBe(false);
  });

  it("calcula o dia seguinte atravessando meses e anos", () => {
    expect(nextDateKey("2026-09-27")).toBe("2026-09-28");
    expect(nextDateKey("2026-09-30")).toBe("2026-10-01");
    expect(nextDateKey("2026-12-31")).toBe("2027-01-01");
    expect(nextDateKey("2028-02-28")).toBe("2028-02-29");
  });

  it("normaliza termos de busca", () => {
    expect(normalizeSearchTerm(null)).toBe("");
    expect(normalizeSearchTerm("  a \n b ")).toBe("a b");
  });
});

describe("resolvePeriodRange / customPeriodSeed", () => {
  it("resolve atalhos relativos a hoje (Bahia)", () => {
    expect(resolvePeriodRange({ kind: "preset", key: "today" }, NOW)).toEqual({
      fromKey: "2026-09-27",
      toKey: "2026-09-27",
    });
    expect(resolvePeriodRange({ kind: "preset", key: "7d" }, NOW)).toEqual({
      fromKey: "2026-09-21",
      toKey: "2026-09-27",
    });
    expect(resolvePeriodRange({ kind: "preset", key: "month" }, NOW)).toEqual({
      fromKey: "2026-09-01",
      toKey: "2026-09-27",
    });
    expect(resolvePeriodRange(null, NOW)).toBeNull();
  });

  it("usa 'hoje' em Barreiras mesmo quando em UTC já é o dia seguinte", () => {
    // 27/09 22:30 em Barreiras = 28/09 01:30 UTC
    expect(resolvePeriodRange({ kind: "preset", key: "today" }, "2026-09-28T01:30:00.000Z")).toEqual({
      fromKey: "2026-09-27",
      toKey: "2026-09-27",
    });
  });

  it("inicia o personalizado com o período atual ou os últimos 30 dias", () => {
    expect(customPeriodSeed({ kind: "preset", key: "7d" }, NOW)).toEqual({
      kind: "custom",
      from: "2026-09-21",
      to: "2026-09-27",
    });
    expect(customPeriodSeed(null, NOW)).toEqual({ kind: "custom", from: "2026-08-29", to: "2026-09-27" });
    expect(customPeriodSeed({ kind: "custom", from: "2026-09-10", to: null }, NOW)).toEqual({
      kind: "custom",
      from: "2026-09-10",
      to: "2026-09-27",
    });
  });
});

describe("toLeadFilters", () => {
  it("converte o estado padrão", () => {
    expect(toLeadFilters(EMPTY_LEAD_LIST_PARAMS, NOW)).toEqual({
      sortBy: "created_at",
      sortDir: "desc",
      page: 1,
      pageSize: 20,
    });
  });

  it("converte filtros e período em instantes UTC do fuso da clínica (fim exclusivo)", () => {
    const filters = toLeadFilters(
      params({
        q: "(77) 98765",
        status: ["novo"],
        source: ["google_ads"],
        service: ["implante"],
        period: { kind: "custom", from: "2026-09-01", to: "2026-09-10" },
        sort: { column: "name", dir: "asc" },
        page: 3,
      }),
      NOW,
    );
    expect(filters).toEqual({
      search: "(77) 98765",
      status: ["novo"],
      source: ["google_ads"],
      service: ["implante"],
      createdFrom: "2026-09-01T03:00:00.000Z",
      createdTo: "2026-09-11T03:00:00.000Z",
      sortBy: "name",
      sortDir: "asc",
      page: 3,
      pageSize: 20,
    });
  });

  it("período aberto só tem início; atalhos usam o dia de hoje", () => {
    const open = toLeadFilters(params({ period: { kind: "custom", from: "2026-09-20", to: null } }), NOW);
    expect(open.createdFrom).toBe("2026-09-20T03:00:00.000Z");
    expect(open.createdTo).toBeUndefined();

    const today = toLeadFilters(params({ period: { kind: "preset", key: "today" } }), NOW);
    expect(today.createdFrom).toBe("2026-09-27T03:00:00.000Z");
    expect(today.createdTo).toBe("2026-09-28T03:00:00.000Z");
  });

  it("gera a mesma chave de consulta ao longo do dia (sem refazer a busca a cada minuto)", () => {
    const state = params({ period: { kind: "preset", key: "7d" } });
    const morning = normalizeLeadFilters(toLeadFilters(state, "2026-09-27T11:00:00.000Z"));
    const evening = normalizeLeadFilters(toLeadFilters(state, "2026-09-28T02:00:00.000Z"));
    expect(evening).toEqual(morning);
  });
});
