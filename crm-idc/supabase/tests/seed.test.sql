-- =============================================================================
-- Checagens do seed de demonstração (supabase/seed.sql).
-- Rodado por `supabase/tests/run.sh --seed` logo após aplicar o seed (duas vezes),
-- ANTES dos testes de regras (que criam usuários). Conectado como supabase_admin.
-- =============================================================================
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE FUNCTION pg_temp.ok(p_cond BOOLEAN, p_msg TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION '%', p_msg;
  END IF;
END;
$$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: não cria usuários (auth.users vazio) e o reexecutar não duplica';
BEGIN
  BEGIN
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM auth.users) = 0, 'auth.users deveria estar vazio');
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.profiles) = 0, 'profiles deveria estar vazio');
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.daily_metrics) = 150, 'daily_metrics duplicado');
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.gmn_metrics) = 6, 'gmn_metrics duplicado');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: ~150 leads espalhados pelos últimos 75 dias, com leads de hoje';
  v_n INT;
  v_days INT;
BEGIN
  BEGIN
    SELECT COUNT(*), COUNT(DISTINCT (created_at AT TIME ZONE 'America/Bahia')::DATE) INTO v_n, v_days FROM public.leads;
    RAISE NOTICE 'seed: % leads em % dias distintos', v_n, v_days;
    PERFORM pg_temp.ok(v_n BETWEEN 130 AND 175, format('quantidade de leads: %s', v_n));
    PERFORM pg_temp.ok(v_days >= 55, format('dias com leads: %s', v_days));
    PERFORM pg_temp.ok((SELECT min(created_at) FROM public.leads) >= now() - interval '75 days', 'lead mais antigo que 75 dias');
    PERFORM pg_temp.ok((SELECT max(created_at) FROM public.leads) < now(), 'lead no futuro');
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.leads WHERE created_at >= now() - interval '24 hours') >= 3, 'leads nas últimas 24h');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: 7 fontes (Google Ads e GMN à frente) e os 14 serviços';
  v_top TEXT[];
  v_mix TEXT;
BEGIN
  BEGIN
    SELECT array_agg(source ORDER BY n DESC), string_agg(source || '=' || n, ', ' ORDER BY n DESC) INTO v_top, v_mix
    FROM (SELECT source, COUNT(*) n FROM public.leads GROUP BY source) s;
    RAISE NOTICE 'seed: fontes %', v_mix;
    PERFORM pg_temp.ok(array_length(v_top, 1) = 7, 'fontes: ' || v_mix);
    PERFORM pg_temp.ok(v_top[1] = 'google_ads' AND v_top[2] = 'gmn', 'google_ads e gmn deveriam liderar: ' || v_mix);
    PERFORM pg_temp.ok((SELECT COUNT(DISTINCT service) FROM public.leads) = 14, 'serviços distintos');
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.leads WHERE service IS NULL) = 0, 'lead sem serviço');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: Google Ads com as 2 campanhas, palavras-chave, landing pages e UTMs coerentes';
BEGIN
  BEGIN
    PERFORM pg_temp.ok((SELECT COUNT(DISTINCT campaign) FROM public.leads WHERE source = 'google_ads') = 2, 'campanhas');
    PERFORM pg_temp.ok(NOT EXISTS (
      SELECT 1 FROM public.leads WHERE source = 'google_ads' AND NOT (
        (campaign = 'IDC | Urgência e Canal' AND landing_page = '/urgencia' AND utm_campaign = 'idc_urgencia_canal')
        OR (campaign = 'IDC | Implante Dentário' AND landing_page = '/implante' AND utm_campaign = 'idc_implante'))
    ), 'campanha × landing page × utm_campaign');
    PERFORM pg_temp.ok(NOT EXISTS (
      SELECT 1 FROM public.leads WHERE source = 'google_ads'
        AND (keyword IS NULL OR ad_group IS NULL OR utm_source <> 'google' OR utm_medium <> 'cpc' OR utm_term <> keyword)
    ), 'palavra-chave/grupo/UTMs');
    PERFORM pg_temp.ok(EXISTS (SELECT 1 FROM public.leads WHERE keyword = 'dentista barreiras')
      AND EXISTS (SELECT 1 FROM public.leads WHERE keyword = 'implante dentário barreiras')
      AND EXISTS (SELECT 1 FROM public.leads WHERE keyword = 'canal dente dor'), 'palavras-chave principais');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads WHERE source <> 'google_ads' AND campaign IS NOT NULL), 'campanha fora do Google Ads');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: telefones de Barreiras (77) 9xxxx-xxxx só com dígitos; retornos vinculados ao lead anterior';
BEGIN
  BEGIN
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads WHERE phone !~ '^779[0-9]{8}$'), 'telefone fora do padrão');
    PERFORM pg_temp.ok(EXISTS (SELECT 1 FROM public.leads WHERE parent_lead_id IS NOT NULL), 'nenhum retorno vinculado');
    PERFORM pg_temp.ok(NOT EXISTS (
      SELECT 1 FROM public.leads c JOIN public.leads p ON p.id = c.parent_lead_id
      WHERE c.phone <> p.phone OR c.created_at <= p.created_at OR c.source <> 'retorno'
    ), 'vínculo incoerente');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: todos os 8 status presentes com distribuição plausível';
  v_mix TEXT;
  v_total NUMERIC;
  v_sched NUMERIC;
