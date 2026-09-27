/**
 * Parse de UTMs da URL que o lead acessou (spec §6.1 — opção B: o gestor cola a
 * URL e o formulário é preenchido automaticamente). Função pura, sem dependências de DOM.
 */
import { CAMPAIGNS } from "@/lib/constants";
import { slugify } from "@/lib/format";
import type { LeadSource } from "@/types/database";

export interface ParsedLeadUrl {
  /** Caminho da página de destino (ex.: "/urgencia"); null para query string solta */
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  /** utm_term ?? keyword ?? kw */
  keyword: string | null;
  /** Nome da campanha no Google Ads (label de CAMPAIGNS quando o slug bate), senão utm_campaign */
  campaign: string | null;
  gclid: string | null;
  /** Palpite da fonte do lead a partir dos parâmetros (null = sem palpite) */
  source: LeadSource | null;
}

const EMPTY: ParsedLeadUrl = {
  landing_page: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  keyword: null,
  campaign: null,
  gclid: null,
  source: null,
};

/**
 * Nome canônico da campanha: se `value` for o slug (utm_campaign) ou o nome de uma
 * campanha de CAMPAIGNS (sem diferenciar maiúsculas/acentos/espaços), devolve o
 * `label`; senão devolve o texto limpo (trim + espaços únicos). Vazio → null.
 */
export function canonicalCampaignName(value: string | null | undefined): string | null {
  const cleaned = (value ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  const slug = slugify(cleaned);
  const match = CAMPAIGNS.find((c) => slugify(c.value) === slug || slugify(c.label) === slug);
  return match ? match.label : cleaned;
}

/** Valor de parâmetro limpo: trim, vazio → null, ValueTrack não substituído ("{keyword}") → null. */
function cleanParam(value: string | null | undefined): string | null {
  if (value == null) return null;
  const v = value.replace(/\s+/g, " ").trim();
  if (!v) return null;
  if (/^\{[^}]*\}$/.test(v)) return null;
  return v;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Mapa de parâmetros com chaves em minúsculo (primeira ocorrência não vazia vence). */
function collectParams(...sources: string[]): Map<string, string> {
  const params = new Map<string, string>();
  for (const source of sources) {
    if (!source) continue;
    const search = new URLSearchParams(source.replace(/^[?#&]+/, ""));
    for (const [key, value] of search) {
      const k = key.trim().toLowerCase();
      if (!params.has(k) && cleanParam(value) !== null) params.set(k, value);
    }
  }
  return params;
}

function normalizePath(pathname: string): string | null {
  const decoded = safeDecode(pathname).trim();
  if (!decoded) return null;
  const withSlash = decoded.startsWith("/") ? decoded : `/${decoded}`;
  const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
  return trimmed || "/";
}

interface SplitUrl {
  path: string | null;
  query: string;
  hash: string;
}

function splitInput(raw: string): SplitUrl {
  const input = raw.trim();

  // Query string solta: "?utm_source=..." ou "utm_source=google&utm_medium=cpc"
  if (/^[?&]/.test(input) || /^[^?/#.=\s]+=/.test(input)) {
    const [query, hash = ""] = input.split("#", 2);
    return { path: null, query, hash };
  }

  // Caminho relativo: "/urgencia?utm_source=..."
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(input);
  const candidate = hasProtocol ? input : input.startsWith("/") ? `https://placeholder.invalid${input}` : `https://${input}`;
  try {
    const url = new URL(candidate);
    return { path: url.pathname, query: url.search, hash: url.hash };
  } catch {
    // URL malformada: separa na mão
    const hashIndex = input.indexOf("#");
    const beforeHash = hashIndex >= 0 ? input.slice(0, hashIndex) : input;
    const hash = hashIndex >= 0 ? input.slice(hashIndex) : "";
    const queryIndex = beforeHash.indexOf("?");
    const base = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
    const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
    const withoutProtocol = base.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    const slash = withoutProtocol.indexOf("/");
    const path = base.startsWith("/") ? base : slash >= 0 ? withoutProtocol.slice(slash) : "/";
    return { path, query, hash };
  }
}

const GOOGLE_SOURCES = new Set(["google", "adwords", "googleads", "google_ads", "g"]);
const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsearch", "paid_search", "sem", "cpm", "display", "pmax"]);
const ORGANIC_MEDIUMS = new Set(["organic", "organico", "seo", "search"]);

/** Indica Google Meu Negócio / Perfil da Empresa (gmn, gbp, gmb, google-business...). */
function isGmnHint(slug: string): boolean {
  if (!slug) return false;
  if (slug.split("_").some((token) => token === "gmn" || token === "gbp" || token === "gmb")) return true;
  return /google_?business|meu_?negocio|my_?business|googlemybusiness/.test(slug);
}

function guessSource(p: {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  hasClickId: boolean;
}): LeadSource | null {
  const source = slugify(p.utm_source ?? "");
  const medium = slugify(p.utm_medium ?? "");
  const campaign = slugify(p.utm_campaign ?? "");

  if (p.hasClickId) return "google_ads";
  if (GOOGLE_SOURCES.has(source) && PAID_MEDIUMS.has(medium)) return "google_ads";
  if (isGmnHint(source) || isGmnHint(medium) || isGmnHint(campaign)) return "gmn";
  if (source.includes("instagram") || source === "ig" || source === "insta" || medium === "instagram") return "instagram";
  if (source === "google" && (!medium || ORGANIC_MEDIUMS.has(medium))) return "google_organico";
  return null;
}

/**
 * Extrai UTMs, palavra-chave, campanha e gclid de uma URL (com ou sem protocolo,
 * caminho relativo ou query string solta) e sugere a fonte do lead.
 */
export function parseLeadUrl(input: string | null | undefined): ParsedLeadUrl {
  const raw = (input ?? "").trim();
  if (!raw) return { ...EMPTY };

  const { path, query, hash } = splitInput(raw);
  // alguns sites (SPA) põem os parâmetros depois do "#": "/#/pagina?utm_source=..."
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?")) : hash.includes("=") ? hash.slice(1) : "";
  const params = collectParams(query, hashQuery);
  const get = (key: string) => cleanParam(params.get(key));

  const utm_source = get("utm_source");
  const utm_medium = get("utm_medium");
  const utm_campaign = get("utm_campaign");
  const utm_term = get("utm_term");
  const utm_content = get("utm_content");
  const gclid = get("gclid");
  const hasClickId = Boolean(gclid || get("gbraid") || get("wbraid"));

  return {
    landing_page: path === null ? null : normalizePath(path),
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    keyword: utm_term ?? get("keyword") ?? get("kw") ?? get("utm_keyword"),
    campaign: canonicalCampaignName(utm_campaign),
    gclid,
    source: guessSource({ utm_source, utm_medium, utm_campaign, hasClickId }),
  };
}

/** A URL trouxe algum dado de rastreio (UTM, gclid ou palavra-chave)? */
export function hasTrackingData(parsed: ParsedLeadUrl): boolean {
  return Boolean(
    parsed.utm_source ||
      parsed.utm_medium ||
      parsed.utm_campaign ||
      parsed.utm_term ||
      parsed.utm_content ||
      parsed.keyword ||
      parsed.gclid,
  );
}
