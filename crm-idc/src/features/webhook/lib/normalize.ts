/**
 * Normalização do lead recebido pelo webhook: telefone (regra do banco: só
 * dígitos, com DDD, sem 55), fonte (explícita > palpite pelos UTMs/gclid >
 * "outro"), campanha canônica, serviço conhecido (desconhecido → "outro" com o
 * texto original em service_detail) e rastreio da URL (opção B do §6.1).
 */
import { FIELD_LIMITS, FIELD_MESSAGES, UNNAMED_LEAD } from "@/features/webhook/lib/constants";
import { cleanText, truncateText, type WebhookLeadPayload } from "@/features/webhook/lib/schema";
import type { WebhookAuthMode, WebhookFieldError, WebhookLeadInsert } from "@/features/webhook/lib/types";
import { LEAD_SOURCES, SERVICES } from "@/lib/constants";
import { normalizePhone } from "@/lib/format";
import { canonicalCampaignName, parseLeadUrl, type ParsedLeadUrl } from "@/lib/utm";
import type { LeadSource, ServiceType } from "@/types/database";

/** Minúsculo, sem acento, separadores viram "_" ("Implante Dentário" → "implante_dentario"). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Mapa slug → valor, com o próprio valor e o slug do rótulo de cada opção. */
function buildLookup<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  aliases: Readonly<Record<string, T>>,
): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  for (const option of options) {
    map.set(slugify(option.value), option.value);
    map.set(slugify(option.label), option.value);
  }
  for (const [alias, value] of Object.entries(aliases)) map.set(alias, value);
  return map;
}

// -----------------------------------------------------------------------------
// Fonte
// -----------------------------------------------------------------------------

const SOURCE_ALIASES: Readonly<Record<string, LeadSource>> = {
  googleads: "google_ads",
  adwords: "google_ads",
  google_adwords: "google_ads",
  gads: "google_ads",
  ads: "google_ads",
  anuncio: "google_ads",
  anuncio_google: "google_ads",
  organico: "google_organico",
  google_organic: "google_organico",
  organic: "google_organico",
  seo: "google_organico",
  gmb: "gmn",
  gbp: "gmn",
  meu_negocio: "gmn",
  google_my_business: "gmn",
  google_business: "gmn",
  google_business_profile: "gmn",
  perfil_da_empresa: "gmn",
  google_maps: "gmn",
  maps: "gmn",
  ig: "instagram",
  insta: "instagram",
  indicado: "indicacao",
  referral: "indicacao",
  paciente: "retorno",
  outros: "outro",
  other: "outro",
};

const SOURCE_LOOKUP = buildLookup<LeadSource>(LEAD_SOURCES, SOURCE_ALIASES);

/** Fonte informada explicitamente (valor, rótulo ou apelido); inválida → null. */
export function resolveExplicitSource(raw: string | null | undefined): LeadSource | null {
  if (!raw) return null;
  return SOURCE_LOOKUP.get(slugify(raw)) ?? null;
}

// -----------------------------------------------------------------------------
// Serviço
// -----------------------------------------------------------------------------

const SERVICE_ALIASES: Readonly<Record<string, ServiceType>> = {
  implantes: "implante",
  implantes_dentarios: "implante",
  protese: "protese_protocolo",
  proteses: "protese_protocolo",
  protocolo: "protese_protocolo",
  protese_dentaria: "protese_protocolo",
  dentadura: "protese_protocolo",
  prevencao: "preventivo",
  limpeza: "preventivo",
  profilaxia: "preventivo",
  tratamento_canal: "canal",
  endodontia: "canal",
  extracoes: "extracao",
  siso: "extracao",
  clareamento_dental: "clareamento",
  lentes: "lente_contato",
  lente_de_contato: "lente_contato",
  lentes_de_contato: "lente_contato",
  aparelho: "ortodontia",
  aparelho_dental: "ortodontia",
  aparelho_ortodontico: "ortodontia",
  alinhadores: "ortodontia",
  odontopediatra: "odontopediatria",
  dentista_infantil: "odontopediatria",
  odontologia_infantil: "odontopediatria",
  ronco: "sono",
  apneia: "sono",
  clinico_geral: "clinica_geral",
  consulta: "clinica_geral",
  avaliacao: "clinica_geral",
  outros: "outro",
};

