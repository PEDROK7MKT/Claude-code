# Agência Viva — site

Site da **Agência Viva**, agência de marketing em Barreiras - BA, com SEO local
forte para Barreiras e o Oeste da Bahia.

HTML estático gerado por um script Node sem dependências. Fica leve, rápido e
fácil de indexar, o que conta pontos no Core Web Vitals e no ranqueamento.

## Estrutura

```
agencia-viva/
├── src/data.mjs      ← TODO o conteúdo: NAP, serviços, cidades, FAQ
├── build.mjs         ← gera as páginas em ./site
├── public/           ← CSS, JS, logo, favicon, imagem de compartilhamento
└── site/             ← saída pronta para publicar (não editar à mão)
```

```bash
node build.mjs                          # gera ./site
python3 -m http.server 8080 -d site     # preview em http://localhost:8080
```

## Páginas geradas (19)

- `/`: home ("agência de marketing em Barreiras")
- `/servicos/` e 6 páginas de serviço (tráfego pago, social media, sites,
  SEO local / Google Meu Negócio, identidade visual, audiovisual)
- 8 landing pages de cidade: `/agencia-de-marketing-em-<cidade>/`
  (Barreiras, LEM, São Desidério, Formosa do Rio Preto, Correntina,
  Santa Maria da Vitória, Bom Jesus da Lapa, Riachão das Neves)
- `/sobre/`, `/contato/`, `404.html`
- `sitemap.xml`, `robots.txt`, `llms.txt` (para buscadores de IA), `site.webmanifest`

## SEO já incluído

- Title e description únicos por página, com cidade e serviço
- Um único H1 por página, com a palavra-chave principal
- Schema.org em JSON-LD: `ProfessionalService` (endereço, geo, horário,
  área atendida, catálogo de serviços), `WebSite`, `BreadcrumbList`,
  `FAQPage` e `Service`
- Meta geo (`geo.region`, `geo.position`, `ICBM`), Open Graph e canonical
- Links internos cruzando cidade ↔ serviço, com texto âncora descritivo
- Texto próprio em cada cidade (sem conteúdo duplicado)
- Sem framework JS: a página chega pronta para o Google

## ⚠️ Antes de publicar: preencha os `TODO` em `src/data.mjs`

| Campo | Por quê |
|---|---|
| `url` | domínio final, usado em canonical, sitemap e schema |
| `whatsapp`, `phoneDisplay` | botões de WhatsApp em todo o site |
| `address` (rua, bairro, CEP) | **precisa ser idêntico ao Perfil no Google** |
| `geo` | coordenada exata do endereço (clique direito no Google Maps) |
| `mapsUrl` | link "Compartilhar" do Perfil da Empresa no Google |
| `email`, `founded`, `legalName`, `hours` | dados do schema e do rodapé |
| `testimonials` | depoimentos reais com autorização (vazio = seção oculta) |

Depois rode `node build.mjs` de novo.

## Publicar

**Vercel:** importe o repositório, defina *Root Directory* = `agencia-viva`.
O `vercel.json` já configura o build (`node build.mjs`) e a saída (`site`).
Depois conecte o domínio.

**Qualquer hospedagem** (Hostinger, HostGator, Netlify drag-and-drop): suba o
conteúdo da pasta `site/`.

## Checklist de SEO local (fora do site)

1. **Perfil da Empresa no Google**: categoria principal *Agência de marketing*,
   secundárias *Consultor de marketing*, *Designer de sites*,
   *Agência de publicidade*. Área de atendimento com as 8 cidades.
   Mesmo nome, endereço e telefone do site. Link do site no perfil.
2. **Google Search Console**: verificar o domínio e enviar `/sitemap.xml`.
3. **Avaliações**: pedir a todos os clientes (não só aos satisfeitos, o que é proibido pelo Google), com link direto de
   avaliação, e responder todas.
4. **Fotos reais** no Perfil (fachada, equipe, bastidores): 1 a 2 por semana.
5. **Postagens no Perfil** semanais, com link para a página de serviço.
6. **Citações**: mesmo NAP no Instagram, Facebook, Apple Maps, Bing Places,
   listas locais de Barreiras e na bio da fundadora.
7. **Instagram**: link do site na bio e "Barreiras - BA" no nome do perfil.

## CRM da equipe (`/crm/`)

App React em `crm/` com banco no Supabase (projeto `viva-crm`, região São Paulo).
Funil (kanban), leads, clientes, tarefas da operação, histórico de atividades,
cobranças (só admin) e gestão de equipe.

- **Acesso:** qualquer pessoa pode criar conta em `/crm/`, mas só entra depois
  que um admin aprovar em **Equipe**. O e-mail do dono entra como admin automaticamente.
- **Segurança:** regras RLS no banco. Equipe não vê cobranças, não aprova
  pessoas e não apaga leads/clientes. A chave no front é a publicável (segura no navegador).
- **Leads do site:** a função `lead_do_site` (RPC pública, com validação) cria
  lead com origem "site" — pronta para ligar um formulário.
- **Build:** `cd crm && npm install && npm run build`, depois `node build.mjs`
  (copia para `site/crm`). Na Vercel o `vercel.json` já faz tudo.
- **No painel do Supabase (uma vez):** Authentication → URL Configuration →
  *Site URL* = `https://agenciaviva.com.br/crm/` e adicionar o mesmo em
  *Redirect URLs* (links de confirmação e de nova senha).
