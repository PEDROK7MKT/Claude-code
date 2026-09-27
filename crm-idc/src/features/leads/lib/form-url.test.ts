import { describe, expect, it } from "vitest";

import { parseLeadUrl } from "@/lib/utm";

import { NONE_OPTION, emptyLeadFormValues } from "./form-schema";
import { buildUrlAutofill, describeUrlAutofill, isSourceOpenForGuess, listFieldLabels, looksLikeUrl } from "./form-url";

const ADS_URL =
  "https://institutodeciocarrilho.com.br/urgencia?utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term=dentista%20barreiras&utm_content=anuncio1&gclid=abc";

describe("looksLikeUrl", () => {
  it("aceita URLs completas, sem protocolo, caminhos e query strings", () => {
    expect(looksLikeUrl(ADS_URL)).toBe(true);
    expect(looksLikeUrl("  institutodeciocarrilho.com.br/implante?utm_source=instagram ")).toBe(true);
    expect(looksLikeUrl("/urgencia?utm_source=google")).toBe(true);
    expect(looksLikeUrl("?utm_source=google&utm_medium=cpc")).toBe(true);
    expect(looksLikeUrl("site.com.br")).toBe(true);
  });

  it("rejeita texto comum", () => {
    expect(looksLikeUrl("texto qualquer")).toBe(false);
    expect(looksLikeUrl("dentista")).toBe(false);
    expect(looksLikeUrl("")).toBe(false);
    expect(looksLikeUrl(null)).toBe(false);
  });
});

describe("buildUrlAutofill", () => {
  it("preenche fonte, campanha, palavra-chave, página e UTMs num formulário vazio", () => {
    const result = buildUrlAutofill(emptyLeadFormValues(), parseLeadUrl(ADS_URL));
    expect(result.patch).toEqual({
      source: "google_ads",
      campaignOption: "IDC | Urgência e Canal",
      campaignOther: "",
      keyword: "dentista barreiras",
      landing_page: "/urgencia",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "idc_urgencia_canal",
      utm_term: "dentista barreiras",
      utm_content: "anuncio1",
    });
    expect(result.filled).toEqual([
      "source",
      "campaign",
      "keyword",
      "landing_page",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ]);
    expect(result.found).toBe(true);
    expect(result.hasClickId).toBe(true);
    expect(result.ignoredSource).toBeNull();
  });

  it("fonte 'outro' é substituída pelo palpite da URL", () => {
    const result = buildUrlAutofill(emptyLeadFormValues({ source: "outro" }), parseLeadUrl(ADS_URL));
    expect(result.patch.source).toBe("google_ads");
  });

  it("fonte já escolhida é mantida e o palpite é informado", () => {
    const result = buildUrlAutofill(emptyLeadFormValues({ source: "indicacao" }), parseLeadUrl(ADS_URL));
    expect(result.patch).not.toHaveProperty("source");
    expect(result.ignoredSource).toBe("google_ads");
    expect(describeUrlAutofill(result)).toContain("A URL indica Google Ads, mas a fonte escolhida foi mantida.");
  });

  it("colar a mesma URL de novo não altera nada", () => {
    const first = buildUrlAutofill(emptyLeadFormValues(), parseLeadUrl(ADS_URL));
    const values = { ...emptyLeadFormValues(), ...first.patch };
    const second = buildUrlAutofill(values, parseLeadUrl(ADS_URL));
    expect(second.patch).toEqual({});
    expect(second.filled).toEqual([]);
    expect(second.unchanged).toHaveLength(9);
    expect(describeUrlAutofill(second)).toBe("Os campos já estavam preenchidos com os dados dessa URL.");
  });

  it("valores da URL substituem os digitados; campos ausentes na URL ficam como estão", () => {
    const values = emptyLeadFormValues({ source: "instagram", keyword: "antiga", ad_group: "Grupo A" });
    const result = buildUrlAutofill(values, parseLeadUrl("site.com.br/implante?utm_source=instagram&utm_medium=social"));
    expect(result.patch).toEqual({ landing_page: "/implante", utm_source: "instagram", utm_medium: "social" });
    expect(result.unchanged).toEqual(["source"]);
  });

  it("URL sem nada aproveitável", () => {
    const result = buildUrlAutofill(emptyLeadFormValues(), parseLeadUrl(""));
    expect(result.found).toBe(false);
    expect(result.patch).toEqual({});
    expect(describeUrlAutofill(result)).toBe("Nenhum parâmetro de rastreamento encontrado nessa URL.");
  });

  it("campanha: mantém quando já é a mesma (slug × nome)", () => {
    const values = emptyLeadFormValues({ campaignOption: "IDC | Urgência e Canal" });
    const result = buildUrlAutofill(values, parseLeadUrl("/?utm_campaign=idc_urgencia_canal"));
    expect(result.unchanged).toContain("campaign");
    expect(result.patch).not.toHaveProperty("campaignOption");
    expect(values.campaignOption).not.toBe(NONE_OPTION);
  });
});

describe("textos", () => {
  it("describeUrlAutofill lista os campos preenchidos", () => {
    const result = buildUrlAutofill(emptyLeadFormValues({ source: "google_ads" }), parseLeadUrl("/urgencia"));
    expect(describeUrlAutofill(result)).toBe("1 campo preenchido: Página de destino.");
    const many = buildUrlAutofill(emptyLeadFormValues(), parseLeadUrl(ADS_URL));
    expect(describeUrlAutofill(many)).toMatch(/^9 campos preenchidos: Fonte, Campanha, Palavra-chave, .* e utm_content\.$/);
  });

  it("listFieldLabels", () => {
    expect(listFieldLabels([])).toBe("");
    expect(listFieldLabels(["keyword"])).toBe("Palavra-chave");
    expect(listFieldLabels(["source", "campaign"])).toBe("Fonte e Campanha");
  });

  it("isSourceOpenForGuess", () => {
    expect(isSourceOpenForGuess("")).toBe(true);
    expect(isSourceOpenForGuess("outro")).toBe(true);
    expect(isSourceOpenForGuess("gmn")).toBe(false);
  });
});
