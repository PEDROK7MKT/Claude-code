import { describe, expect, it } from "vitest";
import { authenticateWebhookRequest, extractProvidedSecret, secretsMatch } from "@/features/webhook/lib/auth";

const SECRET = "s3gredo-bem-longo-e-aleatorio-123";

describe("extractProvidedSecret", () => {
  it("lê Authorization: Bearer (esquema sem diferenciar maiúsculas)", () => {
    expect(extractProvidedSecret(new Headers({ Authorization: `Bearer ${SECRET}` }))).toBe(SECRET);
    expect(extractProvidedSecret(new Headers({ authorization: `bearer   ${SECRET}  ` }))).toBe(SECRET);
  });

  it("lê x-webhook-secret", () => {
    expect(extractProvidedSecret(new Headers({ "x-webhook-secret": ` ${SECRET} ` }))).toBe(SECRET);
  });

  it("Authorization tem prioridade sobre x-webhook-secret", () => {
    expect(extractProvidedSecret(new Headers({ Authorization: "Bearer a", "x-webhook-secret": "b" }))).toBe("a");
  });

  it("cabeçalho presente mas malformado → '' (conta como segredo errado)", () => {
    expect(extractProvidedSecret(new Headers({ Authorization: `Basic ${SECRET}` }))).toBe("");
    expect(extractProvidedSecret(new Headers({ Authorization: "Bearer" }))).toBe("");
  });

  it("sem cabeçalho → null", () => {
    expect(extractProvidedSecret(new Headers())).toBeNull();
  });
});

describe("secretsMatch", () => {
  it("compara em tempo constante, inclusive com tamanhos diferentes", () => {
    expect(secretsMatch(SECRET, SECRET)).toBe(true);
    expect(secretsMatch(`${SECRET}x`, SECRET)).toBe(false);
    expect(secretsMatch("curto", SECRET)).toBe(false);
  });

  it("vazio nunca confere", () => {
    expect(secretsMatch("", SECRET)).toBe(false);
    expect(secretsMatch(SECRET, "")).toBe(false);
  });
});

describe("authenticateWebhookRequest", () => {
  it("segredo correto → modo 'secret' (com ou sem origem)", () => {
    const headers = new Headers({ Authorization: `Bearer ${SECRET}` });
    expect(authenticateWebhookRequest({ headers, secret: SECRET, originAllowed: false })).toEqual({ ok: true, mode: "secret" });
    expect(authenticateWebhookRequest({ headers, secret: SECRET, originAllowed: true })).toEqual({ ok: true, mode: "secret" });
  });

  it("segredo errado é recusado mesmo de origem autorizada", () => {
    const headers = new Headers({ "x-webhook-secret": "errado" });
    expect(authenticateWebhookRequest({ headers, secret: SECRET, originAllowed: true })).toEqual({
      ok: false,
      reason: "invalid_secret",
    });
  });

  it("sem segredo: origem autorizada → modo 'public'; senão recusado", () => {
    const headers = new Headers();
    expect(authenticateWebhookRequest({ headers, secret: SECRET, originAllowed: true })).toEqual({ ok: true, mode: "public" });
    expect(authenticateWebhookRequest({ headers, secret: SECRET, originAllowed: false })).toEqual({
      ok: false,
      reason: "missing_secret",
    });
  });
});
