// ─────────────────────────────────────────────────────────────
// Agência Viva — dados centrais do site
// Tudo que aparece no site (e no schema.org) sai daqui.
// NAP (nome, endereço, telefone) PRECISA ser idêntico ao do
// Perfil da Empresa no Google (Google Maps). Troque os TODO.
// ─────────────────────────────────────────────────────────────

export const site = {
  // TODO: domínio definitivo (sem barra no final)
  url: 'https://agenciaviva.com.br',
  name: 'Agência Viva',
  legalName: 'Agência Viva Marketing', // TODO: razão social, se houver
  slogan: 'Agência de Marketing em Barreiras - BA',
  // TODO: WhatsApp real no formato 55 + DDD + número (só dígitos)
  whatsapp: '5577999999999',
  phoneDisplay: '(77) 99999-9999', // TODO
  email: 'contato@agenciaviva.com.br', // TODO
  instagram: 'https://www.instagram.com/agenciaviva_/',
  instagramHandle: '@agenciaviva_',
  address: {
    street: 'Rua TODO, 000', // TODO: endereço exato do Google Maps
    district: 'Centro', // TODO
    city: 'Barreiras',
    state: 'BA',
    zip: '47800-000', // TODO
    country: 'BR',
  },
  // Centro de Barreiras — ajuste para o ponto exato do Perfil no Google
  geo: { lat: -12.1528, lng: -44.99 },
  // TODO: link "compartilhar" do Perfil da Empresa no Google Maps
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ag%C3%AAncia+Viva+Barreiras+BA',
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
    { days: ['Saturday'], opens: '08:00', closes: '12:00' },
  ],
  hoursDisplay: 'Seg a sex, 8h–18h · Sáb, 8h–12h',
  founded: '2016', // TODO: confirmar a data de abertura do CNPJ
}

