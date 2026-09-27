# Offline-first e PWA — CRM IDC

Spec, "Instruções finais" nº 8: *"O sistema deve funcionar 100% offline-first — cachear dados
localmente quando possível"*. Este documento explica o que funciona sem internet, o que não
funciona (e por quê) e como as atualizações chegam aos aparelhos.

## Três camadas

| Camada | Onde | O que guarda |
| --- | --- | --- |
| **Dados** | `src/components/providers/query-provider.tsx` | Cache do TanStack Query persistido no **IndexedDB** (`idc-crm` / `query-cache`), válido por 7 dias. Só queries com sucesso. |
| **Páginas e assets** | `public/sw.js` (service worker) | HTML das páginas já abertas, CSS/JS/fontes/ícones e a página `/offline`, no **Cache Storage** (`idc-crm-*`). |
| **Interface** | `src/features/offline`, `app-providers.tsx` | Pílula "Offline — dados salvos" no header, toasts de conexão, página `/offline` e toast "Nova versão disponível". |

O service worker **nunca** guarda chamadas ao Supabase: elas vão para outro domínio e passam direto.
Os dados offline são responsabilidade do TanStack Query, que já sabe quais consultas existem e
quando foram atualizadas.

## O que funciona offline

- **Abrir o app e recarregar páginas já visitadas.** A navegação vai primeiro à rede; sem rede, o
  SW entrega a última cópia salva daquela página. Em seguida o React Query restaura os dados do
  IndexedDB e a tela aparece como estava na última sincronização.
- **Navegar entre páginas já visitadas.** Uma navegação interna (`<Link>`) que falha por falta de
  rede vira navegação de documento, e o SW responde com a cópia salva.
- **Página nunca aberta neste aparelho:** aparece `/offline`, com a marca, a explicação,
  "Tentar novamente" e "Ir para o dashboard". Quando a conexão volta, a página recarrega sozinha.
- **Última sincronização:** tocando na pílula do header aparece quando os leads foram atualizados
  pela última vez (ex.: "há 5 min · 27/09/2026 14:25", no fuso America/Bahia).
- **Listas, kanban, dashboard e métricas já carregados.** Uma busca, filtro ou período novo
  precisa de conexão, porque a paginação e os filtros são feitos no servidor.
- **Rede lenta ("lie-fi"):** se a página demorar mais de 6 s e existir cópia salva, a cópia é
  mostrada e a versão nova é gravada em segundo plano. Com erro 502/503/504 do servidor, a cópia
  também é usada.

## O que não funciona offline (e por quê)

**Cadastrar ou editar leads, mudar status, importar ou editar métricas e alterar configurações
ficam bloqueados.** A mutation falha na hora com o toast *"Sem conexão com o servidor"*. Ela não
fica numa fila para ser reenviada depois. Motivos:

1. **As regras do funil são validadas pelo servidor.** Transições de status permitidas, data
   obrigatória ao agendar, criação sempre em "novo" e a proibição de excluir leads são garantidas
   por triggers do banco e pela RPC `change_lead_status`. O contador `daily_metrics` também é
   calculado pelo banco. O cliente só faz uma checagem prévia.
2. **Vários usuários mexem nos mesmos leads.** Se uma alteração ficasse numa fila e fosse enviada
   horas depois, o lead poderia já estar em outro status. Por exemplo, o dentista marcou
   "compareceu" enquanto o gestor estava offline. O servidor recusaria a alteração depois que o
   usuário já acreditava que ela tinha sido salva.
3. **Mensagem clara em vez de estado incerto.** O usuário sabe na hora que nada foi gravado e
   refaz a ação quando a conexão voltar. Nenhum dado fica "pendente" sem ele saber.

Também dependem de conexão:

- **Login e logout.** `/login` e `/auth/*` nunca são guardados. Offline, eles caem na página `/offline`.
- **Tempo real (novos leads).** A conexão fica pausada. Ao reconectar, as consultas são refeitas,
  e os leads que chegaram pelo webhook nesse meio-tempo aparecem.
- **O webhook de leads.** Não é afetado, porque roda no servidor e não depende do aparelho.

## Estratégias do service worker

A tabela de rotas está em `src/features/offline/lib/cache-strategy.ts` (TypeScript, testado) e
**duplicada** em `public/sw.js`, porque o SW é servido como arquivo estático e não importa TS.
`sw-parity.test.ts` executa o `sw.js` num sandbox e compara as duas implementações caso a caso.

