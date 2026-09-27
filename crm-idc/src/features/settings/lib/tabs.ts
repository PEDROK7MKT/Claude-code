/**
 * Abas de Configurações (spec §4.8), com link direto via `?aba=`.
 * Funções puras — usadas pela página (servidor) e pela view (cliente).
 */
import { foldText } from "@/lib/format";

export const SETTINGS_TAB_PARAM = "aba";

export const SETTINGS_TABS = [
  { value: "usuarios", label: "Usuários", description: "Contas de acesso ao CRM" },
  { value: "concorrentes", label: "Concorrentes", description: "Comparativo do Google Meu Negócio" },
  { value: "personalizacao", label: "Personalização", description: "Nome, logo, cores e WhatsApp" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];

export const DEFAULT_SETTINGS_TAB: SettingsTab = "usuarios";

export function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === "string" && SETTINGS_TABS.some((tab) => tab.value === value);
}

/** Remove acentos, caixa e espaços das pontas: "Personalização" → "personalizacao". */
function slug(value: string): string {
  return foldText(value).trim();
}

/** Valor de `?aba=` (string, lista ou ausente) → aba válida; desconhecida cai em "usuarios". */
export function parseSettingsTab(value: string | readonly string[] | null | undefined): SettingsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return DEFAULT_SETTINGS_TAB;
  const normalized = slug(raw);
  return isSettingsTab(normalized) ? normalized : DEFAULT_SETTINGS_TAB;
}

/** Query string com a aba escolhida, preservando os demais parâmetros: "?aba=concorrentes". */
export function buildSettingsTabSearch(currentSearch: string, tab: SettingsTab): string {
  const params = new URLSearchParams(currentSearch);
  params.set(SETTINGS_TAB_PARAM, tab);
  return `?${params.toString()}`;
}
