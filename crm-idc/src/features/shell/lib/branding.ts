/**
 * Marca do CRM (Configurações → Personalização): cores aplicadas como variáveis CSS
 * no <html> (`--brand-primary`, `--brand-accent`; globals.css deriva o tema delas).
 */
import { BRAND } from "@/lib/constants";
import type { AppSettings } from "@/types/database";

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Cor hex válida (#RGB ou #RRGGBB), normalizada para #RRGGBB maiúsculo; senão, o fallback. */
export function safeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const color = value.trim();
  if (!HEX_COLOR.test(color)) return fallback;
  if (color.length === 4) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return color.toUpperCase();
}

export type BrandCssVariables = Record<"--brand-primary" | "--brand-accent", string>;

/** Estilo inline do <html> com as cores da marca (padrões IDC se inválidas). */
export function brandCssVariables(
  settings: Partial<Pick<AppSettings, "primary_color" | "accent_color">> | null | undefined,
): BrandCssVariables {
  return {
    "--brand-primary": safeHexColor(settings?.primary_color, BRAND.primary),
    "--brand-accent": safeHexColor(settings?.accent_color, BRAND.accent),
  };
}
