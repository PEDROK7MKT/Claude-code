# Especificação de conteúdo — Pereira Luz & Cor

Cada arquivo em `categories/` e `guides/` é um módulo ES (`export default {...}`)
lido pelo gerador (`build.mjs`). Nada de import/require; só dados.
Texto em **português do Brasil**, natural, direto, sem clichê de marketing
("soluções completas", "excelência", "qualidade incomparável" = proibido).

## Regras de veracidade (inegociáveis)

- **Não invente fatos sobre a loja**: sem preços, sem promoções, sem marcas,
  sem números ("+5.000 itens", "10 anos de experiência"), sem entrega, sem
  prazo, sem garantia própria, sem nome de dono/funcionário. A loja é **nova**,
  fica na **Rua São Francisco, 55 – bairro Jardim Ouro Branco, Barreiras-BA** (ATENÇÃO: NÃO é Sandra Regina, nem nº 78), vende
  pelo balcão e faz **orçamento pelo WhatsApp** (o cliente monta uma lista no
  site e envia). Pode dizer "consulte disponibilidade", "trabalhamos com várias
  linhas e medidas", "confirme no WhatsApp".
- Itens de produto devem ser **genéricos** (tipo + medida), nunca marca:
  "Fio flexível 2,5 mm² (rolo 100 m)", não "Fio Sil 2,5". Exceção: nomes que
  viraram genéricos e que o cliente citou: **WD-40** (é marca, mas o produto
  é vendido na loja — pode citar), "maquita" como apelido de esmerilhadeira
  (explique que é apelido).
- Informação técnica (elétrica, hidráulica, tinta) tem que estar **correta** e
  conservadora. Elétrica: cite a NBR 5410 quando couber e sempre recomende
  eletricista qualificado para instalação. Nunca dê instrução que coloque a
  pessoa em risco (ex.: mexer em quadro energizado).
- Rendimentos de tinta variam por marca/linha: dê faixas e diga para conferir
  a embalagem.

## Regras de SEO / AEO / GEO

- **Resposta primeiro**: a 1ª frase de cada resposta/seção responde a pergunta
  de forma completa e citável (40–60 palavras), depois detalha.
- Use a cidade naturalmente ("em Barreiras", "aqui no Oeste Baiano") — no
  máximo 1 menção a cada ~150 palavras. Nada de keyword stuffing.
- Use os termos que o povo usa: "ferragista", "material elétrico", "maquita",
  "colher de pedreiro", "veda-rosca", "mangueira por metro", "massa corrida".
- Perguntas de FAQ = perguntas reais de balcão/Google, em linguagem natural.
- `seo.title` ≤ 60 caracteres, termina com `| Pereira Luz & Cor` quando couber.
  `seo.description` 140–158 caracteres, com benefício + local + chamada.
- HTML permitido em campos `html`/`a` de FAQ: `<p> <ul> <ol> <li> <strong>
  <em> <table> <thead> <tbody> <tr> <th> <td> <a href="/caminho/">` (links
  internos relativos à raiz, com barra no fim). Nada de classes/estilos.

## Categorias (slug → nome)

| slug | nome | ícone |
|---|---|---|
| materiais-eletricos | Materiais Elétricos | bolt |
| iluminacao-e-led | Iluminação e LED | bulb |
| tintas-e-pintura | Tintas e Pintura | roller |
| ferramentas | Ferramentas | drill |
| hidraulica | Hidráulica | drop |
| equipamentos-para-obra | Equipamentos para Obra | ladder |
| fixacao-e-lubrificantes | Fixação, Colas e Lubrificantes | nut |
| utilidades-e-epi | Utilidades e EPI | helmet |

## Guias (slug → categoria)

| slug | categoria |
|---|---|
| quantas-latas-de-tinta-preciso | tintas-e-pintura (tem calculadora: `widget: 'paint-calculator'`) |
| tinta-acrilica-ou-latex-pva | tintas-e-pintura |
| massa-corrida-ou-massa-acrilica | tintas-e-pintura |
| como-pintar-parede-passo-a-passo | tintas-e-pintura (tem `howTo`) |
| qual-fio-usar-no-chuveiro-eletrico | materiais-eletricos |
| como-escolher-disjuntor | materiais-eletricos |
| como-escolher-lampada-led | iluminacao-e-led |
| fita-de-led-como-escolher-e-instalar | iluminacao-e-led |
| furadeira-parafusadeira-ou-martelete | ferramentas |
| qual-disco-usar-na-esmerilhadeira | ferramentas |
| qual-tamanho-de-caixa-d-agua | hidraulica |
| wd-40-para-que-serve | fixacao-e-lubrificantes |

