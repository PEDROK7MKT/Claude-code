import { describe, expect, it } from "vitest";
import {
  cleanLandingPath,
  composeNotes,
  inferServiceFromLandingPage,
  looksLikeUrl,
  matchService,
  normalizeWebhookLead,
  resolveExplicitSource,
  resolveService,
  resolveTracking,
} from "@/features/webhook/lib/normalize";
import { parseWebhookPayload, type WebhookLeadPayload } from "@/features/webhook/lib/schema";

function payload(raw: Record<string, unknown>): WebhookLeadPayload {
  const result = parseWebhookPayload(raw);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.data;
}

describe("resolveExplicitSource", () => {
  it("aceita valor, rótulo e apelidos", () => {
    expect(resolveExplicitSource("google_ads")).toBe("google_ads");
    expect(resolveExplicitSource("Google Ads")).toBe("google_ads");
    expect(resolveExplicitSource("google-ads")).toBe("google_ads");
    expect(resolveExplicitSource("Google Meu Negócio")).toBe("gmn");
    expect(resolveExplicitSource("GMB")).toBe("gmn");
    expect(resolveExplicitSource("Google (orgânico)")).toBe("google_organico");
    expect(resolveExplicitSource("Instagram")).toBe("instagram");
    expect(resolveExplicitSource("ig")).toBe("instagram");
    expect(resolveExplicitSource("Indicação")).toBe("indicacao");
    expect(resolveExplicitSource("Paciente retorno")).toBe("retorno");
  });

  it("valor desconhecido ou vazio → null (cai no palpite)", () => {
    expect(resolveExplicitSource("tiktok")).toBeNull();
    expect(resolveExplicitSource("google")).toBeNull();
    expect(resolveExplicitSource(null)).toBeNull();
  });
});

describe("serviço", () => {
  it("reconhece valor, rótulo e apelidos", () => {
    expect(matchService("implante")).toBe("implante");
    expect(matchService("Implante Dentário")).toBe("implante");
    expect(matchService("Prótese / Protocolo")).toBe("protese_protocolo");
    expect(matchService("Tratamento de Canal")).toBe("canal");
    expect(matchService("lentes de contato")).toBe("lente_contato");
    expect(matchService("aparelho")).toBe("ortodontia");
    expect(matchService("xyz")).toBeNull();
  });

  it("desconhecido vira 'outro' guardando o texto em service_detail", () => {
    expect(resolveService("Harmonização facial", null)).toEqual({
      service: "outro",
      service_detail: "Harmonização facial",
    });
    expect(resolveService("Harmonização facial", "botox na testa")).toEqual({
      service: "outro",
      service_detail: "Harmonização facial — botox na testa",
    });
  });

  it("conhecido mantém o detalhe enviado", () => {
    expect(resolveService("canal", "dor no dente 36")).toEqual({ service: "canal", service_detail: "dor no dente 36" });
    expect(resolveService(null, "dor")).toEqual({ service: null, service_detail: "dor" });
  });

  it("detalhe combinado respeita o limite de 200 caracteres", () => {
    const { service_detail } = resolveService("x".repeat(120), "y".repeat(200));
    expect(service_detail).toHaveLength(200);
  });

  it("palpite pela página de destino só com trecho inteiro do caminho", () => {
    expect(inferServiceFromLandingPage("/implante-dentario")).toBe("implante");
    expect(inferServiceFromLandingPage("/tratamentos/clareamento")).toBe("clareamento");
    expect(inferServiceFromLandingPage("/urgencia")).toBeNull();
    expect(inferServiceFromLandingPage("/")).toBeNull();
    expect(inferServiceFromLandingPage("/outro")).toBeNull();
    expect(inferServiceFromLandingPage(null)).toBeNull();
  });
});

