-- =============================================================================
-- CRM Instituto Décio Carrilho — schema completo
-- Execute este arquivo inteiro no SQL Editor do Supabase (ou via `supabase db push`).
-- É idempotente o suficiente para um projeto novo; não rode duas vezes num banco
-- já populado sem revisar.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles — extensão de auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dentist')),
  active BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE = usuário desativado (também banido no Auth)
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- leads — cada contato que chegou via WhatsApp/telefone
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do paciente
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10,13}$'),  -- só dígitos, com DDD, sem +55
  notes TEXT,

  -- Origem e rastreio
  source TEXT NOT NULL CHECK (source IN ('google_ads', 'google_organico', 'gmn', 'instagram', 'indicacao', 'retorno', 'outro')),
  campaign TEXT,            -- nome da campanha como no Google Ads (ex: "IDC | Urgência e Canal")
  keyword TEXT,             -- palavra-chave que gerou o clique
  ad_group TEXT,
  landing_page TEXT,        -- ex: "/urgencia"
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Serviço de interesse
  service TEXT CHECK (service IN (
    'clinica_geral', 'implante', 'protese_protocolo', 'estetica',
    'preventivo', 'canal', 'extracao', 'clareamento', 'lente_contato',
    'ortodontia', 'odontopediatria', 'fisioterapia', 'sono', 'outro'
  )),
  service_detail TEXT,

  -- Status do funil
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo', 'em_contato', 'agendado', 'confirmado',
    'compareceu', 'nao_compareceu', 'cancelado', 'perdido'
  )),

  -- Datas do funil (UTC)
  contacted_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,

  estimated_value DECIMAL(10,2) CHECK (estimated_value IS NULL OR estimated_value >= 0),

  -- Vínculo com lead anterior do mesmo telefone (regra de duplicados)
  parent_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Metadados
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_at ON public.leads(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON public.leads(lower(btrim(campaign)));

-- -----------------------------------------------------------------------------
-- lead_history — auditoria de mudanças de status (imutável)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  old_status TEXT,                 -- NULL = criação do lead
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON public.lead_history(lead_id);

-- -----------------------------------------------------------------------------
-- daily_metrics — Google Ads por dia e campanha
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  campaign TEXT NOT NULL CHECK (length(btrim(campaign)) > 0),

  impressions INTEGER DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER DEFAULT 0 CHECK (clicks >= 0),
  cost DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
  conversions INTEGER DEFAULT 0 CHECK (conversions >= 0),

  -- Calculadas a partir do CRM (mantidas por trigger — não editar à mão)
  leads_total INTEGER DEFAULT 0,        -- leads google_ads dessa campanha criados no dia (fuso America/Bahia)
  leads_agendados INTEGER DEFAULT 0,    -- desses, quantos estão agendado/confirmado/compareceu

  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(date, campaign)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(date);

-- -----------------------------------------------------------------------------
-- gmn_metrics — Google Meu Negócio (entrada manual semanal/mensal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gmn_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  search_views INTEGER DEFAULT 0 CHECK (search_views >= 0),
  maps_views INTEGER DEFAULT 0 CHECK (maps_views >= 0),

  website_clicks INTEGER DEFAULT 0 CHECK (website_clicks >= 0),
  direction_requests INTEGER DEFAULT 0 CHECK (direction_requests >= 0),
  phone_calls INTEGER DEFAULT 0 CHECK (phone_calls >= 0),

  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  average_rating DECIMAL(2,1) CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5)),
  new_reviews INTEGER DEFAULT 0 CHECK (new_reviews >= 0),

  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_gmn_metrics_period ON public.gmn_metrics(period_end);

