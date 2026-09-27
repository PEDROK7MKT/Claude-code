import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";
import type { Lead } from "@/types/database";
import { buildMonthReport, type MonthReportInput } from "./report";
import { buildReportSummary, countLabel, shareLabel, summaryToText } from "./summary";
import { leadsOnDays, makeGmn, makeLead, makeMetric } from "./test-fixtures";

function summaryFor(input: Partial<MonthReportInput>, subject?: string): string[] {
  const report = buildMonthReport({ monthKey: "2026-03", today: "2026-09-27", leads: [], ...input });
  return buildReportSummary(report, subject ? { subject } : undefined);
}

/** Março: 10 leads (6 Google Ads), 4 agendados, 2 compareceram, 1 faltou, 1 novo, 1 perdido. */
function marchLeads(): Lead[] {
  return [
    ...leadsOnDays(2, "2026-03-02", {
      status: "compareceu",
      scheduled_at: "2026-03-10T12:00:00.000Z",
      keyword: "dentista barreiras",
      service: "implante",
    }),
    ...leadsOnDays(1, "2026-03-04", {
      status: "nao_compareceu",
      scheduled_at: "2026-03-11T12:00:00.000Z",
      keyword: "[dentista barreiras]",
      service: "implante",
    }),
    ...leadsOnDays(2, "2026-03-05", { status: "agendado", scheduled_at: "2026-03-25T12:00:00.000Z", keyword: "canal urgente" }),
    ...leadsOnDays(1, "2026-03-08", { status: "em_contato", keyword: "dentista barreiras" }),
    ...leadsOnDays(1, "2026-03-09", { status: "novo", source: "instagram", service: "canal" }),
    ...leadsOnDays(2, "2026-03-12", { status: "em_contato", source: "gmn" }),
    ...leadsOnDays(1, "2026-03-15", { status: "perdido", source: "indicacao" }),
  ];
}

describe("buildReportSummary — cenário completo", () => {
  const march = marchLeads();
  const february = leadsOnDays(8, "2026-02-02");
  const all = [...march, ...february];
  const [first, second] = summaryFor({
    leads: all,
    previousLeads: all,
    // um lançamento em cada dia com lead do Google Ads (regra 7: o custo real cruza os mesmos dias)
    metrics: [
      ...["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-08"].map((date, i) =>
        makeMetric({ date, cost: 50, clicks: 20, impressions: 500, conversions: i === 0 || i === 3 ? 2 : 1 }),
      ),
    ],
    previousMetrics: [],
    gmnMetrics: [makeGmn({ total_reviews: 188, new_reviews: 5, average_rating: 4.9 })],
  });

  it("abre com volume e comparação com o mês anterior", () => {
    expect(first).toContain("Em março de 2026 o IDC recebeu 10 leads (+25% em relação a fevereiro).");
  });

  it("descreve o funil com plural e percentuais", () => {
    expect(first).toContain("4 agendaram consulta (40%).");
    expect(first).toContain("2 compareceram e 1 faltou (comparecimento de 67%).");
    expect(first).toContain("1 lead ainda aguarda o primeiro contato.");
    expect(first).toContain("1 foi marcado como perdido.");
  });

  it("traz investimento, CPL real, fonte, palavra-chave, serviço e GMN", () => {
    expect(second).toContain(`O investimento no Google Ads foi de ${formatCurrency(300)}, com 120 cliques (CTR de 4%).`);
    expect(second).toContain(
      `O Google Ads trouxe 6 leads, com custo real de ${formatCurrency(50)} por lead e ${formatCurrency(75)} por agendamento.`,
    );
    expect(second).toContain("A plataforma contabilizou 8 conversões para 6 leads reais no CRM.");
    expect(second).toContain("A principal fonte foi Google Ads, com 6 leads (60%).");
    expect(second).toContain("A principal palavra-chave foi “dentista barreiras” (4 leads).");
    expect(second).toContain("O serviço mais procurado foi Implante Dentário (3 leads).");
    expect(second).toContain("No Google Meu Negócio, a nota é 4,9 com 188 avaliações (5 novas em março).");
  });
});

