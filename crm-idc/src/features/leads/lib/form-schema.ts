/**
 * Formulário de lead (cadastro e edição — spec §4.3): schema zod, valores
 * iniciais, conversão lead do banco ↔ formulário e máscaras dos campos.
 * Os campos são digitados como texto; o schema devolve o formato do banco
 * (telefone só com dígitos, textos vazios → null, valor em número).
 */
import { z } from "zod";
import { CAMPAIGNS, LEAD_SOURCES, SERVICES } from "@/lib/constants";
import { formatPhone, maskPhoneInput, normalizePhone, parseBRNumber } from "@/lib/format";
import { canonicalCampaignName } from "@/lib/utm";
import type { Lead, LeadSource, ServiceType } from "@/types/database";

/** Opção "nenhum" dos selects (o Radix Select não aceita valor vazio nos itens). */
export const NONE_OPTION = "__nenhum__";
/** Opção do select de campanha que libera o campo de texto livre. */
export const OTHER_CAMPAIGN_OPTION = "__outra__";

export const PHONE_ERROR_MESSAGE = "Informe um telefone com DDD, ex.: (77) 98765-4321";

/** Limite da coluna DECIMAL(10,2). */
export const MAX_ESTIMATED_VALUE = 99_999_999.99;

export const FIELD_MAX_LENGTH = {
  name: 120,
  campaign: 120,
  shortText: 250,
  landing_page: 500,
  service_detail: 200,
  notes: 4000,
} as const;

export const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type UtmField = (typeof UTM_FIELDS)[number];

/** Campos da seção "Rastreamento do anúncio" (Google Ads). */
export const AD_TRACKING_FIELDS = ["campaignOption", "campaignOther", "keyword", "ad_group", "landing_page"] as const;

const LEAD_SOURCE_VALUES = LEAD_SOURCES.map((s) => s.value) as [LeadSource, ...LeadSource[]];
const SERVICE_VALUES = SERVICES.map((s) => s.value) as [ServiceType, ...ServiceType[]];
const CAMPAIGN_LABELS: readonly string[] = CAMPAIGNS.map((c) => c.label);

export function isLeadSource(value: unknown): value is LeadSource {
  return typeof value === "string" && (LEAD_SOURCE_VALUES as readonly string[]).includes(value);
}

export function isServiceType(value: unknown): value is ServiceType {
  return typeof value === "string" && (SERVICE_VALUES as readonly string[]).includes(value);
}

/** Texto limpo (espaços extras removidos); vazio → null. */
export function textOrNull(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v ? v : null;
}

function maxLength(max: number) {
  return z.string().max(max, `Use no máximo ${max} caracteres.`);
}

// -----------------------------------------------------------------------------
// Máscaras
// -----------------------------------------------------------------------------

/**
 * Máscara do telefone enquanto digita. Números colados com +55 / 0 na frente
 * (mais de 11 dígitos) são normalizados antes de mascarar.
 */
export function maskLeadPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 11) {
    const normalized = normalizePhone(raw);
    if (normalized) return formatPhone(normalized);
  }
  return maskPhoneInput(raw);
}

const moneyFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valor em reais digitado ("1500", "1.500,5", "R$ 1500.50") → número; vazio → null; inválido → NaN. */
export function parseMoneyInput(raw: string | null | undefined): number | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const n = parseBRNumber(value);
  return n === null ? Number.NaN : n;
}

/** Formata o campo de valor ao sair dele: "1500" → "1.500,00". Inválido fica como está. */
export function formatMoneyInput(raw: string): string {
  const n = parseMoneyInput(raw);
  if (n === null) return "";
  if (Number.isNaN(n) || n < 0) return raw;
  return moneyFmt.format(n);
}

/** Número do banco → texto do campo de valor ("1.500,00"); null → "". */
export function moneyToInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? moneyFmt.format(n) : "";
}

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------

const optionalText = (max: number) => maxLength(max);

