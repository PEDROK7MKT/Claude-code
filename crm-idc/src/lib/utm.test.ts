import { describe, expect, it } from "vitest";
import { canonicalCampaignName, hasTrackingData, parseLeadUrl } from "@/lib/utm";

describe("parseLeadUrl", () => {
  it("URL completa do Google Ads", () => {
    expect(
      parseLeadUrl(
        "https://institutodeciocarrilho.com.br/urgencia?utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term=dentista%20barreiras&utm_content=anuncio1&gclid=abc123",
      ),
    ).toEqual({
      landing_page: "/urgencia",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "idc_urgencia_canal",
      utm_term: "dentista barreiras",
      utm_content: "anuncio1",
      keyword: "dentista barreiras",
      campaign: "IDC | Urgência e Canal",
      gclid: "abc123",
      source: "google_ads",
    });
  });

  it("URL sem protocolo", () => {
    const r = parseLeadUrl("institutodeciocarrilho.com.br/implante?utm_source=google&utm_medium=cpc&utm_campaign=idc_implante");
    expect(r.landing_page).toBe("/implante");
    expect(r.campaign).toBe("IDC | Implante Dentário");
    expect(r.source).toBe("google_ads");
  });

  it("domínio com www e query sem barra", () => {
    const r = parseLeadUrl("www.institutodeciocarrilho.com.br?utm_source=instagram&utm_medium=social");
    expect(r.landing_page).toBe("/");
    expect(r.source).toBe("instagram");
  });

  it("query string solta (com e sem ?)", () => {
    const r = parseLeadUrl("utm_source=google&utm_medium=cpc&utm_term=implante+dentario");
    expect(r.landing_page).toBeNull();
    expect(r.keyword).toBe("implante dentario");
    expect(r.source).toBe("google_ads");
    const q = parseLeadUrl("?gclid=xyz");
    expect(q.landing_page).toBeNull();
    expect(q.gclid).toBe("xyz");
    expect(q.source).toBe("google_ads");
  });

  it("caminho relativo remove barra final", () => {
    const r = parseLeadUrl("/urgencia/?utm_source=gmn");
    expect(r.landing_page).toBe("/urgencia");
    expect(r.source).toBe("gmn");
  });

  it("decodifica o caminho", () => {
    expect(parseLeadUrl("site.com.br/implante-dent%C3%A1rio?x=1").landing_page).toBe("/implante-dentário");
  });

  it("palavra-chave: utm_term > keyword > kw", () => {
    expect(parseLeadUrl("site.com/?keyword=canal+dor").keyword).toBe("canal dor");
    expect(parseLeadUrl("site.com/?kw=clareamento").keyword).toBe("clareamento");
    expect(parseLeadUrl("site.com/?kw=b&keyword=a&utm_term=t").keyword).toBe("t");
  });

  it("ignora ValueTrack não substituído ({keyword})", () => {
    const r = parseLeadUrl("site.com/?utm_term={keyword}&kw=dentista&utm_campaign={campaignname}");
    expect(r.utm_term).toBeNull();
    expect(r.keyword).toBe("dentista");
    expect(r.utm_campaign).toBeNull();
    expect(r.campaign).toBeNull();
  });

  it("parâmetros em maiúsculas e valores vazios", () => {
    const r = parseLeadUrl("site.com/?UTM_SOURCE=Google&UTM_MEDIUM=CPC&utm_content=");
    expect(r.utm_source).toBe("Google");
    expect(r.utm_content).toBeNull();
    expect(r.source).toBe("google_ads");
  });

  it("primeira ocorrência não vazia vence", () => {
    expect(parseLeadUrl("site.com/?utm_source=&utm_source=google").utm_source).toBe("google");
  });

  it("campanha: slug, nome exato (sem diferenciar caixa/acentos) ou texto livre", () => {
    expect(parseLeadUrl("?utm_campaign=IDC-Implante").campaign).toBe("IDC | Implante Dentário");
    expect(parseLeadUrl("?utm_campaign=IDC%20%7C%20URG%C3%8ANCIA%20E%20CANAL").campaign).toBe("IDC | Urgência e Canal");
    expect(parseLeadUrl("?utm_campaign=Black+Friday").campaign).toBe("Black Friday");
  });

  it.each([
    ["?utm_source=google&utm_medium=ppc", "google_ads"],
    ["?utm_source=adwords&utm_medium=paid", "google_ads"],
    ["?gbraid=0AAA", "google_ads"],
    ["?wbraid=0BBB&utm_source=instagram", "google_ads"],
    ["?utm_source=google&utm_medium=organic&utm_campaign=gbp_listing", "gmn"],
    ["?utm_source=gmb", "gmn"],
    ["?utm_source=google-business&utm_medium=profile", "gmn"],
    ["?utm_source=google&utm_medium=gmn", "gmn"],
    ["?utm_source=ig", "instagram"],
    ["?utm_source=l.instagram.com&utm_medium=social", "instagram"],
    ["?utm_source=Instagram_Stories", "instagram"],
    ["?utm_source=google&utm_medium=organic", "google_organico"],
    ["?utm_source=google", "google_organico"],
    ["?utm_source=facebook&utm_medium=cpc", null],
    ["?utm_source=google&utm_medium=email", null],
    ["site.com/sem-parametros", null],
  ])("fonte de %s → %s", (input, expected) => {
    expect(parseLeadUrl(input).source).toBe(expected);
  });

  it("gbraid não é copiado para gclid", () => {
    expect(parseLeadUrl("?gbraid=0AAA").gclid).toBeNull();
  });

  it("parâmetros depois do # (SPA)", () => {
    const r = parseLeadUrl("https://site.com/#/implante?utm_source=google&utm_medium=cpc&utm_term=implante");
    expect(r.landing_page).toBe("/");
    expect(r.keyword).toBe("implante");
    expect(r.source).toBe("google_ads");
  });

  it("URL malformada é separada manualmente", () => {
    const r = parseLeadUrl("http://exa mple.com/promo?utm_source=google&utm_medium=cpc");
    expect(r.landing_page).toBe("/promo");
    expect(r.utm_source).toBe("google");
  });

  it("vazio / nulo → tudo nulo", () => {
    for (const input of ["", "   ", null, undefined]) {
      const r = parseLeadUrl(input);
      expect(Object.values(r).every((v) => v === null)).toBe(true);
    }
  });
});

describe("hasTrackingData", () => {
  it("detecta UTM, gclid ou palavra-chave", () => {
    expect(hasTrackingData(parseLeadUrl("site.com/urgencia"))).toBe(false);
    expect(hasTrackingData(parseLeadUrl("site.com/?kw=canal"))).toBe(true);
    expect(hasTrackingData(parseLeadUrl("?gclid=1"))).toBe(true);
  });
});

describe("canonicalCampaignName", () => {
  it.each([
    ["idc_urgencia_canal", "IDC | Urgência e Canal"],
    ["IDC | URGÊNCIA E CANAL", "IDC | Urgência e Canal"],
    ["  idc | implante   dentário ", "IDC | Implante Dentário"],
    ["idc-implante", "IDC | Implante Dentário"],
    ["  Outra   Campanha ", "Outra Campanha"],
  ])("%j → %j", (input, expected) => {
    expect(canonicalCampaignName(input)).toBe(expected);
  });

  it("vazio → null", () => {
    expect(canonicalCampaignName("")).toBeNull();
    expect(canonicalCampaignName("   ")).toBeNull();
    expect(canonicalCampaignName(null)).toBeNull();
    expect(canonicalCampaignName(undefined)).toBeNull();
  });
});
