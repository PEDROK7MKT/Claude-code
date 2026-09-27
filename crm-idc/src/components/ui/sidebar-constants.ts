/**
 * Constantes da Sidebar em módulo sem "use client", para que o layout (Server
 * Component) possa ler o cookie e passar `defaultOpen` ao `SidebarProvider`:
 *
 *   const defaultOpen = (await cookies()).get(SIDEBAR_COOKIE_NAME)?.value !== "false";
 */
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
/** Desktop: 240px (spec §5 "sidebar fixa 240px"). */
export const SIDEBAR_WIDTH = "15rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
/** Ctrl/⌘ + B alterna a sidebar. */
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";