describe("página de destino", () => {
  it("detecta URL completa, domínio e query string", () => {
    expect(looksLikeUrl("https://institutodeciocarrilho.com.br/urgencia")).toBe(true);
    expect(looksLikeUrl("institutodeciocarrilho.com.br/implante")).toBe(true);
    expect(looksLikeUrl("www.site.com")).toBe(true);
    expect(looksLikeUrl("/urgencia?utm_source=google")).toBe(true);
    expect(looksLikeUrl("/urgencia")).toBe(false);
    expect(looksLikeUrl("urgencia")).toBe(false);
  });

  it("limpa o caminho", () => {
    expect(cleanLandingPath("urgencia/")).toBe("/urgencia");
    expect(cleanLandingPath("/implante//")).toBe("/implante");
    expect(cleanLandingPath("/")).toBe("/");
    expect(cleanLandingPath("  ")).toBeNull();
  });
});

describe("resolveTracking", () => {
  const empty = {
    url: null,
    landing_page: null,
    campaign: null,
    keyword: null,
    gclid: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  };

  it("extrai tudo da URL completa (opção B)", () => {
    expect(
      resolveTracking({
        ...empty,
        url: "https://institutodeciocarrilho.com.br/urgencia?utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term=dentista%20barreiras&utm_content=anuncio1&gclid=abc123",
      }),
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
      sourceGuess: "google_ads",
    });
  });

  it("campos explícitos vencem os parâmetros da URL", () => {
    const tracking = resolveTracking({
      ...empty,
      url: "https://site.com.br/implante?utm_source=google&utm_medium=cpc&utm_campaign=idc_implante&utm_term=implante",
      landing_page: "/lp-implante",
      campaign: "Campanha Especial",
      keyword: "implante barreiras",
      utm_medium: "organic",
    });
    expect(tracking.landing_page).toBe("/lp-implante");
    expect(tracking.campaign).toBe("Campanha Especial");
    expect(tracking.keyword).toBe("implante barreiras");
    expect(tracking.utm_medium).toBe("organic");
    expect(tracking.utm_source).toBe("google");
    expect(tracking.sourceGuess).toBe("google_organico");
  });

  it("landing_page com URL completa também é lida como URL", () => {
    const tracking = resolveTracking({
      ...empty,
      landing_page: "https://institutodeciocarrilho.com.br/implante/?utm_source=instagram&utm_medium=social",
    });
    expect(tracking.landing_page).toBe("/implante");
    expect(tracking.utm_source).toBe("instagram");
    expect(tracking.sourceGuess).toBe("instagram");
  });

  it("palpite pela combinação dos campos explícitos (gclid → Google Ads)", () => {
    expect(resolveTracking({ ...empty, gclid: "xyz" }).sourceGuess).toBe("google_ads");
    expect(resolveTracking({ ...empty, utm_source: "gmn" }).sourceGuess).toBe("gmn");
    expect(resolveTracking({ ...empty }).sourceGuess).toBeNull();
  });

  it("gbraid/wbraid da URL (iOS) também indicam Google Ads", () => {
    expect(resolveTracking({ ...empty, url: "https://site.com.br/?gbraid=0AAAA" }).sourceGuess).toBe("google_ads");
  });

  it("nome de campanha canônico a partir do slug do utm_campaign", () => {
    expect(resolveTracking({ ...empty, utm_campaign: "idc_implante" }).campaign).toBe("IDC | Implante Dentário");
    expect(resolveTracking({ ...empty, campaign: "idc | urgencia e canal" }).campaign).toBe("IDC | Urgência e Canal");
  });

  it("corta parâmetros longos da URL", () => {
    const tracking = resolveTracking({ ...empty, url: `https://site.com.br/?utm_content=${"x".repeat(400)}` });
    expect(tracking.utm_content).toHaveLength(250);
  });
});

describe("composeNotes", () => {
  it("junta observação, mensagem e gclid", () => {
    expect(composeNotes({ notes: "Prefere manhã", message: "Oi, estou com dor", gclid: "abc" })).toBe(
      "Prefere manhã\nMensagem: Oi, estou com dor\ngclid (Google Ads): abc",
    );
  });

  it("sem nada → null", () => {
    expect(composeNotes({})).toBeNull();
  });
});

