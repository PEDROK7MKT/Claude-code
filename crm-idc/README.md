# CRM Instituto Décio Carrilho

Painel de gestão do funil de marketing digital do **Instituto Décio Carrilho (IDC)** —
clínica odontológica em Barreiras/BA. Rastreia o caminho completo:
**clique no anúncio do Google Ads → mensagem no WhatsApp → agendamento → comparecimento**,
e responde a pergunta central: _quantos leads vieram dos anúncios, quantos viraram
agendamento e qual o custo real por paciente agendado_.

- Especificação funcional: [`docs/SPEC.md`](docs/SPEC.md)
- Arquitetura e convenções: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Banco de dados (schema, RLS, testes, seed): [`supabase/README.md`](supabase/README.md)
- Webhook de entrada de leads: [`docs/WEBHOOK.md`](docs/WEBHOOK.md)

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth + Realtime + RLS) ·
Tailwind CSS v4 + shadcn/ui · Recharts · TanStack Query (cache offline no IndexedDB) ·
Lucide · deploy na Vercel.

## Perfis

| Perfil | Acesso |
| --- | --- |
| **Gestor de tráfego** (`admin`) | Tudo: dashboard completo, leads, kanban, métricas Google Ads e GMN (edição), relatórios, configurações e usuários |
| **Dentista** (`dentist`) | Dashboard simplificado, leads e kanban (atualiza status de agendamento/comparecimento), métricas e relatórios em modo leitura |

## Rodando localmente

Pré-requisitos: Node.js 20+ e um projeto Supabase (gratuito serve).

```bash
cd crm-idc
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev                  # http://localhost:3000
```

Scripts úteis:

```bash
npm run build       # build de produção
npm run typecheck   # checagem de tipos
npm run lint        # ESLint
npm test            # testes unitários (vitest)
bash supabase/tests/run.sh   # testes do banco num Postgres 16 local (regras de negócio + RLS)
```

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) — de preferência na região
   **São Paulo (sa-east-1)**.
2. Abra **SQL Editor** e execute o arquivo inteiro
   [`supabase/migrations/0001_schema.sql`](supabase/migrations/0001_schema.sql)
   (tabelas, índices, RLS, triggers de regra de negócio, RPC e Realtime).
3. **Authentication → Sign In / Providers**: deixe habilitado apenas **Email** e
   **desative "Allow new users to sign up"** (não há cadastro público — só o admin cria contas).
4. Crie o primeiro usuário admin em **Authentication → Users → Add user** (marque
   "Auto Confirm User") e depois rode no SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'admin', full_name = 'Seu Nome'
   WHERE email = 'seu-email@exemplo.com';
   ```
5. (Opcional) Carregue dados de demonstração com [`supabase/seed.sql`](supabase/seed.sql).
6. Em **Project Settings → API** copie `Project URL`, `anon public key` e
   `service_role key` para o `.env.local` (e depois para a Vercel).

## Deploy na Vercel com domínio próprio

1. Importe o repositório em [vercel.com/new](https://vercel.com/new) e defina
   **Root Directory = `crm-idc`** (o framework Next.js é detectado sozinho).
2. Em **Settings → Environment Variables** cadastre:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `WEBHOOK_SECRET` e `WEBHOOK_ALLOWED_ORIGINS`.
3. **Settings → Domains → Add**: `crm.institutodeciocarrilho.com.br`
   (ou `painel.institutodeciocarrilho.com.br`).
4. No DNS do domínio, crie um registro **CNAME** `crm` → `cname.vercel-dns.com`.
5. No Supabase, em **Authentication → URL Configuration**, defina o **Site URL** como
   `https://crm.institutodeciocarrilho.com.br`.

## Primeiro acesso

1. O admin entra no CRM e, em **Configurações → Usuários**, cria a conta do Dr. Décio
   (perfil _Dentista_) com e-mail e senha.
2. Dr. Décio faz login com o e-mail e a senha fornecidos.
3. Comece a cadastrar leads (manualmente em **Leads → Novo lead** ou automaticamente pelo
   webhook) e a lançar as métricas diárias do Google Ads (formulário ou importação CSV).

## Regras de negócio garantidas pelo banco

1. Todo lead nasce com status **novo**.
2. Fluxo de status permitido:
   `novo → em contato | perdido` · `em contato → agendado | perdido | cancelado` ·
   `agendado → confirmado | cancelado | perdido` ·
   `confirmado → compareceu | não compareceu | cancelado` ·
   `não compareceu → agendado` · `cancelado → agendado` · `perdido → em contato`.
3. Agendar exige data e hora da consulta.
4. Telefone duplicado gera alerta com opção de abrir, vincular ou criar novo lead.
5. Leads nunca são excluídos — apenas marcados como perdidos (auditoria completa em `lead_history`).
6. Datas gravadas em UTC e exibidas no fuso **America/Bahia**.
7. O CRM cruza leads do dia com o custo do Google Ads para calcular o **CPL real**.

As regras 1, 2, 3 e 5 são aplicadas por triggers no Postgres (valem até para chamadas
diretas à API) e também validadas na interface.
