/**
 * Resumo automático do relatório em português natural (singular/plural, meses
 * sem leads, sem métricas do Google Ads, sem mês anterior). Funções puras.
 */
import { formatCurrency, formatDecimal, formatNumber, formatPercent, percentChange } from "@/lib/format";
import { monthName } from "./month";
import type { MonthReport } from "./report";

export interface SummaryOptions {
  /** Sujeito das frases, com artigo ("o IDC") */
  subject?: string;
}

/** "1 lead" · "47 leads" (número no formato pt-BR). */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Participação arredondada: (18, 47) → "38%". */
export function shareLabel(part: number, total: number): string {
  return total > 0 ? formatPercent((part / total) * 100, 0) : "0%";
}

function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1) : text;
}

/** Comparação do volume de leads com o mês anterior (entre parênteses). */
function previousComparison(report: MonthReport): string {
  if (!report.previous) return "";
  const previousName = monthName(report.previousMonthKey);
  const total = report.current.kpis.total;
  const previousTotal = report.previous.kpis.total;
  if (previousTotal === 0) return ` (${previousName} não teve leads para comparação)`;
  const variation = percentChange(total, previousTotal);
  const rounded = variation === null ? 0 : Math.round(variation);
  if (rounded === 0) {
    return total === previousTotal
      ? ` (o mesmo volume de ${previousName})`
      : ` (praticamente o mesmo volume de ${previousName})`;
  }
  const sign = rounded > 0 ? "+" : "-";
  return ` (${sign}${formatPercent(Math.abs(rounded), 0)} em relação a ${previousName})`;
}

function funnelSentences(report: MonthReport): string[] {
  const k = report.current.kpis;
  const { attended, missed, attendanceRate } = report.current;
  const sentences: string[] = [];

  if (k.scheduled === 0) {
    sentences.push(k.total === 1 ? "O lead ainda não agendou consulta." : "Nenhum deles agendou consulta até agora.");
  } else {
    const verb = k.scheduled === 1 ? "agendou" : "agendaram";
    sentences.push(`${formatNumber(k.scheduled)} ${verb} consulta (${shareLabel(k.scheduled, k.total)}).`);
  }

  if (attended > 0 || missed > 0) {
    const rate = `comparecimento de ${formatPercent(attendanceRate, 0)}`;
    if (attended > 0 && missed > 0) {
      sentences.push(
        `${formatNumber(attended)} ${attended === 1 ? "compareceu" : "compareceram"} e ${formatNumber(missed)} ${
          missed === 1 ? "faltou" : "faltaram"
        } (${rate}).`,
      );
    } else if (attended > 0) {
      sentences.push(
        `${formatNumber(attended)} ${attended === 1 ? "compareceu" : "compareceram"} à consulta, sem faltas registradas (${rate}).`,
      );
    } else {
      sentences.push(
        `${formatNumber(missed)} ${missed === 1 ? "faltou" : "faltaram"} à consulta e ninguém compareceu até agora (${rate}).`,
      );
    }
  } else if (k.scheduled > 0) {
    sentences.push("Ainda não há comparecimentos registrados.");
  }

  const waiting = report.statusCounts.novo;
  if (waiting > 0) {
    sentences.push(
      waiting === 1
        ? "1 lead ainda aguarda o primeiro contato."
        : `${formatNumber(waiting)} leads ainda aguardam o primeiro contato.`,
    );
  }
  const lost = report.statusCounts.perdido;
  if (lost > 0) {
    sentences.push(lost === 1 ? "1 foi marcado como perdido." : `${formatNumber(lost)} foram marcados como perdidos.`);
  }
  return sentences;
}

