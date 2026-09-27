import { describe, expect, it } from "vitest";
import { readWebhookConfig } from "@/features/webhook/lib/config";

const DB = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service" };

describe("readWebhookConfig", () => {
  it("configuração completa", () => {
    expect(
      readWebhookConfig({
        ...DB,
        WEBHOOK_SECRET: "  0123456789abcdef0123  ",
        WEBHOOK_ALLOWED_ORIGINS: "https://institutodeciocarrilho.com.br, https://www.institutodeciocarrilho.com.br/",
      }),
    ).toEqual({
      secret: "0123456789abcdef0123",
      secretProblem: null,
      allowedOrigins: ["https://institutodeciocarrilho.com.br", "https://www.institutodeciocarrilho.com.br"],
      databaseConfigured: true,
    });
  });

  it("sem segredo → webhook desativado", () => {
    const config = readWebhookConfig({ ...DB });
    expect(config.secret).toBeNull();
    expect(config.secretProblem).toBe("missing");
    expect(config.allowedOrigins).toEqual([]);
  });

  it("segredo curto demais é tratado como ausente", () => {
    const config = readWebhookConfig({ ...DB, WEBHOOK_SECRET: "123456" });
    expect(config.secret).toBeNull();
    expect(config.secretProblem).toBe("too_short");
  });

  it("sem service role → banco não configurado", () => {
    expect(readWebhookConfig({ WEBHOOK_SECRET: "0123456789abcdef" }).databaseConfigured).toBe(false);
    expect(readWebhookConfig({ ...DB, SUPABASE_SERVICE_ROLE_KEY: " " }).databaseConfigured).toBe(false);
  });
});
