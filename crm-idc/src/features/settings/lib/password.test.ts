import { describe, expect, it } from "vitest";
import {
  GENERATED_PASSWORD_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  characterVariety,
  cryptoRandomInt,
  generatePassword,
  passwordStrength,
  type RandomInt,
} from "./password";

/** Fonte determinística: percorre uma sequência fixa. */
function sequence(values: number[]): RandomInt {
  let i = 0;
  return (max) => values[i++ % values.length] % max;
}

describe("generatePassword", () => {
  it("gera 12 caracteres com minúscula, maiúscula, dígito e símbolo", () => {
    for (let run = 0; run < 50; run++) {
      const pw = generatePassword();
      expect(pw).toHaveLength(GENERATED_PASSWORD_LENGTH);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/\d/);
      expect(pw).toMatch(/[^a-zA-Z\d]/);
    }
  });

  it("não usa caracteres ambíguos (l, I, O, 0, 1)", () => {
    const all = Array.from({ length: 200 }, () => generatePassword({ length: 40 })).join("");
    expect(all).not.toMatch(/[lIO01]/);
  });

  it("sem símbolos quando pedido", () => {
    const pw = generatePassword({ symbols: false, length: 30 });
    expect(pw).toMatch(/^[a-zA-Z\d]+$/);
  });

  it("limita o tamanho entre o mínimo e o máximo do Supabase", () => {
    expect(generatePassword({ length: 3 })).toHaveLength(PASSWORD_MIN_LENGTH);
    expect(generatePassword({ length: 500 })).toHaveLength(PASSWORD_MAX_LENGTH);
  });

  it("é determinística com fonte aleatória injetada", () => {
    const random = () => sequence([3, 7, 1, 9, 4, 2, 8, 5, 6, 0]);
    expect(generatePassword({ random: random() })).toBe(generatePassword({ random: random() }));
  });

  it("senhas geradas são avaliadas como fortes", () => {
    for (let run = 0; run < 20; run++) {
      expect(passwordStrength(generatePassword({ length: 14 })).score).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("cryptoRandomInt", () => {
  it("fica dentro do intervalo", () => {
    for (let i = 0; i < 500; i++) {
      const n = cryptoRandomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("rejeita máximo inválido", () => {
    expect(() => cryptoRandomInt(0)).toThrow(RangeError);
    expect(() => cryptoRandomInt(2.5)).toThrow(RangeError);
  });
});

describe("passwordStrength", () => {
  it("vazia e curta", () => {
    expect(passwordStrength("")).toMatchObject({ level: "empty", score: 0 });
    expect(passwordStrength("Ab1!")).toMatchObject({ level: "too-short", label: "Muito curta" });
  });

  it("padrões previsíveis são fracos mesmo longos", () => {
    expect(passwordStrength("12345678").level).toBe("weak");
    expect(passwordStrength("Senha@2026!").level).toBe("weak");
    expect(passwordStrength("aaaaaaaaaaaa").level).toBe("weak");
    expect(passwordStrength("Xy7#bbbqPw9k").level).toBe("weak");
  });

  it("variedade e tamanho aumentam a força", () => {
    expect(passwordStrength("gatoamarelo").level).toBe("weak");
    expect(passwordStrength("Gatoamarelo").level).toBe("fair");
    expect(passwordStrength("Gatoamarelo7").level).toBe("good");
    expect(passwordStrength("Gato#amarelo7x").level).toBe("strong");
  });

  it("characterVariety conta os tipos", () => {
    expect(characterVariety("abc")).toBe(1);
    expect(characterVariety("aB3")).toBe(3);
    expect(characterVariety("aB3 ")).toBe(4);
  });
});
