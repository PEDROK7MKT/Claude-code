# Checklist de publicação — FH Vistorias

Legenda: ✅ já feito no código · ☐ depende do cliente/da conta

## Antes de publicar (conteúdo)
- ☐ Resolver as pendências de [`PENDENCIAS.md`](PENDENCIAS.md) — principalmente **valor vigente (R$ 237,00)**,
  **número do credenciamento DETRAN-BA**, CNPJ/razão social, sábado/feriados e formas de pagamento
- ☐ Validar com a empresa a tabela de **documentos por situação** (`/documentos-necessarios`)
- ☐ Fotos reais: fachada, recepção, área de vistoria, equipe (substituir/acrescentar na página Sobre)
- ☐ Logo em vetor (SVG/PDF) — o site usa uma recriação em HTML/SVG da marca
- ✅ Nenhum "Lorem ipsum"; nenhum dado [CONFIRMAR] afirmado como fato (redação neutra até confirmar)
- ✅ Preço e horário vêm de um único arquivo (`src/data.mjs`) → idênticos em todas as páginas, JSON-LD e `llms.txt`
- ✅ "Atualizado em outubro de 2026" nas páginas (trocar `SITE.updated`/`updatedLabel` a cada revisão trimestral)

## SEO on-page e técnico
- ✅ 1 H1 por página, title ≤ 60 e description ≤ 155, únicos (verificado por `tools/check.mjs`)
- ✅ H2 em formato de pergunta + resposta direta logo abaixo (bloco `.answer`, 40–60 palavras)
- ✅ Canonical, `hreflang pt-BR`, Open Graph/Twitter, favicon, `site.webmanifest`, `theme-color`
- ✅ Breadcrumbs visíveis + `BreadcrumbList`
- ✅ JSON-LD: LocalBusiness/AutomotiveBusiness (mesmo `@id` em todo o site), WebSite, WebPage,
  Service, FAQPage, HowTo, BlogPosting — cópia formatada em `docs/jsonld/`
- ✅ `sitemap.xml`, `robots.txt` (libera Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended…), `llms.txt` e `llms-full.txt`
- ✅ 404 útil (noindex), URLs limpas sem `.html`, redirecionamento `www → sem www`
- ✅ Imagens WebP com `alt`, `width/height` e `loading="lazy"`; hero sem imagem (LCP = texto)
- ✅ Fontes self-hosted (woff2, `font-display: swap`, preload), CSS inline, JS de 3 KB com `defer`
- ✅ Mapa do Google carregado só no clique (performance + privacidade)
- ✅ Lighthouse mobile 100/100/100/100 nas páginas testadas
- ☐ Rodar o [Rich Results Test](https://search.google.com/test/rich-results) e o [Schema Markup Validator](https://validator.schema.org/) com a URL publicada
- ☐ PageSpeed Insights com a URL publicada (dados reais de campo aparecem após ~28 dias de tráfego)
- ☐ Teste real em celular: botões WhatsApp, Ligar e Rota

## Conversão e medição
- ✅ WhatsApp com mensagem pré-preenchida em todas as páginas (hero, header, faixa CTA, flutuante, barra mobile)
- ✅ Telefone clicável e rota no Google Maps
- ✅ Eventos `whatsapp_click`, `phone_click`, `directions_click` (parâmetro `link_location`)
- ☐ Criar propriedade GA4 → colar o ID em `SITE.ga4Id` → marcar os 3 eventos como **eventos-chave**
- ☐ Google Search Console (verificação por DNS ou meta `SITE.gscVerification`) → enviar `sitemap.xml` → pedir indexação da home, `/vistoria-de-transferencia`, `/valores`, `/contato`
- ☐ Bing Webmaster Tools (dá para importar do Search Console) → enviar sitemap
- ✅ Aviso de cookies (LGPD) — só aparece quando há GA4 configurado; GA só carrega após "Aceitar"
- ✅ Política de privacidade

## Domínio e hospedagem
- ☐ Registrar `fhvistorias.com.br` (registro.br) — se for outro, trocar `SITE.url` e o redirect do `vercel.json`
- ☐ Projeto na Vercel com **Root Directory = `sites/fh-vistorias`**; adicionar domínio com e sem www
- ☐ E-mail profissional (ex.: contato@fhvistorias.com.br) → `BIZ.email`

## Google Perfil de Empresa e presença local
Ver [`GOOGLE-PERFIL-EMPRESA.md`](GOOGLE-PERFIL-EMPRESA.md).
- ☐ Criar e verificar o perfil (nome **sem** palavra-chave)
- ☐ Colar URL do perfil, link de avaliação e coordenadas em `src/data.mjs` e rodar o build
- ☐ Bio do Instagram + link do site; WhatsApp Business com catálogo e horário
- ☐ Bing Places, Apple Business Connect, Facebook, Waze — NAP idêntico

## Depois de publicar (30/60/90 dias)
- ☐ 20 avaliações em 60 dias (QR no balcão + mensagem pós-atendimento)
- ☐ 1–2 postagens por semana no Perfil de Empresa
- ☐ 2 posts/mês no blog (pautas na seção 12 do briefing)
- ☐ Revisar Search Console mensalmente e ajustar títulos com CTR baixo
- ☐ Ampliar o FAQ com perguntas reais que chegam no WhatsApp
- ☐ Teste de visibilidade em IA (ChatGPT, Gemini, Perplexity, Google): "onde fazer vistoria em Luís Eduardo Magalhães?" — registrar se citam a FH
- ☐ Páginas regionais só se houver demanda real de cidades vizinhas
