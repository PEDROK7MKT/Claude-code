import { describe, expect, it } from "vitest";
import {
  buildCsvTemplate,
  decodeCsvBytes,
  detectDelimiter,
  detectNumberFormat,
  mapHeader,
  normalizeHeader,
  parseCsvDate,
  parseCsvNumber,
  parseGoogleAdsCsv,
  toImportInputs,
} from "./csv";

const BOM = String.fromCharCode(0xfeff);
const URG = "IDC | Urgência e Canal";
const IMP = "IDC | Implante Dentário";
const TODAY = "2026-09-27";

/** Exportação real do Google Ads em pt-BR (CSV, UTF-8 com BOM, números entre aspas). */
const GOOGLE_ADS_PT = [
  `${BOM}Relatório de campanha`,
  "1 de setembro de 2026 - 3 de setembro de 2026",
  "Dia,Campanha,Código da moeda,Impr.,Cliques,Custo,Conversões,Custo / conv.,Todas as conv.",
  `2026-09-01,${URG},BRL,"1.234",56,"123,45","3,00","41,15","4,00"`,
  `2026-09-01,${IMP},BRL,980,41,"205,90","2,00","102,95","2,00"`,
  `2026-09-02,${URG},BRL,"1.102",48,"98,10","--","--","--"`,
  `2026-09-03,${URG},BRL,"2.001",77,"1.234,56","5,50","224,47","6,00"`,
  `Total: conta,--,BRL,"5.317",222,"1.662,01","12,50","132,96","14,00"`,
  `Total: campanhas,--,BRL,"5.317",222,"1.662,01","12,50","132,96","14,00"`,
  "",
].join("\r\n");

/** Exportação do Google Ads em inglês ("Excel CSV": UTF-16LE, separada por tabulação). */
const GOOGLE_ADS_EN_TSV = [
  "Campaign report",
  "September 1, 2026 - September 2, 2026",
  "Day\tCampaign\tCurrency code\tImpressions\tClicks\tCost\tConversions",
  `2026-09-01\tidc_implante\tBRL\t1,234\t56\t1,123.45\t3.00`,
  `2026-09-02\t${IMP}\tBRL\t987\t41\t205.90\t0.50`,
  "Total: Account\t--\tBRL\t2,221\t97\t1,329.35\t3.50",
].join("\n");

function utf16leWithBom(text: string): Uint8Array {
  const body = Buffer.from(text, "utf16le");
  return new Uint8Array([0xff, 0xfe, ...body]);
}

describe("decodeCsvBytes", () => {
  it("decodifica UTF-8 com BOM", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...Buffer.from("Dia;Impressões", "utf8")]);
    expect(decodeCsvBytes(bytes).replace(BOM, "")).toBe("Dia;Impressões");
  });

  it("decodifica UTF-16LE com BOM (exportação Excel do Google Ads)", () => {
    expect(decodeCsvBytes(utf16leWithBom("Dia\tConversões"))).toBe("Dia\tConversões");
  });

  it("decodifica UTF-16LE sem BOM", () => {
    const bytes = new Uint8Array(Buffer.from("Day\tCampaign\tClicks", "utf16le"));
    expect(decodeCsvBytes(bytes)).toBe("Day\tCampaign\tClicks");
  });

  it("cai para Windows-1252 quando não é UTF-8 válido (CSV salvo pelo Excel pt-BR)", () => {
    const bytes = new Uint8Array(Buffer.from("Impressões;Conversões", "latin1"));
    expect(decodeCsvBytes(bytes)).toBe("Impressões;Conversões");
  });
});

