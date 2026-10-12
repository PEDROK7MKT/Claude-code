// Blocos de conteúdo reutilizados em várias páginas (FAQ, passo a passo, vantagens).
// Manter as respostas curtas (40–60 palavras) e autocontidas: é isso que buscadores
// e assistentes de IA citam.
import { BIZ, HOURS, PRICE, RETURN_POLICY } from './data.mjs';
import { icon, wa, esc } from './ui.mjs';

export const DETRAN_URL = 'https://ba.gov.br/detran';

export const STEPS = [
  { name: 'Chegada', text: 'Venha até a unidade, na Rua São Francisco, 1516, Centro, com o veículo e os documentos. Não precisa agendar.' },
  { name: 'Atendimento', text: 'A equipe confere os seus dados e os do veículo e direciona o veículo para a vistoria.' },
  { name: 'Vistoria', text: 'O técnico realiza todos os procedimentos exigidos pelo DETRAN-BA para aquele tipo de veículo.' },
  { name: 'Emissão do laudo', text: 'O laudo é emitido na hora, ao fim da vistoria, com validade imediata para o órgão de trânsito.' },
];

export const stepsHtml = (four = true) => `<ol class="steps${four ? ' four' : ''}">
  ${STEPS.map((s, i) => `<li id="passo-${i + 1}"><h3>${s.name}</h3><p>${s.text}</p></li>`).join('\n  ')}
</ol>`;

export const PERKS = [
  ['shield', 'Credenciada pelo DETRAN-BA', 'Vistoria reconhecida pelo órgão de trânsito da Bahia, feita por equipe técnica.'],
  ['calendar', 'Sem agendamento', `Chegou, foi atendido. ${HOURS.textShort}.`],
  ['tag', `Preço transparente: ${PRICE.display}`, 'O mesmo valor para carro, moto e caminhão/reboque, informado antes de começar.'],
  ['bolt', 'Laudo emitido na hora', 'Terminou a vistoria, o laudo sai na hora, com validade imediata para o DETRAN.'],
  ['retry', 'Reprovou? Retorno gratuito', `Até ${RETURN_POLICY.days} dias úteis para regularizar e voltar sem custo adicional.`],
  ['car', 'Carro, moto e caminhão', 'Atendemos veículos leves, motocicletas, caminhões e reboques.'],
];

export const perksHtml = (dark = false) => `<div class="grid grid-3">
  ${PERKS.map(([ic, t, d]) => `<div class="card"><div class="ico-wrap">${icon(ic)}</div><h3>${t}</h3><p>${d}</p></div>`).join('\n  ')}
</div>`;

export const SERVICES = [
  ['vistoria-de-transferencia', 'clipboard', 'Vistoria de transferência', 'Obrigatória para passar o veículo para o nome do novo dono.'],
  ['vistoria-de-carro', 'car', 'Vistoria de carro', 'Carros de passeio, utilitários e picapes.'],
  ['vistoria-de-moto', 'moto', 'Vistoria de moto', 'Motocicletas, motonetas e ciclomotores.'],
  ['vistoria-de-caminhao', 'truck', 'Vistoria de caminhão e reboque', 'Caminhões, reboques e semirreboques.'],
  ['segunda-via-de-vistoria', 'copy', 'Segunda via de vistoria', 'Nova via do laudo de uma vistoria feita na FH.'],
  ['vistoria-reprovada-o-que-fazer', 'retry', 'Vistoria reprovada', `Regularize e volte em até ${RETURN_POLICY.days} dias úteis sem pagar de novo.`],
];

export const servicesHtml = (exclude = '') => `<div class="grid grid-3">
  ${SERVICES.filter(([s]) => s !== exclude)
    .map(([s, ic, t, d]) => `<a class="card" href="/${s}"><div class="ico-wrap">${icon(ic)}</div><h3>${t}</h3><p>${d}</p><span class="more">Saiba mais ${icon('arrow')}</span></a>`)
    .join('\n  ')}
</div>`;

const waLink = (label, msg) => `<a href="${esc(wa(msg))}" target="_blank" rel="noopener" data-ev="whatsapp_click" data-ev-where="faq">${label}</a>`;

