/**
 * Formulário "Lançar dia" do Google Ads: schema zod (campos digitados como texto
 * em formato brasileiro → números), avisos não bloqueantes e formatação dos inputs.
 */
import { z } from "zod";
import { isValidDateKey } from "@/features/google-ads/api/daily-metrics-utils";
import { formatNumber, parseBRNumber } from "@/lib/format";
import type { DailyMetric } from "@/types/database";

/** Valor do select de campanha que libera o campo de texto livre. */
export const OTHER_CAMPAIGN_OPTION = "__outra__";

/** Limites das colunas do banco: INTEGER e DECIMAL(10,2). */
export const MAX_INTEGER = 2_147_483_647;
export const MAX_COST = 99_999_999.99;

const moneyFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decimalFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Número digitado ("1.234,56", "1234.56", "R$ 10") — vazio conta como 0; inválido → null. */
export function parseFormNumber(raw: string | null | undefined): number | null {
  const value = (raw ?? "").trim();
  if (!value) return 0;
  return parseBRNumber(value);
}

type NumberKind = "integer" | "money" | "decimal";

function numberField(kind: NumberKind) {
  return z.string().superRefine((raw, ctx) => {
    const n = parseFormNumber(raw);
    if (n === null) {
      ctx.addIssue({ code: "custom", message: "Valor inválido. Use somente números (ex.: 1.234,56)." });
      return;
    }
    if (n < 0) {
      ctx.addIssue({ code: "custom", message: "O valor não pode ser negativo." });
      return;
    }
    if (kind === "integer" && !Number.isInteger(n)) {
      ctx.addIssue({ code: "custom", message: "Informe um número inteiro." });
      return;
    }
    const max = kind === "money" ? MAX_COST : MAX_INTEGER;
    if (n > max) ctx.addIssue({ code: "custom", message: "Valor acima do permitido." });
  });
}

export const metricFormSchema = z
  .object({
    date: z.string().refine((v) => isValidDateKey(v), "Informe a data."),
    campaignOption: z.string().min(1, "Selecione a campanha."),
    campaignOther: z.string().max(120, "Use no máximo 120 caracteres."),
    impressions: numberField("integer"),
    clicks: numberField("integer"),
    cost: numberField("money"),
    conversions: numberField("decimal"),
  })
  .superRefine((values, ctx) => {
    if (values.campaignOption === OTHER_CAMPAIGN_OPTION && !values.campaignOther.trim()) {
      ctx.addIssue({ code: "custom", path: ["campaignOther"], message: "Informe o nome da campanha." });
    }
  })
  .transform((values) => ({
    date: values.date,
    campaign:
      values.campaignOption === OTHER_CAMPAIGN_OPTION
        ? values.campaignOther.replace(/\s+/g, " ").trim()
        : values.campaignOption,
    impressions: parseFormNumber(values.impressions) ?? 0,
    clicks: parseFormNumber(values.clicks) ?? 0,
    cost: Math.round((parseFormNumber(values.cost) ?? 0) * 100) / 100,
    // coluna INTEGER: conversões fracionadas do Google Ads são arredondadas
    conversions: Math.round(parseFormNumber(values.conversions) ?? 0),
  }));

export type MetricFormValues = z.input<typeof metricFormSchema>;
export type MetricFormOutput = z.output<typeof metricFormSchema>;

/** Valores iniciais: edição de uma linha ou novo lançamento (data de hoje). */
export function metricFormDefaults(
  metric: Pick<DailyMetric, "date" | "campaign" | "impressions" | "clicks" | "cost" | "conversions"> | null,
  { todayKey, campaignOptions }: { todayKey: string; campaignOptions: readonly string[] },
): MetricFormValues {
  if (!metric) {
    return {
      date: todayKey,
      campaignOption: campaignOptions[0] ?? OTHER_CAMPAIGN_OPTION,
      campaignOther: "",
      impressions: "",
      clicks: "",
      cost: "",
      conversions: "",
    };
  }
  const known = campaignOptions.find((c) => c.toLocaleLowerCase("pt-BR") === metric.campaign.trim().toLocaleLowerCase("pt-BR"));
  return {
    date: metric.date.slice(0, 10),
    campaignOption: known ?? OTHER_CAMPAIGN_OPTION,
    campaignOther: known ? "" : metric.campaign,
    impressions: formatNumber(Number(metric.impressions)),
    clicks: formatNumber(Number(metric.clicks)),
    cost: moneyFmt.format(Number(metric.cost)),
    conversions: formatNumber(Number(metric.conversions)),
  };
}

export interface MetricFormWarnings {
  clicks?: string;
  conversions?: string;
}

/** Avisos que não impedem salvar (valores incomuns, arredondamento). */
export function getMetricFormWarnings(
  values: Pick<MetricFormValues, "impressions" | "clicks" | "conversions">,
): MetricFormWarnings {
  const warnings: MetricFormWarnings = {};
  const impressions = parseFormNumber(values.impressions);
  const clicks = parseFormNumber(values.clicks);
  const conversions = parseFormNumber(values.conversions);
  if (impressions !== null && clicks !== null && clicks > impressions) {
    warnings.clicks = "Há mais cliques do que impressões. Confira os valores no Google Ads.";
  }
  if (conversions !== null && conversions >= 0 && !Number.isInteger(conversions)) {
    warnings.conversions = `Conversões são gravadas como número inteiro: ${decimalFmt.format(conversions)} → ${formatNumber(Math.round(conversions))}.`;
  }
  return warnings;
}

/** Formata o input ao sair do campo: inteiro "1.234", moeda "1.234,56", decimal "2,5". Inválido fica como está. */
export function formatNumberInput(raw: string, kind: NumberKind): string {
  const value = raw.trim();
  if (!value) return "";
  const n = parseBRNumber(value);
  if (n === null || n < 0) return raw;
  if (kind === "money") return moneyFmt.format(n);
  if (kind === "integer") return Number.isInteger(n) ? formatNumber(n) : raw;
  return decimalFmt.format(n);
}