## Formato — categoria (`categories/<slug>.mjs`)

```js
export default {
  slug: 'materiais-eletricos',
  order: 1,                       // ordem no menu (1–8, tabela acima)
  icon: 'bolt',
  name: 'Materiais Elétricos',
  shortName: 'Elétrica',          // rótulo curto (menu mobile, chips)
  seo: {
    title: 'Material Elétrico em Barreiras-BA | Pereira Luz & Cor',
    description: '…140–158 caracteres…',
  },
  h1: 'Materiais elétricos em Barreiras',
  kicker: 'Fios, disjuntores, tomadas e tudo para a sua instalação',  // ≤ 70 chars
  intro: '…parágrafo resposta-primeiro, 50–80 palavras: o que a pessoa encontra aqui na Pereira, para quem, e como pedir orçamento…',
  cardBlurb: '…1 frase ≤ 90 caracteres para o card da home…',
  highlights: ['…', '…', '…'],     // 3 benefícios curtos (≤ 40 chars cada), sem promessas inventadas
  groups: [                        // 4–7 subcategorias
    {
      name: 'Fios e cabos',
      description: '…1–2 frases úteis (medidas comuns, para que serve)…',
      items: ['Fio flexível 1,5 mm²', 'Fio flexível 2,5 mm²', '…'],   // 5–10 itens genéricos por grupo
    },
  ],
  tips: [                          // 2–3 "Dicas do balcão": conselho prático de especialista
    { title: '…', body: '…2–3 frases…' },
  ],
  faq: [                           // 5–7 perguntas
    { q: '…?', a: '…resposta-primeiro 40–90 palavras, pode ter <strong> e links internos…' },
  ],
  relatedGuides: ['qual-fio-usar-no-chuveiro-eletrico'],          // slugs da tabela de guias
  relatedCategories: ['iluminacao-e-led', 'ferramentas'],          // 2–3 slugs
  keywords: ['material elétrico Barreiras', '…'],                  // 6–12 termos-alvo (não aparecem na página; vão para o llms.txt/plano)
}
```

## Formato — guia (`guides/<slug>.mjs`)

```js
export default {
  slug: 'qual-fio-usar-no-chuveiro-eletrico',
  category: 'materiais-eletricos',
  title: 'Qual fio usar no chuveiro elétrico? Tabela por potência',   // H1, pergunta natural
  seo: { title: '≤ 60 chars', description: '140–158 chars' },
  kicker: 'Guia rápido · Elétrica',
  readingMinutes: 6,
  summary: '…RESPOSTA RÁPIDA de 40–70 palavras que responde a pergunta do título sozinha (é o trecho que IA e Google citam)…',
  keyTakeaways: ['…', '…', '…', '…'],     // 3–5 bullets objetivos
  sections: [                              // 4–8 seções, 700–1300 palavras no total
    { h2: '…', html: '<p>…</p><ul><li>…</li></ul>' },
    // tabelas são muito bem-vindas quando houver dados (<table><thead>…)
  ],
  howTo: null,  // ou { name, totalTime: 'PT2H', supplies: ['…'], tools: ['…'], steps: [{ name, text }] }
  widget: null, // 'paint-calculator' só no guia de latas de tinta
  faq: [ { q, a } ],                       // 4–6 perguntas diferentes das seções
  cta: {
    title: 'Precisa de fio para o chuveiro?',
    text: '…1 frase convidando a montar a lista/orçamento no WhatsApp ou passar na loja no Jardim Ouro Branco…',
    items: ['Fio flexível 6 mm²', 'Disjuntor bipolar 40 A', '…'],   // 3–6 itens que vão para a lista de orçamento
  },
  relatedGuides: ['como-escolher-disjuntor'],
  sources: [ { name: 'ABNT NBR 5410', url: '' } ],  // referências técnicas reais (url opcional, só se tiver certeza)
}
```
