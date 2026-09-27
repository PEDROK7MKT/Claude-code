import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookConfig } from "@/features/webhook/lib/config";
import { createLeadWebhookHandler, describeError, type WebhookLogger } from "@/features/webhook/lib/handler";
import { createRateLimiter } from "@/features/webhook/lib/rate-limit";
import type { ExistingLead, WebhookLeadInsert, WebhookLeadRepository } from "@/features/webhook/lib/types";

const URL_ = "https://crm.institutodeciocarrilho.com.br/api/webhook/lead";
const SECRET = "0123456789abcdef0123456789abcdef";
const SITE = "https://institutodeciocarrilho.com.br";
const NOW = new Date("2026-03-10T15:00:00.000Z");

const CONFIG: WebhookConfig = {
  secret: SECRET,
  secretProblem: null,
  allowedOrigins: [SITE],
  databaseConfigured: true,
};

class FakeRepository implements WebhookLeadRepository {
  leads: ExistingLead[] = [];
  inserted: WebhookLeadInsert[] = [];
  failFind = false;
  failInsert = false;

  async findLeadsByPhone(phone: string): Promise<ExistingLead[]> {
    if (this.failFind) throw new Error("timeout");
    return this.leads.filter((lead) => lead.id.startsWith(phone));
  }

  async insertLead(lead: WebhookLeadInsert): Promise<{ id: string }> {
    if (this.failInsert) {
      throw Object.assign(new Error('new row violates check constraint "leads_phone_check"'), {
        code: "23514",
        details: "Failing row contains (Maria Silva, 77987654321)",
      });
    }
    this.inserted.push(lead);
    return { id: `novo-${this.inserted.length}` };
  }
}

function createLogger() {
  const lines: string[] = [];
  const logger: WebhookLogger = {
    error: (message, detail) => lines.push(`error ${message} ${detail ?? ""}`),
    warn: (message, detail) => lines.push(`warn ${message} ${detail ?? ""}`),
    info: (message, detail) => lines.push(`info ${message} ${detail ?? ""}`),
  };
  return { logger, lines };
}

let repo: FakeRepository;
let config: WebhookConfig;
let log: ReturnType<typeof createLogger>;
let getRepository: ReturnType<typeof vi.fn<() => WebhookLeadRepository>>;

function handler() {
  return createLeadWebhookHandler({
    getConfig: () => config,
    getRepository,
    rateLimiter: createRateLimiter({ limit: 10, windowMs: 60_000 }),
    now: () => NOW,
    logger: log.logger,
  });
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  const isString = typeof body === "string";
  return new Request(URL_, {
    method: "POST",
    headers: { ...(isString ? {} : { "content-type": "application/json" }), ...headers },
    body: isString ? body : JSON.stringify(body),
  });
}

const withSecret = { authorization: `Bearer ${SECRET}` };
const fromSite = { origin: SITE, "x-forwarded-for": "200.1.2.3" };
const LEAD = { name: "Maria Silva", phone: "(77) 98765-4321" };
/** Corpo único do modo público: nunca revela id nem se o telefone já existe */
const PUBLIC_OK = { ok: true, id: null, duplicate_of: null };

beforeEach(() => {
  repo = new FakeRepository();
  config = { ...CONFIG };
  log = createLogger();
  getRepository = vi.fn<() => WebhookLeadRepository>(() => repo);
});

describe("configuração", () => {
  it("sem WEBHOOK_SECRET → 503 e nada é gravado (nem sem autenticação)", async () => {
    config = { ...CONFIG, secret: null, secretProblem: "missing" };
    const res = await handler().handlePost(post(LEAD, fromSite));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: expect.stringContaining("WEBHOOK_SECRET") });
    expect(getRepository).not.toHaveBeenCalled();
    expect(log.lines[0]).toContain("não configurado");
  });

  it("segredo curto demais → 503", async () => {
    config = { ...CONFIG, secret: null, secretProblem: "too_short" };
    const res = await handler().handlePost(post(LEAD, withSecret));
    expect(res.status).toBe(503);
    expect(log.lines[0]).toContain("menos de 16 caracteres");
  });

  it("segredo de exemplo do .env.example → 503", async () => {
    config = { ...CONFIG, secret: null, secretProblem: "placeholder" };
    const res = await handler().handlePost(post(LEAD, { authorization: "Bearer troque-por-um-valor-aleatorio-longo" }));
    expect(res.status).toBe(503);
    expect(getRepository).not.toHaveBeenCalled();
    expect(log.lines[0]).toContain("valor de exemplo");
  });

  it("sem service role → 503", async () => {
    config = { ...CONFIG, databaseConfigured: false };
    const res = await handler().handlePost(post(LEAD, withSecret));
    expect(res.status).toBe(503);
  });
});