BEGIN
  BEGIN
    SELECT string_agg(status || '=' || n, ', ' ORDER BY n DESC) INTO v_mix
    FROM (SELECT status, COUNT(*) n FROM public.leads GROUP BY status) s;
    RAISE NOTICE 'seed: status %', v_mix;
    PERFORM pg_temp.ok((SELECT COUNT(DISTINCT status) FROM public.leads) = 8, 'status: ' || v_mix);
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.leads WHERE status = 'novo') >= 2, 'novos aguardando resposta');
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('agendado', 'confirmado', 'compareceu')) INTO v_total, v_sched FROM public.leads;
    PERFORM pg_temp.ok(v_sched / v_total BETWEEN 0.25 AND 0.65, format('taxa de agendamento %s%%', round(100 * v_sched / v_total)));
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.leads WHERE status = 'compareceu') >= 0.2 * v_total, 'comparecimentos');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: histórico só com transições válidas, em ordem cronológica, terminando no status atual';
  v_bad TEXT;
BEGIN
  BEGIN
    WITH h AS (
      SELECT h.*, l.status AS lead_status, l.created_at AS lead_created,
        row_number() OVER w AS rn, count(*) OVER (PARTITION BY h.lead_id) AS cnt,
        lag(h.new_status) OVER w AS prev_new, lag(h.created_at) OVER w AS prev_at
      FROM public.lead_history h JOIN public.leads l ON l.id = h.lead_id
      WINDOW w AS (PARTITION BY h.lead_id ORDER BY h.created_at, h.id)
    )
    SELECT string_agg(DISTINCT lead_id::TEXT || ':' || COALESCE(old_status, '∅') || '→' || new_status, ', ') INTO v_bad
    FROM h
    WHERE (rn = 1 AND (old_status IS NOT NULL OR new_status <> 'novo' OR created_at <> lead_created))
       OR (rn > 1 AND (old_status IS DISTINCT FROM prev_new
                       OR NOT public.lead_status_transition_allowed(old_status, new_status)
                       OR created_at <= prev_at))
       OR (rn = cnt AND new_status <> lead_status)
       OR created_at > now();
    PERFORM pg_temp.ok(v_bad IS NULL, 'histórico incoerente: ' || left(COALESCE(v_bad, ''), 300));
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads l WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_history h WHERE h.lead_id = l.id)), 'lead sem histórico');
    PERFORM pg_temp.ok((SELECT COUNT(DISTINCT created_at::DATE) FROM public.lead_history) > 50, 'datas do histórico espalhadas');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: datas do funil coerentes (contato, confirmação, comparecimento, updated_at)';
BEGIN
  BEGIN
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads
      WHERE status IN ('em_contato', 'agendado', 'confirmado', 'compareceu', 'nao_compareceu') AND contacted_at IS NULL), 'contacted_at');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads
      WHERE status IN ('agendado', 'confirmado', 'compareceu', 'nao_compareceu') AND scheduled_at IS NULL), 'scheduled_at');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads
      WHERE status IN ('confirmado', 'compareceu') AND confirmed_at IS NULL), 'confirmed_at');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads
      WHERE status = 'compareceu' AND (attended_at IS NULL OR attended_at < scheduled_at OR attended_at > now())), 'attended_at');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads
      WHERE contacted_at < created_at OR confirmed_at > scheduled_at), 'ordem das datas');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads WHERE status = 'agendado' AND scheduled_at <= now()), 'agendado no passado');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads WHERE status = 'confirmado' AND scheduled_at <= now() - interval '2 hours'), 'confirmado esquecido no passado');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.leads l
      WHERE l.updated_at <> (SELECT max(h.created_at) FROM public.lead_history h WHERE h.lead_id = l.id)), 'updated_at = último evento');
    PERFORM pg_temp.ok(EXISTS (SELECT 1 FROM public.leads WHERE estimated_value > 0), 'valores estimados');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: consultas em horário comercial (Bahia, seg–sáb) e agenda nas próximas 2 semanas';
  v_bad TEXT;
BEGIN
  BEGIN
    SELECT string_agg(to_char(scheduled_at AT TIME ZONE 'America/Bahia', 'Dy DD/MM HH24:MI'), ', ') INTO v_bad
    FROM public.leads, LATERAL (SELECT scheduled_at AT TIME ZONE 'America/Bahia' AS loc) x
    WHERE scheduled_at IS NOT NULL AND NOT (
      EXTRACT(MINUTE FROM x.loc) IN (0, 30)
      AND ((EXTRACT(DOW FROM x.loc) BETWEEN 1 AND 5
            AND (x.loc::TIME BETWEEN '08:00' AND '11:30' OR x.loc::TIME BETWEEN '14:00' AND '17:30'))
        OR (EXTRACT(DOW FROM x.loc) = 6 AND x.loc::TIME BETWEEN '08:00' AND '11:30')));
    PERFORM pg_temp.ok(v_bad IS NULL, 'fora do horário: ' || COALESCE(v_bad, ''));
    PERFORM pg_temp.ok((SELECT COUNT(*) FROM public.leads WHERE status IN ('agendado', 'confirmado')
      AND scheduled_at BETWEEN now() AND now() + interval '14 days') >= 2, 'agenda futura');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: daily_metrics — todos os 75 dias × 2 campanhas, valores plausíveis';
  v_today CONSTANT DATE := (now() AT TIME ZONE 'America/Bahia')::DATE;
