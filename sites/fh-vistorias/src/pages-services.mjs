// Home, página-pilar local e páginas de serviço.
import { BIZ, HOURS, PRICE, RETURN_POLICY } from './data.mjs';
import { icon, btnWa, btnRoute, quickFacts, returnCard, updated, napBlock, wa, esc } from './ui.mjs';
import { FAQ, stepsHtml, perksHtml, servicesHtml, DETRAN_URL, STEPS } from './content-shared.mjs';

const HOME = ['', 'Início'];
const PILAR = ['vistoria-veicular-luis-eduardo-magalhaes', 'Vistoria veicular em LEM'];

const priceBox = (what = 'a vistoria') => `<div class="card" style="text-align:left">
  <p style="margin:0 0 4px;font-weight:700;color:var(--ink)">Valor d${what.startsWith('a ') ? '' : 'e '}${what}</p>
  <div class="price-tag">${PRICE.display}</div>
  <p style="margin:8px 0 14px">Mesmo valor para carro, moto e caminhão/reboque. Retorno sem custo em até ${RETURN_POLICY.days} dias úteis se for reprovado.</p>
  <a class="btn btn-dark btn-sm" href="/valores">Ver tabela de valores ${icon('arrow')}</a>
</div>`;

// O que o vistoriador costuma conferir — redação genérica, sem citar portaria.
const checkedItems = (extra = []) => `<ul class="check">
  <li>Numeração do chassi e do motor, comparada com o documento do veículo;</li>
  <li>Placas e identificação do veículo;</li>
  <li>Características do veículo (espécie, tipo, cor, combustível) conforme o registro;</li>
  <li>Itens de segurança e de sinalização exigidos para aquele tipo de veículo;</li>
  ${extra.map((e) => `<li>${e}</li>`).join('\n  ')}
</ul>
<p>A lista exata segue as normas do <a href="${DETRAN_URL}" target="_blank" rel="noopener">DETRAN-BA</a> e pode variar conforme o tipo e a situação do veículo.</p>`;

