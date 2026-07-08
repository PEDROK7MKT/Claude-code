// Manual de SEO & GEO por nicho: Google Meu Negócio, SEO local,
// GEO (aparecer nas respostas das IAs), redes sociais e diretórios.
// O checklist é comum a todos os nichos; o resto é específico.

export const MANUAL_CHECKLIST = [
  { id: 'gmn-claim', label: 'Reivindicar/criar o perfil no Google Meu Negócio' },
  { id: 'gmn-cat', label: 'Definir a categoria principal certa (e 2–3 secundárias)' },
  { id: 'gmn-desc', label: 'Escrever a descrição com palavras-chave + cidade' },
  { id: 'gmn-fotos', label: 'Subir 10+ fotos reais (fachada, equipe, serviço)' },
  { id: 'gmn-posts', label: 'Publicar 1 post por semana no perfil do Google' },
  { id: 'reviews', label: 'Pedir avaliação a todo cliente satisfeito (meta: 2+/semana)' },
  { id: 'reviews-reply', label: 'Responder TODAS as avaliações (boas e ruins)' },
  { id: 'nap', label: 'Nome, endereço e telefone idênticos em todos os canais (NAP)' },
  { id: 'site-faq', label: 'Página/seção de FAQ no site respondendo as perguntas do nicho' },
  { id: 'search-console', label: 'Cadastrar o site no Google Search Console' },
  { id: 'directories', label: 'Cadastrar nos diretórios do nicho (lista abaixo)' },
  { id: 'insta-bio', label: 'Bio do Instagram com o que faz + cidade + link/WhatsApp' },
]

export const GEO_INTRO =
  'GEO (Generative Engine Optimization) é ser citado quando alguém pergunta ao ChatGPT, Gemini ou à IA do Google "qual a melhor {nicho} de {cidade}?". As IAs puxam de: avaliações no Google (quantidade + nota + palavras nas reviews), conteúdo do site que responde perguntas diretas (FAQ), presença em diretórios confiáveis e consistência de dados (NAP). A receita: muitas reviews com texto, FAQ no site com resposta objetiva na primeira frase, e estar listado onde a IA busca.'

export const GENERAL_DIRECTORIES = [
  { name: 'Google Meu Negócio', url: 'business.google.com' },
  { name: 'Bing Places', url: 'bingplaces.com' },
  { name: 'Apple Business Connect (Maps)', url: 'businessconnect.apple.com' },
  { name: 'Waze (endereço verificado)', url: 'waze.com/business' },
  { name: 'Instagram (perfil comercial)', url: 'instagram.com' },
  { name: 'Facebook (página + catálogo)', url: 'facebook.com/business' },
]

