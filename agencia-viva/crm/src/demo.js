// Banco de mentira em memória para a prévia de demonstração (vite build --mode demo).
// Imita só o pedaço do supabase-js que o CRM usa. Nada sai do navegador; recarregar zera tudo.

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
const quando = n => new Date(Date.now() + n * 864e5).toISOString()
const mes = (n = 0) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }
let seq = 1000
const novoId = () => `d0000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`

const EU = 'u0000000-0000-4000-8000-000000000001', ANA = 'u0000000-0000-4000-8000-000000000002', BRUNO = 'u0000000-0000-4000-8000-000000000003'
const lead = (id, nome, empresa, etapa, extra = {}) => ({ id: 'l' + id, nome, empresa, telefone: '(77) 9 9' + String(1000000 + +id * 7919).slice(-7).replace(/(\d{3})(\d{4})/, '$1-$2'), email: null, instagram: empresa ? '@' + empresa.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 14) : null, cidade: 'Barreiras', segmento: null, origem: 'instagram', servicos: [], valor_estimado: null, etapa_id: etapa, responsavel_id: EU, proximo_contato: null, motivo_perda: null, observacoes: null, cliente_id: null, criado_em: quando(-10), atualizado_em: quando(-2), etapa_em: quando(-2), ...extra })
const cli = (id, nome, empresa, extra = {}) => ({ id: 'c' + id, nome, empresa, documento: null, telefone: '(77) 9 98' + id + '1-20' + id + '0', email: null, instagram: '@' + empresa.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 14), cidade: 'Barreiras', segmento: null, servicos: [], inicio_contrato: dia(-120), status: 'ativo', responsavel_id: EU, observacoes: null, criado_em: quando(-120), atualizado_em: quando(-5), ...extra })

