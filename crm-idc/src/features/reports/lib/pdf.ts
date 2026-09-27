/**
 * Relatório mensal em PDF (A4, retrato) gerado no navegador com jsPDF +
 * jspdf-autotable: cabeçalho com a clínica, KPIs, resumo automático, gráficos
 * (imagens PNG capturadas dos SVGs da página), tabela de leads com status
 * coloridos e rodapé "Página X de Y". Carregue este módulo com import() — o
 * jsPDF só entra no bundle quando o usuário exporta.
 */
import { jsPDF } from "jspdf";
import { autoTable, type CellHookData } from "jspdf-autotable";

import { BRAND, SERVICE_LABEL, SOURCE_LABEL, STATUS_META } from "@/lib/constants";
import { formatDate, formatDateKey, formatDateTime, formatTime } from "@/lib/dates";
import { formatNumber, formatPhone } from "@/lib/format";
import type { Lead, LeadStatus } from "@/types/database";
import type { ChartLegendItem, ReportChartSpec } from "./charts";
import { changeTone, formatChange, type ReportKpi } from "./kpis";
import { monthName } from "./month";
import { formatReportPeriod, type MonthReport } from "./report";
import { hexToRgb, shade, tint, toPdfText, type Rgb } from "./pdf-text";
import { isStaleAppointment, reportTableTotals } from "./table";

// -----------------------------------------------------------------------------
// Layout (mm) e cores
// -----------------------------------------------------------------------------

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
/** Início do conteúdo nas páginas seguintes (abaixo do cabeçalho corrido) */
const CONTENT_TOP = 20;
/** Limite inferior do conteúdo (acima do rodapé) */
const CONTENT_BOTTOM = PAGE_H - 18;
const PT_TO_MM = 0.3528;

const C = {
  primary: hexToRgb(BRAND.primary),
  accent: hexToRgb(BRAND.accent),
  text: hexToRgb(BRAND.text),
  muted: hexToRgb(BRAND.muted),
  border: [229, 231, 235] as Rgb,
  surface: [249, 250, 251] as Rgb,
  footer: [243, 244, 246] as Rgb,
  white: [255, 255, 255] as Rgb,
  good: [21, 128, 61] as Rgb,
  bad: [185, 28, 28] as Rgb,
  summaryBg: tint(BRAND.primary, 0.94),
};

// -----------------------------------------------------------------------------
// Tipos públicos
// -----------------------------------------------------------------------------

export interface PdfChartImage {
  /** data:image/png;base64,… */
  dataUrl: string;
  /** Dimensões em px do SVG original (proporção da imagem) */
  width: number;
  height: number;
}

export interface ReportPdfChart extends ReportChartSpec {
  image: PdfChartImage;
}

export type ReportPdfLead = Pick<
  Lead,
  "id" | "name" | "phone" | "source" | "service" | "status" | "created_at" | "scheduled_at"
>;

export interface ReportPdfInput {
  report: MonthReport;
  kpis: readonly ReportKpi[];
  /** Parágrafos do resumo automático */
  summary: readonly string[];
  /** Leads na ordem desejada da tabela */
  leads: readonly ReportPdfLead[];
  charts: readonly ReportPdfChart[];
  clinicName: string;
  crmName?: string;
  generatedAt?: Date;
}

export interface BuildReportPdfOptions {
  /** Compressão dos streams (desligue nos testes para inspecionar o texto) */
  compress?: boolean;
}

// -----------------------------------------------------------------------------
// Helpers de desenho
// -----------------------------------------------------------------------------

interface Ctx {
  doc: jsPDF;
  y: number;
}

function textColor(doc: jsPDF, [r, g, b]: Rgb): void {
  doc.setTextColor(r, g, b);
}

function fillColor(doc: jsPDF, [r, g, b]: Rgb): void {
  doc.setFillColor(r, g, b);
}

function drawColor(doc: jsPDF, [r, g, b]: Rgb): void {
  doc.setDrawColor(r, g, b);
}

function font(doc: jsPDF, size: number, style: "normal" | "bold" | "italic" = "normal"): void {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
}

