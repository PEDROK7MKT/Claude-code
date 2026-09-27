# Banco de dados — CRM IDC (Supabase)

```
supabase/
  migrations/0001_schema.sql   # schema, RLS, triggers, RPC, privilégios, realtime
  seed.sql                     # dados de DEMONSTRAÇÃO (opcional)
  tests/
    run.sh                     # sobe um PostgreSQL descartável e roda tudo
    stub_supabase.sql          # o que o Supabase já traz (papéis, auth.*, grants, publicação)
    rules.test.sql             # regras de negócio, RLS e segurança
    seed.test.sql              # checagens do seed
```

## 1. Aplicar a migration

1. No painel do Supabase: **SQL Editor → New query**.
2. Cole o conteúdo inteiro de `migrations/0001_schema.sql` e clique em **Run**.
   (Com a CLI: `supabase link --project-ref <ref>` e `supabase db push`.)

A migration é idempotente: pode ser reaplicada após mudanças. Ela não cria nada
no schema `auth` além do trigger `on_auth_user_created` em `auth.users`
(o que o Supabase permite).

O que fica garantido pelo banco (vale para o app, para o webhook e para o SQL Editor):

| Regra | Como |
| --- | --- |
| 1. Lead nasce `novo` | trigger `leads_enforce_rules` (datas do funil e `created_by` também são controladas) |
| 2. Fluxo de status | `lead_status_transition_allowed()` no mesmo trigger |
| 3. Agendar exige data | `scheduled_at` obrigatório em `agendado`; a RPC exige `p_scheduled_at` para agendar/reagendar |
| 5. Leads nunca são excluídos | `DELETE`/`TRUNCATE` falham para todos (inclusive service role e superusuário) |
| Histórico | `lead_history` gravado só por trigger (criação + cada mudança de status, com nota e autor) |
| Métricas | `daily_metrics.leads_total/leads_agendados` calculados e mantidos por trigger (dia no fuso America/Bahia) |
| Acesso | RLS: usuário **ativo** vê/cria/edita leads; só **admin** escreve métricas, GMN e configurações e altera papel/status de outros usuários; `anon` só lê `app_settings` |

Mudança de status pelo app: `supabase.rpc('change_lead_status', { p_lead_id, p_status, p_scheduled_at, p_note })`.

## 2. Configurar o Auth (obrigatório)

- **Authentication → Sign In / Providers**: deixe só **Email** habilitado.
- **Desative "Allow new users to sign up"** (cadastro público). O sistema não tem
  cadastro público: sem isso, qualquer pessoa com a anon key (que é pública no
  navegador) conseguiria criar uma conta e ver os dados dos pacientes.

## 3. Criar o primeiro admin

O profile (`public.profiles`) é criado automaticamente quando o usuário nasce em
`auth.users`. O papel vem de `app_metadata.role` ou `user_metadata.role`
(`admin` ou `dentist`; qualquer outro valor vira `dentist`) e o nome de
`user_metadata.full_name` (se faltar, usa o email).

**Opção A — pelo painel (mais simples):**

1. **Authentication → Users → Add user → Create new user**, com email e senha,
   marcando **Auto Confirm User**.
2. No **SQL Editor**, promova o usuário e ajuste o nome:

   ```sql
   UPDATE public.profiles
   SET role = 'admin', full_name = 'Nome do Gestor'
   WHERE email = 'gestor@institutodeciocarrilho.com.br';
   ```

**Opção B — pela API admin (service role, ex. num script):**

```ts
await supabaseAdmin.auth.admin.createUser({
  email: "gestor@institutodeciocarrilho.com.br",
  password: "senha-forte",
  email_confirm: true,
  user_metadata: { full_name: "Nome do Gestor", role: "admin" },
  app_metadata: { role: "admin" }, // só a service role grava app_metadata
});
```

Depois, entre no CRM como admin e crie a conta do Dr. Décio em **Configurações**.

Usuários devem ser **desativados** (Configurações), não excluídos: quem já tem
leads ou histórico registrados não pode ser apagado de `auth.users` (a auditoria
aponta para ele).

## 4. Carregar os dados de demonstração (opcional)

1. (Recomendado) Crie antes os usuários admin e dentista — o seed usa esses
   perfis como autores do histórico. O seed **não** cria usuários.
2. No **SQL Editor**, cole e rode `seed.sql` (ou `psql "$DATABASE_URL" -f supabase/seed.sql`).

Gera ~150 leads de Barreiras/BA nos últimos 75 dias (datas relativas a `NOW()`),
todos avançando só por transições válidas, com consultas em horário comercial e
agenda na semana atual/próxima; métricas diárias das campanhas
"IDC | Urgência e Canal" e "IDC | Implante Dentário" para cada dia; e 6 meses de
Google Meu Negócio. Se já existir algum lead, o seed não faz nada
(`NOTICE: Seed ignorado`).

**Antes de usar em produção**, apague os dados de demonstração (a proteção da
regra 5 precisa ser desligada explicitamente, só nesta operação):

```sql
BEGIN;
ALTER TABLE public.leads DISABLE TRIGGER leads_prevent_truncate;
TRUNCATE public.leads, public.lead_history;
ALTER TABLE public.leads ENABLE TRIGGER leads_prevent_truncate;
DELETE FROM public.daily_metrics;
DELETE FROM public.gmn_metrics;
COMMIT;
```

## 5. Rodar os testes localmente

Não precisa de Docker nem da CLI do Supabase — só dos binários do PostgreSQL 15+
(`initdb`, `pg_ctl`, `psql`; ex. `sudo apt install postgresql-16` ou
`brew install postgresql@16`).

```bash
supabase/tests/run.sh           # stub do Supabase + migration (2x) + testes de regras/RLS
supabase/tests/run.sh --seed    # idem + seed.sql (2x) + checagens do seed
supabase/tests/run.sh --keep    # mantém o cluster no fim para inspecionar com psql
supabase/tests/run.sh --verbose # mostra toda a saída do psql
```

O script cria um cluster temporário em `supabase/.tmp/` (ignorado pelo git), numa
porta livre a partir de 54329, aplica `tests/stub_supabase.sql` (papéis `anon`,
`authenticated`, `service_role`, `postgres` sem superusuário, `auth.users`,
`auth.uid()/role()/jwt()` lendo `request.jwt.claims` como o Supabase, grants
padrão e a publicação `supabase_realtime`), aplica a migration **como `postgres`**
numa transação única (como o SQL Editor) e depois de novo (idempotência), e roda
os testes. Cada teste imprime `PASS`/`FAIL`; o script sai com código ≠ 0 se algo
falhar e sempre derruba o cluster (a menos que `--keep`).

Variáveis opcionais: `PG_BIN` (pasta dos binários), `PGTEST_PORT`,
`PGTEST_TMPDIR`, `PGTEST_OS_USER` (usuário do SO que roda o servidor quando o
script é executado como root; padrão `postgres`).

Os testes trocam de papel como o PostgREST faz
(`set_config('role', 'authenticated', true)` +
`set_config('request.jwt.claims', '{"sub": "...", "role": "authenticated"}', true)`),
cada um numa transação desfeita no fim.