describe("normalizeHeader / mapHeader", () => {
  it("ignora maiúsculas, acentos, pontuação e moeda", () => {
    expect(normalizeHeader("Impr.")).toBe("impr");
    expect(normalizeHeader(`${BOM}Dia`)).toBe("dia");
    expect(normalizeHeader("CONVERSÕES")).toBe("conversoes");
    expect(normalizeHeader("Custo (BRL)")).toBe("custo");
    expect(normalizeHeader("Custo (R$)")).toBe("custo");
    expect(normalizeHeader("Custo / conv.")).toBe("custo conv");
  });

  it("mapeia cabeçalhos em português e inglês sem confundir colunas derivadas", () => {
    expect(
      mapHeader(["Dia", "Campanha", "Código da moeda", "Impr.", "Cliques", "Custo", "Conversões", "Custo / conv.", "Todas as conv."]),
    ).toEqual({ date: 0, campaign: 1, impressions: 3, clicks: 4, cost: 5, conversions: 6 });
    expect(mapHeader(["Date", "Campaign", "Impressions", "Clicks", "Cost", "Conv."])).toEqual({
      date: 0,
      campaign: 1,
      impressions: 2,
      clicks: 3,
      cost: 4,
      conversions: 5,
    });
    expect(mapHeader(["data", "campanha", "impressoes", "cliques", "custo", "conversoes"])).toEqual({
      date: 0,
      campaign: 1,
      impressions: 2,
      clicks: 3,
      cost: 4,
      conversions: 5,
    });
  });

  it("a primeira coluna de cada campo vence", () => {
    expect(mapHeader(["Dia", "Data", "Custo", "Cost"])).toEqual({ date: 0, cost: 2 });
  });
});

describe("detectDelimiter", () => {
  it("detecta ponto e vírgula mesmo com vírgula decimal", () => {
    expect(detectDelimiter("data;campanha;custo\n01/09/2026;A;12,50\n02/09/2026;A;1.234,56")).toBe(";");
  });

  it("detecta vírgula com números entre aspas", () => {
    expect(detectDelimiter('Dia,Campanha,Custo\n2026-09-01,A,"1.234,56"\n2026-09-02,A,"12,00"')).toBe(",");
  });

  it("detecta tabulação e ignora linhas de título", () => {
    expect(detectDelimiter(GOOGLE_ADS_EN_TSV)).toBe("\t");
    expect(detectDelimiter(GOOGLE_ADS_PT)).toBe(",");
  });

  it("usa ponto e vírgula por padrão", () => {
    expect(detectDelimiter("apenas uma coluna")).toBe(";");
  });
});

describe("detectNumberFormat / parseCsvNumber", () => {
  it("detecta formato brasileiro e inglês", () => {
    expect(detectNumberFormat(["1.234", "56", "123,45", "3,00"])).toBe("br");
    expect(detectNumberFormat(["1,234", "56", "1,123.45", "3.00"])).toBe("en");
    expect(detectNumberFormat(["100", "10", "150"])).toBe("br");
    expect(detectNumberFormat(["R$ 1.234,56", "--"])).toBe("br");
  });

  it("converte números brasileiros", () => {
    expect(parseCsvNumber("1.234", "br")).toBe(1234);
    expect(parseCsvNumber("1.234,56", "br")).toBe(1234.56);
    expect(parseCsvNumber("R$ 1.234,56", "br")).toBe(1234.56);
    expect(parseCsvNumber(`R$${String.fromCharCode(0xa0)}12,00`, "br")).toBe(12);
    expect(parseCsvNumber('"3,00"', "br")).toBe(3);
    expect(parseCsvNumber("12.5", "br")).toBe(12.5);
  });

  it("converte números em inglês", () => {
    expect(parseCsvNumber("1,234", "en")).toBe(1234);
    expect(parseCsvNumber("1,123.45", "en")).toBe(1123.45);
    expect(parseCsvNumber("1,234,567", "en")).toBe(1234567);
    expect(parseCsvNumber("0.50", "en")).toBe(0.5);
    expect(parseCsvNumber("$12.00", "en")).toBe(12);
  });

  it('trata vazio e "--" como zero e rejeita texto', () => {
    expect(parseCsvNumber("--", "br")).toBe(0);
    expect(parseCsvNumber("", "en")).toBe(0);
    expect(parseCsvNumber(" - ", "br")).toBe(0);
    expect(parseCsvNumber("abc", "br")).toBeNull();
    expect(parseCsvNumber("12a", "en")).toBeNull();
  });

  it("mantém o sinal negativo (a validação rejeita)", () => {
    expect(parseCsvNumber("-5", "br")).toBe(-5);
    expect(parseCsvNumber("(12,00)", "br")).toBe(-12);
  });
});