function lineHeight(size: number, factor = 1.35): number {
  return size * PT_TO_MM * factor;
}

/** Texto numa linha só, com reticências se não couber em `maxWidth`. */
function fitText(doc: jsPDF, value: string, maxWidth: number): string {
  const text = toPdfText(value);
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

function wrap(doc: jsPDF, value: string, maxWidth: number): string[] {
  const lines: unknown = doc.splitTextToSize(toPdfText(value), maxWidth);
  return Array.isArray(lines) ? lines.map(String) : [String(lines)];
}

/** Quebra de página quando o próximo bloco não cabe. */
function ensureSpace(ctx: Ctx, height: number): void {
  if (ctx.y + height > CONTENT_BOTTOM) {
    ctx.doc.addPage();
    ctx.y = CONTENT_TOP;
  }
}

function reportTitle(report: MonthReport): string {
  return `Relatório mensal — ${report.monthLabel}`;
}

function generatedLabel(date: Date): string {
  return `Gerado em ${formatDate(date)} às ${formatTime(date)}`;
}

// -----------------------------------------------------------------------------
// Seções
// -----------------------------------------------------------------------------

function drawCover(ctx: Ctx, input: ReportPdfInput, generatedAt: Date): void {
  const { doc } = ctx;
  const { report } = input;
  const bandH = 32;

  fillColor(doc, C.primary);
  doc.rect(0, 0, PAGE_W, bandH, "F");
  fillColor(doc, C.accent);
  doc.rect(0, bandH, PAGE_W, 1.2, "F");

  const rightW = 62;
  textColor(doc, C.white);
  font(doc, 16, "bold");
  doc.text(fitText(doc, input.clinicName, CONTENT_W - rightW - 4), MARGIN, 13);
  font(doc, 11);
  doc.text(toPdfText(reportTitle(report)), MARGIN, 20.5);

  font(doc, 8);
  const period = `Período: ${formatReportPeriod(report)}${
    report.isPartial ? ` · mês em andamento (dados até ${formatDateKey(report.throughKey)})` : ""
  }`;
  doc.text(fitText(doc, period, CONTENT_W - rightW - 4), MARGIN, 26.5);

  const right = PAGE_W - MARGIN;
  doc.text(toPdfText(generatedLabel(generatedAt)), right, 13, { align: "right" });
  if (input.crmName) doc.text(fitText(doc, input.crmName, rightW), right, 20.5, { align: "right" });

  ctx.y = bandH + 10;
}

/** Título de seção; `keepWithNext` evita título órfão no fim da página. */
function drawSectionTitle(ctx: Ctx, title: string, subtitle?: string, keepWithNext = 12): void {
  const { doc } = ctx;
  ensureSpace(ctx, (subtitle ? 15.5 : 10.5) + keepWithNext);
  textColor(doc, C.primary);
  font(doc, 12, "bold");
  doc.text(toPdfText(title), MARGIN, ctx.y + 4);
  fillColor(doc, C.accent);
  doc.rect(MARGIN, ctx.y + 6.2, 14, 0.8, "F");
  ctx.y += 10.5;
  if (subtitle) {
    textColor(doc, C.muted);
    font(doc, 8);
    doc.text(fitText(doc, subtitle, CONTENT_W), MARGIN, ctx.y);
    ctx.y += 5;
  }
}

function drawKpiGrid(ctx: Ctx, kpis: readonly ReportKpi[], report: MonthReport): void {
  const { doc } = ctx;
  const cols = 4;
  const gap = 3.5;
  const cardW = (CONTENT_W - gap * (cols - 1)) / cols;
  const cardH = 25;
  const pad = 3.5;
  const innerW = cardW - pad * 2;
  const vsLabel = `vs ${monthName(report.previousMonthKey)}`;

  for (let i = 0; i < kpis.length; i += cols) {
    ensureSpace(ctx, cardH);
    kpis.slice(i, i + cols).forEach((kpi, col) => {
      const x = MARGIN + col * (cardW + gap);
      const y = ctx.y;
      fillColor(doc, C.surface);
      drawColor(doc, C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD");

      textColor(doc, C.muted);
      font(doc, 7.2);
      doc.text(fitText(doc, kpi.label, innerW), x + pad, y + 5.5);

      textColor(doc, C.text);
      font(doc, 14, "bold");
      doc.text(fitText(doc, kpi.value, innerW), x + pad, y + 13.2);

      let lineY = y + 18.4;
      if (kpi.change !== undefined) {
        const formatted = formatChange(kpi.change);
        const tone = changeTone(kpi.change, kpi.invertChange);
        font(doc, 7.2, "bold");
        textColor(doc, formatted === null ? C.muted : tone === "good" ? C.good : tone === "bad" ? C.bad : C.muted);
        doc.text(
          fitText(doc, formatted === null ? "sem base de comparação" : `${formatted} ${vsLabel}`, innerW),
          x + pad,
          lineY,
        );
        lineY += 3.8;
      }
      if (kpi.hint) {
        textColor(doc, C.muted);
        font(doc, 6.6);
        doc.text(fitText(doc, kpi.hint, innerW), x + pad, lineY);
      }
    });
    ctx.y += cardH + gap;
  }
  ctx.y += 2;
}

function drawSummary(ctx: Ctx, paragraphs: readonly string[]): void {
  const { doc } = ctx;
  const size = 9.5;
  const lh = lineHeight(size, 1.45);
  const padX = 5;
  const padY = 5;
  const paragraphGap = 2.5;
  font(doc, size);
  const blocks = paragraphs.map((p) => wrap(doc, p, CONTENT_W - padX * 2 - 1.5));
  const linesCount = blocks.reduce((sum, lines) => sum + lines.length, 0);
  const boxH = padY * 2 + linesCount * lh + Math.max(0, blocks.length - 1) * paragraphGap - (lh - size * PT_TO_MM);

  ensureSpace(ctx, Math.min(boxH, 40));
  const fitsOnPage = ctx.y + boxH <= CONTENT_BOTTOM;
  if (fitsOnPage) {
    fillColor(doc, C.summaryBg);
    doc.roundedRect(MARGIN, ctx.y, CONTENT_W, boxH, 2, 2, "F");
    fillColor(doc, C.primary);
    doc.rect(MARGIN, ctx.y, 1.2, boxH, "F");
  }

  let y = ctx.y + padY + size * PT_TO_MM;
  textColor(doc, C.text);
  font(doc, size);
  blocks.forEach((lines, index) => {
    if (index > 0) y += paragraphGap;
    for (const line of lines) {
      if (y > CONTENT_BOTTOM) {
        doc.addPage();
        y = CONTENT_TOP + size * PT_TO_MM;
        textColor(doc, C.text);
        font(doc, size);
      }
      doc.text(line, MARGIN + padX + 1.5, y);
      y += lh;
    }
  });
  ctx.y = (fitsOnPage ? ctx.y + boxH : y) + 6;
}

/** Desenha (ou só mede, com draw=false) a legenda em linhas; retorna a altura usada. */
function legendBlock(doc: jsPDF, items: readonly ChartLegendItem[], x: number, y: number, maxW: number, draw: boolean): number {
  if (!items.length) return 0;
  const size = 7.2;
  const rowH = 4.6;
  const swatch = 2.6;
  font(doc, size);
  let cx = x;
  let cy = y;
  for (const item of items) {
    const label = toPdfText(item.label);
    const value = item.value ? toPdfText(item.value) : "";
    font(doc, size);
    const labelW = doc.getTextWidth(label);
    font(doc, size, "bold");
    const valueW = value ? doc.getTextWidth(value) + 1.5 : 0;
    const itemW = swatch + 1.6 + labelW + valueW + 5;
    if (cx > x && cx + itemW > x + maxW) {
      cx = x;
      cy += rowH;
    }
    if (draw) {
      const [r, g, b] = hexToRgb(item.color);
      if (item.line) {
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.6);
        if (item.line === "dashed") doc.setLineDashPattern([0.9, 0.7], 0);
        doc.line(cx, cy - 0.9, cx + swatch + 0.6, cy - 0.9);
        doc.setLineDashPattern([], 0);
      } else {
        doc.setFillColor(r, g, b);
        doc.roundedRect(cx, cy - 2.2, swatch, swatch, 0.5, 0.5, "F");
      }
      textColor(doc, C.text);
      font(doc, size);
      doc.text(label, cx + swatch + 1.6, cy);
      if (value) {
        textColor(doc, C.muted);
        font(doc, size, "bold");
        doc.text(value, cx + swatch + 1.6 + labelW + 1.5, cy);
      }
    }
    cx += itemW;
  }
  return cy - y + rowH;
}

interface ChartBox {
  chart: ReportPdfChart;
  x: number;
  width: number;
  imgW: number;
  imgH: number;
  descLines: string[];
  legendH: number;
  height: number;
}

const CHART_PAD = 4;

function measureChart(doc: jsPDF, chart: ReportPdfChart, x: number, width: number, maxImgH: number): ChartBox {
  const inner = width - CHART_PAD * 2;
  const ratio = chart.image.height / Math.max(1, chart.image.width);
  let imgW = inner;
  let imgH = inner * ratio;
  if (imgH > maxImgH) {
    imgH = maxImgH;
    imgW = imgH / ratio;
  }
  font(doc, 7.4);
  const descLines = wrap(doc, chart.description, inner).slice(0, 2);
  const legendH = legendBlock(doc, chart.legend, 0, 0, inner, false);
  const height = CHART_PAD + 4.5 + descLines.length * 3.4 + 2 + imgH + (legendH ? legendH + 2 : 0) + CHART_PAD;
  return { chart, x, width, imgW, imgH, descLines, legendH, height };
}

function drawChartBox(doc: jsPDF, box: ChartBox, y: number, rowH: number): void {
  const { chart, x, width } = box;
  const inner = width - CHART_PAD * 2;
  fillColor(doc, C.white);
  drawColor(doc, C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, rowH, 2, 2, "FD");

  let cy = y + CHART_PAD + 3.2;
  textColor(doc, C.text);
  font(doc, 9.5, "bold");
  doc.text(fitText(doc, chart.title, inner), x + CHART_PAD, cy);
  cy += 1.3;
  textColor(doc, C.muted);
  font(doc, 7.4);
  for (const line of box.descLines) {
    cy += 3.4;
    doc.text(line, x + CHART_PAD, cy);
  }
  cy += 2;
  const imgX = x + CHART_PAD + (inner - box.imgW) / 2;
  doc.addImage(chart.image.dataUrl, "PNG", imgX, cy, box.imgW, box.imgH, undefined, "FAST");
  cy += box.imgH + 2;
  if (box.legendH) legendBlock(doc, chart.legend, x + CHART_PAD, cy + 2.6, inner, true);
}

/** Agrupa os gráficos em linhas: dois "half" seguidos dividem a linha. */
function layoutChartRows(doc: jsPDF, charts: readonly ReportPdfChart[]): ChartBox[][] {
  const gap = 5;
  const halfW = (CONTENT_W - gap) / 2;
  const rows: ChartBox[][] = [];
  let i = 0;
  while (i < charts.length) {
    const chart = charts[i];
    const next = charts[i + 1];
    if (chart.span === "half" && next?.span === "half") {
      rows.push([measureChart(doc, chart, MARGIN, halfW, 50), measureChart(doc, next, MARGIN + halfW + gap, halfW, 50)]);
      i += 2;
    } else {
      rows.push([measureChart(doc, chart, MARGIN, CONTENT_W, chart.span === "half" ? 60 : 52)]);
      i += 1;
    }
  }
  return rows;
}

function rowHeight(row: readonly ChartBox[]): number {
  return Math.max(...row.map((b) => b.height));
}

function drawChartSection(ctx: Ctx, charts: readonly ReportPdfChart[]): void {
  const { doc } = ctx;
  const rows = layoutChartRows(doc, charts);
  if (!rows.length) return;
  drawSectionTitle(ctx, "Gráficos do período", undefined, rowHeight(rows[0]));
  for (const row of rows) {
    const height = rowHeight(row);
    ensureSpace(ctx, height);
    for (const box of row) drawChartBox(doc, box, ctx.y, height);
    ctx.y += height + 5;
  }
}

const TABLE_HEAD = ["Nome", "Telefone", "Fonte", "Serviço", "Status", "Entrada", "Agendamento"];
const STATUS_COLUMN = 4;
const APPOINTMENT_COLUMN = 6;

function drawStatusPill(doc: jsPDF, data: CellHookData, status: LeadStatus): void {
  const meta = STATUS_META[status];
  const label = toPdfText(meta.label);
  const size = 6.6;
  font(doc, size, "bold");
  const textW = doc.getTextWidth(label);
  const h = 4.6;
  const w = Math.min(textW + 5.4, data.cell.width - 2);
  const x = data.cell.x + 1.6;
  const cy = data.cell.y + data.cell.height / 2;
  fillColor(doc, tint(meta.color, 0.85));
  doc.roundedRect(x, cy - h / 2, w, h, h / 2, h / 2, "F");
  fillColor(doc, hexToRgb(meta.color));
  doc.circle(x + 1.9, cy, 0.75, "F");
  textColor(doc, shade(meta.color, 0.4));
  doc.text(label, x + 3.3, cy + size * PT_TO_MM * 0.35);
}

function drawLeadsTable(ctx: Ctx, leads: readonly ReportPdfLead[]): void {
  const { doc } = ctx;
  if (!leads.length) {
    ensureSpace(ctx, 10);
    textColor(doc, C.muted);
    font(doc, 9);
    doc.text("Nenhum lead no período.", MARGIN, ctx.y + 4);
    ctx.y += 10;
    return;
  }

  const totals = reportTableTotals(leads);
  const body = leads.map((lead) => [
    toPdfText(lead.name).trim(),
    formatPhone(lead.phone),
    toPdfText(SOURCE_LABEL[lead.source] ?? lead.source),
    toPdfText(lead.service ? (SERVICE_LABEL[lead.service] ?? lead.service) : "—"),
    toPdfText(STATUS_META[lead.status]?.label ?? lead.status),
    formatDateTime(lead.created_at),
    lead.scheduled_at ? formatDateTime(lead.scheduled_at) : "—",
  ]);
  const foot = [
    [
      toPdfText(`Total: ${formatNumber(totals.leads)} ${totals.leads === 1 ? "lead" : "leads"}`),
      "",
      toPdfText(`${formatNumber(totals.sources)} ${totals.sources === 1 ? "fonte" : "fontes"}`),
      toPdfText(`${formatNumber(totals.services)} ${totals.services === 1 ? "serviço" : "serviços"}`),
      toPdfText(`${formatNumber(totals.scheduled)} ${totals.scheduled === 1 ? "agendado" : "agendados"}`),
      "",
      toPdfText(`${formatNumber(totals.withAppointment)} ${totals.withAppointment === 1 ? "consulta" : "consultas"}`),
    ],
  ];

  autoTable(doc, {
    startY: ctx.y,
    margin: { top: CONTENT_TOP, bottom: PAGE_H - CONTENT_BOTTOM, left: MARGIN, right: MARGIN },
    head: [TABLE_HEAD.map((h) => toPdfText(h))],
    body,
    foot,
    theme: "plain",
    showHead: "everyPage",
    showFoot: "lastPage",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: 7.4,
      textColor: C.text,
      cellPadding: { top: 1.8, bottom: 1.8, left: 1.8, right: 1.8 },
      lineColor: C.border,
      lineWidth: { bottom: 0.15 },
      overflow: "linebreak",
      valign: "middle",
      minCellHeight: 7,
    },
    headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: "bold", lineWidth: 0 },
    footStyles: { fillColor: C.footer, textColor: C.text, fontStyle: "bold", lineWidth: 0 },
    alternateRowStyles: { fillColor: C.surface },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: "bold" },
      1: { cellWidth: 24 },
      2: { cellWidth: 22 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === STATUS_COLUMN) {
        // o texto vira uma "pílula" colorida em didDrawCell
        data.cell.text = [""];
      }
      if (data.column.index === APPOINTMENT_COLUMN && isStaleAppointment(leads[data.row.index])) {
        data.cell.styles.textColor = C.muted;
        data.cell.styles.fontStyle = "italic";
      }
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === STATUS_COLUMN) {
        const lead = leads[data.row.index];
        if (lead) drawStatusPill(doc, data, lead.status);
      }
    },
    didDrawPage: (data) => {
      if (data.cursor) ctx.y = data.cursor.y;
    },
  });
  ctx.y += 6;
}

