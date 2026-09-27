/**
 * Personalização do CRM (spec §4.8): nome, logo, cores e mensagem padrão do
 * WhatsApp. Schema do formulário, conversões e prévia da mensagem. Funções puras.
 */
import { z } from "zod";
import type { AppSettingsUpdate } from "@/features/settings/api/defaults";
import { whatsappUrl } from "@/lib/format";
import type { AppSettings } from "@/types/database";
import { ACCENT_FOREGROUND, isHexColor, normalizeHexInput } from "./color";

export const CLINIC_NAME_MAX = 80;
export const CRM_NAME_MAX = 40;
export const LOGO_URL_MAX = 500;
export const WHATSAPP_MESSAGE_MAX = 500;

/** Marcador substituído pelo primeiro nome do lead. */
export const NAME_PLACEHOLDER = "{nome}";

/** Lead fictício usado na prévia da mensagem. */
export const SAMPLE_LEAD = { name: "Maria Silva", phone: "77987654321" } as const;

/**
 * Logo: endereço http(s) absoluto ou caminho do próprio site ("/logo.png").
 * Bloqueia "//outro-site" (relativo ao protocolo), javascript:, data: etc.
 */
export function isValidLogoUrl(value: string): boolean {
  const url = value.trim();
  if (!url || /\s/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

const hexColorField = z
  .string()
  .trim()
  .refine((value) => isHexColor(value), "Use o formato #RRGGBB (ex.: #0D6E6E).");

export const brandingSchema = z.object({
  clinic_name: z
    .string()
    .trim()
    .min(1, "Informe o nome da clínica.")
    .max(CLINIC_NAME_MAX, `Use no máximo ${CLINIC_NAME_MAX} caracteres.`),
  crm_name: z
    .string()
    .trim()
    .min(1, "Informe o nome do CRM.")
    .max(CRM_NAME_MAX, `Use no máximo ${CRM_NAME_MAX} caracteres.`),
  logo_url: z
    .string()
    .trim()
    .max(LOGO_URL_MAX, "Endereço muito longo.")
    .refine((value) => !value || isValidLogoUrl(value), "Use um endereço https://… ou um caminho iniciado por /."),
  primary_color: hexColorField,
  accent_color: hexColorField,
  whatsapp_message: z
    .string()
    .trim()
    .min(1, "Informe a mensagem padrão.")
    .max(WHATSAPP_MESSAGE_MAX, `Use no máximo ${WHATSAPP_MESSAGE_MAX} caracteres.`),
});

export type BrandingValues = z.infer<typeof brandingSchema>;

/** Configurações salvas → valores do formulário. */
export function settingsToBrandingValues(settings: AppSettings): BrandingValues {
  return {
    clinic_name: settings.clinic_name,
    crm_name: settings.crm_name,
    logo_url: settings.logo_url ?? "",
    primary_color: settings.primary_color.toUpperCase(),
    accent_color: settings.accent_color.toUpperCase(),
    whatsapp_message: settings.whatsapp_message,
  };
}

/** Valores validados → alteração para useUpdateAppSettings (logo vazio = sem logo). */
export function brandingValuesToUpdate(values: BrandingValues): AppSettingsUpdate {
  return {
    clinic_name: values.clinic_name.trim(),
    crm_name: values.crm_name.trim(),
    logo_url: values.logo_url.trim() || null,
    primary_color: normalizeHexInput(values.primary_color) ?? values.primary_color,
    accent_color: normalizeHexInput(values.accent_color) ?? values.accent_color,
    whatsapp_message: values.whatsapp_message.trim(),
  };
}

/** Cor válida para pré-visualizar enquanto o admin digita (senão, o fallback). */
export function previewColor(value: string | null | undefined, fallback: string): string {
  return normalizeHexInput(value) ?? fallback;
}

/**
 * Tokens do tema derivados das cores da marca — espelha globals.css. Variáveis
 * CSS são resolvidas onde são declaradas (:root), então a prévia precisa
 * redefinir cada token derivado, não só --brand-primary/--brand-accent.
 */
export function brandThemeVars(primary: string, accent: string): Record<`--${string}`, string> {
  return {
    "--brand-primary": primary,
    "--brand-accent": accent,
    "--primary": primary,
    "--secondary": `color-mix(in srgb, ${primary} 7%, white)`,
    "--secondary-foreground": `color-mix(in srgb, ${primary} 70%, black)`,
    "--accent": `color-mix(in srgb, ${primary} 10%, white)`,
    "--accent-foreground": `color-mix(in srgb, ${primary} 70%, black)`,
    "--ring": primary,
    "--sidebar-primary": primary,
    "--sidebar-ring": primary,
    "--gold": accent,
    "--gold-foreground": ACCENT_FOREGROUND,
  };
}

export interface WhatsappPreview {
  /** Link wa.me gerado (o mesmo usado nos botões de WhatsApp dos leads) */
  url: string;
  /** Texto que o lead vai receber */
  text: string;
}

/** Prévia da mensagem padrão para um lead (com ou sem nome), via whatsappUrl(). */
export function whatsappPreview(
  template: string,
  leadName: string | null = SAMPLE_LEAD.name,
  phone: string = SAMPLE_LEAD.phone,
): WhatsappPreview {
  const url = whatsappUrl(phone, leadName, template);
  const text = new URL(url).searchParams.get("text") ?? "";
  return { url, text };
}

export function hasNamePlaceholder(template: string): boolean {
  return template.includes(NAME_PLACEHOLDER);
}

/** Marcadores {xxx} que não são substituídos (só {nome} é suportado). */
export function unknownPlaceholders(template: string): string[] {
  const found = template.match(/\{[^{}\s]{1,30}\}/g) ?? [];
  return [...new Set(found.filter((token) => token !== NAME_PLACEHOLDER))];
}

/** Insere o marcador na posição do cursor (substitui a seleção). Retorna o texto e a nova posição do cursor. */
export function insertAtSelection(
  text: string,
  selectionStart: number | null | undefined,
  selectionEnd: number | null | undefined,
  insertion: string = NAME_PLACEHOLDER,
): { value: string; caret: number } {
  const start = Math.min(Math.max(selectionStart ?? text.length, 0), text.length);
  const end = Math.min(Math.max(selectionEnd ?? start, start), text.length);
  const value = text.slice(0, start) + insertion + text.slice(end);
  return { value, caret: start + insertion.length };
}