const db = {
  perfis: [
    { id: EU, nome: 'Admin Viva', email: 'admin@agenciaviva.com.br', papel: 'admin', ativo: true, criado_em: quando(-200) },
    { id: ANA, nome: 'Ana Souza', email: 'ana@agenciaviva.com.br', papel: 'equipe', ativo: true, criado_em: quando(-150) },
    { id: BRUNO, nome: 'Bruno Lima', email: 'bruno@agenciaviva.com.br', papel: 'equipe', ativo: true, criado_em: quando(-90) },
    { id: 'u0000000-0000-4000-8000-000000000004', nome: 'Carla Nunes', email: 'carla@gmail.com', papel: 'equipe', ativo: false, criado_em: quando(-1) },
  ],
  etapas: [[1, 'Novo lead', 'aberto'], [2, 'Primeiro contato', 'aberto'], [3, 'Diagnóstico', 'aberto'], [4, 'Proposta enviada', 'aberto'], [5, 'Negociação', 'aberto'], [6, 'Fechado ganho', 'ganho'], [7, 'Perdido', 'perdido']].map(([id, nome, tipo]) => ({ id, nome, ordem: id, tipo })),
  leads: [
    lead(1, 'Juliana Prado', 'Clínica Sorrir Mais', 1, { origem: 'site', cidade: 'Barreiras', segmento: 'odontologia', servicos: ['Tráfego pago'], valor_estimado: 1800, criado_em: quando(-0.2), observacoes: 'Veio pelo formulário do site: quer mais pacientes de implante.' }),
    lead(2, 'Marcos Tavares', 'Agro Peças Oeste', 1, { origem: 'site', cidade: 'Luís Eduardo Magalhães', segmento: 'revenda agrícola', servicos: ['Tráfego pago', 'Site'], valor_estimado: 3500, criado_em: quando(-1), responsavel_id: ANA }),
    lead(3, 'Patrícia Rocha', 'Boutique Flor de Lis', 2, { origem: 'instagram', segmento: 'moda', servicos: ['Social media'], valor_estimado: 1500, proximo_contato: dia(0), responsavel_id: ANA }),
    lead(4, 'Rafael Mendes', 'Hamburgueria Brasa', 2, { origem: 'indicacao', segmento: 'restaurante', servicos: ['Social media', 'Audiovisual'], valor_estimado: 2200, proximo_contato: dia(-1) }),
    lead(5, 'Sônia Almeida', 'Pousada Sete Ilhas', 3, { origem: 'google', cidade: 'Correntina', segmento: 'turismo', servicos: ['SEO local / Google'], valor_estimado: 900, proximo_contato: dia(2), responsavel_id: BRUNO }),
    lead(6, 'Diego Farias', 'Auto Center Farias', 3, { origem: 'whatsapp', segmento: 'oficina', servicos: ['SEO local / Google', 'Tráfego pago'], valor_estimado: 1600 }),
    lead(7, 'Letícia Campos', 'Studio Letícia Campos', 4, { origem: 'instagram', segmento: 'estética', servicos: ['Social media', 'Identidade visual'], valor_estimado: 2800, proximo_contato: dia(1), responsavel_id: ANA }),
    lead(8, 'Fernando Assis', 'Grãos do Cerrado', 5, { origem: 'evento', cidade: 'Luís Eduardo Magalhães', segmento: 'agro', servicos: ['Audiovisual', 'Site'], valor_estimado: 6000, proximo_contato: dia(0), observacoes: 'Conheceu a gente na Bahia Farm Show.' }),
    lead(9, 'Camila Duarte', 'Colégio Saber', 6, { origem: 'indicacao', segmento: 'educação', servicos: ['Tráfego pago'], valor_estimado: 2500, etapa_em: quando(-4), cliente_id: 'c5' }),
    lead(10, 'Otávio Reis', 'Farmácia Vida', 7, { origem: 'anuncio', segmento: 'farmácia', valor_estimado: 1200, motivo_perda: 'preço', etapa_em: quando(-6) }),
  ],
  clientes: [
    cli(1, 'Maria Oliveira', 'Clínica Bem Estar', { segmento: 'saúde', servicos: ['Social media', 'Tráfego pago'], responsavel_id: ANA }),
    cli(2, 'Paulo Ramos', 'Ramos Materiais de Construção', { segmento: 'construção', servicos: ['Tráfego pago', 'SEO local / Google'], inicio_contrato: dia(-300) }),
    cli(3, 'Renata Lopes', 'Doce Renata Confeitaria', { segmento: 'alimentação', servicos: ['Social media', 'Audiovisual'], responsavel_id: BRUNO }),
    cli(4, 'Tiago Moura', 'Moura Agronegócios', { cidade: 'São Desidério', segmento: 'agro', servicos: ['Site', 'Audiovisual'], inicio_contrato: dia(-60) }),
    cli(5, 'Camila Duarte', 'Colégio Saber', { segmento: 'educação', servicos: ['Tráfego pago'], inicio_contrato: dia(-4) }),
    cli(6, 'Joana Pires', 'Ótica Visão', { segmento: 'ótica', servicos: ['Social media'], status: 'pausado', responsavel_id: ANA }),
  ],
  clientes_financeiro: [[1, 2800, 10], [2, 3200, 5], [3, 1500, 15], [4, 4500, 20], [5, 2500, 10], [6, 1200, 10]].map(([id, v, d]) => ({ cliente_id: 'c' + id, valor_mensal: v, dia_vencimento: d })),
  tarefas: [
    ['Posts da semana (3 carrosséis)', 'post', 'fazendo', 'alta', 0, ANA, 'c1'],
    ['Gravar reels na clínica', 'gravacao', 'a_fazer', 'media', 2, BRUNO, 'c1'],
    ['Subir campanha de matrícula', 'trafego', 'revisao', 'alta', -1, EU, 'c5'],
    ['Relatório mensal de anúncios', 'relatorio', 'a_fazer', 'media', 3, EU, 'c2'],
    ['Responder avaliações no Google', 'google', 'a_fazer', 'baixa', 1, ANA, 'c2'],
    ['Editar vídeo institucional', 'gravacao', 'fazendo', 'media', 5, BRUNO, 'c4'],
    ['Home do site nova', 'site', 'a_fazer', 'media', 8, EU, 'c4'],
    ['Stories do fim de semana', 'stories', 'a_fazer', 'baixa', 1, BRUNO, 'c3'],
    ['Reunião de proposta: Studio Letícia', 'reuniao', 'a_fazer', 'alta', 1, EU, null, 'l7'],
    ['Artes da promoção de outubro', 'design', 'feito', 'media', -2, ANA, 'c3'],
  ].map(([titulo, tipo, status, prioridade, prazo, resp, cliente, lead], i) => ({ id: 't' + i, titulo, descricao: null, tipo, status, prioridade, prazo: dia(prazo), responsavel_id: resp, cliente_id: cliente, lead_id: lead || null, criado_por: EU, concluida_em: status === 'feito' ? quando(-1) : null, criado_em: quando(-7), atualizado_em: quando(-1) })),
  atividades: [
    { id: 'a1', lead_id: 'l8', cliente_id: null, tipo: 'reuniao', texto: 'Visitou o estande na Bahia Farm Show. Quer vídeo da fazenda e site novo.', autor_id: EU, criado_em: quando(-9) },
    { id: 'a2', lead_id: 'l8', cliente_id: null, tipo: 'etapa', texto: 'Etapa: Proposta enviada → Negociação', autor_id: EU, criado_em: quando(-2) },
    { id: 'a3', lead_id: 'l1', cliente_id: null, tipo: 'sistema', texto: 'Lead chegou pelo formulário do site', autor_id: null, criado_em: quando(-0.2) },
    { id: 'a4', lead_id: null, cliente_id: 'c1', tipo: 'whatsapp', texto: 'Aprovou o calendário de posts de outubro.', autor_id: ANA, criado_em: quando(-3) },
  ],
  cobrancas: [],
}
// cobranças: mês passado todas pagas, este mês metade paga
for (const f of db.clientes_financeiro) {
  const c = db.clientes.find(x => x.id === f.cliente_id)
  if (c.status !== 'ativo') continue
  for (const [m, pago] of [[mes(-1), true], [mes(0), f.dia_vencimento <= 10]]) {
    if (c.inicio_contrato > m.slice(0, 8) + '31') continue
    const venc = m.slice(0, 8) + String(f.dia_vencimento).padStart(2, '0')
    db.cobrancas.push({ id: novoId(), cliente_id: c.id, competencia: m, valor: f.valor_mensal, vencimento: venc, status: pago ? 'pago' : 'pendente', pago_em: pago ? venc : null, criado_em: quando(-30) })
  }
}

