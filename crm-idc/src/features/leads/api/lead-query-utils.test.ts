import { describe, expect, it } from "vitest";
import { PAGE_SIZE, QUERY_KEYS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { transitionErrorMessage } from "@/lib/lead-status";
import type { Lead, LeadHistory } from "@/types/database";
import {
  INVALID_PHONE_MESSAGE,
  applyOptimisticLead,
  applyStatusChange,
  buildLeadSearchFilter,
  escapeLikePattern,
  findLeadInCaches,
  leadKeys,
  normalizeLeadFilters,
  normalizeLeadsQueryOptions,
  pageCountFor,
  quotePostgrestValue,
  replaceLeadInData,
  sanitizeLeadFields,
  validateStatusChange,
  type LeadsPage,
} from "./lead-query-utils";
import { chunk, fetchInBatches } from "./supabase-helpers";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    name: "Maria Silva",
    phone: "77987654321",
    notes: null,
    source: "google_ads",
    campaign: null,
    keyword: null,
    ad_group: null,
    landing_page: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    service: null,
    service_detail: null,
    status: "novo",
    contacted_at: null,
    scheduled_at: null,
    confirmed_at: null,
    attended_at: null,
    estimated_value: null,
    parent_lead_id: null,
    created_by: null,
    assigned_to: null,
    created_at: "2026-03-10T15:00:00Z",
    updated_at: "2026-03-10T15:00:00Z",
    ...overrides,
  };
}

const NOW = "2026-03-12T12:00:00.000Z";

describe("normalizeLeadFilters / leadKeys", () => {
  it("aplica padrões", () => {
    expect(normalizeLeadFilters()).toEqual({ sortBy: "created_at", sortDir: "desc", page: 1, pageSize: PAGE_SIZE });
  });

  it("ordena/deduplica arrays e descarta vazios", () => {
    expect(
      normalizeLeadFilters({
        search: "  maria   silva ",
        status: ["agendado", "novo", "agendado"],
        source: [],
        service: ["canal"],
        createdFrom: " ",
        sortDir: "asc",
        sortBy: "name",
        page: 3.7,
        pageSize: 50,
      }),
    ).toEqual({
      search: "maria silva",
      status: ["agendado", "novo"],
      service: ["canal"],
      sortBy: "name",
      sortDir: "asc",
      page: 3,
      pageSize: 50,
    });
  });

  it("protege sortBy, page e pageSize", () => {
    const f = normalizeLeadFilters({ sortBy: "drop table" as keyof Lead, page: -2, pageSize: 100_000 });
    expect(f.sortBy).toBe("created_at");
    expect(f.page).toBe(1);
    expect(f.pageSize).toBe(1000);
    expect(normalizeLeadFilters({ page: Number.NaN, pageSize: 0 })).toMatchObject({ page: 1, pageSize: 1 });
  });

  it("filtros equivalentes geram a mesma chave, sempre sob ['leads']", () => {
    expect(leadKeys.list({ status: ["novo", "agendado"] })).toEqual(leadKeys.list({ status: ["agendado", "novo"], page: 1 }));
    for (const key of [
      leadKeys.list({}),
      leadKeys.collection({}),
      leadKeys.detail("x"),
      leadKeys.history("x"),
      leadKeys.newCount(),
      leadKeys.byPhone("77987654321"),
    ]) {
      expect(key[0]).toBe(QUERY_KEYS.leads[0]);
    }
    expect(leadKeys.detail("x")).toEqual(QUERY_KEYS.lead("x"));
  });

  it("normalizeLeadsQueryOptions", () => {
    expect(normalizeLeadsQueryOptions({ status: ["confirmado", "agendado"], limit: 10.9, createdTo: "", source: [] })).toEqual({
      status: ["agendado", "confirmado"],
      limit: 10,
    });
  });
});

