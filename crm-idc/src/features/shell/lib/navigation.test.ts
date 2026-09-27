import { describe, expect, it } from "vitest";
import {
  NAV_ITEMS,
  describeNewLeads,
  formatNavBadgeCount,
  getActiveNavItem,
  getBreadcrumbs,
  getNavItems,
  isNavItemActive,
  normalizePathname,
} from "./navigation";

describe("NAV_ITEMS / getNavItems", () => {
  it("segue a ordem da spec", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard",
      "Leads",
      "Kanban",
      "Google Ads",
      "Google Meu Negócio",
      "Relatórios",
      "Configurações",
    ]);
  });

  it("Configurações só aparece para admin", () => {
    expect(getNavItems(true).map((i) => i.id)).toContain("configuracoes");
    expect(getNavItems(false).map((i) => i.id)).not.toContain("configuracoes");
    expect(getNavItems(false)).toHaveLength(NAV_ITEMS.length - 1);
  });
});

describe("normalizePathname", () => {
  it("remove barras finais, query e hash", () => {
    expect(normalizePathname("/leads/")).toBe("/leads");
    expect(normalizePathname("/leads?status=novo")).toBe("/leads");
    expect(normalizePathname("/leads#topo")).toBe("/leads");
    expect(normalizePathname("")).toBe("/");
    expect(normalizePathname(null)).toBe("/");
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("leads")).toBe("/leads");
  });
});

describe("isNavItemActive", () => {
  it("casa por segmento (prefixo)", () => {
    expect(isNavItemActive("/leads", "/leads")).toBe(true);
    expect(isNavItemActive("/leads/novo", "/leads")).toBe(true);
    expect(isNavItemActive("/leads/2f1c/historico", "/leads")).toBe(true);
    expect(isNavItemActive("/leads/", "/leads")).toBe(true);
  });

  it("não confunde rotas com o mesmo prefixo de texto", () => {
    expect(isNavItemActive("/leadsx", "/leads")).toBe(false);
    expect(isNavItemActive("/dashboard", "/leads")).toBe(false);
    expect(isNavItemActive(null, "/leads")).toBe(false);
  });

  it("raiz só casa com a raiz", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/leads", "/")).toBe(false);
  });
});

describe("getActiveNavItem", () => {
  it("encontra a seção da rota", () => {
    expect(getActiveNavItem("/gmn")?.id).toBe("gmn");
    expect(getActiveNavItem("/configuracoes/usuarios")?.id).toBe("configuracoes");
    expect(getActiveNavItem("/desconhecida")).toBeNull();
  });
});

describe("getBreadcrumbs", () => {
  it("seções viram um único item sem link", () => {
    expect(getBreadcrumbs("/dashboard")).toEqual([{ label: "Dashboard" }]);
    expect(getBreadcrumbs("/kanban")).toEqual([{ label: "Kanban" }]);
    expect(getBreadcrumbs("/google-ads")).toEqual([{ label: "Google Ads" }]);
    expect(getBreadcrumbs("/gmn")).toEqual([{ label: "Google Meu Negócio" }]);
    expect(getBreadcrumbs("/relatorios")).toEqual([{ label: "Relatórios" }]);
    expect(getBreadcrumbs("/configuracoes")).toEqual([{ label: "Configurações" }]);
    expect(getBreadcrumbs("/leads/")).toEqual([{ label: "Leads" }]);
  });

  it("subpáginas de leads", () => {
    expect(getBreadcrumbs("/leads/novo")).toEqual([{ label: "Leads", href: "/leads" }, { label: "Novo lead" }]);
    expect(getBreadcrumbs("/leads/9b2e6c1a-0000-4000-8000-000000000000")).toEqual([
      { label: "Leads", href: "/leads" },
      { label: "Detalhe do lead" },
    ]);
  });

  it("subpáginas não mapeadas mostram a seção; rotas desconhecidas não têm trilha", () => {
    expect(getBreadcrumbs("/configuracoes/usuarios")).toEqual([{ label: "Configurações", href: "/configuracoes" }]);
    expect(getBreadcrumbs("/qualquer")).toEqual([]);
  });
});

describe("formatNavBadgeCount / describeNewLeads", () => {
  it("esconde zero/inválidos e limita em 99+", () => {
    expect(formatNavBadgeCount(0)).toBeNull();
    expect(formatNavBadgeCount(-2)).toBeNull();
    expect(formatNavBadgeCount(undefined)).toBeNull();
    expect(formatNavBadgeCount(Number.NaN)).toBeNull();
    expect(formatNavBadgeCount(1)).toBe("1");
    expect(formatNavBadgeCount(99)).toBe("99");
    expect(formatNavBadgeCount(100)).toBe("99+");
  });

  it("singular e plural em pt-BR", () => {
    expect(describeNewLeads(1)).toBe("1 novo lead");
    expect(describeNewLeads(3)).toBe("3 novos leads");
    expect(describeNewLeads(1200)).toBe("1.200 novos leads");
  });
});
