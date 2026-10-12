#!/usr/bin/env node
// Gera o site estático da FH Vistorias em ./public (sem dependências: só Node 18+).
//   node build.mjs
// Saída: páginas HTML, sitemap.xml, robots.txt, llms.txt, llms-full.txt,
// site.webmanifest, docs/jsonld/*.json e docs/PENDENCIAS.md.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SITE, BIZ, HOURS, PRICE, RETURN_POLICY, PENDENCIAS } from './src/data.mjs';
import * as ui from './src/ui.mjs';
import { graphFor } from './src/schema.mjs';
import { servicePages } from './src/pages-services.mjs';
import { infoPages } from './src/pages-info.mjs';
import { posts, blogIndex } from './src/pages-blog.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'public');
const css = readFileSync(join(ROOT, 'src/styles.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s*\n\s*/g, '')
  .replace(/\s*([{};,])\s*/g, '$1');
const js = readFileSync(join(ROOT, 'src/main.js'), 'utf8');
const jsVer = createHash('sha1').update(js).digest('hex').slice(0, 8); // cache-busting

const notFound = {
  slug: '404',
  file: '404.html',
  title: 'Página não encontrada | FH Vistorias',
  description: 'A página que você procurou não existe. Veja os serviços de vistoria da FH Vistorias em Luís Eduardo Magalhães.',
  h1: 'Página não encontrada',
  trail: [['', 'Início'], ['404', 'Página não encontrada']],
  heroSide: 'none',
  noindex: true,
  lead: 'O endereço pode ter mudado. Escolha abaixo o que você procura ou fale com a gente no WhatsApp.',
  body: '',
  cta: true,
};

const pages = [...servicePages, ...infoPages, blogIndex, ...posts, notFound];

// ---------------------------------------------------------------- render
function render(p) {
  const url = ui.abs(p.slug);
  const isHome = p.slug === '';
  const graph = graphFor(p);
  const ogImage = `${SITE.url}/images/og-fh-vistorias.png`;
  const heroFacts = p.heroSide === 'facts';
  const published = p.article
    ? `<p class="post-meta">Por <strong>${BIZ.name}</strong> · Publicado em ${fmtDate(p.published)}${p.modified && p.modified !== p.published ? ` · Atualizado em ${fmtDate(p.modified)}` : ''}</p>`
    : '';

  const hero = `<section class="hero${isHome ? '' : ' hero-sm'}">
  <div class="wrap${heroFacts ? ' split' : ''}">
    <div>
      ${isHome ? '' : ui.crumbs(p.trail)}
      <h1>${p.h1}</h1>
      ${p.tagline ? `<p class="tagline">${p.tagline}</p>` : ''}
      ${p.lead ? `<p class="lead">${p.lead}</p>` : ''}
      ${published}
      <div class="btns" style="margin-top:22px">${p.heroButtons || `${ui.btnWa('Chamar no WhatsApp', undefined, 'btn btn-wa', 'hero')}${ui.btnRoute('Como chegar', 'btn btn-ghost', 'hero')}`}</div>
    </div>
    ${heroFacts ? ui.quickFacts() : ''}
  </div>
</section>`;

  const faqs = p.faqs?.length ? ui.faqBlock(p.faqs, p.faqTitle) : '';
  const faqsHtml = p.faqOpenAll ? faqs.replace(/<details>/g, '<details open>') : faqs;

  const head = `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${ui.esc(p.title)}</title>
<meta name="description" content="${ui.esc(p.description)}">
${p.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
${p.noindex ? '' : `<link rel="canonical" href="${url}">\n<link rel="alternate" hreflang="pt-BR" href="${url}">\n<link rel="alternate" hreflang="x-default" href="${url}">`}
<meta name="theme-color" content="#111111">
<meta name="format-detection" content="telephone=no">
<meta name="geo.region" content="BR-BA">
<meta name="geo.placename" content="${BIZ.city}">
${SITE.gscVerification ? `<meta name="google-site-verification" content="${SITE.gscVerification}">` : ''}
${SITE.bingVerification ? `<meta name="msvalidate.01" content="${SITE.bingVerification}">` : ''}
<meta property="og:type" content="${p.article ? 'article' : 'website'}">
<meta property="og:locale" content="${SITE.locale}">
<meta property="og:site_name" content="${BIZ.name}">
<meta property="og:title" content="${ui.esc(p.title)}">
<meta property="og:description" content="${ui.esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="FH Vistorias — vistoria veicular credenciada pelo DETRAN-BA em Luís Eduardo Magalhães">
${p.article ? `<meta property="article:published_time" content="${p.published}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ui.esc(p.title)}">
<meta name="twitter:description" content="${ui.esc(p.description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/barlow-condensed-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
${p.noindex ? '' : `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`}
</head>`;

  const html = `${head}
<body>
${ui.sprite}
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${ui.header(p.slug)}
<main id="conteudo">
${hero}
${p.slug === '404' ? `<section class="sec"><div class="wrap">${notFoundLinks()}</div></section>` : ''}
${p.body || ''}
${faqsHtml}
${p.cta === false ? '' : ui.ctaBand()}
</main>
${ui.footer()}
${SITE.ga4Id ? `<script>window.FH_GA4=${JSON.stringify(SITE.ga4Id)}</script>` : ''}
<script src="/assets/main.js?v=${jsVer}" defer></script>
</body>
</html>
`;
  return { html: tidy(html), graph };
}

function notFoundLinks() {
  return `<div class="grid grid-3">
  ${[
    ['', 'Página inicial', 'Vistoria veicular em LEM'],
    ['vistoria-de-transferencia', 'Vistoria de transferência', 'Passo a passo, documentos e valor'],
    ['valores', 'Valores', `${PRICE.display} — carro, moto e caminhão`],
    ['documentos-necessarios', 'Documentos', 'O que levar para a vistoria'],
    ['perguntas-frequentes', 'Perguntas frequentes', 'Respostas diretas'],
    ['contato', 'Contato', 'Endereço, mapa e horário'],
  ]
    .map(([s, t, d]) => `<a class="card" href="${ui.href(s)}"><h2 style="font-size:1.45rem">${t}</h2><p>${d}</p></a>`)
    .join('\n  ')}
</div>`;
}

const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const tidy = (h) => h.replace(/\n\s*\n+/g, '\n').replace(/[ \t]+\n/g, '\n');

// ---------------------------------------------------------------- write
const keep = new Set(['assets', 'images']);
if (existsSync(OUT)) for (const f of readdirSync(OUT)) if (!keep.has(f) && !/\.(png|ico|svg)$/.test(f)) rmSync(join(OUT, f), { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
mkdirSync(join(ROOT, 'docs/jsonld'), { recursive: true });
writeFileSync(join(OUT, 'assets/main.js'), js);

const report = [];
for (const p of pages) {
  const { html, graph } = render(p);
  const file = p.file || `${p.slug}.html`;
  mkdirSync(dirname(join(OUT, file)), { recursive: true });
  writeFileSync(join(OUT, file), html);
  if (!p.noindex) writeFileSync(join(ROOT, 'docs/jsonld', `${(p.slug || 'home').replace(/\//g, '__')}.json`), JSON.stringify(graph, null, 2) + '\n');
  report.push({ file, title: p.title.length, desc: p.description.length });
}

// ---------------------------------------------------------------- sitemap / robots
const indexable = pages.filter((p) => !p.noindex);
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .map((p) => `  <url><loc>${ui.abs(p.slug)}</loc><lastmod>${p.modified || p.published || SITE.updated}</lastmod><changefreq>${p.changefreq || (p.article ? 'yearly' : 'monthly')}</changefreq><priority>${p.priority || '0.7'}</priority></url>`)
  .join('\n')}
</urlset>
`
);

const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'Googlebot'];
writeFileSync(
  join(OUT, 'robots.txt'),
  `# FH Vistorias — buscadores e assistentes de IA são bem-vindos.
User-agent: *
Allow: /

${aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}

Sitemap: ${SITE.url}/sitemap.xml
`
);

// ---------------------------------------------------------------- llms.txt
const facts = `- Nome: ${BIZ.name} (${BIZ.alternateName})
- O que é: empresa credenciada pelo DETRAN-BA para vistoria veicular${BIZ.detranCredential ? ` (credenciamento nº ${BIZ.detranCredential})` : ''}
- Endereço: ${BIZ.street}, ${BIZ.district}, ${BIZ.city} – ${BIZ.state}, ${BIZ.postalCode}
- Telefone/WhatsApp: ${BIZ.phoneDisplay} — https://wa.me/${BIZ.whatsappNumber}
- Horário: ${HOURS.text}. ${HOURS.weekendText}.
- Valor: ${PRICE.display} para moto, carro e caminhão/reboque (valores conferidos em ${SITE.updatedLabel})
- Agendamento: não é necessário
- Laudo: emitido na hora, com validade imediata para o órgão de trânsito
- Reprovação: retorno em até ${RETURN_POLICY.days} dias úteis sem custo adicional
- Veículos atendidos: carro, moto, caminhão, reboque e semirreboque
- Instagram: ${BIZ.instagram}`;

const keyPages = indexable.filter((p) => !p.article && p.slug !== 'politica-de-privacidade');
writeFileSync(
  join(OUT, 'llms.txt'),
  `# ${BIZ.name} — ${BIZ.city} (BA)

> Empresa credenciada pelo DETRAN-BA que realiza vistoria veicular de transferência para carros, motos e caminhões em ${BIZ.city}, Bahia, com laudo emitido na hora, sem agendamento e por ${PRICE.display}.

## Fatos
${facts}

## Páginas principais
${keyPages.map((p) => `- [${p.h1.replace('<span class="hl">', ' — ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}](${ui.abs(p.slug)}): ${p.description}`).join('\n')}

## Artigos
${posts.map((p) => `- [${p.h1}](${ui.abs(p.slug)}): ${p.description}`).join('\n')}

## Opcional
- [Versão completa em texto para IA](${SITE.url}/llms-full.txt)
`
);

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const allFaqs = new Map();
for (const p of pages) for (const f of p.faqs || []) allFaqs.set(strip(f.q), strip(f.a));
writeFileSync(
  join(OUT, 'llms-full.txt'),
  `# ${BIZ.name} — ${BIZ.city} (BA)

> Resumo factual para assistentes de IA. Fonte oficial: ${SITE.url}/ — atualizado em ${SITE.updatedLabel}.

## Fatos
${facts}

## Como funciona a vistoria (4 etapas)
${['Chegada', 'Atendimento', 'Vistoria', 'Emissão do laudo'].map((n, i) => `${i + 1}. ${n}`).join('\n')}

## Serviços
${PRICE.table.map((r) => `- ${r.item}: ${r.price} — ${ui.abs(r.slug)}`).join('\n')}
- Retorno após reprovação (até ${RETURN_POLICY.days} dias úteis): sem custo adicional — ${ui.abs('vistoria-reprovada-o-que-fazer')}

## Perguntas e respostas
${[...allFaqs].map(([q, a]) => `### ${q}\n${a}`).join('\n\n')}
`
);

// ---------------------------------------------------------------- manifest / headers
writeFileSync(
  join(OUT, 'site.webmanifest'),
  JSON.stringify(
    {
      name: `${BIZ.name} — Vistoria veicular em LEM`,
      short_name: BIZ.name,
      description: 'Vistoria veicular credenciada pelo DETRAN-BA em Luís Eduardo Magalhães (BA).',
      start_url: '/',
      display: 'standalone',
      lang: 'pt-BR',
      background_color: '#111111',
      theme_color: '#111111',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    },
    null,
    2
  ) + '\n'
);

// ---------------------------------------------------------------- pendências
writeFileSync(
  join(ROOT, 'docs/PENDENCIAS.md'),
  `# Pendências a confirmar com o cliente

> Gerado por \`node build.mjs\` a partir de \`src/data.mjs\`. Enquanto um item estiver aqui,
> o site usa redação neutra (sem inventar o dado). Depois de confirmar, edite \`src/data.mjs\`
> (ou o texto indicado) e rode o build de novo.

| # | Item | Onde mudar | Situação atual no site |
|---|---|---|---|
${PENDENCIAS.map((x, i) => `| ${i + 1} | ${x.campo} | \`${x.onde}\` | ${x.nota} |`).join('\n')}
`
);

// ---------------------------------------------------------------- relatório
const bad = report.filter((r) => r.title > 60 || r.desc > 155);
console.log(`✓ ${report.length} páginas geradas em public/`);
if (bad.length) console.warn('⚠ title > 60 ou description > 155:', bad);
console.log(`⚠ ${PENDENCIAS.length} pendências a confirmar — ver docs/PENDENCIAS.md`);