// ─── construtor de consulta (o suficiente do PostgREST) ───
class Consulta {
  constructor(tabela) { this.t = tabela; this.filtros = []; this.ordens = []; this.lim = null; this.op = 'select'; this.modo = null }
  select() { if (this.op === 'select') this.op = 'select'; else this.devolve = true; return this }
  eq(c, v) { this.filtros.push(r => String(r[c]) === String(v)); return this }
  neq(c, v) { this.filtros.push(r => String(r[c]) !== String(v)); return this }
  not(c, op, v) { this.filtros.push(r => (op === 'is' && v === null ? r[c] != null : true)); return this }
  or(expr) {
    const partes = expr.split(',').map(p => { const [c, op, ...v] = p.split('.'); return { c, op, v: v.join('.') } })
    this.filtros.push(r => partes.some(({ c, op, v }) => (op === 'neq' ? String(r[c]) !== v : op === 'eq' ? String(r[c]) === v : op === 'gte' ? r[c] != null && r[c] >= v : false)))
    return this
  }
  order(c, o = {}) { this.ordens.push([c, o.ascending !== false, o.nullsFirst]); return this }
  limit(n) { this.lim = n; return this }
  single() { this.modo = 'single'; return this }
  maybeSingle() { this.modo = 'maybe'; return this }
  insert(d) { this.op = 'insert'; this.dados = Array.isArray(d) ? d : [d]; return this }
  upsert(d, o = {}) { this.op = 'upsert'; this.dados = Array.isArray(d) ? d : [d]; this.conflito = (o.onConflict || 'id').split(','); this.ignorar = o.ignoreDuplicates; return this }
  update(d) { this.op = 'update'; this.dados = d; return this }
  delete() { this.op = 'delete'; return this }
  then(ok, erro) { return new Promise(r => setTimeout(r, 120)).then(() => this.executar()).then(ok, erro) }
  executar() {
    const tab = db[this.t] || (db[this.t] = [])
    const passa = r => this.filtros.every(f => f(r))
    let linhas
    if (this.op === 'select') {
      linhas = tab.filter(passa).map(r => ({ ...r }))
      for (const [c, asc, nf] of [...this.ordens].reverse()) linhas.sort((a, b) => { const x = a[c], y = b[c]; if (x == null || y == null) return x == null && y == null ? 0 : (x == null) === !!nf ? -1 : 1; return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1) })
      if (this.lim) linhas = linhas.slice(0, this.lim)
    } else if (this.op === 'insert' || this.op === 'upsert') {
      linhas = []
      for (const d of this.dados) {
        const limpo = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined))
        const existe = this.op === 'upsert' && tab.find(r => this.conflito.every(k => String(r[k]) === String(limpo[k])))
        if (existe) { if (!this.ignorar) Object.assign(existe, limpo); linhas.push({ ...existe }); continue }
        const r = { id: novoId(), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...padrao(this.t), ...limpo }
        if (this.t === 'tarefas') { r.criado_por = EU; if (r.status === 'feito') r.concluida_em = new Date().toISOString() }
        tab.push(r); linhas.push({ ...r })
      }
    } else if (this.op === 'update') {
      linhas = tab.filter(passa)
      for (const r of linhas) {
        const antes = { ...r }
        Object.assign(r, Object.fromEntries(Object.entries(this.dados).filter(([, v]) => v !== undefined)), { atualizado_em: new Date().toISOString() })
        if (this.t === 'leads' && antes.etapa_id !== r.etapa_id) {
          r.etapa_em = new Date().toISOString()
          const nome = id => db.etapas.find(e => e.id === +id)?.nome
          db.atividades.push({ id: novoId(), lead_id: r.id, cliente_id: null, tipo: 'etapa', texto: `Etapa: ${nome(antes.etapa_id)} → ${nome(r.etapa_id)}`, autor_id: EU, criado_em: new Date().toISOString() })
        }
        if (this.t === 'tarefas') r.concluida_em = r.status === 'feito' ? (antes.status === 'feito' ? antes.concluida_em : new Date().toISOString()) : null
      }
      linhas = linhas.map(r => ({ ...r }))
    } else if (this.op === 'delete') {
      linhas = tab.filter(passa)
      db[this.t] = tab.filter(r => !passa(r))
    }
    if (this.modo === 'single') return linhas.length === 1 ? { data: linhas[0], error: null } : { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned' } }
    if (this.modo === 'maybe') return { data: linhas[0] || null, error: null }
    return { data: this.op === 'select' || this.devolve ? linhas : null, error: null }
  }
}
const padrao = t => ({ leads: { servicos: [], etapa_id: 1, origem: 'outro', etapa_em: new Date().toISOString() }, clientes: { servicos: [], status: 'ativo' }, tarefas: { tipo: 'outro', status: 'a_fazer', prioridade: 'media' }, atividades: { autor_id: EU, tipo: 'nota' }, cobrancas: { status: 'pendente' } }[t] || {})

