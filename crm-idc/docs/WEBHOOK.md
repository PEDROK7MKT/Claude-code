# Webhook de entrada de leads

Endpoint que cadastra leads **automaticamente** no CRM (spec §6.1 — opção A), já com a
origem do anúncio preenchida a partir da URL que o paciente acessou (opção B). É por ele
que entram os leads do mini formulário do site `institutodeciocarrilho.com.br` e, na
Fase 2, os do WhatsApp Business API.

- Código: `src/app/api/webhook/lead/route.ts` (rota fina) → `src/features/webhook/`
  (`lib/` = lógica pura testada com vitest; `api/` = ligação com o Supabase service role).
- Script do site: [`public/idc-lead-tracker.js`](../public/idc-lead-tracker.js).

---

## 1. Endpoint

```
POST https://crm.institutodeciocarrilho.com.br/api/webhook/lead
```

| Item | Valor |
| --- | --- |
| Métodos | `POST` (cadastro) e `OPTIONS` (preflight CORS). Outros → `405` |
| Formatos do corpo | `application/json` ou `application/x-www-form-urlencoded` (`text/plain`/sem tipo: detectado pelo conteúdo) |
| Tamanho máximo | 16 KB por requisição (`413` acima disso) |
| Codificação | UTF-8 |
| Resposta | sempre JSON, `Cache-Control: no-store` |

## 2. Configuração (variáveis de ambiente)

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `WEBHOOK_SECRET` | **sim** | Segredo compartilhado, com **no mínimo 16 caracteres**. Gere com `openssl rand -hex 32`. Sem ele (ou curto demais) o webhook responde `503` a tudo — **nunca** aceita gravação sem autenticação. |
| `WEBHOOK_ALLOWED_ORIGINS` | não | Origens que podem chamar o webhook **direto do navegador**, separadas por vírgula. Ex.: `https://institutodeciocarrilho.com.br,https://www.institutodeciocarrilho.com.br`. `*` é ignorado de propósito. Vazio = modo público desligado. |
| `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` | **sim** | O webhook grava com a service role (sem sessão de usuário). Sem elas → `503`. |

As variáveis são lidas a cada requisição: trocar o segredo na Vercel só exige um
redeploy, não mudança de código.

## 3. Autenticação — dois modos

### 3.1 Modo integração (servidor → CRM) — recomendado

Para qualquer sistema que roda **no servidor** (bot de WhatsApp, Zapier/Make, plugin de
formulário que envia pelo backend do WordPress, script próprio). Envie o segredo em um
dos cabeçalhos:

```
Authorization: Bearer <WEBHOOK_SECRET>
x-webhook-secret: <WEBHOOK_SECRET>
```

- A comparação é feita em tempo constante (`crypto.timingSafeEqual` sobre SHA-256), sem
  vazar nem o tamanho do segredo.
- Segredo **errado** → `401`, mesmo que a origem seja autorizada.
- Sem limite de requisições (é um sistema confiável). O `name` pode ser omitido
  (vira "Lead sem nome"), só o `phone` é obrigatório.

### 3.2 Modo público (navegador do site → CRM)

Um segredo colocado no JavaScript do site **deixa de ser segredo** (qualquer visitante vê
no código-fonte). Por isso, requisições **sem segredo** são aceitas **somente** quando o
cabeçalho `Origin` está em `WEBHOOK_ALLOWED_ORIGINS`, e com restrições:

| Restrição | Detalhe |
| --- | --- |
| Rate limit | 10 envios por minuto **por IP** (`429` + `Retry-After`). Também vale para tentativas com segredo errado. |
| Honeypot | O campo `website` deve chegar vazio. Preenchido = robô: responde `200 { ok: true, id: null }` e **não grava nada** (o robô não percebe). |
| Campos obrigatórios | `name` **e** `phone`. |
| CORS | `Access-Control-Allow-Origin` só para a origem autorizada; o preflight libera apenas `Content-Type` — o navegador **não consegue** enviar `Authorization`/`x-webhook-secret`, então o segredo nunca vai parar no site por engano. |

