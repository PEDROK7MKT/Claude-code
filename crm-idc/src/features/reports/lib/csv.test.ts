import { describe, expect, it } from "vitest";
import { CSV_BOM, LEADS_CSV_COLUMNS, buildLeadsCsv, escapeCsvCell, leadsCsvFileName } from "./csv";
import { makeLead } from "./test-fixtures";

function parse(csv: string): string[] {
  return csv.slice(CSV_BOM.length).split("\r\n");
}

describe("buildLeadsCsv", () => {
  const leads = [
    makeLead({
      name: "João; da Silva",
      phone: "77987654321",
      source: "google_ads",
      campaign: "IDC | Urgência e Canal",
      keyword: "dentista barreiras",
      service: "canal",
      status: "agendado",
      created_at: "2026-03-10T15:05:00.000Z",
      scheduled_at: "2026-03-12T17:30:00.000Z",
      estimated_value: 1234.5,
      notes: 'Disse "urgente"\nligar à tarde',
    }),
    makeLead({ name: "Ana", source: "gmn", status: "novo", created_at: "2026-03-02T03:10:00.000Z" }),
  ];
  const csv = buildLeadsCsv(leads);
  const lines = parse(csv);

  it("começa com BOM UTF-8 e usa CRLF", () => {
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("cabeçalho em português separado por ponto e vírgula", () => {
    expect(lines[0]).toBe(LEADS_CSV_COLUMNS.map((c) => c.header).join(";"));
    expect(lines[0].startsWith("Nome;Telefone;Fonte;Campanha;Palavra-chave")).toBe(true);
  });

  it("ordena por data de entrada e formata datas no fuso da Bahia", () => {
    // 02/03 00:10 em Barreiras (03:10 UTC)
    expect(lines[1].startsWith("Ana;(77) 98765-4321;Google Meu Negócio;")).toBe(true);
    expect(lines[1]).toContain(";Novo;02/03/2026 00:10;");
  });

  it("escapa separador, aspas e quebras de linha", () => {
    const joao = csv.slice(csv.indexOf('"João; da Silva"'));
    expect(joao.startsWith('"João; da Silva";(77) 98765-4321;Google Ads;IDC | Urgência e Canal;dentista barreiras;')).toBe(true);
    expect(joao).toContain(";Tratamento de Canal;;Agendado;10/03/2026 12:05;;12/03/2026 14:30;;;1234,50;");
    expect(joao).toContain('"Disse ""urgente""\nligar à tarde"');
  });

  it("células vazias para campos nulos", () => {
    const cells = lines[1].split(";");
    expect(cells).toHaveLength(LEADS_CSV_COLUMNS.length);
    expect(cells[LEADS_CSV_COLUMNS.findIndex((c) => c.header === "Agendamento")]).toBe("");
    expect(cells[LEADS_CSV_COLUMNS.findIndex((c) => c.header === "Serviço")]).toBe("");
  });

  it("sem leads gera só o cabeçalho", () => {
    expect(parse(buildLeadsCsv([]))).toEqual([LEADS_CSV_COLUMNS.map((c) => c.header).join(";"), ""]);
  });
});

describe("escapeCsvCell", () => {
  it("neutraliza fórmulas (CSV injection)", () => {
    expect(escapeCsvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(escapeCsvCell("+5577")).toBe("'+5577");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@SUM")).toBe("'@SUM");
  });

  it("mantém textos comuns intactos", () => {
    expect(escapeCsvCell("Maria")).toBe("Maria");
    expect(escapeCsvCell("")).toBe("");
    expect(escapeCsvCell("a,b")).toBe("a,b");
  });
});

describe("leadsCsvFileName", () => {
  it("usa o mês no nome", () => {
    expect(leadsCsvFileName("2026-03")).toBe("relatorio-leads-IDC-2026-03.csv");
  });
});
