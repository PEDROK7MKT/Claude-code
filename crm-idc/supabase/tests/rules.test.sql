-- =============================================================================
-- Testes das regras de negócio, RLS e segurança do schema (0001_schema.sql).
-- Rodar com supabase/tests/run.sh (aplica stub + migration antes).
--
-- Conectado como supabase_admin (superusuário); cada teste troca de papel como
-- o PostgREST faz: set_config('role', 'authenticated', true) +
-- set_config('request.jwt.claims', '{"sub": ..., "role": ...}', true).
-- Cada teste roda numa transação desfeita no fim (ROLLBACK) e emite
-- "NOTICE: PASS | nome" ou "NOTICE: FAIL | nome → motivo".
-- =============================================================================
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- -----------------------------------------------------------------------------
-- Infra de testes
-- -----------------------------------------------------------------------------
DROP SCHEMA IF EXISTS tests CASCADE;
CREATE SCHEMA tests;
GRANT USAGE ON SCHEMA tests TO PUBLIC;

CREATE FUNCTION tests.uid(p_user TEXT)
RETURNS UUID
LANGUAGE sql IMMUTABLE
AS $$
  SELECT (CASE p_user
    WHEN 'admin'    THEN 'a0000000-0000-4000-8000-000000000001'
    WHEN 'dentist'  THEN 'a0000000-0000-4000-8000-000000000002'
    WHEN 'dentist2' THEN 'a0000000-0000-4000-8000-000000000003'
    WHEN 'inactive' THEN 'a0000000-0000-4000-8000-000000000004'
    WHEN 'admin2'   THEN 'a0000000-0000-4000-8000-000000000005'
  END)::uuid
$$;

-- Usuário logado pela API (PostgREST)
CREATE FUNCTION tests.login(p_user TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF tests.uid(p_user) IS NULL THEN
    RAISE EXCEPTION 'usuário de teste desconhecido: %', p_user;
  END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', tests.uid(p_user), 'role', 'authenticated', 'aud', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('search_path', 'public, extensions', true);
END;
$$;

-- Visitante sem login (anon key)
CREATE FUNCTION tests.login_anon()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('search_path', 'public, extensions', true);
END;
$$;

-- Servidor com a service role key (webhook, admin API)
CREATE FUNCTION tests.login_service()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role": "service_role"}', true);
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('search_path', 'public, extensions', true);
END;
$$;

-- SQL Editor do Supabase
CREATE FUNCTION tests.as_postgres()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('search_path', '"$user", public, extensions', true);
END;
$$;

-- GoTrue (quem insere em auth.users no Supabase)
CREATE FUNCTION tests.as_auth_admin()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('role', 'supabase_auth_admin', true);
  PERFORM set_config('search_path', 'auth', true);
END;
$$;

-- Volta ao superusuário da sessão
CREATE FUNCTION tests.as_superuser()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('role', 'none', true);
  PERFORM set_config('search_path', 'public, extensions', true);
END;
$$;

CREATE FUNCTION tests.ok(p_cond BOOLEAN, p_msg TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION '%', p_msg;
  END IF;
END;
$$;

CREATE FUNCTION tests.eq(p_got ANYCOMPATIBLE, p_want ANYCOMPATIBLE, p_msg TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_got IS DISTINCT FROM p_want THEN
    RAISE EXCEPTION '% (esperado: %, obtido: %)', p_msg, COALESCE(p_want::text, 'NULL'), COALESCE(p_got::text, 'NULL');
  END IF;
END;
$$;

-- Executa SQL (como o papel atual) e exige erro; p_state opcional. Devolve a mensagem.
CREATE FUNCTION tests.throws(p_sql TEXT, p_state TEXT, p_msg TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_state TEXT;
  v_err TEXT;
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    v_state := SQLSTATE;
    v_err := SQLERRM;
  END;
  IF v_state IS NULL THEN
    RAISE EXCEPTION '% — esperava erro %, mas executou sem erro', p_msg, COALESCE(p_state, '');
  END IF;
  IF p_state IS NOT NULL AND v_state <> p_state THEN
    RAISE EXCEPTION '% — esperava erro %, obtido % (%)', p_msg, p_state, v_state, v_err;
  END IF;
  RETURN v_err;
END;
$$;

-- Executa DML (como o papel atual) e devolve o número de linhas afetadas
CREATE FUNCTION tests.exec(p_sql TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_rows BIGINT;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

-- Leitura "por fora" do RLS (para conferir o estado real)
CREATE FUNCTION tests.lead(p_id UUID)
RETURNS public.leads
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT * FROM public.leads WHERE id = p_id $$;

CREATE FUNCTION tests.history(p_id UUID)
RETURNS SETOF public.lead_history
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT * FROM public.lead_history WHERE lead_id = p_id ORDER BY created_at, id $$;

CREATE FUNCTION tests.history_count(p_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT COUNT(*)::INT FROM public.lead_history WHERE lead_id = p_id $$;

-- Linha do histórico da transição (old → new). Dentro de uma transação todas as
-- linhas têm o mesmo created_at (now()); use p_old_status quando new_status se repete.
CREATE FUNCTION tests.last_history(p_id UUID, p_new_status TEXT, p_old_status TEXT DEFAULT NULL)
RETURNS public.lead_history
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lead_history;
  v_n INT;
BEGIN
  SELECT COUNT(*) INTO v_n FROM public.lead_history
  WHERE lead_id = p_id AND new_status = p_new_status AND (p_old_status IS NULL OR old_status = p_old_status);
  IF v_n > 1 THEN
    RAISE EXCEPTION 'tests.last_history ambíguo: % linhas para % (informe p_old_status)', v_n, p_new_status;
  END IF;
  SELECT * INTO v_row FROM public.lead_history
  WHERE lead_id = p_id AND new_status = p_new_status AND (p_old_status IS NULL OR old_status = p_old_status);
  RETURN v_row;
END;
$$;

CREATE FUNCTION tests.profile(p_id UUID)
RETURNS public.profiles
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT * FROM public.profiles WHERE id = p_id $$;

-- "total/agendados" da linha de daily_metrics (NULL se não existir)
CREATE FUNCTION tests.dm(p_date DATE, p_campaign TEXT)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT leads_total || '/' || leads_agendados FROM public.daily_metrics
  WHERE date = p_date AND lower(btrim(campaign)) = lower(btrim(p_campaign))
$$;

-- Cria lead (como o papel atual)
CREATE FUNCTION tests.new_lead(
  p_source TEXT DEFAULT 'indicacao',
  p_campaign TEXT DEFAULT NULL,
  p_created_at TIMESTAMPTZ DEFAULT NULL,
  p_name TEXT DEFAULT 'Paciente Teste'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.leads (name, phone, source, campaign, created_at)
  VALUES (p_name, '77999990000', p_source, p_campaign, COALESCE(p_created_at, now()))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Muda status por UPDATE direto (como o papel atual); agendado ganha data
CREATE FUNCTION tests.move(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE public.leads
  SET status = p_status,
      scheduled_at = CASE WHEN p_status = 'agendado' THEN now() + interval '3 days' ELSE scheduled_at END
  WHERE id = p_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'tests.move: lead % não atualizado (% linhas)', p_id, v_rows;
  END IF;
END;
$$;

-- Caminho válido (regra 2) de "novo" até cada status
CREATE FUNCTION tests.path_to(p_status TEXT)
RETURNS TEXT[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'novo'           THEN ARRAY[]::TEXT[]
    WHEN 'em_contato'     THEN ARRAY['em_contato']
    WHEN 'agendado'       THEN ARRAY['em_contato', 'agendado']
    WHEN 'confirmado'     THEN ARRAY['em_contato', 'agendado', 'confirmado']
    WHEN 'compareceu'     THEN ARRAY['em_contato', 'agendado', 'confirmado', 'compareceu']
    WHEN 'nao_compareceu' THEN ARRAY['em_contato', 'agendado', 'confirmado', 'nao_compareceu']
    WHEN 'cancelado'      THEN ARRAY['em_contato', 'cancelado']
    WHEN 'perdido'        THEN ARRAY['perdido']
  END
$$;

CREATE FUNCTION tests.lead_in(
  p_status TEXT,
  p_source TEXT DEFAULT 'indicacao',
  p_campaign TEXT DEFAULT NULL,
  p_created_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID := tests.new_lead(p_source, p_campaign, p_created_at);
  v_step TEXT;
BEGIN
  FOREACH v_step IN ARRAY tests.path_to(p_status) LOOP
    PERFORM tests.move(v_id, v_step);
  END LOOP;
  RETURN v_id;
END;
$$;

-- Regra 2 conforme SPEC §10 (independente da função do banco)
CREATE TABLE tests.spec_transitions (from_status TEXT, to_status TEXT, PRIMARY KEY (from_status, to_status));
INSERT INTO tests.spec_transitions VALUES
  ('novo', 'em_contato'), ('novo', 'perdido'),
  ('em_contato', 'agendado'), ('em_contato', 'perdido'), ('em_contato', 'cancelado'),
  ('agendado', 'confirmado'), ('agendado', 'cancelado'), ('agendado', 'perdido'),
  ('confirmado', 'compareceu'), ('confirmado', 'nao_compareceu'), ('confirmado', 'cancelado'),
  ('nao_compareceu', 'agendado'),
  ('cancelado', 'agendado'),
  ('perdido', 'em_contato');
CREATE TABLE tests.statuses (status TEXT PRIMARY KEY);
INSERT INTO tests.statuses VALUES
  ('novo'), ('em_contato'), ('agendado'), ('confirmado'),
  ('compareceu'), ('nao_compareceu'), ('cancelado'), ('perdido');
GRANT SELECT ON ALL TABLES IN SCHEMA tests TO PUBLIC;

-- -----------------------------------------------------------------------------
-- Fixtures (confirmadas): usuários criados como o GoTrue faria
-- -----------------------------------------------------------------------------
BEGIN;
DO $$
BEGIN
  PERFORM tests.as_auth_admin();
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    (tests.uid('admin'),    'gestor@idc.test',   '{"full_name": "Gestor de Tráfego", "role": "admin"}'),
    (tests.uid('dentist'),  'decio@idc.test',    '{"full_name": "Dr. Décio Carrilho", "role": "dentist"}'),
    (tests.uid('dentist2'), 'recepcao@idc.test', '{"full_name": "Recepção IDC", "role": "dentist"}'),
    (tests.uid('inactive'), 'antigo@idc.test',   '{"full_name": "Ex-colaborador", "role": "dentist"}'),
    (tests.uid('admin2'),   'socio@idc.test',    '{"full_name": "Sócio Administrador", "role": "admin"}');
  -- desativar é feito pelo servidor (service role) em Configurações
  PERFORM tests.login_service();
  UPDATE public.profiles SET active = FALSE WHERE id = tests.uid('inactive');
  PERFORM tests.as_superuser();
END
$$;
COMMIT;

-- =============================================================================
-- handle_new_user
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'handle_new_user: fixtures criadas pelo papel do GoTrue (search_path=auth)';
BEGIN
  BEGIN
    PERFORM tests.eq((tests.profile(tests.uid('admin'))).role, 'admin', 'role do admin');
    PERFORM tests.eq((tests.profile(tests.uid('dentist'))).role, 'dentist', 'role do dentista');
    PERFORM tests.eq((tests.profile(tests.uid('dentist'))).full_name, 'Dr. Décio Carrilho', 'nome do dentista');
    PERFORM tests.eq((tests.profile(tests.uid('inactive'))).active, FALSE, 'usuário desativado');
    PERFORM tests.eq((tests.profile(tests.uid('admin'))).active, TRUE, 'novo usuário nasce ativo');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'handle_new_user: cria profile com role e nome do metadata e grava o email';
  v_id CONSTANT UUID := 'b0000000-0000-4000-8000-000000000001';
  p public.profiles;
BEGIN
  BEGIN
    PERFORM tests.as_auth_admin();
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (v_id, 'nova.gestora@idc.test', '{"full_name": "  Nova Gestora  ", "role": "admin"}');
    p := tests.profile(v_id);
    PERFORM tests.ok(p.id IS NOT NULL, 'profile não foi criado');
    PERFORM tests.eq(p.role, 'admin', 'role');
    PERFORM tests.eq(p.full_name, 'Nova Gestora', 'full_name (aparado)');
    PERFORM tests.eq(p.email, 'nova.gestora@idc.test', 'email');
    PERFORM tests.eq(p.active, TRUE, 'active');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'handle_new_user: role inválido/ausente vira dentist; sem nome usa o email';
BEGIN
  BEGIN
    PERFORM tests.as_auth_admin();
    INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
      ('b0000000-0000-4000-8000-000000000011', 'hacker@idc.test', '{"full_name": "Hacker", "role": "superadmin"}'),
      ('b0000000-0000-4000-8000-000000000012', 'semmeta@idc.test', '{}'),
      ('b0000000-0000-4000-8000-000000000013', 'nulo@idc.test', NULL),
      ('b0000000-0000-4000-8000-000000000014', 'branco@idc.test', '{"full_name": "   ", "role": ""}');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000011')).role, 'dentist', 'role inválido');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000012')).role, 'dentist', 'sem role');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000012')).full_name, 'semmeta@idc.test', 'nome = email');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000013')).role, 'dentist', 'metadata NULL');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000014')).full_name, 'branco@idc.test', 'nome em branco = email');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000014')).role, 'dentist', 'role vazio');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'handle_new_user: app_metadata.role (service role) tem precedência sobre user_metadata';
BEGIN
  BEGIN
    PERFORM tests.as_auth_admin();
    INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data) VALUES
      ('b0000000-0000-4000-8000-000000000021', 'a@idc.test',
       '{"provider": "email", "providers": ["email"], "role": "admin"}', '{"full_name": "A", "role": "dentist"}'),
      ('b0000000-0000-4000-8000-000000000022', 'b@idc.test',
       '{"provider": "email", "providers": ["email"], "role": "dentist"}', '{"full_name": "B", "role": "admin"}');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000021')).role, 'admin', 'app_metadata admin');
    PERFORM tests.eq((tests.profile('b0000000-0000-4000-8000-000000000022')).role, 'dentist', 'app_metadata dentist');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- Regra 1 — todo lead começa como "novo"
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 1: criar lead com status diferente de "novo" falha (app, webhook e SQL Editor)';
  v_status TEXT;
  v_who TEXT;
