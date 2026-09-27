/**
 * Senhas criadas pelo admin (novo usuário / redefinição): gerador seguro e
 * medidor de força. Funções puras — a fonte aleatória pode ser injetada nos testes.
 */

/** Mínimo exigido pelo CRM (spec: senha com pelo menos 8 caracteres). */
export const PASSWORD_MIN_LENGTH = 8;
/** Limite do Supabase Auth (bcrypt usa só os primeiros 72 bytes). */
export const PASSWORD_MAX_LENGTH = 72;
/** Tamanho das senhas geradas: forte e ainda fácil de digitar no celular. */
export const GENERATED_PASSWORD_LENGTH = 12;

// Sem caracteres ambíguos (l/I/1, O/0) — a senha costuma ser ditada ou copiada no WhatsApp
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*?+-=";

/** Inteiro aleatório em [0, max). */
export type RandomInt = (max: number) => number;

/** Aleatório criptográfico sem viés (amostragem por rejeição). */
export const cryptoRandomInt: RandomInt = (max) => {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError("max deve ser um inteiro positivo");
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
};

export interface GeneratePasswordOptions {
  length?: number;
  /** Inclui símbolos (!@#...). Padrão: true. */
  symbols?: boolean;
  random?: RandomInt;
}

/**
 * Senha aleatória com ao menos uma minúscula, uma maiúscula, um dígito
 * (e um símbolo, se habilitado), embaralhada (Fisher–Yates).
 */
export function generatePassword({
  length = GENERATED_PASSWORD_LENGTH,
  symbols = true,
  random = cryptoRandomInt,
}: GeneratePasswordOptions = {}): string {
  const sets = symbols ? [LOWER, UPPER, DIGITS, SYMBOLS] : [LOWER, UPPER, DIGITS];
  const size = Math.min(PASSWORD_MAX_LENGTH, Math.max(PASSWORD_MIN_LENGTH, Math.round(length)));
  const all = sets.join("");
  const pick = (chars: string) => chars[random(chars.length)];

  const chars = sets.map(pick);
  while (chars.length < size) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export type PasswordStrengthLevel = "empty" | "too-short" | "weak" | "fair" | "good" | "strong";

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  /** 0–4 (barra de força) */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const COMMON_PATTERNS = [
  /^(.)\1+$/, // "aaaaaaaa"
  /(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/,
  /(abcd|bcde|cdef|qwer|wert|asdf|sdfg|zxcv)/i,
  /(senha|password|admin|idc|decio|clinica|dentista|123mudar)/i,
];

/** Quantos tipos de caractere a senha usa (minúsculas, maiúsculas, dígitos, outros). */
export function characterVariety(password: string): number {
  return [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((re) => re.test(password)).length;
}

/** Força estimada da senha (heurística simples para orientar o admin, não uma garantia). */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { level: "empty", score: 0, label: "" };
  if (password.length < PASSWORD_MIN_LENGTH) return { level: "too-short", score: 0, label: "Muito curta" };

  const variety = characterVariety(password);
  let points = 0;
  if (password.length >= 10) points++;
  if (password.length >= 14) points++;
  if (variety >= 2) points++;
  if (variety >= 3) points++;
  if (variety >= 4) points++;

  // padrões previsíveis limitam a força, mesmo com tamanho/variedade
  if (COMMON_PATTERNS.some((re) => re.test(password)) || /(.)\1{2,}/.test(password)) points = Math.min(points, 1);

  if (points <= 1) return { level: "weak", score: 1, label: "Fraca" };
  if (points === 2) return { level: "fair", score: 2, label: "Razoável" };
  if (points === 3) return { level: "good", score: 3, label: "Boa" };
  return { level: "strong", score: 4, label: "Forte" };
}