| Requisição | Estratégia | Cache |
| --- | --- | --- |
| Navegação (HTML) de páginas do app | Rede primeiro. Sem rede: cópia da página, depois `/dashboard` (só para `/`), depois `/offline` | `idc-crm-pages-v1` (40 páginas) |
| Navegação para `/login`, `/auth/*` | Só rede, sem guardar. Sem rede: `/offline` | — |
| `/_next/static/*`, fontes, ícones (`/icon.svg`, `/apple-icon/*`) | Cache primeiro (arquivos imutáveis, com hash) | `idc-crm-static-v1` (300) |
| Outros assets do próprio domínio (manifest, `/_next/image`, arquivos de `public/`) | Stale-while-revalidate | `idc-crm-runtime-v1` (80) |
| `/offline` + CSS/JS/fontes/ícones que ela usa | Pré-carregados no `install` | `idc-crm-precache-v1` |
| Supabase e outros domínios, `/api/*`, POST/HEAD, payload RSC (`RSC: 1` / `?_rsc=`), `Range`, `fetch()` genérico, `/sw.js` | **Não intercepta** | — |

- O payload RSC fica de fora porque depende da árvore de rotas que está no navegador. Offline, o
  próprio Next faz uma navegação de documento, e essa é atendida pelas cópias de página.
- Um `fetch()` genérico do mesmo domínio (por exemplo, uma exportação) também fica de fora, porque
  pode conter dados do usuário.
- **Primeira visita:** a página carrega antes de o SW existir. Assim que ele fica pronto,
  `ServiceWorkerRegister` envia `WARM_CACHE` com a página atual e os assets já baixados. Com isso,
  um recarregamento offline já funciona.
- **Sessão:** ao passar por `/auth/signout` ou `/login`, o SW apaga as cópias de páginas, porque
  elas contêm nome e e-mail no menu. O botão **Sair** (`useSignOut`, `src/features/auth/hooks/use-sign-out.ts`):
  1. faz `POST /auth/signout` via `fetch` e também expira no navegador os cookies `sb-*-auth-token`
     (assim o logout funciona mesmo offline, quando a rota não chega a rodar);
  2. apaga o cache do IndexedDB e as cópias de páginas do SW (`clearLocalSessionData()`, em
     `src/features/auth/lib/local-session.ts`, que chama `clearPersistedCache()` e
     `clearOfflinePageCaches()`);
  3. avisa as outras abas pelo `BroadcastChannel` `idc-auth`: elas limpam o próprio cache e vão
     para o `/login`.

  A tela de `/login` também limpa o cache persistido assim que a restauração termina. Isso cobre
  quem chega lá sem clicar em Sair: usuário desativado, sessão expirada ou revogada (o
  `requireSession()` manda para `/auth/signout`, que apaga os cookies e redireciona ao `/login`).

## Como as atualizações chegam

**Deploy do app (sem mudar o `sw.js`)**

- O HTML vem primeiro da rede. Quem está online recebe a versão nova na próxima navegação de
  documento.
- Nas navegações internas, o Next detecta o build novo e recarrega a página.
- Os assets têm hash no nome, então o cache-first nunca serve JS velho para HTML novo. As cópias
  antigas de página continuam apontando para os chunks antigos, que seguem no cache até o limite
  de 300 entradas. Por isso o offline continua funcionando depois do deploy.

**Mudança no `public/sw.js`**

1. Altere também `cache-strategy.ts`. O teste de paridade falha se os dois divergirem.
2. Incremente `CACHE_VERSION` nos dois arquivos quando o formato dos caches mudar. No `activate`,
   os caches `idc-crm-*` de outras versões são apagados.
3. O navegador confere o `/sw.js` a cada navegação, e também de hora em hora e ao voltar para a
   aba (no máximo a cada 5 min). O arquivo é servido com `Cache-Control: no-cache` e o registro
   usa `updateViaCache: "none"`.
4. A versão nova instala (pré-carrega `/offline`) e **fica esperando**. Aparece o toast
   **"Nova versão disponível — Atualizar"**, que envia `SKIP_WAITING`. A versão nova assume e a
   página recarrega.
