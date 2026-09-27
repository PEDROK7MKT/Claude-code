-- =============================================================================
-- Stub mínimo e fiel do que um projeto Supabase já traz pronto, para aplicar
-- supabase/migrations/0001_schema.sql SEM MODIFICAÇÕES num PostgreSQL puro.
--
-- Deve ser executado pelo superusuário do cluster, que aqui se chama
-- "supabase_admin" como no Supabase (run.sh faz initdb -U supabase_admin).
-- Reproduz (baseado em supabase/postgres e supabase/auth):
--   * papéis postgres (NÃO superusuário, com BYPASSRLS), anon, authenticated,
--     service_role (BYPASSRLS), authenticator, supabase_auth_admin;
--   * schema extensions com pgcrypto / uuid-ossp;
--   * schema auth pertencente ao Supabase (postgres só tem USAGE, não CREATE),
--     auth.users pertencente a supabase_auth_admin, com ALL para postgres
--     (permite FK e CREATE TRIGGER, mas não DROP/ALTER da tabela);
--   * auth.uid() / auth.role() / auth.jwt() / auth.email() lendo
--     current_setting('request.jwt.claims', true), exatamente como o Supabase;
--   * privilégios padrão do schema public (ALTER DEFAULT PRIVILEGES ... GRANT ALL
--     ON TABLES/FUNCTIONS/SEQUENCES TO anon, authenticated, service_role);
--   * publicação supabase_realtime (vazia, pertencente a postgres).
-- =============================================================================

\set ON_ERROR_STOP on

-- -----------------------------------------------------------------------------
-- Papéis
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin LOGIN NOINHERIT CREATEROLE;
  END IF;
END
$$;

-- No Supabase o papel "postgres" (usado pelo SQL Editor e pelas migrations)
-- não é superusuário, mas tem estes atributos.
ALTER ROLE postgres NOSUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
ALTER ROLE service_role BYPASSRLS;

GRANT anon, authenticated, service_role TO authenticator;
GRANT anon, authenticated, service_role TO postgres;

ALTER ROLE postgres SET search_path = "$user", public, extensions;
ALTER ROLE supabase_auth_admin SET search_path = auth;
ALTER ROLE anon SET statement_timeout = '3s';
ALTER ROLE authenticated SET statement_timeout = '8s';

GRANT ALL ON DATABASE postgres TO postgres;

-- -----------------------------------------------------------------------------
-- Schema public + privilégios padrão do Supabase
-- -----------------------------------------------------------------------------
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Objetos criados por postgres (SQL Editor / migrations) ficam acessíveis à API
-- (a proteção real é o RLS). É por isso que a migration precisa de REVOKEs
-- explícitos: REVOKE ... FROM PUBLIC não remove estes GRANTs diretos.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Extensões (no Supabase ficam no schema "extensions")
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- Schema auth (pertence ao Supabase; postgres NÃO pode criar objetos aqui)
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, postgres;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

-- Subconjunto das colunas reais de auth.users (as usadas pelo app/migration + contexto)
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id UUID,
  id UUID PRIMARY KEY,
  aud VARCHAR(255) DEFAULT 'authenticated',
  role VARCHAR(255) DEFAULT 'authenticated',
  email VARCHAR(255),
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  raw_app_meta_data JSONB DEFAULT '{"provider": "email", "providers": ["email"]}'::jsonb,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT,
  banned_until TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE auth.users OWNER TO supabase_auth_admin;
GRANT ALL ON auth.users TO supabase_auth_admin;
-- postgres tem privilégios de DML/REFERENCES/TRIGGER, mas não é dono da tabela
GRANT ALL ON auth.users TO postgres;

-- Funções auxiliares idênticas às do Supabase (supabase/auth migrations)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.email', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
    )::text
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claim', true), ''),
      NULLIF(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;
ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;
ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;
ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.role(), auth.email(), auth.jwt()
  TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- -----------------------------------------------------------------------------
-- Realtime: publicação vazia, pertencente a postgres (como no Supabase)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;
ALTER PUBLICATION supabase_realtime OWNER TO postgres;
