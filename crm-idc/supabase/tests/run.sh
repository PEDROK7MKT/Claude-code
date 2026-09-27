#!/usr/bin/env bash
# =============================================================================
# Testes do banco (migration + regras de negócio + RLS) num PostgreSQL local
# descartável — sem Docker e sem Supabase CLI.
#
# Uso (a partir da raiz do projeto):
#   supabase/tests/run.sh            # stub Supabase + migration (2x) + testes
#   supabase/tests/run.sh --seed     # idem + seed.sql (2x) + checagens do seed
#   supabase/tests/run.sh --keep     # não derruba o cluster no fim (para inspecionar
#                                    # com psql; o comando de parada é impresso)
#   supabase/tests/run.sh --verbose  # mostra a saída completa do psql
#
# Requisitos: binários do PostgreSQL 15+ (initdb, pg_ctl, psql). Detectados em
#   $PG_BIN, `pg_config --bindir`, /usr/lib/postgresql/<versão>/bin ou no PATH.
# Variáveis opcionais:
#   PG_BIN=/caminho/bin        binários do PostgreSQL
#   PGTEST_PORT=54329          porta inicial (procura a próxima livre)
#   PGTEST_TMPDIR=dir          onde criar o cluster (padrão: supabase/.tmp, no .gitignore)
#   PGTEST_OS_USER=postgres    usuário do SO que roda o servidor quando o script roda
#                              como root (o PostgreSQL se recusa a rodar como root)
#
# O cluster é criado do zero a cada execução (idempotente) e sempre removido no
# fim, mesmo em caso de erro ou Ctrl+C. Sai com código != 0 se algo falhar.
# =============================================================================
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPABASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"
SEED_FILE="$SUPABASE_DIR/seed.sql"

WITH_SEED=0
KEEP=0
VERBOSE=0
for arg in "$@"; do
  case "$arg" in
    --seed) WITH_SEED=1 ;;
    --keep) KEEP=1 ;;
    --verbose | -v) VERBOSE=1 ;;
    -h | --help)
      sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Opção desconhecida: $arg (use --help)" >&2
      exit 2
      ;;
  esac
done

if [[ -t 1 ]]; then
  C_GREEN=$'\e[32m'; C_RED=$'\e[31m'; C_DIM=$'\e[2m'; C_BOLD=$'\e[1m'; C_RESET=$'\e[0m'
else
  C_GREEN=""; C_RED=""; C_DIM=""; C_BOLD=""; C_RESET=""
fi

log() { printf '%s\n' "${C_DIM}==> $*${C_RESET}"; }
die() { printf '%s\n' "${C_RED}ERRO: $*${C_RESET}" >&2; exit 1; }

# -----------------------------------------------------------------------------
# Binários do PostgreSQL
# -----------------------------------------------------------------------------
find_pg_bin() {
  local candidate
  if [[ -n "${PG_BIN:-}" ]]; then
    echo "$PG_BIN"; return
  fi
  if command -v pg_config >/dev/null 2>&1; then
    candidate="$(pg_config --bindir 2>/dev/null || true)"
    if [[ -x "$candidate/initdb" ]]; then echo "$candidate"; return; fi
  fi
  for candidate in $(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V -r); do
    if [[ -x "$candidate/initdb" ]]; then echo "$candidate"; return; fi
  done
  if command -v initdb >/dev/null 2>&1; then
    dirname "$(command -v initdb)"; return
  fi
  echo ""
}

PG_BIN="$(find_pg_bin)"
[[ -n "$PG_BIN" && -x "$PG_BIN/initdb" && -x "$PG_BIN/pg_ctl" && -x "$PG_BIN/psql" ]] ||
  die "binários do PostgreSQL não encontrados (defina PG_BIN=/caminho/para/bin)"
PG_MAJOR="$("$PG_BIN/initdb" --version | sed -E 's/.* ([0-9]+)(\.[0-9]+)?.*/\1/')"
[[ "$PG_MAJOR" -ge 15 ]] || die "PostgreSQL 15+ necessário (encontrado: $PG_MAJOR em $PG_BIN)"