// FAQ-base (seção 11 do briefing). Itens que dependiam de confirmação foram
// redigidos sem afirmar o dado desconhecido.
export const FAQ = {
  onde: {
    q: 'Onde fazer vistoria veicular em Luís Eduardo Magalhães?',
    a: `Na FH Vistorias, empresa credenciada pelo DETRAN-BA, na ${BIZ.street}, ${BIZ.district}, em ${BIZ.city} (BA). O atendimento é de segunda a sexta, das 7h30 às 12h10 e das 14h às 17h30, sem agendamento.`,
  },
  quanto: {
    q: 'Quanto custa a vistoria veicular em LEM?',
    a: `Na FH Vistorias, a vistoria custa ${PRICE.display} para carro, moto e caminhão/reboque. Se o veículo for reprovado, o retorno em até ${RETURN_POLICY.days} dias úteis não tem custo adicional. As taxas do DETRAN-BA para a transferência são pagas ao órgão, à parte.`,
  },
  agendar: {
    q: 'Preciso agendar a vistoria?',
    a: `Não. A FH Vistorias atende sem agendamento durante o horário de funcionamento: ${HOURS.text.toLowerCase()}. Se quiser saber como está o movimento antes de sair, ${waLink('chame no WhatsApp')}.`,
  },
  comoFunciona: {
    q: 'Como funciona a vistoria de transferência?',
    a: '<p>São 4 etapas:</p><ol><li><strong>Chegada</strong> com o veículo e os documentos;</li><li><strong>Atendimento</strong> e conferência dos dados;</li><li><strong>Vistoria</strong> feita pelo técnico, conforme as exigências do DETRAN-BA;</li><li><strong>Emissão do laudo</strong> na hora, com validade imediata para o órgão de trânsito.</li></ol>',
  },
  documentos: {
    q: 'Quais documentos levar para a vistoria?',
    a: `Em geral: o próprio veículo, o documento do veículo (CRLV e/ou o documento de transferência, conforme o caso) e um documento oficial com foto de quem está levando o veículo. A exigência pode variar conforme a situação; veja a <a href="/documentos-necessarios">lista por situação</a> ou ${waLink('confirme pelo WhatsApp', 'Olá! Quais documentos preciso levar para a vistoria?')}.`,
  },
  reprovado: {
    q: 'O veículo foi reprovado. Preciso pagar de novo?',
    a: `Não. Na FH Vistorias, ${RETURN_POLICY.text.charAt(0).toLowerCase() + RETURN_POLICY.text.slice(1)} Basta corrigir o que foi apontado e voltar com o veículo dentro do prazo.`,
  },
  motoCaminhao: {
    q: 'A FH Vistorias faz vistoria de moto e caminhão?',
    a: `Sim. A FH Vistorias faz vistoria de carros, motos, caminhões e reboques, todos pelo mesmo valor: ${PRICE.display}.`,
  },
  tempo: {
    q: 'Quanto tempo demora a vistoria?',
    a: `Depende do tipo de veículo e do movimento do dia. Como não precisa agendar, a dica é ${waLink('chamar no WhatsApp', 'Olá! Como está o movimento aí agora para fazer vistoria?')} antes de sair para saber como está o atendimento naquele momento. O laudo é emitido na hora, assim que a vistoria termina.`,
  },
  laudo: {
    q: 'O laudo é emitido na hora?',
    a: 'Sim. Na FH Vistorias, o laudo é emitido ao fim da vistoria, com validade imediata para o órgão de trânsito.',
  },
  compraVenda: {
    q: 'A vistoria é obrigatória na compra e venda de veículo?',
    a: 'Na transferência de propriedade, sim: o DETRAN-BA exige a vistoria para registrar o veículo no nome do novo dono. Veja o passo a passo em <a href="/vistoria-de-transferencia">vistoria de transferência</a>.',
  },
  situacoes: {
    q: 'Perdi o documento ou vou colocar placa Mercosul. Preciso de vistoria?',
    a: `Pode precisar. Segundo orientação publicada pela FH Vistorias, a vistoria costuma ser exigida em casos como segunda via de documento, troca para placa Mercosul, placa perdida ou danificada, troca de motor e mudança de característica. Como cada caso segue regras próprias do DETRAN-BA, ${waLink('confirme o seu pelo WhatsApp', 'Olá! Quero saber se meu caso precisa de vistoria.')}.`,
  },
  cautelar: {
    q: 'Qual a diferença entre vistoria de transferência e vistoria cautelar?',
    a: 'A vistoria de transferência é a exigida pelo DETRAN para mudar o veículo de dono. A vistoria cautelar é uma avaliação opcional, feita antes de comprar, para checar histórico e estrutura do veículo. O foco da FH Vistorias é a vistoria exigida pelo DETRAN-BA. <a href="/blog/vistoria-de-transferencia-ou-cautelar">Entenda a diferença</a>.',
  },
  pagamento: {
    q: 'Quais formas de pagamento são aceitas?',
    a: `Consulte as formas de pagamento aceitas ${waLink('pelo WhatsApp', 'Olá! Quais formas de pagamento vocês aceitam na vistoria?')} ${BIZ.phoneDisplay} antes de vir.`,
  },
  regiao: {
    q: 'Moro em outra cidade da região. Posso fazer a vistoria na FH?',
    a: `A FH Vistorias atende na unidade de ${BIZ.city}. Se você mora em outra cidade do Oeste da Bahia, ${waLink('chame no WhatsApp', 'Olá! Sou de outra cidade e quero fazer a vistoria com vocês. Pode me orientar?')} para confirmar se a vistoria feita em LEM atende ao seu caso antes de se deslocar.`,
  },
  horario: {
    q: 'Qual o horário de funcionamento da FH Vistorias?',
    a: `${HOURS.text}. ${HOURS.weekendText}.`,
  },
  credenciada: {
    q: 'A FH Vistorias é credenciada pelo DETRAN-BA?',
    a: `Sim. A FH Vistorias é uma empresa credenciada pelo DETRAN-BA para vistoria de veículos em ${BIZ.city}, e o laudo emitido é aceito pelo órgão de trânsito.`,
  },
};
