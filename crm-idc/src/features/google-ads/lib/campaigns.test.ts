import { describe, expect, it } from "vitest";
import {
  buildCampaignOptions,
  campaignKey,
  filterLeadsByCampaign,
  filterMetricsByCampaign,
  matchKnownCampaign,
} from "./campaigns";

const URG = "IDC | Urgência e Canal";
const IMP = "IDC | Implante Dentário";

describe("campaignKey", () => {
  it("iguala slug, nome e variações de maiúsculas/espaços", () => {
    expect(campaignKey("idc_urgencia_canal")).toBe(campaignKey(URG));
    expect(campaignKey("  idc |  urgência e canal ")).toBe(campaignKey(URG));
    expect(campaignKey(null)).toBe("");
  });
});

describe("buildCampaignOptions", () => {
  it("lista CAMPAIGNS primeiro e depois as campanhas dos dados, sem repetir", () => {
    expect(
      buildCampaignOptions([
        { campaign: "Zeta" },
        { campaign: "idc_implante" },
        { campaign: "alfa" },
        { campaign: "Zeta " },
        { campaign: null },
        { campaign: "" },
      ]),
    ).toEqual([URG, IMP, "alfa", "Zeta"]);
  });
});

describe("matchKnownCampaign", () => {
  it("usa a grafia existente ou o nome canônico", () => {
    expect(matchKnownCampaign("campanha x", ["Campanha X"])).toBe("Campanha X");
    expect(matchKnownCampaign("idc_implante", [])).toBe(IMP);
    expect(matchKnownCampaign("  Nova   campanha ", [])).toBe("Nova campanha");
    expect(matchKnownCampaign("   ", [])).toBeNull();
  });
});

describe("filtros por campanha", () => {
  const metrics = [{ campaign: URG }, { campaign: IMP }, { campaign: "idc | urgência e canal" }];
  const leads = [{ campaign: URG }, { campaign: null }, { campaign: "idc_urgencia_canal" }, { campaign: IMP }];

  it("null = todas", () => {
    expect(filterMetricsByCampaign(metrics, null)).toHaveLength(3);
    expect(filterLeadsByCampaign(leads, null)).toHaveLength(4);
  });

  it("compara sem diferenciar maiúsculas e aceita slug nos leads", () => {
    expect(filterMetricsByCampaign(metrics, URG)).toHaveLength(2);
    expect(filterLeadsByCampaign(leads, URG)).toHaveLength(2);
    expect(filterLeadsByCampaign(leads, IMP)).toHaveLength(1);
  });
});