BEGIN
  BEGIN
    PERFORM pg_temp.ok((SELECT COUNT(DISTINCT date) FROM public.daily_metrics) = 75, 'dias distintos');
    PERFORM pg_temp.ok((SELECT min(date) FROM public.daily_metrics) = v_today - 74
      AND (SELECT max(date) FROM public.daily_metrics) = v_today, 'intervalo de datas');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT date FROM public.daily_metrics GROUP BY date HAVING COUNT(*) <> 2), '2 campanhas por dia');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.daily_metrics
      WHERE date < v_today AND (cost NOT BETWEEN 28 AND 95 OR impressions < 100)), 'custo diário fora de R$ 28–95');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM public.daily_metrics
      WHERE clicks > impressions OR conversions > clicks OR cost > 95), 'cliques/conversões');
    PERFORM pg_temp.ok((SELECT sum(cost) / NULLIF(sum(clicks), 0) FROM public.daily_metrics) BETWEEN 1.5 AND 4, 'CPC médio');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: daily_metrics.leads_total/leads_agendados batem com os leads (dia America/Bahia)';
  v_bad INT;
  v_cpl NUMERIC;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO v_bad
    FROM public.daily_metrics dm
    CROSS JOIN LATERAL (
      SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE l.status IN ('agendado', 'confirmado', 'compareceu')) AS agendados
      FROM public.leads l
      WHERE l.source = 'google_ads' AND l.campaign = dm.campaign
        AND (l.created_at AT TIME ZONE 'America/Bahia')::DATE = dm.date
    ) c
    WHERE dm.leads_total <> c.total OR dm.leads_agendados <> c.agendados;
    PERFORM pg_temp.ok(v_bad = 0, format('%s linhas com contadores divergentes', v_bad));
    PERFORM pg_temp.ok((SELECT sum(leads_total) FROM public.daily_metrics)
      = (SELECT COUNT(*) FROM public.leads WHERE source = 'google_ads'), 'soma de leads_total');
    SELECT sum(cost) / NULLIF(sum(leads_total), 0) INTO v_cpl FROM public.daily_metrics;
    RAISE NOTICE 'seed: CPL Google Ads R$ %', round(v_cpl, 2);
    PERFORM pg_temp.ok(v_cpl BETWEEN 20 AND 150, format('custo por lead R$ %s', round(v_cpl, 2)));
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: GMN — 6 meses seguidos, avaliações crescendo entre 150 e 190, nota ~4,9';
  v_first DATE := (date_trunc('month', now() AT TIME ZONE 'America/Bahia') - interval '6 months')::DATE;
  v_bad INT;
BEGIN
  BEGIN
    PERFORM pg_temp.ok((SELECT min(period_start) FROM public.gmn_metrics) = v_first, 'primeiro mês');
    PERFORM pg_temp.ok((SELECT max(period_end) FROM public.gmn_metrics)
      = (date_trunc('month', now() AT TIME ZONE 'America/Bahia') - interval '1 day')::DATE, 'último mês completo');
    SELECT COUNT(*) INTO v_bad FROM (
      SELECT g.*, lag(total_reviews) OVER (ORDER BY period_start) AS prev_total,
        lag(period_end) OVER (ORDER BY period_start) AS prev_end
      FROM public.gmn_metrics g
    ) x
    WHERE total_reviews NOT BETWEEN 150 AND 190
       OR average_rating NOT BETWEEN 4.8 AND 5.0
       OR (prev_total IS NOT NULL AND (total_reviews <= prev_total OR new_reviews <> total_reviews - prev_total))
       OR (prev_end IS NOT NULL AND period_start <> prev_end + 1)
       OR period_end <> (date_trunc('month', period_start) + interval '1 month - 1 day')::DATE;
    PERFORM pg_temp.ok(v_bad = 0, format('%s períodos inconsistentes', v_bad));
    PERFORM pg_temp.ok((SELECT average_rating FROM public.gmn_metrics ORDER BY period_end DESC LIMIT 1) = 4.9, 'nota atual 4,9');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;

DO $test$
DECLARE
  t CONSTANT TEXT := 'Seed: não deixa funções auxiliares nem triggers desativados';
BEGIN
  BEGIN
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.leads'::regclass AND tgenabled = 'D'), 'trigger desativado');
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname NOT LIKE 'pg\_%' AND n.nspname NOT IN ('information_schema', 'public', 'auth', 'extensions')), 'funções fora dos schemas esperados');
    RAISE NOTICE 'PASS | %', t;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL | % → % [%]', t, SQLERRM, SQLSTATE;
  END;
END
$test$;
