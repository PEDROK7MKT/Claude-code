/**
 * Campanhas na página Google Ads: opções do filtro/formulário e comparação de nomes
 * igual à do banco (lower(btrim(campaign))). Funções puras.
 */
import { CAMPAIGNS } from "@/lib/constants";
import { canonicalCampaignName } from "@/lib/utm";
import type { Lead } from "@/types/database";

/** Chave de comparação: nome canônico (slug → label de CAMPAIGNS), sem diferenciar maiúsculas. */
export function campaignKey(name: string | null | undefined): string {
  return (canonicalCampaignName(name) ?? "").toLocaleLowerCase("pt-BR");
}

/**
 * Campanhas para os selects: primeiro as de CAMPAIGNS (na ordem da constante),
 * depois as que aparecem nos dados, em ordem alfabética, sem repetir.
 */
export function buildCampaignOptions(sources: ReadonlyArray<{ campaign: string | null }>): string[] {
  const byKey = new Map<string, string>();
  for (const c of CAMPAIGNS) byKey.set(campaignKey(c.label), c.label);
  const extra = new Map<string, string>();
  for (const row of sources) {
    const name = canonicalCampaignName(row.campaign);
    if (!name) continue;
    const key = campaignKey(name);
    if (!byKey.has(key) && !extra.has(key)) extra.set(key, name);
  }
  const sortedExtra = [...extra.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return [...byKey.values(), ...sortedExtra];
}

/**
 * Nome a gravar: canônico e, se já existir uma campanha com o mesmo nome ignorando
 * maiúsculas, a grafia existente (evita conflito no índice único case-insensitive).
 */
export function matchKnownCampaign(name: string, known: readonly string[]): string | null {
  const canonical = canonicalCampaignName(name);
  if (!canonical) return null;
  const key = campaignKey(canonical);
  return known.find((k) => campaignKey(k) === key) ?? canonical;
}

/** Métricas de uma campanha (null = todas). */
export function filterMetricsByCampaign<T extends { campaign: string }>(rows: readonly T[], campaign: string | null): T[] {
  if (!campaign) return [...rows];
  const key = campaignKey(campaign);
  return rows.filter((row) => campaignKey(row.campaign) === key);
}

/** Leads de uma campanha (null = todas, inclusive leads sem campanha informada). */
export function filterLeadsByCampaign<T extends Pick<Lead, "campaign">>(leads: readonly T[], campaign: string | null): T[] {
  if (!campaign) return [...leads];
  const key = campaignKey(campaign);
  return leads.filter((lead) => lead.campaign != null && campaignKey(lead.campaign) === key);
}
