import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "@/features/webhook/lib/rate-limit";

describe("createRateLimiter", () => {
  it("permite até o limite na janela e depois bloqueia", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(limiter.check("ip", 0)).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 0 });
    expect(limiter.check("ip", 1_000).remaining).toBe(1);
    expect(limiter.check("ip", 2_000).remaining).toBe(0);
    expect(limiter.check("ip", 3_000)).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 57 });
  });

  it("janela deslizante: libera quando a requisição mais antiga sai da janela", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000 });
    limiter.check("ip", 0);
    limiter.check("ip", 5_000);
    expect(limiter.check("ip", 9_999).allowed).toBe(false);
    expect(limiter.check("ip", 10_001).allowed).toBe(true);
    expect(limiter.check("ip", 10_002).allowed).toBe(false);
  });

  it("requisições bloqueadas não prolongam o bloqueio", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.check("ip", 0);
    for (let t = 1_000; t < 10_000; t += 1_000) limiter.check("ip", t);
    expect(limiter.check("ip", 10_001).allowed).toBe(true);
  });

  it("chaves (IPs) são independentes", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
  });

  it("retry-after é no mínimo 1 segundo", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
    limiter.check("ip", 0);
    expect(limiter.check("ip", 999).retryAfterSeconds).toBe(1);
  });

  it("memória limitada: descarta chaves expiradas e, se preciso, as mais antigas", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, maxKeys: 3 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0);
    // "a", "b" e "c" ainda válidas: a mais antiga ("a") sai para caber "d"
    expect(limiter.check("d", 500).allowed).toBe(true);
    expect(limiter.check("a", 600).allowed).toBe(true);
    // depois da janela, tudo expirado é limpo
    expect(limiter.check("e", 5_000).allowed).toBe(true);
  });

  it("reset limpa os contadores", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.check("ip", 0);
    limiter.reset();
    expect(limiter.check("ip", 1).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("usa o primeiro IP de x-forwarded-for", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": " 200.1.2.3 , 10.0.0.1" }))).toBe("200.1.2.3");
  });

  it("cai para x-real-ip e depois para 'desconhecido'", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "200.9.9.9" }))).toBe("200.9.9.9");
    expect(getClientIp(new Headers())).toBe("desconhecido");
  });
});
