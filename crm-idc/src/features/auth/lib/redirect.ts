/**
 * Destinos de navegação da autenticação (login, logout, pós-login).
 * Funções puras — usadas pela tela de login, pela rota /auth/signout e testadas com vitest.
 */
import type { UserRole } from "@/types/database";

export const LOGIN_PATH = "/login";
export const SIGN_OUT_PATH = "/auth/signout";
export const DASHBOARD_PATH = "/dashboard";

/**
 * Página inicial de cada papel após o login (spec §4.1 "redirect automático baseado no role").
 * Ambos abrem /dashboard: a própria página renderiza a visão do papel — completa para o
 * gestor de tráfego (admin) e resumida para o dentista. Mantido por papel para que uma
 * rota específica possa ser adotada no futuro sem mexer no fluxo de login.
 */
export const ROLE_HOME_PATH: Readonly<Record<UserRole, string>> = {
  admin: DASHBOARD_PATH,
  dentist: DASHBOARD_PATH,
};

export function homePathForRole(role: UserRole | null | undefined): string {
  return (role && ROLE_HOME_PATH[role]) || DASHBOARD_PATH;
}

/** Destinos que não fazem sentido após o login (loop de login, logout, API, assets). */
const BLOCKED_NEXT_PREFIXES = [LOGIN_PATH, "/auth", "/api", "/_next"] as const;
const MAX_NEXT_LENGTH = 2048;
const PLACEHOLDER_ORIGIN = "http://idc.invalid";

/**
 * Valida o `?next=` do login: só caminhos relativos do próprio app.
 * Rejeita URLs absolutas (`https://…`), relativas ao protocolo (`//host`, `/\host`, e também
 * as que só viram `//host` após normalizar os segmentos de ponto, como `/.//host`),
 * esquemas (`javascript:`), caracteres de controle e rotas de autenticação.
 * Retorna o caminho normalizado (pathname + search + hash) ou `null`.
 */
export function getSafeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > MAX_NEXT_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // barras invertidas viram "/" em navegadores ("/\evil.com" → "//evil.com") e controles são ignorados
  if (/[\\\u0000-\u001F\u007F]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;

  const pathname = url.pathname;
  // Confere de novo após normalizar: segmentos de ponto ("/.//evil.com", "/%2e//evil.com",
  // "/a/..//evil.com") colapsam em "//evil.com", que o navegador trata como outro host.
  if (pathname.startsWith("//")) return null;
  if (BLOCKED_NEXT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;
  return `${pathname}${url.search}${url.hash}`;
}

/** Destino após login: `?next=` seguro ou a página inicial do papel. */
export function resolvePostLoginPath({ next, role }: { next?: string | null; role: UserRole | null | undefined }): string {
  return getSafeNextPath(next) ?? homePathForRole(role);
}

/** Primeiro valor de um search param do Next (`string | string[] | undefined`). */
export function firstSearchParam(value: string | string[] | undefined | null): string | null {
  if (Array.isArray(value)) return value.length > 0 ? (value[0] ?? null) : null;
  return typeof value === "string" ? value : null;
}

/** Motivos conhecidos de retorno ao login (`/login?reason=`). */
export type LoginReason = "inactive";

export function parseLoginReason(value: string | null | undefined): LoginReason | null {
  return value === "inactive" ? "inactive" : null;
}

/** Destino do redirect da rota /auth/signout (preserva só motivos conhecidos). */
export function buildSignOutRedirectPath(reason: string | null | undefined): string {
  const parsed = parseLoginReason(reason);
  return parsed ? `${LOGIN_PATH}?reason=${parsed}` : LOGIN_PATH;
}
