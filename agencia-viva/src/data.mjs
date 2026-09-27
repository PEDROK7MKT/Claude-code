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
  // A razão social do CNPJ (empresário individual) leva nome e CPF da titular — NÃO publicar.
  // No schema vai só o nome fantasia registrado.
  legalName: '',
  alternateName: 'Viva Agência de Marketing',
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
  founded: '2016-11-09', // data de abertura do CNPJ (comprovante da Receita)
  cnpj: '26.513.338/0001-30',
  founder: null, // TODO: { name: 'Nome', url: '/sobre/', sameAs: ['https://www.instagram.com/...'] } — só com consentimento dela
  // perfis oficiais da AGÊNCIA (Instagram, Facebook, LinkedIn, YouTube, TikTok, link do Perfil no Google)
  sameAs: ['https://www.instagram.com/agenciaviva_/'],
}

// formulário do site → funil do CRM (chave publicável: pode ficar no navegador; o banco só aceita a função lead_do_site)
site.leads = { url: 'https://vlgehxcxiedaswtzlcmz.supabase.co', key: 'sb_publishable_HfNjQOPwTHBXCSZwUY555w_kh8l_KJc' }

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
    title: 'Gestão de Tráfego Pago em Barreiras - BA | Agência Viva',
    desc: 'Gestão de tráfego pago em Barreiras - BA: anúncios no Instagram, Facebook e Google que levam cliente pro WhatsApp, com meta, relatório e acompanhamento.',
    lead: 'Anúncio bonito que não vende é gasto. A gente monta campanhas no Meta Ads (Instagram e Facebook) e no Google Ads pensadas pro bolso e pra praça de Barreiras, com o anúncio aparecendo pra quem mora perto e pode comprar de você.',
    bullets: [
      'Campanhas de mensagem direto no WhatsApp',
      'Google Ads para quem já está procurando o seu serviço',
      'Segmentação por bairro, cidade e raio no Oeste baiano',
      'Pixel, conversões e rastreamento configurados',
      'Relatório claro: quantos contatos vieram e quanto custou cada um',
    ],
    steps: ['Diagnóstico do negócio e da concorrência local', 'Estrutura de campanhas e criativos', 'Ajustes frequentes com base nos números', 'Relatório mensal e plano do mês seguinte'],
    faq: [
      ['Quanto preciso investir em anúncios em Barreiras?', 'Dá pra começar com pouco e aumentar a verba conforme os contatos chegam. O valor certo depende do seu ticket e da sua meta, e a gente calcula junto com você antes de subir a primeira campanha.'],
      ['Em quanto tempo aparecem resultados?', 'Campanha de mensagem pode trazer contato já nos primeiros dias, mas isso varia com o produto, a verba e a concorrência. Conforme os números chegam, a gente ajusta público, anúncio e oferta.'],
      ['Vocês atendem fora de Barreiras?', 'Sim. A Viva fica em Barreiras e atende todo o Oeste da Bahia, de Luís Eduardo Magalhães (LEM) a Bom Jesus da Lapa. Como a campanha é gerenciada a distância, dá pra atender empresa de outras regiões também.'],
    ],
  },
  {
    slug: 'social-media',
    name: 'Social Media e Gestão de Instagram',
    short: 'Social Media',
    icon: 'spark',
    kw: 'social media em Barreiras',
    pitch: "Feed com cara de marca. Reels e stories que dão vontade de chamar no direct. Seu Instagram tão bom quanto a sua empresa.",
    why: "Em cidade do interior todo mundo se conhece, e o Instagram virou a vitrine que o cliente olha antes de sair de casa. Perfil parado ou com foto torta passa a impressão de empresa parada. Um calendário com a cara da região, com safra, feriados, festas da cidade e datas do comércio local, deixa a sua marca presente o ano inteiro.",
    title: 'Social Media em Barreiras - BA | Gestão de Instagram',
    desc: 'Social media em Barreiras - BA: gestão de Instagram com calendário, design de posts, roteiro de Reels e legendas, pra empresas do Oeste da Bahia.',
    lead: 'A gente cuida do calendário, dos posts, dos stories e da linha editorial pra quem abrir o seu perfil entender rápido o que você vende e por que comprar de você.',
    bullets: [
      'Planejamento mensal de conteúdo',
      'Design de posts e carrosséis no padrão da sua marca',
      'Roteiros de Reels e stories que geram conversa',
      'Legendas com SEO para Instagram e chamadas para ação',
      'Relatório de alcance, seguidores e mensagens',
    ],
    steps: ['Imersão na marca e no público', 'Linha editorial e calendário', 'Produção, aprovação e publicação', 'Análise mensal e ajustes'],
    faq: [
      ['Quantos posts por mês vocês fazem?', 'Depende do plano. O volume de posts, Reels e stories é combinado com você, de acordo com o objetivo e o momento da sua empresa.'],
      ['Preciso gravar os vídeos?', 'Não necessariamente. A gente pode te passar o roteiro pra gravar no celular ou marcar uma diária de gravação com a equipe da Viva.'],
      ['Vocês respondem os directs?', 'Dá pra incluir, como serviço à parte: a gente responde direct e comentário seguindo um roteiro combinado com o seu comercial.'],
    ],
  },
  {
    slug: 'criacao-de-sites',
    name: 'Criação de Sites e Landing Pages',
    short: 'Sites',
    icon: 'window',
    kw: 'criação de sites em Barreiras',
    pitch: "Site leve e bonito no celular, com o que o Google precisa pra entender o que você vende e onde.",
    why: "Quando alguém de Barreiras pesquisa um serviço \"perto de mim\", o Google olha pro seu Perfil da Empresa e também pro seu site. Um site leve, com endereço, serviços e cidades atendidas bem escritos, é o que sustenta o SEO local. E no 4G da estrada, site pesado é cliente que desiste antes de ver o que você vende.",
    title: 'Criação de Sites em Barreiras - BA | Agência Viva',
    desc: 'Criação de sites profissionais e landing pages em Barreiras - BA. Rápidos no celular, otimizados para o Google e prontos para gerar contato no WhatsApp.',
    lead: 'Site lento e genérico espanta cliente. A gente cria sites e landing pages rápidos, bonitos no celular e já estruturados para aparecer no Google quando alguém de Barreiras pesquisa pelo que você vende.',
    bullets: [
      'Design exclusivo, nada de template genérico',
      'Carregamento rápido no celular',
      'SEO técnico e SEO local desde o primeiro dia',
      'Botão de WhatsApp, formulários e integração com anúncios',
      'Domínio, hospedagem e certificado SSL configurados',
    ],
    steps: ['Briefing e pesquisa de palavras-chave', 'Estrutura, textos e layout', 'Desenvolvimento e testes', 'Publicação, Search Console e acompanhamento'],
    faq: [
      ['Quanto tempo leva para o site ficar pronto?', 'Depende do tamanho do site e de quando chegam textos, fotos e logo. Landing page sai bem mais rápido que site com várias páginas, e o prazo fica combinado na proposta.'],
      ['O site aparece no Google?', 'A gente entrega o site pronto pro Google: SEO técnico, sitemap, dados estruturados e cadastro no Google Search Console. Subir nas buscas leva tempo e ninguém controla a posição, mas site bem feito junto com um Perfil da Empresa cuidado ajuda muito em cidades como Barreiras.'],
      ['Eu consigo editar o site depois?', 'Consegue. Dá pra entregar com painel de edição ou deixar as atualizações com a gente num plano mensal, o que for mais prático pra você.'],
    ],
  },
  {
    slug: 'google-meu-negocio-seo-local',
    name: 'Google Meu Negócio e SEO Local',
    short: 'SEO Local',
    icon: 'pin',
    kw: 'SEO local e Google Meu Negócio em Barreiras',
    pitch: "Seu Perfil no Google caprichado pra você aparecer no mapa quando alguém procura \"perto de mim\".",
    why: "Pra quem tem negócio físico no Oeste, o Google Maps virou a nova lista telefônica. Quem aparece nos primeiros resultados do mapa costuma receber boa parte das ligações e dos pedidos de rota. Em cidades como Barreiras e Luís Eduardo Magalhães, a disputa por essas posições tende a ser menor do que nas capitais.",
    title: 'Google Meu Negócio e SEO Local em Barreiras - BA',
    desc: 'Google Meu Negócio e SEO local em Barreiras - BA: Perfil da Empresa completo, avaliações respondidas e rotina pra sua empresa aparecer no Google Maps.',
    lead: 'Quando alguém pesquisa “perto de mim” em Barreiras, o Google costuma mostrar três empresas em destaque no mapa. A gente deixa o seu Perfil da Empresa completo, atualizado e com as avaliações respondidas pra disputar esse espaço.',
    bullets: [
      'Criação e verificação do Perfil da Empresa no Google',
      'Categorias, serviços, fotos e produtos otimizados',
      'Estratégia de avaliações e respostas',
      'Postagens regulares no Perfil',
      'Citações locais e consistência de nome, endereço e telefone',
    ],
    steps: ['Auditoria do perfil e dos concorrentes do mapa', 'Otimização completa do perfil', 'Rotina de posts, fotos e avaliações', 'Acompanhamento de ligações, rotas e cliques'],
    faq: [
      ['O que é o Google Meu Negócio?', 'É o antigo nome do Perfil da Empresa no Google: o cartão com endereço, telefone, fotos e avaliações que aparece no Google Maps e na busca. É gratuito e conta muito pra decidir quem aparece no mapa.'],
      ['Em quanto tempo subo no Google Maps?', 'Ninguém pode prometer posição nem prazo, porque quem decide é o Google. O que a gente controla é o trabalho no perfil: deixar tudo completo, postar com frequência e cuidar das avaliações. E você acompanha se as ligações e os pedidos de rota estão subindo.'],
      ['Vocês compram avaliações?', 'Não. Avaliações falsas violam as políticas do Google e podem derrubar o perfil. A gente monta uma rotina para pedir avaliação a todos os seus clientes, em momentos naturais do atendimento, e responder cada uma.'],
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
    title: 'Criação de Logo e Identidade Visual em Barreiras - BA',
    desc: 'Criação de logo e identidade visual em Barreiras - BA: logotipo, cores, tipografia e manual de marca pra empresas do Oeste da Bahia.',
    lead: 'A gente cria logo, cores e tipografia com personalidade, pensados pra funcionar no Instagram, na fachada, no uniforme e no caminhão.',
    bullets: [
      'Criação de logotipo com variações',
      'Paleta de cores e tipografia',
      'Manual de marca simples de usar',
      'Papelaria, fachada, uniforme e frota',
      'Templates para redes sociais',
    ],
    steps: ['Briefing e pesquisa de mercado', 'Conceitos e rodada de ajustes', 'Finalização e manual de marca', 'Aplicações e templates'],
    faq: [
      ['Quantas opções de logo eu recebo?', 'A gente apresenta conceitos pensados a partir do briefing. O número de caminhos e de rodadas de ajuste fica combinado na proposta.'],
      ['Recebo os arquivos editáveis?', 'Sim. Você recebe os arquivos em vetor (PDF, SVG, AI) e em PNG, com fundo transparente, nas versões colorida, branca e preta.'],
      ['Vocês fazem rebranding?', 'Fazemos. Dá pra modernizar a marca sem perder o que o cliente já reconhece nela.'],
    ],
  },
  {
    slug: 'producao-de-conteudo-audiovisual',
    name: 'Produção de Conteúdo e Audiovisual',
    short: 'Audiovisual',
    icon: 'play',
    kw: 'produção de vídeo em Barreiras',
    pitch: "A gente vai até você, grava o dia a dia da sua empresa e transforma em Reels e fotos que prendem.",
    why: "O que prende no feed é rosto conhecido e lugar que a pessoa reconhece, do balcão da loja à lavoura. E o Oeste tem imagem de sobra: pôr do sol no cerrado, colheita, rio, cidade crescendo. A gente usa isso a favor da sua marca.",
    title: 'Produtora de Vídeo em Barreiras - BA | Agência Viva',
    h1: 'Produtora de vídeo e fotografia em',
    desc: 'Produtora de vídeo em Barreiras - BA: filmagem, fotografia e edição de Reels pra empresas do Oeste, com gravação na loja, no escritório ou na fazenda.',
    lead: 'Ninguém para de rolar o feed por foto de banco de imagem. A gente vai até a sua empresa, grava e fotografa a equipe, o produto e o dia a dia, e transforma isso em Reels e posts.',
    bullets: [
      'Diárias de gravação em Barreiras e região',
      'Roteiro e direção de Reels',
      'Fotografia de produto, equipe e ambiente',
      'Edição com ritmo, legenda e trilha',
      'Conteúdo com influenciadores da região',
    ],
    steps: ['Pauta e roteiro', 'Diária de captação', 'Edição e aprovação', 'Publicação e impulsionamento'],
    faq: [
      ['Vocês trabalham com influenciadores?', 'Sim. A gente monta ações com criadores de conteúdo do Oeste baiano, com público da própria região e a publicidade sempre identificada.'],
      ['Quantos vídeos saem de uma diária?', 'Depende do roteiro e dos lugares de gravação. Com pauta bem planejada, uma diária rende vários Reels e ainda fotos pro feed e pro site. A quantidade fica combinada antes.'],
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
    angle: 'Tem cliente que pesquisa “LEM” e tem cliente que digita “Luís Eduardo Magalhães” por extenso. Por isso a gente escreve os dois nomes, com “BA” junto, no site, nas legendas e no Perfil da Empresa no Google, pra não perder quem procura de um jeito ou de outro.',
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
    dist: 'a cerca de 155 km de Barreiras',
    intro: 'Formosa do Rio Preto tem o maior território da Bahia e uma produção de grãos que coloca a cidade entre as grandes do agro brasileiro.',
    angle: 'Em Formosa, a indicação de quem já comprou costuma pesar muito na hora de escolher onde comprar. No celular, essa indicação aparece como avaliação no Google e comentário no Instagram, e a gente ajuda a sua empresa a pedir essas avaliações e a responder cada uma.',
    niches: ['agronegócio', 'comércio', 'serviços automotivos', 'saúde'],
  },
  {
    slug: 'correntina',
    name: 'Correntina',
    geo: { lat: -13.3434, lng: -44.6368 },
    dist: 'a cerca de 170 km de Barreiras',
    intro: 'Correntina combina agricultura irrigada, rios de água cristalina e uma tradição comercial forte no sul do Oeste baiano.',
    angle: 'Aqui, o cliente valoriza a empresa conhecida. O digital amplia essa confiança para quem ainda não te conhece, dentro e fora da cidade.',
    niches: ['agro irrigado', 'turismo de rio', 'comércio', 'clínicas'],
  },
  {
    slug: 'santa-maria-da-vitoria',
    name: 'Santa Maria da Vitória',
    geo: { lat: -13.3947, lng: -44.1886 },
    dist: 'a cerca de 220 km de Barreiras',
    intro: 'Santa Maria da Vitória é polo de comércio e serviços do Vale do Corrente, com um centro movimentado que atende várias cidades vizinhas.',
    angle: 'Anúncios com raio bem desenhado e um Perfil no Google completo fazem a sua empresa ser encontrada por quem vem de toda a microrregião.',
    niches: ['comércio', 'saúde', 'educação', 'alimentação'],
  },
  {
    slug: 'bom-jesus-da-lapa',
    name: 'Bom Jesus da Lapa',
    geo: { lat: -13.2553, lng: -43.4181 },
    dist: 'a cerca de 310 km de Barreiras',
    intro: 'Bom Jesus da Lapa recebe romeiros de todo o Brasil e tem na fé, no Rio São Francisco e no comércio a sua força.',
    angle: 'Hotéis, restaurantes e lojas que aparecem no Google e no Instagram antes da romaria ficam com a preferência de quem chega à cidade.',
    niches: ['hotelaria', 'turismo religioso', 'restaurantes', 'comércio'],
  },
  {
    slug: 'riachao-das-neves',
    name: 'Riachão das Neves',
    geo: { lat: -11.7461, lng: -44.9103 },
    dist: 'a cerca de 55 km de Barreiras',
    intro: 'Riachão das Neves, no Oeste da Bahia, ao norte de Barreiras, tem na agropecuária a maior parte da economia, com soja, milho e algodão à frente.',
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
  ['Qual a melhor agência de marketing em Barreiras?', 'A melhor agência é a que entende a sua cidade e mostra resultado com números. A Agência Viva está no mercado desde 2016, nasceu em Barreiras, conhece o comércio e o agro do Oeste da Bahia e trabalha com metas que dá pra medir, como contatos no WhatsApp e ligações pelo Google.'],
  ['Quanto custa uma agência de marketing em Barreiras?', 'Depende do escopo. Tem plano de social media, de tráfego pago e combo completo, com valores pensados pra realidade de pequena e média empresa do interior. Chama no WhatsApp que a gente monta uma proposta sob medida.'],
  ['A Agência Viva atende quais cidades?', 'A gente atende Barreiras, Luís Eduardo Magalhães (LEM), São Desidério, Formosa do Rio Preto, Correntina, Santa Maria da Vitória, Bom Jesus da Lapa, Riachão das Neves e todo o Oeste da Bahia. Empresa de outras regiões a gente atende a distância.'],
  ['Vocês fazem contrato de fidelidade?', 'As condições do contrato, como prazo e cancelamento, ficam por escrito na proposta, antes de qualquer assinatura. Marketing leva tempo pra maturar, por isso a gente recomenda pelo menos três meses: é o prazo pra juntar dado suficiente e saber o que funciona.'],
  ['A agência precisa ser da minha cidade?', 'Não é obrigatório, mas ajuda muito. Quem é daqui conhece o calendário, os bairros, a linguagem e o jeito de comprar da região, e consegue ir até a sua empresa gravar, fotografar e conversar. A Viva fica em Barreiras e atende o Oeste inteiro a partir daqui.'],
  ['A verba dos anúncios está inclusa no valor da agência?', 'Normalmente não. O valor da agência paga o trabalho (estratégia, criação, gestão e relatório) e a verba dos anúncios vai direto para a plataforma, Meta ou Google, no seu cartão ou boleto. Assim você vê exatamente quanto foi investido. A gente explica tudo na proposta.'],
  ['Como faço para aparecer no Google Maps em Barreiras?', 'Criando e otimizando o Perfil da Empresa no Google: categorias certas, fotos reais, posts frequentes, avaliações de clientes e dados consistentes. É isso que a gente faz no serviço de SEO local.'],
]
