import { describe, expect, it } from "vitest";
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar-constants";
import { parseSidebarCookie, resolveSidebarOpen, serializeSidebarCookie } from "./sidebar-state";

describe("parseSidebarCookie", () => {
  it("expandida por padrão; só 'false' recolhe", () => {
    expect(parseSidebarCookie(undefined)).toBe(true);
    expect(parseSidebarCookie("true")).toBe(true);
    expect(parseSidebarCookie("false")).toBe(false);
    expect(parseSidebarCookie("lixo")).toBe(true);
  });
});

describe("serializeSidebarCookie", () => {
  it("usa o mesmo formato do SidebarProvider", () => {
    expect(serializeSidebarCookie(false)).toBe(
      `${SIDEBAR_COOKIE_NAME}=false; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`,
    );
  });
});

describe("resolveSidebarOpen", () => {
  it("tablet usa o estado próprio (recolhido por padrão); desktop, a preferência salva", () => {
    expect(resolveSidebarOpen({ isTablet: true, desktopOpen: true, tabletOpen: false })).toBe(false);
    expect(resolveSidebarOpen({ isTablet: true, desktopOpen: false, tabletOpen: true })).toBe(true);
    expect(resolveSidebarOpen({ isTablet: false, desktopOpen: true, tabletOpen: false })).toBe(true);
    expect(resolveSidebarOpen({ isTablet: false, desktopOpen: false, tabletOpen: true })).toBe(false);
  });
});
