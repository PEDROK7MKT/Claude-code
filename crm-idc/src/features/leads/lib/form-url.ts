/**
 * Spec §6.1 — Opção B: o gestor cola a URL que o lead acessou e o formulário
 * preenche UTMs, palavra-chave, página de destino, campanha e (se a fonte ainda
 * não foi escolhida ou está como "outro") a fonte sugerida pela URL.
 */
import { SOURCE_LABEL } from "@/lib/constants";
import type { ParsedLeadUrl } from "@/lib/utm";
import type { LeadSource } from "@/types/database";

import { campaignFromOptions, campaignToOptions, LEAD_FIELD_LABEL, type LeadFormValues } from "./form-schema";

/** Campos que a URL pode preencher (nomes do banco). */
export type UrlFilledField =
  | "source"
  | "campaign"
  | "keyword"
  | "landing_page"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content";

export interface UrlAutofillResult {
  /** Valores a aplicar no formulário (só o que muda). */
  patch: Partial<LeadFormValues>;
  /** Campos preenchidos/alterados, na ordem do formulário. */
  filled: UrlFilledField[];
  /** Campos que a URL trouxe com o mesmo valor que já estava no formulário. */
  unchanged: UrlFilledField[];
  /** Fonte sugerida pela URL que NÃO foi aplicada (o usuário já escolheu outra). */
  ignoredSource: LeadSource | null;
  /** A URL tinha algum dado aproveitável? */
  found: boolean;
  /** Clique do Google Ads (gclid/gbraid/wbraid) detectado. */
  hasClickId: boolean;
}

const DIRECT_FIELDS = ["keyword", "landing_page", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** Fonte ainda "em aberto": sem seleção ou "outro". */
export function isSourceOpenForGuess(source: string | null | undefined): boolean {
  return !source || source === "outro";
}

/**
 * Calcula o que a URL colada preenche no formulário. Valores da URL substituem
 * os digitados (é o que o usuário espera ao colar); campos sem valor na URL
 * ficam como estão.
 */
export function buildUrlAutofill(values: LeadFormValues, parsed: ParsedLeadUrl): UrlAutofillResult {
  const patch: Partial<LeadFormValues> = {};
  const filled: UrlFilledField[] = [];
  const unchanged: UrlFilledField[] = [];
  let ignoredSource: LeadSource | null = null;

  if (parsed.source) {
    if (values.source === parsed.source) unchanged.push("source");
    else if (isSourceOpenForGuess(values.source)) {
      patch.source = parsed.source;
      filled.push("source");
    } else ignoredSource = parsed.source;
  }

  if (parsed.campaign) {
    const current = campaignFromOptions(values.campaignOption, values.campaignOther);
    const next = campaignToOptions(parsed.campaign);
    if (current === campaignFromOptions(next.campaignOption, next.campaignOther)) unchanged.push("campaign");
    else {
      patch.campaignOption = next.campaignOption;
      patch.campaignOther = next.campaignOther;
      filled.push("campaign");
    }
  }

  for (const key of DIRECT_FIELDS) {
    const value = parsed[key];
    if (!value) continue;
    if ((values[key] ?? "").trim() === value) unchanged.push(key);
    else {
      patch[key] = value;
      filled.push(key);
    }
  }

  const found = filled.length + unchanged.length > 0 || ignoredSource !== null || parsed.gclid !== null;
  return { patch, filled, unchanged, ignoredSource, found, hasClickId: parsed.gclid !== null };
}

/** Rótulo de um campo preenchido pela URL. */
export function urlFieldLabel(field: UrlFilledField): string {
  return LEAD_FIELD_LABEL[field];
}

/** "Fonte, Campanha e Palavra-chave" */
export function listFieldLabels(fields: readonly UrlFilledField[]): string {
  const labels = fields.map(urlFieldLabel);
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

/** Resumo em uma frase para toast/leitor de tela. */
export function describeUrlAutofill(result: UrlAutofillResult): string {
  if (!result.found) return "Nenhum parâmetro de rastreamento encontrado nessa URL.";
  const parts: string[] = [];
  if (result.filled.length === 1) parts.push(`1 campo preenchido: ${listFieldLabels(result.filled)}.`);
  else if (result.filled.length > 1) parts.push(`${result.filled.length} campos preenchidos: ${listFieldLabels(result.filled)}.`);
  else parts.push("Os campos já estavam preenchidos com os dados dessa URL.");
  if (result.ignoredSource) {
    parts.push(`A URL indica ${SOURCE_LABEL[result.ignoredSource]}, mas a fonte escolhida foi mantida.`);
  }
  return parts.join(" ");
}
