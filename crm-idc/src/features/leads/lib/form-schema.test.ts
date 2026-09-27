import { describe, expect, it } from "vitest";

import type { Lead } from "@/types/database";

import {
  NONE_OPTION,
  OTHER_CAMPAIGN_OPTION,
  PHONE_ERROR_MESSAGE,
  campaignFromOptions,
  campaignToOptions,
  emptyLeadFormValues,
  formatMoneyInput,
  hasUtmValues,
  leadFormSchema,
  leadToFormValues,
  maskLeadPhoneInput,
  moneyToInput,
  parseMoneyInput,
  shouldShowAdTracking,
  textOrNull,
  toLeadFormOutput,
  type LeadFormValues,
} from "./form-schema";

function valid(overrides: Partial<LeadFormValues> = {}): LeadFormValues {
  return emptyLeadFormValues({ name: "Maria Souza", phone: "(77) 98765-4321", source: "instagram", ...overrides });
}

function errorsOf(values: LeadFormValues): Record<string, string> {
  const result = leadFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

const LEAD: Lead = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "João da Silva",
  phone: "77987654321",
  notes: "Prefere manhã",
  source: "google_ads",
  campaign: "IDC | Implante Dentário",
  keyword: "implante barreiras",
  ad_group: "Implante",
  landing_page: "/implante",
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "idc_implante",
  utm_term: "implante barreiras",
  utm_content: null,
  service: "implante",
  service_detail: "perdeu 2 dentes",
  status: "novo",
  contacted_at: null,
  scheduled_at: null,
  confirmed_at: null,
  attended_at: null,
  estimated_value: 3500,
  parent_lead_id: null,
  created_by: null,
  assigned_to: "22222222-2222-4222-8222-222222222222",
  created_at: "2026-03-01T12:00:00.000Z",
  updated_at: "2026-03-01T12:00:00.000Z",
};

describe("leadFormSchema — obrigatórios", () => {
  it("exige nome, telefone e fonte com mensagens em pt-BR", () => {
    const errors = errorsOf(emptyLeadFormValues());
    expect(errors.name).toBe("Informe o nome do lead.");
    expect(errors.phone).toBe(PHONE_ERROR_MESSAGE);
    expect(errors.source).toBe("Selecione a fonte do lead.");
  });

  it("nome só com espaços é inválido", () => {
    expect(errorsOf(valid({ name: "   " })).name).toBe("Informe o nome do lead.");
  });

  it("telefone sem DDD ou curto demais mostra o exemplo", () => {
    expect(errorsOf(valid({ phone: "98765-4321" })).phone).toBe(PHONE_ERROR_MESSAGE);
    expect(errorsOf(valid({ phone: "(77) 9876" })).phone).toBe(PHONE_ERROR_MESSAGE);
  });

  it("aceita telefone com +55, fixo e celular", () => {
    expect(errorsOf(valid({ phone: "+55 77 98765-4321" }))).toEqual({});
    expect(errorsOf(valid({ phone: "(77) 3611-2233" }))).toEqual({});
  });

  it("fonte fora da lista é inválida", () => {
    expect(errorsOf(valid({ source: "tiktok" })).source).toBe("Selecione a fonte do lead.");
  });

  it("serviço fora da lista é inválido; 'nenhum' é aceito", () => {
    expect(errorsOf(valid({ service: "botox" })).service).toBe("Selecione um serviço da lista.");
    expect(errorsOf(valid({ service: NONE_OPTION }))).toEqual({});
  });

  it("campanha 'Outra…' exige o nome", () => {
    expect(errorsOf(valid({ campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: " " })).campaignOther).toBe(
      "Informe o nome da campanha.",
    );
  });

  it("valida o valor estimado", () => {
    expect(errorsOf(valid({ estimated_value: "abc" })).estimated_value).toMatch(/Valor inválido/);
    expect(errorsOf(valid({ estimated_value: "-5" })).estimated_value).toBe("O valor não pode ser negativo.");
    expect(errorsOf(valid({ estimated_value: "100.000.000,00" })).estimated_value).toBe("Valor acima do permitido.");
    expect(errorsOf(valid({ estimated_value: "" }))).toEqual({});
  });

  it("limita o tamanho dos textos", () => {
    expect(errorsOf(valid({ name: "a".repeat(121) })).name).toBe("Use no máximo 120 caracteres.");
    expect(errorsOf(valid({ notes: "a".repeat(4001) })).notes).toBe("Use no máximo 4000 caracteres.");
  });
});

