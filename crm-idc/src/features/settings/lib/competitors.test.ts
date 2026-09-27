import { describe, expect, it } from "vitest";
import { COMPETITORS } from "@/lib/constants";
import {
  MAX_COMPETITORS,
  competitorsToDrafts,
  describeCompetitorSummary,
  draftsDiffer,
  emptyCompetitorDraft,
  formatDraftField,
  isSelfName,
  moveItem,
  parseRatingText,
  parseReviewsText,
  sameCompetitors,
  summarizeCompetitors,
  validateCompetitorDrafts,
  type CompetitorDraft,
} from "./competitors";

const ids = (i: number) => `row-${i}`;
const draft = (id: string, name: string, rating: string, reviews: string): CompetitorDraft => ({ id, name, rating, reviews });

describe("parseRatingText", () => {
  it("aceita vírgula ou ponto e uma casa decimal", () => {
    expect(parseRatingText("4,9")).toEqual({ ok: true, value: 4.9 });
    expect(parseRatingText("4.9")).toEqual({ ok: true, value: 4.9 });
    expect(parseRatingText(" 5 ")).toEqual({ ok: true, value: 5 });
    expect(parseRatingText("0")).toEqual({ ok: true, value: 0 });
    expect(parseRatingText("4,90")).toEqual({ ok: true, value: 4.9 });
  });

  it("rejeita vazio, fora de 0–5, texto e duas casas", () => {
    expect(parseRatingText("")).toMatchObject({ ok: false, error: "Informe a nota." });
    expect(parseRatingText("5,1")).toMatchObject({ ok: false, error: expect.stringMatching(/entre 0 e 5/) });
    expect(parseRatingText("-1")).toMatchObject({ ok: false });
    expect(parseRatingText("abc")).toMatchObject({ ok: false });
    expect(parseRatingText("4,95")).toMatchObject({ ok: false, error: expect.stringMatching(/uma casa decimal/) });
  });
});

describe("parseReviewsText", () => {
  it("aceita inteiros com ou sem separador de milhar", () => {
    expect(parseReviewsText("304")).toEqual({ ok: true, value: 304 });
    expect(parseReviewsText("1.234")).toEqual({ ok: true, value: 1234 });
    expect(parseReviewsText("1 234")).toEqual({ ok: true, value: 1234 });
    expect(parseReviewsText("0")).toEqual({ ok: true, value: 0 });
  });

  it("rejeita vazio, negativo, decimal e valores enormes", () => {
    expect(parseReviewsText("")).toMatchObject({ ok: false });
    expect(parseReviewsText("-3")).toMatchObject({ ok: false, error: "Não pode ser negativo." });
    expect(parseReviewsText("12,5")).toMatchObject({ ok: false });
    expect(parseReviewsText("12.34")).toMatchObject({ ok: false });
    expect(parseReviewsText("99999999")).toMatchObject({ ok: false, error: "Valor muito alto." });
  });
});