BEGIN
  BEGIN
    FOREACH v_who IN ARRAY ARRAY['dentist', 'admin', 'service', 'postgres'] LOOP
      CASE v_who
        WHEN 'service' THEN PERFORM tests.login_service();
        WHEN 'postgres' THEN PERFORM tests.as_postgres();
        ELSE PERFORM tests.login(v_who);
      END CASE;
      FOR v_status IN SELECT status FROM tests.statuses WHERE status <> 'novo' LOOP
        PERFORM tests.throws(
          format($$INSERT INTO public.leads (name, phone, source, status) VALUES ('X', '77999990000', 'gmn', %L)$$, v_status),
          '23514', format('%s criando lead em %s', v_who, v_status));
      END LOOP;
    END LOOP;
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 1: status padrão "novo", histórico "Lead cadastrado" e autoria = usuário logado';
  v_id UUID;
  h public.lead_history;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    -- tenta se passar pelo admin: created_by é forçado para auth.uid()
    INSERT INTO public.leads (name, phone, source, created_by)
    VALUES ('Maria Souza', '77988887777', 'gmn', tests.uid('admin'))
    RETURNING id INTO v_id;
    PERFORM tests.eq((tests.lead(v_id)).status, 'novo', 'status padrão');
    PERFORM tests.eq((tests.lead(v_id)).created_by, tests.uid('dentist'), 'created_by');
    PERFORM tests.eq(tests.history_count(v_id), 1, 'linhas de histórico');
    SELECT * INTO h FROM tests.history(v_id);
    PERFORM tests.eq(h.old_status, NULL::TEXT, 'old_status');
    PERFORM tests.eq(h.new_status, 'novo', 'new_status');
    PERFORM tests.eq(h.note, 'Lead cadastrado', 'nota');
    PERFORM tests.eq(h.changed_by, tests.uid('dentist'), 'changed_by');
    -- autoria não muda depois
    UPDATE public.leads SET created_by = tests.uid('admin'), notes = 'x' WHERE id = v_id;
    PERFORM tests.eq((tests.lead(v_id)).created_by, tests.uid('dentist'), 'created_by imutável');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 1: datas do funil enviadas no cadastro são ignoradas';
  v_id UUID;
  l public.leads;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    INSERT INTO public.leads (name, phone, source, contacted_at, scheduled_at, confirmed_at, attended_at)
    VALUES ('João Lima', '77988886666', 'instagram', now(), now() + interval '1 day', now(), now())
    RETURNING id INTO v_id;
    l := tests.lead(v_id);
    PERFORM tests.ok(l.contacted_at IS NULL AND l.scheduled_at IS NULL
      AND l.confirmed_at IS NULL AND l.attended_at IS NULL, 'datas deveriam ser NULL');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Webhook (service role): cria lead ignorando RLS; histórico sem autor ou com created_by informado';
  v_id UUID;
  v_id2 UUID;
