import { describe, expect, it } from "vitest";
import {
  OTHER_CAMPAIGN_OPTION,
  findMetricConflict,
  formatNumberInput,
  getMetricFormWarnings,
  metricFormDefaults,
  metricFormSchema,
  parseFormNumber,
  type MetricFormValues,
} from "./metric-form";

const URG = "IDC | Urgência e Canal";
const IMP = "IDC | Implante Dentário";

const base: MetricFormValues = {
  date: "2026-09-27",
  campaignOption: URG,
  campaignOther: "",
  impressions: "1.234",
  clicks: "56",
  cost: "1.234,56",
  conversions: "3",
};

function issuesOf(values: MetricFormValues): Record<string, string> {
  const result = metricFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("metricFormSchema", () => {
  it("converte os campos digitados em formato brasileiro", () => {
    expect(metricFormSchema.parse(base)).toEqual({
      date: "2026-09-27",
      campaign: URG,
      impressions: 1234,
      clicks: 56,
      cost: 1234.56,
      conversions: 3,
    });
  });

  it("campos numéricos vazios contam como zero", () => {
    expect(metricFormSchema.parse({ ...base, impressions: "", clicks: "", cost: "", conversions: "" })).toMatchObject({
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
    });
  });

  it("usa o texto livre quando a campanha é “Outra…”", () => {
    expect(
      metricFormSchema.parse({ ...base, campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: "  Campanha   Nova " })
        .campaign,
    ).toBe("Campanha Nova");
    expect(issuesOf({ ...base, campaignOption: OTHER_CAMPAIGN_OPTION, campaignOther: " " })).toHaveProperty(
      "campaignOther",
    );
  });

  it("arredonda conversões fracionadas e o custo em centavos", () => {
    expect(metricFormSchema.parse({ ...base, conversions: "2,5", cost: "10,005" })).toMatchObject({
      conversions: 3,
      cost: 10.01,
    });
  });

  it("rejeita negativos, texto, inteiros fracionados e data inválida", () => {
    const issues = issuesOf({ ...base, impressions: "-1", clicks: "1,5", cost: "abc", date: "2026-02-30" });
    expect(issues.impressions).toMatch(/negativo/);
    expect(issues.clicks).toMatch(/inteiro/);
    expect(issues.cost).toMatch(/inválido/);
    expect(issues.date).toBeDefined();
  });

  it("rejeita valores acima do limite do banco", () => {
    expect(issuesOf({ ...base, cost: "100.000.000,00" }).cost).toMatch(/acima/);
    expect(issuesOf({ ...base, impressions: "3.000.000.000" }).impressions).toMatch(/acima/);
  });
});

describe("getMetricFormWarnings", () => {
  it("avisa (sem bloquear) quando há mais cliques que impressões", () => {
    expect(getMetricFormWarnings({ impressions: "10", clicks: "20", conversions: "" }).clicks).toMatch(/mais cliques/);
    expect(getMetricFormWarnings({ impressions: "10", clicks: "10", conversions: "" }).clicks).toBeUndefined();
  });

  it("avisa sobre o arredondamento das conversões", () => {
    expect(getMetricFormWarnings({ impressions: "", clicks: "", conversions: "2,5" }).conversions).toMatch(/2,5 → 3/);
    expect(getMetricFormWarnings({ impressions: "", clicks: "", conversions: "2" }).conversions).toBeUndefined();
  });
});

describe("metricFormDefaults", () => {
  const options = { todayKey: "2026-09-27", campaignOptions: [URG, IMP, "Outra X"] };

  it("novo lançamento: hoje e a primeira campanha", () => {
    expect(metricFormDefaults(null, options)).toMatchObject({ date: "2026-09-27", campaignOption: URG, cost: "" });
  });

  it("edição: valores formatados e campanha conhecida ou texto livre", () => {
    const row = { date: "2026-09-01", campaign: IMP, impressions: 1234, clicks: 5, cost: 1234.5, conversions: 2 };
    expect(metricFormDefaults(row, options)).toEqual({
      date: "2026-09-01",
      campaignOption: IMP,
      campaignOther: "",
      impressions: "1.234",
      clicks: "5",
      cost: "1.234,50",
      conversions: "2",
    });
    expect(metricFormDefaults({ ...row, campaign: "Desconhecida" }, options)).toMatchObject({
      campaignOption: OTHER_CAMPAIGN_OPTION,
      campaignOther: "Desconhecida",
    });
  });
});

describe("formatação dos inputs", () => {
  it("parseFormNumber", () => {
    expect(parseFormNumber("")).toBe(0);
    expect(parseFormNumber("R$ 1.234,56")).toBe(1234.56);
    expect(parseFormNumber("x")).toBeNull();
  });

  it("formatNumberInput", () => {
    expect(formatNumberInput("1234,5", "money")).toBe("1.234,50");
    expect(formatNumberInput("1234.56", "money")).toBe("1.234,56");
    expect(formatNumberInput("12345", "integer")).toBe("12.345");
    expect(formatNumberInput("2.5", "decimal")).toBe("2,5");
    expect(formatNumberInput("abc", "money")).toBe("abc");
    expect(formatNumberInput("1,5", "integer")).toBe("1,5");
    expect(formatNumberInput("  ", "money")).toBe("");
  });
});

describe("findMetricConflict", () => {
  const metrics = [
    { id: "a", date: "2026-09-01", campaign: URG },
    { id: "b", date: "2026-09-02", campaign: "Campanha X" },
  ];

  it("acha o lançamento do mesmo dia e campanha sem diferenciar maiúsculas", () => {
    expect(findMetricConflict(metrics, { date: "2026-09-02", campaign: "campanha x" })?.id).toBe("b");
    expect(findMetricConflict(metrics, { date: "2026-09-01", campaign: IMP })).toBeNull();
  });

  it("ignora a própria linha em edição e entradas incompletas", () => {
    expect(findMetricConflict(metrics, { date: "2026-09-01", campaign: URG }, "a")).toBeNull();
    expect(findMetricConflict(metrics, { date: "", campaign: URG })).toBeNull();
    expect(findMetricConflict(metrics, { date: "2026-09-01", campaign: null })).toBeNull();
  });
});
