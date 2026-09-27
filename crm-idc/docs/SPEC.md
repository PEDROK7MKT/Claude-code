# CRM Instituto Décio Carrilho — Prompt de Construção Completo

> **O que é este documento:** um prompt técnico completo para gerar um CRM web para clínica odontológica. Cole este documento inteiro em qualquer ferramenta de código com IA (Cursor, Bolt, v0, Claude Code, etc.) para gerar o projeto funcional.

---

## 1. VISÃO GERAL

Construa um CRM web completo para o **Instituto Décio Carrilho (IDC)**, clínica odontológica em Barreiras/BA. O sistema rastreia o funil de marketing digital da clínica: desde o clique no anúncio do Google Ads, passando pela mensagem no WhatsApp, até o agendamento confirmado.

**Objetivo central:** saber exatamente quantos leads vieram dos anúncios, quantos viraram agendamento, e qual o custo real por paciente agendado.

**Usuários:** 2 perfis
- **Gestor de tráfego** (admin) — vê tudo: métricas de campanha, leads, funil, GMN, relatórios
- **Dr. Décio** (dentista) — vê leads, atualiza status de agendamento/comparecimento, vê dashboard resumido

**Deploy:** domínio próprio do IDC (subdomínio tipo `crm.institutodeciocarrilho.com.br` ou `painel.institutodeciocarrilho.com.br`)

---

## 2. STACK TÉCNICO

- **Framework:** Next.js 14+ (App Router)
- **Banco de dados + Auth:** Supabase (PostgreSQL + Auth + Realtime + Row Level Security)
- **Estilo:** Tailwind CSS + shadcn/ui
- **Ícones:** Lucide React
- **Charts:** Recharts
- **Deploy:** Vercel (com custom domain)
- **Linguagem:** TypeScript
- **Formato de datas:** dd/MM/yyyy (padrão brasileiro), timezone America/Bahia (GMT-3)
- **Moeda:** BRL (R$), formatação brasileira (1.234,56)

---

## 3. SCHEMA DO BANCO DE DADOS (Supabase/PostgreSQL)

### Tabela `profiles`
Extensão da tabela `auth.users` do Supabase.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dentist')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `leads`
Cada lead = um contato que chegou via WhatsApp ou telefone.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do paciente
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  
  -- Origem e rastreio
  source TEXT NOT NULL CHECK (source IN ('google_ads', 'google_organico', 'gmn', 'instagram', 'indicacao', 'retorno', 'outro')),
  campaign TEXT,            -- nome da campanha (ex: "IDC | Urgência e Canal")
  keyword TEXT,             -- palavra-chave que gerou o clique (ex: "dentista barreiras")
  ad_group TEXT,            -- grupo de anúncios
  landing_page TEXT,        -- página de destino (ex: "/urgencia")
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
  service_detail TEXT,      -- detalhe livre (ex: "dor no dente 36")
  
  -- Status do funil
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo',                 -- acabou de chegar pelo WhatsApp
    'em_contato',           -- recepção respondeu
    'agendado',             -- consulta marcada
    'confirmado',           -- paciente confirmou presença
    'compareceu',           -- veio à consulta
    'nao_compareceu',       -- faltou
    'cancelado',            -- cancelou
    'perdido'               -- não respondeu / desistiu
  )),
  
  -- Datas do funil
  contacted_at TIMESTAMPTZ,       -- quando a recepção respondeu
  scheduled_at TIMESTAMPTZ,       -- data/hora da consulta agendada
  confirmed_at TIMESTAMPTZ,       -- quando confirmou presença
  attended_at TIMESTAMPTZ,        -- quando compareceu
  
  -- Valor (opcional, pra futuro)
  estimated_value DECIMAL(10,2),  -- valor estimado do procedimento
  
  -- Metadados
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_scheduled_at ON leads(scheduled_at);
```

### Tabela `lead_history`
Log de todas as mudanças de status (auditoria).

```sql
CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_history_lead_id ON lead_history(lead_id);
```

### Tabela `daily_metrics`
Métricas diárias do Google Ads (preenchidas manualmente ou via import).

```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  campaign TEXT NOT NULL,
  
  -- Métricas do Google Ads
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,        -- custo em R$
  conversions INTEGER DEFAULT 0,        -- conversões registradas no Google Ads
  
  -- Métricas calculadas (do CRM)
  leads_total INTEGER DEFAULT 0,        -- leads que entraram nesse dia
  leads_agendados INTEGER DEFAULT 0,    -- leads que agendaram
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, campaign)
);
```

### Tabela `gmn_metrics`
Métricas do Google Meu Negócio (entrada manual semanal/mensal).

```sql
CREATE TABLE gmn_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Visibilidade
  search_views INTEGER DEFAULT 0,       -- visualizações na busca
  maps_views INTEGER DEFAULT 0,         -- visualizações no Maps
  
  -- Ações
  website_clicks INTEGER DEFAULT 0,
  direction_requests INTEGER DEFAULT 0,
  phone_calls INTEGER DEFAULT 0,
  
  -- Reviews
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  new_reviews INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Ativar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmn_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuário vê todos os profiles (equipe pequena)
CREATE POLICY "Profiles visíveis para autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuário edita próprio profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Leads: todos autenticados veem e editam (equipe de 2)
CREATE POLICY "Leads visíveis para autenticados"
  ON leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead history: todos veem, sistema insere
