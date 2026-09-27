import { describe, expect, it } from "vitest";

import { buildOriginRows, buildUtmRows, describeLeadEntry, hasTrackingInfo } from "./lead-tracking";

const EMPTY = {
  source: "instagram" as const,
  campaign: null,
  keyword: null,
  ad_group: null,
  landing_page: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
};

describe("lead-tracking", () => {
  it("linhas de origem com rótulos em pt-BR", () => {
    const rows = buildOriginRows({ ...EMPTY, source: "google_ads", campaign: "IDC | Implante Dentário", landing_page: " /implante " });
    expect(rows.map((r) => [r.label, r.value])).toEqual([
      ["Fonte", "Google Ads"],
      ["Campanha", "IDC | Implante Dentário"],
      ["Palavra-chave", null],
      ["Grupo de anúncios", null],
      ["Página de destino", "/implante"],
    ]);
    expect(rows.find((r) => r.key === "landing_page")?.technical).toBe(true);
    expect(rows.find((r) => r.key === "campaign")?.technical).toBe(false);
  });

  it("linhas de UTM", () => {
    const rows = buildUtmRows({ ...EMPTY, utm_source: "google", utm_term: "  " });
    expect(rows.map((r) => r.label)).toEqual(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]);
    expect(rows[0].value).toBe("google");
    expect(rows[3].value).toBeNull();
    expect(rows.every((r) => r.technical)).toBe(true);
  });

  it("hasTrackingInfo ignora a fonte", () => {
    expect(hasTrackingInfo(EMPTY)).toBe(false);
    expect(hasTrackingInfo({ ...EMPTY, keyword: "dentista" })).toBe(true);
    expect(hasTrackingInfo({ ...EMPTY, utm_medium: "cpc" })).toBe(true);
  });

  it("describeLeadEntry", () => {
    const profiles = [{ id: "u1", full_name: "Décio" }];
    expect(describeLeadEntry({ created_by: null }, profiles)).toBe("Automática (webhook/integração)");
    expect(describeLeadEntry({ created_by: "u1" }, profiles)).toBe("Cadastro manual por Décio");
    expect(describeLeadEntry({ created_by: "u2" }, profiles)).toBe("Cadastro manual");
    expect(describeLeadEntry({ created_by: "u1" }, undefined)).toBe("Cadastro manual");
  });
});