/** Cabeçalho corrido (páginas 2+) e rodapé com numeração em todas as páginas. */
function drawPageChrome(doc: jsPDF, input: ReportPdfInput, generatedAt: Date): void {
  const total = doc.getNumberOfPages();
  const title = toPdfText(reportTitle(input.report));
  const footerLeft = toPdfText(`${generatedLabel(generatedAt)}${input.crmName ? ` · ${input.crmName}` : ""}`);
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setLineDashPattern([], 0);
    if (page > 1) {
      textColor(doc, C.primary);
      font(doc, 8, "bold");
      doc.text(fitText(doc, input.clinicName, CONTENT_W / 2 - 2), MARGIN, 10.5);
      textColor(doc, C.muted);
      font(doc, 8);
      doc.text(title, PAGE_W - MARGIN, 10.5, { align: "right" });
      drawColor(doc, C.border);
      doc.setLineWidth(0.25);
      doc.line(MARGIN, 13.5, PAGE_W - MARGIN, 13.5);
    }
    drawColor(doc, C.border);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, PAGE_H - 13, PAGE_W - MARGIN, PAGE_H - 13);
    textColor(doc, C.muted);
    font(doc, 7.5);
    doc.text(footerLeft, MARGIN, PAGE_H - 8.5);
    doc.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, PAGE_H - 8.5, { align: "right" });
  }
}

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