# -----------------------------------------------------------------------------
# Usuário do SO que roda o servidor
# -----------------------------------------------------------------------------
OS_USER=""
if [[ "$(id -u)" -eq 0 ]]; then
  OS_USER="${PGTEST_OS_USER:-postgres}"
  id "$OS_USER" >/dev/null 2>&1 ||
    die "rodando como root: crie um usuário sem privilégios ou defina PGTEST_OS_USER"
fi
as_server_user() {
  if [[ -z "$OS_USER" ]]; then
    "$@"
  elif command -v runuser >/dev/null 2>&1; then
    runuser -u "$OS_USER" -- "$@"
  else
    su -s /bin/bash "$OS_USER" -c "$(printf '%q ' "$@")"
  fi
}

# -----------------------------------------------------------------------------
# Porta livre
# -----------------------------------------------------------------------------
port_in_use() { (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1; }
PORT="${PGTEST_PORT:-54329}"
for _ in $(seq 1 50); do
  port_in_use "$PORT" || break
  PORT=$((PORT + 1))
done
port_in_use "$PORT" && die "nenhuma porta livre a partir de ${PGTEST_PORT:-54329}"

# -----------------------------------------------------------------------------
# Cluster descartável
# -----------------------------------------------------------------------------
WORK_ROOT="${PGTEST_TMPDIR:-$SUPABASE_DIR/.tmp}"
mkdir -p "$WORK_ROOT"
WORK="$(mktemp -d "$WORK_ROOT/pgtest.XXXXXX")"
DATA="$WORK/data"
PG_LOG="$WORK/postgres.log"
OUT="$WORK/out.log"
STARTED=0

cleanup() {
  local status=$?
  if [[ "$KEEP" -eq 1 && "$STARTED" -eq 1 ]]; then
    echo
    echo "${C_BOLD}Cluster mantido (--keep):${C_RESET}"
    echo "  psql:   $PG_BIN/psql -h 127.0.0.1 -p $PORT -U postgres -d postgres"
    echo "  parar:  ${OS_USER:+runuser -u $OS_USER -- }$PG_BIN/pg_ctl -D $DATA stop -m fast && rm -rf $WORK"
    exit "$status"
  fi
  if [[ "$STARTED" -eq 1 ]]; then
    as_server_user "$PG_BIN/pg_ctl" -D "$DATA" stop -m immediate >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

if [[ -n "$OS_USER" ]]; then
  chown "$OS_USER" "$WORK"
fi

log "PostgreSQL $PG_MAJOR ($PG_BIN) — cluster em $WORK, porta $PORT"

LOCALE_OPTS=(--locale=C.UTF-8)
if ! locale -a 2>/dev/null | grep -qiE '^c\.utf-?8$'; then
  LOCALE_OPTS=(--locale=C)
fi
as_server_user "$PG_BIN/initdb" -D "$DATA" -U supabase_admin --auth=trust -E UTF8 \
  "${LOCALE_OPTS[@]}" >"$WORK/initdb.log" 2>&1 ||
  { cat "$WORK/initdb.log" >&2; die "initdb falhou"; }

as_server_user "$PG_BIN/pg_ctl" -D "$DATA" -l "$PG_LOG" -w -t 60 \
  -o "-c port=$PORT -c listen_addresses=127.0.0.1 -c unix_socket_directories='' -c timezone=UTC -c wal_level=logical -c fsync=off -c synchronous_commit=off -c full_page_writes=off" \
  start >/dev/null ||
  { cat "$PG_LOG" >&2 2>/dev/null || true; die "o servidor não subiu"; }
STARTED=1

# psql <usuário> [args...] — sem .psqlrc, para no primeiro erro
psql_as() {
  local user="$1"
  shift
  PGOPTIONS="-c client_min_messages=notice" \
    "$PG_BIN/psql" -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=default \
    -h 127.0.0.1 -p "$PORT" -U "$user" -d postgres "$@"
}

FAILED=0
PASSED=0

pass() { PASSED=$((PASSED + 1)); printf '%s\n' "${C_GREEN}PASS${C_RESET}  $*"; }
fail() { FAILED=$((FAILED + 1)); printf '%s\n' "${C_RED}FAIL${C_RESET}  $*"; }

# Executa um arquivo SQL como etapa única (PASS/FAIL pelo código de saída)
run_step() {
  local label="$1" user="$2"
  shift 2
  if psql_as "$user" "$@" >"$OUT" 2>&1; then
    pass "$label"
    [[ "$VERBOSE" -eq 1 ]] && sed 's/^/      /' "$OUT"
    return 0
  fi
  fail "$label"
  sed 's/^/      /' "$OUT"
  return 1
}

# Executa um arquivo de testes: cada teste emite "NOTICE: PASS | nome" ou
# "NOTICE: FAIL | nome → motivo". Erro fora dos testes também conta como falha.
run_test_file() {
  local file="$1" user="$2" status=0 line
  psql_as "$user" -f "$file" >"$OUT" 2>&1 || status=$?
  [[ "$VERBOSE" -eq 1 ]] && sed 's/^/      /' "$OUT"
  local found=0
  while IFS= read -r line; do
    found=$((found + 1))
    case "$line" in
      "PASS | "*) pass "${line#PASS | }" ;;
      "FAIL | "*) fail "${line#FAIL | }" ;;
    esac
  done < <(sed -nE 's/.*NOTICE:  ((PASS|FAIL) \| .*)$/\1/p' "$OUT")
  if [[ "$status" -ne 0 ]]; then
    fail "$(basename "$file"): psql abortou (código $status)"
    grep -E 'ERROR|ERRO|FATAL' "$OUT" | sed 's/^/      /' || tail -n 20 "$OUT" | sed 's/^/      /'
  elif [[ "$found" -eq 0 ]]; then
    fail "$(basename "$file"): nenhum teste executado"
  fi
}

