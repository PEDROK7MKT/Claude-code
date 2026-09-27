import { describe, expect, it } from "vitest";
import { hexToRgb, shade, tint, toPdfText } from "./pdf-text";

describe("toPdfText", () => {
  it("mantém acentos do português e pontuação tipográfica", () => {
    expect(toPdfText("Relatório mensal — março de 2026")).toBe("Relatório mensal — março de 2026");
    expect(toPdfText("ação, ç, ã, é, ô, Í, ü")).toBe("ação, ç, ã, é, ô, Í, ü");
    expect(toPdfText("“dentista barreiras” – 4 leads… • €")).toBe("“dentista barreiras” – 4 leads… • €");
  });

  it("troca setas e símbolos sem glifo por equivalentes", () => {
    expect(toPdfText("novo → agendado")).toBe("novo -> agendado");
    expect(toPdfText("4,9 ★")).toBe("4,9 *");
    expect(toPdfText("≥ 10 − 2")).toBe(">= 10 - 2");
  });

  it("remove emojis e caracteres invisíveis", () => {
    expect(toPdfText("Maria 😊 Silva")).toBe("Maria Silva");
    expect(toPdfText("Dente 🦷​")).toBe("Dente ");
    expect(toPdfText("ok👍🏽")).toBe("ok");
  });

  it("normaliza espaços especiais (NBSP do Intl) e diacríticos fora do Latin-1", () => {
    expect(toPdfText("R$ 42,10")).toBe("R$ 42,10");
    expect(toPdfText("1 000")).toBe("1 000");
    expect(toPdfText("ő ę ş ğ")).toBe("o e s g");
  });

  it("vazio para null/undefined", () => {
    expect(toPdfText(null)).toBe("");
    expect(toPdfText(undefined)).toBe("");
  });

  it("cada caractere resultante cabe na WinAnsiEncoding", () => {
    const out = toPdfText("Olá 👋 → ★ ✓ “x” — ő 中文");
    for (const char of out) {
      const code = char.codePointAt(0) ?? 0;
      expect(code <= 0xff || "–—…•“”‘’€".includes(char)).toBe(true);
    }
  });
});

describe("cores", () => {
  it("hexToRgb", () => {
    expect(hexToRgb("#0D6E6E")).toEqual([13, 110, 110]);
    expect(hexToRgb("fff")).toEqual([255, 255, 255]);
    expect(hexToRgb("inválido")).toEqual([107, 114, 128]);
  });

  it("tint e shade misturam com branco e preto", () => {
    expect(tint("#000000", 0.5)).toEqual([128, 128, 128]);
    expect(tint("#3B82F6", 0)).toEqual([59, 130, 246]);
    expect(tint("#3B82F6", 1)).toEqual([255, 255, 255]);
    expect(shade("#FFFFFF", 0.4)).toEqual([153, 153, 153]);
  });
});