-- -----------------------------------------------------------------------------
-- app_settings — personalização do CRM + concorrentes (linha única, id = 1)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  clinic_name TEXT NOT NULL DEFAULT 'Instituto Décio Carrilho',
  crm_name TEXT NOT NULL DEFAULT 'IDC CRM',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0D6E6E' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color TEXT NOT NULL DEFAULT '#E8B931' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  competitors JSONB NOT NULL DEFAULT '[
    {"name": "Dental Studio", "rating": 5.0, "reviews": 304},
    {"name": "Oralprime", "rating": 5.0, "reviews": 253},
    {"name": "Quero Sorrir", "rating": 4.9, "reviews": 313},
    {"name": "DENTEBRAS", "rating": 4.9, "reviews": 213},
    {"name": "Dr. Giullian Braun", "rating": 4.9, "reviews": 140},
    {"name": "+Sorriso", "rating": 5.0, "reviews": 127},
    {"name": "Sorria Bahia", "rating": 4.9, "reviews": 62}
  ]'::jsonb CHECK (jsonb_typeof(competitors) = 'array'),
  whatsapp_message TEXT NOT NULL DEFAULT 'Olá {nome}! Aqui é do Instituto Décio Carrilho. Recebemos seu contato e estamos à disposição para ajudar.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Funções auxiliares
-- =============================================================================

-- É admin ativo? (SECURITY DEFINER evita recursão de RLS em profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND active
  );
$$;

-- Usuário autenticado e ativo?
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND active
  );
$$;

-- Transições de status permitidas (regra de negócio nº 2)
CREATE OR REPLACE FUNCTION public.lead_status_transition_allowed(p_from TEXT, p_to TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_from
    WHEN 'novo'           THEN p_to IN ('em_contato', 'perdido')
    WHEN 'em_contato'     THEN p_to IN ('agendado', 'perdido', 'cancelado')
    WHEN 'agendado'       THEN p_to IN ('confirmado', 'cancelado', 'perdido')
    WHEN 'confirmado'     THEN p_to IN ('compareceu', 'nao_compareceu', 'cancelado')
    WHEN 'nao_compareceu' THEN p_to IN ('agendado')
    WHEN 'cancelado'      THEN p_to IN ('agendado')
    WHEN 'perdido'        THEN p_to IN ('em_contato')
    ELSE FALSE
  END;
$$;

-- =============================================================================
-- Triggers
-- =============================================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS daily_metrics_updated_at ON public.daily_metrics;
CREATE TRIGGER daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS gmn_metrics_updated_at ON public.gmn_metrics;
CREATE TRIGGER gmn_metrics_updated_at
  BEFORE UPDATE ON public.gmn_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Só admin altera role/active; ninguém se promove sozinho.
-- (auth.uid() NULL = service role / SQL editor: permitido)
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.active IS DISTINCT FROM OLD.active)
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar perfil de acesso ou status do usuário'
      USING ERRCODE = '42501';
  END IF;
  IF auth.uid() IS NOT NULL AND NEW.id = auth.uid()
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.active IS DISTINCT FROM OLD.active) THEN
    RAISE EXCEPTION 'Você não pode alterar o próprio perfil de acesso ou se desativar'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileges ON public.profiles;