describe("leadFormSchema — saída no formato do banco", () => {
  it("normaliza telefone, nome e textos vazios", () => {
    const out = leadFormSchema.parse(
      valid({ name: "  Maria   Souza ", phone: "+55 (77) 98765-4321", keyword: "  ", notes: " oi " }),
    );
    expect(out.name).toBe("Maria Souza");
    expect(out.phone).toBe("77987654321");
    expect(out.keyword).toBeNull();
    expect(out.notes).toBe("oi");
    expect(out.service).toBeNull();
    expect(out.assigned_to).toBeNull();
    expect(out.campaign).toBeNull();
    expect(out.estimated_value).toBeNull();
    expect(out).not.toHaveProperty("status");
  });

  it("converte o valor em reais e arredonda centavos", () => {
    expect(leadFormSchema.parse(valid({ estimated_value: "R$ 1.500,50" })).estimated_value).toBe(1500.5);
    expect(leadFormSchema.parse(valid({ estimated_value: "99,999" })).estimated_value).toBe(100);
  });

  it("grava a campanha pelo nome (label), também em 'Outra…'", () => {
    expect(leadFormSchema.parse(valid({ campaignOption: "IDC | Implante Dentário" })).campaign).toBe(
      "IDC | Implante Dentário",
    );
    expect(
      leadFormSchema.parse(valid({ campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: "idc_urgencia_canal" })).campaign,
    ).toBe("IDC | Urgência e Canal");
    expect(
      leadFormSchema.parse(valid({ campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: " Black  Friday " })).campaign,
    ).toBe("Black Friday");
  });

  it("lead → formulário → lead preserva os dados", () => {
    const out = leadFormSchema.parse(leadToFormValues(LEAD));
    expect(out).toEqual({
      name: LEAD.name,
      phone: LEAD.phone,
      source: LEAD.source,
      campaign: LEAD.campaign,
      keyword: LEAD.keyword,
      ad_group: LEAD.ad_group,
      landing_page: LEAD.landing_page,
      utm_source: LEAD.utm_source,
      utm_medium: LEAD.utm_medium,
      utm_campaign: LEAD.utm_campaign,
      utm_term: LEAD.utm_term,
      utm_content: LEAD.utm_content,
      service: LEAD.service,
      service_detail: LEAD.service_detail,
      estimated_value: LEAD.estimated_value,
      assigned_to: LEAD.assigned_to,
      notes: LEAD.notes,
    });
  });

  it("toLeadFormOutput ignora valor inválido (nunca envia NaN)", () => {
    expect(toLeadFormOutput(valid({ estimated_value: "abc" })).estimated_value).toBeNull();
  });
});

describe("leadToFormValues", () => {
  it("mascara o telefone e mapeia nulos para os valores 'vazios' dos campos", () => {
    const values = leadToFormValues({
      ...LEAD,
      service: null,
      assigned_to: null,
      campaign: null,
      estimated_value: null,
      notes: null,
    });
    expect(values.phone).toBe("(77) 98765-4321");
    expect(values.service).toBe(NONE_OPTION);
    expect(values.assigned_to).toBe(NONE_OPTION);
    expect(values.campaignOption).toBe(NONE_OPTION);
    expect(values.estimated_value).toBe("");
    expect(values.notes).toBe("");
  });

  it("campanha desconhecida vai para 'Outra…'", () => {
    const values = leadToFormValues({ ...LEAD, campaign: "Campanha antiga" });
    expect(values.campaignOption).toBe(OTHER_CAMPAIGN_OPTION);
    expect(values.campaignOther).toBe("Campanha antiga");
  });
});

describe("campanha", () => {
  it("campaignToOptions reconhece slug e nome", () => {
    expect(campaignToOptions("idc_implante")).toEqual({ campaignOption: "IDC | Implante Dentário", campaignOther: "" });
    expect(campaignToOptions("IDC | Urgência e Canal").campaignOption).toBe("IDC | Urgência e Canal");
    expect(campaignToOptions(null)).toEqual({ campaignOption: NONE_OPTION, campaignOther: "" });
    expect(campaignToOptions("  ")).toEqual({ campaignOption: NONE_OPTION, campaignOther: "" });
  });

  it("campaignFromOptions", () => {
    expect(campaignFromOptions(NONE_OPTION, "x")).toBeNull();
    expect(campaignFromOptions("", "")).toBeNull();
    expect(campaignFromOptions(OTHER_CAMPAIGN_OPTION, "")).toBeNull();
    expect(campaignFromOptions("IDC | Implante Dentário", "")).toBe("IDC | Implante Dentário");
  });
});

describe("máscaras", () => {
  it("maskLeadPhoneInput mascara enquanto digita e normaliza números colados com +55", () => {
    expect(maskLeadPhoneInput("7")).toBe("(7");
    expect(maskLeadPhoneInput("7798")).toBe("(77) 98");
    expect(maskLeadPhoneInput("77987654321")).toBe("(77) 98765-4321");
    expect(maskLeadPhoneInput("+55 77 98765-4321")).toBe("(77) 98765-4321");
    expect(maskLeadPhoneInput("")).toBe("");
  });

  it("parseMoneyInput / formatMoneyInput / moneyToInput", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("1.500,50")).toBe(1500.5);
    expect(Number.isNaN(parseMoneyInput("abc"))).toBe(true);
    expect(formatMoneyInput("1500")).toBe("1.500,00");
    expect(formatMoneyInput("")).toBe("");
    expect(formatMoneyInput("abc")).toBe("abc");
    expect(moneyToInput(1500)).toBe("1.500,00");
    expect(moneyToInput(null)).toBe("");
  });

  it("textOrNull", () => {
    expect(textOrNull("  a ")).toBe("a");
    expect(textOrNull("   ")).toBeNull();
    expect(textOrNull(undefined)).toBeNull();
  });
});

describe("exibição condicional", () => {
  it("rastreamento do anúncio aparece para Google Ads ou quando há dados", () => {
    expect(shouldShowAdTracking({ source: "google_ads" })).toBe(true);
    expect(shouldShowAdTracking({ source: "instagram", campaignOption: NONE_OPTION })).toBe(false);
    expect(shouldShowAdTracking({ source: "instagram", keyword: "dentista" })).toBe(true);
    expect(shouldShowAdTracking({ source: "outro", campaignOption: "IDC | Implante Dentário" })).toBe(true);
    expect(shouldShowAdTracking({ source: "outro", campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: "" })).toBe(
      false,
    );
  });

  it("hasUtmValues", () => {
    expect(hasUtmValues({ utm_source: "", utm_medium: " " })).toBe(false);
    expect(hasUtmValues({ utm_content: "anuncio1" })).toBe(true);
  });
});
