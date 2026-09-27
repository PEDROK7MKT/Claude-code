import { describe, expect, it } from "vitest";
import { COMPETITORS, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/constants";
import { DEFAULT_APP_SETTINGS, normalizeAppSettings, normalizeCompetitors, sanitizeAppSettingsUpdate } from "./defaults";

describe("normalizeAppSettings", () => {
  it("sem linha → padrões (concorrentes e mensagem das constantes)", () => {
    const s = normalizeAppSettings(null);
    expect(s.competitors).toEqual(COMPETITORS);
    expect(s.whatsapp_message).toBe(DEFAULT_WHATSAPP_MESSAGE);
    expect(s.primary_color).toBe("#0D6E6E");
  });

  it("corrige campos inválidos e mantém os válidos", () => {
    const s = normalizeAppSettings({
      clinic_name: "  ",
      crm_name: "Painel IDC",
      primary_color: "teal",
      accent_color: "#112233",
      logo_url: " ",
      competitors: [{ name: " X ", rating: 7, reviews: -3 }, { name: "" }, "lixo"] as never,
    });
    expect(s.clinic_name).toBe(DEFAULT_APP_SETTINGS.clinic_name);
    expect(s.crm_name).toBe("Painel IDC");
    expect(s.primary_color).toBe(DEFAULT_APP_SETTINGS.primary_color);
    expect(s.accent_color).toBe("#112233");
    expect(s.logo_url).toBeNull();
    expect(s.competitors).toEqual([{ name: "X", rating: 5, reviews: 0 }]);
  });

  it("normalizeCompetitors com valor não-array usa os padrões", () => {
    expect(normalizeCompetitors({})).toEqual(COMPETITORS);
  });
});

describe("sanitizeAppSettingsUpdate", () => {
  it("limpa e valida", () => {
    expect(
      sanitizeAppSettingsUpdate({
        crm_name: " IDC ",
        primary_color: "#0d6e6e",
        logo_url: "",
        competitors: [{ name: " A ", rating: 4.94, reviews: 10.2 }],
      }),
    ).toEqual({
      crm_name: "IDC",
      primary_color: "#0D6E6E",
      logo_url: null,
      competitors: [{ name: "A", rating: 4.9, reviews: 10 }],
    });
  });

  it("rejeita valores inválidos", () => {
    expect(() => sanitizeAppSettingsUpdate({ primary_color: "red" })).toThrow(/#RRGGBB/);
    expect(() => sanitizeAppSettingsUpdate({ clinic_name: " " })).toThrow(/nome da clínica/);
    expect(() => sanitizeAppSettingsUpdate({ logo_url: "javascript:alert(1)" })).toThrow(/URL do logo/);
    expect(() => sanitizeAppSettingsUpdate({ competitors: [{ name: "A", rating: 6, reviews: 1 }] })).toThrow(/entre 0 e 5/);
    expect(() => sanitizeAppSettingsUpdate({ whatsapp_message: "" })).toThrow(/WhatsApp/);
  });
});