CREATE TRIGGER profiles_protect_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Regras de negócio do funil (regras 1, 2 e 3) + datas automáticas
CREATE OR REPLACE FUNCTION public.enforce_lead_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Regra 1: todo lead começa como "novo"
    IF NEW.status IS DISTINCT FROM 'novo' THEN
      RAISE EXCEPTION 'Todo lead deve ser criado com status "novo" (recebido: %)', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
    -- Datas do funil só fazem sentido após mudanças de status
    NEW.contacted_at := NULL;
    NEW.confirmed_at := NULL;
    NEW.attended_at  := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Regra 2: fluxo permitido
    IF NOT public.lead_status_transition_allowed(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'Transição de status não permitida: % → %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    -- Regra 3: ao agendar, scheduled_at é obrigatório
    IF NEW.status = 'agendado' AND NEW.scheduled_at IS NULL THEN
      RAISE EXCEPTION 'Informe a data e hora da consulta para agendar o lead'
        USING ERRCODE = 'not_null_violation';
    END IF;

    -- Datas automáticas do funil
    IF NEW.status = 'em_contato' AND NEW.contacted_at IS NULL THEN
      NEW.contacted_at := NOW();
    ELSIF NEW.status = 'agendado' THEN
      NEW.contacted_at := COALESCE(NEW.contacted_at, NOW());
      -- reagendamento zera confirmação/comparecimento anteriores
      NEW.confirmed_at := NULL;
      NEW.attended_at  := NULL;
    ELSIF NEW.status = 'confirmado' THEN
      NEW.confirmed_at := COALESCE(NEW.confirmed_at, NOW());
    ELSIF NEW.status = 'compareceu' THEN
      NEW.attended_at := COALESCE(NEW.attended_at, NOW());
    END IF;
  ELSIF NEW.status = 'agendado' AND NEW.scheduled_at IS NULL THEN
    -- não permite "desagendar" um lead agendado limpando a data
    RAISE EXCEPTION 'Lead agendado precisa ter data e hora da consulta'
      USING ERRCODE = 'not_null_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_enforce_rules ON public.leads;
CREATE TRIGGER leads_enforce_rules
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_lead_rules();

-- Regra 5: leads nunca são excluídos (auditoria) — vale até para service role
CREATE OR REPLACE FUNCTION public.prevent_lead_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Leads não podem ser excluídos. Marque como "perdido".'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS leads_prevent_delete ON public.leads;
CREATE TRIGGER leads_prevent_delete
  BEFORE DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.prevent_lead_delete();

-- Histórico: registra criação e toda mudança de status.
-- A nota opcional vem de set_config('app.status_note', ..., true) — ver change_lead_status().
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note TEXT := NULLIF(current_setting('app.status_note', true), '');
  v_actor UUID := COALESCE(auth.uid(), NEW.created_by);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_history (lead_id, old_status, new_status, changed_by, note)
    VALUES (NEW.id, NULL, NEW.status, v_actor, COALESCE(v_note, 'Lead cadastrado'));
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_history (lead_id, old_status, new_status, changed_by, note)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), v_note);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_status_change ON public.leads;
CREATE TRIGGER lead_status_change
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();

-- Contadores do CRM em daily_metrics (leads_total / leads_agendados)
CREATE OR REPLACE FUNCTION public.refresh_daily_metrics_leads(p_date DATE, p_campaign TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.daily_metrics dm
  SET leads_total = c.total,
      leads_agendados = c.agendados
  FROM (
    SELECT
      COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE l.status IN ('agendado', 'confirmado', 'compareceu'))::INT AS agendados
    FROM public.leads l
    WHERE l.source = 'google_ads'
      AND (l.created_at AT TIME ZONE 'America/Bahia')::DATE = p_date
      AND lower(btrim(l.campaign)) = lower(btrim(p_campaign))
  ) c
  WHERE dm.date = p_date
    AND lower(btrim(dm.campaign)) = lower(btrim(p_campaign))
    AND (dm.leads_total IS DISTINCT FROM c.total OR dm.leads_agendados IS DISTINCT FROM c.agendados);
$$;

CREATE OR REPLACE FUNCTION public.leads_sync_daily_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE') AND OLD.campaign IS NOT NULL THEN
    PERFORM public.refresh_daily_metrics_leads((OLD.created_at AT TIME ZONE 'America/Bahia')::DATE, OLD.campaign);
  END IF;
  IF NEW.campaign IS NOT NULL THEN
    PERFORM public.refresh_daily_metrics_leads((NEW.created_at AT TIME ZONE 'America/Bahia')::DATE, NEW.campaign);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS leads_sync_daily_metrics ON public.leads;
CREATE TRIGGER leads_sync_daily_metrics
  AFTER INSERT OR UPDATE OF status, source, campaign, created_at ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_sync_daily_metrics();

CREATE OR REPLACE FUNCTION public.daily_metrics_fill_leads()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE l.status IN ('agendado', 'confirmado', 'compareceu'))::INT
  INTO NEW.leads_total, NEW.leads_agendados
  FROM public.leads l
  WHERE l.source = 'google_ads'
    AND (l.created_at AT TIME ZONE 'America/Bahia')::DATE = NEW.date
    AND lower(btrim(l.campaign)) = lower(btrim(NEW.campaign));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_metrics_fill_leads ON public.daily_metrics;