describe("autenticação", () => {
  it("sem segredo e sem origem autorizada → 401", async () => {
    const res = await handler().handlePost(post(LEAD));
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
    expect((await res.json()).error).toContain("Authorization");
    expect(repo.inserted).toHaveLength(0);
  });

  it("segredo errado → 401, mesmo vindo do site", async () => {
    const res = await handler().handlePost(post(LEAD, { ...fromSite, "x-webhook-secret": "errado" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain("inválido");
  });

  it("segredo via x-webhook-secret também vale", async () => {
    const res = await handler().handlePost(post(LEAD, { "x-webhook-secret": SECRET }));
    expect(res.status).toBe(201);
  });

  it("segredo válido vindo do site usa o modo integração (resposta detalhada)", async () => {
    const res = await handler().handlePost(post(LEAD, { ...fromSite, "x-webhook-secret": SECRET }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "novo-1", duplicate_of: null });
  });

  it("origem não autorizada não vira modo público", async () => {
    const res = await handler().handlePost(post(LEAD, { origin: "https://evil.com" }));
    expect(res.status).toBe(401);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("POST com segredo (integração de servidor)", () => {
  it("cria o lead e responde 201 { ok, id, duplicate_of }", async () => {
    const res = await handler().handlePost(
      post(
        {
          ...LEAD,
          url: "https://institutodeciocarrilho.com.br/urgencia?utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term=dentista%20barreiras",
          service: "canal",
          message: "Estou com dor",
        },
        withSecret,
      ),
    );
    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true, id: "novo-1", duplicate_of: null });
    expect(repo.inserted[0]).toMatchObject({
      name: "Maria Silva",
      phone: "77987654321",
      source: "google_ads",
      campaign: "IDC | Urgência e Canal",
      keyword: "dentista barreiras",
      landing_page: "/urgencia",
      service: "canal",
      notes: "Mensagem: Estou com dor",
      parent_lead_id: null,
    });
    expect(repo.inserted[0]).not.toHaveProperty("status");
  });

  it("nome é opcional para integrações autenticadas", async () => {
    const res = await handler().handlePost(post({ phone: "77987654321" }, withSecret));
    expect(res.status).toBe(201);
    expect(repo.inserted[0].name).toBe("Lead sem nome");
  });

  it("campo isca é ignorado com segredo (servidor confiável)", async () => {
    const res = await handler().handlePost(post({ ...LEAD, website: "x" }, withSecret));
    expect(res.status).toBe(201);
  });

  it("não sofre rate limit", async () => {
    const h = handler();
    for (let i = 0; i < 12; i++) {
      const res = await h.handlePost(post({ ...LEAD, phone: `7798765432${i % 10}` }, withSecret));
      expect(res.status).not.toBe(429);
    }
  });
});

describe("modo público (navegador do site, sem segredo)", () => {
  it("aceita formulário urlencoded da origem autorizada, com CORS", async () => {
    const res = await handler().handlePost(
      post("name=Jo%C3%A3o&phone=77987654321&service=implante&url=https%3A%2F%2Finstitutodeciocarrilho.com.br%2Fimplante%3Fgclid%3Dabc", {
        ...fromSite,
        "content-type": "application/x-www-form-urlencoded",
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUBLIC_OK);
    expect(res.headers.get("access-control-allow-origin")).toBe(SITE);
    expect(res.headers.get("vary")).toBe("Origin");
    expect(repo.inserted[0]).toMatchObject({ name: "João", source: "google_ads", service: "implante" });
  });

  it("telefone já cadastrado: grava vinculado, mas a resposta não revela o lead existente", async () => {
    repo.leads = [
      { id: "77987654321-antigo", name: "Maria", status: "perdido", created_at: "2025-12-01T12:00:00Z", updated_at: "2025-12-01T12:00:00Z" },
    ];
    const res = await handler().handlePost(post(LEAD, fromSite));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual(PUBLIC_OK);
    expect(text).not.toContain("antigo");
    expect(repo.inserted[0].parent_lead_id).toBe("77987654321-antigo");
  });

  it("criado, reenvio em até 2 min e honeypot recebem exatamente a mesma resposta", async () => {
    const h = handler();
    const created = await h.handlePost(post(LEAD, fromSite));
    repo.leads = [
      { id: "77987654321-agora", name: "Maria Silva", status: "novo", created_at: "2026-03-10T14:59:30Z", updated_at: "2026-03-10T14:59:30Z" },
    ];
    const repeated = await h.handlePost(post(LEAD, fromSite));
    const honeypot = await h.handlePost(post({ ...LEAD, website: "https://spam.example" }, fromSite));

    const snapshot = async (res: Response) => ({ status: res.status, body: await res.text() });
    const [a, b, c] = await Promise.all([snapshot(created), snapshot(repeated), snapshot(honeypot)]);
    expect(a).toEqual({ status: 200, body: JSON.stringify(PUBLIC_OK) });
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    expect(repo.inserted).toHaveLength(1);
  });

  it("exige nome e telefone", async () => {
    const res = await handler().handlePost(post({ phone: "77987654321" }, fromSite));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "Dados inválidos. Corrija os campos indicados e envie novamente.",
      fields: [{ field: "name", message: "Informe o nome do paciente." }],
    });
  });

  it("honeypot preenchido: responde sucesso sem gravar", async () => {
    const res = await handler().handlePost(post({ ...LEAD, website: "https://spam.example" }, fromSite));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUBLIC_OK);
    expect(getRepository).not.toHaveBeenCalled();
    expect(log.lines.some((line) => line.startsWith("warn"))).toBe(true);
  });

  it("rate limit por IP: 10 por minuto, depois 429 com Retry-After", async () => {
    const h = handler();
    for (let i = 0; i < 10; i++) {
      const res = await h.handlePost(post({ ...LEAD, phone: `779876543${String(i).padStart(2, "0")}` }, fromSite));
      expect(res.status).toBe(200);
    }
    const blocked = await h.handlePost(post(LEAD, fromSite));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect(blocked.headers.get("access-control-allow-origin")).toBe(SITE);
    expect((await blocked.json()).error).toContain("60 segundos");

    // outro IP segue livre
    const other = await h.handlePost(post(LEAD, { ...fromSite, "x-forwarded-for": "200.9.9.9" }));
    expect(other.status).toBe(200);
  });

  it("tentativas com segredo errado também contam no rate limit", async () => {
    const h = handler();
    const bad = { "x-webhook-secret": "errado", "x-forwarded-for": "10.0.0.1" };
    for (let i = 0; i < 10; i++) expect((await h.handlePost(post(LEAD, bad))).status).toBe(401);
    expect((await h.handlePost(post(LEAD, bad))).status).toBe(429);
  });
});

describe("validação e corpo", () => {
  it("telefone inválido → 400 com o campo em pt-BR", async () => {
    const res = await handler().handlePost(post({ name: "A", phone: "123" }, withSecret));
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual([
      { field: "phone", message: "Telefone inválido. Informe DDD + número, ex.: (77) 98765-4321." },
    ]);
    expect(getRepository).not.toHaveBeenCalled();
  });

  it("tipos errados → 400 listando os campos", async () => {
    const res = await handler().handlePost(post({ name: ["A"], phone: { n: 1 } }, withSecret));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields.map((f: { field: string }) => f.field)).toEqual(["name", "phone"]);
  });

  it("JSON malformado → 400", async () => {
    const res = await handler().handlePost(post("{nome:", { ...withSecret, "content-type": "application/json" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("JSON inválido");
  });

  it("corpo acima de 16 KB → 413", async () => {
    const res = await handler().handlePost(post({ ...LEAD, notes: "x".repeat(17 * 1024) }, withSecret));
    expect(res.status).toBe(413);
  });

  it("multipart → 415", async () => {
    const res = await handler().handlePost(post("--abc", { ...withSecret, "content-type": "multipart/form-data; boundary=abc" }));
    expect(res.status).toBe(415);
  });
});

describe("duplicados (regra 4)", () => {
  const phone = "77987654321";

  it("telefone já cadastrado: cria novo lead vinculado ao mais recente, com nota", async () => {
    repo.leads = [
      { id: `${phone}-antigo`, name: "Maria", status: "perdido", created_at: "2025-12-01T12:00:00Z", updated_at: "2025-12-01T12:00:00Z" },
      { id: `${phone}-recente`, name: "Maria Silva", status: "em_contato", created_at: "2026-03-02T01:30:00Z", updated_at: "2026-03-02T01:30:00Z" },
    ];
    const res = await handler().handlePost(post({ ...LEAD, message: "Oi de novo" }, withSecret));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "novo-1", duplicate_of: `${phone}-recente` });
    expect(repo.inserted[0].parent_lead_id).toBe(`${phone}-recente`);
    expect(repo.inserted[0].notes).toBe("Possível duplicado de Maria Silva (01/03/2026)\nMensagem: Oi de novo");
  });

  it("reenvio em menos de 2 minutos (lead ainda 'novo'): devolve o mesmo id sem gravar", async () => {
    repo.leads = [
      { id: `${phone}-agora`, name: "Maria Silva", status: "novo", created_at: "2026-03-10T14:59:30Z", updated_at: "2026-03-10T14:59:30Z" },
    ];
    const res = await handler().handlePost(post(LEAD, withSecret));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: `${phone}-agora`, duplicate_of: null, repeated: true });
    expect(repo.inserted).toHaveLength(0);
  });

  it("reenvio pelo modo público: nada é gravado e a resposta é a genérica", async () => {
    repo.leads = [
      { id: `${phone}-agora`, name: "Maria Silva", status: "novo", created_at: "2026-03-10T14:59:30Z", updated_at: "2026-03-10T14:59:30Z" },
    ];
    const res = await handler().handlePost(post(LEAD, fromSite));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUBLIC_OK);
    expect(repo.inserted).toHaveLength(0);
  });

  it("falha na busca de duplicados não perde o lead", async () => {
    repo.failFind = true;
    const res = await handler().handlePost(post(LEAD, withSecret));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "novo-1", duplicate_of: null });
    expect(log.lines.some((line) => line.startsWith("error"))).toBe(true);
  });
});