**Trade-off (leia antes de ativar):** o cabeçalho `Origin` protege contra *outros sites*
usando o navegador dos visitantes, mas **não** contra quem monta a requisição à mão
(`curl -H "Origin: https://institutodeciocarrilho.com.br"`). No modo público, qualquer
pessoa determinada consegue criar leads falsos — limitados a 10/min por IP. O dano
possível é "lead de spam no funil" (que a recepção marca como *perdido*); dados
existentes nunca são lidos, alterados ou apagados pelo webhook. Se isso não for
aceitável, deixe `WEBHOOK_ALLOWED_ORIGINS` vazio e envie os leads do site por um
backend (ex.: `admin-ajax` do WordPress) usando o modo integração.

O rate limit é em memória, por instância do servidor ("melhor esforço"): na Vercel cada
instância conta separadamente e o contador zera quando ela reinicia. Para um limite
rígido, crie também uma regra no **Vercel Firewall** (Rate Limiting) para
`/api/webhook/lead`.

## 4. Corpo da requisição

Campos desconhecidos são ignorados. Textos são limpos (espaços extras, caracteres de
controle) e **cortados** no limite — não rejeitados. Tipo errado (objeto, lista,
booleano) → `400` indicando o campo.

| Campo | Obrigatório | Limite | Descrição |
| --- | --- | --- | --- |
| `name` | modo público | 120 | Nome do paciente. |
| `phone` | **sim** | — | Telefone/WhatsApp em qualquer formato: `(77) 98765-4321`, `+55 77 98765-4321`, `77987654321`. Gravado só com dígitos, DDD, sem 55. Inválido → `400`. |
| `source` | não | 60 | Fonte: `google_ads`, `google_organico`, `gmn`, `instagram`, `indicacao`, `retorno`, `outro` (aceita também o rótulo, ex. "Google Ads", e apelidos como `adwords`, `gmb`, `ig`). |
| `campaign` | não | 120 | Nome da campanha. O slug (`idc_urgencia_canal`) ou variações de escrita viram o nome oficial (`IDC \| Urgência e Canal`). |
| `keyword` | não | 250 | Palavra-chave. |
| `ad_group` | não | 250 | Grupo de anúncios. |
| `landing_page` | não | 500 | Página de destino (`/urgencia`). Se vier uma URL completa, também é lida como `url`. |
| `url` | não | 2000 | **URL completa** que o paciente acessou. Preenche `utm_*`, `keyword`, `campaign`, `landing_page`, `gclid` e o palpite da fonte (mesmo parser do cadastro manual — opção B). |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | não | 250 | UTMs explícitas (vencem as da `url`). |
| `gclid` | não | 250 | ID de clique do Google Ads. Indica fonte Google Ads e fica guardado nas notas (para importação de conversões offline no futuro). |
| `service` | não | 120 | Serviço de interesse: valor (`implante`), rótulo ("Implante Dentário") ou apelido (`aparelho`, `limpeza`, `lentes`...). Desconhecido → `outro`, com o texto original em `service_detail`. Sem serviço, tenta pela página (`/implante` → implante). |
| `service_detail` | não | 200 | Detalhe livre ("dor no dente 36"). |
| `notes` | não | 4000 | Observações. |
| `message` | não | 2000 | Primeira mensagem do paciente (WhatsApp/formulário) → vai para as notas como `Mensagem: ...`. |
| `website` | — | — | **Honeypot** do modo público: deve estar vazio. |

**Apelidos aceitos** (para plugins de formulário com campos em português):
`nome`/`nome_completo` → `name` · `telefone`/`celular`/`whatsapp`/`fone` → `phone` ·
`fonte`/`origem` → `source` · `campanha` → `campaign` · `palavra_chave`/`kw` → `keyword` ·
`servico`/`tratamento`/`interesse` → `service` · `mensagem`/`msg` → `message` ·
`observacoes`/`obs` → `notes` · `page_url`/`landing_url` → `url`. O nome oficial sempre
vence o apelido.

