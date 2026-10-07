# Pereira Luz & Cor — site

Site da **Pereira Luz & Cor**, loja de ferragens, materiais elétricos, tintas e
ferramentas na Rua São Francisco, 55 – Jardim Ouro Branco, Barreiras-BA.
Feito para **SEO local, GEO (IA generativa) e AEO (respostas diretas)**.

- HTML estático gerado por um script Node **sem dependências** (`build.mjs`)
- Identidade visual da marca (preto + amarelo, raio + pincel), logo vetorial
  extraído do manual de marca
- Lista de orçamento → WhatsApp, busca instantânea, calculadora de tinta,
  selo "aberto agora", mapa sob demanda
- Schema.org completo, sitemap, robots com robôs de IA liberados, `llms.txt`
  e `llms-full.txt`, imagens Open Graph por página

## Comandos

```bash
npm run build   # gera o site em www/ (≈ 0,1 s)
npm run check   # valida os textos de categorias e guias
npm run og      # regera as imagens de compartilhamento (precisa do Playwright)
npm run audit   # auditoria técnica de SEO das páginas geradas (títulos, links, schema…)
npm run dev     # build + servidor local em http://localhost:4173
npm run demo    # grava vídeos de demonstração (desktop e celular) em demo/ — servidor rodando
```

Qualidade conferida antes da entrega: textos revisados por agentes
independentes (dados técnicos de elétrica checados contra a NBR 5410),
auditoria de SEO sem erros, axe-core (WCAG 2.2 AA) limpo nas páginas
principais, testes funcionais da lista, busca e calculadora, e QA visual de
360 px a 1920 px.

## Onde mexer

| O quê | Onde |
|---|---|
| Telefone, endereço, horário, pagamento, domínio, redes, marcas | `site.config.mjs` (**fonte única**) |
| Textos das categorias | `src/content/categories/*.mjs` |
| Guias | `src/content/guides/*.mjs` (regras em `src/content/SPEC.md`) |
| Home, contato, sobre, FAQ, calculadora | `src/pages.mjs` |
| Cabeçalho, rodapé, `<head>` | `src/layout.mjs` |
| JSON-LD | `src/schema.mjs` |
| Visual | `assets/css/site.css` |
| Interações | `assets/js/site.js` |

## Documentos de entrega

- `docs/CHECKLIST-PUBLICACAO.md` — o que confirmar com o cliente e como publicar
- `docs/GOOGLE-PERFIL-DA-EMPRESA.md` — kit completo para criar o Perfil da Empresa no Google
- `docs/ESTRATEGIA-SEO-GEO-AEO.md` — o que foi feito, por quê, e o plano de 90 dias

## Publicação

A pasta `www/` já vai versionada e pronta: pode ser publicada como está
(Vercel, Netlify, Cloudflare Pages, Hostinger). Detalhes no checklist.
