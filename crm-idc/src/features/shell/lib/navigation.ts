/**
 * Navegação do app autenticado: itens da sidebar (spec §5), item ativo e trilha do header.
 * Funções puras — os ícones ficam no componente (app-sidebar.tsx).
 */

export type NavItemId = "dashboard" | "leads" | "kanban" | "google-ads" | "gmn" | "relatorios" | "configuracoes";

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  /** Visível só para o gestor de tráfego (admin) */
  adminOnly?: boolean;
}

/** Ordem da spec §5: Dashboard, Leads, Kanban, Google Ads, GMN, Relatórios, Configurações (só admin). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "leads", label: "Leads", href: "/leads" },
  { id: "kanban", label: "Kanban", href: "/kanban" },
  { id: "google-ads", label: "Google Ads", href: "/google-ads" },
  { id: "gmn", label: "Google Meu Negócio", href: "/gmn" },
  { id: "relatorios", label: "Relatórios", href: "/relatorios" },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes", adminOnly: true },
];

export const NEW_LEAD_PATH = "/leads/novo";

export function getNavItems(isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}

/** Remove query/hash e barras finais ("/leads/" → "/leads"; "" → "/"). */
export function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const path = pathname.split(/[?#]/, 1)[0] ?? "";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : trimmed ? `/${trimmed}` : "/";
}

/** Item ativo por prefixo de segmento: "/leads/123" ativa "Leads"; "/leadsx" não. */
export function isNavItemActive(pathname: string | null | undefined, href: string): boolean {
  const path = normalizePathname(pathname);
  const target = normalizePathname(href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}

export function getActiveNavItem(pathname: string | null | undefined): NavItem | null {
  return NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href)) ?? null;
}

export interface BreadcrumbEntry {
  label: string;
  /** Ausente no item atual (último) */
  href?: string;
}

/**
 * Trilha do header a partir do pathname:
 * "/leads/novo" → Leads › Novo lead; "/leads/<id>" → Leads › Detalhe do lead;
 * seções → um único item. Rotas desconhecidas → [].
 */
export function getBreadcrumbs(pathname: string | null | undefined): BreadcrumbEntry[] {
  const path = normalizePathname(pathname);
  const section = getActiveNavItem(path);
  if (!section) return [];
  if (path === section.href) return [{ label: section.label }];

  if (section.id === "leads") {
    const [, , child] = path.split("/");
    const label = child === "novo" ? "Novo lead" : "Detalhe do lead";
    return [{ label: section.label, href: section.href }, { label }];
  }
  // subpáginas ainda não mapeadas: mostra a seção
  return [{ label: section.label, href: section.href }];
}

/** Título da página atual (último item da trilha). */
export function getPageTitle(pathname: string | null | undefined, fallback = "IDC CRM"): string {
  const crumbs = getBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? fallback;
}

/** Texto do badge de novos leads (limita em "99+"); `null` esconde o badge. */
export function formatNavBadgeCount(count: number | null | undefined): string | null {
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.floor(count));
}

/** "1 novo lead" / "3 novos leads" (leitores de tela e tooltip). */
export function describeNewLeads(count: number): string {
  return count === 1 ? "1 novo lead" : `${count.toLocaleString("pt-BR")} novos leads`;
}
