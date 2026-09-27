/**
 * Rate limit em memória (janela deslizante por chave). É "melhor esforço": cada
 * instância do servidor (ex.: cada função na Vercel) tem o próprio contador, e
 * ele zera quando a instância reinicia. Suficiente para frear robôs no formulário
 * do site; para garantia forte use o firewall da hospedagem (ver docs/WEBHOOK.md).
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Requisições restantes na janela atual */
  remaining: number;
  /** Segundos até liberar (0 quando permitido) */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
  reset(): void;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  /** Máximo de chaves em memória (protege contra muitos IPs diferentes) */
  maxKeys?: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      if (!times.length || times[times.length - 1] <= now - windowMs) hits.delete(key);
    }
    // ainda cheio: descarta as chaves mais antigas (Map mantém a ordem de inserção)
    for (const key of hits.keys()) {
      if (hits.size < maxKeys) break;
      hits.delete(key);
    }
  }

  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => time > now - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        const retryAfterMs = recent[0] + windowMs - now;
        return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
      }
      if (!hits.has(key) && hits.size >= maxKeys) prune(now);
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, remaining: limit - recent.length, retryAfterSeconds: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

/**
 * IP do cliente para o rate limit: primeiro item de x-forwarded-for (a Vercel
 * sobrescreve esse cabeçalho com o IP real), depois x-real-ip.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim() || "";
  return ip ? ip.slice(0, 64) : "desconhecido";
}
