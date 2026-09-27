import { describe, expect, it } from "vitest";
import {
  buildCorsHeaders,
  buildPreflightHeaders,
  isAllowedOrigin,
  normalizeOrigin,
  parseAllowedOrigins,
} from "@/features/webhook/lib/cors";

const SITE = "https://institutodeciocarrilho.com.br";
const ALLOWED = [SITE, "https://www.institutodeciocarrilho.com.br"];

describe("normalizeOrigin", () => {
  it("reduz à origem, em minúsculo", () => {
    expect(normalizeOrigin("https://InstitutoDecioCarrilho.com.br/")).toBe(SITE);
    expect(normalizeOrigin("https://site.com.br:8443/pagina?x=1")).toBe("https://site.com.br:8443");
  });

  it("recusa curinga, 'null', protocolos não http e lixo", () => {
    expect(normalizeOrigin("*")).toBeNull();
    expect(normalizeOrigin("null")).toBeNull();
    expect(normalizeOrigin("file:///tmp/x.html")).toBeNull();
    expect(normalizeOrigin("não é url")).toBeNull();
    expect(normalizeOrigin(undefined)).toBeNull();
  });
});

describe("parseAllowedOrigins", () => {
  it("separa por vírgula/espaço, normaliza e remove repetidas", () => {
    expect(parseAllowedOrigins(` ${SITE}/ ,https://www.institutodeciocarrilho.com.br  ${SITE}`)).toEqual(ALLOWED);
  });

  it("'*' nunca libera todas as origens", () => {
    expect(parseAllowedOrigins("*")).toEqual([]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});

describe("isAllowedOrigin", () => {
  it("só origens da lista (sem diferenciar maiúsculas)", () => {
    expect(isAllowedOrigin(SITE, ALLOWED)).toBe(true);
    expect(isAllowedOrigin("https://INSTITUTODECIOCARRILHO.com.br", ALLOWED)).toBe(true);
    expect(isAllowedOrigin("http://institutodeciocarrilho.com.br", ALLOWED)).toBe(false);
    expect(isAllowedOrigin("https://evil.com", ALLOWED)).toBe(false);
    expect(isAllowedOrigin("https://institutodeciocarrilho.com.br.evil.com", ALLOWED)).toBe(false);
    expect(isAllowedOrigin(null, ALLOWED)).toBe(false);
  });
});

describe("buildCorsHeaders", () => {
  it("origem autorizada recebe Allow-Origin com a própria origem", () => {
    expect(buildCorsHeaders(SITE, ALLOWED)).toEqual({
      Vary: "Origin",
      "Access-Control-Allow-Origin": SITE,
      "Access-Control-Expose-Headers": "Retry-After",
    });
  });

  it("outra origem só recebe Vary", () => {
    expect(buildCorsHeaders("https://evil.com", ALLOWED)).toEqual({ Vary: "Origin" });
    expect(buildCorsHeaders(null, ALLOWED)).toEqual({ Vary: "Origin" });
  });
});

describe("buildPreflightHeaders", () => {
  it("libera POST com Content-Type — nunca Authorization (segredo não vai ao navegador)", () => {
    const headers = buildPreflightHeaders(SITE, ALLOWED);
    expect(headers["Access-Control-Allow-Origin"]).toBe(SITE);
    expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(headers["Access-Control-Allow-Headers"]).toBe("Content-Type");
    expect(headers["Access-Control-Max-Age"]).toBe("600");
  });

  it("origem não autorizada: só Allow/Vary (o navegador bloqueia)", () => {
    expect(buildPreflightHeaders("https://evil.com", ALLOWED)).toEqual({ Vary: "Origin", Allow: "POST, OPTIONS" });
  });
});