describe("competitorsToDrafts / validateCompetitorDrafts", () => {
  it("ida e volta preserva a lista padrão", () => {
    const drafts = competitorsToDrafts(COMPETITORS, ids);
    expect(drafts[0]).toEqual({ id: "row-0", name: "Dental Studio", rating: "5,0", reviews: "304" });
    const result = validateCompetitorDrafts(drafts);
    expect(result.errorCount).toBe(0);
    expect(result.competitors).toEqual(COMPETITORS);
    expect(draftsDiffer(drafts, COMPETITORS)).toBe(false);
  });

  it("aponta erros por linha e bloqueia o salvamento", () => {
    const result = validateCompetitorDrafts([
      draft("a", "  Oralprime ", "5", "253"),
      draft("b", "oralprime", "4,9", "10"),
      draft("c", "", "7", "x"),
      draft("d", "Instituto Décio Carrilho", "4,9", "100"),
    ]);
    expect(result.competitors).toBeNull();
    expect(result.errors.a).toBeUndefined();
    expect(result.errors.b).toEqual({ name: "Concorrente repetido." });
    expect(result.errors.c).toEqual({
      name: "Informe o nome.",
      rating: "A nota deve estar entre 0 e 5.",
      reviews: expect.any(String),
    });
    expect(result.errors.d?.name).toMatch(/IDC/);
    expect(result.errorCount).toBe(5);
  });

  it("limpa espaços do nome e respeita a ordem da tela", () => {
    const result = validateCompetitorDrafts([draft("a", "  Sorria   Bahia ", "4.9", "1.062"), draft("b", "Z", "3", "0")]);
    expect(result.competitors).toEqual([
      { name: "Sorria Bahia", rating: 4.9, reviews: 1062 },
      { name: "Z", rating: 3, reviews: 0 },
    ]);
  });

  it("lista vazia é válida; acima do limite não", () => {
    expect(validateCompetitorDrafts([]).competitors).toEqual([]);
    const many = Array.from({ length: MAX_COMPETITORS + 1 }, (_, i) => draft(`r${i}`, `Clínica ${i}`, "4", "1"));
    const result = validateCompetitorDrafts(many);
    expect(result.competitors).toBeNull();
    expect(result.formError).toMatch(/no máximo/);
  });

  it("formatDraftField padroniza ao sair do campo", () => {
    expect(formatDraftField("rating", "4.9")).toBe("4,9");
    expect(formatDraftField("rating", "5")).toBe("5,0");
    expect(formatDraftField("rating", "abc")).toBe("abc");
    expect(formatDraftField("reviews", "1062")).toBe("1.062");
    expect(formatDraftField("reviews", "-1")).toBe("-1");
    expect(competitorsToDrafts([{ name: "X", rating: 4, reviews: 1062 }], ids)[0].reviews).toBe("1.062");
  });

  it("emptyCompetitorDraft", () => {
    expect(emptyCompetitorDraft("x")).toEqual({ id: "x", name: "", rating: "", reviews: "" });
  });
});

describe("draftsDiffer / sameCompetitors", () => {
  it("detecta alterações, linhas novas e inválidas", () => {
    const drafts = competitorsToDrafts(COMPETITORS, ids);
    expect(draftsDiffer([{ ...drafts[0], rating: "4,9" }, ...drafts.slice(1)], COMPETITORS)).toBe(true);
    expect(draftsDiffer([...drafts, emptyCompetitorDraft("n")], COMPETITORS)).toBe(true);
    expect(draftsDiffer([{ ...drafts[0], reviews: "abc" }, ...drafts.slice(1)], COMPETITORS)).toBe(true);
    // formato diferente, mesmo valor
    expect(draftsDiffer([{ ...drafts[0], rating: "5" }, ...drafts.slice(1)], COMPETITORS)).toBe(false);
  });

  it("sameCompetitors considera a ordem", () => {
    expect(sameCompetitors(COMPETITORS, [...COMPETITORS])).toBe(true);
    expect(sameCompetitors(COMPETITORS, moveItem(COMPETITORS, 0, 1))).toBe(false);
  });
});

describe("moveItem", () => {
  it("move para cima e para baixo", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 1)).toEqual(["a", "c", "b"]);
  });

  it("ignora índices inválidos sem mutar a original", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, 5)).toEqual(["a", "b"]);
    expect(moveItem(list, -1, 0)).toEqual(["a", "b"]);
    expect(moveItem(list, 1, 1)).not.toBe(list);
  });
});

describe("resumo", () => {
  it("média, total e líder", () => {
    const summary = summarizeCompetitors(COMPETITORS);
    expect(summary.count).toBe(7);
    expect(summary.totalReviews).toBe(1412);
    expect(summary.leader?.name).toBe("Quero Sorrir");
    expect(summary.averageRating).toBeCloseTo(4.9429, 3);
    expect(describeCompetitorSummary(summary)).toBe("7 concorrentes · média 4,9 ★ · 1.412 avaliações");
  });

  it("lista vazia", () => {
    const summary = summarizeCompetitors([]);
    expect(summary).toEqual({ count: 0, averageRating: null, totalReviews: 0, leader: null });
    expect(describeCompetitorSummary(summary)).toBe("Nenhum concorrente cadastrado");
  });

  it("isSelfName ignora acentos e caixa", () => {
    expect(isSelfName(" idc ")).toBe(true);
    expect(isSelfName("INSTITUTO DECIO  CARRILHO")).toBe(true);
    expect(isSelfName("IDC Odonto Center")).toBe(false);
  });
});