/** Campos do formulário, todos digitados como texto (selects usam NONE_OPTION para "nenhum"). */
const leadFormFields = z.object({
    name: z
      .string()
      .max(FIELD_MAX_LENGTH.name, `Use no máximo ${FIELD_MAX_LENGTH.name} caracteres.`)
      .refine((v) => v.trim().length > 0, "Informe o nome do lead."),
    phone: z.string().refine((v) => normalizePhone(v) !== null, PHONE_ERROR_MESSAGE),
    source: z.string().refine((v) => isLeadSource(v), "Selecione a fonte do lead."),
    campaignOption: z.string(),
    campaignOther: optionalText(FIELD_MAX_LENGTH.campaign),
    keyword: optionalText(FIELD_MAX_LENGTH.shortText),
    ad_group: optionalText(FIELD_MAX_LENGTH.shortText),
    landing_page: optionalText(FIELD_MAX_LENGTH.landing_page),
    utm_source: optionalText(FIELD_MAX_LENGTH.shortText),
    utm_medium: optionalText(FIELD_MAX_LENGTH.shortText),
    utm_campaign: optionalText(FIELD_MAX_LENGTH.shortText),
    utm_term: optionalText(FIELD_MAX_LENGTH.shortText),
    utm_content: optionalText(FIELD_MAX_LENGTH.shortText),
    service: z.string().refine((v) => v === NONE_OPTION || isServiceType(v), "Selecione um serviço da lista."),
    service_detail: optionalText(FIELD_MAX_LENGTH.service_detail),
    estimated_value: z.string().superRefine((raw, ctx) => {
      const n = parseMoneyInput(raw);
      if (n === null) return;
      if (Number.isNaN(n)) {
        ctx.addIssue({ code: "custom", message: "Valor inválido. Use somente números (ex.: 1.500,00)." });
      } else if (n < 0) {
        ctx.addIssue({ code: "custom", message: "O valor não pode ser negativo." });
      } else if (n > MAX_ESTIMATED_VALUE) {
        ctx.addIssue({ code: "custom", message: "Valor acima do permitido." });
      }
    }),
    assigned_to: z.string(),
    notes: optionalText(FIELD_MAX_LENGTH.notes),
});

export type LeadFormValues = z.input<typeof leadFormFields>;

/** Campos que o formulário grava (formato do banco). */
export interface LeadFormOutput {
  name: string;
  phone: string;
  source: LeadSource;
  campaign: string | null;
  keyword: string | null;
  ad_group: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  service: ServiceType | null;
  service_detail: string | null;
  estimated_value: number | null;
  assigned_to: string | null;
  notes: string | null;
}

export type LeadFormField = keyof LeadFormOutput;

/** Nome da campanha a partir do select (+ texto livre em "Outra…"). */
export function campaignFromOptions(option: string, other: string): string | null {
  if (!option || option === NONE_OPTION) return null;
  if (option === OTHER_CAMPAIGN_OPTION) return canonicalCampaignName(other);
  return canonicalCampaignName(option);
}

/** Select de campanha para um nome salvo: campanha conhecida → própria opção; senão "Outra…". */
export function campaignToOptions(campaign: string | null | undefined): { campaignOption: string; campaignOther: string } {
  const name = canonicalCampaignName(campaign);
  if (!name) return { campaignOption: NONE_OPTION, campaignOther: "" };
  if (CAMPAIGN_LABELS.includes(name)) return { campaignOption: name, campaignOther: "" };
  return { campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: name };
}

/** Valores validados do formulário → campos do lead (telefone normalizado, vazios → null). */
export function toLeadFormOutput(values: LeadFormValues): LeadFormOutput {
  const money = parseMoneyInput(values.estimated_value);
  return {
    name: values.name.replace(/\s+/g, " ").trim(),
    phone: normalizePhone(values.phone) ?? values.phone.replace(/\D/g, ""),
    source: values.source as LeadSource,
    campaign: campaignFromOptions(values.campaignOption, values.campaignOther),
    keyword: textOrNull(values.keyword),
    ad_group: textOrNull(values.ad_group),
    landing_page: textOrNull(values.landing_page),
    utm_source: textOrNull(values.utm_source),
    utm_medium: textOrNull(values.utm_medium),
    utm_campaign: textOrNull(values.utm_campaign),
    utm_term: textOrNull(values.utm_term),
    utm_content: textOrNull(values.utm_content),
    service: isServiceType(values.service) ? values.service : null,
    service_detail: textOrNull(values.service_detail),
    estimated_value: money === null || Number.isNaN(money) ? null : Math.round(money * 100) / 100,
    assigned_to: values.assigned_to && values.assigned_to !== NONE_OPTION ? values.assigned_to : null,
    notes: textOrNull(values.notes),
  };
}