describe("busca no PostgREST", () => {
  it("escapa curingas do LIKE e aspas/barras do PostgREST", () => {
    expect(escapeLikePattern("50%_off\\")).toBe("50\\%\\_off\\\\");
    expect(quotePostgrestValue('a"b\\c')).toBe('"a\\"b\\\\c"');
  });

  it("nome com vírgulas e parênteses fica entre aspas", () => {
    expect(buildLeadSearchFilter("Silva, Maria (filha)")).toBe('name.ilike."%Silva, Maria (filha)%"');
  });

  it("% e _ digitados são literais", () => {
    expect(buildLeadSearchFilter("50%_off")).toBe('name.ilike."%50\\\\%\\\\_off%"');
  });

  it("termo com cara de telefone busca também nos dígitos", () => {
    expect(buildLeadSearchFilter("(77) 98765")).toBe('name.ilike."%(77) 98765%",phone.ilike.%7798765%');
    expect(buildLeadSearchFilter("+55 77 98765-4321")).toBe('name.ilike."%+55 77 98765-4321%",phone.ilike.%77987654321%');
  });

  it("nomes com números não buscam no telefone; 1 dígito também não", () => {
    expect(buildLeadSearchFilter("Maria 2")).toBe('name.ilike."%Maria 2%"');
    expect(buildLeadSearchFilter("7")).toBe('name.ilike."%7%"');
  });

  it("vazio → null", () => {
    expect(buildLeadSearchFilter("")).toBeNull();
    expect(buildLeadSearchFilter("   ")).toBeNull();
    expect(buildLeadSearchFilter(undefined)).toBeNull();
  });
});

describe("sanitizeLeadFields", () => {
  it("remove campos controlados pelo banco e normaliza", () => {
    const out = sanitizeLeadFields({
      name: "  Maria   Silva ",
      phone: "+55 (77) 98765-4321",
      source: "google_ads",
      campaign: "idc_implante",
      keyword: "  ",
      notes: " dor no dente ",
      service: "" as never,
      status: "agendado",
      created_by: "someone",
      contacted_at: "2026-01-01",
    } as Parameters<typeof sanitizeLeadFields>[0]);
    expect(out).toEqual({
      name: "Maria Silva",
      phone: "77987654321",
      source: "google_ads",
      campaign: "IDC | Implante Dentário",
      keyword: null,
      notes: "dor no dente",
      service: null,
    });
  });

  it("só inclui chaves presentes", () => {
    expect(sanitizeLeadFields({ notes: "x" })).toEqual({ notes: "x" });
    expect(sanitizeLeadFields({})).toEqual({});
  });

  it("telefone inválido e nome vazio lançam AppError", () => {
    expect(() => sanitizeLeadFields({ phone: "123" })).toThrow(new AppError(INVALID_PHONE_MESSAGE));
    expect(() => sanitizeLeadFields({ name: "   " })).toThrow(AppError);
    expect(() => sanitizeLeadFields({ source: "" as never })).toThrow(AppError);
  });

  it("scheduled_at e estimated_value", () => {
    expect(sanitizeLeadFields({ scheduled_at: "2026-03-10T14:30:00-03:00" })).toEqual({
      scheduled_at: "2026-03-10T17:30:00.000Z",
    });
    expect(sanitizeLeadFields({ scheduled_at: "" })).toEqual({ scheduled_at: null });
    expect(() => sanitizeLeadFields({ scheduled_at: "amanhã" })).toThrow(AppError);
    expect(sanitizeLeadFields({ estimated_value: 1500.456 })).toEqual({ estimated_value: 1500.46 });
    expect(sanitizeLeadFields({ estimated_value: null })).toEqual({ estimated_value: null });
    expect(() => sanitizeLeadFields({ estimated_value: -1 })).toThrow(AppError);
  });
});

describe("validateStatusChange", () => {
  it("mesmo status", () => {
    expect(() => validateStatusChange({ status: "novo" }, { to: "novo" })).toThrow('O lead já está como "novo".');
  });

  it("transição proibida usa a mensagem da regra 2", () => {
    expect(() => validateStatusChange({ status: "novo" }, { to: "agendado", scheduledAt: NOW })).toThrow(
      transitionErrorMessage("novo", "agendado"),
    );
  });

  it("agendar exige data/hora válida (regra 3)", () => {
    expect(() => validateStatusChange({ status: "em_contato" }, { to: "agendado" })).toThrow(/data e hora/);
    expect(() => validateStatusChange({ status: "em_contato" }, { to: "agendado", scheduledAt: "  " })).toThrow(/data e hora/);
    expect(() => validateStatusChange({ status: "em_contato" }, { to: "agendado", scheduledAt: "xyz" })).toThrow(/inválida/);
    expect(validateStatusChange({ status: "em_contato" }, { to: "agendado", scheduledAt: "2026-03-20T17:30:00Z", note: "  " })).toEqual({
      scheduledAt: "2026-03-20T17:30:00.000Z",
      note: null,
    });
  });

  it("outros status ignoram scheduledAt e limpam a nota", () => {
    expect(validateStatusChange({ status: "novo" }, { to: "em_contato", scheduledAt: NOW, note: " ligou " })).toEqual({
      scheduledAt: null,
      note: "ligou",
    });
  });
});

