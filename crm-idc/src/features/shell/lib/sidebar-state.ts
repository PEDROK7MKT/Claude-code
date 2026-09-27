/**
 * Estado da sidebar por faixa de tela (spec §5 Responsividade):
 * - desktop (≥ 1024px): expandida 240px, salvo se o usuário recolheu (cookie);
 * - tablet (768–1023px): recolhida em ícones por padrão, o usuário ainda pode expandir;
 * - mobile (< 768px): menu hambúrguer (Sheet) — o estado `open` não se aplica.
 */
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar-constants";

export const TABLET_MEDIA_QUERY = "(min-width: 768px) and (max-width: 1023px)";

/** Valor do cookie → preferência do desktop (padrão: expandida). */
export function parseSidebarCookie(value: string | null | undefined): boolean {
  return value !== "false";
}

/** Cookie no mesmo formato gravado pelo SidebarProvider. */
export function serializeSidebarCookie(open: boolean): string {
  return `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
}

/** Aberta/fechada conforme a faixa de tela atual. */
export function resolveSidebarOpen({
  isTablet,
  desktopOpen,
  tabletOpen,
}: {
  isTablet: boolean;
  desktopOpen: boolean;
  tabletOpen: boolean;
}): boolean {
  return isTablet ? tabletOpen : desktopOpen;
}
