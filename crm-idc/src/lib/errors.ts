/**
 * Erros amigáveis (pt-BR) para respostas do Supabase/PostgREST/Postgres.
 * Funções puras — usadas pelos hooks de dados (toasts) e pelo QueryClient (retry).
 */
import { STATUS_META } from "@/lib/constants";
import { isLeadStatus, transitionErrorMessage } from "@/lib/lead-status";

export const GENERIC_ERROR_MESSAGE = "Não foi possível concluir a operação. Tente novamente.";
export const NETWORK_ERROR_MESSAGE = "Sem conexão com o servidor";
export const PERMISSION_ERROR_MESSAGE = "Você não tem permissão para esta ação";
export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente para continuar.";
export const NOT_FOUND_MESSAGE = "Registro não encontrado ou você não tem permissão para acessá-lo.";

/**
 * Erro com mensagem já pronta para o usuário (validação no cliente, regras de negócio).
 * `getErrorMessage()` repassa a mensagem sem alteração.
 */
export class AppError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/** Formato comum de erros do PostgREST, Auth e Functions (todos opcionais). */
interface ErrorLike {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
}

function asErrorLike(err: unknown): ErrorLike | null {
  return typeof err === "object" && err !== null ? (err as ErrorLike) : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
  /fetch failed/i,
  /err_internet_disconnected/i,
  /err_network/i,
  /econnrefused|enotfound|econnreset|etimedout|eai_again/i,
];

/** Erro de rede (sem resposta do servidor)? */
export function isNetworkError(err: unknown): boolean {
  const e = asErrorLike(err);
  if (!e) return false;
  const name = str(e.name);
  const message = str(e.message);
  const details = str(e.details);
  if (name === "AuthRetryableFetchError" || name === "FunctionsFetchError") return true;
  // PostgREST sem throwOnError: { message: "TypeError: Failed to fetch", code: "" }
  // PostgREST com throwOnError: o TypeError original do fetch é propagado
  const text = `${name} ${message} ${details}`;
  return NETWORK_PATTERNS.some((re) => re.test(text));
}

function isAbortError(err: unknown): boolean {
  const e = asErrorLike(err);
  if (!e) return false;
  return str(e.name) === "AbortError" || /^AbortError:/.test(str(e.message)) || str(e.code) === "ABORT_ERR";
}

/** Heurística: a mensagem já está em português (vinda dos nossos triggers/RPC ou do app)? */
function looksPortuguese(message: string): boolean {
  if (!message) return false;
  if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(message)) return true;
  // palavras sem acento que não aparecem em mensagens do Postgres/PostgREST (em inglês)
  return /\b(informe|precisa|consulta|agendad[oa]s?|devem?|telefone|campanha|registro|usuari[oa])\b/i.test(message);
}

/** "Transição de status não permitida: novo → agendado" → mensagem com rótulos dos status. */
function prettifyTransitionMessage(message: string): string | null {
  const match = /Transição de status não permitida:\s*(\w+)\s*→\s*(\w+)/.exec(message);
  if (!match) return null;
  const [, from, to] = match;
  if (isLeadStatus(from) && isLeadStatus(to)) return transitionErrorMessage(from, to);
  return null;
}

/** "Todo lead deve ser criado com status "novo" (recebido: agendado)" → rótulo amigável. */
function prettifyStatusValues(message: string): string {
  return message.replace(/\b(recebido:\s*)(\w+)/, (full, prefix: string, value: string) =>
    isLeadStatus(value) ? `${prefix}${STATUS_META[value].label}` : full,
  );
}

function uniqueViolationMessage(e: ErrorLike): string {
  const text = `${str(e.message)} ${str(e.details)}`;
  if (/daily_metrics/i.test(text)) return "Já existe métrica para essa data e campanha";
  return "Já existe um registro com esses dados";
}

function checkViolationMessage(e: ErrorLike): string {
  const message = str(e.message);
  const pretty = prettifyTransitionMessage(message);
  if (pretty) return pretty;
  // CHECK de coluna (mensagem do Postgres em inglês)
  if (/violates check constraint/i.test(message)) {
    if (/phone/i.test(message)) return "Telefone inválido. Informe DDD + número (10 ou 11 dígitos).";
    if (/rating/i.test(message)) return "A nota média deve estar entre 0 e 5.";
    if (/period/i.test(message)) return "O fim do período deve ser igual ou posterior ao início.";
    if (/color/i.test(message)) return "Cor inválida. Use o formato #RRGGBB.";
    if (/name/i.test(message)) return "Informe o nome.";
    if (/campaign/i.test(message)) return "Informe a campanha.";
    return "Dados inválidos. Verifique os campos preenchidos.";
  }
  return looksPortuguese(message) ? prettifyStatusValues(message) : "Dados inválidos. Verifique os campos preenchidos.";
}

function permissionMessage(e: ErrorLike): string {
  const message = str(e.message);
  // Mensagens dos nossos triggers (ex.: "Leads não podem ser excluídos...") já estão em pt-BR
  if (looksPortuguese(message) && !/row-level security|permission denied/i.test(message)) return message;
  return PERMISSION_ERROR_MESSAGE;
}