### Como cada coluna é preenchida

- **Fonte:** valor explícito válido **>** palpite pelos UTMs/gclid (`gclid`/`gbraid`/`wbraid`
  ou `google` + `cpc` → Google Ads; `gmn`/`gbp` → Google Meu Negócio; `instagram` →
  Instagram; `google` + `organic` → Google orgânico) **>** `outro`.
- **Status:** sempre `novo` — o banco não aceita outro valor na criação (regra 1).
- **Notas:** `[nota de duplicado]` + `notes` + `Mensagem: <message>` + `gclid (Google Ads): <gclid>`.
- **Autor (`created_by`):** vazio — o histórico mostra "Lead cadastrado" sem usuário,
  o que identifica a entrada automática.

## 5. Duplicados (regra 4) e reenvios

- **Telefone já cadastrado:** o lead **é criado mesmo assim** (status `novo`), vinculado
  ao lead mais recente com o mesmo telefone (`parent_lead_id`) e com a nota
  `Possível duplicado de <nome> (<dd/MM/aaaa>)` no início. A resposta traz
  `duplicate_of` com o id desse lead. Na tela do lead, a recepção decide se segue com o
  novo ou marca como perdido.
- **Reenvio (clique duplo, nova tentativa após timeout):** se o lead mais recente com o
  mesmo telefone foi criado **há menos de 2 minutos** e ainda está `novo`, nada é
  gravado e a resposta é `200 { ok: true, id: <lead existente>, duplicate_of: null, repeated: true }`.
  Assim um robô que repete a chamada não duplica o funil.

## 6. Respostas

| Status | Quando | Corpo |
| --- | --- | --- |
| `201` | Lead criado | `{ "ok": true, "id": "<uuid>", "duplicate_of": "<uuid>" \| null }` |
| `200` | Reenvio em até 2 min | `{ "ok": true, "id": "<uuid>", "duplicate_of": null, "repeated": true }` |
| `200` | Honeypot preenchido (modo público) | `{ "ok": true, "id": null, "duplicate_of": null }` |
| `204` | `OPTIONS` (preflight) | — |
| `400` | Validação, JSON malformado, corpo vazio | `{ "ok": false, "error": "...", "fields": [{ "field": "phone", "message": "..." }] }` |
| `401` | Segredo ausente (e origem não autorizada) ou errado | `{ "ok": false, "error": "Não autorizado: ..." }` + `WWW-Authenticate: Bearer` |
| `405` | Método diferente de POST/OPTIONS | `{ "ok": false, "error": "Método não permitido. Use POST..." }` + `Allow` |
| `413` | Corpo acima de 16 KB | `{ "ok": false, "error": "Requisição muito grande..." }` |
| `415` | `multipart/form-data` ou outro tipo | `{ "ok": false, "error": "Formato não suportado..." }` |
| `429` | Rate limit (sem segredo válido) | `{ "ok": false, "error": "Muitas tentativas... Aguarde N segundos..." }` + `Retry-After` |
| `500` | Falha ao gravar | `{ "ok": false, "error": "Erro interno ao registrar o lead..." }` (sem detalhes internos) |
| `503` | `WEBHOOK_SECRET` ou service role não configurados | `{ "ok": false, "error": "Webhook indisponível: ..." }` |

Todas as mensagens são em português, prontas para mostrar ao usuário final.

## 7. Exemplos com curl

