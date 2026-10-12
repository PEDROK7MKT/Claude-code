// Valores, como funciona, documentos, FAQ, sobre, contato e páginas legais.
import { SITE, BIZ, HOURS, PRICE, RETURN_POLICY } from './data.mjs';
import { icon, btnWa, btnRoute, btnPhone, napBlock, updated, returnCard, mapsEmbed, esc, quickFacts } from './ui.mjs';
import { FAQ, STEPS, stepsHtml, perksHtml, servicesHtml, DETRAN_URL } from './content-shared.mjs';

const HOME = ['', 'Início'];

export const infoPages = [
  // ---------------------------------------------------------------- VALORES
  {
    slug: 'valores',
    title: 'Valor da Vistoria Veicular em LEM | FH Vistorias',
    description: `Carro, moto e caminhão: ${PRICE.display}. Preço transparente, informado antes de começar. Retorno grátis em 30 dias úteis.`,
    h1: 'Valor da vistoria veicular em LEM',
    trail: [HOME, ['valores', 'Valores']],
    lead: `Um valor só para carro, moto e caminhão/reboque: <strong>${PRICE.display}</strong>. E se for reprovado, o retorno em até ${RETURN_POLICY.days} dias úteis não tem custo adicional.`,
    heroSide: 'facts',
    priority: '0.9',
    body: `
<section class="sec">
  <div class="wrap two">
    <div class="prose">
      <h2>Quanto custa a vistoria na FH Vistorias?</h2>
      <p class="answer">A vistoria veicular na FH Vistorias custa <strong>${PRICE.display}</strong> para <strong>carro, moto e caminhão/reboque</strong>. O valor inclui a vistoria e a emissão do laudo na hora. Se o veículo for reprovado, o retorno em até ${RETURN_POLICY.days} dias úteis é sem custo adicional.</p>
      <div class="table-wrap">
        <table class="table">
          <caption>Tabela de valores da FH Vistorias, ${BIZ.city} (BA)</caption>
          <thead><tr><th scope="col">Serviço</th><th scope="col">Valor</th></tr></thead>
          <tbody>
            ${PRICE.table.map((r) => `<tr><th scope="row" style="font-weight:600"><a href="/${r.slug}">${r.item}</a></th><td class="num">${r.price.replace('R$ ', () => 'R$&nbsp;')}</td></tr>`).join('\n            ')}
            <tr><th scope="row" style="font-weight:600"><a href="/vistoria-reprovada-o-que-fazer">Retorno após reprovação (até ${RETURN_POLICY.days} dias úteis)</a></th><td class="num">Sem custo adicional</td></tr>
          </tbody>
        </table>
      </div>
      <p style="margin-top:12px;font-size:.95rem;color:var(--muted)">Valores conferidos em ${SITE.updatedLabel}.</p>

      <h2>O que está incluso no valor?</h2>
      <ul class="check">
        <li>Atendimento e conferência dos dados do veículo;</li>
        <li>Vistoria feita pelo técnico, conforme as exigências do DETRAN-BA;</li>
        <li>Emissão do laudo na hora;</li>
        <li>Retorno sem custo adicional em até ${RETURN_POLICY.days} dias úteis, se o veículo for reprovado.</li>
      </ul>

      <h2>O valor da vistoria inclui as taxas do DETRAN?</h2>
      <p class="answer">Não. O valor de ${PRICE.display} é o da vistoria. As taxas do DETRAN-BA para a transferência ou para outros serviços do órgão são cobradas pelo próprio DETRAN, à parte.</p>
      <p>Para consultar as taxas oficiais, acesse o site do <a href="${DETRAN_URL}" target="_blank" rel="noopener">DETRAN-BA</a>.</p>

      <h2>Quais as formas de pagamento?</h2>
      <p>Consulte as formas de pagamento aceitas pelo WhatsApp ${BIZ.phoneDisplay} antes de vir.</p>
      ${updated()}
    </div>
    <aside>
      <div class="price-box">
        <p class="pb-label">Carro, moto ou caminhão</p>
        <div class="price-tag">${PRICE.display}</div>
        <p>Sem agendamento. Laudo na hora.</p>
        ${btnWa('Chamar no WhatsApp', 'Olá! Vi o valor no site e quero fazer a vistoria. Pode me orientar?', 'btn btn-wa', 'valores_card')}
      </div>
      <div style="height:16px"></div>
      ${returnCard()}
    </aside>
  </div>
</section>`,
    faqs: [FAQ.quanto, FAQ.pagamento, FAQ.reprovado, FAQ.motoCaminhao],
    faqTitle: 'Dúvidas sobre valores',
  },

  // ---------------------------------------------------------------- COMO FUNCIONA
  {
    slug: 'como-funciona',
    title: 'Como Funciona a Vistoria Veicular | FH Vistorias LEM',
    description: 'Passo a passo da vistoria na FH Vistorias em LEM: chegada, atendimento, vistoria e laudo emitido na hora. Sem agendamento.',
    h1: 'Como funciona a vistoria veicular na FH',
    trail: [HOME, ['como-funciona', 'Como funciona']],
    lead: 'Quatro etapas, do momento em que você chega até o laudo na mão. Sem agendamento e sem complicação.',
    heroSide: 'facts',
    howto: STEPS,
    body: `
<section class="sec">
  <div class="wrap">
    <div class="sec-head prose">
      <h2>Como funciona a vistoria, passo a passo?</h2>
      <p class="answer">Na FH Vistorias, a vistoria tem <strong>4 etapas</strong>: <strong>chegada</strong> com o veículo e os documentos, <strong>atendimento</strong> e conferência dos dados, <strong>vistoria</strong> feita pelo técnico conforme as exigências do DETRAN-BA e <strong>emissão do laudo</strong> na hora, com validade imediata para o órgão de trânsito.</p>
    </div>
    ${stepsHtml()}
  </div>
</section>
<section class="sec sec-mist">
  <div class="wrap two even">
    <div class="prose">
      <h2>Antes de vir: checklist rápido</h2>
      <ul class="check">
        <li>Documento do veículo e documento oficial com foto;</li>
        <li>Luzes funcionando (farol, lanterna, setas, freio);</li>
        <li>Placas legíveis e bem fixadas;</li>
        <li>Se houve troca de motor, cor ou característica, a documentação da alteração;</li>
        <li>Vir de segunda a sexta, das 7h30 às 12h10 ou das 14h às 17h30.</li>
      </ul>
      <p><a href="/documentos-necessarios">Ver documentos por situação</a>.</p>
    </div>
    <div class="prose">
      <h2>E depois do laudo?</h2>
      <p class="answer">Com o laudo emitido, você segue com o processo no DETRAN-BA, como a transferência do veículo para o nome do novo dono. O laudo tem validade imediata para o órgão de trânsito.</p>
      <p>Se o veículo for reprovado, você tem até ${RETURN_POLICY.days} dias úteis para regularizar e voltar sem custo adicional. <a href="/vistoria-reprovada-o-que-fazer">Saiba mais</a>.</p>
    </div>
  </div>
  <div class="wrap">${updated()}</div>
</section>`,
    faqs: [FAQ.comoFunciona, FAQ.agendar, FAQ.tempo, FAQ.laudo],
    faqTitle: 'Dúvidas sobre o processo',
  },

  // ---------------------------------------------------------------- DOCUMENTOS
  {
    slug: 'documentos-necessarios',
    title: 'Documentos para Vistoria Veicular em LEM | FH',
    description: 'Quais documentos levar para a vistoria em Luís Eduardo Magalhães: transferência, placa Mercosul, segunda via, troca de motor e mais.',
    h1: 'Documentos necessários para a vistoria',
    trail: [HOME, ['documentos-necessarios', 'Documentos necessários']],
    lead: 'O que separar antes de vir, por situação. Na dúvida, confirme pelo WhatsApp para não perder a viagem.',
    heroSide: 'facts',
    body: `
<section class="sec">
  <div class="wrap two">
    <div class="prose">
      <h2>Quais documentos levar para a vistoria?</h2>
      <p class="answer">Em geral, traga: <strong>o próprio veículo</strong> (a vistoria é presencial), o <strong>documento do veículo</strong> (CRLV e/ou o documento de transferência, conforme o caso) e um <strong>documento oficial de identificação com foto</strong> de quem está levando o veículo.</p>
      <ul class="check">
        <li>O veículo a ser vistoriado;</li>
        <li>Documento do veículo (CRLV e/ou documento de transferência);</li>
        <li>Documento oficial com foto (RG, CNH ou equivalente);</li>
        <li>Documentos da situação específica (veja a tabela abaixo).</li>
      </ul>
      <div class="note"><strong>Importante:</strong> as exigências são definidas pelo DETRAN-BA e podem mudar. Antes de vir, confirme a lista do seu caso pelo WhatsApp ${BIZ.phoneDisplay} ou no site do <a href="${DETRAN_URL}" target="_blank" rel="noopener">DETRAN-BA</a>.</div>
    </div>
    <aside class="card">
      <h3>Confirme o seu caso</h3>
      <p>Diga o que você vai fazer no DETRAN e a equipe responde o que levar.</p>
      <div class="btns" style="margin-top:12px">${btnWa('Perguntar no WhatsApp', 'Olá! Quais documentos preciso levar para a vistoria? Meu caso é: ', 'btn btn-wa btn-sm', 'documentos_card')}</div>
    </aside>
  </div>
</section>
<section class="sec sec-mist">
  <div class="wrap">
    <div class="sec-head prose">
      <h2>Documentos por situação</h2>
      <p>Situações em que a FH Vistorias orienta a fazer vistoria, segundo publicação da própria empresa. Cada caso segue regras do DETRAN-BA, então confirme o seu antes de vir.</p>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th scope="col">Situação</th><th scope="col">O que separar, além do básico</th></tr></thead>
        <tbody>
          <tr><th scope="row">Comprei um veículo (colocar no meu nome)</th><td>Documento de transferência do veículo, preenchido conforme a venda. <a href="/vistoria-de-transferencia">Ver vistoria de transferência</a>.</td></tr>
          <tr><th scope="row">Perdi o documento do veículo (2ª via)</th><td>Em caso de furto ou roubo, o boletim de ocorrência costuma ser pedido. Confirme pelo WhatsApp.</td></tr>
          <tr><th scope="row">Nova placa Mercosul</th><td>Documento do veículo e as placas atuais. Confirme se o seu caso exige vistoria.</td></tr>
          <tr><th scope="row">Placa perdida ou danificada</th><td>Documento do veículo; em caso de furto, o boletim de ocorrência costuma ser pedido.</td></tr>
          <tr><th scope="row">Motor novo (troca de motor)</th><td>Documento de origem do motor, como a nota fiscal. Confirme pelo WhatsApp.</td></tr>
          <tr><th scope="row">Mudança de característica</th><td>Documentação da alteração e autorização do DETRAN-BA, quando exigida. Confirme antes de vir.</td></tr>
        </tbody>
      </table>
    </div>
    ${updated()}
  </div>
</section>`,
    faqs: [FAQ.documentos, FAQ.situacoes, FAQ.compraVenda],
    faqTitle: 'Dúvidas sobre documentos',
  },

  // ---------------------------------------------------------------- FAQ
  {
    slug: 'perguntas-frequentes',
    title: 'Dúvidas sobre Vistoria Veicular | FH Vistorias LEM',
    description: 'Documentos, prazo, preço, reprovação e agendamento. Respostas diretas da FH Vistorias, empresa credenciada em LEM-BA.',
    h1: 'Perguntas frequentes sobre vistoria veicular',
    trail: [HOME, ['perguntas-frequentes', 'Perguntas frequentes']],
    lead: 'Tudo o que os clientes mais perguntam sobre vistoria em Luís Eduardo Magalhães, respondido de forma direta.',
    heroSide: 'facts',
    priority: '0.8',
    body: '',
    faqs: [FAQ.onde, FAQ.quanto, FAQ.agendar, FAQ.comoFunciona, FAQ.documentos, FAQ.reprovado, FAQ.motoCaminhao, FAQ.tempo, FAQ.laudo, FAQ.compraVenda, FAQ.situacoes, FAQ.cautelar, FAQ.pagamento, FAQ.regiao, FAQ.horario, FAQ.credenciada],
    faqTitle: 'Todas as perguntas',
    faqOpenAll: true,
  },

  // ---------------------------------------------------------------- SOBRE
  {
    slug: 'sobre',
    title: 'Sobre a FH Vistorias | Credenciada DETRAN-BA em LEM',
    description: 'Conheça a FH Vistorias: empresa de vistoria veicular credenciada pelo DETRAN-BA em Luís Eduardo Magalhães. Segurança, agilidade e confiança.',
    h1: 'Sobre a FH Vistorias',
    trail: [HOME, ['sobre', 'Sobre']],
    pageType: 'AboutPage',
    lead: `Empresa de vistoria veicular credenciada pelo DETRAN-BA em ${BIZ.city}. Segurança para você, tranquilidade para todos.`,
    heroSide: 'facts',
    body: `
<section class="sec">
  <div class="wrap two">
    <div class="prose">
      <h2>Quem somos</h2>
      <p class="answer">A <strong>FH Vistorias</strong> é uma empresa <strong>credenciada pelo DETRAN-BA</strong> para vistoria de veículos em ${BIZ.city}, no Oeste da Bahia. Atende carros, motos, caminhões e reboques, com foco em vistoria de transferência de propriedade e laudo emitido na hora.</p>
      <p>Nosso trabalho é dar segurança para quem compra e para quem vende: a vistoria confirma que o veículo é ele mesmo antes de ele mudar de dono. Quem faz vistoria com a FH compra e vende com mais segurança.</p>
      <p>Funcionamos sem agendamento, com preço informado antes de começar e com uma política simples para quem é reprovado: até ${RETURN_POLICY.days} dias úteis para regularizar e voltar sem custo adicional.</p>

      <h2>Credenciamento</h2>
      <p>A FH Vistorias é credenciada pelo Departamento Estadual de Trânsito da Bahia (DETRAN-BA)${BIZ.detranCredential ? `, credenciamento nº <strong>${BIZ.detranCredential}</strong>` : ''}. O laudo emitido na unidade tem validade imediata para o órgão de trânsito.</p>
      ${BIZ.cnpj ? `<p>${BIZ.legalName ? `${BIZ.legalName} · ` : ''}CNPJ ${BIZ.cnpj}</p>` : ''}

      <h2>Nossos pilares</h2>
      <ul class="check">
        <li><strong>Segurança:</strong> vistoria feita conforme as exigências do DETRAN-BA.</li>
        <li><strong>Agilidade:</strong> sem agendamento e com laudo na hora.</li>
        <li><strong>Confiança:</strong> atendimento claro do começo ao fim.</li>
        <li><strong>Transparência:</strong> preço informado antes, sem surpresa.</li>
      </ul>
      ${updated()}
    </div>
    <aside class="card">
      <h3>Onde estamos</h3>
      ${napBlock()}
      <div class="btns" style="margin-top:16px">${btnRoute('Como chegar', 'btn btn-dark btn-sm', 'sobre')}</div>
    </aside>
  </div>
</section>
<section class="sec sec-mist">
  <div class="wrap">
    <div class="sec-head"><h2>Por que escolher a FH</h2></div>
    ${perksHtml()}
  </div>
</section>
<section class="sec">
  <div class="wrap">
    <div class="sec-head"><h2>Acompanhe a FH no Instagram</h2><p>Avisos, horários e orientações em <a href="${BIZ.instagram}" target="_blank" rel="noopener">@${BIZ.instagramHandle}</a>.</p></div>
    <div class="posts">
      <figure><img src="/images/horario-de-funcionamento-fh-vistorias-lem.webp" width="488" height="660" loading="lazy" decoding="async" alt="Arte da FH Vistorias com o horário de funcionamento: segunda a sexta, 7h30 às 12h10 e 14h às 17h30, na Rua São Francisco, 1516, Centro, LEM-BA"><figcaption>Horário de funcionamento</figcaption></figure>
      <figure><img src="/images/transferencia-veicular-fh-vistorias-lem.webp" width="490" height="660" loading="lazy" decoding="async" alt="Arte da FH Vistorias sobre transferência veicular: atendimento especializado, processo rápido e seguro e suporte completo até o DETRAN"><figcaption>Transferência veicular</figcaption></figure>
    </div>
  </div>
</section>`,
    faqs: [FAQ.credenciada, FAQ.onde],
    faqTitle: 'Perguntas sobre a FH',
  },

  // ---------------------------------------------------------------- CONTATO
  {
    slug: 'contato',
    title: 'Contato e Endereço | FH Vistorias em LEM-BA',
    description: `FH Vistorias: ${BIZ.street}, Centro, Luís Eduardo Magalhães-BA. WhatsApp ${BIZ.phoneDisplay}. Seg a sex, 7h30–12h10 e 14h–17h30.`,
    h1: 'Contato e localização',
    trail: [HOME, ['contato', 'Contato']],
    pageType: 'ContactPage',
    lead: `Estamos na ${BIZ.street}, ${BIZ.district}, em ${BIZ.city}. Fale com a gente pelo WhatsApp ou venha direto. Não precisa agendar.`,
    heroSide: 'facts',
    priority: '0.8',
    body: `
<section class="sec">
  <div class="wrap two even">
    <div>
      <h2>Fale com a FH Vistorias</h2>
      ${napBlock()}
      <div class="btns" style="margin-top:20px">
        ${btnWa('Chamar no WhatsApp', undefined, 'btn btn-wa', 'contato')}
        ${btnPhone(`Ligar ${BIZ.phoneDisplay}`, 'btn btn-line', 'contato')}
        ${btnRoute('Abrir rota', 'btn btn-dark', 'contato')}
      </div>
      <h3 style="margin-top:32px">Horário de funcionamento</h3>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Dia</th><th scope="col">Manhã</th><th scope="col">Tarde</th></tr></thead>
          <tbody>
            ${['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'].map((d) => `<tr><th scope="row">${d}</th><td class="nw">07h30–12h10</td><td class="nw">14h00–17h30</td></tr>`).join('\n            ')}
            <tr><th scope="row">Sábado, domingo e feriados</th><td colspan="2">Consulte pelo WhatsApp</td></tr>
          </tbody>
        </table>
      </div>
      ${BIZ.googleReviewLink ? `<p style="margin-top:20px"><a class="btn btn-line btn-sm" href="${BIZ.googleReviewLink}" target="_blank" rel="noopener">${icon('star')} Avaliar no Google</a></p>` : ''}
      <p style="margin-top:20px"><a href="${BIZ.instagram}" target="_blank" rel="noopener">${'Instagram @' + BIZ.instagramHandle}</a></p>
    </div>
    <div>
      <div class="map-facade" data-map="${esc(mapsEmbed)}">
        <div>
          ${icon('pin')}
          <h3 style="color:#fff;margin:8px 0 0">${BIZ.street}</h3>
          <p>${BIZ.district} · ${BIZ.city}-${BIZ.state} · ${BIZ.postalCode}</p>
          <div class="btns" style="justify-content:center">
            <button type="button" class="btn btn-wa btn-sm" data-map-load>Carregar mapa</button>
            ${btnRoute('Abrir no Google Maps', 'btn btn-ghost btn-sm', 'contato_mapa')}
          </div>
        </div>
      </div>
      <p style="font-size:.9rem;color:var(--muted);margin-top:8px">O mapa do Google só é carregado quando você clica, para o site abrir mais rápido.</p>
    </div>
  </div>
</section>`,
    faqs: [FAQ.horario, FAQ.agendar, FAQ.regiao],
    faqTitle: 'Dúvidas rápidas',
  },

  // ---------------------------------------------------------------- PRIVACIDADE
  {
    slug: 'politica-de-privacidade',
    title: 'Política de Privacidade | FH Vistorias',
    description: 'Como a FH Vistorias trata dados pessoais no site e no atendimento, conforme a LGPD (Lei nº 13.709/2018).',
    h1: 'Política de privacidade',
    trail: [HOME, ['politica-de-privacidade', 'Política de privacidade']],
    heroSide: 'none',
    cta: false,
    priority: '0.2',
    changefreq: 'yearly',
    body: `
<section class="sec">
  <div class="wrap prose">
    <p>Esta política explica como a ${BIZ.legalName || BIZ.name}${BIZ.cnpj ? ` (CNPJ ${BIZ.cnpj})` : ''}, com endereço na ${BIZ.street}, ${BIZ.district}, ${BIZ.city}-${BIZ.state}, trata dados pessoais neste site, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).</p>
    <h2>Quais dados coletamos no site</h2>
    <p>Este site não tem formulários nem área de login. Não coletamos nome, CPF ou outros dados pessoais diretamente pelo site.</p>
    <ul>
      <li><strong>Contato pelo WhatsApp ou telefone:</strong> ao clicar nos botões, você é levado ao WhatsApp ou ao discador do seu aparelho. As informações que você enviar por lá são usadas apenas para responder ao seu atendimento.</li>
      <li><strong>Cookies de medição (opcionais):</strong> com a sua permissão no aviso de cookies, usamos o Google Analytics para medir visitas e cliques de forma estatística (por exemplo, quantas pessoas clicaram no WhatsApp). Sem a sua permissão, esses cookies não são carregados.</li>
      <li><strong>Mapa:</strong> o mapa do Google só é carregado se você clicar em "Carregar mapa"; a partir daí, valem as políticas do Google.</li>
    </ul>
    <h2>Dados no atendimento presencial</h2>
    <p>Para realizar a vistoria, tratamos os dados do veículo e de quem o apresenta, conforme exigido pelo DETRAN-BA, com base no cumprimento de obrigação legal e regulatória.</p>
    <h2>Seus direitos</h2>
    <p>Você pode pedir confirmação, acesso, correção ou exclusão dos seus dados, nos limites da lei, pelo WhatsApp ${BIZ.phoneDisplay}${BIZ.email ? ` ou pelo e-mail ${BIZ.email}` : ''}.</p>
    <h2>Gerenciar cookies</h2>
    <p>Você pode mudar a sua escolha a qualquer momento: <button type="button" data-cookie-open class="btn btn-line btn-sm">Rever preferências de cookies</button></p>
    ${updated()}
  </div>
</section>`,
  },
];