describe("parseCsvDate", () => {
  it.each([
    ["2026-09-01", "2026-09-01"],
    ["01/09/2026", "2026-09-01"],
    ["1/9/2026", "2026-09-01"],
    ["01/09/2026 00:00", "2026-09-01"],
    ["01/09/26", "2026-09-01"],
    ["2026/09/01", "2026-09-01"],
    ["1 de set. de 2026", "2026-09-01"],
    ["seg., 1 de setembro de 2026", "2026-09-01"],
    ["Sep 1, 2026", "2026-09-01"],
    ["Mon, Sep 1, 2026", "2026-09-01"],
    ["15 de fev. de 2026", "2026-02-15"],
  ])("%s → %s", (input, expected) => {
    expect(parseCsvDate(input)).toBe(expected);
  });

  it.each(["", "31/02/2026", "Total: conta", "--", "2026-13-01", "abc 1 2026"])("rejeita %j", (input) => {
    expect(parseCsvDate(input)).toBeNull();
  });
});

describe("parseGoogleAdsCsv", () => {
  it("lê a exportação pt-BR do Google Ads (BOM, título, aspas, milhar, --, totais)", () => {
    const result = parseGoogleAdsCsv(GOOGLE_ADS_PT, { todayKey: TODAY });
    expect(result.error).toBeNull();
    expect(result.delimiter).toBe(",");
    expect(result.numberFormat).toBe("br");
    expect(result.hasHeader).toBe(true);
    expect(result.skipped.totals).toBe(2);
    expect(result.counts).toMatchObject({ valid: 4, invalid: 0, duplicate: 0 });
    expect(result.rows.map((r) => r.line)).toEqual([4, 5, 6, 7]);
    expect(result.rows[0]).toMatchObject({
      date: "2026-09-01",
      campaign: URG,
      impressions: 1234,
      clicks: 56,
      cost: 123.45,
      conversions: 3,
      status: "valid",
    });
    // "--" = sem conversões
    expect(result.rows[2].conversions).toBe(0);
    // milhar + vírgula decimal e conversão fracionada arredondada com aviso
    expect(result.rows[3]).toMatchObject({ cost: 1234.56, conversions: 6 });
    expect(result.rows[3].warnings.join(" ")).toMatch(/fracionadas/);
  });

  it("lê a exportação em inglês (UTF-16, tabulação, milhar com vírgula, slug de campanha)", () => {
    const text = decodeCsvBytes(utf16leWithBom(GOOGLE_ADS_EN_TSV));
    const result = parseGoogleAdsCsv(text, { todayKey: TODAY });
    expect(result.error).toBeNull();
    expect(result.delimiter).toBe("\t");
    expect(result.numberFormat).toBe("en");
    expect(result.skipped.totals).toBe(1);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ campaign: IMP, impressions: 1234, clicks: 56, cost: 1123.45, conversions: 3 });
    expect(result.rows[1]).toMatchObject({ cost: 205.9, conversions: 1 });
  });

  it("lê planilha brasileira feita à mão (; e dd/MM/yyyy)", () => {
    const csv = [
      "data;campanha;impressões;cliques;custo;conversões",
      `01/09/2026;${URG};1.250;84;312,50;6`,
      `01/09/2026;${IMP};980;41;"205,90";3`,
    ].join("\n");
    const result = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(result.error).toBeNull();
    expect(result.delimiter).toBe(";");
    expect(toImportInputs(result)).toEqual([
      { date: "2026-09-01", campaign: URG, impressions: 1250, clicks: 84, cost: 312.5, conversions: 6 },
      { date: "2026-09-01", campaign: IMP, impressions: 980, clicks: 41, cost: 205.9, conversions: 3 },
    ]);
  });

  it("aceita arquivo sem cabeçalho na ordem da spec", () => {
    const csv = `2026-09-01,${IMP},1000,50,150.75,2\n2026-09-02,${IMP},900,45,140.10,1\n`;
    const result = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(result.error).toBeNull();
    expect(result.hasHeader).toBe(false);
    expect(result.numberFormat).toBe("en");
    expect(toImportInputs(result)).toEqual([
      { date: "2026-09-01", campaign: IMP, impressions: 1000, clicks: 50, cost: 150.75, conversions: 2 },
      { date: "2026-09-02", campaign: IMP, impressions: 900, clicks: 45, cost: 140.1, conversions: 1 },
    ]);
  });

  it("aceita arquivo sem cabeçalho separado por ponto e vírgula", () => {
    const result = parseGoogleAdsCsv(`05/09/2026;${URG};1.500;60;"1.020,00";4`, { todayKey: TODAY });
    expect(toImportInputs(result)).toEqual([
      { date: "2026-09-05", campaign: URG, impressions: 1500, clicks: 60, cost: 1020, conversions: 4 },
    ]);
  });

  it("marca erros por linha e importa só as válidas", () => {
    const csv = [
      "Data;Campanha;Impressões;Cliques;Custo;Conversões",
      `31/02/2026;${URG};100;10;10,00;1`,
      `01/09/2026;;100;10;10,00;1`,
      `02/09/2026;${URG};-5;10;10,00;1`,
      `03/09/2026;${URG};100;abc;10,00;1`,
      `04/09/2026;${URG};100,5;10;10,00;1`,
      `05/10/2026;${URG};100;10;10,00;1`,
      `06/09/2026;${URG};100;10;10,00;1`,
    ].join("\n");
    const result = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(result.counts).toMatchObject({ valid: 1, invalid: 6 });
    const errors = result.rows.map((r) => r.errors.join(" "));
    expect(errors[0]).toMatch(/Data inválida/);
    expect(errors[1]).toMatch(/Campanha não informada/);
    expect(errors[2]).toMatch(/negativo/);
    expect(errors[3]).toMatch(/Cliques: valor inválido/);
    expect(errors[4]).toMatch(/inteiro/);
    expect(errors[5]).toMatch(/futuro/);
    expect(result.rows.map((r) => r.invalidFields)).toEqual([
      ["date"],
      ["campaign"],
      ["impressions"],
      ["clicks"],
      ["impressions"],
      ["date"],
      [],
    ]);
    expect(toImportInputs(result)).toHaveLength(1);
    expect(toImportInputs(result)[0].date).toBe("2026-09-06");
  });

  it("avisa quando há mais cliques do que impressões (sem bloquear)", () => {
    const result = parseGoogleAdsCsv(`data;campanha;impressões;cliques\n01/09/2026;${URG};10;20`, { todayKey: TODAY });
    expect(result.rows[0].status).toBe("valid");
    expect(result.rows[0].warnings.join(" ")).toMatch(/mais cliques/);
  });

  it("linhas repetidas no arquivo: vale a última", () => {
    const csv = [
      "data;campanha;custo",
      `01/09/2026;${URG};10,00`,
      `01/09/2026;idc | urgência e canal;20,00`,
    ].join("\n");
    const result = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(result.counts).toMatchObject({ valid: 1, duplicate: 1 });
    expect(result.rows[0].status).toBe("duplicate");
    expect(result.rows[0].warnings[0]).toMatch(/linha 3/);
    expect(toImportInputs(result)).toEqual([
      { date: "2026-09-01", campaign: URG, impressions: 0, clicks: 0, cost: 20, conversions: 0 },
    ]);
  });

  it("sinaliza linhas que atualizam lançamentos existentes", () => {
    const result = parseGoogleAdsCsv(`data;campanha;custo\n01/09/2026;${URG};10,00\n02/09/2026;${URG};11,00`, {
      todayKey: TODAY,
      existingKeys: new Set([`2026-09-01|${URG.toLocaleLowerCase("pt-BR")}`]),
    });
    expect(result.rows[0].replacesExisting).toBe(true);
    expect(result.rows[1].replacesExisting).toBe(false);
    expect(result.counts.replacing).toBe(1);
  });

  it("usa a grafia de campanhas já existentes", () => {
    const result = parseGoogleAdsCsv("data;campanha;custo\n01/09/2026;  campanha   INSTAGRAM ;10", {
      todayKey: TODAY,
      knownCampaigns: ["Campanha Instagram"],
    });
    expect(result.rows[0].campaign).toBe("Campanha Instagram");
  });

  it("sem coluna de campanha: exige escolher a campanha e aplica a todas as linhas", () => {
    const csv = "Dia;Impr.;Cliques;Custo;Conversões\n01/09/2026;100;10;50,00;2";
    const withoutDefault = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(withoutDefault.campaignColumnMissing).toBe(true);
    expect(withoutDefault.rows[0].errors.join(" ")).toMatch(/Escolha a campanha/);

    const withDefault = parseGoogleAdsCsv(csv, { todayKey: TODAY, defaultCampaign: IMP });
    expect(toImportInputs(withDefault)).toEqual([
      { date: "2026-09-01", campaign: IMP, impressions: 100, clicks: 10, cost: 50, conversions: 2 },
    ]);
  });

  it("colunas de métrica ausentes são informadas e gravadas como 0", () => {
    const result = parseGoogleAdsCsv(`Dia;Campanha;Custo\n01/09/2026;${URG};50,00`, { todayKey: TODAY });
    expect(result.missingColumns).toEqual(["impressions", "clicks", "conversions"]);
    expect(toImportInputs(result)[0]).toMatchObject({ impressions: 0, clicks: 0, cost: 50, conversions: 0 });
  });

  it("ignora linhas em branco e notas de rodapé", () => {
    const csv = `data;campanha;custo\n\n01/09/2026;${URG};10\n;;\nFonte: Google Ads\n`;
    const result = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(result.rows).toHaveLength(1);
    expect(result.skipped.notes).toBe(1);
    expect(result.skipped.blank).toBeGreaterThanOrEqual(2);
  });

  it("explica quando o relatório não está segmentado por dia", () => {
    const result = parseGoogleAdsCsv("Semana,Campanha,Custo\n2026-09-01,A,10");
    expect(result.error).toMatch(/segmentado por dia/);
  });

  it("erros de arquivo: vazio, sem cabeçalho, sem métricas, grande demais", () => {
    expect(parseGoogleAdsCsv("").error).toMatch(/vazio/);
    expect(parseGoogleAdsCsv(`${BOM}\n\n`).error).toMatch(/vazio/);
    expect(parseGoogleAdsCsv("nome;telefone\nMaria;77999999999").error).toMatch(/cabeçalho/);
    expect(parseGoogleAdsCsv("data;campanha\n01/09/2026;A").error).toMatch(/métrica/);
    const big = ["data;campanha;custo", ...Array.from({ length: 30 }, (_, i) => `01/09/2026;C${i};1`)].join("\n");
    expect(parseGoogleAdsCsv(big, { maxRows: 10 }).error).toMatch(/mais de 10 linhas/);
  });
});

describe("buildCsvTemplate", () => {
  it("gera um modelo que o próprio importador lê sem erros", () => {
    const csv = buildCsvTemplate("2026-09-26");
    expect(csv.split("\r\n")[0]).toBe("data;campanha;impressões;cliques;custo;conversões");
    const result = parseGoogleAdsCsv(csv, { todayKey: TODAY });
    expect(result.error).toBeNull();
    expect(toImportInputs(result)).toEqual([
      { date: "2026-09-26", campaign: URG, impressions: 1250, clicks: 84, cost: 312.5, conversions: 6 },
      { date: "2026-09-26", campaign: IMP, impressions: 980, clicks: 41, cost: 205.9, conversions: 3 },
    ]);
  });

  it("coloca entre aspas campanhas com separador", () => {
    const csv = buildCsvTemplate("2026-09-26", ["Campanha; teste"]);
    expect(csv).toContain('"Campanha; teste"');
    expect(toImportInputs(parseGoogleAdsCsv(csv, { todayKey: TODAY }))[0].campaign).toBe("Campanha; teste");
  });
});
