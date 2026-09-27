import { describe, expect, it } from "vitest";
import type { GmnMetric } from "@/types/database";
import {
  counterInputError,
  emptyGmnFormValues,
  formValuesToInput,
  gmnFormSchema,
  metricToFormValues,
  parseCounterInput,
  parseRatingInput,
  ratingInputError,
  suggestNewReviews,
  type GmnFormValues,
} from "./gmn-form";

const valid: GmnFormValues = {
  period: { from: "2026-08-01", to: "2026-08-31" },
  search_views: "2.200",
  maps_views: "900",
  website_clicks: "100",
  direction_requests: "45",
  phone_calls: "40",
  total_reviews: "197",
  average_rating: "4,9",
  new_reviews: "12",
  notes: "  respondemos todas ",
};

function issues(values: GmnFormValues): Record<string, string> {
  const result = gmnFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("contadores", () => {
  it("aceita inteiros com separador de milhar pt-BR", () => {
    expect(parseCounterInput("1.520")).toBe(1520);
    expect(parseCounterInput("1 520")).toBe(1520);
    expect(parseCounterInput(" 0 ")).toBe(0);
    expect(parseCounterInput("1.234.567")).toBe(1234567);
  });

  it("rejeita vazio, decimais, negativos e texto", () => {
    expect(counterInputError("")).toMatch(/use 0/);
    expect(counterInputError("1,5")).toMatch(/inteiros/);
    expect(counterInputError("1.5")).toMatch(/inteiros/);
    expect(counterInputError("-3")).toMatch(/inteiros/);
    expect(counterInputError("abc")).toMatch(/inteiros/);
    expect(counterInputError("...")).toMatch(/inteiros/);
    expect(counterInputError("99999999999")).toMatch(/muito alto/);
    expect(parseCounterInput("1,5")).toBeNull();
  });
});

describe("nota média", () => {
  it("aceita vírgula ou ponto, uma casa decimal, 0 a 5", () => {
    expect(parseRatingInput("4,9")).toBe(4.9);
    expect(parseRatingInput("4.9")).toBe(4.9);
    expect(parseRatingInput("5")).toBe(5);
    expect(parseRatingInput("  ")).toBeNull();
  });

  it("rejeita fora da faixa, mais de uma casa e texto", () => {
    expect(ratingInputError("5,1")).toMatch(/entre 0 e 5/);
    expect(ratingInputError("4,85")).toMatch(/uma casa decimal/);
    expect(ratingInputError("quatro")).toMatch(/ex\.: 4,9/);
    expect(parseRatingInput("4,85")).toBeUndefined();
  });
});

describe("gmnFormSchema", () => {
  it("valores válidos passam", () => {
    expect(issues(valid)).toEqual({});
  });

  it("exige período e contadores", () => {
    const errors = issues({ ...emptyGmnFormValues(), average_rating: "" });
    expect(errors.period).toBe("Selecione o período.");
    expect(errors.search_views).toMatch(/use 0/);
    expect(errors.average_rating).toBeUndefined();
  });

  it("avaliações novas não podem passar do total", () => {
    expect(issues({ ...valid, new_reviews: "300" }).new_reviews).toMatch(/mais que o total/);
  });

  it("período invertido é inválido", () => {
    expect(issues({ ...valid, period: { from: "2026-08-31", to: "2026-08-01" } }).period).toMatch(/depois do início/);
  });
});

describe("conversões", () => {
  const metric: GmnMetric = {
    id: "m1",
    period_start: "2026-08-01",
    period_end: "2026-08-31",
    search_views: 2200,
    maps_views: 900,
    website_clicks: 100,
    direction_requests: 45,
    phone_calls: 40,
    total_reviews: 197,
    average_rating: 4.9,
    new_reviews: 12,
    notes: null,
    created_by: null,
    created_at: "2026-09-01T12:00:00Z",
    updated_at: "2026-09-01T12:00:00Z",
  };

  it("registro → formulário (nota com vírgula, notas vazias)", () => {
    expect(metricToFormValues(metric)).toEqual({
      period: { from: "2026-08-01", to: "2026-08-31" },
      search_views: "2200",
      maps_views: "900",
      website_clicks: "100",
      direction_requests: "45",
      phone_calls: "40",
      total_reviews: "197",
      average_rating: "4,9",
      new_reviews: "12",
      notes: "",
    });
    expect(metricToFormValues({ ...metric, average_rating: null }).average_rating).toBe("");
  });

  it("formulário → entrada do hook (com id na edição)", () => {
    expect(formValuesToInput(valid)).toEqual({
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      search_views: 2200,
      maps_views: 900,
      website_clicks: 100,
      direction_requests: 45,
      phone_calls: 40,
      total_reviews: 197,
      average_rating: 4.9,
      new_reviews: 12,
      notes: "respondemos todas",
    });
    const edited = formValuesToInput({ ...valid, average_rating: "", notes: " " }, "m1");
    expect(edited.id).toBe("m1");
    expect(edited.average_rating).toBeNull();
    expect(edited.notes).toBeNull();
  });

  it("ida e volta preserva os valores", () => {
    const input = formValuesToInput(metricToFormValues(metric), metric.id);
    expect(input).toMatchObject({ id: "m1", search_views: 2200, average_rating: 4.9, notes: null });
  });

  it("sugestão de avaliações novas", () => {
    expect(suggestNewReviews(197, 185)).toBe(12);
    expect(suggestNewReviews(180, 185)).toBe(0);
    expect(suggestNewReviews(null, 185)).toBeNull();
    expect(suggestNewReviews(197, undefined)).toBeNull();
  });
});
