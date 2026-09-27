import { describe, expect, it } from "vitest";
import { COMPETITORS } from "@/lib/constants";
import {
  buildCompetitorRanking,
  nextStepMessage,
  ordinal,
  pluralize,
  progressToLeader,
  rankingGapMessage,
  rankingHeadline,
} from "./ranking";

describe("buildCompetitorRanking", () => {
  it("posiciona o IDC entre os concorrentes da spec (exemplo do enunciado)", () => {
    const r = buildCompetitorRanking(COMPETITORS, { rating: 4.9, reviews: 197 });
    expect(r.entries.map((e) => e.name)).toEqual([
      "Quero Sorrir",
      "Dental Studio",
      "Oralprime",
      "DENTEBRAS",
      "IDC",
      "Dr. Giullian Braun",
      "+Sorriso",
      "Sorria Bahia",
    ]);
    expect(r.idc?.position).toBe(5);
    expect(r.total).toBe(8);
    expect(r.leader?.name).toBe("Quero Sorrir");
    expect(r.gapToLeader).toBe(116);
    expect(r.nextAbove?.name).toBe("DENTEBRAS");
    expect(r.gapToNext).toBe(16);
    expect(r.maxReviews).toBe(313);
    expect(rankingHeadline(r)).toBe("IDC está em 5º de 8 em número de avaliações");
    expect(rankingGapMessage(r)).toBe("faltam 116 avaliações para alcançar Quero Sorrir");
    expect(nextStepMessage(r)).toBe("faltam 17 avaliações para passar DENTEBRAS");
  });

  it("desempata pela nota quando o número de avaliações é igual", () => {
    const r = buildCompetitorRanking(
      [
        { name: "A", rating: 4.8, reviews: 100 },
        { name: "B", rating: 5.0, reviews: 100 },
      ],
      { rating: 4.9, reviews: 100 },
    );
    expect(r.entries.map((e) => [e.name, e.position])).toEqual([
      ["B", 1],
      ["IDC", 2],
      ["A", 3],
    ]);
    expect(r.gapToLeader).toBe(0);
    expect(rankingGapMessage(r)).toBe("mesmo número de avaliações que B, que tem nota maior");
  });

  it("empate exato divide a posição e mostra o IDC primeiro", () => {
    const r = buildCompetitorRanking([{ name: "Rival", rating: 4.9, reviews: 50 }], { rating: 4.9, reviews: 50 });
    expect(r.entries.map((e) => [e.name, e.position])).toEqual([
      ["IDC", 1],
      ["Rival", 1],
    ]);
    expect(r.nextAbove).toBeNull();
    expect(r.leadMargin).toBe(0);
    expect(rankingHeadline(r)).toBe("IDC está em 1º de 2 em número de avaliações (empatado)");
    expect(rankingGapMessage(r)).toBe("empatado em avaliações com Rival, com nota igual ou maior");
  });

  it("IDC na liderança mostra a vantagem sobre o segundo colocado", () => {
    const r = buildCompetitorRanking(COMPETITORS, { rating: 4.9, reviews: 320 });
    expect(r.idc?.position).toBe(1);
    expect(r.leader?.isIdc).toBe(true);
    expect(r.gapToLeader).toBe(0);
    expect(r.runnerUp?.name).toBe("Quero Sorrir");
    expect(rankingGapMessage(r)).toBe("7 avaliações à frente de Quero Sorrir");
    expect(nextStepMessage(r)).toBeNull();
    expect(progressToLeader(r)).toBe(100);
  });

  it("singular quando falta uma avaliação e não repete o líder no próximo degrau", () => {
    const r = buildCompetitorRanking([{ name: "Líder", rating: 5, reviews: 10 }], { rating: 5, reviews: 9 });
    expect(rankingGapMessage(r)).toBe("falta 1 avaliação para alcançar Líder");
    expect(nextStepMessage(r)).toBeNull();
    expect(progressToLeader(r)).toBe(90);
  });

  it("sem dados do IDC lista só os concorrentes", () => {
    const r = buildCompetitorRanking(COMPETITORS, null);
    expect(r.idc).toBeNull();
    expect(r.total).toBe(7);
    expect(r.gapToLeader).toBeNull();
    expect(rankingHeadline(r)).toBeNull();
    expect(rankingGapMessage(r)).toBeNull();
    expect(progressToLeader(r)).toBeNull();
  });

  it("ignora concorrente que representa a própria clínica e nomes vazios", () => {
    const r = buildCompetitorRanking(
      [
        { name: " idc ", rating: 4.9, reviews: 999 },
        { name: "Instituto Décio Carrilho", rating: 4.9, reviews: 999 },
        { name: "  ", rating: 5, reviews: 10 },
        { name: "Outra", rating: 5, reviews: 10 },
      ],
      { rating: null, reviews: 5 },
    );
    expect(r.entries.map((e) => e.name)).toEqual(["Outra", "IDC"]);
    expect(r.idc?.rating).toBeNull();
  });

  it("só o IDC (sem concorrentes)", () => {
    const r = buildCompetitorRanking([], { rating: 4.9, reviews: 10 });
    expect(r.idc?.position).toBe(1);
    expect(rankingHeadline(r)).toBe("IDC ainda não tem concorrentes cadastrados para comparação");
    expect(rankingGapMessage(r)).toBeNull();
    expect(progressToLeader(r)).toBeNull();
  });
});

describe("helpers de texto", () => {
  it("ordinal e plural", () => {
    expect(ordinal(5)).toBe("5º");
    expect(pluralize(1, "avaliação", "avaliações")).toBe("1 avaliação");
    expect(pluralize(1200, "avaliação", "avaliações")).toBe("1.200 avaliações");
  });
});