const SERVICE_LOOKUP = buildLookup<ServiceType>(SERVICES, SERVICE_ALIASES);

/** Serviço conhecido (valor, rótulo ou apelido) ou null. */
export function matchService(raw: string | null | undefined): ServiceType | null {
  if (!raw) return null;
  return SERVICE_LOOKUP.get(slugify(raw)) ?? null;
}

/**
 * Serviço de interesse. Desconhecido → "outro", guardando o texto recebido em
 * service_detail (antes do detalhe enviado, se houver).
 */
export function resolveService(
  raw: string | null | undefined,
  detail: string | null | undefined,
): { service: ServiceType | null; service_detail: string | null } {
  const cleanDetail = cleanText(detail, FIELD_LIMITS.service_detail);
  if (!raw) return { service: null, service_detail: cleanDetail };
  const known = matchService(raw);
  if (known) return { service: known, service_detail: cleanDetail };
  const combined = cleanDetail ? `${raw} — ${cleanDetail}` : raw;
  return { service: "outro", service_detail: cleanText(combined, FIELD_LIMITS.service_detail) };
}

/**
 * Palpite do serviço pela página de destino, só quando um trecho inteiro do
 * caminho é um serviço conhecido ("/implante-dentario" → implante). "/urgencia" → null.
 */