BEGIN
  BEGIN
    PERFORM tests.login_service();
    INSERT INTO public.leads (name, phone, source, campaign, keyword, landing_page)
    VALUES ('Ana Paula', '77999881234', 'google_ads', 'IDC | Urgência e Canal', 'dentista barreiras', '/urgencia')
    RETURNING id INTO v_id;
    PERFORM tests.eq((tests.lead(v_id)).created_by, NULL::UUID, 'created_by');
    PERFORM tests.eq((SELECT changed_by FROM tests.history(v_id)), NULL::UUID, 'changed_by');
    INSERT INTO public.leads (name, phone, source, created_by)
    VALUES ('Carlos', '77999881235', 'gmn', tests.uid('admin'))
    RETURNING id INTO v_id2;
    PERFORM tests.eq((tests.lead(v_id2)).created_by, tests.uid('admin'), 'created_by informado pelo servidor');
    PERFORM tests.eq((SELECT changed_by FROM tests.history(v_id2)), tests.uid('admin'), 'changed_by = created_by');
    PERFORM tests.ok((SELECT COUNT(*) FROM public.leads WHERE id IN (v_id, v_id2)) = 2, 'service role lê os leads');
    PERFORM tests.throws(format($$UPDATE public.leads SET status = 'compareceu' WHERE id = %L$$, v_id),
      '23514', 'service role também respeita a regra 2');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- Regra 2 — fluxo de status
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 2: as 14 transições permitidas funcionam e geram histórico';
  r RECORD;
  v_id UUID;
  v_n INT := 0;
  h public.lead_history;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    FOR r IN SELECT * FROM tests.spec_transitions ORDER BY 1, 2 LOOP
      v_id := tests.lead_in(r.from_status);
      PERFORM tests.eq((tests.lead(v_id)).status, r.from_status, 'preparação');
      UPDATE public.leads
      SET status = r.to_status,
          scheduled_at = CASE WHEN r.to_status = 'agendado' THEN now() + interval '5 days' ELSE scheduled_at END
      WHERE id = v_id;
      PERFORM tests.eq((tests.lead(v_id)).status, r.to_status, format('%s → %s', r.from_status, r.to_status));
      h := tests.last_history(v_id, r.to_status, r.from_status);
      PERFORM tests.ok(h.id IS NOT NULL, format('histórico %s → %s', r.from_status, r.to_status));
      PERFORM tests.eq(h.changed_by, tests.uid('dentist'), 'changed_by');
      v_n := v_n + 1;
    END LOOP;
    PERFORM tests.eq(v_n, 14, 'transições testadas');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 2: as 42 transições proibidas falham (novo→agendado, compareceu→*, agendado→compareceu, perdido→agendado...)';
  r RECORD;
  v_id UUID;
  v_n INT := 0;
  v_hist INT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    FOR r IN
      SELECT a.status AS from_status, b.status AS to_status
      FROM tests.statuses a CROSS JOIN tests.statuses b
      WHERE a.status <> b.status
        AND NOT EXISTS (SELECT 1 FROM tests.spec_transitions s WHERE s.from_status = a.status AND s.to_status = b.status)
      ORDER BY 1, 2
    LOOP
      v_id := tests.lead_in(r.from_status);
      v_hist := tests.history_count(v_id);
      -- agendado recebe data para garantir que o erro é a transição (regra 2), não a regra 3
      PERFORM tests.throws(format(
        $$UPDATE public.leads SET status = %L,
            scheduled_at = CASE WHEN %L = 'agendado' THEN now() + interval '5 days' ELSE scheduled_at END
          WHERE id = %L$$, r.to_status, r.to_status, v_id),
        '23514', format('%s → %s deveria falhar', r.from_status, r.to_status));
      PERFORM tests.eq((tests.lead(v_id)).status, r.from_status, 'status inalterado');
      PERFORM tests.eq(tests.history_count(v_id), v_hist, 'histórico inalterado');
      v_n := v_n + 1;
    END LOOP;
    PERFORM tests.eq(v_n, 42, 'transições proibidas testadas');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 2: lead_status_transition_allowed() espelha a especificação (64 pares)';
  v_bad TEXT;
