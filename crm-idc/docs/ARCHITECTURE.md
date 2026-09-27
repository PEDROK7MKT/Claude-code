# Arquitetura — CRM IDC

Contrato técnico do projeto. A especificação funcional completa está em
[`docs/SPEC.md`](./SPEC.md); este documento diz **como** o código é organizado.

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/`, Turbopack) — **leia `node_modules/next/dist/docs/` antes de usar APIs do Next**: `middleware` virou `proxy` (`src/proxy.ts`), `params`/`searchParams`/`cookies()` são `Promise`, helpers globais `PageProps<'/rota/[id]'>` e `LayoutProps<'/'>` |
| React | 19.2 |
| Banco/Auth/Realtime | Supabase (`@supabase/ssr` + `@supabase/supabase-js`) |
| Dados no cliente | TanStack Query v5, cache persistido no IndexedDB (offline-first) |
| UI | Tailwind CSS v4 + shadcn/ui (estilo new-york, escrito à mão em `src/components/ui`, primitives do pacote `radix-ui`) |
| Ícones | `lucide-react` |
| Gráficos | Recharts 3 |
| Formulários | `react-hook-form` + `zod` v4 + `@hookform/resolvers` |
| Datas | `date-fns` v4 + `@date-fns/tz` (fuso `America/Bahia`) |
| Toasts | `sonner` |
| Drag & drop | `@dnd-kit/core` |
| CSV | `papaparse` |
| PDF | `jspdf` + `jspdf-autotable` |
| Testes | `vitest` (funções puras em `src/lib` e `src/features/**/lib`) + testes SQL em `supabase/tests` |

## Pastas (por feature, não por tipo)

```
src/
  app/                       # rotas — arquivos FINOS que só compõem componentes de features
    layout.tsx               # raiz: fonte Inter, metadata, providers globais
    (auth)/login/page.tsx
    (app)/layout.tsx         # shell autenticado: sidebar + header + SessionProvider
    (app)/dashboard/page.tsx
    (app)/leads/page.tsx, leads/novo/page.tsx, leads/[id]/page.tsx
    (app)/kanban/page.tsx
    (app)/google-ads/page.tsx
    (app)/gmn/page.tsx
    (app)/relatorios/page.tsx
    (app)/configuracoes/page.tsx
    api/webhook/lead/route.ts
    auth/signout/route.ts
  components/
    ui/                      # shadcn/ui (button, card, dialog, sidebar, chart, ...)
    shared/                  # componentes de app reutilizáveis (StatusBadge, EmptyState, KpiCard, ...)
    providers/               # QueryProvider, RealtimeProvider, etc.
  features/
    auth/                    # login, session context (useSession)
    shell/                   # sidebar, header, navegação, badge de novos leads
    dashboard/
    leads/                   # api/ (queries & mutations), components/, lib/
    kanban/
    google-ads/
    gmn/
    reports/
    settings/
    webhook/
    offline/
  lib/                       # utilitários puros compartilhados
    constants.ts             # SERVICES, LEAD_SOURCES, CAMPAIGNS, COMPETITORS, STATUS_META, STATUS_TRANSITIONS, QUERY_KEYS ...
    dates.ts                 # formatação e intervalos no fuso America/Bahia
    format.ts                # moeda BRL, números, telefone, WhatsApp
    lead-status.ts           # máquina de estados do funil (regra 2)
    metrics.ts               # cálculos de KPI puros (testados)
    utm.ts                   # parse de UTMs de URL
    env.ts, utils.ts (cn), auth.ts (server-only)
    supabase/{client,server,admin,proxy}.ts
  types/database.ts          # tipos do banco (formato supabase gen types)
  proxy.ts                   # renova sessão + protege rotas
supabase/
  migrations/0001_schema.sql # schema, RLS, triggers, RPC
  seed.sql                   # dados de demonstração (opcional)
  tests/                     # testes SQL (rodam num Postgres local com stub de auth)
```

## Convenções

- **Todo texto de UI em português brasileiro.** Datas `dd/MM/yyyy`, moeda `R$ 1.234,56`.
- **Nunca** use `toLocaleDateString`/`new Date().getDate()` para exibir ou agrupar datas —
  use `@/lib/dates` (fuso America/Bahia). Colunas `DATE` (`daily_metrics.date`,
  `gmn_metrics.period_*`) são strings `yyyy-MM-dd`: exiba com `formatDateKey`.
- Telefones são gravados **só com dígitos, com DDD, sem 55** (10–11 dígitos) —
  `normalizePhone()` antes de salvar, `formatPhone()` para exibir, `whatsappUrl()` para links.
- Campanhas são gravadas pelo **nome** (label do Google Ads), ex. `"IDC | Urgência e Canal"`,
  tanto em `leads.campaign` quanto em `daily_metrics.campaign`.
- **Status do lead só muda pela RPC** `change_lead_status` (via hook
  `useChangeLeadStatus`), para registrar nota no histórico. As regras (fluxo permitido,
  `scheduled_at` obrigatório ao agendar, criação sempre em `novo`, proibição de DELETE)
  são garantidas no banco por triggers **e** checadas antes no cliente
  (`@/lib/lead-status`).
- Leads **nunca são excluídos** — só marcados como `perdido`.
- Leitura/escrita de dados no cliente via hooks TanStack Query de `src/features/*/api`,
  usando o cliente Supabase do navegador (RLS protege). Toda mutation mostra toast de
  sucesso/erro e invalida `QUERY_KEYS` relevantes.
- Operações que exigem service role (criar/desativar usuário, webhook) ficam no servidor
  (Server Actions / Route Handlers) e validam permissão antes (`requireAdmin()`).
- Gráficos Recharts usam **cores hex** de `@/lib/constants` (`BRAND`, `STATUS_META[x].color`,
  `SOURCE_COLORS`) — não `var(--...)` — para que o SVG possa ser exportado no PDF.
- Cada rota tem `loading.tsx` com skeletons; componentes cliente mostram `Skeleton`
  enquanto a query carrega, `ErrorState` com "Tentar novamente" em erro, e `EmptyState`
  (ícone + texto + CTA) quando não há dados.
- Ações destrutivas (marcar como perdido/cancelado, excluir métrica, desativar usuário)
  pedem confirmação (`ConfirmDialog`).
- Mobile: tabelas viram cards empilhados abaixo de `md`; gráficos `ResponsiveContainer` full width.
- Papéis: `admin` (gestor de tráfego) vê e edita tudo; `dentist` vê leads/kanban/dashboard
  simplificado, atualiza status; vê Google Ads/GMN/Relatórios em modo leitura; não acessa
  Configurações. Use `useSession()` → `{ profile, isAdmin }` no cliente e `requireAdmin()`
  no servidor.