CREATE POLICY "Histórico visível para autenticados"
  ON lead_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Métricas: todos veem, admin insere/edita
CREATE POLICY "Métricas visíveis para autenticados"
  ON daily_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin gerencia métricas"
  ON daily_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- GMN: mesma lógica
CREATE POLICY "GMN visível para autenticados"
  ON gmn_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin gerencia GMN"
  ON gmn_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Triggers automáticos

```sql
-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Registrar mudança de status no histórico
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO lead_history (lead_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lead_status_change
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- Criar profile automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'dentist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 4. FUNCIONALIDADES

### 4.1 Autenticação
- Login com email + senha (Supabase Auth)
- Sem cadastro público — apenas o admin cria contas
- Tela de login com logo do IDC, fundo clean
- Redirect automático pós-login baseado no role

### 4.2 Dashboard (página inicial)

**Para o Admin (gestor de tráfego):**

Cards de KPI no topo (período selecionável: hoje, 7 dias, 30 dias, mês atual):
- **Leads totais** — número + variação vs período anterior (↑↓%)
- **Taxa de agendamento** — (agendados + confirmados + compareceu) / leads totais × 100
- **Custo por lead** — gasto total Google Ads / leads totais
- **Custo por agendamento** — gasto total / agendamentos
- **Investimento total** — soma do `cost` em daily_metrics

Gráficos:
- **Linha:** Leads por dia (últimos 30 dias) com linha de tendência
- **Barras empilhadas:** Leads por status (novo, em contato, agendado, compareceu, perdido)
- **Pizza/Donut:** Leads por fonte (Google Ads, GMN, Orgânico, Indicação, etc.)
- **Barras horizontais:** Top 5 palavras-chave por número de leads

Seção GMN (card lateral):
- Nota média atual
- Total de avaliações
- Visualizações na busca (último período)
- Cliques no site
- Solicitações de rota

**Para o Dentista (Dr. Décio):**

Dashboard simplificado:
- **Leads novos hoje** (card grande, destaque)
- **Agendamentos da semana** (lista com nome, telefone, data/hora, serviço)
- **Taxa de comparecimento** do mês
- **Leads aguardando resposta** (status "novo")

### 4.3 Gestão de Leads

**Lista de leads** (tabela responsiva):
- Colunas: Nome, Telefone (clicável → abre WhatsApp), Fonte, Serviço, Status (badge colorido), Data de entrada, Agendamento
- Filtros: por status, por fonte, por serviço, por período
- Busca por nome ou telefone
- Ordenação por qualquer coluna
- Paginação (20 por página)

**Cores dos status (badges):**
- Novo → azul
- Em contato → amarelo
- Agendado → roxo
- Confirmado → azul escuro
- Compareceu → verde
- Não compareceu → vermelho
- Cancelado → cinza
- Perdido → cinza escuro

**Modal/página de detalhes do lead:**
- Todos os campos editáveis
- Timeline do histórico de mudanças de status (quem mudou, quando, nota)
- Botão rápido de WhatsApp (abre `wa.me/55{phone}` com mensagem pré-preenchida)
- Botões de ação rápida: Marcar como Agendado (abre date picker), Compareceu, Não Compareceu, Perdido

**Cadastro de novo lead:**
- Formulário com campos obrigatórios: Nome, Telefone, Fonte
- Se fonte = "google_ads": campos adicionais de campanha, palavra-chave, landing page
- Seletor de serviço (dropdown com os serviços do IDC)
- Campo de notas livre

### 4.4 Kanban do Funil (visualização alternativa)

Board estilo Trello com colunas:
```
[Novo] → [Em Contato] → [Agendado] → [Confirmado] → [Compareceu]
                                                        ↘ [Não Compareceu]
                          [Cancelado]   [Perdido]
