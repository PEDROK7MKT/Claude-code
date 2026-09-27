import { describe, expect, it } from "vitest";
import { buildReportChartSpecs } from "./charts";
import { buildReportKpis } from "./kpis";
import { buildReportPdf, reportPdfFileName, type ReportPdfChart, type ReportPdfInput } from "./pdf";
import { buildMonthReport } from "./report";
import { buildReportSummary } from "./summary";
import { DEFAULT_REPORT_SORT, sortReportLeads } from "./table";
import { leadsOnDays, makeGmn, makeLead, makeMetric } from "./test-fixtures";

/** PNG 1×1 válido (o jsPDF decodifica a imagem de verdade). */
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** Converte o texto esperado para os bytes WinAnsi que o jsPDF grava no stream. */
function winAnsi(text: string): string {
  const map: Record<string, string> = { "—": "\u0097", "–": "\u0096", "…": "\u0085", "“": "\u0093", "”": "\u0094" };
  return [...text].map((c) => map[c] ?? c).join("");
}

function makeInput(leadCount: number, withCharts: boolean): ReportPdfInput {
  const leads = [
    makeLead({
      name: "João Conceição 😊",
      status: "nao_compareceu",
      scheduled_at: "2026-03-12T17:30:00.000Z",
      service: "canal",
      keyword: "dentista barreiras",
      created_at: "2026-03-02T15:00:00.000Z",
    }),
    ...leadsOnDays(Math.max(0, leadCount - 1), "2026-03-01", { status: "agendado", scheduled_at: "2026-03-30T12:00:00.000Z" }),
  ].slice(0, leadCount);
  const report = buildMonthReport({
    monthKey: "2026-03",
    today: "2026-09-27",
    leads,
    previousLeads: leadsOnDays(3, "2026-02-02"),
    metrics: [makeMetric({ date: "2026-03-02", cost: 300 })],
    previousMetrics: [],
    gmnMetrics: [makeGmn()],
  });
  const charts: ReportPdfChart[] = withCharts
    ? buildReportChartSpecs(report)
        .filter((s) => s.available)
        .map((spec) => ({ ...spec, image: { dataUrl: PIXEL, width: 640, height: 260 } }))
    : [];
  return {
    report,
    kpis: buildReportKpis(report),
    summary: buildReportSummary(report),
    leads: sortReportLeads(leads, DEFAULT_REPORT_SORT),
    charts,
    clinicName: "Instituto Décio Carrilho",
    crmName: "IDC CRM",
    generatedAt: new Date("2026-09-27T17:32:00.000Z"),
  };
}

describe("buildReportPdf", () => {
  it("gera um A4 com cabeçalho, KPIs, resumo, tabela e rodapé numerado", () => {
    const doc = buildReportPdf(makeInput(2, false), { compress: false });
    const out = doc.output();
    const pages = doc.getNumberOfPages();

    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    expect(out).toContain("(Instituto Décio Carrilho)");
    expect(out).toContain(winAnsi("(Relatório mensal — março de 2026)"));
    expect(out).toContain("Gerado em 27/09/2026 às 14:32");
    expect(out).toContain("(Indicadores do mês)");
    expect(out).toContain("(Leads totais)");
    expect(out).toContain("(Nota GMN)");
    expect(out).toContain("(Resumo automático)");
    expect(out).toContain("(Leads do período)");
    // emoji removido do nome; acentos preservados
    expect(out).toContain("(João Conceição)");
    expect(out).toContain("(não compareceu)");
    expect(out).toContain("(Total: 2 leads)");
    expect(out).toContain(`(Página 1 de ${pages})`);
    // nenhum texto desenhado caiu no modo UTF-16 (sinal de caractere sem glifo na Helvetica)
    const textOps = out.split("\n").filter((line) => line.endsWith(" Tj"));
    expect(textOps.length).toBeGreaterThan(20);
    expect(textOps.filter((line) => line.startsWith("(þÿ"))).toEqual([]);
  });

  it("inclui as imagens dos gráficos e as legendas", () => {
    const doc = buildReportPdf(makeInput(4, true), { compress: false });
    const out = doc.output();
    expect(out).toContain("/Subtype /Image");
    expect(out).toContain("(Gráficos do período)");
    expect(out).toContain("(Leads por fonte)");
    expect(out).toContain(winAnsi("(Google Ads: conversões × leads no CRM)"));
    expect(out).toContain("(Tendência)");
  });

  it("quebra páginas na tabela longa e numera todas", () => {
    const doc = buildReportPdf(makeInput(90, true), { compress: false });
    const pages = doc.getNumberOfPages();
    expect(pages).toBeGreaterThanOrEqual(3);
    const out = doc.output();
    for (let page = 1; page <= pages; page++) expect(out).toContain(`(Página ${page} de ${pages})`);
    expect(out).toContain("(Total: 90 leads)");
  });

  it("funciona sem leads", () => {
    const doc = buildReportPdf(makeInput(0, false), { compress: false });
    expect(doc.output()).toContain("(Nenhum lead no período.)");
  });

  it("nome do arquivo", () => {
    expect(reportPdfFileName("2026-03")).toBe("relatorio-IDC-2026-03.pdf");
  });
});