describe("normalizeWebhookLead", () => {
  it("monta a linha completa do lead", () => {
    const result = normalizeWebhookLead(
      payload({
        name: "Maria Silva",
        phone: "+55 (77) 98765-4321",
        url: "https://institutodeciocarrilho.com.br/urgencia?utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term=dentista%20barreiras&gclid=abc",
        service: "canal",
        service_detail: "dor no dente 36",
        message: "Olá, estou com muita dor",
      }),
      { mode: "public" },
    );
    expect(result).toEqual({
      ok: true,
      lead: {
        name: "Maria Silva",
        phone: "77987654321",
        source: "google_ads",
        campaign: "IDC | Urgência e Canal",
        keyword: "dentista barreiras",
        ad_group: null,
        landing_page: "/urgencia",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "idc_urgencia_canal",
        utm_term: "dentista barreiras",
        utm_content: null,
        service: "canal",
        service_detail: "dor no dente 36",
        notes: "Mensagem: Olá, estou com muita dor\ngclid (Google Ads): abc",
        parent_lead_id: null,
      },
    });
  });

  it("fonte: explícita válida > palpite > 'outro'", () => {
    const withGclid = { name: "A", phone: "77987654321", gclid: "abc" };
    const explicit = normalizeWebhookLead(payload({ ...withGclid, source: "indicacao" }), { mode: "secret" });
    const invalid = normalizeWebhookLead(payload({ ...withGclid, source: "tiktok" }), { mode: "secret" });
    const none = normalizeWebhookLead(payload({ name: "A", phone: "77987654321" }), { mode: "secret" });
    expect(explicit.ok && explicit.lead.source).toBe("indicacao");
    expect(invalid.ok && invalid.lead.source).toBe("google_ads");
    expect(none.ok && none.lead.source).toBe("outro");
  });

  it("telefone obrigatório e válido", () => {
    expect(normalizeWebhookLead(payload({ name: "A" }), { mode: "secret" })).toEqual({
      ok: false,
      errors: [{ field: "phone", message: "Informe o telefone (WhatsApp) com DDD." }],
    });
    expect(normalizeWebhookLead(payload({ name: "A", phone: "98765-4321" }), { mode: "secret" })).toEqual({
      ok: false,
      errors: [{ field: "phone", message: "Telefone inválido. Informe DDD + número, ex.: (77) 98765-4321." }],
    });
  });

  it("modo público exige nome e telefone (lista os dois erros)", () => {
    expect(normalizeWebhookLead(payload({}), { mode: "public" })).toEqual({
      ok: false,
      errors: [
        { field: "name", message: "Informe o nome do paciente." },
        { field: "phone", message: "Informe o telefone (WhatsApp) com DDD." },
      ],
    });
  });

  it("integração com segredo pode omitir o nome", () => {
    const result = normalizeWebhookLead(payload({ phone: "77987654321" }), { mode: "secret" });
    expect(result.ok && result.lead.name).toBe("Lead sem nome");
  });

  it("serviço desconhecido → 'outro' e palpite pela página quando não informado", () => {
    const unknown = normalizeWebhookLead(payload({ name: "A", phone: "77987654321", service: "Botox" }), {
      mode: "secret",
    });
    expect(unknown.ok && [unknown.lead.service, unknown.lead.service_detail]).toEqual(["outro", "Botox"]);

    const inferred = normalizeWebhookLead(payload({ name: "A", phone: "77987654321", landing_page: "/implante" }), {
      mode: "secret",
    });
    expect(inferred.ok && inferred.lead.service).toBe("implante");
  });

  it("aceita apelidos em português de plugins de formulário", () => {
    const result = normalizeWebhookLead(
      payload({ nome: "João", whatsapp: "(77) 3611-2233", servico: "Clareamento", mensagem: "Quanto custa?" }),
      { mode: "public" },
    );
    expect(result.ok && result.lead).toMatchObject({
      name: "João",
      phone: "7736112233",
      service: "clareamento",
      notes: "Mensagem: Quanto custa?",
    });
  });
});