/** Schema do formulário: valida os textos e devolve os campos no formato do banco. */
export const leadFormSchema = leadFormFields
  .superRefine((values, ctx) => {
    if (values.campaignOption === OTHER_CAMPAIGN_OPTION && !values.campaignOther.trim()) {
      ctx.addIssue({ code: "custom", path: ["campaignOther"], message: "Informe o nome da campanha." });
    }
  })
  .transform((values): LeadFormOutput => toLeadFormOutput(values));

// -----------------------------------------------------------------------------
// Valores iniciais
// -----------------------------------------------------------------------------

/** Formulário de novo lead em branco (fonte obrigatória começa sem seleção). */
export function emptyLeadFormValues(overrides: Partial<LeadFormValues> = {}): LeadFormValues {
  return {
    name: "",
    phone: "",
    source: "",
    campaignOption: NONE_OPTION,
    campaignOther: "",
    keyword: "",
    ad_group: "",
    landing_page: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
    service: NONE_OPTION,
    service_detail: "",
    estimated_value: "",
    assigned_to: NONE_OPTION,
    notes: "",
    ...overrides,
  };
}

type LeadFormSource = Pick<
  Lead,
  | "name"
  | "phone"
  | "source"
  | "campaign"
  | "keyword"
  | "ad_group"
  | "landing_page"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content"
  | "service"
  | "service_detail"
  | "estimated_value"
  | "assigned_to"
  | "notes"
>;

/** Lead do banco → valores do formulário de edição. */
export function leadToFormValues(lead: LeadFormSource): LeadFormValues {
  return {
    name: lead.name ?? "",
    phone: lead.phone ? maskLeadPhoneInput(lead.phone) : "",
    source: lead.source ?? "",
    ...campaignToOptions(lead.campaign),
    keyword: lead.keyword ?? "",
    ad_group: lead.ad_group ?? "",
    landing_page: lead.landing_page ?? "",
    utm_source: lead.utm_source ?? "",
    utm_medium: lead.utm_medium ?? "",
    utm_campaign: lead.utm_campaign ?? "",
    utm_term: lead.utm_term ?? "",
    utm_content: lead.utm_content ?? "",
    service: lead.service ?? NONE_OPTION,
    service_detail: lead.service_detail ?? "",
    estimated_value: moneyToInput(lead.estimated_value),
    assigned_to: lead.assigned_to ?? NONE_OPTION,
    notes: lead.notes ?? "",
  };
}

// -----------------------------------------------------------------------------
// Exibição condicional
// -----------------------------------------------------------------------------

type AdTrackingValues = Pick<LeadFormValues, "source" | (typeof AD_TRACKING_FIELDS)[number]>;

/**
 * A seção "Rastreamento do anúncio" aparece para Google Ads — e também quando
 * já existe algum dado nela (ex.: lead do webhook com outra fonte), para que
 * nenhum valor salvo fique escondido.
 */
export function shouldShowAdTracking(values: Partial<AdTrackingValues>): boolean {
  if (values.source === "google_ads") return true;
  const campaign = values.campaignOption ?? NONE_OPTION;
  if (campaign !== NONE_OPTION && campaign !== "") {
    return campaign !== OTHER_CAMPAIGN_OPTION || Boolean(values.campaignOther?.trim());
  }
  return Boolean(values.keyword?.trim() || values.ad_group?.trim() || values.landing_page?.trim());
}

/** Algum campo UTM preenchido? (abre a seção "Avançado") */
export function hasUtmValues(values: Partial<Pick<LeadFormValues, UtmField>>): boolean {
  return UTM_FIELDS.some((key) => Boolean(values[key]?.trim()));
}

/** Rótulos dos campos (mensagens "campos preenchidos", diff de alterações). */
export const LEAD_FIELD_LABEL: Record<LeadFormField, string> = {
  name: "Nome",
  phone: "Telefone",
  source: "Fonte",
  campaign: "Campanha",
  keyword: "Palavra-chave",
  ad_group: "Grupo de anúncios",
  landing_page: "Página de destino",
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  utm_term: "utm_term",
  utm_content: "utm_content",
  service: "Serviço",
  service_detail: "Detalhe do serviço",
  estimated_value: "Valor estimado",
  assigned_to: "Responsável",
  notes: "Notas",
};
