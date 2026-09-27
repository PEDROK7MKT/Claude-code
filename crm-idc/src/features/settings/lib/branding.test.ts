import { describe, expect, it } from "vitest";
import { DEFAULT_APP_SETTINGS } from "@/features/settings/api/defaults";
import { DEFAULT_WHATSAPP_MESSAGE } from "@/lib/constants";
import {
  brandingSchema,
  brandingValuesToUpdate,
  hasNamePlaceholder,
  insertAtSelection,
  isValidLogoUrl,
  previewColor,
  settingsToBrandingValues,
  unknownPlaceholders,
  whatsappPreview,
  type BrandingValues,
} from "./branding";

const valid: BrandingValues = settingsToBrandingValues(DEFAULT_APP_SETTINGS);

describe("isValidLogoUrl", () => {
  it("aceita http(s) e caminhos do próprio site", () => {
    expect(isValidLogoUrl("https://institutodeciocarrilho.com.br/logo.png")).toBe(true);
    expect(isValidLogoUrl("http://localhost:3000/logo.svg")).toBe(true);
    expect(isValidLogoUrl("/brand/logo.png")).toBe(true);
  });

  it("recusa protocolos perigosos, relativos ao protocolo e espaços", () => {
    expect(isValidLogoUrl("javascript:alert(1)")).toBe(false);
    expect(isValidLogoUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isValidLogoUrl("//evil.com/logo.png")).toBe(false);
    expect(isValidLogoUrl("logo.png")).toBe(false);
    expect(isValidLogoUrl("https://site.com/meu logo.png")).toBe(false);
    expect(isValidLogoUrl("")).toBe(false);
  });
});

describe("brandingSchema", () => {
  it("valores padrão são válidos", () => {
    expect(brandingSchema.safeParse(valid).success).toBe(true);
    expect(valid.logo_url).toBe("");
  });

  it("apara textos", () => {
    const parsed = brandingSchema.parse({ ...valid, crm_name: "  Painel IDC  " });
    expect(parsed.crm_name).toBe("Painel IDC");
  });

  it("mensagens em pt-BR para campos inválidos", () => {
    const result = brandingSchema.safeParse({
      ...valid,
      clinic_name: " ",
      primary_color: "#0D6",
      logo_url: "ftp://x.com/a.png",
      whatsapp_message: "",
    });
    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        "clinic_name: Informe o nome da clínica.",
        "primary_color: Use o formato #RRGGBB (ex.: #0D6E6E).",
        expect.stringMatching(/^logo_url: Use um endereço/),
        "whatsapp_message: Informe a mensagem padrão.",
      ]),
    );
  });

  it("limita o nome do CRM", () => {
    expect(brandingSchema.safeParse({ ...valid, crm_name: "x".repeat(41) }).success).toBe(false);
  });
});

describe("conversões", () => {
  it("logo vazio vira null e cores em maiúsculas", () => {
    expect(
      brandingValuesToUpdate({ ...valid, logo_url: "  ", primary_color: "#0d6e6e", accent_color: "#e8b931" }),
    ).toEqual({
      clinic_name: "Instituto Décio Carrilho",
      crm_name: "IDC CRM",
      logo_url: null,
      primary_color: "#0D6E6E",
      accent_color: "#E8B931",
      whatsapp_message: DEFAULT_WHATSAPP_MESSAGE,
    });
  });

  it("settingsToBrandingValues mantém o logo salvo", () => {
    expect(settingsToBrandingValues({ ...DEFAULT_APP_SETTINGS, logo_url: "/logo.png" }).logo_url).toBe("/logo.png");
  });

  it("previewColor usa o fallback enquanto a cor está incompleta", () => {
    expect(previewColor("#12", "#0D6E6E")).toBe("#0D6E6E");
    expect(previewColor("123456", "#0D6E6E")).toBe("#123456");
  });
});

describe("mensagem do WhatsApp", () => {
  it("substitui {nome} pelo primeiro nome e gera o link wa.me", () => {
    const preview = whatsappPreview("Olá {nome}! Tudo bem?", "Maria Silva", "(77) 98765-4321");
    expect(preview.text).toBe("Olá Maria! Tudo bem?");
    expect(preview.url).toBe(`https://wa.me/5577987654321?text=${encodeURIComponent("Olá Maria! Tudo bem?")}`);
  });

  it("sem nome remove o marcador sem deixar espaço antes da pontuação", () => {
    expect(whatsappPreview("Olá {nome}! Tudo bem?", null).text).toBe("Olá! Tudo bem?");
  });

  it("detecta marcadores", () => {
    expect(hasNamePlaceholder(DEFAULT_WHATSAPP_MESSAGE)).toBe(true);
    expect(hasNamePlaceholder("Olá!")).toBe(false);
    expect(unknownPlaceholders("Olá {nome}, {telefone} {Nome} {nome}")).toEqual(["{telefone}", "{Nome}"]);
    expect(unknownPlaceholders("Olá {nome}")).toEqual([]);
  });

  it("insertAtSelection insere no cursor ou substitui a seleção", () => {
    expect(insertAtSelection("Olá !", 4, 4)).toEqual({ value: "Olá {nome}!", caret: 10 });
    expect(insertAtSelection("Olá XX!", 4, 6)).toEqual({ value: "Olá {nome}!", caret: 10 });
    expect(insertAtSelection("Olá", null, null)).toEqual({ value: "Olá{nome}", caret: 9 });
    expect(insertAtSelection("abc", 99, 120)).toEqual({ value: "abc{nome}", caret: 9 });
  });
});