BEGIN
  BEGIN
    SELECT string_agg(a.status || '→' || b.status, ', ') INTO v_bad
    FROM tests.statuses a CROSS JOIN tests.statuses b
    WHERE public.lead_status_transition_allowed(a.status, b.status)
      IS DISTINCT FROM EXISTS (SELECT 1 FROM tests.spec_transitions s WHERE s.from_status = a.status AND s.to_status = b.status);
    PERFORM tests.ok(v_bad IS NULL, 'divergências: ' || COALESCE(v_bad, ''));
    PERFORM tests.eq(public.lead_status_transition_allowed('xyz', 'novo'), FALSE, 'status desconhecido');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 2: editar outros campos (status igual) não gera histórico';
  v_id UUID;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('em_contato');
    PERFORM tests.eq(tests.history_count(v_id), 2, 'histórico inicial');
    UPDATE public.leads SET status = 'em_contato', notes = 'Prefere manhã', service = 'implante' WHERE id = v_id;
    PERFORM tests.eq(tests.history_count(v_id), 2, 'histórico após edição');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 2 via RPC: transição proibida e status inválido são rejeitados';
  v_id UUID;
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    v_err := tests.throws(format($$SELECT public.change_lead_status(%L, 'compareceu')$$, v_id), '23514', 'novo → compareceu');
    PERFORM tests.ok(v_err LIKE 'Transição de status não permitida%', 'mensagem: ' || v_err);
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'inexistente')$$, v_id), '23514', 'status inválido');
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, NULL)$$, v_id), NULL, 'status nulo');
    PERFORM tests.eq((tests.lead(v_id)).status, 'novo', 'status inalterado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- Regra 3 — agendar exige data; datas automáticas do funil
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 3: agendar sem scheduled_at falha (UPDATE direto e RPC)';
  v_id UUID;
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('em_contato');
    v_err := tests.throws(format($$UPDATE public.leads SET status = 'agendado' WHERE id = %L$$, v_id),
      '23502', 'UPDATE sem data');
    PERFORM tests.ok(v_err LIKE 'Informe a data e hora da consulta%', 'mensagem: ' || v_err);
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'agendado')$$, v_id), '23502', 'RPC sem data');
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'agendado', NULL, 'nota')$$, v_id), '23502', 'RPC com data NULL');
    PERFORM tests.eq((tests.lead(v_id)).status, 'em_contato', 'status inalterado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 3: RPC com p_scheduled_at agenda e devolve o lead; remarcar (agendado→agendado) só troca a data';
  v_id UUID;
  v_when CONSTANT TIMESTAMPTZ := date_trunc('hour', now()) + interval '2 days 3 hours';
  l public.leads;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('em_contato');
    l := public.change_lead_status(v_id, 'agendado', v_when, 'Avaliação de implante');
    PERFORM tests.eq(l.id, v_id, 'RPC devolve o lead');
    PERFORM tests.eq(l.status, 'agendado', 'status devolvido');
    PERFORM tests.eq(l.scheduled_at, v_when, 'scheduled_at devolvido');
    PERFORM tests.eq((tests.lead(v_id)).scheduled_at, v_when, 'scheduled_at gravado');
    PERFORM tests.eq(tests.history_count(v_id), 3, 'histórico');
    l := public.change_lead_status(v_id, 'agendado', v_when + interval '1 day');
    PERFORM tests.eq((tests.lead(v_id)).scheduled_at, v_when + interval '1 day', 'data remarcada');
    PERFORM tests.eq(tests.history_count(v_id), 3, 'remarcar sem mudar status não gera histórico');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 3: reagendar pela RPC exige nova data (não reaproveita a do agendamento cancelado)';
  v_id UUID;
  v_old TIMESTAMPTZ;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('agendado');
    v_old := (tests.lead(v_id)).scheduled_at;
    PERFORM tests.move(v_id, 'cancelado');
    PERFORM tests.eq((tests.lead(v_id)).scheduled_at, v_old, 'data antiga continua no lead cancelado');
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'agendado')$$, v_id), '23502', 'reagendar sem data');
    PERFORM public.change_lead_status(v_id, 'agendado', v_old + interval '7 days');
    PERFORM tests.eq((tests.lead(v_id)).scheduled_at, v_old + interval '7 days', 'nova data');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 3: lead agendado/confirmado não pode ficar sem data';
  v_id UUID;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('agendado');
    PERFORM tests.throws(format($$UPDATE public.leads SET scheduled_at = NULL WHERE id = %L$$, v_id), '23502', 'limpar data');
    PERFORM tests.ok((tests.lead(v_id)).scheduled_at IS NOT NULL, 'data preservada');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 3: contacted_at, confirmed_at e attended_at preenchidos automaticamente (ou mantidos se enviados)';
  v_id UUID;
  v_id2 UUID;
  l public.leads;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM public.change_lead_status(v_id, 'em_contato');
    PERFORM tests.eq((tests.lead(v_id)).contacted_at, now(), 'contacted_at');
    PERFORM public.change_lead_status(v_id, 'agendado', now() + interval '1 day');
    l := tests.lead(v_id);
    PERFORM tests.eq(l.contacted_at, now(), 'contacted_at mantido ao agendar');
    PERFORM tests.ok(l.confirmed_at IS NULL AND l.attended_at IS NULL, 'agendado sem confirmação/comparecimento');
    PERFORM public.change_lead_status(v_id, 'confirmado');
    PERFORM tests.eq((tests.lead(v_id)).confirmed_at, now(), 'confirmed_at');
    PERFORM public.change_lead_status(v_id, 'compareceu');
    l := tests.lead(v_id);
    PERFORM tests.eq(l.attended_at, now(), 'attended_at');
    PERFORM tests.eq(l.confirmed_at, now(), 'confirmed_at mantido');
    -- valores explícitos (ex.: lançamento retroativo) são respeitados
    v_id2 := tests.new_lead();
    UPDATE public.leads SET status = 'em_contato', contacted_at = '2026-01-05 12:00+00' WHERE id = v_id2;
    PERFORM tests.eq((tests.lead(v_id2)).contacted_at, '2026-01-05 12:00+00'::timestamptz, 'contacted_at explícito');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 3: reagendar (não compareceu/cancelado → agendado) zera confirmed_at e attended_at';
  v_id UUID;
  l public.leads;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('nao_compareceu');
    PERFORM tests.ok((tests.lead(v_id)).confirmed_at IS NOT NULL, 'confirmado antes de faltar');
    PERFORM public.change_lead_status(v_id, 'agendado', now() + interval '10 days', 'Reagendado');
    l := tests.lead(v_id);
    PERFORM tests.ok(l.confirmed_at IS NULL AND l.attended_at IS NULL, 'datas zeradas após nao_compareceu → agendado');
    PERFORM tests.ok(l.contacted_at IS NOT NULL, 'contacted_at mantido');
    -- confirmado → cancelado → agendado
    PERFORM public.change_lead_status(v_id, 'confirmado');
    PERFORM public.change_lead_status(v_id, 'cancelado');
    PERFORM tests.ok((tests.lead(v_id)).confirmed_at IS NOT NULL, 'confirmado antes de cancelar');
    PERFORM public.change_lead_status(v_id, 'agendado', now() + interval '12 days');
    l := tests.lead(v_id);
    PERFORM tests.ok(l.confirmed_at IS NULL AND l.attended_at IS NULL, 'datas zeradas após cancelado → agendado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- RPC change_lead_status
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'change_lead_status: grava a nota (aparada) e changed_by = auth.uid()';
  v_id UUID;
  h public.lead_history;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM tests.login('admin');
    PERFORM public.change_lead_status(v_id, 'em_contato', NULL, '  Respondeu no WhatsApp  ');
    h := tests.last_history(v_id, 'em_contato');
    PERFORM tests.eq(h.note, 'Respondeu no WhatsApp', 'nota');
    PERFORM tests.eq(h.changed_by, tests.uid('admin'), 'changed_by');
    PERFORM tests.eq(h.old_status, 'novo', 'old_status');
    PERFORM public.change_lead_status(v_id, 'perdido', NULL, '   ');
    PERFORM tests.eq((tests.last_history(v_id, 'perdido')).note, NULL::TEXT, 'nota em branco vira NULL');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'change_lead_status: nota não vaza para UPDATE/INSERT seguintes na mesma transação';
  v_id UUID;
  v_id2 UUID;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM public.change_lead_status(v_id, 'em_contato', NULL, 'Nota da RPC');
    PERFORM tests.eq((tests.last_history(v_id, 'em_contato')).note, 'Nota da RPC', 'nota da RPC');
    UPDATE public.leads SET status = 'perdido' WHERE id = v_id;
    PERFORM tests.eq((tests.last_history(v_id, 'perdido')).note, NULL::TEXT, 'UPDATE direto sem nota');
    v_id2 := tests.new_lead();
    PERFORM tests.eq((tests.last_history(v_id2, 'novo')).note, 'Lead cadastrado', 'INSERT seguinte');
    -- mesmo se a RPC falhar no meio (erro capturado), a nota não fica pendurada
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'compareceu', NULL, 'Nota órfã')$$, v_id2), '23514', 'RPC inválida');
    UPDATE public.leads SET status = 'em_contato' WHERE id = v_id2;
    PERFORM tests.eq((tests.last_history(v_id2, 'em_contato')).note, NULL::TEXT, 'após RPC com erro');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- Nota não vaza entre transações da mesma sessão (parte 1 confirma, parte 2 confere)
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'change_lead_status: nota não vaza para a próxima transação da sessão';
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    INSERT INTO public.leads (id, name, phone, source)
    VALUES ('c0000000-0000-4000-8000-000000000001', 'Sessão Compartilhada', '77999990001', 'gmn');
    PERFORM public.change_lead_status('c0000000-0000-4000-8000-000000000001', 'em_contato', NULL, 'Nota da transação 1');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % (preparação) → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
COMMIT;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'change_lead_status: nota não vaza para a próxima transação da sessão';
  v_id CONSTANT UUID := 'c0000000-0000-4000-8000-000000000001';
