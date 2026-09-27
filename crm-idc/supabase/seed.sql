-- =============================================================================
-- CRM Instituto Décio Carrilho — dados de DEMONSTRAÇÃO (Barreiras/BA)
--
-- ~150 leads nos últimos 75 dias (relativos a NOW(), então o seed está sempre
-- "fresco"), métricas diárias do Google Ads das 2 campanhas para cada um desses
-- dias e 6 meses de métricas do Google Meu Negócio.
--
-- Como usar: rode DEPOIS de migrations/0001_schema.sql, no SQL Editor do Supabase
-- (papel postgres) ou com psql. De preferência crie antes os usuários (admin e
-- dentista) — o seed atribui a eles a autoria do histórico; sem usuários, o
-- histórico fica sem autor. O seed NÃO cria usuários em auth.users.
--
-- Guarda: se já existir algum lead, nada é feito (NOTICE "Seed ignorado").
-- Tudo passa pelas regras do banco: leads nascem "novo" e avançam só por
-- transições válidas (os triggers validam cada passo); depois o seed ajusta a
-- data/autor de cada linha do histórico para o momento "real" do evento.
-- As funções auxiliares ficam em pg_temp e somem ao fim da sessão.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Auxiliares de data/hora (fuso America/Bahia, UTC-3 sem horário de verão)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.at_local(p_day DATE, p_minutes INT)
RETURNS TIMESTAMPTZ
LANGUAGE sql IMMUTABLE
AS $$ SELECT (p_day::TIMESTAMP + make_interval(mins => p_minutes)) AT TIME ZONE 'America/Bahia' $$;