```bash
CRM=https://crm.institutodeciocarrilho.com.br
SECRET=... # valor de WEBHOOK_SECRET

# JSON completo (modo integração)
curl -sS -X POST "$CRM/api/webhook/lead" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "phone": "(77) 98765-4321",
    "url": "https://institutodeciocarrilho.com.br/urgencia?utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term=dentista%20barreiras&gclid=EAIaIQ",
    "service": "canal",
    "service_detail": "dor no dente 36",
    "message": "Olá, estou com muita dor, tem horário hoje?"
  }'
# → 201 {"ok":true,"id":"6f1c...","duplicate_of":null}
#   Fonte Google Ads · campanha "IDC | Urgência e Canal" · palavra-chave "dentista barreiras" · página /urgencia

# Campos explícitos, sem URL (x-webhook-secret)
curl -sS -X POST "$CRM/api/webhook/lead" \
  -H "x-webhook-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"name":"João Souza","phone":"77 3611-2233","source":"gmn","service":"Clareamento"}'

# Formulário urlencoded com campos em português
curl -sS -X POST "$CRM/api/webhook/lead" \
  -H "Authorization: Bearer $SECRET" \
  --data-urlencode "nome=Ana Lima" \
  --data-urlencode "whatsapp=+55 77 99911-2233" \
  --data-urlencode "servico=Implante Dentário" \
  --data-urlencode "mensagem=Quero saber o valor do implante"

# Telefone inválido → 400
curl -sS -X POST "$CRM/api/webhook/lead" -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" -d '{"name":"Teste","phone":"123"}'
# → {"ok":false,"error":"Dados inválidos. Corrija os campos indicados e envie novamente.",
#    "fields":[{"field":"phone","message":"Telefone inválido. Informe DDD + número, ex.: (77) 98765-4321."}]}

# Preflight do navegador (deve devolver Access-Control-Allow-Origin)
curl -sS -i -X OPTIONS "$CRM/api/webhook/lead" \
  -H "Origin: https://institutodeciocarrilho.com.br" -H "Access-Control-Request-Method: POST"
```

## 8. Como o lead entra no funil do CRM

1. A linha é gravada em `leads` com status **novo**; o trigger registra em
   `lead_history` "Lead cadastrado" (regra 1).
2. **Realtime:** quem estiver com o CRM aberto recebe o toast "Novo lead: <nome>" e o
   badge de novos leads no menu é atualizado; o card aparece na coluna **Novo** do Kanban
   e nos KPIs do dashboard sem recarregar.
3. **Google Ads:** leads com fonte `google_ads` e `campaign` igual ao nome da campanha em
   `daily_metrics` entram automaticamente em `leads_total` do dia/campanha (fuso
   America/Bahia) — é o que alimenta o **custo por lead real** (regra 7). Por isso a
   campanha é sempre gravada pelo nome oficial (`IDC | Urgência e Canal`).
4. A partir daí o fluxo é o normal: a recepção responde (em contato), agenda, confirma e
   registra o comparecimento. O webhook **nunca** altera nem apaga leads existentes.

## 9. Integração com o site institutodeciocarrilho.com.br

### 9.1 Instalar o script

Cole antes de `</body>` em todas as páginas (no WordPress: tema → rodapé, ou um plugin
de "inserir código"):

```html
<script src="https://crm.institutodeciocarrilho.com.br/idc-lead-tracker.js" defer></script>
```

Opções (atributos na tag): `data-endpoint="..."` (outro endereço do webhook),
`data-attribution="last"` (a última campanha vence; padrão: a primeira em 30 dias) e
`data-whatsapp-ref="off"` (não mexe nos links de WhatsApp). O script é pequeno
(~10 KB sem minificar), não tem dependências e não usa cookies de terceiros. O arquivo é
público (fica fora da proteção de login do CRM). Também pode ser copiado para o próprio
site — nesse caso informe `data-endpoint` com a URL completa do webhook.

O que ele faz:

1. **Guarda a origem por 30 dias** (localStorage `idc_lead_tracking` + cookie de reserva
   `idc_lt`): `utm_*`, `gclid`/`gbraid`/`wbraid`, página de entrada e URL. Sem UTM, usa o
   referrer (Google → orgânico, Instagram). A primeira visita com origem vence; se o
   visitante entrou direto e depois clicou num anúncio, o anúncio passa a valer.
