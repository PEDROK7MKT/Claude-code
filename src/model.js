// Domínio da Batcaverna: estágios do funil, regras de score e persistência.

export const STAGES = [
  { id: 'novo', label: 'Novo', hint: 'Radar' },
  { id: 'abordado', label: 'Abordado', hint: 'Sinal enviado' },
  { id: 'respondeu', label: 'Respondeu', hint: 'Contato ativo' },
  { id: 'reuniao', label: 'Reunião', hint: 'Na mesa' },
  { id: 'fechado', label: 'Fechado', hint: 'Missão cumprida' },
  { id: 'perdido', label: 'Perdido', hint: 'Fora do radar' },
]

export const SEGMENTS = [
  'Estética & Beleza',
  'Odontologia',
  'Advocacia',
  'Imobiliária',
  'Saúde & Clínicas',
  'Arquitetura',
  'Energia Solar',
  'Restaurante & Food',
  'Moda & Varejo',
  'Academia & Fitness',
  'Pet Shop',
  'Educação & Cursos',
  'Outro',
]

// Segmentos de ticket alto: contrato mensal costuma pagar bem mais.
const HIGH_TICKET = new Set([
  'Estética & Beleza',
  'Odontologia',
  'Advocacia',
  'Imobiliária',
  'Saúde & Clínicas',
  'Arquitetura',
  'Energia Solar',
])

// Cada regra é exibida no painel "lógica do score" — mantenha rótulos legíveis.
export const SCORE_RULES = [
  {
    id: 'no-site',
    label: 'Não tem site',
    points: 35,
    why: 'Dor evidente: presença digital zero. Proposta óbvia.',
    test: (l) => !l.hasSite,
  },
  {
    id: 'high-ticket',
    label: 'Segmento de ticket alto',
    points: 30,
    why: 'Estética, odonto, advocacia, imob… pagam contratos maiores.',
    test: (l) => HIGH_TICKET.has(l.segment),
  },
  {
    id: 'instagram',
    label: 'Tem Instagram ativo',
    points: 15,
    why: 'Canal aberto para abordagem direta e social proof.',
    test: (l) => Boolean(l.instagram && l.instagram.trim()),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp cadastrado',
    points: 10,
    why: 'Linha direta: follow-up sem fricção.',
    test: (l) => Boolean(l.whatsapp && l.whatsapp.trim()),
  },
  {
    id: 'intel',
    label: 'Observação preenchida',
    points: 10,
    why: 'Inteligência de campo registrada = abordagem personalizada.',
    test: (l) => Boolean(l.notes && l.notes.trim()),
  },
]

export const MAX_SCORE = SCORE_RULES.reduce((sum, r) => sum + r.points, 0)

export function scoreLead(lead) {
  const hits = SCORE_RULES.filter((r) => r.test(lead))
  const score = hits.reduce((sum, r) => sum + r.points, 0)
  return { score, hits }
}

export function scoreTier(score) {
  if (score >= 65) return { id: 'hot', label: 'QUENTE', icon: '🔥' }
  if (score >= 40) return { id: 'warm', label: 'MORNO', icon: '⚡' }
  return { id: 'cold', label: 'FRIO', icon: '🧊' }
}

export const DEFAULT_GOALS = [
  { id: 'g1', label: 'Leads abordados', target: 10 },
  { id: 'g2', label: 'Respostas recebidas', target: 3 },
  { id: 'g3', label: 'Reunião marcada', target: 1 },
]

const LS_KEY = 'batcave-ops-v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // storage cheio ou bloqueado: app segue funcionando em memória
  }
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

// Leads de demonstração para a primeira visita não abrir uma caverna vazia.
export function seedLeads() {
  const base = [
    {
      company: 'Clínica Wayne Odonto',
      segment: 'Odontologia',
      whatsapp: '(11) 98888-1234',
      instagram: '@wayneodonto',
      hasSite: false,
      city: 'Gotham do Sul',
      notes: 'Concorrente forte na região, dona quer crescer no Instagram.',
      stage: 'novo',
    },
    {
      company: 'Estética Aurora',
      segment: 'Estética & Beleza',
      whatsapp: '(11) 97777-5678',
      instagram: '@esteticaaurora',
      hasSite: false,
      city: 'Gotham do Sul',
      notes: '',
      stage: 'abordado',
    },
    {
      company: 'Burger do Coringa',
      segment: 'Restaurante & Food',
      whatsapp: '(11) 96666-9012',
      instagram: '@burgerdocoringa',
      hasSite: true,
      city: 'Gotham Leste',
      notes: 'Já anuncia no iFood, quer tráfego pago próprio.',
      stage: 'respondeu',
    },
    {
      company: 'Alfred Imóveis',
      segment: 'Imobiliária',
      whatsapp: '(11) 95555-3456',
      instagram: '',
      hasSite: true,
      city: 'Centro',
      notes: 'Reunião quinta 15h — levar case do setor.',
      stage: 'reuniao',
    },
  ]
  return base.map((l) => ({ ...l, id: uid(), createdAt: Date.now() }))
}