```

- Cards arrastáveis entre colunas (drag & drop)
- Cada card mostra: nome, telefone, serviço, tempo desde entrada
- Contador no topo de cada coluna
- Ao arrastar, registra automaticamente a mudança no histórico

### 4.5 Métricas do Google Ads

Página para inserir/editar métricas diárias do Google Ads:
- Formulário: data, campanha, impressões, cliques, custo, conversões
- Tabela com histórico
- Import via CSV (formato: data, campanha, impressões, cliques, custo, conversões)
- Gráficos automáticos:
  - CTR por dia (cliques/impressões × 100)
  - CPC médio por dia (custo/cliques)
  - Custo por conversão por dia
  - Comparativo: conversões Google Ads vs leads reais no CRM

### 4.6 Métricas do Google Meu Negócio

Página para inserir métricas do GMN (periodicidade semanal ou mensal):
- Formulário: período, visualizações busca, visualizações Maps, cliques site, rotas, ligações, reviews total, nota média, reviews novos
- Gráfico de evolução ao longo do tempo
- Card de destaque: nota atual e total de avaliações (comparar com concorrentes — valores fixos na UI):

```
Concorrentes em Barreiras:
Dental Studio      — 5,0 ★ (304 avaliações)
Oralprime           — 5,0 ★ (253 avaliações)
Quero Sorrir        — 4,9 ★ (313 avaliações)
DENTEBRAS           — 4,9 ★ (213 avaliações)
IDC                 — 4,9 ★ (XX avaliações) ← dinâmico do CRM
```

### 4.7 Relatórios

Página de relatório mensal gerável:
- Seletor de mês
- Resumo automático com todos os KPIs do período
- Tabela de leads do período com status final
- Gráficos do período
- Botão "Exportar PDF" (gerar PDF do relatório)
- Botão "Exportar CSV" (exportar leads do período)

### 4.8 Configurações (só admin)

- Gerenciar usuários (criar, editar role, desativar)
- Dados fixos dos concorrentes (pra comparativo GMN)
- Personalização do CRM (logo, nome, cores)

---

## 5. UI/UX

### Design geral
- **Tema:** profissional, limpo, moderno
- **Cores principais:** baseado na identidade do IDC
  - Primária: `#0D6E6E` (verde-azulado/teal — cor do site do IDC)
  - Secundária: `#F5F5F5` (cinza claro para backgrounds)
  - Acento: `#E8B931` (dourado — detalhe premium)
  - Texto: `#1A1A1A`
  - Sucesso: `#22C55E`
  - Alerta: `#EAB308`
  - Erro: `#EF4444`
- **Fonte:** Inter (Google Fonts)
- **Layout:** sidebar fixa à esquerda + conteúdo à direita
- **Mobile:** sidebar vira hamburger menu, tabelas viram cards empilhados

### Sidebar (navegação)
```
🏥 IDC CRM              (logo + nome no topo)
─────────────────────
📊 Dashboard
👥 Leads
📋 Kanban
📈 Google Ads
🗺️ Google Meu Negócio
📄 Relatórios
⚙️ Configurações        (só admin)
─────────────────────
👤 [Nome do usuário]
   Sair
```

### Responsividade
- Desktop: sidebar fixa 240px + conteúdo fluido
- Tablet: sidebar colapsável (ícones only)
- Mobile: hamburger menu + layout em stack
- Tabelas em mobile viram cards com as informações empilhadas
- Dashboard em mobile: cards em coluna única, gráficos full-width

### Componentes especiais
- **Toast notifications** para feedback de ações (lead salvo, status alterado, etc.)
- **Confirmação** antes de ações destrutivas (deletar lead, mudar pra "perdido")
- **Loading states** com skeletons em todas as páginas
- **Empty states** com ilustração + CTA quando não tem dados
- **Badge de "novos leads"** no menu lateral (contador em tempo real via Supabase Realtime)

---

## 6. INTEGRAÇÕES

### 6.1 UTM Tracking (automático)

O site do IDC (institutodeciocarrilho.com.br) já envia leads via WhatsApp. Para que o CRM capture a origem automaticamente, implementar uma das opções:

**Opção A — Webhook de entrada (recomendada):**
Criar uma API route `/api/webhook/lead` que recebe dados de um formulário ou bot de WhatsApp:

```typescript
// app/api/webhook/lead/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  // body: { name, phone, source, campaign, keyword, landing_page, utm_* }
  // Inserir no Supabase
  // Retornar 200
}
```

**Opção B — Cadastro manual com auto-preenchimento de UTMs:**
Ao cadastrar lead manualmente, se o gestor colar a URL que o lead acessou, o sistema parseia os UTMs automaticamente.

### 6.2 Google Meu Negócio

**Fase 1 (MVP — entrada manual):**
- Tela para inserir métricas do GMN manualmente (copiar do painel do Google Business Profile)
- Campos: período, visualizações, cliques, ligações, rotas, reviews

**Fase 2 (futura — API):**
- Integração com Google Business Profile API
- OAuth2 com conta do Google do IDC
- Pull automático de métricas e reviews
- Necessita: Google Cloud Project, Business Profile API habilitada, conta verificada

### 6.3 Supabase Realtime

- Notificação em tempo real quando novo lead é cadastrado (badge no menu + toast)
- Atualização automática do Kanban quando outro usuário move um card
- Dashboard atualiza KPIs em tempo real

```typescript
// Subscription para leads em tempo real
const channel = supabase
  .channel('leads-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leads' },
    (payload) => {
      // Atualizar estado local
    }
  )
  .subscribe();
```

---

## 7. DADOS INICIAIS

### Serviços disponíveis (usar em dropdowns)
```typescript
const SERVICES = [
  { value: 'clinica_geral', label: 'Clínica Geral' },
  { value: 'implante', label: 'Implante Dentário' },
  { value: 'protese_protocolo', label: 'Prótese / Protocolo' },
  { value: 'estetica', label: 'Estética Dental' },
  { value: 'preventivo', label: 'Tratamento Preventivo' },
  { value: 'canal', label: 'Tratamento de Canal' },
  { value: 'extracao', label: 'Extração' },
  { value: 'clareamento', label: 'Clareamento' },
  { value: 'lente_contato', label: 'Lentes de Contato Dental' },
  { value: 'ortodontia', label: 'Ortodontia' },
  { value: 'odontopediatria', label: 'Odontopediatria' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'sono', label: 'Odontologia do Sono' },
  { value: 'outro', label: 'Outro' },
] as const;
```

### Fontes de lead
```typescript
const LEAD_SOURCES = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'google_organico', label: 'Google (orgânico)' },
  { value: 'gmn', label: 'Google Meu Negócio' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'retorno', label: 'Paciente retorno' },
  { value: 'outro', label: 'Outro' },
] as const;
```

### Campanhas ativas (atualizar conforme necessário)
```typescript
const CAMPAIGNS = [
  { value: 'idc_urgencia_canal', label: 'IDC | Urgência e Canal' },
  { value: 'idc_implante', label: 'IDC | Implante Dentário' },
] as const;
```

### Concorrentes GMN (dados fixos para comparativo)
```typescript
const COMPETITORS = [
  { name: 'Dental Studio', rating: 5.0, reviews: 304 },
  { name: 'Oralprime', rating: 5.0, reviews: 253 },
  { name: 'Quero Sorrir', rating: 4.9, reviews: 313 },
  { name: 'DENTEBRAS', rating: 4.9, reviews: 213 },
  { name: 'Dr. Giullian Braun', rating: 4.9, reviews: 140 },
  { name: '+Sorriso', rating: 5.0, reviews: 127 },
  { name: 'Sorria Bahia', rating: 4.9, reviews: 62 },
] as const;
```

---

## 8. PÁGINAS E ROTAS

```
/login                    → Tela de login
/                         → Dashboard (redireciona pra /dashboard)
/dashboard                → Dashboard com KPIs e gráficos
/leads                    → Lista de leads (tabela + filtros)
/leads/novo               → Cadastro de novo lead
/leads/[id]               → Detalhe/edição do lead
/kanban                   → Visão Kanban do funil
/google-ads               → Métricas do Google Ads
/gmn                      → Métricas do Google Meu Negócio
/relatorios               → Geração de relatórios
/configuracoes            → Configurações (admin only)
/api/webhook/lead         → API para receber leads automaticamente
```

---

## 9. VARIÁVEIS DE AMBIENTE