echo
echo "${C_BOLD}Banco${C_RESET}"
run_step "stub do Supabase (papéis, auth, grants, supabase_realtime)" supabase_admin \
  -f "$SCRIPT_DIR/stub_supabase.sql" || exit 1

shopt -s nullglob
MIGRATIONS=("$MIGRATIONS_DIR"/*.sql)
shopt -u nullglob
[[ "${#MIGRATIONS[@]}" -gt 0 ]] || die "nenhuma migration em $MIGRATIONS_DIR"
for migration in "${MIGRATIONS[@]}"; do
  name="$(basename "$migration")"
  # Como no SQL Editor: papel postgres (não superusuário), transação única
  run_step "migration $name (como postgres, transação única)" postgres -1 -f "$migration" || exit 1
done
for migration in "${MIGRATIONS[@]}"; do
  name="$(basename "$migration")"
  run_step "migration $name reaplicada (idempotência)" postgres -1 -f "$migration" || exit 1
done

if [[ "$WITH_SEED" -eq 1 ]]; then
  [[ -f "$SEED_FILE" ]] || die "seed não encontrado: $SEED_FILE"
  echo
  echo "${C_BOLD}Seed${C_RESET}"
  run_step "seed.sql (como postgres)" postgres -f "$SEED_FILE" || exit 1
  if run_step "seed.sql reexecutado (deve ser ignorado)" postgres -f "$SEED_FILE"; then
    if grep -q 'Seed ignorado' "$OUT"; then
      pass "seed.sql reexecutado emitiu NOTICE de guarda"
    else
      fail "seed.sql reexecutado não emitiu o NOTICE 'Seed ignorado'"
    fi
  fi
  run_test_file "$SCRIPT_DIR/seed.test.sql" supabase_admin
fi

echo
echo "${C_BOLD}Regras de negócio, RLS e segurança${C_RESET}"
run_test_file "$SCRIPT_DIR/rules.test.sql" supabase_admin

echo
if [[ "$FAILED" -eq 0 ]]; then
  echo "${C_GREEN}${C_BOLD}OK${C_RESET} — $PASSED verificações passaram"
  exit 0
fi
echo "${C_RED}${C_BOLD}FALHOU${C_RESET} — $FAILED falharam, $PASSED passaram (log do servidor: $PG_LOG)"
[[ "$KEEP" -eq 1 ]] || tail -n 30 "$PG_LOG" 2>/dev/null | sed 's/^/      /' || true
exit 1