CREATE TRIGGER daily_metrics_fill_leads
  BEFORE INSERT OR UPDATE OF date, campaign ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.daily_metrics_fill_leads();

-- Criar profile automaticamente ao registrar usuário (contas criadas só pelo admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := NEW.raw_user_meta_data->>'role';
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('admin', 'dentist') THEN
    v_role := 'dentist';
  END IF;
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email),
    NEW.email,
    v_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RPC: mudança de status com nota no histórico
-- supabase.rpc('change_lead_status', { p_lead_id, p_status, p_scheduled_at, p_note })
-- SECURITY INVOKER: RLS e triggers de regra continuam valendo.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.change_lead_status(
  p_lead_id UUID,
  p_status TEXT,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS public.leads
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_lead public.leads;
BEGIN
  PERFORM set_config('app.status_note', COALESCE(btrim(p_note), ''), true);

  UPDATE public.leads
  SET status = p_status,
      scheduled_at = CASE WHEN p_status = 'agendado' THEN COALESCE(p_scheduled_at, scheduled_at) ELSE scheduled_at END
  WHERE id = p_lead_id
  RETURNING * INTO v_lead;

  PERFORM set_config('app.status_note', '', true);

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead não encontrado' USING ERRCODE = 'no_data_found';
  END IF;

  RETURN v_lead;
END;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmn_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: equipe pequena — todos os usuários ativos veem todos os profiles
DROP POLICY IF EXISTS "Profiles visíveis para autenticados" ON public.profiles;
CREATE POLICY "Profiles visíveis para autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_active_user() OR id = auth.uid());

DROP POLICY IF EXISTS "Usuário edita próprio profile" ON public.profiles;
CREATE POLICY "Usuário edita próprio profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND public.is_active_user())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admin edita profiles" ON public.profiles;
CREATE POLICY "Admin edita profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Leads: equipe ativa vê, cria e edita. Sem política de DELETE (regra 5).
DROP POLICY IF EXISTS "Leads visíveis para autenticados" ON public.leads;
CREATE POLICY "Leads visíveis para autenticados"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS "Leads criados por autenticados" ON public.leads;
CREATE POLICY "Leads criados por autenticados"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Leads editados por autenticados" ON public.leads;
CREATE POLICY "Leads editados por autenticados"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

-- Histórico: leitura para a equipe; escrita só pelo trigger (SECURITY DEFINER).
DROP POLICY IF EXISTS "Histórico visível para autenticados" ON public.lead_history;
CREATE POLICY "Histórico visível para autenticados"
  ON public.lead_history FOR SELECT
  TO authenticated
  USING (public.is_active_user());

-- Métricas Google Ads: todos veem, admin insere/edita/exclui
DROP POLICY IF EXISTS "Métricas visíveis para autenticados" ON public.daily_metrics;
CREATE POLICY "Métricas visíveis para autenticados"
  ON public.daily_metrics FOR SELECT
  TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin gerencia métricas" ON public.daily_metrics;
CREATE POLICY "Admin gerencia métricas"
  ON public.daily_metrics FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GMN: mesma lógica
DROP POLICY IF EXISTS "GMN visível para autenticados" ON public.gmn_metrics;
CREATE POLICY "GMN visível para autenticados"
  ON public.gmn_metrics FOR SELECT
  TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin gerencia GMN" ON public.gmn_metrics;
CREATE POLICY "Admin gerencia GMN"
  ON public.gmn_metrics FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Configurações: marca visível até na tela de login; só admin edita
DROP POLICY IF EXISTS "Configurações visíveis" ON public.app_settings;
CREATE POLICY "Configurações visíveis"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin edita configurações" ON public.app_settings;
CREATE POLICY "Admin edita configurações"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin() AND id = 1);

-- Funções expostas via RPC
REVOKE ALL ON FUNCTION public.change_lead_status(UUID, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_lead_status(UUID, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.refresh_daily_metrics_leads(DATE, TEXT) FROM PUBLIC;

-- =============================================================================
-- Realtime: novos leads / kanban / dashboard ao vivo
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lead_history'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_history;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_metrics'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_metrics;
    END IF;
  END IF;
END;
$$;