```env
NEXT_PUBLIC_SUPABASE_URL=<url-do-projeto-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## 10. REGRAS DE NEGÓCIO

1. **Todo lead começa como "novo"** — não pode ser criado em outro status
2. **Fluxo permitido de status:**
   - novo → em_contato, perdido
   - em_contato → agendado, perdido, cancelado
   - agendado → confirmado, cancelado, perdido
   - confirmado → compareceu, nao_compareceu, cancelado
   - nao_compareceu → agendado (reagendar)
   - cancelado → agendado (reagendar)
   - perdido → em_contato (reativar)
3. **Ao agendar:** campo `scheduled_at` é obrigatório (data e hora da consulta)
4. **Leads duplicados:** se o telefone já existe no banco, alertar o usuário e dar opção de vincular ou criar novo
5. **Exclusão:** leads não podem ser deletados, apenas marcados como "perdido" (auditoria)
6. **Timezone:** todas as datas armazenadas em UTC, exibidas em America/Bahia (GMT-3)
7. **Métricas do Google Ads:** entrada manual diária ou via CSV. O CRM cruza automaticamente a quantidade de leads registrados naquele dia com o custo do Google Ads para calcular CPL real

---

## 11. DEPLOY E CONFIGURAÇÃO

### Supabase
1. Criar projeto no Supabase (região São Paulo se disponível)
2. Executar os SQLs do schema (seção 3)
3. Configurar Auth: habilitar apenas "Email" como provider
4. Criar primeiro usuário admin via Supabase Dashboard (ou via SQL)
5. Copiar URL e keys para .env

### Vercel
1. Conectar repo GitHub
2. Configurar variáveis de ambiente
3. Adicionar custom domain: `crm.institutodeciocarrilho.com.br`
4. Apontar CNAME no DNS do domínio para `cname.vercel-dns.com`

### Primeiro acesso
1. Admin cria conta do Dr. Décio via painel de configurações
2. Dr. Décio faz login com email + senha fornecidos
3. Começar a cadastrar leads manualmente

---

## 12. DETALHES VISUAIS ESPECÍFICOS

### Tela de login
- Centralizada, card branco com sombra sutil
- Logo do IDC no topo (usar placeholder se não tiver o arquivo)
- Campos: Email, Senha
- Botão: "Entrar" (cor primária teal)
- Footer discreto: "Instituto Décio Carrilho — Painel de Gestão"

### Dashboard — Card de KPI
```
┌─────────────────────────┐
│  📊 Leads Totais        │
│  ┌─────┐                │
│  │  47 │  ↑ 12%         │
│  └─────┘  vs período    │
│           anterior      │
└─────────────────────────┘
```

### Kanban — Card de lead
```
┌─────────────────────────┐
│  Maria Silva            │
│  📱 (77) 98765-4321     │
│  🦷 Implante            │
│  🕐 há 2 horas          │
│  ─────────────────────  │
│  Google Ads              │
└─────────────────────────┘
```

### Badge de status
- Usar badges arredondados (rounded-full) com cores suaves
- Texto em minúsculo: "novo", "agendado", "compareceu"
- Cor de fundo com opacidade baixa, texto na cor forte

---

## 13. FEATURES OPCIONAIS (FASE 2 — NÃO INCLUIR NO MVP)

Estas features NÃO devem ser implementadas agora, mas o schema e a arquitetura devem permitir adicioná-las depois:

- [ ] Integração automática com Google Ads API (pull de métricas)
- [ ] Integração com Google Business Profile API (pull de reviews/métricas)
- [ ] Integração com WhatsApp Business API (receber leads automaticamente)
- [ ] Notificação push / email quando novo lead chega
- [ ] Módulo financeiro (valor do procedimento, comissão, ROI)
- [ ] Multi-clínica (expandir para outros clientes)
- [ ] App mobile nativo (React Native / Expo)

---

## INSTRUÇÕES FINAIS PARA A IA

1. **Gere o projeto COMPLETO e funcional** — não pare em "esqueleto" ou "exemplo"
2. **Todo o texto da UI deve estar em português brasileiro**
3. **Use shadcn/ui para TODOS os componentes** — não crie componentes do zero se existe no shadcn
4. **Implemente o Supabase Realtime** para atualizações em tempo real
5. **O kanban deve ter drag & drop funcional** com atualização de status ao mover
6. **Os gráficos devem ser bonitos e responsivos** usando Recharts
7. **Toda ação de CRUD deve ter feedback visual** (toast de sucesso/erro)
8. **O sistema deve funcionar 100% offline-first** — cachear dados localmente quando possível
9. **Implemente loading states e error handling** em todas as páginas
10. **O código deve ser limpo, tipado e bem organizado** — pastas por feature, não por tipo de arquivo