describe("erros do servidor", () => {
  it("falha ao gravar → 500 genérico, sem vazar detalhes nem dados do paciente no log", async () => {
    repo.failInsert = true;
    const res = await handler().handlePost(post(LEAD, withSecret));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Erro interno ao registrar o lead. Tente novamente em instantes." });
    const logged = log.lines.join("\n");
    expect(logged).toContain("code=23514");
    expect(logged).not.toContain("Maria");
    expect(logged).not.toContain("77987654321");
  });

  it("erro inesperado vira 500 JSON", async () => {
    const h = createLeadWebhookHandler({
      getConfig: () => {
        throw new Error("boom");
      },
      getRepository,
      rateLimiter: createRateLimiter({ limit: 10, windowMs: 60_000 }),
      logger: log.logger,
    });
    const res = await h.handlePost(post(LEAD, withSecret));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });

  it("log de sucesso só tem o id do lead", async () => {
    await handler().handlePost(post({ ...LEAD, message: "segredo médico" }, withSecret));
    expect(log.lines).toEqual(["info [webhook/lead] lead novo-1 criado. "]);
  });
});

describe("outros métodos", () => {
  it("OPTIONS da origem autorizada → 204 com preflight", () => {
    const res = handler().handleOptions(
      new Request(URL_, { method: "OPTIONS", headers: { origin: SITE, "access-control-request-method": "POST" } }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(SITE);
    expect(res.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
    expect(res.headers.get("access-control-allow-headers")).toBe("Content-Type");
  });

  it("OPTIONS de outra origem → sem Allow-Origin", () => {
    const res = handler().handleOptions(new Request(URL_, { method: "OPTIONS", headers: { origin: "https://evil.com" } }));
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("GET/PUT/DELETE → 405 com Allow", async () => {
    const res = handler().handleMethodNotAllowed(new Request(URL_, { method: "GET" }));
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST, OPTIONS");
    expect((await res.json()).error).toContain("Use POST");
  });
});

describe("describeError", () => {
  it("nome, código e mensagem — nunca details/hint", () => {
    const error = Object.assign(new Error("falhou"), { code: "PGRST116", details: "Failing row contains (Maria)" });
    expect(describeError(error)).toBe("Error code=PGRST116 falhou");
    expect(describeError({ message: "x", details: "pii" })).toBe("Error x");
    expect(describeError("texto")).toBe("texto");
  });
});
