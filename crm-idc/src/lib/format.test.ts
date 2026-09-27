import { describe, expect, it } from "vitest";
import {
  firstName,
  formatCurrency,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatPhone,
  initials,
  maskPhoneInput,
  normalizePhone,
  parseBRNumber,
  percentChange,
  safeDivide,
  whatsappUrl,
} from "@/lib/format";

/** Intl usa espaço não separável entre "R$" e o valor. */
const plain = (s: string) => s.replace(/ /g, " ");

describe("normalizePhone", () => {
  it.each([
    ["(77) 98765-4321", "77987654321"],
    ["77 98765 4321", "77987654321"],
    ["+55 77 98765-4321", "77987654321"],
    ["5577987654321", "77987654321"],
    ["0055 77 98765-4321", "77987654321"],
    ["0 77 98765-4321", "77987654321"],
    ["(77) 3611-2233", "7736112233"],
    ["+55 (77) 3611-2233", "7736112233"],
    ["0 77 3611-2233", "7736112233"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("DDD 55 (RS) não é confundido com o código do país", () => {
    expect(normalizePhone("(55) 99988-7766")).toBe("55999887766");
    expect(normalizePhone("+55 55 99988-7766")).toBe("55999887766");
    expect(normalizePhone("55 3222-1100")).toBe("5532221100");
  });

  it.each([
    [""],
    ["abc"],
    ["98765-4321"],
    ["987654321"],
    ["123456789012345"],
    ["00 0000-0000"],
  ])("inválido: %s → null", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it("null/undefined → null", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("formatPhone / maskPhoneInput", () => {
  it("formata celular e fixo", () => {
    expect(formatPhone("77987654321")).toBe("(77) 98765-4321");
    expect(formatPhone("7736112233")).toBe("(77) 3611-2233");
  });

  it("mantém o texto quando não reconhece e — para vazio", () => {
    expect(formatPhone("12345")).toBe("12345");
    expect(formatPhone(null)).toBe("—");
    expect(formatPhone("")).toBe("—");
  });

  it("máscara progressiva", () => {
    expect(maskPhoneInput("")).toBe("");
    expect(maskPhoneInput("7")).toBe("(7");
    expect(maskPhoneInput("77")).toBe("(77");
    expect(maskPhoneInput("779")).toBe("(77) 9");
    expect(maskPhoneInput("7736112233")).toBe("(77) 3611-2233");
    expect(maskPhoneInput("77987654321")).toBe("(77) 98765-4321");
    expect(maskPhoneInput("779876543219999")).toBe("(77) 98765-4321");
    expect(maskPhoneInput("(77) 9 8765-4321")).toBe("(77) 98765-4321");
  });
});

describe("whatsappUrl", () => {
  it("usa wa.me/55 + telefone normalizado e primeiro nome", () => {
    const url = whatsappUrl("(77) 98765-4321", "Maria Silva");
    expect(url.startsWith("https://wa.me/5577987654321?text=")).toBe(true);
    const text = decodeURIComponent(url.split("?text=")[1]);
    expect(text).toBe(
      "Olá Maria! Aqui é do Instituto Décio Carrilho. Recebemos seu contato e estamos à disposição para ajudar.",
    );
  });

  it("sem nome remove o espaço antes da pontuação", () => {
    const text = decodeURIComponent(whatsappUrl("77987654321").split("?text=")[1]);
    expect(text.startsWith("Olá! Aqui é do")).toBe(true);
    const custom = decodeURIComponent(whatsappUrl("77987654321", null, "Oi {nome}, tudo bem?").split("?text=")[1]);
    expect(custom).toBe("Oi, tudo bem?");
  });

  it("template vazio gera link sem texto", () => {
    expect(whatsappUrl("77987654321", "Ana", "")).toBe("https://wa.me/5577987654321");
  });

  it("telefone com +55 não duplica o código do país", () => {
    expect(whatsappUrl("+55 77 98765-4321", "Ana", "")).toBe("https://wa.me/5577987654321");
  });
});

describe("parseBRNumber", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1234,56", 1234.56],
    ["1234.56", 1234.56],
    ["1,234.56", 1234.56],
    ["R$ 12,00", 12],
    ["R$ 1.234,56", 1234.56],
    ["1.234", 1234],
    ["1.234.567", 1234567],
    ["1.234.567,89", 1234567.89],
    ["12.5", 12.5],
    ["0,5", 0.5],
    ["0.5", 0.5],
    ["0.123", 0.123],
    ["-0.500", -0.5],
    ["1234.567", 1234.567],
    ["-12,50", -12.5],
    ["12%", 12],
    ["3,45 %", 3.45],
    ["1 234,56", 1234.56],
    ["42", 42],
  ])("%s → %d", (input, expected) => {
    expect(parseBRNumber(input)).toBeCloseTo(expected, 10);
  });

  it.each([[""], ["   "], ["-"], ["--"], ["abc"], ["1,2,3.4.5x"]])("%j → null", (input) => {
    expect(parseBRNumber(input)).toBeNull();
  });

  it("números e nulos", () => {
    expect(parseBRNumber(12.5)).toBe(12.5);
    expect(parseBRNumber(Number.NaN)).toBeNull();
    expect(parseBRNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseBRNumber(null)).toBeNull();
    expect(parseBRNumber(undefined)).toBeNull();
  });
});

describe("moeda, números e percentuais", () => {
  it("formatCurrency em BRL", () => {
    expect(plain(formatCurrency(1234.56))).toBe("R$ 1.234,56");
    expect(plain(formatCurrency(0))).toBe("R$ 0,00");
    expect(plain(formatCurrency(0.005))).toBe("R$ 0,01");
    expect(plain(formatCurrency(1_000_000))).toBe("R$ 1.000.000,00");
    expect(plain(formatCurrency(-5))).toBe("-R$ 5,00");
  });

  it("formatCurrency retorna — para nulo/NaN/Infinity", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(Number.NaN)).toBe("—");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("formatNumber / formatDecimal / formatPercent", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatNumber(null)).toBe("—");
    expect(formatDecimal(4.9)).toBe("4,9");
    expect(formatDecimal(5)).toBe("5,0");
    expect(formatDecimal(null)).toBe("—");
    expect(formatPercent(12.5)).toBe("12,5%");
    expect(formatPercent(12)).toBe("12%");
    expect(formatPercent(33.333, 2)).toBe("33,33%");
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
  });

  it("safeDivide", () => {
    expect(safeDivide(10, 4)).toBe(2.5);
    expect(safeDivide(10, 0)).toBeNull();
    expect(safeDivide(0, 5)).toBe(0);
  });

  it("percentChange", () => {
    expect(percentChange(12, 10)).toBeCloseTo(20);
    expect(percentChange(5, 10)).toBeCloseTo(-50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(3, 0)).toBeNull();
  });
});

describe("nomes", () => {
  it("firstName", () => {
    expect(firstName("  Maria  Silva ")).toBe("Maria");
    expect(firstName("")).toBe("");
    expect(firstName(null)).toBe("");
  });

  it("initials", () => {
    expect(initials("Décio Carrilho")).toBe("DC");
    expect(initials("Ana Maria de Souza")).toBe("AS");
    expect(initials("ana")).toBe("A");
    expect(initials("  ")).toBe("?");
    expect(initials(null)).toBe("?");
  });
});