CREATE OR REPLACE FUNCTION pg_temp.local_day(p_ts TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql IMMUTABLE
AS $$ SELECT (p_ts AT TIME ZONE 'America/Bahia')::DATE $$;

CREATE OR REPLACE FUNCTION pg_temp.local_minutes(p_ts TIMESTAMPTZ)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT (EXTRACT(HOUR FROM p_ts AT TIME ZONE 'America/Bahia') * 60
        + EXTRACT(MINUTE FROM p_ts AT TIME ZONE 'America/Bahia'))::INT
$$;

CREATE OR REPLACE FUNCTION pg_temp.rand_int(p_min INT, p_max INT)
RETURNS INT
LANGUAGE sql VOLATILE
AS $$ SELECT p_min + floor(random() * (p_max - p_min + 1))::INT $$;

CREATE OR REPLACE FUNCTION pg_temp.pick(p_items TEXT[])
RETURNS TEXT
LANGUAGE sql VOLATILE
AS $$ SELECT p_items[1 + floor(random() * array_length(p_items, 1))::INT] $$;

-- Atendimento do WhatsApp: seg–sex 08h–19h, sáb 08h–12h. Fora disso, próxima abertura.
CREATE OR REPLACE FUNCTION pg_temp.business(p_ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  v_day DATE := pg_temp.local_day(p_ts);
  v_min INT := pg_temp.local_minutes(p_ts);
  v_close INT;
  v_first BOOLEAN := TRUE;
BEGIN
  LOOP
    v_close := CASE EXTRACT(DOW FROM v_day)::INT WHEN 0 THEN 0 WHEN 6 THEN 12 * 60 ELSE 19 * 60 END;
    IF v_min < v_close THEN
      IF v_min >= 8 * 60 THEN
        RETURN CASE WHEN v_first THEN p_ts ELSE pg_temp.at_local(v_day, v_min) END;
      END IF;
      RETURN pg_temp.at_local(v_day, 8 * 60 + pg_temp.rand_int(0, 50));
    END IF;
    v_day := v_day + 1;
    v_min := 0;
    v_first := FALSE;
  END LOOP;
END;
$$;

-- Horário de consulta (seg–sex 08h–11h30 e 14h–17h30; sáb 08h–11h30), ao menos
-- 2h depois de p_after, entre p_min_days e p_max_days dias à frente.
CREATE OR REPLACE FUNCTION pg_temp.slot(p_after TIMESTAMPTZ, p_min_days INT, p_max_days INT)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  v_day DATE := pg_temp.local_day(p_after) + pg_temp.rand_int(p_min_days, p_max_days);
  v_slots INT[];
  v_ts TIMESTAMPTZ;
BEGIN
  FOR i IN 1..14 LOOP
    v_slots := CASE EXTRACT(DOW FROM v_day)::INT
      WHEN 0 THEN NULL
      WHEN 6 THEN ARRAY[480, 510, 540, 570, 600, 630, 660, 690]
      ELSE ARRAY[480, 510, 540, 570, 600, 630, 660, 690, 840, 870, 900, 930, 960, 990, 1020, 1050]
    END;
    IF v_slots IS NOT NULL THEN
      SELECT pg_temp.at_local(v_day, s) INTO v_ts
      FROM unnest(v_slots) s
      WHERE pg_temp.at_local(v_day, s) >= p_after + interval '2 hours'
      ORDER BY random()
      LIMIT 1;
      IF v_ts IS NOT NULL THEN
        RETURN v_ts;
      END IF;
    END IF;
    v_day := v_day + 1;
  END LOOP;
  RAISE EXCEPTION 'seed: sem horário de consulta após %', p_after;
END;
$$;

-- -----------------------------------------------------------------------------
-- Mudança de status "no passado": UPDATE comum (os triggers validam a transição
-- e registram o histórico) + data/autor reais na linha de histórico recém-criada.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.step(
  p_id UUID,
  p_status TEXT,
  p_at TIMESTAMPTZ,
  p_actor UUID,
  p_note TEXT DEFAULT NULL,
  p_scheduled TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_at >= now() THEN
    RAISE EXCEPTION 'seed: evento no futuro (% em %)', p_status, p_at;
  END IF;
  PERFORM set_config('app.status_note', COALESCE(p_note, ''), true);
  UPDATE public.leads
  SET status = p_status,
      scheduled_at = COALESCE(p_scheduled, scheduled_at),
      contacted_at = CASE WHEN p_status = 'em_contato' THEN COALESCE(contacted_at, p_at) ELSE contacted_at END,
      confirmed_at = CASE WHEN p_status = 'confirmado' THEN p_at ELSE confirmed_at END,
      attended_at  = CASE WHEN p_status = 'compareceu' THEN p_at ELSE attended_at END
  WHERE id = p_id;
  PERFORM set_config('app.status_note', '', true);
  -- a linha criada agora pelo trigger é a única do lead com created_at = now()
  UPDATE public.lead_history
  SET created_at = p_at, changed_by = p_actor
  WHERE lead_id = p_id AND new_status = p_status AND created_at = now();
END;
$$;

-- -----------------------------------------------------------------------------
-- Desfecho de um agendamento. p_ticket escolhe o desfecho de forma cíclica
-- (garante faltas, cancelamentos e perdas na amostra); p_can_reschedule permite
-- um reagendamento após falta/cancelamento.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.after_scheduled(
  p_id UUID,
  p_booked TIMESTAMPTZ,
  p_appt TIMESTAMPTZ,
  p_ticket INT,
  p_can_reschedule BOOLEAN,
  p_staff UUID,
  p_doctor UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_mod CONSTANT INT := p_ticket % 20;
  v_conf TIMESTAMPTZ;
  v_event TIMESTAMPTZ;
  v_final TEXT;
  v_back TIMESTAMPTZ;
  v_new_appt TIMESTAMPTZ;
BEGIN
  -- confirmação: 1 dia antes (horário comercial); em encaixes, logo após marcar
  v_conf := pg_temp.business(p_appt - interval '1 day' - make_interval(mins => pg_temp.rand_int(0, 240)));
  IF v_conf < p_booked + interval '20 minutes' THEN
    v_conf := p_booked + make_interval(mins => pg_temp.rand_int(20, 80));
  END IF;
  IF v_conf > p_appt - interval '30 minutes' THEN
    v_conf := p_appt - interval '30 minutes';
  END IF;

  -- consulta ainda por vir
  IF p_appt > now() THEN
    IF v_conf < now() AND random() < 0.85 THEN
      PERFORM pg_temp.step(p_id, 'confirmado', v_conf, p_staff,
        pg_temp.pick(ARRAY['Confirmou presença pelo WhatsApp', 'Confirmado por ligação', NULL]));
    END IF;
    RETURN;
  END IF;

  -- desmarcou antes da confirmação
  IF v_mod = 3 THEN
    v_event := p_booked + (p_appt - p_booked) * (0.3 + random() * 0.5);
    PERFORM pg_temp.step(p_id, 'cancelado', v_event, p_staff,
      pg_temp.pick(ARRAY['Paciente pediu para desmarcar', 'Viagem de trabalho, vai remarcar', 'Desmarcou por motivo de saúde']));
    v_final := 'cancelado';
  -- sumiu antes da consulta
  ELSIF v_mod = 11 THEN
    v_event := GREATEST(p_appt - interval '3 hours', p_booked + interval '30 minutes');
    PERFORM pg_temp.step(p_id, 'perdido', v_event, p_staff, 'Não confirmou e não atendeu às ligações');
    RETURN;
  ELSE
    PERFORM pg_temp.step(p_id, 'confirmado', v_conf, p_staff,
      pg_temp.pick(ARRAY['Confirmou presença pelo WhatsApp', 'Confirmado por ligação', NULL]));
    IF v_mod IN (6, 16, 18) THEN
      v_event := p_appt + make_interval(mins => pg_temp.rand_int(60, 120));
      v_final := 'nao_compareceu';
    ELSIF v_mod = 14 THEN
      v_event := GREATEST(p_appt - make_interval(mins => pg_temp.rand_int(60, 240)), v_conf + interval '10 minutes');
      v_final := 'cancelado';
    ELSE
      v_event := p_appt + make_interval(mins => pg_temp.rand_int(0, 25));
      v_final := 'compareceu';
    END IF;
    IF v_event >= now() THEN
      RETURN;  -- consulta de hoje ainda não marcada no sistema: fica "confirmado"
    END IF;
    PERFORM pg_temp.step(p_id, v_final, v_event,
      CASE WHEN v_final = 'cancelado' THEN p_staff ELSE p_doctor END,
      CASE v_final
        WHEN 'compareceu' THEN pg_temp.pick(ARRAY['Avaliação realizada', 'Atendido pelo Dr. Décio', 'Iniciou o tratamento', NULL])
        WHEN 'nao_compareceu' THEN pg_temp.pick(ARRAY['Faltou sem avisar', 'Não compareceu; mensagem enviada'])
        ELSE 'Cancelou no dia: imprevisto no trabalho'
      END);
  END IF;

  -- reagendamento (nao_compareceu/cancelado → agendado)
  IF p_can_reschedule AND v_final IN ('cancelado', 'nao_compareceu') AND v_mod IN (3, 6, 14) THEN
    v_back := pg_temp.business(v_event + make_interval(days => pg_temp.rand_int(1, 3)));
    IF v_back < now() THEN
      v_new_appt := pg_temp.slot(v_back, 1, 6);
      PERFORM pg_temp.step(p_id, 'agendado', v_back, p_staff, 'Reagendado a pedido do paciente', v_new_appt);
      PERFORM pg_temp.after_scheduled(p_id, v_back, v_new_appt, p_ticket + 1, FALSE, p_staff, p_doctor);
    END IF;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Um lead: dados realistas + simulação do funil.
-- p_mode: 'auto' (simula pelo tempo decorrido) ou o status final desejado para
-- os leads "vitrine" recentes ('novo', 'em_contato', 'agendado', 'confirmado').
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.seed_lead(
  p_i INT,
  p_created TIMESTAMPTZ,
  p_mode TEXT,
  p_admin UUID,
  p_dentist UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff UUID := COALESCE(p_dentist, p_admin);
  v_doctor UUID := COALESCE(p_dentist, p_admin);
  v_id UUID;
  v_source TEXT;
  v_campaign TEXT;
  v_keyword TEXT;
  v_ad_group TEXT;
  v_landing TEXT;
  v_service TEXT;
  v_detail TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_notes TEXT;
  v_parent UUID;
  v_creator UUID;
  v_insert_note TEXT;
  v_p_sched NUMERIC;
  v_contact TIMESTAMPTZ;
  v_decide TIMESTAMPTZ;
  v_appt TIMESTAMPTZ;
  v_lost TIMESTAMPTZ;
  v_back TIMESTAMPTZ;
  v_value NUMERIC;
  v_unseen TEXT;
  v_kw TEXT[];
  v_kw_line TEXT;
  v_parent_name TEXT;
  v_parent_phone TEXT;
BEGIN
  -- Origem (pesos: Google Ads e GMN na frente); as 7 fontes aparecem com certeza
  IF p_i % 15 = 7 AND p_i / 15 < 7 THEN
    v_source := (ARRAY['outro', 'indicacao', 'instagram', 'google_organico', 'gmn', 'google_ads', 'retorno'])[p_i / 15 + 1];
  ELSE
    v_source := pg_temp.pick(ARRAY[
      'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads',
      'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads', 'google_ads',
      'gmn', 'gmn', 'gmn', 'gmn', 'gmn', 'gmn', 'gmn', 'gmn', 'gmn',
      'google_organico', 'google_organico', 'google_organico',
      'instagram', 'instagram', 'instagram',
      'indicacao', 'indicacao', 'indicacao',
      'retorno', 'retorno',
      'outro']);
  END IF;

  -- Paciente
  v_name := CASE WHEN random() < 0.58
    THEN pg_temp.pick(ARRAY['Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patrícia',
      'Aline', 'Luciana', 'Camila', 'Jéssica', 'Letícia', 'Beatriz', 'Larissa', 'Vanessa', 'Cláudia', 'Rosângela', 'Gabriela',
      'Joana', 'Tatiane', 'Edilene', 'Lucineide', 'Rafaela', 'Daiane', 'Josefa', 'Raimunda', 'Débora', 'Priscila'])
    ELSE pg_temp.pick(ARRAY['José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Marcos',
      'Rafael', 'Daniel', 'Gabriel', 'Bruno', 'Eduardo', 'Felipe', 'Raimundo', 'Rodrigo', 'Manoel', 'Anderson', 'Tiago',
      'Jailson', 'Edvaldo', 'Gilmar', 'Valdemir', 'Cícero', 'Ronaldo', 'Adilson', 'Wesley', 'Vinícius'])
  END || ' ' || pg_temp.pick(ARRAY['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Lima', 'Carvalho', 'Ferreira',
      'Rodrigues', 'Almeida', 'Costa', 'Gomes', 'Ribeiro', 'Martins', 'Rocha', 'Barbosa', 'Araújo', 'Nascimento', 'Cardoso',
      'Teixeira', 'Moreira', 'Mendes', 'Nunes', 'Batista', 'Cavalcante', 'Dias', 'Castro', 'Brito', 'Queiroz', 'Novais',
      'Macedo', 'Sampaio', 'Matos', 'Bonfim', 'Neves', 'Porto', 'Farias', 'Sousa', 'Miranda', 'Fagundes'])
    || CASE WHEN random() < 0.35 THEN ' ' || pg_temp.pick(ARRAY['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Rocha', 'Barreto', 'Coelho', 'Alves']) ELSE '' END;
  -- celular de Barreiras: (77) 9 8xxx-xxxx / 9 9xxx-xxxx, só dígitos
  v_phone := '779' || pg_temp.pick(ARRAY['8', '9', '9']) || lpad(pg_temp.rand_int(0, 9999999)::TEXT, 7, '0');

  IF v_source = 'google_ads' THEN
    IF random() < 0.56 THEN
      v_campaign := 'IDC | Urgência e Canal';
      v_landing := '/urgencia';
      v_kw_line := pg_temp.pick(ARRAY[
        'dentista barreiras|Dentista em Barreiras|clinica_geral',
        'dentista barreiras|Dentista em Barreiras|canal',
        'dentista barreiras|Dentista em Barreiras|clinica_geral',
        'dentista urgência barreiras|Urgência Odontológica|canal',
        'dentista urgência barreiras|Urgência Odontológica|extracao',
        'dentista 24 horas barreiras|Urgência Odontológica|clinica_geral',
        'canal dente dor|Tratamento de Canal|canal',
        'canal dente dor|Tratamento de Canal|canal',
        'tratamento de canal barreiras|Tratamento de Canal|canal',
        'dor de dente forte|Urgência Odontológica|canal',
        'dente quebrado o que fazer|Urgência Odontológica|clinica_geral',
        'extração de siso barreiras|Extração|extracao']);
    ELSE
      v_campaign := 'IDC | Implante Dentário';
      v_landing := '/implante';
      v_kw_line := pg_temp.pick(ARRAY[
        'implante dentário barreiras|Implante Dentário|implante',
        'implante dentário barreiras|Implante Dentário|implante',
        'implante dentário barreiras|Implante Dentário|implante',
        'implante dentário preço|Implante Dentário|implante',
        'implante dentário valor barreiras|Implante Dentário|implante',
        'clínica de implante barreiras|Implante Dentário|implante',
        'prótese protocolo barreiras|Protocolo / Prótese Fixa|protese_protocolo',
        'dentadura fixa|Protocolo / Prótese Fixa|protese_protocolo',
        'protocolo dentário preço|Protocolo / Prótese Fixa|protese_protocolo']);
    END IF;
    v_kw := string_to_array(v_kw_line, '|');
    v_keyword := v_kw[1];
    v_ad_group := v_kw[2];
    v_service := v_kw[3];
  ELSE
    -- serviços: garante que os 14 apareçam; depois pesos típicos da clínica
    IF p_i % 3 = 0 THEN
      SELECT s INTO v_unseen
      FROM unnest(ARRAY['clinica_geral', 'implante', 'protese_protocolo', 'estetica', 'preventivo', 'canal', 'extracao',
        'clareamento', 'lente_contato', 'ortodontia', 'odontopediatria', 'fisioterapia', 'sono', 'outro']) WITH ORDINALITY u(s, n)
      WHERE NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.service = u.s)
      ORDER BY n
      LIMIT 1;
    END IF;
    v_service := COALESCE(v_unseen, pg_temp.pick(ARRAY[
      'clinica_geral', 'clinica_geral', 'clinica_geral', 'clinica_geral', 'clinica_geral',
      'preventivo', 'preventivo', 'preventivo',
      'estetica', 'estetica', 'estetica',
      'clareamento', 'clareamento', 'clareamento', 'clareamento',
      'lente_contato', 'lente_contato', 'lente_contato',
      'ortodontia', 'ortodontia', 'ortodontia', 'ortodontia',
      'odontopediatria', 'odontopediatria', 'odontopediatria',
      'implante', 'implante', 'implante',
      'protese_protocolo', 'protese_protocolo',
      'canal', 'canal',
      'extracao', 'extracao',
      'fisioterapia',
      'sono',
      'outro']));
    IF v_source = 'google_organico' THEN
      v_landing := pg_temp.pick(ARRAY['/', '/', '/implante', '/urgencia', '/blog/quanto-custa-implante-dentario']);
      v_keyword := NULL;
    END IF;
  END IF;

  v_detail := CASE WHEN random() < 0.7 THEN pg_temp.pick(CASE v_service
    WHEN 'clinica_geral' THEN ARRAY['Consulta de rotina', 'Dente sensível ao frio', 'Avaliação geral', 'Restauração caiu']
    WHEN 'implante' THEN ARRAY['Perdeu um dente de trás', 'Quer orçamento de implante unitário', 'Faltam dois dentes embaixo', 'Usa ponte móvel e quer implante']
    WHEN 'protese_protocolo' THEN ARRAY['Usa dentadura e quer prótese fixa', 'Orçamento de protocolo superior', 'Dentadura machucando a gengiva']
    WHEN 'estetica' THEN ARRAY['Quer melhorar o sorriso', 'Dente da frente escurecido', 'Resina nos dentes da frente']
    WHEN 'preventivo' THEN ARRAY['Limpeza e avaliação', 'Tártaro e sangramento na gengiva', 'Check-up anual']
    WHEN 'canal' THEN ARRAY['Dor forte no dente 36', 'Dor latejante à noite', 'Dente inchado e dolorido', 'Indicação de canal de outro dentista']
    WHEN 'extracao' THEN ARRAY['Siso inflamado', 'Siso nascendo torto', 'Dente quebrado na raiz']
    WHEN 'clareamento' THEN ARRAY['Clareamento para o casamento', 'Clareamento a laser', 'Dentes amarelados']
    WHEN 'lente_contato' THEN ARRAY['Orçamento de lentes nos dentes da frente', 'Quer lentes de porcelana', 'Viu antes e depois no Instagram']
    WHEN 'ortodontia' THEN ARRAY['Aparelho para a filha de 12 anos', 'Quer alinhador invisível', 'Manutenção de aparelho']
    WHEN 'odontopediatria' THEN ARRAY['Primeira consulta do filho de 4 anos', 'Criança com cárie', 'Filho bateu o dente da frente']
    WHEN 'fisioterapia' THEN ARRAY['Dor na ATM ao mastigar', 'Estalo na mandíbula', 'Bruxismo e dor de cabeça']
    WHEN 'sono' THEN ARRAY['Ronco e apneia', 'Encaminhado pelo otorrino para placa de apneia']
    ELSE ARRAY['Pergunta sobre convênio', 'Quer saber horários de atendimento']
  END) END;

  v_notes := CASE
    WHEN v_source = 'indicacao' THEN 'Indicação de paciente: ' || pg_temp.pick(ARRAY['Dona Lúcia Matos', 'Sr. Gilberto Neves', 'Carla Novais', 'Pr. Ademir Souza', 'Neide Sampaio'])
    WHEN random() < 0.3 THEN pg_temp.pick(ARRAY['Prefere atendimento pela manhã', 'Prefere horário após as 17h',
      'Particular, perguntou sobre parcelamento', 'Mora em Luís Eduardo Magalhães', 'Mora em São Desidério',
      'Pediu orçamento por WhatsApp', 'Tem medo de dentista, atender com calma', 'Paciente idosa, vem acompanhada da filha',
      'Perguntou se aceita cartão em 10x', 'Mora em Riachão das Neves', 'Trabalha no comércio, só pode sábado'])
  END;

  -- Retorno: parte dos pacientes de retorno é o mesmo telefone de um atendimento anterior (regra 4: vínculo)
  IF v_source = 'retorno' AND (random() < 0.7 OR p_i % 15 = 7) THEN
    SELECT l.id, l.name, l.phone INTO v_parent, v_parent_name, v_parent_phone
    FROM public.leads l
    WHERE l.status = 'compareceu' AND l.attended_at < p_created - interval '7 days'
      AND NOT EXISTS (SELECT 1 FROM public.leads c WHERE c.parent_lead_id = l.id)
    ORDER BY l.attended_at
    LIMIT 1;
    -- sem atendimento anterior elegível: segue como paciente antigo, sem vínculo
    IF v_parent IS NOT NULL THEN
      v_name := v_parent_name;
      v_phone := v_parent_phone;
      v_notes := 'Paciente da clínica voltando para ' || pg_temp.pick(ARRAY['revisão', 'nova avaliação', 'manutenção']);
    END IF;
  END IF;

  -- Autoria: parte dos leads do Google Ads chega pelo webhook do site (sem autor)
  IF v_source = 'google_ads' AND random() < 0.6 THEN
    v_creator := NULL;
    v_insert_note := 'Recebido automaticamente pelo site (webhook)';
  ELSE
    v_creator := CASE WHEN random() < 0.75 THEN COALESCE(p_dentist, p_admin) ELSE COALESCE(p_admin, p_dentist) END;
    v_insert_note := CASE WHEN v_parent IS NOT NULL THEN 'Lead cadastrado (vinculado ao atendimento anterior)' END;
  END IF;

  PERFORM set_config('app.status_note', COALESCE(v_insert_note, ''), true);
  INSERT INTO public.leads (
    name, phone, notes, source, campaign, keyword, ad_group, landing_page,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    service, service_detail, parent_lead_id, created_by, created_at, updated_at
  ) VALUES (
    v_name, v_phone, v_notes, v_source, v_campaign, v_keyword, v_ad_group, v_landing,
    CASE WHEN v_source = 'google_ads' THEN 'google' WHEN v_source = 'instagram' THEN 'instagram' END,
    CASE WHEN v_source = 'google_ads' THEN 'cpc' WHEN v_source = 'instagram' THEN 'social' END,
    CASE v_campaign WHEN 'IDC | Urgência e Canal' THEN 'idc_urgencia_canal' WHEN 'IDC | Implante Dentário' THEN 'idc_implante' END,
    v_keyword,
    CASE WHEN v_source = 'google_ads' THEN pg_temp.pick(ARRAY['anuncio-1', 'anuncio-2', 'anuncio-3']) END,
    v_service, v_detail, v_parent, v_creator, p_created, p_created
  )
  RETURNING id INTO v_id;
  PERFORM set_config('app.status_note', '', true);
  UPDATE public.lead_history SET created_at = p_created WHERE lead_id = v_id AND old_status IS NULL;

  -- ---------------------------------------------------------------------------
  -- Leads "vitrine" recentes (garantem todos os status abertos na demonstração)
  -- ---------------------------------------------------------------------------
  IF p_mode = 'novo' THEN
    RETURN v_id;
  ELSIF p_mode = 'em_contato' THEN
    PERFORM pg_temp.step(v_id, 'em_contato', LEAST(p_created + interval '15 minutes', now() - interval '5 minutes'),
      v_staff, 'Enviados valores da avaliação; aguardando retorno');
    RETURN v_id;
  ELSIF p_mode IN ('agendado', 'confirmado') THEN
    PERFORM pg_temp.step(v_id, 'em_contato', p_created + interval '15 minutes', v_staff, 'Primeiro contato pelo WhatsApp');
    v_appt := CASE p_mode
      WHEN 'agendado' THEN pg_temp.slot(now(), 3, 6)
      ELSE pg_temp.slot(now() + interval '3 hours', 0, 1)
    END;
    PERFORM pg_temp.step(v_id, 'agendado', p_created + interval '1 hour', v_staff, 'Avaliação agendada', v_appt);
    IF p_mode = 'confirmado' THEN
      PERFORM pg_temp.step(v_id, 'confirmado', now() - interval '45 minutes', v_staff, 'Confirmou presença pelo WhatsApp');
    END IF;
    UPDATE public.leads SET estimated_value = 350 WHERE id = v_id AND v_service = 'clinica_geral';
    RETURN v_id;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Simulação do funil pelo tempo decorrido
  -- ---------------------------------------------------------------------------
  v_contact := pg_temp.business(p_created + make_interval(mins => pg_temp.rand_int(4, 80)));
  IF v_contact >= now() THEN
    RETURN v_id;  -- ainda não respondido
  END IF;

  IF p_i % 25 = 12 THEN
    -- nunca houve conversa (novo → perdido)
    v_lost := pg_temp.business(p_created + make_interval(days => 2, mins => pg_temp.rand_int(0, 600)));
    IF v_lost < now() THEN
      PERFORM pg_temp.step(v_id, 'perdido', v_lost, v_staff, 'Número não recebe mensagens no WhatsApp');
    END IF;
    RETURN v_id;
  END IF;

  PERFORM pg_temp.step(v_id, 'em_contato', v_contact, v_staff,
    pg_temp.pick(ARRAY['Primeiro contato pelo WhatsApp', 'Respondido no WhatsApp', 'Enviados valores da avaliação', NULL, NULL]));

  v_decide := pg_temp.business(v_contact + make_interval(mins => pg_temp.rand_int(20, 1800)));
  IF v_decide >= now() THEN
    RETURN v_id;  -- conversa em andamento
  END IF;

  v_p_sched := CASE v_source
    WHEN 'google_ads' THEN CASE WHEN v_campaign = 'IDC | Urgência e Canal' THEN 0.48 ELSE 0.34 END
    WHEN 'gmn' THEN 0.50
    WHEN 'google_organico' THEN 0.40
    WHEN 'instagram' THEN 0.30
    WHEN 'indicacao' THEN 0.65
    WHEN 'retorno' THEN 0.80
    ELSE 0.35
  END;

  IF random() < v_p_sched THEN
    v_appt := CASE WHEN v_service IN ('canal', 'extracao') OR v_campaign = 'IDC | Urgência e Canal'
      THEN pg_temp.slot(v_decide, 0, 2)
      ELSE pg_temp.slot(v_decide, 1, 9)
    END;
    PERFORM pg_temp.step(v_id, 'agendado', v_decide, v_staff,
      CASE WHEN pg_temp.local_day(v_appt) = pg_temp.local_day(v_decide) THEN 'Encaixe de urgência no mesmo dia'
        ELSE pg_temp.pick(ARRAY['Avaliação agendada', 'Consulta marcada pelo WhatsApp', 'Agendado por telefone', NULL]) END,
      v_appt);
    PERFORM pg_temp.after_scheduled(v_id, v_decide, v_appt, p_i, TRUE, v_staff, v_doctor);
  ELSE
    v_lost := pg_temp.business(v_decide + make_interval(days => pg_temp.rand_int(1, 5)));
    IF v_lost >= now() THEN
      RETURN v_id;  -- ainda tentando contato
    END IF;
    IF p_i % 9 = 4 THEN
      PERFORM pg_temp.step(v_id, 'cancelado', v_lost, v_staff, 'Desistiu do atendimento por enquanto');
    ELSE
      PERFORM pg_temp.step(v_id, 'perdido', v_lost, v_staff, pg_temp.pick(ARRAY[
        'Não respondeu após 3 tentativas', 'Achou o valor alto', 'Vai pensar e retorna',
        'Fechou com outra clínica', 'Só queria saber o preço', 'Não respondeu mais']));
      -- reativação ocasional (perdido → em_contato → agendado)
      IF p_i % 11 = 5 THEN
        v_back := pg_temp.business(v_lost + make_interval(days => pg_temp.rand_int(8, 20)));
        IF v_back < now() THEN
          PERFORM pg_temp.step(v_id, 'em_contato', v_back, v_staff, 'Paciente voltou a entrar em contato');
          v_decide := pg_temp.business(v_back + make_interval(mins => pg_temp.rand_int(30, 300)));
          IF v_decide < now() THEN
            v_appt := pg_temp.slot(v_decide, 1, 5);
            PERFORM pg_temp.step(v_id, 'agendado', v_decide, v_staff, 'Agendou após retomar o contato', v_appt);
            PERFORM pg_temp.after_scheduled(v_id, v_decide, v_appt, p_i + 7, FALSE, v_staff, v_doctor);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- valor estimado do procedimento para quem chegou a agendar
  IF EXISTS (SELECT 1 FROM public.lead_history h WHERE h.lead_id = v_id AND h.new_status = 'agendado') AND random() < 0.65 THEN
    v_value := CASE v_service
      WHEN 'implante' THEN pg_temp.rand_int(320, 580) * 10
      WHEN 'protese_protocolo' THEN pg_temp.rand_int(140, 260) * 100
      WHEN 'canal' THEN pg_temp.rand_int(65, 130) * 10
      WHEN 'extracao' THEN pg_temp.rand_int(25, 60) * 10
      WHEN 'clareamento' THEN pg_temp.rand_int(70, 150) * 10
      WHEN 'lente_contato' THEN pg_temp.rand_int(60, 140) * 100
      WHEN 'ortodontia' THEN pg_temp.rand_int(24, 48) * 100
      WHEN 'estetica' THEN pg_temp.rand_int(40, 180) * 10
      WHEN 'fisioterapia' THEN pg_temp.rand_int(60, 160) * 10
      WHEN 'sono' THEN pg_temp.rand_int(18, 35) * 100
      ELSE pg_temp.rand_int(15, 45) * 10
    END;
    UPDATE public.leads SET estimated_value = v_value WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Geração
-- -----------------------------------------------------------------------------
DO $seed$
DECLARE
  v_today CONSTANT DATE := pg_temp.local_day(now());
  v_now_min CONSTANT INT := pg_temp.local_minutes(now());
  v_admin UUID;
  v_dentist UUID;
  v_hours CONSTANT INT[] := ARRAY[
    7, 7, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10,
    11, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 14,
    15, 15, 15, 15, 15, 16, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18,
    19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 23, 0, 6];
  v_times TIMESTAMPTZ[] := '{}';
  v_day DATE;
  v_mean NUMERIC;
  v_n INT;
  v_min INT;
  v_leads INT;
  v_i INT := 0;
  v_campaign TEXT;
  v_trend NUMERIC;
  v_dow_factor NUMERIC;
  v_impr INT;
  v_clicks INT;
  v_cost NUMERIC;
  v_conv INT;
  v_frac NUMERIC;
  v_start DATE;
  v_reviews CONSTANT INT[] := ARRAY[148, 153, 159, 166, 173, 181, 188];
  v_ts TIMESTAMPTZ;
BEGIN
  IF EXISTS (SELECT 1 FROM public.leads) THEN
    RAISE NOTICE 'Seed ignorado: já existem leads no banco (o seed de demonstração só roda em banco vazio).';
    RETURN;
  END IF;

  PERFORM setseed(0.2026);

  -- autoria do histórico: usuários já criados (opcional)
  SELECT id INTO v_admin FROM public.profiles WHERE role = 'admin' AND active ORDER BY created_at LIMIT 1;
  SELECT id INTO v_dentist FROM public.profiles WHERE role = 'dentist' AND active ORDER BY created_at LIMIT 1;

  -- 1) horários de chegada: ~2 leads/dia com tendência de alta, menos no fim de semana
  FOR d IN REVERSE 74..0 LOOP
    v_day := v_today - d;
    v_mean := (1.55 + 1.1 * (74 - d) / 74.0)
      * CASE EXTRACT(DOW FROM v_day)::INT WHEN 0 THEN 0.45 WHEN 6 THEN 0.75 ELSE 1.08 END;
    v_n := floor(v_mean + random())::INT;
    FOR k IN 1..v_n LOOP
      v_min := v_hours[1 + floor(random() * array_length(v_hours, 1))::INT] * 60 + pg_temp.rand_int(0, 59);
      -- hoje: só o que já aconteceu (e fora da janela dos leads "vitrine")
      CONTINUE WHEN d = 0 AND v_min > v_now_min - 150;
      v_times := v_times || pg_temp.at_local(v_day, v_min);
    END LOOP;
  END LOOP;
  SELECT array_agg(t ORDER BY t) INTO v_times FROM unnest(v_times) t;

  -- 2) leads (em ordem cronológica)
  FOREACH v_ts IN ARRAY v_times LOOP
    v_i := v_i + 1;
    PERFORM pg_temp.seed_lead(v_i, v_ts, 'auto', v_admin, v_dentist);
  END LOOP;

  -- 3) vitrine: leads recentes em todos os status abertos
  PERFORM pg_temp.seed_lead(v_i + 1, now() - interval '4 days 2 hours', 'confirmado', v_admin, v_dentist);
  PERFORM pg_temp.seed_lead(v_i + 2, now() - interval '2 days 5 hours', 'agendado', v_admin, v_dentist);
  PERFORM pg_temp.seed_lead(v_i + 3, now() - interval '20 hours', 'em_contato', v_admin, v_dentist);
  PERFORM pg_temp.seed_lead(v_i + 4, now() - interval '2 hours 10 minutes', 'em_contato', v_admin, v_dentist);
  PERFORM pg_temp.seed_lead(v_i + 5, now() - interval '70 minutes', 'novo', v_admin, v_dentist);
  PERFORM pg_temp.seed_lead(v_i + 6, now() - interval '25 minutes', 'novo', v_admin, v_dentist);

  -- updated_at = último evento do lead (o trigger usaria now() para todos)
  IF pg_has_role(current_user, (SELECT relowner FROM pg_class WHERE oid = 'public.leads'::regclass), 'USAGE') THEN
    ALTER TABLE public.leads DISABLE TRIGGER leads_updated_at;
    UPDATE public.leads l
    SET updated_at = COALESCE((SELECT max(h.created_at) FROM public.lead_history h WHERE h.lead_id = l.id), l.created_at);
    ALTER TABLE public.leads ENABLE TRIGGER leads_updated_at;
  ELSE
    RAISE NOTICE 'Seed: sem permissão para ajustar leads.updated_at (rode como postgres para datas realistas).';
  END IF;

  -- 4) Google Ads: todos os dias dos últimos 75 dias, 2 campanhas (R$ 30–90/dia cada)
  FOR d IN REVERSE 74..0 LOOP
    v_day := v_today - d;
    v_trend := 0.9 + 0.25 * (74 - d) / 74.0;
    v_dow_factor := CASE EXTRACT(DOW FROM v_day)::INT WHEN 0 THEN 0.6 WHEN 6 THEN 0.8 ELSE 1 END;
    v_frac := CASE WHEN d = 0 THEN GREATEST(v_now_min, 30) / 1440.0 ELSE 1 END;  -- hoje: dia parcial
    FOREACH v_campaign IN ARRAY ARRAY['IDC | Urgência e Canal', 'IDC | Implante Dentário'] LOOP
      IF v_campaign = 'IDC | Urgência e Canal' THEN
        v_impr := round(430 * v_trend * v_dow_factor * (0.82 + random() * 0.36));
        v_clicks := round(v_impr * (0.055 + random() * 0.03));
        v_cost := v_clicks * (1.40 + random() * 0.8);
      ELSE
        v_impr := round(360 * v_trend * v_dow_factor * (0.82 + random() * 0.36));
        v_clicks := round(v_impr * (0.038 + random() * 0.025));
        v_cost := v_clicks * (2.0 + random() * 1.0);
      END IF;
      v_cost := LEAST(GREATEST(v_cost, 30 + random() * 6), 88 + random() * 4);
      v_impr := round(v_impr * v_frac);
      v_clicks := round(v_clicks * v_frac);
      v_cost := round(v_cost * v_frac, 2);

      -- conversões do Google (cliques no WhatsApp) ≈ leads reais do dia ± ruído
      SELECT COUNT(*) INTO v_leads FROM public.leads
      WHERE source = 'google_ads' AND campaign = v_campaign AND pg_temp.local_day(created_at) = v_day;
      v_conv := LEAST(v_clicks, GREATEST(0, v_leads + (ARRAY[-1, 0, 0, 0, 1, 1, 1, 2])[1 + floor(random() * 8)::INT]));

      INSERT INTO public.daily_metrics (date, campaign, impressions, clicks, cost, conversions, created_by)
      VALUES (v_day, v_campaign, v_impr, v_clicks, v_cost, v_conv, v_admin)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- 5) Google Meu Negócio: 6 meses completos, avaliações crescendo (~4,9 ★)
  FOR m IN 1..6 LOOP
    v_start := (date_trunc('month', v_today) - make_interval(months => 7 - m))::DATE;
    INSERT INTO public.gmn_metrics (
      period_start, period_end, search_views, maps_views, website_clicks, direction_requests, phone_calls,
      total_reviews, average_rating, new_reviews, notes, created_by
    )
    SELECT
      v_start,
      (v_start + interval '1 month' - interval '1 day')::DATE,
      round((1850 + m * 140) * (0.93 + random() * 0.14)),
      round((720 + m * 60) * (0.9 + random() * 0.2)),
      round((68 + m * 7) * (0.85 + random() * 0.3)),
      round((44 + m * 5) * (0.85 + random() * 0.3)),
      round((31 + m * 4) * (0.85 + random() * 0.3)),
      v_reviews[m + 1],
      CASE WHEN m = 1 THEN 4.8 ELSE 4.9 END,
      v_reviews[m + 1] - v_reviews[m],
      (ARRAY['Perfil atualizado com fotos novas da clínica', 'Todas as avaliações do mês respondidas',
        'Postagens semanais sobre implante e urgência', 'Pedido de avaliação após as consultas',
        'Horário de sábado publicado no perfil', 'Destaque para atendimento de urgência'])[m],
      v_admin
    WHERE NOT EXISTS (SELECT 1 FROM public.gmn_metrics g WHERE g.period_start = v_start);
  END LOOP;

  RAISE NOTICE 'Seed concluído: % leads, % linhas de histórico, % dias de métricas do Google Ads, % períodos do GMN.',
    (SELECT COUNT(*) FROM public.leads), (SELECT COUNT(*) FROM public.lead_history),
    (SELECT COUNT(*) FROM public.daily_metrics), (SELECT COUNT(*) FROM public.gmn_metrics);
END
$seed$;

DROP FUNCTION IF EXISTS pg_temp.seed_lead(INT, TIMESTAMPTZ, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS pg_temp.after_scheduled(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, BOOLEAN, UUID, UUID);
DROP FUNCTION IF EXISTS pg_temp.step(UUID, TEXT, TIMESTAMPTZ, UUID, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS pg_temp.slot(TIMESTAMPTZ, INT, INT);
DROP FUNCTION IF EXISTS pg_temp.business(TIMESTAMPTZ);
DROP FUNCTION IF EXISTS pg_temp.pick(TEXT[]);
DROP FUNCTION IF EXISTS pg_temp.rand_int(INT, INT);
DROP FUNCTION IF EXISTS pg_temp.local_minutes(TIMESTAMPTZ);
DROP FUNCTION IF EXISTS pg_temp.local_day(TIMESTAMPTZ);
DROP FUNCTION IF EXISTS pg_temp.at_local(DATE, INT);

COMMIT;