function postgresMessage(code: string, e: ErrorLike): string | null {
  const message = str(e.message);
  switch (code) {
    case "23505":
      return uniqueViolationMessage(e);
    case "23514":
      return checkViolationMessage(e);
    case "23502":
      return looksPortuguese(message) ? message : "Preencha todos os campos obrigatórios.";
    case "23503":
      return "Registro relacionado não encontrado (pode ter sido removido).";
    case "42501":
      return permissionMessage(e);
    case "P0001":
    case "P0002":
      return looksPortuguese(message) ? message : GENERIC_ERROR_MESSAGE;
    case "22P02":
    case "22023":
      return "Dados inválidos. Verifique os campos preenchidos.";
    case "22001":
      return "Texto maior que o permitido.";
    case "22003":
      return "Valor numérico fora do limite permitido.";
    case "22007":
    case "22008":
      return "Data inválida.";
    case "57014":
      return "A consulta demorou demais. Tente novamente.";
    case "40001":
    case "40P01":
      return "Conflito ao salvar: outra alteração aconteceu ao mesmo tempo. Tente novamente.";
    case "21000":
      return "Há linhas repetidas nos dados enviados.";
    // PostgREST
    case "PGRST116":
      return NOT_FOUND_MESSAGE;
    case "PGRST301":
    case "PGRST302":
    case "PGRST303":
      return SESSION_EXPIRED_MESSAGE;
    case "PGRST000":
    case "PGRST001":
    case "PGRST002":
    case "PGRST003":
      return "O servidor está indisponível no momento. Tente novamente em instantes.";
    default:
      return null;
  }
}

function authMessage(e: ErrorLike): string | null {
  const message = str(e.message);
  const code = str(e.code);
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) return "E-mail ou senha inválidos.";
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) return "E-mail ainda não confirmado.";
  if (code === "user_banned" || /user is banned/i.test(message)) return "Usuário desativado. Fale com o administrador.";
  if (code === "over_request_rate_limit" || /rate limit/i.test(message))
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (code === "session_not_found" || code === "refresh_token_not_found" || /jwt expired|auth session missing/i.test(message))
    return SESSION_EXPIRED_MESSAGE;
  if (code === "weak_password" || /password should be/i.test(message))
    return "Senha fraca. Use pelo menos 8 caracteres, com letras e números.";
  if (code === "email_exists" || code === "user_already_exists" || /already (been )?registered/i.test(message))
    return "Já existe um usuário com este e-mail.";
  return null;
}

/**
 * Mensagem amigável em pt-BR para qualquer erro vindo do Supabase, da rede ou do app.
 * - AppError → mensagem original
 * - check_violation/not_null dos nossos triggers → mensagem do banco (já em pt-BR)
 * - 23505 → "Já existe um registro com esses dados" (daily_metrics: "Já existe métrica para essa data e campanha")
 * - 42501 / RLS → "Você não tem permissão para esta ação"
 * - falha de rede → "Sem conexão com o servidor"
 */
export function getErrorMessage(err: unknown): string {
  if (err == null) return GENERIC_ERROR_MESSAGE;
  if (typeof err === "string") return err.trim() || GENERIC_ERROR_MESSAGE;
  if (err instanceof AppError) return err.message || GENERIC_ERROR_MESSAGE;

  const e = asErrorLike(err);
  if (!e) return GENERIC_ERROR_MESSAGE;

  if (isAbortError(err)) return "A requisição foi cancelada ou demorou demais. Tente novamente.";
  if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

  const code = str(e.code);
  const message = str(e.message);

  if (code) {
    const pg = postgresMessage(code, e);
    if (pg) return pg;
  }

  // RLS sem código (ex.: respostas de Storage/Functions)
  if (/row-level security|permission denied/i.test(message)) return PERMISSION_ERROR_MESSAGE;
  if (/duplicate key value/i.test(message)) return uniqueViolationMessage(e);

  const auth = authMessage(e);
  if (auth) return auth;

  const status = typeof e.status === "number" ? e.status : null;
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 403) return PERMISSION_ERROR_MESSAGE;
  if (status === 429) return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (status !== null && status >= 500) return "O servidor está indisponível no momento. Tente novamente em instantes.";

  // Sem código conhecido: repassa só se a mensagem já for voltada ao usuário (pt-BR)
  if (looksPortuguese(message)) return message;

  // Offline sem erro de rede explícito (ex.: token não renovado)
  if (typeof navigator !== "undefined" && navigator.onLine === false) return NETWORK_ERROR_MESSAGE;

  return GENERIC_ERROR_MESSAGE;
}

/**
 * Vale a pena tentar de novo? Usado no `retry` do QueryClient.
 * Não repete erros do cliente (4xx, RLS, validação, registro inexistente);
 * repete falhas de rede, timeouts e indisponibilidade do servidor.
 */
export function isRetryableError(err: unknown): boolean {
  if (err instanceof AppError) return false;
  if (isAbortError(err)) return false;
  if (isNetworkError(err)) return true;

  const e = asErrorLike(err);
  if (!e) return true;

  const status = typeof e.status === "number" ? e.status : null;
  if (status !== null && status >= 400 && status < 500) return status === 408 || status === 429;

  const code = str(e.code);
  if (!code) return true;
  if (/^PGRST00[0-3]$/.test(code)) return true; // conexão PostgREST ↔ Postgres
  if (code.startsWith("PGRST")) return false;
  // Classes do Postgres transitórias: conexão (08), rollback de transação (40),
  // recursos (53), intervenção do operador/timeout (57), erro de sistema (58)
  if (/^(08|40|53|57|58)/.test(code)) return true;
  // Demais códigos SQLSTATE (5 caracteres): dados/permissão/regra de negócio — não repetir
  if (/^[0-9A-Z]{5}$/.test(code)) return false;
  return true;
}
