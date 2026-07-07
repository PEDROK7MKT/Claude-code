// Conteúdo dos módulos de Scripts e Proposta: inteligência por nicho,
// templates de abordagem e pacotes comerciais.

// Por nicho: {gancho} = o que você "reparou", {dor} = a dor nomeada,
// {isca} = a oferta de entrada. Os templates interpolam esses campos.
export const NICHE_INTEL = {
  'Estética & Beleza': {
    gancho: 'o perfil de vocês tem fotos ótimas mas pouca constância',
    dor: 'agenda com buracos no meio da semana é dinheiro parado',
    isca: 'posso montar 3 criativos de teste focados em agendamento',
  },
  Odontologia: {
    gancho: 'quem busca dentista na região não encontra vocês no Google',
    dor: 'paciente novo hoje escolhe pelo Instagram e pelas avaliações',
    isca: 'faço um raio-X gratuito da presença digital da clínica',
  },
  Advocacia: {
    gancho: 'o escritório quase não aparece quando pesquisam a especialidade de vocês',
    dor: 'cliente qualificado pesquisa muito antes de ligar — quem não aparece, não existe',
    isca: 'preparo um diagnóstico de autoridade digital sem custo',
  },
  Imobiliária: {
    gancho: 'os imóveis de vocês aparecem só nos portais, pagando comissão pra eles',
    dor: 'depender 100% de portal é alugar a própria carteira de leads',
    isca: 'monto uma campanha-piloto de captação direta de proprietários',
  },
  'Saúde & Clínicas': {
    gancho: 'a clínica tem estrutura ótima mas isso não aparece online',
    dor: 'paciente compara 3 clínicas no celular antes de agendar',
    isca: 'faço uma análise gratuita do funil de agendamento de vocês',
  },
  Arquitetura: {
    gancho: 'o portfólio de vocês merece muito mais alcance do que tem hoje',
    dor: 'projeto de alto padrão se vende por percepção — e percepção se constrói',
    isca: 'monto um plano de conteúdo de autoridade pra 30 dias',
  },
  'Energia Solar': {
    gancho: 'vocês dependem de indicação num mercado que explodiu de concorrência',
    dor: 'quem domina o tráfego pago fecha a usina antes do concorrente visitar o cliente',
    isca: 'simulo uma campanha com custo por lead estimado do setor',
  },
  'Restaurante & Food': {
    gancho: 'o movimento de vocês varia muito entre dias da semana',
    dor: 'depender de iFood come até 30% da margem',
    isca: 'monto uma estratégia de pedido direto via WhatsApp',
  },
  'Moda & Varejo': {
    gancho: 'vocês postam produto mas quase não convertem em venda direta',
    dor: 'vitrine sem tráfego é estoque parado',
    isca: 'estruturo um catálogo de WhatsApp com campanha de teste',
  },
  'Academia & Fitness': {
    gancho: 'a captação de vocês depende muito de quem passa na porta',
    dor: 'janeiro lota, junho esvazia — quem anuncia o ano todo não sente sazonalidade',
    isca: 'crio uma oferta de aula experimental com anúncio geolocalizado',
  },
  'Pet Shop': {
    gancho: 'os clientes de vocês voltariam mais vezes com um lembrete certo',
    dor: 'banho e tosa vive de recorrência — sem CRM, o cliente esquece',
    isca: 'monto um fluxo de recompra automática pelo WhatsApp',
  },
  'Educação & Cursos': {
    gancho: 'as matrículas de vocês concentram tudo em época de campanha',
    dor: 'captação de aluno sem funil é panfleto digital',
    isca: 'desenho um funil de captação contínua com aula-isca',
  },
  Outro: {
    gancho: 'o negócio de vocês tem potencial digital claramente mal aproveitado',
    dor: 'concorrente que aparece primeiro leva o cliente',
    isca: 'faço um diagnóstico gratuito da presença digital',
  },
}