export const wa = (msg = 'Olá, Agência Viva! Quero crescer no digital. Podemos conversar?') =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`

// ─── Serviços ────────────────────────────────────────────────
export const services = [
  {
    slug: 'gestao-de-trafego-pago',
    name: 'Gestão de Tráfego Pago',
    short: 'Tráfego Pago',
    icon: 'target',
    kw: 'gestão de tráfego pago em Barreiras',
    pitch: "Anúncio no Instagram, no Facebook e no Google que faz o WhatsApp tocar, com gente da sua cidade do outro lado.",
    why: "No Oeste, muita compra começa numa conversa de WhatsApp. Por isso a gente monta campanhas de mensagem com raio bem desenhado: quem está em Barreiras vê o anúncio pensado pra Barreiras, quem está em LEM vê o de LEM. E como a disputa por anúncio no interior costuma ser menor que nas capitais, verba bem cuidada tende a render mais por aqui.",
    title: 'Gestão de Tráfego Pago em Barreiras - BA | Meta Ads e Google Ads',
    desc: 'Anúncios no Instagram, Facebook e Google que trazem cliente de verdade para empresas de Barreiras e do Oeste da Bahia. Campanhas com meta, relatório e acompanhamento.',
    lead: 'Anúncio bonito que não vende é gasto. A gente monta campanhas no Meta Ads (Instagram e Facebook) e no Google Ads pensadas para o bolso e para a praça de Barreiras: público certo, raio certo, oferta certa.',
    bullets: [
      'Campanhas de mensagem direto no WhatsApp',
      'Google Ads para quem já está procurando o seu serviço',
      'Segmentação por bairro, cidade e raio no Oeste baiano',
      'Pixel, conversões e rastreamento configurados',
      'Relatório claro: quanto entrou, quanto custou cada contato',
    ],
    steps: ['Diagnóstico do negócio e da concorrência local', 'Estrutura de campanhas e criativos', 'Otimização semanal com base em dados', 'Relatório mensal e plano do mês seguinte'],
    faq: [
      ['Quanto preciso investir em anúncios em Barreiras?', 'Dá para começar com verbas pequenas, a partir de R$ 15 a R$ 30 por dia, porque o custo por clique no interior costuma ser menor que nas capitais. A verba ideal depende do seu ticket e da sua meta; a gente calcula junto no diagnóstico.'],
      ['Em quanto tempo aparecem resultados?', 'Campanhas de mensagem costumam gerar os primeiros contatos já na primeira semana. A otimização fica boa de verdade entre 30 e 60 dias, quando já existe dado suficiente.'],
      ['Vocês atendem fora de Barreiras?', 'Sim. Atendemos Luís Eduardo Magalhães, São Desidério, Formosa do Rio Preto, Correntina e todo o Oeste da Bahia, além de empresas de outras regiões de forma remota.'],
    ],
  },
  {
    slug: 'social-media',
    name: 'Social Media e Gestão de Instagram',
    short: 'Social Media',
    icon: 'spark',
    kw: 'social media em Barreiras',
    pitch: "Feed com cara de marca, Reels que prendem e stories que conversam. Seu Instagram tão bom quanto a sua empresa.",
    why: "Em cidade do interior todo mundo se conhece, e o Instagram virou a vitrine que o cliente olha antes de sair de casa. Perfil parado ou com foto torta passa a impressão de empresa parada. Um calendário com a cara da região, com safra, feriados, festas da cidade e datas do comércio local, deixa a sua marca presente o ano inteiro.",
    title: 'Social Media em Barreiras - BA | Gestão de Instagram para Empresas',
    desc: 'Gestão de Instagram com estratégia, design e legendas que vendem. Social media para empresas de Barreiras e do Oeste da Bahia com a cara da sua marca.',
    lead: 'Seu Instagram é a vitrine que o cliente vê antes de entrar na loja. A gente cuida do calendário, dos posts, dos stories e da linha editorial para que a sua marca pareça tão boa quanto ela é.',
    bullets: [
      'Planejamento mensal de conteúdo',
      'Design de posts e carrosséis no padrão da sua marca',
      'Roteiros de Reels e stories que geram conversa',
      'Legendas com SEO para Instagram e chamadas para ação',
      'Relatório de alcance, seguidores e mensagens',
    ],
    steps: ['Imersão na marca e no público', 'Linha editorial e calendário', 'Produção, aprovação e publicação', 'Análise mensal e ajustes'],
    faq: [
      ['Quantos posts por mês vocês fazem?', 'Temos pacotes a partir de 8 posts mensais e planos com Reels e stories diários. Montamos o volume de acordo com o objetivo e o momento da sua empresa.'],
      ['Preciso gravar os vídeos?', 'Podemos roteirizar para você gravar com o celular, ou agendar uma diária de produção em Barreiras com a nossa equipe.'],
      ['Vocês respondem os directs?', 'Oferecemos atendimento de direct e comentários como serviço adicional, com roteiro de respostas alinhado ao seu comercial.'],
    ],
  },
  {
    slug: 'criacao-de-sites',
    name: 'Criação de Sites e Landing Pages',
    short: 'Sites',
    icon: 'window',
    kw: 'criação de sites em Barreiras',
    pitch: "Site rápido no celular, bonito de verdade e pronto pra aparecer no Google quando alguém da região pesquisa.",
    why: "Quando alguém de Barreiras pesquisa um serviço \"perto de mim\", o Google olha pro seu Perfil da Empresa e também pro seu site. Um site leve, com endereço, serviços e cidades atendidas bem escritos, é o que sustenta o SEO local. E no 4G da estrada, site pesado é cliente que desiste antes de ver o que você vende.",
    title: 'Criação de Sites em Barreiras - BA | Sites Rápidos e com SEO',
    desc: 'Criação de sites profissionais e landing pages em Barreiras - BA. Rápidos no celular, otimizados para o Google e prontos para gerar contato no WhatsApp.',
    lead: 'Site lento e genérico espanta cliente. A gente cria sites e landing pages rápidos, bonitos no celular e já estruturados para aparecer no Google quando alguém de Barreiras pesquisa pelo que você vende.',
    bullets: [
      'Design exclusivo, nada de template genérico',
      'Carregamento rápido (Core Web Vitals no verde)',
      'SEO técnico e SEO local desde o primeiro dia',
      'Botão de WhatsApp, formulários e integração com anúncios',
      'Domínio, hospedagem e certificado SSL configurados',
    ],
    steps: ['Briefing e pesquisa de palavras-chave', 'Estrutura, textos e layout', 'Desenvolvimento e testes', 'Publicação, Search Console e acompanhamento'],
    faq: [
      ['Quanto tempo leva para o site ficar pronto?', 'Landing pages ficam prontas em 7 a 10 dias úteis. Sites institucionais com várias páginas levam de 15 a 30 dias, dependendo do conteúdo.'],
      ['O site aparece no Google?', 'Sim. Entregamos com SEO técnico, sitemap, dados estruturados e cadastro no Google Search Console. Posicionamento é construído com o tempo, e o SEO local acelera muito em cidades como Barreiras.'],
      ['Eu consigo editar o site depois?', 'Conseguimos entregar com painel de edição ou manter as atualizações como parte de um plano mensal, o que for mais prático para você.'],
    ],
  },
  {
    slug: 'google-meu-negocio-seo-local',
    name: 'Google Meu Negócio e SEO Local',
    short: 'SEO Local',
    icon: 'pin',
    kw: 'SEO local e Google Meu Negócio em Barreiras',
    pitch: "Seu Perfil no Google caprichado pra você aparecer no mapa quando alguém procura \"perto de mim\".",
    why: "Pra quem tem negócio físico no Oeste, o Google Maps virou a nova lista telefônica. Quem aparece nos primeiros resultados do mapa fica com boa parte das ligações e dos pedidos de rota. A boa notícia: em cidades como Barreiras e Luís Eduardo Magalhães a disputa por essas posições ainda é bem menor do que nas capitais.",
    title: 'SEO Local e Google Meu Negócio em Barreiras - BA | Apareça no Maps',
    desc: 'Coloque sua empresa no topo do Google Maps em Barreiras e no Oeste da Bahia. Otimização do Perfil da Empresa no Google, avaliações e SEO local.',
    lead: 'Quando alguém digita "perto de mim" em Barreiras, as três empresas que aparecem no mapa ficam com a maior parte das ligações. A gente trabalha para que uma delas seja a sua.',
    bullets: [
      'Criação e verificação do Perfil da Empresa no Google',
      'Categorias, serviços, fotos e produtos otimizados',
      'Estratégia de avaliações e respostas',
      'Postagens semanais no Perfil',
      'Citações locais e consistência de nome, endereço e telefone',
    ],
    steps: ['Auditoria do perfil e dos concorrentes do mapa', 'Otimização completa do perfil', 'Rotina de posts, fotos e avaliações', 'Acompanhamento de ligações, rotas e cliques'],
    faq: [
      ['O que é o Google Meu Negócio?', 'É o antigo nome do Perfil da Empresa no Google: o cartão com endereço, telefone, fotos e avaliações que aparece no Google Maps e na busca. É gratuito e é a ferramenta de SEO local mais poderosa que existe.'],
      ['Em quanto tempo subo no Google Maps?', 'Perfis bem otimizados costumam ganhar posições em 30 a 90 dias. Em cidades do interior como Barreiras, a concorrência costuma ser menor, então os resultados tendem a vir mais rápido.'],
      ['Vocês compram avaliações?', 'Não. Avaliações falsas violam as políticas do Google e podem derrubar o perfil. Criamos um processo para pedir avaliações reais aos seus clientes satisfeitos.'],
    ],
  },
  {
    slug: 'identidade-visual',
    name: 'Branding e Identidade Visual',
    short: 'Branding',
    icon: 'drop',
    kw: 'identidade visual em Barreiras',
    pitch: "Logo, cores e jeito de falar que funcionam no feed, na fachada, no uniforme e no adesivo da caminhonete.",
    why: "Muita empresa tradicional do Oeste cresceu no boca a boca e hoje tem uma marca que não acompanha o tamanho que ela já tem. Uma identidade bem feita faz a sua empresa parecer o que ela é: séria, grande e confiável, do cartão de visita ao outdoor na beira da BR.",
    title: 'Identidade Visual e Criação de Logo em Barreiras - BA | Branding',
    desc: 'Criação de logo, identidade visual e manual de marca para empresas de Barreiras e do Oeste da Bahia. Marca forte, memorável e pronta para o digital.',
    lead: 'Marca é a primeira impressão e a última lembrança. Criamos logos e identidades visuais com personalidade, que funcionam no Instagram, na fachada, no uniforme e no caminhão.',
    bullets: [
      'Criação de logotipo com variações',
      'Paleta de cores e tipografia',
      'Manual de marca simples de usar',
      'Papelaria, fachada, uniforme e frota',
      'Templates para redes sociais',
    ],
    steps: ['Briefing e pesquisa de mercado', 'Conceitos e rodada de ajustes', 'Finalização e manual de marca', 'Aplicações e templates'],
    faq: [
      ['Quantas opções de logo eu recebo?', 'Apresentamos conceitos pensados a partir do briefing e fazemos rodadas de ajuste até chegar na marca certa.'],
      ['Recebo os arquivos editáveis?', 'Sim. Você recebe os arquivos em vetor (PDF, SVG, AI) e em PNG, com fundo transparente, nas versões colorida, branca e preta.'],
      ['Vocês fazem rebranding?', 'Fazemos. Muitas empresas tradicionais de Barreiras têm história e só precisam de uma marca que acompanhe o tamanho que elas já têm.'],
    ],
  },
  {
    slug: 'producao-de-conteudo-audiovisual',
    name: 'Produção de Conteúdo e Audiovisual',
    short: 'Audiovisual',
    icon: 'play',
    kw: 'produção de vídeo em Barreiras',
    pitch: "A gente vai até você, grava o que acontece de verdade e transforma em Reels e fotos que prendem.",
    why: "Ninguém para de rolar o feed por foto de banco de imagem. O que prende é gente real, lugar real e história real, do balcão da loja à lavoura. E o Oeste tem imagem de sobra: pôr do sol no cerrado, colheita, rio, cidade crescendo. A gente usa isso a favor da sua marca.",
    title: 'Produção de Vídeo e Fotografia em Barreiras - BA | Reels e Conteúdo',
    desc: 'Filmagem, fotografia e edição de Reels para empresas em Barreiras e no Oeste da Bahia. Conteúdo de verdade, com gente de verdade, que prende a atenção.',
    lead: 'Ninguém para de rolar o feed por foto de banco de imagem. A gente vai até a sua empresa, grava e fotografa o que acontece de verdade e transforma isso em conteúdo que prende e vende.',
    bullets: [
      'Diárias de gravação em Barreiras e região',
      'Roteiro e direção de Reels',
      'Fotografia de produto, equipe e ambiente',
      'Edição com ritmo, legenda e trilha',
      'Conteúdo com influenciadores da região',
    ],
    steps: ['Pauta e roteiro', 'Diária de captação', 'Edição e aprovação', 'Publicação e impulsionamento'],
    faq: [
      ['Vocês trabalham com influenciadores?', 'Sim. Temos proximidade com criadores de conteúdo do Oeste baiano e montamos ações de influência com público da própria região.'],
      ['Quantos vídeos saem de uma diária?', 'Uma diária bem planejada rende de 6 a 12 Reels editados, além de fotos para o feed e para o site.'],
      ['Vocês gravam em fazenda e no agro?', 'Gravamos. O agronegócio é a força do Oeste da Bahia e tem muita história boa para contar em vídeo.'],
    ],
  },
]

// ─── Cidades do Oeste da Bahia ──────────────────────────────
// Cada cidade tem texto próprio para não virar conteúdo duplicado.
export const cities = [
  {
    slug: 'barreiras',
    name: 'Barreiras',
    main: true,
    geo: { lat: -12.1528, lng: -44.99 },
    dist: 'nossa casa',
    intro: 'Barreiras é a capital do Oeste baiano e o maior polo de comércio e serviços da região. É daqui que a Agência Viva opera, no mesmo ritmo das empresas da cidade: do comércio do Centro às clínicas, lojas, restaurantes e empresas ligadas ao agro que atendem toda a região.',
    angle: 'Com o crescimento da cidade, o cliente de Barreiras pesquisa no Google, compara no Instagram e chama no WhatsApp antes de sair de casa. Quem não aparece nessas três telas perde venda todos os dias para quem aparece.',
    niches: ['comércio e varejo', 'clínicas e saúde', 'restaurantes e delivery', 'imobiliárias e construção', 'revendas do agro', 'educação'],
  },
  {
    slug: 'luis-eduardo-magalhaes',
    name: 'Luís Eduardo Magalhães',
    geo: { lat: -12.0967, lng: -45.7866 },
    dist: 'a cerca de 90 km de Barreiras',
    intro: 'Luís Eduardo Magalhães, a LEM, é uma das cidades que mais crescem no Brasil e o coração do agronegócio do Oeste da Bahia. Revendas, máquinas agrícolas, serviços para fazendas e um comércio que acompanha esse ritmo acelerado.',
    angle: 'Em LEM a concorrência chega rápido. Marketing digital bem feito é o que separa a empresa lembrada da empresa que só aparece no boca a boca.',
    niches: ['máquinas e implementos agrícolas', 'revendas e insumos', 'construção civil', 'comércio', 'serviços para o agro'],
  },
  {
    slug: 'sao-desiderio',
    name: 'São Desidério',
    geo: { lat: -12.3634, lng: -44.9733 },
    dist: 'a cerca de 25 km de Barreiras',
    intro: 'São Desidério é um dos maiores produtores agrícolas do país e guarda belezas naturais como a Lagoa Azul e o Buraco do Inferno. Vizinha de Barreiras, tem um comércio local forte e um enorme potencial para o turismo.',
    angle: 'Para quem empreende em São Desidério, estar no Google Maps e ter um Instagram profissional abre as portas tanto para o morador quanto para o visitante.',
    niches: ['turismo e pousadas', 'comércio local', 'serviços para fazendas', 'alimentação'],
  },
  {
    slug: 'formosa-do-rio-preto',
    name: 'Formosa do Rio Preto',
    geo: { lat: -11.0483, lng: -45.1928 },
    dist: 'a cerca de 230 km de Barreiras',
    intro: 'Formosa do Rio Preto tem o maior território da Bahia e uma produção de grãos que coloca a cidade entre as grandes do agro brasileiro. É uma praça que cresce e precisa de marcas locais fortes.',
    angle: 'A distância não é problema: atendemos Formosa do Rio Preto com gestão remota de tráfego, redes sociais e Google, e com diárias de produção presenciais quando faz sentido.',
    niches: ['agronegócio', 'comércio', 'serviços automotivos', 'saúde'],
  },
  {
    slug: 'correntina',
    name: 'Correntina',
    geo: { lat: -13.3434, lng: -44.6368 },
    dist: 'a cerca de 230 km de Barreiras',
    intro: 'Correntina combina agricultura irrigada, rios de água cristalina e uma tradição comercial forte no sul do Oeste baiano. Uma cidade com identidade e com espaço para marcas que se comunicam bem.',
    angle: 'Aqui, o cliente valoriza a empresa conhecida. O digital amplia essa confiança para quem ainda não te conhece, dentro e fora da cidade.',
    niches: ['agro irrigado', 'turismo de rio', 'comércio', 'clínicas'],
  },
  {
    slug: 'santa-maria-da-vitoria',
    name: 'Santa Maria da Vitória',
    geo: { lat: -13.3947, lng: -44.1886 },
    dist: 'a cerca de 280 km de Barreiras',
    intro: 'Santa Maria da Vitória é polo de comércio e serviços do Vale do Corrente, com um centro movimentado que atende várias cidades vizinhas.',
    angle: 'Anúncios com raio bem desenhado e um Perfil no Google completo fazem a sua empresa ser encontrada por quem vem de toda a microrregião.',
    niches: ['comércio', 'saúde', 'educação', 'alimentação'],
  },
  {
    slug: 'bom-jesus-da-lapa',
    name: 'Bom Jesus da Lapa',
    geo: { lat: -13.2553, lng: -43.4181 },
    dist: 'no Médio São Francisco',
    intro: 'Bom Jesus da Lapa recebe romeiros de todo o Brasil e tem na fé, no Rio São Francisco e no comércio a sua força. Uma cidade onde turismo e varejo andam juntos.',
    angle: 'Hotéis, restaurantes e lojas que aparecem no Google e no Instagram antes da romaria ficam com a preferência de quem chega à cidade.',
    niches: ['hotelaria', 'turismo religioso', 'restaurantes', 'comércio'],
  },
  {
    slug: 'riachao-das-neves',
    name: 'Riachão das Neves',
    geo: { lat: -11.7461, lng: -44.9103 },
    dist: 'a cerca de 60 km de Barreiras',
    intro: 'Riachão das Neves une a força do agro com um comércio local próximo das pessoas. Vizinha de Barreiras, faz parte do dia a dia econômico do Oeste.',
    angle: 'Um Perfil no Google bem cuidado e um Instagram ativo colocam empresas de Riachão no radar de toda a região.',
    niches: ['comércio local', 'agropecuária', 'serviços'],
  },
]

// ─── Prova social ────────────────────────────────────────────
// TODO: trocar por depoimentos reais (com autorização). Deixe vazio
// para esconder a seção — nunca publique depoimento inventado.
export const testimonials = []

// ─── FAQ da home (vira FAQPage no schema) ───────────────────
export const homeFaq = [
  ['Qual a melhor agência de marketing em Barreiras?', 'A melhor agência é a que entende a sua cidade e mostra resultado com números. A Agência Viva está no mercado desde 2016, nasceu em Barreiras, conhece o comércio e o agro do Oeste da Bahia e trabalha com metas claras: mais contatos no WhatsApp, mais ligações pelo Google e mais vendas.'],
  ['Quanto custa uma agência de marketing em Barreiras?', 'Depende do escopo. Temos planos de social media, de tráfego pago e combos completos, com valores pensados para a realidade de pequenas e médias empresas do interior. Chame no WhatsApp e montamos uma proposta sob medida.'],
  ['A Agência Viva atende quais cidades?', 'Atendemos Barreiras, Luís Eduardo Magalhães, São Desidério, Formosa do Rio Preto, Correntina, Santa Maria da Vitória, Bom Jesus da Lapa, Riachão das Neves e todo o Oeste da Bahia. Também atendemos empresas de outras regiões de forma remota.'],
  ['Vocês fazem contrato de fidelidade?', 'Trabalhamos com contratos mensais transparentes. Marketing precisa de tempo para maturar, por isso recomendamos pelo menos três meses, mas você fica porque o resultado aparece.'],
  ['Como faço para aparecer no Google Maps em Barreiras?', 'Criando e otimizando o Perfil da Empresa no Google: categorias certas, fotos reais, posts frequentes, avaliações de clientes e dados consistentes. É exatamente isso que fazemos no serviço de SEO Local.'],
]