2. **Marca os links de WhatsApp** (`wa.me`, `api.whatsapp.com`, `whatsapp://`) no clique,
   acrescentando ao texto pré-preenchido um código curto — ex.:
   `Olá, quero agendar [ref: gads-urgencia]`. Um link pode forçar o código com
   `data-idc-ref="promo-junho"`.
3. **Expõe `window.IDCLeads`** para o mini formulário (abaixo).

### 9.2 Código `[ref: ...]` do WhatsApp → fonte no cadastro manual

O código é `<fonte>-<página de entrada>`. Ao cadastrar o lead que chegou pelo WhatsApp,
a recepção escolhe a fonte assim:

| Prefixo | Fonte no CRM | Exemplo |
| --- | --- | --- |
| `gads` | Google Ads | `gads-urgencia` → campanha de urgência, página /urgencia |
| `org` | Google (orgânico) | `org-implante` |
| `gmn` | Google Meu Negócio | `gmn-home` |
| `ig` | Instagram | `ig-clareamento` |
| `site` | Outro (entrou direto no site) | `site-home` |
| outro texto | valor de `utm_source` (ex. `facebook-home`) → Outro | — |

`home` = página inicial.

### 9.3 Mini formulário antes do WhatsApp (modo público)

Requer `WEBHOOK_ALLOWED_ORIGINS` com o domínio do site. O lead entra no CRM **com a
origem completa** mesmo que o paciente desista de mandar a mensagem no WhatsApp.

```html
<form id="idc-lead-form">
  <label>Nome <input name="name" required autocomplete="name"></label>
  <label>WhatsApp <input name="phone" required inputmode="tel" autocomplete="tel" placeholder="(77) 98765-4321"></label>
  <label>Tratamento
    <select name="service">
      <option value="clinica_geral">Clínica geral / avaliação</option>
      <option value="canal">Urgência / canal</option>
      <option value="implante">Implante</option>
      <option value="clareamento">Clareamento</option>
    </select>
  </label>
  <!-- honeypot: invisível para pessoas, robôs preenchem -->
  <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true"
         style="position:absolute;left:-9999px">
  <p><small>Ao enviar, você concorda em ser contatado pelo Instituto Décio Carrilho
    (ver Política de Privacidade).</small></p>
  <button type="submit">Falar no WhatsApp</button>
  <p id="idc-lead-erro" role="alert" hidden></p>
</form>

<script>
  document.getElementById("idc-lead-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = Object.fromEntries(new FormData(form));
    var whatsapp = window.IDCLeads.whatsappUrl("5577999998888",
      "Olá! Meu nome é " + data.name + " e quero agendar uma avaliação.");
    window.IDCLeads.submit(data)
      .then(function () { window.location.href = whatsapp; })
      .catch(function (error) {
        // dado inválido (ex.: telefone): mostra o erro e deixa corrigir
        if (error.status === 400) {
          var erro = document.getElementById("idc-lead-erro");
          erro.textContent = error.message;
          erro.hidden = false;
          return;
        }
        // outros erros (rede, limite) não podem travar o paciente: segue para o WhatsApp
        window.location.href = whatsapp;
      });
  });
</script>
```

API do script:

| Função | Descrição |
| --- | --- |
| `IDCLeads.submit({ name, phone, service?, service_detail?, message?, website? })` | Envia ao webhook junto com a origem guardada (formulário urlencoded, sem preflight, `keepalive`). Resolve com `{ ok, id, duplicate_of }`; rejeita com `Error` (mensagem pt-BR, `status`, `fields`). |
| `IDCLeads.whatsappUrl(telefone, mensagem)` | Link `wa.me` com o código `[ref: ...]` já incluído. |
| `IDCLeads.refCode()` | Código atual, ex. `gads-urgencia`. |
| `IDCLeads.getTracking()` | Dados de origem guardados (para depuração). |