BEGIN
  BEGIN
    PERFORM tests.eq((tests.last_history(v_id, 'em_contato')).note, 'Nota da transação 1', 'nota confirmada');
    PERFORM tests.login('dentist');
    UPDATE public.leads SET status = 'perdido' WHERE id = v_id;
    PERFORM tests.eq((tests.last_history(v_id, 'perdido')).note, NULL::TEXT, 'UPDATE na transação seguinte');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'change_lead_status: lead inexistente gera erro "Lead não encontrado"';
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_err := tests.throws($$SELECT public.change_lead_status(gen_random_uuid(), 'em_contato')$$, 'P0002', 'id inexistente');
    PERFORM tests.eq(v_err, 'Lead não encontrado', 'mensagem');
    PERFORM tests.login_service();
    PERFORM tests.throws($$SELECT public.change_lead_status(gen_random_uuid(), 'em_contato')$$, 'P0002', 'service role');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'change_lead_status: usuário inativo e anon não alteram o lead';
  v_id UUID;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM tests.login('inactive');
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'em_contato')$$, v_id), 'P0002', 'inativo');
    PERFORM tests.login_anon();
    PERFORM tests.throws(format($$SELECT public.change_lead_status(%L, 'em_contato')$$, v_id), '42501', 'anon');
    PERFORM tests.eq((tests.lead(v_id)).status, 'novo', 'status inalterado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- Regra 5 — leads nunca são excluídos
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 5: DELETE de lead falha para dentista e admin (authenticated)';
  v_id UUID;
  v_who TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('perdido');
    FOREACH v_who IN ARRAY ARRAY['dentist', 'admin'] LOOP
      PERFORM tests.login(v_who);
      PERFORM tests.throws(format('DELETE FROM public.leads WHERE id = %L', v_id), '42501', v_who);
      PERFORM tests.throws('DELETE FROM public.leads', '42501', v_who || ' (sem WHERE)');
    END LOOP;
    PERFORM tests.ok((tests.lead(v_id)).id IS NOT NULL, 'lead continua existindo');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 5: DELETE falha também para service_role, postgres e superusuário';
  v_id UUID;
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM tests.login_service();
    v_err := tests.throws(format('DELETE FROM public.leads WHERE id = %L', v_id), '42501', 'service_role');
    PERFORM tests.ok(v_err LIKE 'Leads não podem ser excluídos%', 'mensagem: ' || v_err);
    PERFORM tests.as_postgres();
    PERFORM tests.throws(format('DELETE FROM public.leads WHERE id = %L', v_id), '42501', 'postgres');
    PERFORM tests.as_superuser();
    PERFORM tests.throws(format('DELETE FROM public.leads WHERE id = %L', v_id), '42501', 'superusuário');
    PERFORM tests.ok((tests.lead(v_id)).id IS NOT NULL, 'lead continua existindo');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Regra 5: TRUNCATE de leads falha (API, postgres, superusuário e TRUNCATE ... CASCADE)';
  v_id UUID;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM tests.throws('TRUNCATE public.leads', '42501', 'authenticated');
    PERFORM tests.login_service();
    PERFORM tests.throws('TRUNCATE public.leads', '42501', 'service_role');
    PERFORM tests.as_postgres();
    PERFORM tests.throws('TRUNCATE public.leads CASCADE', '42501', 'postgres');
    PERFORM tests.as_superuser();
    -- (TRUNCATE public.leads sozinho já falha pela FK de lead_history; estas formas passariam)
    PERFORM tests.throws('TRUNCATE public.leads, public.lead_history', '42501', 'superusuário');
    PERFORM tests.throws('TRUNCATE public.leads CASCADE', '42501', 'superusuário com CASCADE');
    PERFORM tests.throws('TRUNCATE public.profiles CASCADE', '42501', 'superusuário via CASCADE de profiles');
    PERFORM tests.ok((tests.lead(v_id)).id IS NOT NULL, 'lead continua existindo');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- RLS — leads, métricas, configurações
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: dentista vê, cria e edita leads (inclusive os criados por outros)';
  v_admin_lead UUID;
  v_id UUID;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    v_admin_lead := tests.new_lead('gmn');
    PERFORM tests.login('dentist');
    v_id := tests.new_lead('indicacao');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.leads WHERE id IN (v_admin_lead, v_id))::INT, 2, 'leads visíveis');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.leads SET notes = 'Ligar à tarde', service = 'canal' WHERE id = %L$$, v_admin_lead)), 1::BIGINT, 'editar lead do admin');
    PERFORM tests.eq((tests.lead(v_admin_lead)).notes, 'Ligar à tarde', 'nota gravada');
    PERFORM tests.ok((SELECT COUNT(*) FROM public.lead_history WHERE lead_id = v_admin_lead) = 1, 'histórico visível');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: dentista lê mas não insere/edita/exclui daily_metrics';
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    INSERT INTO public.daily_metrics (date, campaign, impressions, clicks, cost, conversions)
    VALUES ('2021-05-10', 'IDC | Implante Dentário', 400, 20, 55.90, 3);
    PERFORM tests.login('dentist');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.daily_metrics WHERE date = '2021-05-10')::INT, 1, 'leitura');
    v_err := tests.throws($$INSERT INTO public.daily_metrics (date, campaign, cost) VALUES ('2021-05-11', 'X', 10)$$, '42501', 'insert');
    PERFORM tests.ok(v_err LIKE '%row-level security%', 'insert barrado pelo RLS: ' || v_err);
    PERFORM tests.eq(tests.exec($$UPDATE public.daily_metrics SET cost = 0 WHERE date = '2021-05-10'$$), 0::BIGINT, 'update');
    PERFORM tests.eq(tests.exec($$DELETE FROM public.daily_metrics WHERE date = '2021-05-10'$$), 0::BIGINT, 'delete');
    PERFORM tests.as_superuser();
    PERFORM tests.eq((SELECT cost FROM public.daily_metrics WHERE date = '2021-05-10'), 55.90, 'custo inalterado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: dentista lê mas não insere/edita/exclui gmn_metrics';
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    INSERT INTO public.gmn_metrics (period_start, period_end, search_views, total_reviews, average_rating)
    VALUES ('2021-04-01', '2021-04-30', 2100, 160, 4.9);
    PERFORM tests.login('dentist');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.gmn_metrics WHERE period_start = '2021-04-01')::INT, 1, 'leitura');
    PERFORM tests.throws($$INSERT INTO public.gmn_metrics (period_start, period_end) VALUES ('2021-05-01', '2021-05-31')$$, '42501', 'insert');
    PERFORM tests.eq(tests.exec($$UPDATE public.gmn_metrics SET total_reviews = 999$$), 0::BIGINT, 'update');
    PERFORM tests.eq(tests.exec($$DELETE FROM public.gmn_metrics$$), 0::BIGINT, 'delete');
    PERFORM tests.as_superuser();
    PERFORM tests.eq((SELECT total_reviews FROM public.gmn_metrics WHERE period_start = '2021-04-01'), 160, 'reviews inalterados');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: dentista lê mas não altera app_settings';
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    PERFORM tests.eq((SELECT crm_name FROM public.app_settings), 'IDC CRM', 'leitura');
    PERFORM tests.eq(tests.exec($$UPDATE public.app_settings SET crm_name = 'Hackeado'$$), 0::BIGINT, 'update');
    PERFORM tests.throws($$INSERT INTO public.app_settings (id) VALUES (1)$$, '42501', 'insert');
    PERFORM tests.throws($$DELETE FROM public.app_settings$$, '42501', 'delete');
    PERFORM tests.eq((SELECT crm_name FROM public.app_settings), 'IDC CRM', 'nome inalterado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: admin insere/edita/exclui daily_metrics e gmn_metrics e edita app_settings';
  v_dm UUID;
  v_gmn UUID;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    INSERT INTO public.daily_metrics (date, campaign, impressions, clicks, cost, conversions, created_by)
    VALUES ('2021-06-01', 'IDC | Urgência e Canal', 500, 30, 62.40, 4, tests.uid('admin'))
    RETURNING id INTO v_dm;
    PERFORM tests.eq(tests.exec(format('UPDATE public.daily_metrics SET cost = 70 WHERE id = %L', v_dm)), 1::BIGINT, 'update métricas');
    PERFORM tests.eq(tests.exec(format('DELETE FROM public.daily_metrics WHERE id = %L', v_dm)), 1::BIGINT, 'delete métricas');
    INSERT INTO public.gmn_metrics (period_start, period_end, total_reviews, average_rating, new_reviews)
    VALUES ('2021-06-01', '2021-06-30', 170, 4.9, 6)
    RETURNING id INTO v_gmn;
    PERFORM tests.eq(tests.exec(format('UPDATE public.gmn_metrics SET new_reviews = 7 WHERE id = %L', v_gmn)), 1::BIGINT, 'update GMN');
    PERFORM tests.eq(tests.exec(format('DELETE FROM public.gmn_metrics WHERE id = %L', v_gmn)), 1::BIGINT, 'delete GMN');
    PERFORM tests.eq(tests.exec($$UPDATE public.app_settings SET crm_name = 'Painel IDC', primary_color = '#0A5C5C'$$), 1::BIGINT, 'update configurações');
    PERFORM tests.throws($$UPDATE public.app_settings SET primary_color = 'teal'$$, '23514', 'cor inválida');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- RLS — profiles (papel e desativação)
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: dentista não altera o próprio role/active nem o profile de outros; edita o próprio nome';
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_err := tests.throws(format($$UPDATE public.profiles SET role = 'admin' WHERE id = %L$$, tests.uid('dentist')), '42501', 'promover a si mesmo');
    PERFORM tests.ok(v_err LIKE 'Apenas administradores%', 'mensagem: ' || v_err);
    PERFORM tests.throws(format($$UPDATE public.profiles SET active = FALSE WHERE id = %L$$, tests.uid('dentist')), '42501', 'desativar a si mesmo');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET role = 'admin' WHERE id = %L$$, tests.uid('dentist2'))), 0::BIGINT, 'promover outro');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET full_name = 'X' WHERE id = %L$$, tests.uid('admin'))), 0::BIGINT, 'editar nome de outro');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET full_name = 'Dr. Décio' WHERE id = %L$$, tests.uid('dentist'))), 1::BIGINT, 'editar o próprio nome');
    PERFORM tests.eq((tests.profile(tests.uid('dentist'))).role, 'dentist', 'role inalterado');
    PERFORM tests.eq((tests.profile(tests.uid('dentist2'))).role, 'dentist', 'role do outro inalterado');
    PERFORM tests.eq((tests.profile(tests.uid('admin'))).full_name, 'Gestor de Tráfego', 'nome do admin inalterado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: admin altera role/active de outro usuário, mas não o próprio';
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET role = 'admin' WHERE id = %L$$, tests.uid('dentist2'))), 1::BIGINT, 'promover outro');
    PERFORM tests.eq((tests.profile(tests.uid('dentist2'))).role, 'admin', 'role alterado');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET active = FALSE WHERE id = %L$$, tests.uid('dentist2'))), 1::BIGINT, 'desativar outro');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET active = TRUE WHERE id = %L$$, tests.uid('inactive'))), 1::BIGINT, 'reativar outro');
    v_err := tests.throws(format($$UPDATE public.profiles SET role = 'dentist' WHERE id = %L$$, tests.uid('admin')), '42501', 'rebaixar a si mesmo');
    PERFORM tests.ok(v_err LIKE 'Você não pode alterar o próprio%', 'mensagem: ' || v_err);
    PERFORM tests.throws(format($$UPDATE public.profiles SET active = FALSE WHERE id = %L$$, tests.uid('admin')), '42501', 'desativar a si mesmo');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET full_name = 'Gestor' WHERE id = %L$$, tests.uid('admin'))), 1::BIGINT, 'editar o próprio nome');
    PERFORM tests.throws(format($$UPDATE public.profiles SET id = gen_random_uuid() WHERE id = %L$$, tests.uid('dentist')), '42501', 'trocar id');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: profiles não são criados nem excluídos pela API';
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    PERFORM tests.throws(format($$INSERT INTO public.profiles (id, full_name, role) VALUES (%L, 'X', 'admin')$$, gen_random_uuid()), '42501', 'insert');
    PERFORM tests.throws(format($$DELETE FROM public.profiles WHERE id = %L$$, tests.uid('dentist2')), '42501', 'delete');
    PERFORM tests.ok((tests.profile(tests.uid('dentist2'))).id IS NOT NULL, 'profile continua existindo');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: usuário inativo (active=false) não vê leads/histórico/métricas e não cria lead';
  v_id UUID;
  v_err TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    v_id := tests.new_lead();
    PERFORM tests.login('inactive');
    PERFORM tests.eq(public.is_active_user(), FALSE, 'is_active_user()');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.leads)::INT, 0, 'leads visíveis');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.lead_history)::INT, 0, 'histórico visível');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.daily_metrics)::INT, 0, 'métricas visíveis');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.gmn_metrics)::INT, 0, 'GMN visível');
    v_err := tests.throws($$INSERT INTO public.leads (name, phone, source) VALUES ('X', '77999990000', 'gmn')$$, '42501', 'criar lead');
    PERFORM tests.ok(v_err LIKE '%row-level security%', 'barrado pelo RLS: ' || v_err);
    PERFORM tests.eq(tests.exec(format($$UPDATE public.leads SET notes = 'x' WHERE id = %L$$, v_id)), 0::BIGINT, 'editar lead');
    -- enxerga só o próprio profile (o app usa isso para detectar a desativação)
    PERFORM tests.eq((SELECT COUNT(*) FROM public.profiles)::INT, 1, 'profiles visíveis');
    PERFORM tests.eq((SELECT id FROM public.profiles), tests.uid('inactive'), 'próprio profile');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET full_name = 'x' WHERE id = %L$$, tests.uid('inactive'))), 0::BIGINT, 'editar o próprio profile');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: admin desativado perde os poderes de admin';
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET active = FALSE WHERE id = %L$$, tests.uid('admin2'))), 1::BIGINT, 'desativar admin2');
    PERFORM tests.login('admin2');
    PERFORM tests.eq(public.is_admin(), FALSE, 'is_admin()');
    PERFORM tests.throws($$INSERT INTO public.daily_metrics (date, campaign) VALUES ('2021-07-01', 'X')$$, '42501', 'inserir métricas');
    PERFORM tests.eq(tests.exec(format($$UPDATE public.profiles SET role = 'dentist' WHERE id = %L$$, tests.uid('dentist'))), 0::BIGINT, 'alterar outro profile');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- RLS — anon e histórico
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RLS: anon não lê leads/profiles/histórico/métricas, mas lê app_settings';
  v_table TEXT;
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    PERFORM tests.new_lead();
    PERFORM tests.login_anon();
    FOREACH v_table IN ARRAY ARRAY['leads', 'profiles', 'lead_history', 'daily_metrics', 'gmn_metrics'] LOOP
      PERFORM tests.throws(format('SELECT * FROM public.%I', v_table), '42501', 'ler ' || v_table);
    END LOOP;
    PERFORM tests.throws($$INSERT INTO public.leads (name, phone, source) VALUES ('X', '77999990000', 'gmn')$$, '42501', 'criar lead');
    PERFORM tests.eq((SELECT clinic_name FROM public.app_settings), 'Instituto Décio Carrilho', 'ler app_settings');
    PERFORM tests.throws($$UPDATE public.app_settings SET crm_name = 'x'$$, '42501', 'editar app_settings');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'RPC: refresh_daily_metrics_leads (SECURITY DEFINER interna) fora da API; só service_role executa';
