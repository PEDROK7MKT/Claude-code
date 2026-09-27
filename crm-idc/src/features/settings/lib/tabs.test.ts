import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS_TAB, buildSettingsTabSearch, isSettingsTab, parseSettingsTab } from "./tabs";

describe("parseSettingsTab", () => {
  it("aceita as três abas", () => {
    expect(parseSettingsTab("usuarios")).toBe("usuarios");
    expect(parseSettingsTab("concorrentes")).toBe("concorrentes");
    expect(parseSettingsTab("personalizacao")).toBe("personalizacao");
  });

  it("tolera acentos, caixa e espaços", () => {
    expect(parseSettingsTab(" Personalização ")).toBe("personalizacao");
    expect(parseSettingsTab("USUÁRIOS")).toBe("usuarios");
  });

  it("valor ausente, lista ou desconhecido", () => {
    expect(parseSettingsTab(undefined)).toBe(DEFAULT_SETTINGS_TAB);
    expect(parseSettingsTab(null)).toBe(DEFAULT_SETTINGS_TAB);
    expect(parseSettingsTab(["concorrentes", "usuarios"])).toBe("concorrentes");
    expect(parseSettingsTab("financeiro")).toBe(DEFAULT_SETTINGS_TAB);
  });

  it("isSettingsTab", () => {
    expect(isSettingsTab("usuarios")).toBe(true);
    expect(isSettingsTab("Usuarios")).toBe(false);
    expect(isSettingsTab(1)).toBe(false);
  });
});

describe("buildSettingsTabSearch", () => {
  it("define ?aba= preservando outros parâmetros", () => {
    expect(buildSettingsTabSearch("", "concorrentes")).toBe("?aba=concorrentes");
    expect(buildSettingsTabSearch("?aba=usuarios&x=1", "personalizacao")).toBe("?aba=personalizacao&x=1");
    expect(buildSettingsTabSearch("x=1", "usuarios")).toBe("?x=1&aba=usuarios");
  });
});