### 9.4 Deixe os links rastreáveis

- **Google Ads:** mantenha a **codificação automática** (gclid) ligada e, em cada
  campanha, defina o *Sufixo do URL final*:
  `utm_source=google&utm_medium=cpc&utm_campaign=idc_urgencia_canal&utm_term={keyword}`
  (e `idc_implante` na campanha de implante). O CRM converte o slug no nome oficial.
- **Google Meu Negócio:** no link do site do perfil use
  `https://institutodeciocarrilho.com.br/?utm_source=gmn&utm_medium=organic&utm_campaign=perfil`.
- **Instagram (bio/stories):** `?utm_source=instagram&utm_medium=social`.

### 9.5 LGPD

O script grava dados de navegação (origem da visita) no navegador do visitante por 30
dias e o formulário envia nome e telefone. Mencione isso na Política de Privacidade do
site e, se o site usar banner de cookies, carregue o script só após o consentimento para
cookies de marketing.

## 10. Segurança — resumo

- Sem `WEBHOOK_SECRET` válido (≥ 16 caracteres) o endpoint fica **desligado** (`503`).
- O segredo **nunca** vai para o navegador: o preflight CORS nem permite o cabeçalho.
  Rotação: gere um novo valor, atualize a integração e a variável na Vercel e faça
  redeploy (há uma janela curta em que o valor antigo deixa de valer).
- A service role só existe no servidor e só é usada **depois** da autenticação e da
  validação. Mesmo com ela, os triggers do banco garantem status inicial `novo`,
  histórico e a proibição de excluir leads.
- O webhook só **cria** leads: não lê, altera nem apaga dados existentes (a busca por
  telefone é interna e a resposta só devolve ids).
- Corpo limitado a 16 KB, textos cortados nos limites, campos desconhecidos ignorados.
- Logs do servidor (`[webhook/lead]`) contêm apenas ids de lead e códigos de erro —
  nunca nome, telefone ou mensagem.
- Modo público: origem na lista, rate limit por IP, honeypot, nome + telefone
  obrigatórios. Veja o trade-off na seção 3.2.

## 11. Fase 2 — WhatsApp Business API

A integração com a **WhatsApp Business Platform (Cloud API)** está planejada para a
Fase 2 (spec §13) e **usará este mesmo endpoint**, no modo integração: um pequeno
receptor (função serverless ou Supabase Edge Function) recebe o webhook `messages` da
Meta e chama `POST /api/webhook/lead` com o segredo:

| Dado do WhatsApp | Campo do webhook |
| --- | --- |
| `contacts[0].profile.name` | `name` (pode faltar → "Lead sem nome") |
| `contacts[0].wa_id` (`5577987654321`) | `phone` (o 55 é removido) |
| texto da primeira mensagem | `message` |
| `referral.source_url` (anúncio click-to-WhatsApp) | `url` |
| código `[ref: gads-urgencia]` no texto | `source`/`campaign` conforme a tabela 9.2 |

Mensagens seguidas do mesmo paciente em menos de 2 minutos não duplicam o lead
(seção 5), e conversas novas de um telefone já conhecido entram como possível duplicado,
vinculadas ao lead anterior.

## 12. Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| `503` em tudo | `WEBHOOK_SECRET` ausente/curto ou service role não configurada na Vercel. |
| `401` vindo do site | Domínio fora de `WEBHOOK_ALLOWED_ORIGINS` (confira `www.` e `https://`). |
| Erro de CORS no console do navegador | Mesmo caso acima, ou o código tentou enviar `Authorization` pelo navegador (não permitido). |
| `429` em testes | Mais de 10 envios/min do mesmo IP sem segredo — aguarde o `Retry-After`. |
| Lead sem campanha/palavra-chave | A URL enviada não tinha UTMs; configure o sufixo do URL final (9.4). |
| Custo por lead não bate | `campaign` do lead diferente do nome em `daily_metrics` — use o slug ou o nome oficial. |