describe("applyStatusChange (espelho do trigger)", () => {
  it("em_contato define contacted_at só se vazio", () => {
    expect(applyStatusChange(makeLead(), "em_contato", null, NOW)).toMatchObject({
      status: "em_contato",
      contacted_at: NOW,
      updated_at: NOW,
    });
    const already = makeLead({ status: "perdido", contacted_at: "2026-03-01T00:00:00Z" });
    expect(applyStatusChange(already, "em_contato", null, NOW).contacted_at).toBe("2026-03-01T00:00:00Z");
  });

  it("agendado define data, zera confirmação/comparecimento", () => {
    const lead = makeLead({
      status: "nao_compareceu",
      contacted_at: "2026-03-01T00:00:00Z",
      confirmed_at: "2026-03-05T00:00:00Z",
      scheduled_at: "2026-03-06T13:00:00Z",
    });
    expect(applyStatusChange(lead, "agendado", "2026-03-20T13:00:00.000Z", NOW)).toMatchObject({
      status: "agendado",
      scheduled_at: "2026-03-20T13:00:00.000Z",
      contacted_at: "2026-03-01T00:00:00Z",
      confirmed_at: null,
      attended_at: null,
    });
  });

  it("confirmado e compareceu definem suas datas", () => {
    expect(applyStatusChange(makeLead({ status: "agendado" }), "confirmado", null, NOW).confirmed_at).toBe(NOW);
    expect(applyStatusChange(makeLead({ status: "confirmado" }), "compareceu", null, NOW).attended_at).toBe(NOW);
  });

  it("não altera o objeto original", () => {
    const lead = makeLead();
    applyStatusChange(lead, "perdido", null, NOW);
    expect(lead.status).toBe("novo");
  });
});

describe("cache: replace/find", () => {
  const a = makeLead({ id: "a" });
  const b = makeLead({ id: "b", name: "Bruno" });
  const page: LeadsPage = { rows: [a, b], total: 2, page: 1, pageCount: 1, pageSize: 20 };

  it("substitui em detalhe, array e página sem mutar", () => {
    const updated = { ...b, name: "Bruno Souza" };
    expect(replaceLeadInData(b, updated)).toEqual(updated);
    expect(replaceLeadInData([a, b], updated)).toEqual([a, updated]);
    const newPage = replaceLeadInData(page, updated) as LeadsPage;
    expect(newPage.rows[1].name).toBe("Bruno Souza");
    expect(page.rows[1].name).toBe("Bruno");
  });

  it("retorna undefined quando o lead não está no dado", () => {
    const other = makeLead({ id: "z" });
    expect(replaceLeadInData(a, other)).toBeUndefined();
    expect(replaceLeadInData([a, b], other)).toBeUndefined();
    expect(replaceLeadInData(page, other)).toBeUndefined();
    expect(replaceLeadInData(5, other)).toBeUndefined();
    expect(replaceLeadInData(undefined, other)).toBeUndefined();
  });

  it("findLeadInCaches prefere o detalhe", () => {
    const fresh = { ...b, status: "em_contato" as const };
    expect(
      findLeadInCaches(
        [
          [["leads", "list", {}], page],
          [["leads", "detail", "b"], fresh],
        ],
        "b",
      ),
    ).toBe(fresh);
    expect(findLeadInCaches([[["leads", "collection", {}], [a, b]]], "a")).toBe(a);
    expect(findLeadInCaches([[["leads", "list", {}], page]], "nope")).toBeUndefined();
  });
});