const sessao = { access_token: 'demo', user: { id: EU, email: 'admin@agenciaviva.com.br' } }
let logado = true
const ouvintes = new Set()
const avisa = (e, s) => ouvintes.forEach(f => f(e, s))

export const sb = {
  from: t => new Consulta(t),
  rpc: async (fn, args) => {
    await new Promise(r => setTimeout(r, 200))
    if (fn !== 'converter_lead') return { data: null, error: { message: 'função desconhecida' } }
    const l = db.leads.find(x => x.id === args.p_lead)
    if (!l) return { data: null, error: { message: 'Lead não encontrado.' } }
    if (l.cliente_id) return { data: l.cliente_id, error: null }
    const c = { id: novoId(), nome: l.nome, empresa: l.empresa, documento: null, telefone: l.telefone, email: l.email, instagram: l.instagram, cidade: l.cidade, segmento: l.segmento, servicos: l.servicos, responsavel_id: l.responsavel_id, inicio_contrato: dia(0), status: 'ativo', observacoes: l.observacoes, criado_em: new Date().toISOString() }
    db.clientes.push(c)
    if (l.valor_estimado) db.clientes_financeiro.push({ cliente_id: c.id, valor_mensal: l.valor_estimado, dia_vencimento: 10 })
    const antes = l.etapa_id
    Object.assign(l, { cliente_id: c.id, etapa_id: 6, etapa_em: new Date().toISOString() })
    if (antes !== 6) db.atividades.push({ id: novoId(), lead_id: l.id, tipo: 'etapa', texto: `Etapa: ${db.etapas.find(e => e.id === antes).nome} → Fechado ganho`, autor_id: EU, criado_em: new Date().toISOString() })
    db.atividades.push({ id: novoId(), lead_id: l.id, cliente_id: c.id, tipo: 'sistema', texto: 'Lead convertido em cliente', autor_id: EU, criado_em: new Date().toISOString() })
    return { data: c.id, error: null }
  },
  auth: {
    getSession: async () => ({ data: { session: logado ? sessao : null } }),
    onAuthStateChange: f => { ouvintes.add(f); return { data: { subscription: { unsubscribe: () => ouvintes.delete(f) } } } },
    signInWithPassword: async () => { logado = true; avisa('SIGNED_IN', sessao); return { data: { session: sessao }, error: null } },
    signUp: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: { user: sessao.user }, error: null }),
    signOut: async () => { logado = false; avisa('SIGNED_OUT', null); return { error: null } },
  },
}
