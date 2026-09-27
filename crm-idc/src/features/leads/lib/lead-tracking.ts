/**
 * Card "Origem e rastreamento" do detalhe do lead: fonte, campanha, palavra-chave,
 * grupo de anúncios, página de destino e utm_* (spec §3 e §6.1).
 */
import { SOURCE_LABEL } from "@/lib/constants";
import type { Lead, Profile } from "@/types/database";

export interface TrackingRow {
  key: string;
  label: string;
  /** null = não informado ("—") */
  value: string | null;
  /** Valor técnico (URL, UTM): fonte monoespaçada e botão de copiar. */
  technical: boolean;
}

type TrackingLead = Pick<
  Lead,
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
>;

function clean(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v ? v : null;
}

/** Fonte, campanha, palavra-chave, grupo de anúncios e página de destino. */
export function buildOriginRows(lead: TrackingLead): TrackingRow[] {
  return [
    { key: "source", label: "Fonte", value: SOURCE_LABEL[lead.source] ?? lead.source, technical: false },
    { key: "campaign", label: "Campanha", value: clean(lead.campaign), technical: false },
    { key: "keyword", label: "Palavra-chave", value: clean(lead.keyword), technical: false },
    { key: "ad_group", label: "Grupo de anúncios", value: clean(lead.ad_group), technical: false },
    { key: "landing_page", label: "Página de destino", value: clean(lead.landing_page), technical: true },
  ];
}

/** utm_source … utm_content. */
export function buildUtmRows(lead: TrackingLead): TrackingRow[] {
  return (["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const).map((key) => ({
    key,
    label: key,
    value: clean(lead[key]),
    technical: true,
  }));
}

/** Algum dado de rastreamento além da fonte? */
export function hasTrackingInfo(lead: TrackingLead): boolean {
  return [...buildOriginRows(lead).slice(1), ...buildUtmRows(lead)].some((row) => row.value !== null);
}

/**
 * Como o lead entrou: cadastro manual (com o nome de quem cadastrou) ou
 * automático (webhook/integração — created_by vazio).
 */
export function describeLeadEntry(
  lead: Pick<Lead, "created_by">,
  profiles: ReadonlyArray<Pick<Profile, "id" | "full_name">> | null | undefined,
): string {
  if (!lead.created_by) return "Automática (webhook/integração)";
  const author = profiles?.find((p) => p.id === lead.created_by)?.full_name?.trim();
  return author ? `Cadastro manual por ${author}` : "Cadastro manual";
}