export function inferServiceFromLandingPage(path: string | null | undefined): ServiceType | null {
  if (!path) return null;
  for (const segment of path.split("/")) {
    const service = SERVICE_LOOKUP.get(slugify(segment));
    if (service && service !== "outro") return service;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Rastreio (URL + UTMs)
// -----------------------------------------------------------------------------

/** Texto parece URL completa/domínio/query string (e não só um caminho "/urgencia")? */
export function looksLikeUrl(value: string): boolean {
  return /:\/\//.test(value) || /^www\./i.test(value) || /[?#]/.test(value) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(value);
}

/** Caminho da página de destino: com "/" inicial e sem "/" final ("urgencia/" → "/urgencia"). */
export function cleanLandingPath(value: string | null | undefined): string | null {
  const text = cleanText(value, FIELD_LIMITS.landing_page)?.replace(/\s+/g, "");
  if (!text) return null;
  const withSlash = text.startsWith("/") ? text : `/${text}`;
  const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
  return trimmed || "/";
}

export interface ResolvedTracking {
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  keyword: string | null;
  campaign: string | null;
  gclid: string | null;
  /** Palpite da fonte pelos parâmetros (null = sem palpite) */
  sourceGuess: LeadSource | null;
}

type TrackingInput = Pick<
  WebhookLeadPayload,
  "url" | "landing_page" | "campaign" | "keyword" | "gclid" | "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content"
>;

/**
 * Junta os campos explícitos com os parâmetros da URL (`url`, ou `landing_page`
 * quando vier como URL completa). Campo explícito sempre vence o da URL.
 */
export function resolveTracking(input: TrackingInput): ResolvedTracking {
  const fromUrl = input.url ? parseLeadUrl(input.url) : null;
  const landingIsUrl = Boolean(input.landing_page && looksLikeUrl(input.landing_page));
  const fromLanding = landingIsUrl ? parseLeadUrl(input.landing_page) : null;
  const parsed = [fromUrl, fromLanding].filter((p): p is ParsedLeadUrl => p !== null);

  const fromParams = <K extends keyof ParsedLeadUrl>(key: K): ParsedLeadUrl[K] | null => {
    for (const p of parsed) if (p[key] != null) return p[key];
    return null;
  };
  const pick = (explicit: string | null, key: keyof Omit<ParsedLeadUrl, "source">, max: number) =>
    explicit ?? cleanText(fromParams(key), max);

  const utm_source = pick(input.utm_source, "utm_source", FIELD_LIMITS.utm);
  const utm_medium = pick(input.utm_medium, "utm_medium", FIELD_LIMITS.utm);
  const utm_campaign = pick(input.utm_campaign, "utm_campaign", FIELD_LIMITS.utm);
  const utm_term = pick(input.utm_term, "utm_term", FIELD_LIMITS.utm);
  const utm_content = pick(input.utm_content, "utm_content", FIELD_LIMITS.utm);
  const gclid = pick(input.gclid, "gclid", FIELD_LIMITS.gclid);

  const landing_page = landingIsUrl
    ? cleanText(fromLanding?.landing_page, FIELD_LIMITS.landing_page) ?? cleanText(fromUrl?.landing_page, FIELD_LIMITS.landing_page)
    : cleanLandingPath(input.landing_page) ?? cleanText(fromUrl?.landing_page, FIELD_LIMITS.landing_page);

  // Reaproveita o palpite de parseLeadUrl com os valores já combinados
  const merged = new URLSearchParams();
  for (const [key, value] of Object.entries({ utm_source, utm_medium, utm_campaign, gclid })) {
    if (value) merged.set(key, value);
  }
  const sourceGuess = parseLeadUrl(`?${merged.toString()}`).source ?? fromParams("source");

  return {
    landing_page,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    keyword: input.keyword ?? utm_term ?? cleanText(fromParams("keyword"), FIELD_LIMITS.keyword),
    campaign: cleanText(canonicalCampaignName(input.campaign ?? utm_campaign), FIELD_LIMITS.campaign),
    gclid,
    sourceGuess,
  };
}

// -----------------------------------------------------------------------------
// Notas
// -----------------------------------------------------------------------------

/** Notas do lead: observações + primeira mensagem + gclid (guardado para conversões offline). */
export function composeNotes(parts: { notes?: string | null; message?: string | null; gclid?: string | null }): string | null {
  const lines = [
    parts.notes,
    parts.message ? `Mensagem: ${parts.message}` : null,
    parts.gclid ? `gclid (Google Ads): ${parts.gclid}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length ? truncateText(lines.join("\n"), FIELD_LIMITS.notes) : null;
}

// -----------------------------------------------------------------------------
// Lead completo
// -----------------------------------------------------------------------------

export type NormalizeResult = { ok: true; lead: WebhookLeadInsert } | { ok: false; errors: WebhookFieldError[] };

/**
 * Converte o corpo validado na linha de `leads`. Telefone é sempre obrigatório;
 * o nome só é obrigatório no modo público (integrações com segredo podem omitir).
 */
export function normalizeWebhookLead(payload: WebhookLeadPayload, { mode }: { mode: WebhookAuthMode }): NormalizeResult {
  const errors: WebhookFieldError[] = [];

  if (!payload.name && mode === "public") errors.push({ field: "name", message: FIELD_MESSAGES.nameRequired });
  const phone = normalizePhone(payload.phone);
  if (!payload.phone) errors.push({ field: "phone", message: FIELD_MESSAGES.phoneRequired });
  else if (!phone) errors.push({ field: "phone", message: FIELD_MESSAGES.phoneInvalid });

  if (errors.length || !phone) return { ok: false, errors };

  const tracking = resolveTracking(payload);
  const { service, service_detail } = resolveService(payload.service, payload.service_detail);

  return {
    ok: true,
    lead: {
      name: payload.name ?? UNNAMED_LEAD,
      phone,
      source: resolveExplicitSource(payload.source) ?? tracking.sourceGuess ?? "outro",
      campaign: tracking.campaign,
      keyword: tracking.keyword,
      ad_group: payload.ad_group,
      landing_page: tracking.landing_page,
      utm_source: tracking.utm_source,
      utm_medium: tracking.utm_medium,
      utm_campaign: tracking.utm_campaign,
      utm_term: tracking.utm_term,
      utm_content: tracking.utm_content,
      service: service ?? inferServiceFromLandingPage(tracking.landing_page),
      service_detail,
      notes: composeNotes({ notes: payload.notes, message: payload.message, gclid: tracking.gclid }),
      parent_lead_id: null,
    },
  };
}