BEGIN
  BEGIN
    PERFORM tests.login_anon();
    PERFORM tests.throws($$SELECT public.refresh_daily_metrics_leads(current_date, 'X')$$, '42501', 'anon');
    PERFORM tests.login('admin');
    PERFORM tests.throws($$SELECT public.refresh_daily_metrics_leads(current_date, 'X')$$, '42501', 'authenticated');
    PERFORM tests.login_service();
    PERFORM public.refresh_daily_metrics_leads(current_date, 'X');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'lead_history: authenticated lê, mas não insere/altera/exclui diretamente';
  v_id UUID;
  v_hist UUID;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    v_id := tests.lead_in('em_contato');
    SELECT id INTO v_hist FROM public.lead_history WHERE lead_id = v_id AND new_status = 'em_contato';
    PERFORM tests.ok(v_hist IS NOT NULL, 'histórico visível');
    PERFORM tests.throws(format($$INSERT INTO public.lead_history (lead_id, old_status, new_status) VALUES (%L, 'novo', 'compareceu')$$, v_id), '42501', 'insert');
    PERFORM tests.throws(format($$UPDATE public.lead_history SET note = 'forjado' WHERE id = %L$$, v_hist), '42501', 'update');
    PERFORM tests.throws(format($$DELETE FROM public.lead_history WHERE id = %L$$, v_hist), '42501', 'delete');
    PERFORM tests.eq(tests.history_count(v_id), 2, 'histórico intacto');
    PERFORM tests.eq((tests.last_history(v_id, 'em_contato')).note, NULL::TEXT, 'nota intacta');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- daily_metrics.leads_total / leads_agendados
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'daily_metrics: contadores preenchidos no INSERT pelo dia America/Bahia (02:30 UTC = dia anterior)';
  c CONSTANT TEXT := 'Teste | Sync';
  v_l2 UUID;