function adsSentences(report: MonthReport): string[] {
  const { current } = report;
  const k = current.kpis;
  const googleLeads = countLabel(k.googleAdsLeads, "lead", "leads");

  if (current.adsState === "unavailable") return [];

  if (current.adsState === "empty" || !current.ads) {
    return k.googleAdsLeads > 0
      ? [
          `O Google Ads trouxe ${googleLeads}, mas não há métricas de investimento lançadas para ${report.monthLabel}, então o custo por lead não pôde ser calculado.`,
        ]
      : [`Não há métricas do Google Ads lançadas para ${report.monthLabel}.`];
  }

  const ads = current.ads;
  const sentences: string[] = [];
  if (ads.cost <= 0) {
    sentences.push(`Não houve investimento registrado no Google Ads em ${report.monthLabel}.`);
    if (k.googleAdsLeads > 0) sentences.push(`Ainda assim, o Google Ads trouxe ${googleLeads}.`);
    return sentences;
  }

  const clicks =
    ads.clicks > 0
      ? `, com ${countLabel(ads.clicks, "clique", "cliques")}${ads.ctr !== null ? ` (CTR de ${formatPercent(ads.ctr, 1)})` : ""}`
      : "";
  sentences.push(`O investimento no Google Ads foi de ${formatCurrency(ads.cost)}${clicks}.`);

  if (k.googleAdsLeads > 0) {
    const perScheduled =
      k.costPerGoogleAdsScheduled !== null ? ` e ${formatCurrency(k.costPerGoogleAdsScheduled)} por agendamento` : "";
    sentences.push(
      `O Google Ads trouxe ${googleLeads}, com custo real de ${formatCurrency(k.costPerGoogleAdsLead)} por lead${perScheduled}.`,
    );
  } else {
    sentences.push("Nenhum lead do Google Ads foi registrado no CRM no período.");
  }

  if (ads.conversions > 0) {
    sentences.push(
      `A plataforma contabilizou ${countLabel(ads.conversions, "conversão", "conversões")} para ${countLabel(
        k.googleAdsLeads,
        "lead real",
        "leads reais",
      )} no CRM.`,
    );
  }
  return sentences;
}

function originSentences(report: MonthReport): string[] {
  const total = report.current.kpis.total;
  const sentences: string[] = [];
  const [first, second] = report.sources;

  if (first) {
    if (report.sources.length === 1) {
      sentences.push(total === 1 ? `O lead veio de ${first.label}.` : `Todos os leads vieram de ${first.label}.`);
    } else if (second && second.value === first.value) {
      sentences.push(
        `As principais fontes foram ${first.label} e ${second.label}, com ${countLabel(first.value, "lead", "leads")} cada.`,
      );
    } else {
      sentences.push(
        `A principal fonte foi ${first.label}, com ${countLabel(first.value, "lead", "leads")} (${shareLabel(first.value, total)}).`,
      );
    }
  }

  const keyword = report.keywords[0];
  if (keyword) {
    sentences.push(
      `A principal palavra-chave foi “${keyword.keyword}” (${countLabel(keyword.count, "lead", "leads")}).`,
    );
  }

  const service = report.topService;
  if (service) {
    sentences.push(
      `O serviço mais procurado foi ${service.label} (${countLabel(service.count, "lead", "leads")}).`,
    );
  }
  return sentences;
}

function gmnSentence(report: MonthReport): string | null {
  const gmn = report.gmn;
  if (!gmn) return null;
  const reviews = countLabel(gmn.totalReviews, "avaliação", "avaliações");
  const news =
    gmn.newReviewsInMonth > 0
      ? ` (${countLabel(gmn.newReviewsInMonth, "nova", "novas")} em ${monthName(report.monthKey)})`
      : "";
  if (gmn.rating === null) return `No Google Meu Negócio, a clínica soma ${reviews}${news}.`;
  return `No Google Meu Negócio, a nota é ${formatDecimal(gmn.rating)} com ${reviews}${news}.`;
}

/**
 * Parágrafos do resumo automático:
 * 1) volume e funil; 2) marketing (Google Ads, fontes, palavra-chave, serviço, GMN).
 */
export function buildReportSummary(report: MonthReport, { subject = "o IDC" }: SummaryOptions = {}): string[] {
  const total = report.current.kpis.total;
  const period = capitalizeFirst(`em ${report.monthLabel}`);
  const inProgress = report.isPartial ? " até agora" : "";

  const first: string[] = [];
  if (total === 0) {
    const previous =
      report.previous && report.previous.kpis.total > 0
        ? ` (em ${monthName(report.previousMonthKey)} foram ${countLabel(report.previous.kpis.total, "lead", "leads")})`
        : "";
    first.push(`${period} ${subject} não recebeu leads${inProgress}${previous}.`);
  } else {
    first.push(
      `${period} ${subject} recebeu ${countLabel(total, "lead", "leads")}${inProgress}${previousComparison(report)}.`,
    );
    first.push(...funnelSentences(report));
  }

  const second = [...adsSentences(report), ...(total > 0 ? originSentences(report) : [])];
  const gmn = gmnSentence(report);
  if (gmn) second.push(gmn);

  return [first.join(" "), second.join(" ")].filter((paragraph) => paragraph.length > 0);
}

/** Texto único (parágrafos separados por linha em branco) — para copiar/colar. */
export function summaryToText(paragraphs: readonly string[]): string {
  return paragraphs.join("\n\n");
}