describe("buildReportSummary — singular e zero", () => {
  it("um único lead", () => {
    const [first, second] = summaryFor({ leads: [makeLead({ source: "instagram" })] });
    expect(first).toBe("Em março de 2026 o IDC recebeu 1 lead. O lead ainda não agendou consulta. 1 lead ainda aguarda o primeiro contato.");
    expect(second).toBe("O lead veio de Instagram.");
  });

  it("um agendamento e um comparecimento no singular", () => {
    const leads = [
      makeLead({ status: "compareceu", scheduled_at: "2026-03-12T12:00:00.000Z" }),
      makeLead({ status: "em_contato" }),
    ];
    const [first] = summaryFor({ leads });
    expect(first).toContain("1 agendou consulta (50%).");
    expect(first).toContain("1 compareceu à consulta, sem faltas registradas (comparecimento de 100%).");
  });

  it("agendados sem consultas concluídas", () => {
    const [first] = summaryFor({
      leads: leadsOnDays(2, "2026-03-02", { status: "agendado", scheduled_at: "2026-03-30T12:00:00.000Z" }),
    });
    expect(first).toContain("2 agendaram consulta (100%). Ainda não há comparecimentos registrados.");
  });

  it("só faltas", () => {
    const [first] = summaryFor({
      leads: leadsOnDays(2, "2026-03-02", { status: "nao_compareceu", scheduled_at: "2026-03-10T12:00:00.000Z" }),
    });
    expect(first).toContain("2 faltaram à consulta e ninguém compareceu até agora (comparecimento de 0%).");
  });

  it("nenhum agendamento com vários leads", () => {
    const [first] = summaryFor({ leads: leadsOnDays(3, "2026-03-02", { status: "em_contato" }) });
    expect(first).toContain("Nenhum deles agendou consulta até agora.");
  });

  it("mês sem leads, com e sem mês anterior", () => {
    const withPrevious = summaryFor({ leads: [], previousLeads: leadsOnDays(3, "2026-02-02") });
    expect(withPrevious[0]).toBe("Em março de 2026 o IDC não recebeu leads (em fevereiro foram 3 leads).");

    const alone = summaryFor({ leads: [] });
    expect(alone).toEqual(["Em março de 2026 o IDC não recebeu leads."]);
  });
});

describe("buildReportSummary — comparação", () => {
  it("sem mês anterior disponível não compara", () => {
    const [first] = summaryFor({ leads: leadsOnDays(2, "2026-03-02") });
    expect(first.startsWith("Em março de 2026 o IDC recebeu 2 leads.")).toBe(true);
    expect(first).not.toContain("em relação");
  });

  it("mês anterior sem leads", () => {
    const [first] = summaryFor({ leads: leadsOnDays(2, "2026-03-02"), previousLeads: [] });
    expect(first).toContain("recebeu 2 leads (fevereiro não teve leads para comparação).");
  });

  it("queda e estabilidade", () => {
    const down = [...leadsOnDays(3, "2026-03-02"), ...leadsOnDays(4, "2026-02-02")];
    expect(summaryFor({ leads: down, previousLeads: down })[0]).toContain("(-25% em relação a fevereiro)");

    const same = [...leadsOnDays(2, "2026-03-02"), ...leadsOnDays(2, "2026-02-02")];
    expect(summaryFor({ leads: same, previousLeads: same })[0]).toContain("(o mesmo volume de fevereiro)");
  });
});