BEGIN
  BEGIN
    PERFORM tests.as_postgres();
    PERFORM tests.new_lead('google_ads', c, '2020-03-10 02:30:00+00');            -- Bahia 09/03 23:30
    v_l2 := tests.new_lead('google_ads', c, '2020-03-10 03:30:00+00');            -- Bahia 10/03 00:30
    PERFORM tests.new_lead('gmn', c, '2020-03-10 12:00:00+00');                   -- outra fonte: não conta
    PERFORM tests.new_lead('google_ads', '  teste | SYNC ', '2020-03-10 15:00:00+00'); -- mesma campanha
    PERFORM tests.new_lead('google_ads', 'Outra campanha', '2020-03-10 15:00:00+00');
    PERFORM tests.new_lead('google_ads', c, '2020-03-11 02:59:59+00');            -- Bahia 10/03 23:59
    PERFORM tests.new_lead('google_ads', c, '2020-03-11 03:00:00+00');            -- Bahia 11/03 00:00
    PERFORM tests.new_lead('google_ads', NULL, '2020-03-10 15:00:00+00');         -- sem campanha
    PERFORM tests.move(v_l2, 'em_contato');
    PERFORM tests.move(v_l2, 'agendado');
    PERFORM tests.login('admin');
    INSERT INTO public.daily_metrics (date, campaign, impressions, clicks, cost, leads_total, leads_agendados) VALUES
      ('2020-03-09', c, 300, 15, 40, 999, 999),
      ('2020-03-10', c, 320, 18, 45, 999, 999),
      ('2020-03-11', c, 310, 16, 42, 999, 999);
    PERFORM tests.eq(tests.dm('2020-03-09', c), '1/0', '09/03');
    PERFORM tests.eq(tests.dm('2020-03-10', c), '3/1', '10/03');
    PERFORM tests.eq(tests.dm('2020-03-11', c), '1/0', '11/03');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'daily_metrics: contadores acompanham criação e mudanças de status (feitas pelo dentista)';
  c CONSTANT TEXT := 'IDC | Implante Dentário';
  d CONSTANT DATE := '2020-04-15';
  v_a UUID;
  v_b UUID;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    INSERT INTO public.daily_metrics (date, campaign, impressions, clicks, cost) VALUES (d, c, 350, 17, 48.30);
    PERFORM tests.eq(tests.dm(d, c), '0/0', 'sem leads');
    PERFORM tests.login('dentist');
    v_a := tests.new_lead('google_ads', c, '2020-04-15 13:00:00+00');
    PERFORM tests.eq(tests.dm(d, c), '1/0', 'lead criado');
    v_b := tests.new_lead('google_ads', c, '2020-04-16 02:30:00+00');  -- ainda 15/04 na Bahia
    PERFORM tests.eq(tests.dm(d, c), '2/0', 'lead das 23:30 (Bahia)');
    PERFORM public.change_lead_status(v_a, 'em_contato');
    PERFORM tests.eq(tests.dm(d, c), '2/0', 'em contato não é agendamento');
    PERFORM public.change_lead_status(v_a, 'agendado', '2020-04-20 12:00:00+00');
    PERFORM tests.eq(tests.dm(d, c), '2/1', 'agendado');
    PERFORM public.change_lead_status(v_a, 'confirmado');
    PERFORM public.change_lead_status(v_a, 'compareceu');
    PERFORM tests.eq(tests.dm(d, c), '2/1', 'confirmado/compareceu continuam contando');
    PERFORM public.change_lead_status(v_b, 'em_contato');
    PERFORM public.change_lead_status(v_b, 'agendado', '2020-04-21 12:00:00+00');
    PERFORM tests.eq(tests.dm(d, c), '2/2', 'segundo agendamento');
    PERFORM public.change_lead_status(v_b, 'cancelado');
    PERFORM tests.eq(tests.dm(d, c), '2/1', 'cancelado sai da contagem');
    PERFORM public.change_lead_status(v_b, 'agendado', '2020-04-25 12:00:00+00');
    PERFORM tests.eq(tests.dm(d, c), '2/2', 'reagendado volta');
    PERFORM public.change_lead_status(v_b, 'perdido');
    PERFORM tests.eq(tests.dm(d, c), '2/1', 'perdido sai da contagem');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'daily_metrics: mudar campanha, fonte ou data de entrada do lead move a contagem';
  a CONSTANT TEXT := 'IDC | Urgência e Canal';
  b CONSTANT TEXT := 'IDC | Implante Dentário';
  v_id UUID;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    INSERT INTO public.daily_metrics (date, campaign) VALUES
      ('2020-05-04', a), ('2020-05-04', b), ('2020-05-05', b);
    PERFORM tests.login('dentist');
    v_id := tests.lead_in('agendado', 'google_ads', a, '2020-05-04 14:00:00+00');
    PERFORM tests.eq(tests.dm('2020-05-04', a), '1/1', 'campanha A');
    UPDATE public.leads SET campaign = b WHERE id = v_id;
    PERFORM tests.eq(tests.dm('2020-05-04', a), '0/0', 'saiu de A');
    PERFORM tests.eq(tests.dm('2020-05-04', b), '1/1', 'entrou em B');
    UPDATE public.leads SET created_at = '2020-05-05 14:00:00+00' WHERE id = v_id;
    PERFORM tests.eq(tests.dm('2020-05-04', b), '0/0', 'saiu de 04/05');
    PERFORM tests.eq(tests.dm('2020-05-05', b), '1/1', 'entrou em 05/05');
    UPDATE public.leads SET source = 'gmn' WHERE id = v_id;
    PERFORM tests.eq(tests.dm('2020-05-05', b), '0/0', 'não é mais Google Ads');
    UPDATE public.leads SET source = 'google_ads' WHERE id = v_id;
    PERFORM tests.eq(tests.dm('2020-05-05', b), '1/1', 'voltou a ser Google Ads');
    UPDATE public.leads SET campaign = NULL WHERE id = v_id;
    PERFORM tests.eq(tests.dm('2020-05-05', b), '0/0', 'sem campanha');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'daily_metrics: contadores enviados pelo cliente são ignorados; campanha normalizada e única por dia';
  c CONSTANT TEXT := 'IDC | Urgência e Canal';
  v_n INT;
BEGIN
  BEGIN
    PERFORM tests.as_postgres();
    PERFORM tests.lead_in('agendado', 'google_ads', c, '2020-06-02 15:00:00+00');
    PERFORM tests.login('admin');
    INSERT INTO public.daily_metrics (date, campaign, cost) VALUES ('2020-06-02', '  ' || c || '  ', 50);
    PERFORM tests.eq((SELECT campaign FROM public.daily_metrics WHERE date = '2020-06-02'), c, 'campanha aparada');
    PERFORM tests.eq(tests.dm('2020-06-02', c), '1/1', 'após insert');
    UPDATE public.daily_metrics SET leads_total = 999, leads_agendados = 999 WHERE date = '2020-06-02';
    PERFORM tests.eq(tests.dm('2020-06-02', c), '1/1', 'após update manual dos contadores');
    UPDATE public.daily_metrics SET cost = 55, clicks = 20 WHERE date = '2020-06-02';
    PERFORM tests.eq(tests.dm('2020-06-02', c), '1/1', 'após update de custo');
    -- upsert como no import CSV (ON CONFLICT date,campaign)
    INSERT INTO public.daily_metrics (date, campaign, cost, leads_total) VALUES ('2020-06-02', c, 60, 0)
    ON CONFLICT (date, campaign) DO UPDATE SET cost = EXCLUDED.cost, leads_total = EXCLUDED.leads_total;
    PERFORM tests.eq(tests.dm('2020-06-02', c), '1/1', 'após upsert');
    PERFORM tests.eq((SELECT cost FROM public.daily_metrics WHERE date = '2020-06-02'), 60::NUMERIC, 'custo do upsert');
    PERFORM tests.throws(format($$INSERT INTO public.daily_metrics (date, campaign) VALUES ('2020-06-02', %L)$$, upper(c)), '23505', 'mesma campanha com outra caixa');
    SELECT COUNT(*) INTO v_n FROM public.daily_metrics WHERE date = '2020-06-02';
    PERFORM tests.eq(v_n, 1, 'uma linha por dia/campanha');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'daily_metrics: lead sem linha de métricas no dia não cria linha';
