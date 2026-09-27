/**
 * Configurações padrão do CRM e normalização da linha de app_settings.
 * Compartilhado entre o cliente (app-settings.ts) e o servidor (server.ts).
 */
import { AppError } from "@/lib/errors";
import { BRAND, COMPETITORS, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/constants";
import type { AppSettings, Competitor } from "@/types/database";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 1,
  clinic_name: "Instituto Décio Carrilho",
  crm_name: "IDC CRM",
  logo_url: null,
  primary_color: BRAND.primary,
  accent_color: BRAND.accent,
  competitors: COMPETITORS.map((c) => ({ ...c })),
  whatsapp_message: DEFAULT_WHATSAPP_MESSAGE,
  updated_at: new Date(0).toISOString(),
};

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function isCompetitorLike(value: unknown): value is { name: unknown; rating: unknown; reviews: unknown } {
  return typeof value === "object" && value !== null && "name" in value;
}

/** Lista de concorrentes vinda do JSONB: descarta itens malformados e limita nota (0–5) e avaliações (≥ 0). */
export function normalizeCompetitors(value: unknown): Competitor[] {
  if (!Array.isArray(value)) return DEFAULT_APP_SETTINGS.competitors.map((c) => ({ ...c }));
  const out: Competitor[] = [];
  for (const item of value) {
    if (!isCompetitorLike(item)) continue;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) continue;
    const rating = Number(item.rating);
    const reviews = Number(item.reviews);
    out.push({
      name,
      rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating * 10) / 10)) : 0,
      reviews: Number.isFinite(reviews) ? Math.max(0, Math.round(reviews)) : 0,
    });
  }
  return out;
}

function textOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/** Linha do banco (ou parcial/nula) → AppSettings completo, com padrões para campos ausentes/inválidos. */
export function normalizeAppSettings(row: Partial<AppSettings> | null | undefined): AppSettings {
  if (!row) return { ...DEFAULT_APP_SETTINGS, competitors: normalizeCompetitors(DEFAULT_APP_SETTINGS.competitors) };
  return {
    id: 1,
    clinic_name: textOr(row.clinic_name, DEFAULT_APP_SETTINGS.clinic_name),
    crm_name: textOr(row.crm_name, DEFAULT_APP_SETTINGS.crm_name),
    logo_url: typeof row.logo_url === "string" && row.logo_url.trim() ? row.logo_url.trim() : null,
    primary_color:
      typeof row.primary_color === "string" && HEX_COLOR.test(row.primary_color)
        ? row.primary_color
        : DEFAULT_APP_SETTINGS.primary_color,
    accent_color:
      typeof row.accent_color === "string" && HEX_COLOR.test(row.accent_color)
        ? row.accent_color
        : DEFAULT_APP_SETTINGS.accent_color,
    competitors: row.competitors === undefined ? normalizeCompetitors(DEFAULT_APP_SETTINGS.competitors) : normalizeCompetitors(row.competitors),
    whatsapp_message: textOr(row.whatsapp_message, DEFAULT_APP_SETTINGS.whatsapp_message),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : DEFAULT_APP_SETTINGS.updated_at,
  };
}

/** Campos editáveis em Configurações. */
export type AppSettingsUpdate = Partial<
  Pick<AppSettings, "clinic_name" | "crm_name" | "logo_url" | "primary_color" | "accent_color" | "competitors" | "whatsapp_message">
>;

/** Valida e limpa uma alteração de configurações. Lança AppError (pt-BR). */
export function sanitizeAppSettingsUpdate(patch: AppSettingsUpdate): AppSettingsUpdate {
  const out: AppSettingsUpdate = {};
  if (patch.clinic_name !== undefined) {
    const v = patch.clinic_name.trim();
    if (!v) throw new AppError("Informe o nome da clínica.");
    out.clinic_name = v;
  }
  if (patch.crm_name !== undefined) {
    const v = patch.crm_name.trim();
    if (!v) throw new AppError("Informe o nome do CRM.");
    out.crm_name = v;
  }
  if (patch.logo_url !== undefined) {
    const v = patch.logo_url?.trim() || null;
    if (v && !/^(https?:\/\/|\/)/i.test(v)) throw new AppError("URL do logo inválida. Use um endereço http(s).");
    out.logo_url = v;
  }
  for (const key of ["primary_color", "accent_color"] as const) {
    if (patch[key] === undefined) continue;
    const v = (patch[key] ?? "").trim();
    if (!HEX_COLOR.test(v)) throw new AppError("Cor inválida. Use o formato #RRGGBB.");
    out[key] = v.toUpperCase();
  }
  if (patch.competitors !== undefined) {
    if (!Array.isArray(patch.competitors)) throw new AppError("Lista de concorrentes inválida.");
    for (const c of patch.competitors) {
      if (!c.name?.trim()) throw new AppError("Informe o nome de todos os concorrentes.");
      if (!Number.isFinite(c.rating) || c.rating < 0 || c.rating > 5)
        throw new AppError(`Nota de "${c.name.trim()}" deve estar entre 0 e 5.`);
      if (!Number.isFinite(c.reviews) || c.reviews < 0)
        throw new AppError(`Avaliações de "${c.name.trim()}" não podem ser negativas.`);
    }
    out.competitors = normalizeCompetitors(patch.competitors);
  }
  if (patch.whatsapp_message !== undefined) {
    const v = patch.whatsapp_message.trim();
    if (!v) throw new AppError("Informe a mensagem padrão do WhatsApp.");
    out.whatsapp_message = v;
  }
  return out;
}