export const NICHE_MANUALS = {
  'Estética & Beleza': {
    gmnCategory: 'Clínica de estética / Salão de beleza',
    desc: 'Clínica de estética em {cidade}: limpeza de pele, botox, preenchimento e harmonização facial. Agende avaliação pelo WhatsApp.',
    photos: ['Antes/depois (com autorização)', 'Sala de procedimento e equipamentos', 'Equipe com jaleco/uniforme'],
    keywords: ['clínica de estética {cidade}', 'limpeza de pele perto de mim', 'botox {cidade}', 'harmonização facial {cidade}', 'depilação a laser {cidade}', 'estética avançada', 'preenchimento labial {cidade}'],
    content: ['Reels de antes/depois com música em alta', 'Vídeo "1 dia na clínica" (bastidores)', 'Post educativo: mitos e verdades do procedimento X', 'Story fixo: tabela de serviços + botão de agendamento'],
    faqs: ['Quanto custa uma limpeza de pele em {cidade}?', 'Botox dói? Quanto tempo dura o resultado?', 'Qual a melhor clínica de estética de {cidade}? (responda com seus diferenciais + prova social)'],
    directories: [
      { name: 'Booksy (agendamento)', url: 'booksy.com' },
      { name: 'Fresha', url: 'fresha.com' },
      { name: 'GetNinjas (serviços)', url: 'getninjas.com.br' },
    ],
  },
  Odontologia: {
    gmnCategory: 'Dentista / Clínica odontológica',
    desc: 'Clínica odontológica em {cidade}: implantes, invisalign, clareamento e urgência 24h. Avaliação sem custo — agende pelo WhatsApp.',
    photos: ['Consultório e cadeira (limpos, bem iluminados)', 'Equipe de dentistas com CRO visível', 'Antes/depois de clareamento/lentes (autorizado)'],
    keywords: ['dentista {cidade}', 'implante dentário {cidade}', 'invisalign {cidade}', 'clareamento dental preço', 'dentista urgência perto de mim', 'lente de contato dental {cidade}', 'aparelho ortodôntico {cidade}'],
    content: ['Vídeo curto: "o que acontece na primeira consulta"', 'Depoimento de paciente (prova social)', 'Educativo: quanto tempo dura um implante?', 'Bastidor de caso concluído (sorriso final)'],
    faqs: ['Quanto custa um implante dentário em {cidade}?', 'Invisalign funciona? Quanto tempo demora?', 'Tem dentista que atende urgência em {cidade}?'],
    directories: [
      { name: 'Doctoralia', url: 'doctoralia.com.br' },
      { name: 'BoaConsulta', url: 'boaconsulta.com' },
      { name: 'CRO da sua região (cadastro ativo)', url: 'cro.org.br' },
    ],
  },
  Advocacia: {
    gmnCategory: 'Advogado / Escritório de advocacia',
    desc: 'Escritório de advocacia em {cidade}, especializado em [área]. Atendimento online e presencial — fale com um advogado pelo WhatsApp.',
    photos: ['Fachada/recepção do escritório', 'Sócios em ambiente profissional', 'Sala de reunião'],
    keywords: ['advogado trabalhista {cidade}', 'advogado previdenciário {cidade}', 'advogado de família {cidade}', 'quanto custa um advogado', 'advogado perto de mim', 'consulta com advogado online', 'direito do consumidor {cidade}'],
    content: ['Vídeo: "3 direitos que você não sabia que tem"', 'Carrossel: passo a passo de um processo comum', 'Caso real anonimizado com resultado', 'FAQ em vídeo: "preciso pagar pra consultar?"'],
    faqs: ['Quanto custa uma consulta com advogado em {cidade}?', 'Quanto tempo demora um processo trabalhista?', 'Advogado pode atender online?'],
    directories: [
      { name: 'JusBrasil (perfil profissional)', url: 'jusbrasil.com.br' },
      { name: 'OAB da sua seccional', url: 'oab.org.br' },
      { name: 'LinkedIn (autoridade B2B)', url: 'linkedin.com' },
    ],
  },
  Imobiliária: {
    gmnCategory: 'Imobiliária / Corretor de imóveis',
    desc: 'Imobiliária em {cidade}: compra, venda e locação com avaliação gratuita do seu imóvel. CRECI ativo — fale conosco.',
    photos: ['Fachada da imobiliária', 'Equipe de corretores', 'Imóveis em destaque (fotos profissionais)'],
    keywords: ['imobiliária {cidade}', 'apartamento à venda {cidade}', 'casa para alugar {cidade}', 'avaliação de imóvel grátis', 'corretor de imóveis {cidade}', 'financiamento imobiliário {cidade}', 'imóveis na planta {cidade}'],
    content: ['Tour em vídeo de imóvel (Reels)', '"Quanto vale seu imóvel?" — CTA de avaliação', 'Bairro em 60 segundos (autoridade local)', 'Story de imóvel vendido ("saiu do mercado!")'],
    faqs: ['Quanto custa o m² em {cidade}?', 'Quais documentos preciso para financiar um imóvel?', 'Qual a melhor imobiliária de {cidade}?'],
    directories: [
      { name: 'ZAP Imóveis', url: 'zapimoveis.com.br' },
      { name: 'VivaReal', url: 'vivareal.com.br' },
      { name: 'OLX Imóveis', url: 'olx.com.br' },
      { name: 'CRECI regional', url: 'creci.org.br' },
    ],
  },
  'Saúde & Clínicas': {
    gmnCategory: 'Clínica médica / Especialidade',
    desc: 'Clínica de [especialidade] em {cidade}. Agendamento rápido, atendimento humanizado e convênios. Marque pelo WhatsApp.',
    photos: ['Recepção e consultórios', 'Equipe médica com CRM visível', 'Equipamentos de exame'],
    keywords: ['clínica {especialidade} {cidade}', 'médico perto de mim', 'consulta particular preço {cidade}', 'exame {tipo} {cidade}', 'clínica popular {cidade}', 'agendar consulta online', 'convênio {nome} {cidade}'],
    content: ['Vídeo do médico explicando um sintoma comum', 'Carrossel: quando procurar um especialista', 'Bastidores de estrutura/equipamentos', 'Depoimento de paciente (autorizado)'],
    faqs: ['Quanto custa uma consulta particular em {cidade}?', 'Quais convênios a clínica aceita?', 'Preciso de encaminhamento para agendar?'],
    directories: [
      { name: 'Doctoralia', url: 'doctoralia.com.br' },
      { name: 'BoaConsulta', url: 'boaconsulta.com' },
      { name: 'GetNinjas (terapias)', url: 'getninjas.com.br' },
    ],
  },
  Arquitetura: {
    gmnCategory: 'Arquiteto / Escritório de arquitetura',
    desc: 'Escritório de arquitetura em {cidade}: projetos residenciais e comerciais, interiores e regularização. Orçamento pelo WhatsApp.',
    photos: ['Projetos entregues (fotos profissionais)', 'Renders 3D de projetos', 'Equipe no escritório/obra'],
    keywords: ['arquiteto {cidade}', 'projeto de casa {cidade}', 'design de interiores {cidade}', 'quanto custa um projeto de arquitetura', 'regularização de imóvel {cidade}', 'projeto comercial {cidade}', 'reforma apartamento {cidade}'],
    content: ['Antes/depois de reforma (Reels)', 'Timelapse de obra/render', '"Quanto custa um projeto?" — vídeo transparente', 'Tour por projeto entregue'],
    faqs: ['Quanto custa um projeto de arquitetura em {cidade}?', 'Preciso de arquiteto para reformar?', 'Qual a diferença entre projeto e regularização?'],
    directories: [
      { name: 'Habitissimo', url: 'habitissimo.com.br' },
      { name: 'ArchDaily Brasil (publicação)', url: 'archdaily.com.br' },
      { name: 'CAU (registro ativo)', url: 'caubr.gov.br' },
      { name: 'Pinterest (portfólio)', url: 'pinterest.com' },
    ],
  },
  'Energia Solar': {
    gmnCategory: 'Empresa de energia solar',
    desc: 'Energia solar em {cidade}: projeto, instalação e homologação. Simule sua economia na conta de luz pelo WhatsApp.',
    photos: ['Instalações concluídas (telhados)', 'Equipe em campo com EPI', 'Inversores e materiais'],
    keywords: ['energia solar {cidade}', 'placa solar preço {cidade}', 'quanto custa energia solar', 'financiamento energia solar', 'instalação painel solar {cidade}', 'economia conta de luz', 'energia solar vale a pena'],
    content: ['Vídeo: conta de luz antes/depois do cliente', 'Timelapse de instalação', 'Simulação: "casa que paga R$400/mês economiza X"', 'FAQ: e quando chove/à noite?'],
    faqs: ['Quanto custa instalar energia solar em {cidade}?', 'Em quanto tempo o sistema se paga?', 'Energia solar funciona em dia nublado?'],
    directories: [
      { name: 'Portal Solar (orçamentos)', url: 'portalsolar.com.br' },
      { name: 'GetNinjas', url: 'getninjas.com.br' },
      { name: 'Reclame Aqui (reputação ativa)', url: 'reclameaqui.com.br' },
    ],
  },
  'Restaurante & Food': {
    gmnCategory: 'Restaurante / tipo de cozinha específico',
    desc: 'Restaurante de [cozinha] em {cidade}. Almoço executivo, delivery próprio pelo WhatsApp e reservas. Peça agora.',
    photos: ['Pratos principais (foto profissional/luz natural)', 'Ambiente/salão', 'Cozinha e equipe'],
    keywords: ['restaurante {cidade}', '{tipo de comida} perto de mim', 'delivery {bairro}', 'almoço executivo {cidade}', 'restaurante para jantar {cidade}', 'marmita {cidade}', 'reserva restaurante {cidade}'],
    content: ['Reels do prato sendo montado (ASMR food)', 'Bastidor da cozinha no horário de pico', 'Promo do dia nos stories (todo dia, mesmo horário)', 'Repost de cliente marcando o restaurante'],
    faqs: ['Qual o melhor restaurante de {tipo} em {cidade}?', 'Vocês fazem delivery? Qual a taxa?', 'Precisa reservar? Até que horas funciona?'],
    directories: [
      { name: 'iFood', url: 'ifood.com.br' },
      { name: 'TripAdvisor', url: 'tripadvisor.com.br' },
      { name: 'TheFork (reservas)', url: 'thefork.com.br' },
      { name: 'Google Maps (cardápio no perfil)', url: 'business.google.com' },
    ],
  },
  'Moda & Varejo': {
    gmnCategory: 'Loja de roupas / segmento específico',
    desc: 'Loja de [segmento] em {cidade}: novidades toda semana, provador, troca fácil e envio para todo Brasil pelo WhatsApp.',
    photos: ['Vitrine e interior da loja', 'Looks montados (produto em uso)', 'Provador/experiência'],
    keywords: ['loja de roupas {cidade}', '{peça} feminina {cidade}', 'moda plus size {cidade}', 'loja de {segmento} perto de mim', 'atacado de roupas {cidade}', 'look para {ocasião}', 'promoção roupas {cidade}'],
    content: ['Reels "chegou hoje" (novidades da semana)', 'Prova de look: 1 peça, 3 combinações', 'Story enquete: qual look você prefere?', 'Cliente usando (repost com marcação)'],
    faqs: ['A loja tem provador/estacionamento?', 'Vocês enviam para outras cidades?', 'Qual a política de troca?'],
    directories: [
      { name: 'Instagram Shopping (catálogo)', url: 'business.instagram.com' },
      { name: 'WhatsApp Business (catálogo)', url: 'business.whatsapp.com' },
      { name: 'OLX / Shopee / Mercado Livre (canais extra)', url: 'shopee.com.br' },
    ],
  },
  'Academia & Fitness': {
    gmnCategory: 'Academia / Estúdio (cross, pilates, funcional)',
    desc: 'Academia em {cidade} com musculação, aulas coletivas e acompanhamento de treino. Aula experimental grátis — chame no WhatsApp.',
    photos: ['Área de musculação (equipamentos)', 'Aulas coletivas acontecendo', 'Estrutura: vestiário, recepção', 'Alunos em transformação (autorizado)'],
    keywords: ['academia {cidade}', 'academia perto de mim', 'academia {bairro} preço', 'crossfit {cidade}', 'pilates {cidade}', 'personal trainer {cidade}', 'academia com natação {cidade}', 'plano anual academia'],
    content: ['Transformação de aluno (antes/depois autorizado)', 'Reels de treino do dia (15–30s)', 'Tour pela estrutura', 'Desafio do mês (engajamento + indicação)'],
    faqs: ['Quanto custa a mensalidade da academia em {cidade}?', 'Tem aula experimental grátis?', 'Qual academia perto de {bairro} tem {modalidade}?'],
    directories: [
      { name: 'Wellhub (ex-Gympass)', url: 'wellhub.com' },
      { name: 'TotalPass', url: 'totalpass.com' },
      { name: 'GetNinjas (personal)', url: 'getninjas.com.br' },
    ],
  },
  'Pet Shop': {
    gmnCategory: 'Pet shop / Banho e tosa / Veterinário',
    desc: 'Pet shop em {cidade}: banho e tosa com hora marcada, veterinário e leva-e-traz. Agende pelo WhatsApp.',
    photos: ['Pets no banho/tosa (fofura vende)', 'Estrutura limpa e segura', 'Equipe com os pets', 'Antes/depois da tosa'],
    keywords: ['pet shop {cidade}', 'banho e tosa perto de mim', 'veterinário {cidade}', 'banho e tosa leva e traz', 'pet shop {bairro}', 'vacina para cachorro {cidade}', 'ração {marca} {cidade}'],
    content: ['Antes/depois de tosa (Reels)', 'Pet do dia (marca o tutor — alcance orgânico)', 'Dica do veterinário em 30s', 'Story: vaga de banho pra hoje (urgência)'],
    faqs: ['Quanto custa banho e tosa em {cidade}?', 'Vocês buscam e levam o pet?', 'Precisa agendar ou aceita encaixe?'],
    directories: [
      { name: 'GetNinjas', url: 'getninjas.com.br' },
      { name: 'DogHero (creche/passeio)', url: 'doghero.com.br' },
      { name: 'Google Maps (agendamento no perfil)', url: 'business.google.com' },
    ],
  },
  'Educação & Cursos': {
    gmnCategory: 'Escola / Curso (idiomas, técnico, reforço)',
    desc: 'Curso de [tema] em {cidade}: turmas reduzidas, certificado e aula experimental gratuita. Garanta sua vaga pelo WhatsApp.',
    photos: ['Sala de aula com alunos', 'Formaturas/certificados entregues', 'Estrutura (laboratório, biblioteca)'],
    keywords: ['curso de {tema} {cidade}', 'escola de inglês {cidade}', 'curso técnico {cidade}', 'aula particular {matéria} {cidade}', 'curso com certificado', 'curso de {tema} preço', 'reforço escolar {cidade}'],
    content: ['Depoimento de aluno formado (resultado)', 'Mini-aula gratuita em vídeo', 'Bastidor de turma em aula', '"Vagas abertas" com prazo (urgência)'],
    faqs: ['Quanto custa o curso de {tema} em {cidade}?', 'O certificado é reconhecido?', 'Tem turma à noite/fim de semana?'],
    directories: [
      { name: 'Google for Education / Maps', url: 'business.google.com' },
      { name: 'Hotmart/Kiwify (se tiver online)', url: 'hotmart.com' },
      { name: 'Superprof (aulas particulares)', url: 'superprof.com.br' },
    ],
  },
  'Oficina & Automotivo': {
    gmnCategory: 'Oficina mecânica / Auto center',
    desc: 'Oficina mecânica em {cidade}: revisão, freios, suspensão, injeção e diagnóstico computadorizado. Orçamento sem compromisso pelo WhatsApp.',
    photos: ['Fachada com placa visível', 'Box/elevadores e equipamentos', 'Mecânicos trabalhando (uniforme)', 'Scanner de diagnóstico'],
    keywords: ['oficina mecânica {cidade}', 'mecânico perto de mim', 'troca de óleo {cidade}', 'revisão de carro {cidade} preço', 'auto elétrica {cidade}', 'freio e suspensão {cidade}', 'diagnóstico injeção eletrônica', 'oficina 24h {cidade}'],
    content: ['Vídeo: problema encontrado no carro do cliente (educativo)', 'Antes/depois de serviço (freio, suspensão)', 'Dica: 3 sinais de que o carro precisa de revisão', 'Bastidor: diagnóstico com scanner (autoridade técnica)'],
    faqs: ['Quanto custa uma revisão completa em {cidade}?', 'Vocês dão garantia do serviço? De quanto tempo?', 'Fazem orçamento sem compromisso? Tem que agendar?'],
    directories: [
      { name: 'GetNinjas', url: 'getninjas.com.br' },
      { name: 'Guia da Oficina / Doutor-IE', url: 'doutorie.com.br' },
      { name: 'OLX (serviços automotivos)', url: 'olx.com.br' },
      { name: 'Waze (ponto verificado — busca "oficina")', url: 'waze.com/business' },
    ],
  },
  Outro: {
    gmnCategory: 'A categoria mais específica possível do seu negócio',
    desc: '[O que você faz] em {cidade}: [3 principais serviços]. [Diferencial]. Fale conosco pelo WhatsApp.',
    photos: ['Fachada/local de trabalho', 'Equipe em ação', 'Resultado do serviço/produto'],
    keywords: ['{seu serviço} {cidade}', '{seu serviço} perto de mim', 'quanto custa {seu serviço}', '{seu serviço} {bairro}', 'melhor {seu serviço} {cidade}'],
    content: ['Antes/depois do seu serviço', 'Bastidor do dia a dia', 'Depoimento de cliente', 'FAQ em vídeo: a pergunta que mais te fazem'],
    faqs: ['Quanto custa {seu serviço} em {cidade}?', 'Qual o prazo/como funciona?', 'Qual o melhor {seu serviço} de {cidade}?'],
    directories: [
      { name: 'GetNinjas', url: 'getninjas.com.br' },
      { name: 'OLX Serviços', url: 'olx.com.br' },
      { name: 'Diretórios específicos do seu setor', url: '' },
    ],
  },
}