BEGIN
  BEGIN
    PERFORM tests.login('dentist');
    PERFORM tests.lead_in('agendado', 'google_ads', 'IDC | Implante Dentário', '2020-07-07 15:00:00+00');
    PERFORM tests.eq((SELECT COUNT(*) FROM public.daily_metrics WHERE date = '2020-07-07')::INT, 0, 'linhas criadas');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- Outros triggers
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'updated_at automático em leads, profiles, métricas e configurações';
  v_id UUID;
  v_dm UUID;
BEGIN
  BEGIN
    PERFORM tests.login('admin');
    v_id := tests.new_lead();
    UPDATE public.leads SET notes = 'x', updated_at = '2000-01-01' WHERE id = v_id;
    PERFORM tests.eq((tests.lead(v_id)).updated_at, now(), 'leads');
    UPDATE public.profiles SET full_name = 'Gestor', updated_at = '2000-01-01' WHERE id = tests.uid('admin');
    PERFORM tests.eq((tests.profile(tests.uid('admin'))).updated_at, now(), 'profiles');
    INSERT INTO public.daily_metrics (date, campaign) VALUES ('2020-08-01', 'X') RETURNING id INTO v_dm;
    UPDATE public.daily_metrics SET cost = 1, updated_at = '2000-01-01' WHERE id = v_dm;
    PERFORM tests.eq((SELECT updated_at FROM public.daily_metrics WHERE id = v_dm), now(), 'daily_metrics');
    UPDATE public.app_settings SET crm_name = 'IDC', updated_at = '2000-01-01';
    PERFORM tests.eq((SELECT updated_at FROM public.app_settings), now(), 'app_settings');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

-- =============================================================================
-- Revisão estática (catálogo)
-- =============================================================================
BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Segurança: toda função do schema public tem search_path fixo (SECURITY DEFINER inclusive)';
  v_bad TEXT;
BEGIN
  BEGIN
    SELECT string_agg(p.proname, ', ') INTO v_bad
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search_path=%');
    PERFORM tests.ok(v_bad IS NULL, 'sem search_path: ' || COALESCE(v_bad, ''));
    PERFORM tests.ok((SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prosecdef) >= 8,
      'funções SECURITY DEFINER esperadas');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Segurança: RLS habilitado em todas as tabelas do schema public';
  v_bad TEXT;
BEGIN
  BEGIN
    SELECT string_agg(relname, ', ') INTO v_bad
    FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p') AND NOT relrowsecurity;
    PERFORM tests.ok(v_bad IS NULL, 'sem RLS: ' || COALESCE(v_bad, ''));
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Segurança: privilégios de tabela (anon só lê app_settings; sem DELETE/TRUNCATE em leads; histórico só leitura)';
BEGIN
  BEGIN
    PERFORM tests.ok(NOT has_table_privilege('anon', 'public.leads', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), 'anon em leads');
    PERFORM tests.ok(NOT has_table_privilege('anon', 'public.profiles', 'SELECT,INSERT,UPDATE,DELETE'), 'anon em profiles');
    PERFORM tests.ok(has_table_privilege('anon', 'public.app_settings', 'SELECT'), 'anon lê app_settings');
    PERFORM tests.ok(NOT has_table_privilege('anon', 'public.app_settings', 'INSERT,UPDATE,DELETE,TRUNCATE'), 'anon escreve app_settings');
    PERFORM tests.ok(NOT has_table_privilege('authenticated', 'public.leads', 'DELETE,TRUNCATE'), 'authenticated DELETE/TRUNCATE leads');
    PERFORM tests.ok(has_table_privilege('authenticated', 'public.leads', 'SELECT') AND has_table_privilege('authenticated', 'public.leads', 'INSERT')
      AND has_table_privilege('authenticated', 'public.leads', 'UPDATE'), 'authenticated SELECT/INSERT/UPDATE leads');
    PERFORM tests.ok(NOT has_table_privilege('service_role', 'public.leads', 'TRUNCATE'), 'service_role TRUNCATE leads');
    PERFORM tests.ok(NOT has_table_privilege('authenticated', 'public.lead_history', 'INSERT,UPDATE,DELETE,TRUNCATE'), 'authenticated escreve histórico');
    PERFORM tests.ok(NOT has_function_privilege('anon', 'public.change_lead_status(uuid,text,timestamptz,text)', 'EXECUTE'), 'anon executa RPC');
    PERFORM tests.ok(has_function_privilege('authenticated', 'public.change_lead_status(uuid,text,timestamptz,text)', 'EXECUTE'), 'authenticated executa RPC');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Supabase: nada criado no schema auth além do trigger on_auth_user_created';
  v_bad TEXT;
BEGIN
  BEGIN
    SELECT string_agg(proname, ', ') INTO v_bad
    FROM pg_proc WHERE pronamespace = 'auth'::regnamespace AND proowner <> 'supabase_auth_admin'::regrole;
    PERFORM tests.ok(v_bad IS NULL, 'funções em auth: ' || COALESCE(v_bad, ''));
    SELECT string_agg(relname, ', ') INTO v_bad
    FROM pg_class WHERE relnamespace = 'auth'::regnamespace AND relname NOT IN ('users', 'users_pkey');
    PERFORM tests.ok(v_bad IS NULL, 'relações em auth: ' || COALESCE(v_bad, ''));
    SELECT string_agg(tgname, ', ') INTO v_bad
    FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
    PERFORM tests.eq(v_bad, 'on_auth_user_created', 'triggers em auth.users');
    PERFORM tests.ok(EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_auth_user_created' AND tgfoid = 'public.handle_new_user()'::regprocedure), 'trigger aponta para handle_new_user');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Realtime: leads, lead_history e daily_metrics na publicação supabase_realtime';
  v_tables TEXT;
BEGIN
  BEGIN
    SELECT string_agg(tablename, ',' ORDER BY tablename) INTO v_tables
    FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public';
    PERFORM tests.eq(v_tables, 'daily_metrics,lead_history,leads', 'tabelas publicadas');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;

BEGIN;
DO $test$
DECLARE
  t CONSTANT TEXT := 'Triggers: ordem e escopo (BEFORE valida/preenche, AFTER audita/sincroniza; sem laço com daily_metrics)';
  v_list TEXT;
BEGIN
  BEGIN
    SELECT string_agg(tgname || ':' || CASE WHEN tgtype & 2 = 2 THEN 'before' ELSE 'after' END, ',' ORDER BY tgname)
    INTO v_list FROM pg_trigger WHERE tgrelid = 'public.leads'::regclass AND NOT tgisinternal;
    PERFORM tests.eq(v_list,
      'lead_status_change:after,leads_enforce_rules:before,leads_prevent_delete:before,leads_prevent_truncate:before,leads_sync_daily_metrics:after,leads_updated_at:before',
      'triggers de leads');
    SELECT string_agg(tgname || ':' || CASE WHEN tgtype & 2 = 2 THEN 'before' ELSE 'after' END, ',' ORDER BY tgname)
    INTO v_list FROM pg_trigger WHERE tgrelid = 'public.daily_metrics'::regclass AND NOT tgisinternal;
    PERFORM tests.eq(v_list, 'daily_metrics_fill_leads:before,daily_metrics_updated_at:before', 'triggers de daily_metrics');
    -- nenhum trigger de daily_metrics escreve em leads (sem recursão)
    PERFORM tests.ok(NOT EXISTS (
      SELECT 1 FROM pg_trigger tg JOIN pg_proc p ON p.oid = tg.tgfoid
      WHERE tg.tgrelid = 'public.daily_metrics'::regclass AND p.prosrc ~* '(update|insert into)\s+public\.leads'
    ), 'trigger de daily_metrics escrevendo em leads');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
ROLLBACK;