5. Se o usuário ignorar o toast, a versão nova assume quando todas as abas forem fechadas. Outras
   abas abertas recebem o aviso "O IDC CRM foi atualizado — Recarregar".

**Desenvolvimento**

O SW só é registrado com `NODE_ENV=production`. No `next dev` os chunks não têm hash, então um SW
antigo de um `next start` é desregistrado e os caches `idc-crm-*` são apagados.

## Instalação (PWA)

- **Manifest:** `src/app/manifest.ts`, servido em `/manifest.webmanifest`.
  - Nome "IDC CRM — Instituto Décio Carrilho", `short_name` "IDC CRM".
  - `start_url` `/dashboard`, `display: standalone`, tema `#0D6E6E`, fundo `#F5F5F5`, idioma `pt-BR`.
  - Atalhos: Novo lead, Kanban e Leads.
- **Ícones:**
  - `src/app/icon.svg`: favicon SVG, legível a 16 px.
  - `src/app/apple-icon.tsx`: gera PNGs de 180 (iOS), 192 e 512 (Android `any` e `maskable`),
    com fundo sangrado e o desenho dentro da zona segura.
  - Os dois saem de `src/features/offline/lib/brand-icon.ts`; um teste garante que o `icon.svg`
    é idêntico ao gerado.
  - As URLs dos PNGs terminam em `.png`, então o proxy de autenticação não as intercepta.
- **Android/Chrome:** menu → "Instalar app", ou o convite automático.
- **iOS (16.4+):** Safari → Compartilhar → "Adicionar à Tela de Início".
- Exige HTTPS. Na Vercel isso já vem pronto.

## Configuração fora desta pasta

- `next.config.ts`: `/sw.js` com `Content-Type: application/javascript`,
  `Cache-Control: no-cache, no-store, must-revalidate` e `Service-Worker-Allowed: /`.
- `src/proxy.ts`: o matcher ignora `sw.js`, `manifest.webmanifest`, `.svg` e `.png`. A página
  `/offline` é pública (`PUBLIC_PATHS`).
- **Não** ative `experimental.useOffline`. Com ele, o Next segura a navegação interna até a
  conexão voltar, e o usuário ficaria preso no skeleton. Sem ele, a navegação vira navegação de
  documento e o SW mostra a cópia salva com os dados do IndexedDB.

## Como testar

1. `npx vitest run src/features/offline`: tabela de rotas, paridade com o `sw.js`, ciclo de vida
   do SW com Cache Storage falso, manifest, ícones e "última sincronização".
2. `next build && next start` e depois, no Chrome, DevTools → Application → Service Workers /
   Cache Storage:
   - Abra `/dashboard` e `/leads`.
   - Em Network, marque **Offline** e recarregue: as páginas abrem com os dados salvos e a pílula
     "Offline — dados salvos" aparece.
   - Abra uma rota nunca visitada: deve aparecer `/offline`.
   - Tente mudar um status: deve aparecer o toast "Sem conexão com o servidor".
3. Para testar atualização: altere o `sw.js` (por exemplo, `CACHE_VERSION`), rode o build de novo,
   recarregue e confira o toast "Nova versão disponível".
4. Rode o Lighthouse, aba "PWA/Installable": o manifest e os ícones devem passar.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `public/sw.js` | Service worker (sem Workbox) |
| `src/features/offline/lib/cache-strategy.ts` | Tabela de rotas e constantes (espelhadas no SW) |
| `src/features/offline/sw-register.tsx` | `ServiceWorkerRegister` (renderizado em `src/app/layout.tsx`) |
| `src/features/offline/offline-indicator.tsx` | `OfflineIndicator`, pílula do header (em `app-header.tsx`) |
| `src/features/offline/use-last-synced.ts` | `useLastSyncedAt()`, `useNow()` |
| `src/features/offline/lib/last-sync.ts` | Texto da última sincronização (puro) |
| `src/features/offline/offline-view.tsx`, `offline-actions.tsx` | Conteúdo da página `/offline` |
| `src/features/offline/clear-offline-caches.ts` | Limpeza do Cache Storage pela página |
| `src/features/offline/lib/brand-icon.ts`, `web-manifest.ts` | Desenho do ícone e manifest |
| `src/app/manifest.ts`, `icon.svg`, `apple-icon.tsx`, `offline/page.tsx` | Rotas do Next |
