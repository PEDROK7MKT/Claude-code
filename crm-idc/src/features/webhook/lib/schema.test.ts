import { describe, expect, it } from "vitest";
import {
  applyFieldAliases,
  cleanText,
  isHoneypotFilled,
  parseWebhookPayload,
  truncateText,
} from "@/features/webhook/lib/schema";

describe("truncateText", () => {
  it("não mexe em textos dentro do limite", () => {
    expect(truncateText("Maria", 10)).toBe("Maria");
  });

  it("corta no limite sem espaço sobrando", () => {
    expect(truncateText("Maria Silva", 6)).toBe("Maria");
  });

  it("não parte um emoji ao meio", () => {
    const text = "ab😀";
    expect(truncateText(text, 3)).toBe("ab");
  });
});

describe("cleanText", () => {
  it("vazio, nulo e só espaços viram null", () => {
    expect(cleanText(undefined, 10)).toBeNull();
    expect(cleanText(null, 10)).toBeNull();
    expect(cleanText("   ", 10)).toBeNull();
  });

  it("junta espaços e remove caracteres de controle", () => {
    expect(cleanText("  Maria \t  da\u0000 Silva\n ", 50)).toBe("Maria da Silva");
    expect(cleanText("﻿João‮", 50)).toBe("João");
  });

  it("números viram texto", () => {
    expect(cleanText(77987654321, 20)).toBe("77987654321");
  });

  it("campos de várias linhas mantêm quebras (no máximo uma linha em branco)", () => {
    expect(cleanText("Oi,\r\n\r\n\r\n  quero   agendar  \n\ncanal", 100, true)).toBe("Oi,\n\nquero agendar\n\ncanal");
  });

  it("corta no limite", () => {
    expect(cleanText("a".repeat(300), 250)).toHaveLength(250);
  });
});

describe("applyFieldAliases", () => {
  it("traduz apelidos em português e ignora campos desconhecidos", () => {
    expect(
      applyFieldAliases({ Nome: "Maria", Telefone: "77 98765-4321", "Serviço": "Implante", mensagem: "Oi", foo: "bar" }),
    ).toEqual({ name: "Maria", phone: "77 98765-4321", service: "Implante", message: "Oi" });
  });

  it("o nome oficial vence o apelido, em qualquer ordem", () => {
    expect(applyFieldAliases({ telefone: "1", phone: "2" })).toEqual({ phone: "2" });
    expect(applyFieldAliases({ phone: "2", whatsapp: "1" })).toEqual({ phone: "2" });
  });

  it("entre apelidos, vence o primeiro com valor", () => {
    expect(applyFieldAliases({ celular: "", whatsapp: "77987654321", telefone: "7736112233" })).toEqual({
      phone: "77987654321",
    });
  });

  it("aceita variações de maiúsculas, hífens e espaços", () => {
    expect(applyFieldAliases({ "UTM-Source": "google", "utm campaign": "idc_implante", "Landing URL": "/x" })).toEqual({
      utm_source: "google",
      utm_campaign: "idc_implante",
      url: "/x",
    });
  });

  it("descarta o campo isca (tratado à parte)", () => {
    expect(applyFieldAliases({ website: "http://spam" })).toEqual({});
  });
});

describe("parseWebhookPayload", () => {
  it("devolve todos os campos, com texto limpo ou null", () => {
    const result = parseWebhookPayload({ name: "  Maria  Silva ", phone: 77987654321 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.name).toBe("Maria Silva");
    expect(result.data.phone).toBe("77987654321");
    expect(result.data.utm_source).toBeNull();
    expect(result.data.notes).toBeNull();
  });

  it("aponta os campos com tipo errado, em pt-BR", () => {
    const result = parseWebhookPayload({ name: { first: "Maria" }, phone: "77987654321", service: ["canal"], notes: true });
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "name", message: "Deve ser um texto." },
        { field: "service", message: "Deve ser um texto." },
        { field: "notes", message: "Deve ser um texto." },
      ],
    });
  });

  it("corta textos longos em vez de rejeitar", () => {
    const result = parseWebhookPayload({ name: "x".repeat(500), phone: "77987654321", message: "y".repeat(5000) });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.name).toHaveLength(120);
    expect(result.data.message).toHaveLength(2000);
  });
});

describe("isHoneypotFilled", () => {
  it("detecta o campo isca preenchido", () => {
    expect(isHoneypotFilled({ website: "https://spam.example" })).toBe(true);
    expect(isHoneypotFilled({ website: 1 })).toBe(true);
  });

  it("vazio ou ausente é envio humano", () => {
    expect(isHoneypotFilled({})).toBe(false);
    expect(isHoneypotFilled({ website: "" })).toBe(false);
    expect(isHoneypotFilled({ website: "   " })).toBe(false);
    expect(isHoneypotFilled({ website: null })).toBe(false);
  });
});
