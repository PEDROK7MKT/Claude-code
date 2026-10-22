# Site — FH Vistorias (Luís Eduardo Magalhães – BA)

Site institucional da **FH Vistorias**, vistoria veicular credenciada pelo DETRAN-BA em LEM,
construído a partir do briefing de SEO local + GEO + AIO (estudo do Instagram @fhvistorialem).

- **Estático e sem dependências:** um gerador em Node (`build.mjs`) escreve HTML puro em `public/`.
  Nada de framework no navegador; o JS total tem ~3 KB.
- **Fonte única de verdade:** endereço, telefone, horário, preço e pendências ficam em
  [`src/data.mjs`](src/data.mjs). Mudou ali → muda no site inteiro, no JSON-LD, no `llms.txt`
  e no sitemap. É isso que mantém o NAP idêntico em todo lugar.
- **Lighthouse (mobile, 4G simulado):** 100 em Performance, Acessibilidade, Boas práticas e SEO
  na home, `/valores` e `/vistoria-de-transferencia` (LCP 1,2–1,4 s, CLS 0, TBT 0 ms).

## Estrutura

```
sites/fh-vistorias/
├── build.mjs                 gera public/ (HTML, sitemap, robots, llms.txt, manifest)
├── vercel.json               deploy na Vercel (URLs limpas, www → sem www, cache, headers)
├── src/
│   ├── data.mjs              ★ dados da empresa + lista de pendências
│   ├── pages-services.mjs    home, página-pilar local e páginas de serviço
│   ├── pages-info.mjs        valores, como funciona, documentos, FAQ, sobre, contato, privacidade
│   ├── pages-blog.mjs        blog (2 artigos iniciais) — modelo para novos posts
│   ├── content-shared.mjs    FAQ-base, passo a passo, diferenciais, cards de serviço
│   ├── ui.mjs                header, footer, botões, ícones, faixa de respostas rápidas
│   ├── schema.mjs            JSON-LD (LocalBusiness, Service, FAQPage, HowTo, BlogPosting, Breadcrumb)
│   ├── styles.css            CSS (inline em cada página no build)
│   └── main.js               menu, eventos de clique, consentimento LGPD, mapa sob demanda
├── public/                   ★ site pronto para publicar (gerado — não editar à mão)
├── tools/
│   ├── check.mjs             checagem pré-publicação no Chromium (celular + desktop)
│   └── render-brand.mjs      gera favicon, ícones, logo PNG e imagem Open Graph
├── docs/
│   ├── PENDENCIAS.md         itens [CONFIRMAR] (gerado pelo build)
│   ├── CHECKLIST-PUBLICACAO.md
│   ├── GOOGLE-PERFIL-EMPRESA.md   kit do Google Meu Negócio, Instagram, WhatsApp e citações
│   └── jsonld/*.json         JSON-LD de cada página, formatado (para validar/consultar)
└── brand-source/             mídias originais recebidas (perfil e posts do Instagram)
```

## Páginas (18 indexáveis + 404)

| URL | Função | Schema |
|---|---|---|
| `/` | Home — respostas rápidas (onde, quanto, o que levar, agendar) | LocalBusiness, FAQPage |
| `/vistoria-veicular-luis-eduardo-magalhaes` | Pilar local | Service, FAQPage |
| `/vistoria-de-transferencia` | Transferência de propriedade | Service, FAQPage |
| `/vistoria-de-carro` · `/vistoria-de-moto` · `/vistoria-de-caminhao` | Por tipo de veículo | Service, FAQPage |
| `/segunda-via-de-vistoria` | Nova via do laudo | Service, FAQPage |
| `/vistoria-reprovada-o-que-fazer` | Retorno grátis em 30 dias úteis | Service, FAQPage |
| `/valores` | Tabela de preços | FAQPage |
| `/como-funciona` | 4 etapas | HowTo, FAQPage |
| `/documentos-necessarios` | O que levar, por situação | FAQPage |
| `/perguntas-frequentes` | 16 perguntas | FAQPage |
| `/sobre` · `/contato` | E-E-A-T e NAP | AboutPage · ContactPage |
| `/blog` + 2 artigos | Conteúdo de cauda longa | CollectionPage · BlogPosting |
| `/politica-de-privacidade` | LGPD | WebPage |

Todas têm: 1 H1, title ≤ 60 e description ≤ 155 caracteres, canonical, Open Graph, breadcrumbs
(visível + schema), NAP no rodapé, "atualizado em", CTA de WhatsApp com mensagem pré-preenchida,
botão flutuante (desktop) e barra Ligar/WhatsApp/Rota (celular).

**Páginas regionais (Barreiras etc.) não foram criadas de propósito:** o briefing pede para criá-las
só com demanda real e conteúdo único, para não virarem páginas *doorway*.

## Uso

```bash
cd sites/fh-vistorias
node build.mjs                 # gera public/ e docs/ (Node 18+)
node tools/check.mjs           # valida todas as páginas (precisa do Playwright/Chromium)
node tools/render-brand.mjs    # só quando mudar a marca (precisa do Playwright + ImageMagick)
npx serve public               # pré-visualizar em http://localhost:3000
```

### Editar dados (preço, horário, credenciamento…)
1. Abra `src/data.mjs` e altere o campo. Itens vazios (`''`) não aparecem no site.
2. Rode `node build.mjs` e `node tools/check.mjs`.
3. Quando confirmar uma pendência, remova-a do array `PENDENCIAS` no mesmo arquivo.

### Novo post no blog
Copie um objeto do array `posts` em `src/pages-blog.mjs`, troque `slug` (`blog/...`), datas,
título (≤ 60), descrição (≤ 155) e conteúdo, e rode o build. Índice, sitemap e `llms.txt` se atualizam sozinhos.

### Analytics (GA4) e verificação de buscadores
Preencha `SITE.ga4Id`, `SITE.gscVerification` e `SITE.bingVerification` em `src/data.mjs`.
Com o GA4 preenchido, o site passa a mostrar o aviso de cookies e só carrega o Google Analytics
depois de "Aceitar". Os eventos `whatsapp_click`, `phone_click` e `directions_click` são enviados
com o parâmetro `link_location` (hero, header, barra_mobile, faq…). Marque-os como **eventos-chave** no GA4.

## Deploy (Vercel)

**No ar em:** https://fh-vistorias.vercel.app (projeto `fh-vistorias` na Vercel, publicado a partir da
branch `claude/jolly-heisenberg-xic1ac`). O projeto ainda não está ligado ao Git para deploy automático:
cada atualização precisa de um novo deploy de produção (ou ligue o repositório em Settings → Git).


1. Em vercel.com → **Add New → Project**, importe este repositório.
2. **Root Directory:** `sites/fh-vistorias`. O `vercel.json` já define build (`node build.mjs`),
   saída (`public`), URLs limpas, redirecionamento `www → sem www` e cabeçalhos de cache/segurança.
3. Adicione o domínio (`fhvistorias.com.br` e `www.fhvistorias.com.br`) em **Settings → Domains**.
4. Se o domínio for outro, troque em `src/data.mjs` (`SITE.url`) **e** no redirect do `vercel.json`.

Qualquer hospedagem estática também serve: basta publicar a pasta `public/` com suporte a
"URL sem .html" (Netlify, Cloudflare Pages, GitHub Pages com ajuste).

## Créditos
- Fontes: Barlow e Barlow Condensed (SIL Open Font License — `public/assets/fonts/OFL-LICENSE.txt`).
- Ícones: traçados baseados no Tabler Icons (MIT).
- Imagens de posts: artes do próprio Instagram da FH Vistorias.