/** Monta o documento (sem salvar) — útil para testes e pré-visualização. */
export function buildReportPdf(input: ReportPdfInput, options: BuildReportPdfOptions = {}): jsPDF {
  const generatedAt = input.generatedAt ?? new Date();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: options.compress ?? true });
  doc.setProperties({
    title: toPdfText(`${reportTitle(input.report)} · ${input.clinicName}`),
    subject: toPdfText(`Relatório mensal de leads, Google Ads e Google Meu Negócio — ${input.report.monthLabel}`),
    author: toPdfText(input.clinicName),
    creator: toPdfText(input.crmName ?? input.clinicName),
  });

  const ctx: Ctx = { doc, y: 0 };
  drawCover(ctx, input, generatedAt);

  drawSectionTitle(ctx, "Indicadores do mês", `Variações em relação a ${input.report.previousMonthLabel}`, 25);
  drawKpiGrid(ctx, input.kpis, input.report);

  if (input.summary.length) {
    drawSectionTitle(ctx, "Resumo automático", undefined, 30);
    drawSummary(ctx, input.summary);
  }

  drawChartSection(ctx, input.charts);

  const count = input.leads.length;
  drawSectionTitle(
    ctx,
    "Leads do período",
    `${formatNumber(count)} ${count === 1 ? "lead" : "leads"} com o status atual`,
    count ? 30 : 10,
  );
  drawLeadsTable(ctx, input.leads);

  drawPageChrome(doc, input, generatedAt);
  return doc;
}

/** relatorio-IDC-2026-03.pdf */
export function reportPdfFileName(monthKey: string): string {
  return `relatorio-IDC-${monthKey}.pdf`;
}

/** Gera e baixa o PDF no navegador. */
export function exportReportPdf(input: ReportPdfInput): string {
  const fileName = reportPdfFileName(input.report.monthKey);
  buildReportPdf(input).save(fileName);
  return fileName;
}