export const SCRIPT_TEMPLATES = [
  {
    id: 'first',
    title: 'Primeira abordagem',
    channel: 'WhatsApp',
    text: `Oi, tudo bem? Aqui é {seu_nome}, da {agencia} 🦇

Encontrei a {empresa} pesquisando negócios de {cidade} e reparei que {gancho}.

Falo isso porque {dor}. É exatamente o tipo de coisa que a gente resolve — {isca}, sem compromisso.

Posso te mandar um áudio de 1 minuto explicando a ideia?`,
  },
  {
    id: 'followup',
    title: 'Follow-up (sem resposta)',
    channel: 'WhatsApp',
    text: `Oi de novo! {seu_nome} aqui 👋

Sei que a rotina da {empresa} é corrida, então vou direto ao ponto: aquela ideia continua de pé — {isca}.

Se fizer sentido, me responde só com um "quero ver" que te mando tudo pronto. Se não for o momento, sem problema nenhum, é só me avisar que não insisto.`,
  },
  {
    id: 'dm',
    title: 'DM de conexão',
    channel: 'Instagram',
    text: `Opa! Acompanhei o perfil da {empresa} e o conteúdo de vocês é muito bom 👏

Só que {gancho} — e {dor}.

Trabalho com marketing digital aqui em {cidade} e {isca}. Topa trocar uma ideia rápida por aqui mesmo?`,
  },
  {
    id: 'objection',
    title: 'Objeção: "já tenho quem cuida"',
    channel: 'WhatsApp',
    text: `Perfeito, e que bom que já investem nisso! 🙌

Não quero substituir ninguém — minha proposta é outra: {isca}, de graça, e você compara com o que já recebe hoje.

Se o resultado for melhor, conversamos. Se não for, você ganhou um diagnóstico gratuito e segue com quem já confia. Justo?`,
  },
]

export function renderScript(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => {
    const v = vars[key]
    return v && String(v).trim() ? String(v).trim() : m
  })
}

// A verba de anúncio (adBudget) é SEMPRE paga à parte pelo cliente, direto
// às plataformas — nunca embutida no fee de gestão. setup é cobrado uma vez.
export const PACKAGES = [
  {
    id: 'sinal',
    name: 'SINAL',
    tagline: 'Acender a presença',
    price: 797,
    setup: 400,
    adBudget: null,
    highlight: false,
    features: [
      'Google Meu Negócio otimizado',
      'SEO local básico',
      'Site landing page (1 página)',
      'Relatório mensal',
    ],
  },
  {
    id: 'vigilante',
    name: 'VIGILANTE',
    tagline: 'Patrulhar e converter',
    price: 1497,
    setup: 600,
    adBudget: 600,
    highlight: true,
    features: [
      'Tudo do Sinal',
      'Gestão de tráfego pago (Meta + Google Ads)',
      'Site completo com WhatsApp integrado',
      'SEO + GEO reforçado',
      'Relatório quinzenal + reunião mensal',
    ],
  },
  {
    id: 'lenda',
    name: 'LENDA',
    tagline: 'Dominar o território',
    price: 2897,
    setup: 1000,
    adBudget: 1500,
    highlight: false,
    features: [
      'Tudo do Vigilante',
      'Campanhas múltiplas',
      'CRM + automação de WhatsApp',
      'SEO/GEO agressivo',
      'Reunião estratégica semanal',
    ],
  },
]

export function buildProposal({ client, pkg, agencia, seuNome, extras }) {
  const brl = (n) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
  const lines = [
    `PROPOSTA COMERCIAL — ${agencia.toUpperCase()}`,
    `Para: ${client}`,
    ``,
    `Plano ${pkg.name} — ${pkg.tagline}`,
    ``,
    `Investimento (fee de gestão): ${brl(pkg.price)}/mês`,
    `Setup único: ${brl(pkg.setup)} (cobrado uma única vez, na entrada)`,
  ]
  if (pkg.adBudget) {
    lines.push(
      `»» VERBA DE ANÚNCIO: a partir de ${brl(pkg.adBudget)}/mês — paga À PARTE,`,
      `   direto às plataformas (Meta/Google). Não está inclusa no fee de gestão.`,
    )
  }
  lines.push(``, `O que está incluso:`, ...pkg.features.map((f) => `  • ${f}`))
  if (extras && extras.trim()) {
    lines.push(``, `Condições especiais:`, `  ${extras.trim()}`)
  }
  lines.push(
    ``,
    `Sem fidelidade — cancele quando quiser com 30 dias de aviso.`,
    `Proposta válida por 7 dias.`,
    ``,
    `${seuNome}`,
    `${agencia} · marketing digital`,
  )
  return lines.join('\n')
}