describe("buildReportSummary — Google Ads", () => {
  it("sem métricas lançadas, com leads do Google Ads", () => {
    const [, second] = summaryFor({ leads: leadsOnDays(2, "2026-03-02"), metrics: [] });
    expect(second).toContain(
      "O Google Ads trouxe 2 leads, mas não há métricas de investimento lançadas para março de 2026, então o custo por lead não pôde ser calculado.",
    );
  });

  it("sem métricas lançadas e sem leads do Google Ads", () => {
    const [, second] = summaryFor({ leads: leadsOnDays(1, "2026-03-02", { source: "gmn" }), metrics: [] });
    expect(second).toContain("Não há métricas do Google Ads lançadas para março de 2026.");
  });

  it("métricas indisponíveis (erro) não geram frase de Google Ads", () => {
    const [, second] = summaryFor({ leads: leadsOnDays(1, "2026-03-02", { source: "gmn" }), metrics: null });
    expect(second).toBe("O lead veio de Google Meu Negócio.");
  });

  it("investimento sem leads do Google Ads", () => {
    const [, second] = summaryFor({
      leads: leadsOnDays(1, "2026-03-02", { source: "gmn" }),
      metrics: [makeMetric({ date: "2026-03-02", cost: 80, clicks: 0, impressions: 0, conversions: 0 })],
    });
    expect(second).toContain(`O investimento no Google Ads foi de ${formatCurrency(80)}.`);
    expect(second).toContain("Nenhum lead do Google Ads foi registrado no CRM no período.");
  });

  it("dias lançados sem custo", () => {
    const [, second] = summaryFor({
      leads: leadsOnDays(1, "2026-03-02"),
      metrics: [makeMetric({ date: "2026-03-02", cost: 0, conversions: 0 })],
    });
    expect(second).toContain("Não houve investimento registrado no Google Ads em março de 2026. Ainda assim, o Google Ads trouxe 1 lead.");
  });

  it("regra 7: leads do Google Ads em dias sem métricas ficam fora do custo real (e a frase avisa)", () => {
    const [, second] = summaryFor({
      leads: [...leadsOnDays(2, "2026-03-02", { status: "agendado", scheduled_at: "2026-03-20T12:00:00.000Z" }), ...leadsOnDays(3, "2026-03-20")],
      metrics: [
        makeMetric({ date: "2026-03-02", cost: 60, clicks: 0, impressions: 0, conversions: 0 }),
        makeMetric({ date: "2026-03-03", cost: 40, clicks: 0, impressions: 0, conversions: 0 }),
      ],
    });
    expect(second).toContain(
      `O Google Ads trouxe 5 leads, com custo real de ${formatCurrency(50)} por lead e ${formatCurrency(50)} por agendamento.`,
    );
    expect(second).toContain("3 deles chegaram em dias sem métricas lançadas e ficaram fora desse cálculo.");
  });

  it("regra 7: todos os leads do Google Ads em dias sem métricas", () => {
    const [, second] = summaryFor({
      leads: leadsOnDays(2, "2026-03-20"),
      metrics: [makeMetric({ date: "2026-03-02", cost: 80, clicks: 0, impressions: 0, conversions: 0 })],
    });
    expect(second).toContain(
      "O Google Ads trouxe 2 leads, todos em dias sem métricas lançadas, então o custo real por lead não pôde ser calculado.",
    );
  });

  it("singular: 1 lead do Google Ads e 1 conversão", () => {
    const [, second] = summaryFor({
      leads: [makeLead({ status: "em_contato" })],
      metrics: [makeMetric({ date: "2026-03-10", cost: 42.1, clicks: 1, impressions: 10, conversions: 1 })],
    });
    expect(second).toContain(`O Google Ads trouxe 1 lead, com custo real de ${formatCurrency(42.1)} por lead.`);
    expect(second).toContain("com 1 clique (CTR de 10%)");
    expect(second).toContain("A plataforma contabilizou 1 conversão para 1 lead real no CRM.");
  });
});

describe("buildReportSummary — outros", () => {
  it("empate entre as duas principais fontes", () => {
    const leads = [...leadsOnDays(2, "2026-03-02", { source: "gmn" }), ...leadsOnDays(2, "2026-03-05", { source: "instagram" })];
    expect(summaryFor({ leads })[1]).toContain("As principais fontes foram Google Meu Negócio e Instagram, com 2 leads cada.");
  });

  it("mês em andamento e sujeito personalizado", () => {
    const report = buildMonthReport({ monthKey: "2026-09", today: "2026-09-27", leads: leadsOnDays(2, "2026-09-02") });
    expect(buildReportSummary(report, { subject: "a clínica" })[0]).toContain(
      "Em setembro de 2026 a clínica recebeu 2 leads até agora.",
    );
  });

  it("GMN sem nota e avaliação no singular", () => {
    const [, second] = summaryFor({
      leads: [makeLead({ source: "gmn" })],
      gmnMetrics: [makeGmn({ average_rating: null, total_reviews: 1, new_reviews: 0 })],
    });
    expect(second).toContain("No Google Meu Negócio, a clínica soma 1 avaliação.");
  });

  it("helpers de texto", () => {
    expect(countLabel(1, "lead", "leads")).toBe("1 lead");
    expect(countLabel(1250, "lead", "leads")).toBe("1.250 leads");
    expect(shareLabel(18, 47)).toBe("38%");
    expect(shareLabel(1, 0)).toBe("0%");
    expect(summaryToText(["a", "b"])).toBe("a\n\nb");
  });
});