export function buildManualText(segment) {
  const m = NICHE_MANUALS[segment] ?? NICHE_MANUALS.Outro
  const lines = [
    `MANUAL SEO & GEO — ${segment.toUpperCase()}`,
    ``,
    `1. GOOGLE MEU NEGÓCIO`,
    `Categoria: ${m.gmnCategory}`,
    `Descrição sugerida: ${m.desc}`,
    `Fotos: ${m.photos.join(' · ')}`,
    ``,
    `2. PALAVRAS-CHAVE (SEO LOCAL)`,
    ...m.keywords.map((k) => `  • ${k}`),
    ``,
    `3. GEO — PERGUNTAS QUE SEU SITE DEVE RESPONDER`,
    ...m.faqs.map((f) => `  • ${f}`),
    ``,
    `4. CONTEÚDO PARA REDES SOCIAIS`,
    ...m.content.map((c) => `  • ${c}`),
    ``,
    `5. ONDE SE CADASTRAR`,
    ...GENERAL_DIRECTORIES.map((d) => `  • ${d.name} — ${d.url}`),
    ...m.directories.filter((d) => d.url).map((d) => `  • ${d.name} — ${d.url}`),
    ``,
    `6. CHECKLIST DE EXECUÇÃO`,
    ...MANUAL_CHECKLIST.map((t) => `  [ ] ${t.label}`),
  ]
  return lines.join('\n')
}