export const servicePages = [
  // ---------------------------------------------------------------- HOME
  {
    slug: '',
    file: 'index.html',
    title: 'Vistoria Veicular em Luís Eduardo Magalhães | FH Vistorias',
    description: 'Vistoria credenciada pelo DETRAN-BA em LEM. Carro, moto e caminhão. Sem agendamento, laudo na hora. Chame no WhatsApp!',
    h1: 'Vistoria veicular em Luís Eduardo Magalhães <span class="hl">Credenciada pelo DETRAN-BA</span>',
    trail: [HOME],
    eyebrow: `${icon('shield')} FH Vistorias · ${BIZ.cityShort}-${BIZ.state}`,
    lead: `Carro, moto e caminhão. <strong>Sem agendamento</strong>, <strong>laudo emitido na hora</strong> e retorno gratuito em até ${RETURN_POLICY.days} dias úteis se for preciso regularizar. ${BIZ.street} — ${BIZ.district}.`,
    heroSide: 'facts',
    heroButtons: `${btnWa('Chamar no WhatsApp', undefined, 'btn btn-wa', 'hero')}${btnRoute('Como chegar', 'btn btn-ghost', 'hero')}<a class="btn btn-ghost" href="/valores">${icon('tag')}<span>Ver valores</span></a>`,
    priority: '1.0',
    body: `
<section class="sec" aria-labelledby="resposta">
  <div class="wrap two">
    <div class="prose">
      <h2 id="resposta">Vistoria em LEM: resposta rápida</h2>
      <p class="answer">A <strong>FH Vistorias</strong> é uma empresa de vistoria veicular <strong>credenciada pelo DETRAN-BA</strong> em ${BIZ.city} (BA). Realiza vistoria de transferência para carros, motos e caminhões, com laudo emitido na hora. Atendimento de segunda a sexta, das 7h30 às 12h10 e das 14h às 17h30, na ${BIZ.street}, ${BIZ.district}. Valor: ${PRICE.display}.</p>
      <p>Quem precisa de vistoria já sabe o que quer: um lugar perto, rápido e confiável, com preço claro. Por isso a FH funciona sem agendamento — você chega com o veículo e os documentos, a equipe confere os dados, o técnico faz a vistoria e o laudo sai na hora.</p>
      <p>Comprou ou vendeu um veículo? A <a href="/vistoria-de-transferencia">vistoria de transferência</a> é a etapa exigida pelo DETRAN-BA para passar o veículo para o nome do novo dono. Também atendemos <a href="/segunda-via-de-vistoria">segunda via de vistoria</a> e orientamos casos como troca de placa e de motor.</p>
    </div>
    ${priceBox()}
  </div>
</section>

<section class="sec sec-mist" aria-labelledby="diferenciais">
  <div class="wrap">
    <div class="sec-head"><h2 id="diferenciais">Por que fazer a vistoria com a FH</h2><p>Segurança, agilidade e confiança — do atendimento ao laudo.</p></div>
    ${perksHtml()}
  </div>
</section>

<section class="sec" aria-labelledby="servicos">
  <div class="wrap">
    <div class="sec-head"><h2 id="servicos">Serviços de vistoria</h2><p>Escolha o seu caso e veja documentos, valor e o que esperar.</p></div>
    ${servicesHtml()}
  </div>
</section>

<section class="sec sec-dark" aria-labelledby="como">
  <div class="wrap">
    <div class="sec-head"><h2 id="como">Como funciona a vistoria, em 4 passos</h2><p>Do momento em que você chega até o laudo na mão. <a href="/como-funciona">Ver detalhes</a>.</p></div>
    ${stepsHtml()}
  </div>
</section>

<section class="sec" aria-labelledby="reprovou">
  <div class="wrap two">
    <div class="prose">
      <h2 id="reprovou">Reprovou na vistoria? Você não paga tudo de novo</h2>
      <p class="answer">Na FH Vistorias, se o veículo for reprovado, você tem <strong>até ${RETURN_POLICY.days} dias úteis</strong> para regularizar o que foi apontado e voltar <strong>sem custo adicional</strong>.</p>
      <p>É só corrigir o item, trazer o veículo de volta dentro do prazo e refazer a conferência. <a href="/vistoria-reprovada-o-que-fazer">Veja o que fazer se a vistoria for reprovada</a>.</p>
    </div>
    <div class="card">
      <div class="ico-wrap">${icon('pin')}</div>
      <h3>Onde estamos</h3>
      ${napBlock()}
      <div class="btns" style="margin-top:16px">${btnRoute('Abrir rota no mapa', 'btn btn-dark btn-sm', 'home_local')}</div>
    </div>
  </div>
</section>`,
    faqs: [FAQ.onde, FAQ.quanto, FAQ.agendar, FAQ.documentos, FAQ.reprovado, FAQ.laudo],
    faqTitle: 'Dúvidas mais comuns sobre vistoria em LEM',
  },

  // ---------------------------------------------------------------- PILAR LOCAL
  {
    slug: PILAR[0],
    title: 'Vistoria Veicular em LEM-BA: Valor, Horário e Local',
    description: 'Tudo sobre vistoria veicular em Luís Eduardo Magalhães: onde fazer, valor, documentos e horário. FH Vistorias, credenciada DETRAN-BA.',
    h1: 'Vistoria veicular em Luís Eduardo Magalhães (BA)',
    trail: [HOME, PILAR],
    eyebrow: `${icon('pin')} Guia local · ${BIZ.city}`,
    lead: `Onde fazer, quanto custa, o que levar e se precisa agendar — as respostas para fazer a sua vistoria em LEM sem perder tempo.`,
    heroSide: 'facts',
    service: { name: `Vistoria veicular em ${BIZ.city}`, description: `Vistoria veicular credenciada pelo DETRAN-BA para carros, motos e caminhões em ${BIZ.city} (BA), com laudo emitido na hora.` },
    priority: '0.9',
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>Onde fazer vistoria veicular em LEM?</h2>
      <p class="answer">Em ${BIZ.city}, a <strong>FH Vistorias</strong> faz vistoria veicular credenciada pelo DETRAN-BA na <strong>${BIZ.street}, ${BIZ.district}</strong>. Atende carros, motos e caminhões, de segunda a sexta, das 7h30 às 12h10 e das 14h às 17h30, sem agendamento.</p>
      <p>A unidade fica no Centro, com acesso fácil para quem vem de qualquer bairro de LEM. Se for a primeira vez, <a href="/contato">veja o mapa e a rota</a>.</p>

      <h2>O que é a vistoria veicular?</h2>
      <p class="answer">Vistoria veicular é a conferência técnica que comprova que o veículo é ele mesmo — que chassi, motor, placas e características batem com o registro — e que está em condições exigidas pelo DETRAN. O resultado é um <strong>laudo</strong>, usado no processo do órgão de trânsito.</p>
      <p>Ela protege quem compra e quem vende: confirma a identidade do veículo antes de ele mudar de dono e ajuda a evitar fraudes, como adulteração de numeração.</p>

      <h2>Quando a vistoria é necessária?</h2>
      <p class="answer">O caso mais comum é a <strong>transferência de propriedade</strong> — quando o veículo é comprado e vai para o nome do novo dono. Segundo orientação publicada pela FH, ela também costuma ser exigida em segunda via de documento, troca para placa Mercosul, placa perdida ou danificada, troca de motor e mudança de característica.</p>
      <p>Cada situação segue regras próprias do DETRAN-BA. Veja a <a href="/documentos-necessarios">lista de documentos por situação</a> ou confirme o seu caso pelo WhatsApp.</p>

      <h2>Quanto custa a vistoria em LEM?</h2>
      <p class="answer">Na FH Vistorias, a vistoria custa <strong>${PRICE.display}</strong> para carro, moto e caminhão/reboque. As taxas do DETRAN-BA para a transferência são pagas diretamente ao órgão, à parte.</p>
      <p>E se o veículo for reprovado, você tem até ${RETURN_POLICY.days} dias úteis para regularizar e voltar sem custo adicional. <a href="/valores">Ver tabela de valores</a>.</p>

      <h2>Precisa agendar?</h2>
      <p class="answer">Não. A FH Vistorias atende sem agendamento durante todo o horário de funcionamento. Basta chegar com o veículo e os documentos.</p>

      <h2>Como é feita a vistoria?</h2>
      <p>Em quatro etapas: chegada, atendimento, vistoria e emissão do laudo — que sai na hora. <a href="/como-funciona">Veja cada etapa em detalhe</a>.</p>
      <h3>O que o vistoriador costuma conferir</h3>
      ${checkedItems()}
      ${updated()}
    </article>
    <aside>
      ${priceBox()}
      <div style="height:16px"></div>
      ${returnCard()}
    </aside>
  </div>
</section>
<section class="sec sec-mist">
  <div class="wrap">
    <div class="sec-head"><h2>Escolha o tipo de vistoria</h2></div>
    ${servicesHtml()}
  </div>
</section>`,
    faqs: [FAQ.onde, FAQ.quanto, FAQ.agendar, FAQ.credenciada, FAQ.situacoes, FAQ.tempo, FAQ.regiao],
    faqTitle: 'Perguntas frequentes sobre vistoria em LEM',
  },

  // ---------------------------------------------------------------- TRANSFERÊNCIA
  {
    slug: 'vistoria-de-transferencia',
    title: 'Vistoria de Transferência em LEM-BA | FH Vistorias',
    description: 'Como fazer a vistoria de transferência em Luís Eduardo Magalhães: documentos, valor e passo a passo. Laudo emitido na hora.',
    h1: 'Vistoria de transferência de veículo em LEM',
    trail: [HOME, PILAR, ['vistoria-de-transferencia', 'Vistoria de transferência']],
    eyebrow: `${icon('clipboard')} Transferência de propriedade`,
    lead: 'Comprou ou vendeu um veículo? A vistoria de transferência é a etapa exigida pelo DETRAN-BA para passar o veículo para o nome do novo dono. Na FH, sem agendamento e com laudo na hora.',
    heroSide: 'facts',
    service: { name: 'Vistoria de transferência de propriedade', serviceType: 'Vistoria de transferência', description: `Vistoria exigida pelo DETRAN-BA para transferência de propriedade de carros, motos e caminhões em ${BIZ.city}, com laudo emitido na hora.` },
    priority: '0.9',
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>O que é a vistoria de transferência?</h2>
      <p class="answer">A vistoria de transferência é a conferência técnica que o DETRAN-BA exige para <strong>mudar o veículo de dono</strong>. O vistoriador confirma que chassi, motor, placas e características batem com o documento, e emite o laudo usado no processo de transferência.</p>
      <p>Ela vale para carros, motos, caminhões e reboques. Na FH Vistorias, o valor é o mesmo para todos: <strong>${PRICE.display}</strong>.</p>

      <h2>Passo a passo da vistoria de transferência na FH</h2>
      <p class="answer">São 4 etapas: chegada com o veículo e os documentos, atendimento e conferência dos dados, vistoria feita pelo técnico e emissão do laudo — na hora, com validade imediata para o órgão de trânsito.</p>
    </article>
    <aside>${priceBox('a vistoria de transferência')}</aside>
  </div>
  <div class="wrap" style="margin-top:24px">${stepsHtml()}</div>
</section>

<section class="sec sec-mist">
  <div class="wrap two">
    <div class="prose">
      <h2>Quais documentos levar?</h2>
      <p class="answer">Em geral, traga <strong>o próprio veículo</strong>, o <strong>documento do veículo</strong> (CRLV e/ou o documento de transferência, conforme o caso) e um <strong>documento oficial com foto</strong> de quem está levando o veículo.</p>
      <p>A exigência pode mudar conforme a situação. Para não perder a viagem, confirme a lista do seu caso pelo WhatsApp antes de vir. <a href="/documentos-necessarios">Ver documentos por situação</a>.</p>

      <h2>A vistoria é obrigatória para transferir?</h2>
      <p class="answer">Sim. Na transferência de propriedade, o DETRAN-BA exige a vistoria para registrar o veículo no nome do novo dono. Sem o laudo, o processo de transferência não avança.</p>
      <p>Por lei, quem compra tem prazo para fazer a transferência. Por isso vale fazer a vistoria logo depois de fechar o negócio — e, se algo precisar de ajuste, ainda dá tempo de regularizar. Confira as regras e prazos atualizados no site do <a href="${DETRAN_URL}" target="_blank" rel="noopener">DETRAN-BA</a>.</p>

      <h2>E se o veículo for reprovado?</h2>
      <p class="answer">${RETURN_POLICY.text} Você corrige o que foi apontado e volta com o veículo dentro do prazo.</p>
      <p><a href="/vistoria-reprovada-o-que-fazer">Entenda o que fazer se a vistoria for reprovada</a>.</p>
    </div>
    <div class="card">
      <h3>Antes de sair de casa</h3>
      <ul class="check">
        <li>Separe o documento do veículo e o seu documento com foto.</li>
        <li>Confira se faróis, lanternas e setas estão funcionando.</li>
        <li>Verifique se as placas estão legíveis e bem fixadas.</li>
        <li>Venha de segunda a sexta, das 7h30 às 12h10 ou das 14h às 17h30.</li>
      </ul>
      <div class="btns" style="margin-top:12px">${btnWa('Tirar dúvida no WhatsApp', 'Olá! Vou fazer a vistoria de transferência. Pode me orientar?', 'btn btn-wa btn-sm', 'transferencia_card')}</div>
    </div>
  </div>
  <div class="wrap">${updated()}</div>
</section>`,
    faqs: [FAQ.compraVenda, FAQ.documentos, FAQ.quanto, FAQ.agendar, FAQ.laudo, FAQ.reprovado, FAQ.cautelar],
    faqTitle: 'Dúvidas sobre vistoria de transferência',
  },

  // ---------------------------------------------------------------- CARRO
  {
    slug: 'vistoria-de-carro',
    title: 'Vistoria de Carro em Luís Eduardo Magalhães | FH',
    description: `Vistoria de carro credenciada DETRAN-BA em LEM por ${PRICE.display}. Sem agendamento e laudo na hora. Rua São Francisco, 1516, Centro.`,
    h1: 'Vistoria de carro em Luís Eduardo Magalhães',
    trail: [HOME, PILAR, ['vistoria-de-carro', 'Vistoria de carro']],
    eyebrow: `${icon('car')} Carros, utilitários e picapes`,
    lead: `Vistoria para carro de passeio, utilitário e picape, credenciada pelo DETRAN-BA. ${PRICE.display}, sem agendamento e com laudo emitido na hora.`,
    heroSide: 'facts',
    service: { name: 'Vistoria veicular de carro', description: `Vistoria credenciada pelo DETRAN-BA para carros de passeio, utilitários e picapes em ${BIZ.city}.` },
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>Como é a vistoria de carro na FH?</h2>
      <p class="answer">Você chega com o carro e os documentos, sem agendar. A equipe confere os dados, o técnico faz a vistoria conforme as exigências do DETRAN-BA e o <strong>laudo sai na hora</strong>. Valor: <strong>${PRICE.display}</strong>.</p>
      <p>Atendemos carros de passeio (hatch, sedã, SUV), utilitários e picapes — inclusive as picapes de trabalho tão comuns em LEM e no agro do Oeste baiano.</p>

      <h2>O que é conferido na vistoria do carro?</h2>
      ${checkedItems(['Estado de vidros, faróis, lanternas, setas e luz de freio.'])}

      <h2>Quando o carro precisa de vistoria?</h2>
      <p class="answer">Principalmente na <a href="/vistoria-de-transferencia">transferência de propriedade</a>, quando o carro é comprado e vai para o nome do novo dono. Também pode ser exigida em segunda via de documento, troca de placa, troca de motor e mudança de característica.</p>
      <p>Na dúvida, chame no WhatsApp e diga o que você precisa fazer no DETRAN — a equipe orienta se o seu caso pede vistoria.</p>

      <h2>Dicas para o carro passar de primeira</h2>
      <ul>
        <li>Teste faróis, lanternas, setas, luz de ré e de freio.</li>
        <li>Placas limpas, legíveis e bem presas.</li>
        <li>Se trocou motor, cor ou alguma característica, traga a documentação da alteração.</li>
        <li>Carro lavado facilita a leitura das numerações de chassi e motor.</li>
      </ul>
      ${returnCard()}
      ${updated()}
    </article>
    <aside>${priceBox('a vistoria de carro')}</aside>
  </div>
</section>
<section class="sec sec-mist"><div class="wrap"><div class="sec-head"><h2>Outros serviços</h2></div>${servicesHtml('vistoria-de-carro')}</div></section>`,
    faqs: [FAQ.quanto, FAQ.documentos, FAQ.agendar, FAQ.tempo, FAQ.reprovado],
    faqTitle: 'Dúvidas sobre vistoria de carro',
  },

  // ---------------------------------------------------------------- MOTO
  {
    slug: 'vistoria-de-moto',
    title: 'Vistoria de Moto em Luís Eduardo Magalhães | FH',
    description: `Vistoria de moto credenciada DETRAN-BA em LEM por ${PRICE.display}. Sem agendamento, laudo na hora e retorno grátis em 30 dias úteis.`,
    h1: 'Vistoria de moto em Luís Eduardo Magalhães',
    trail: [HOME, PILAR, ['vistoria-de-moto', 'Vistoria de moto']],
    eyebrow: `${icon('moto')} Motos, motonetas e ciclomotores`,
    lead: `Vistoria para transferência de propriedade de motocicleta, credenciada pelo DETRAN-BA. ${PRICE.display}, sem agendamento e com laudo na hora.`,
    heroSide: 'facts',
    service: { name: 'Vistoria veicular de moto', description: `Vistoria credenciada pelo DETRAN-BA para motocicletas, motonetas e ciclomotores em ${BIZ.city}.` },
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>Como é a vistoria de moto?</h2>
      <p class="answer">A vistoria de moto na FH Vistorias custa <strong>${PRICE.display}</strong>, não precisa de agendamento e o <strong>laudo é emitido na hora</strong>. Você traz a moto e os documentos, a equipe confere os dados e o técnico faz a vistoria exigida pelo DETRAN-BA.</p>
      <p>A moto é o veículo de trabalho e de dia a dia de muita gente em LEM. Por isso o atendimento é direto: sem fila de agendamento, sem complicação.</p>

      <h2>O que é conferido na vistoria da moto?</h2>
      ${checkedItems(['Farol, lanterna, setas, luz de freio, buzina e retrovisores.'])}

      <h2>Quando a moto precisa de vistoria?</h2>
      <p class="answer">Na <a href="/vistoria-de-transferencia">transferência de propriedade</a> — quando você compra uma moto usada e vai colocá-la no seu nome. Também pode ser exigida em segunda via de documento, troca de placa e troca de motor.</p>

      <h2>Dicas para a moto passar de primeira</h2>
      <ul>
        <li>Placa legível e bem fixada — placa torta ou apagada é motivo comum de problema.</li>
        <li>Todas as luzes funcionando, inclusive a de freio.</li>
        <li>Retrovisores dos dois lados.</li>
        <li>Moto limpa na região do chassi e do motor, para facilitar a leitura das numerações.</li>
      </ul>
      ${returnCard()}
      ${updated()}
    </article>
    <aside>${priceBox('a vistoria de moto')}</aside>
  </div>
</section>
<section class="sec sec-mist"><div class="wrap"><div class="sec-head"><h2>Outros serviços</h2></div>${servicesHtml('vistoria-de-moto')}</div></section>`,
    faqs: [
      { q: 'Quanto custa a vistoria de moto em LEM?', a: `Na FH Vistorias, a vistoria de moto custa ${PRICE.display} — o mesmo valor de carro e caminhão. Se a moto for reprovada, o retorno em até ${RETURN_POLICY.days} dias úteis não tem custo adicional.` },
      FAQ.documentos,
      FAQ.agendar,
      FAQ.reprovado,
      FAQ.laudo,
    ],
    faqTitle: 'Dúvidas sobre vistoria de moto',
  },

  // ---------------------------------------------------------------- CAMINHÃO
  {
    slug: 'vistoria-de-caminhao',
    title: 'Vistoria de Caminhão e Reboque em LEM-BA | FH',
    description: `Vistoria de caminhão, reboque e semirreboque credenciada DETRAN-BA em Luís Eduardo Magalhães. ${PRICE.display}, laudo emitido na hora.`,
    h1: 'Vistoria de caminhão e reboque em LEM',
    trail: [HOME, PILAR, ['vistoria-de-caminhao', 'Vistoria de caminhão e reboque']],
    eyebrow: `${icon('truck')} Caminhões, reboques e semirreboques`,
    lead: `Vistoria credenciada pelo DETRAN-BA para caminhão, reboque e semirreboque em ${BIZ.city}. ${PRICE.display}, sem agendamento e com laudo na hora.`,
    heroSide: 'facts',
    service: { name: 'Vistoria de caminhão e reboque', description: `Vistoria credenciada pelo DETRAN-BA para caminhões, reboques e semirreboques em ${BIZ.city}, polo do agronegócio do Oeste da Bahia.` },
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>Como é a vistoria de caminhão e reboque?</h2>
      <p class="answer">A FH Vistorias faz vistoria de <strong>caminhão, reboque e semirreboque</strong> por <strong>${PRICE.display}</strong>, sem agendamento e com <strong>laudo emitido na hora</strong>. O técnico confere identificação, numerações e itens exigidos pelo DETRAN-BA para veículos de carga.</p>
      <p>LEM é um dos maiores polos do agronegócio do país, e caminhão e carreta fazem parte da rotina de quem trabalha aqui. Por isso o atendimento a veículos pesados é parte do dia a dia da FH.</p>

      <h2>Vai trazer caminhão ou carreta? Avise antes</h2>
      <p class="answer">Para veículos grandes, <strong>chame no WhatsApp antes de vir</strong>. Assim a equipe orienta o melhor horário e a forma de chegada do caminhão ou do conjunto até a unidade.</p>
      <div class="btns" style="margin-bottom:1.2em">${btnWa('Avisar que vou levar caminhão', 'Olá! Vou levar um caminhão/reboque para vistoria. Qual a melhor forma de chegar?', 'btn btn-wa', 'caminhao_aviso')}</div>

      <h2>O que é conferido na vistoria do caminhão?</h2>
      ${checkedItems(['Sinalização, iluminação e itens de segurança próprios de veículo de carga.'])}

      <h2>Reboque e semirreboque precisam de vistoria própria?</h2>
      <p class="answer">Reboques e semirreboques têm placa e documento próprios. Se a transferência envolver o implemento, informe no atendimento ou pelo WhatsApp para a equipe orientar a vistoria de cada veículo do conjunto.</p>
      ${returnCard()}
      ${updated()}
    </article>
    <aside>${priceBox('a vistoria de caminhão')}</aside>
  </div>
</section>
<section class="sec sec-mist"><div class="wrap"><div class="sec-head"><h2>Outros serviços</h2></div>${servicesHtml('vistoria-de-caminhao')}</div></section>`,
    faqs: [
      { q: 'Quanto custa a vistoria de caminhão em LEM?', a: `Na FH Vistorias, a vistoria de caminhão e reboque custa ${PRICE.display}, o mesmo valor de carro e moto.` },
      { q: 'Preciso agendar para levar caminhão?', a: 'Não é preciso agendar. Para veículos grandes, porém, vale avisar pelo WhatsApp antes de vir, para a equipe orientar o melhor horário e a chegada do veículo.' },
      FAQ.documentos,
      FAQ.reprovado,
    ],
    faqTitle: 'Dúvidas sobre vistoria de caminhão e reboque',
  },

  // ---------------------------------------------------------------- SEGUNDA VIA
  {
    slug: 'segunda-via-de-vistoria',
    title: 'Segunda Via de Vistoria em LEM-BA | FH Vistorias',
    description: 'Precisa da segunda via do laudo de vistoria em Luís Eduardo Magalhães? Veja como pedir na FH Vistorias, credenciada pelo DETRAN-BA.',
    h1: 'Segunda via de vistoria em Luís Eduardo Magalhães',
    trail: [HOME, PILAR, ['segunda-via-de-vistoria', 'Segunda via de vistoria']],
    eyebrow: `${icon('copy')} Nova via do laudo`,
    lead: 'Perdeu o laudo ou precisa de uma nova via para o processo no DETRAN? A FH Vistorias emite a segunda via da vistoria feita na unidade.',
    heroSide: 'facts',
    service: { name: 'Segunda via de vistoria', serviceType: 'Emissão de segunda via de laudo de vistoria', description: 'Emissão da segunda via do laudo de vistoria veicular feita na FH Vistorias, em Luís Eduardo Magalhães.', price: false },
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>O que é a segunda via de vistoria?</h2>
      <p class="answer">É a <strong>emissão de uma nova via do laudo</strong> de uma vistoria já realizada na FH Vistorias — por exemplo, quando o laudo foi perdido ou quando o processo no DETRAN pede outra via.</p>

      <h2>Como pedir a segunda via?</h2>
      <p class="answer">Chame no WhatsApp ${BIZ.phoneDisplay} informando a <strong>placa do veículo</strong> e o nome de quem fez a vistoria. A equipe confirma o que é preciso, o valor e como retirar a nova via.</p>
      <div class="btns" style="margin-bottom:1.2em">${btnWa('Pedir segunda via no WhatsApp', 'Olá! Preciso da segunda via da minha vistoria. A placa do veículo é: ', 'btn btn-wa', 'segunda_via')}</div>

      <h2>Segunda via do laudo x segunda via do documento do veículo</h2>
      <p class="answer">São coisas diferentes. A segunda via <em>do laudo</em> é uma nova cópia da vistoria. Já a segunda via <em>do documento do veículo</em> (CRV/CRLV) é pedida ao DETRAN-BA e, conforme o caso, pode exigir uma <strong>nova vistoria</strong>.</p>
      <p>Se você perdeu o documento do veículo, veja a <a href="/documentos-necessarios">lista de documentos por situação</a> ou fale com a equipe para saber se o seu caso precisa de vistoria.</p>
      ${updated()}
    </article>
    <aside class="card">
      <h3>Valor da segunda via</h3>
      <p>Consulte o valor da segunda via pelo WhatsApp antes de vir.</p>
      <div class="btns" style="margin-top:12px">${btnWa('Consultar valor', 'Olá! Qual o valor da segunda via de vistoria?', 'btn btn-dark btn-sm', 'segunda_via_valor')}</div>
    </aside>
  </div>
</section>
<section class="sec sec-mist"><div class="wrap"><div class="sec-head"><h2>Outros serviços</h2></div>${servicesHtml('segunda-via-de-vistoria')}</div></section>`,
    faqs: [
      { q: 'Como pedir a segunda via da vistoria na FH?', a: `Chame no WhatsApp ${BIZ.phoneDisplay} com a placa do veículo e o nome de quem fez a vistoria. A equipe informa o valor e como retirar a nova via do laudo.` },
      FAQ.situacoes,
      FAQ.horario,
    ],
    faqTitle: 'Dúvidas sobre segunda via',
  },

  // ---------------------------------------------------------------- REPROVADA
  {
    slug: 'vistoria-reprovada-o-que-fazer',
    title: 'Vistoria Reprovada? Retorno Grátis em 30 Dias | FH',
    description: 'Vistoria reprovada em LEM? Na FH Vistorias você tem até 30 dias úteis para regularizar e voltar sem custo adicional. Veja o que fazer.',
    h1: 'Vistoria reprovada: o que fazer',
    trail: [HOME, PILAR, ['vistoria-reprovada-o-que-fazer', 'Vistoria reprovada']],
    eyebrow: `${icon('retry')} Retorno sem custo`,
    lead: `Reprovou? Não precisa pagar tudo de novo. Na FH Vistorias você tem até ${RETURN_POLICY.days} dias úteis para regularizar e retornar sem custo adicional.`,
    heroSide: 'facts',
    service: { name: 'Retorno de vistoria reprovada', serviceType: 'Revistoria', description: `Retorno sem custo adicional em até ${RETURN_POLICY.days} dias úteis para veículo reprovado na vistoria da FH Vistorias, em ${BIZ.city}.`, price: false },
    body: `
<section class="sec">
  <div class="wrap two">
    <article class="prose">
      <h2>Fui reprovado na vistoria. Tenho que pagar de novo?</h2>
      <p class="answer">Não. Na FH Vistorias, se o veículo for reprovado, você tem <strong>até ${RETURN_POLICY.days} dias úteis</strong> para regularizar o que foi apontado e voltar <strong>sem custo adicional</strong>.</p>
      <p>Esse é um compromisso da FH com o cliente: a reprovação aponta o que precisa ser corrigido, e você tem tempo para resolver sem pagar uma nova vistoria.</p>

      <h2>O que fazer depois da reprovação — 3 passos</h2>
      <ol>
        <li><strong>Entenda o motivo.</strong> Pergunte ao vistoriador o que foi apontado e anote a data-limite do seu retorno.</li>
        <li><strong>Regularize.</strong> Faça o reparo ou providencie o documento que faltou.</li>
        <li><strong>Volte dentro do prazo.</strong> Traga o veículo de volta em até ${RETURN_POLICY.days} dias úteis, sem custo adicional.</li>
      </ol>

      <h2>Motivos comuns de reprovação</h2>
      <p class="answer">Em geral, a reprovação acontece quando algo não bate com o registro do veículo ou quando falta algum item exigido — como numeração de chassi ou motor ilegível ou divergente, placa danificada, lâmpadas queimadas ou característica alterada sem regularização.</p>
      <ul>
        <li><strong>Iluminação:</strong> farol, lanterna, seta ou luz de freio sem funcionar.</li>
        <li><strong>Placas:</strong> amassadas, ilegíveis, soltas ou diferentes do registro.</li>
        <li><strong>Numerações:</strong> chassi ou motor com leitura difícil ou divergente do documento.</li>
        <li><strong>Alterações:</strong> troca de motor, cor ou característica sem a documentação correspondente.</li>
        <li><strong>Documentação:</strong> documento incompleto ou divergente.</li>
      </ul>
      <p>Cada caso tem uma solução diferente. Se tiver dúvida sobre o que foi apontado, chame a equipe no WhatsApp.</p>
      ${updated()}
    </article>
    <aside class="card">
      <div class="ico-wrap">${icon('retry')}</div>
      <h3>Retorno grátis em até ${RETURN_POLICY.days} dias úteis</h3>
      <p>Regularizou? Volte de segunda a sexta, ${HOURS.textShort.replace('Seg a sex · ', '')}, sem agendar.</p>
      <div class="btns" style="margin-top:14px">${btnWa('Tirar dúvida sobre a reprovação', 'Olá! Meu veículo foi reprovado na vistoria. Pode me orientar?', 'btn btn-wa btn-sm', 'reprovada_card')}</div>
    </aside>
  </div>
</section>`,
    faqs: [
      FAQ.reprovado,
      { q: 'Em quanto tempo preciso voltar depois da reprovação?', a: `Você tem até ${RETURN_POLICY.days} dias úteis para regularizar e retornar à FH Vistorias sem custo adicional. Na hora da reprovação, confirme com a equipe a data-limite do seu retorno.` },
      { q: 'Preciso agendar o retorno?', a: 'Não. Assim como a primeira vistoria, o retorno é feito sem agendamento, de segunda a sexta, no horário de funcionamento.' },
    ],
    faqTitle: 'Dúvidas sobre vistoria reprovada',
  },
];
