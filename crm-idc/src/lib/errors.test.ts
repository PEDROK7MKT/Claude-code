import { describe, expect, it } from "vitest";
import {
  AppError,
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  NOT_FOUND_MESSAGE,
  PERMISSION_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  getErrorMessage,
  isNetworkError,
  isRetryableError,
} from "@/lib/errors";
import { transitionErrorMessage } from "@/lib/lead-status";

/** Erro no formato do PostgREST. */
const pg = (code: string, message: string, details = "") => ({ code, message, details, hint: "" });

describe("getErrorMessage", () => {
  it("AppError, string e nulos", () => {
    expect(getErrorMessage(new AppError("Informe o nome do lead."))).toBe("Informe o nome do lead.");
    expect(getErrorMessage("Algo deu errado")).toBe("Algo deu errado");
    expect(getErrorMessage("")).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(null)).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(42)).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("falhas de rede", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"))).toBe(NETWORK_ERROR_MESSAGE);
    expect(getErrorMessage(new TypeError("Load failed"))).toBe(NETWORK_ERROR_MESSAGE);
    expect(getErrorMessage(new TypeError("NetworkError when attempting to fetch resource."))).toBe(NETWORK_ERROR_MESSAGE);
    expect(getErrorMessage({ message: "TypeError: Failed to fetch", details: "", hint: "", code: "" })).toBe(
      NETWORK_ERROR_MESSAGE,
    );
    expect(getErrorMessage({ name: "AuthRetryableFetchError", message: "{}", status: 0 })).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("23505: registro duplicado (mensagem específica para daily_metrics)", () => {
    expect(getErrorMessage(pg("23505", 'duplicate key value violates unique constraint "leads_pkey"'))).toBe(
      "Já existe um registro com esses dados",
    );
    expect(
      getErrorMessage(pg("23505", 'duplicate key value violates unique constraint "daily_metrics_date_campaign_key"')),
    ).toBe("Já existe métrica para essa data e campanha");
    expect(
      getErrorMessage(pg("23505", 'duplicate key value violates unique constraint "uq_daily_metrics_date_campaign_ci"')),
    ).toBe("Já existe métrica para essa data e campanha");
  });

  it("23514 dos nossos triggers passa adiante (com rótulos amigáveis)", () => {
    expect(getErrorMessage(pg("23514", "Transição de status não permitida: novo → agendado"))).toBe(
      transitionErrorMessage("novo", "agendado"),
    );
    expect(getErrorMessage(pg("23514", 'Todo lead deve ser criado com status "novo" (recebido: em_contato)'))).toBe(
      'Todo lead deve ser criado com status "novo" (recebido: em contato)',
    );
  });

  it("23514 de CHECK de coluna (inglês) vira mensagem amigável", () => {
    expect(
      getErrorMessage(pg("23514", 'new row for relation "leads" violates check constraint "leads_phone_check"')),
    ).toBe("Telefone inválido. Informe DDD + número (10 ou 11 dígitos).");
    expect(
      getErrorMessage(pg("23514", 'new row for relation "gmn_metrics" violates check constraint "gmn_metrics_check"')),
    ).toBe("Dados inválidos. Verifique os campos preenchidos.");
  });

  it("23502: mensagem do trigger ou genérica", () => {
    expect(getErrorMessage(pg("23502", "Informe a data e hora da consulta para agendar o lead"))).toBe(
      "Informe a data e hora da consulta para agendar o lead",
    );
    expect(getErrorMessage(pg("23502", "Lead agendado precisa ter data e hora da consulta"))).toBe(
      "Lead agendado precisa ter data e hora da consulta",
    );
    expect(
      getErrorMessage(pg("23502", 'null value in column "name" of relation "leads" violates not-null constraint')),
    ).toBe("Preencha todos os campos obrigatórios.");
  });

  it("42501 / RLS → sem permissão; mensagens dos triggers passam", () => {
    expect(
      getErrorMessage(pg("42501", 'new row violates row-level security policy for table "daily_metrics"')),
    ).toBe(PERMISSION_ERROR_MESSAGE);
    expect(getErrorMessage(pg("42501", "permission denied for table leads"))).toBe(PERMISSION_ERROR_MESSAGE);
    expect(getErrorMessage(pg("42501", 'Leads não podem ser excluídos. Marque como "perdido".'))).toBe(
      'Leads não podem ser excluídos. Marque como "perdido".',
    );
    expect(getErrorMessage({ message: 'new row violates row-level security policy for table "x"' })).toBe(
      PERMISSION_ERROR_MESSAGE,
    );
  });

  it("códigos do PostgREST e do Postgres", () => {
    expect(getErrorMessage(pg("P0002", "Lead não encontrado"))).toBe("Lead não encontrado");
    expect(getErrorMessage(pg("PGRST116", "JSON object requested, multiple (or no) rows returned"))).toBe(
      NOT_FOUND_MESSAGE,
    );
    expect(getErrorMessage(pg("PGRST301", "JWT expired"))).toBe(SESSION_EXPIRED_MESSAGE);
    expect(getErrorMessage(pg("22P02", 'invalid input syntax for type uuid: "x"'))).toBe(
      "Dados inválidos. Verifique os campos preenchidos.",
    );
    expect(getErrorMessage(pg("57014", "canceling statement due to statement timeout"))).toBe(
      "A consulta demorou demais. Tente novamente.",
    );
  });

  it("erros do Auth", () => {
    expect(getErrorMessage({ name: "AuthApiError", code: "invalid_credentials", message: "Invalid login credentials", status: 400 })).toBe(
      "E-mail ou senha inválidos.",
    );
    expect(getErrorMessage({ name: "AuthSessionMissingError", message: "Auth session missing!", status: 400 })).toBe(
      SESSION_EXPIRED_MESSAGE,
    );
  });

  it("status HTTP sem código", () => {
    expect(getErrorMessage({ message: "Unauthorized", status: 401 })).toBe(SESSION_EXPIRED_MESSAGE);
    expect(getErrorMessage({ message: "Forbidden", status: 403 })).toBe(PERMISSION_ERROR_MESSAGE);
    expect(getErrorMessage({ message: "Bad gateway", status: 502 })).toMatch(/indisponível/);
  });

  it("mensagens técnicas em inglês viram genéricas", () => {
    expect(getErrorMessage(new Error("Cannot read properties of undefined (reading 'id')"))).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("AbortError", () => {
    const abort = new Error("The operation was aborted.");
    abort.name = "AbortError";
    expect(getErrorMessage(abort)).toMatch(/cancelada/);
  });
});

describe("isNetworkError", () => {
  it("reconhece falhas de fetch", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(pg("42501", "permission denied"))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});

describe("isRetryableError", () => {
  it.each([
    [new AppError("x"), false],
    [new TypeError("Failed to fetch"), true],
    [pg("42501", "permission denied"), false],
    [pg("23505", "duplicate"), false],
    [pg("23514", "check"), false],
    [pg("P0002", "Lead não encontrado"), false],
    [pg("PGRST116", "no rows"), false],
    [pg("PGRST301", "jwt"), false],
    [pg("PGRST000", "connection"), true],
    [pg("PGRST003", "timeout"), true],
    [pg("57014", "timeout"), true],
    [pg("08006", "connection failure"), true],
    [pg("40001", "serialization"), true],
    [pg("53300", "too many connections"), true],
    [{ message: "Not found", status: 404 }, false],
    [{ message: "Too many", status: 429 }, true],
    [{ message: "Timeout", status: 408 }, true],
    [new Error("boom"), true],
  ])("%o → %s", (err, expected) => {
    expect(isRetryableError(err)).toBe(expected);
  });

  it("AbortError não é repetido", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    expect(isRetryableError(abort)).toBe(false);
  });
});