describe("applyOptimisticLead", () => {
  const lead = makeLead({ id: "a", status: "novo" });
  const next = applyStatusChange(lead, "em_contato", null, NOW);
  const other = makeLead({ id: "b" });

  it("decrementa o contador de novos", () => {
    expect(applyOptimisticLead(QUERY_KEYS.newLeadsCount, 5, next, "novo")).toBe(4);
    expect(applyOptimisticLead(QUERY_KEYS.newLeadsCount, 0, next, "novo")).toBe(0);
    const notNew = applyStatusChange(makeLead({ status: "agendado" }), "confirmado", null, NOW);
    expect(applyOptimisticLead(QUERY_KEYS.newLeadsCount, 5, notNew, "agendado")).toBeUndefined();
  });

  it("remove de listas filtradas por status que não inclui o novo status", () => {
    const page: LeadsPage = { rows: [lead, other], total: 21, page: 1, pageCount: 2, pageSize: 20 };
    const result = applyOptimisticLead(leadKeys.list({ status: ["novo"] }), page, next, "novo") as LeadsPage;
    expect(result.rows.map((r) => r.id)).toEqual(["b"]);
    expect(result.total).toBe(20);
    expect(result.pageCount).toBe(1);

    const collection = applyOptimisticLead(leadKeys.collection({ status: ["novo"] }), [lead, other], next, "novo");
    expect((collection as Lead[]).map((r) => r.id)).toEqual(["b"]);
  });

  it("substitui em listas sem filtro de status ou cujo filtro inclui o novo status", () => {
    const page: LeadsPage = { rows: [lead, other], total: 2, page: 1, pageCount: 1, pageSize: 20 };
    const all = applyOptimisticLead(leadKeys.list({}), page, next, "novo") as LeadsPage;
    expect(all.rows[0].status).toBe("em_contato");
    const kanban = applyOptimisticLead(leadKeys.collection({}), [lead, other], next, "novo") as Lead[];
    expect(kanban[0].status).toBe("em_contato");
    const filtered = applyOptimisticLead(leadKeys.list({ status: ["em_contato", "novo"] }), page, next, "novo") as LeadsPage;
    expect(filtered.rows).toHaveLength(2);
    expect(applyOptimisticLead(leadKeys.detail("a"), lead, next, "novo")).toEqual(next);
  });

  it("ignora histórico, dados vazios e queries sem o lead", () => {
    const history: LeadHistory[] = [
      { id: "h1", lead_id: "a", old_status: null, new_status: "novo", changed_by: null, note: null, created_at: NOW },
    ];
    expect(applyOptimisticLead(leadKeys.history("a"), history, next, "novo")).toBeUndefined();
    expect(applyOptimisticLead(leadKeys.list({}), undefined, next, "novo")).toBeUndefined();
    expect(applyOptimisticLead(leadKeys.detail("b"), other, next, "novo")).toBeUndefined();
  });
});

describe("helpers", () => {
  it("pageCountFor", () => {
    expect(pageCountFor(0, 20)).toBe(1);
    expect(pageCountFor(20, 20)).toBe(1);
    expect(pageCountFor(21, 20)).toBe(2);
  });

  it("chunk", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it("fetchInBatches busca até acabar, respeita limit e remove repetidos", async () => {
    const data = Array.from({ length: 2500 }, (_, i) => ({ id: String(i) }));
    const calls: Array<[number, number]> = [];
    const fetchRange = async (from: number, to: number) => {
      calls.push([from, to]);
      return data.slice(from, to + 1);
    };
    const all = await fetchInBatches(fetchRange);
    expect(all).toHaveLength(2500);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);

    calls.length = 0;
    const limited = await fetchInBatches(fetchRange, { limit: 1500 });
    expect(limited).toHaveLength(1500);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1499],
    ]);

    // lote exato de 1000 exige mais uma chamada (vazia) para saber que acabou
    calls.length = 0;
    const exact = await fetchInBatches(async (from, to) => {
      calls.push([from, to]);
      return data.slice(0, 1000).slice(from, to + 1);
    });
    expect(exact).toHaveLength(1000);
    expect(calls).toHaveLength(2);

    const shifted = await fetchInBatches(
      // 2º lote "deslocado" por uma inserção concorrente repete o id 2
      async (from) => (from === 0 ? [{ id: "1" }, { id: "2" }] : [{ id: "2" }, { id: "3" }]),
      { batchSize: 2, limit: 3, getKey: (r) => r.id },
    );
    expect(shifted.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});
