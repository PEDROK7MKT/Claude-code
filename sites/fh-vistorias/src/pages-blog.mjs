// Blog: conteúdo informativo de cauda longa (seção 12 do briefing).
// Para publicar um post novo, copie um objeto abaixo, troque slug/datas/conteúdo
// e rode `node build.mjs` — índice, sitemap e llms.txt são atualizados sozinhos.
import { BIZ, PRICE, RETURN_POLICY } from './data.mjs';
import { icon, btnWa, returnCard } from './ui.mjs';
import { FAQ, DETRAN_URL, STEPS } from './content-shared.mjs';

const HOME = ['', 'Início'];
const BLOG = ['blog', 'Blog'];

export const posts = [
  {
    slug: 'blog/comprei-veiculo-usado-o-que-fazer',
    title: 'Comprei um Veículo Usado em LEM: O Que Fazer Agora',
    description: 'Comprou carro, moto ou caminhão usado em Luís Eduardo Magalhães? Veja o passo a passo até colocar o veículo no seu nome, com vistoria.',
    h1: 'Comprei um veículo usado em LEM. E agora?',
    trail: [HOME, BLOG, ['blog/comprei-veiculo-usado-o-que-fazer', 'Comprei um veículo usado']],
    article: true,
    published: '2026-10-12',
    excerpt: 'Do aperto de mão ao documento no seu nome: o que conferir antes de pagar, quando fazer a vistoria e quais cuidados evitam dor de cabeça.',
    heroSide: 'none',
    body: `
<section class="sec">
  <div class="wrap prose">
    <p class="answer">Depois de comprar um veículo usado, o caminho é: <strong>conferir os documentos</strong>, fazer a <strong>vistoria de transferência</strong> em uma empresa credenciada pelo DETRAN-BA e <strong>concluir a transferência</strong> no órgão. O Código de Trânsito Brasileiro dá ao comprador 30 dias para providenciar a transferência — passar do prazo pode gerar multa.</p>
    <nav class="toc" aria-label="Neste artigo"><b>Neste artigo</b>
      <ol><li><a href="#antes">Antes de pagar: o que conferir</a></li><li><a href="#vistoria">A vistoria de transferência</a></li><li><a href="#depois">Depois do laudo</a></li><li><a href="#erros">Erros que atrasam a transferência</a></li></ol>
    </nav>

    <h2 id="antes">Antes de pagar: o que conferir</h2>
    <p class="answer">Antes de fechar negócio, confira se o vendedor é o dono que aparece no documento, se o veículo tem débitos (IPVA, licenciamento, multas) e se as numerações de chassi e motor batem com o documento.</p>
    <ul class="check">
      <li><strong>Documento do veículo:</strong> nome do proprietário, placa, chassi e características batendo com o veículo.</li>
      <li><strong>Débitos:</strong> consulte IPVA, licenciamento e multas nos canais oficiais do DETRAN-BA e da SEFAZ-BA.</li>
      <li><strong>Restrições:</strong> verifique se há financiamento ativo, bloqueio ou outra restrição.</li>
      <li><strong>Estado do veículo:</strong> luzes, placas e itens de segurança — eles também serão conferidos na vistoria.</li>
    </ul>
    <p>Comprou de revenda ou de particular, o cuidado é o mesmo: documento em ordem é o que garante que a transferência vai andar.</p>

    <h2 id="vistoria">A vistoria de transferência</h2>
    <p class="answer">A vistoria de transferência é a conferência técnica exigida pelo DETRAN-BA para mudar o veículo de dono. Em ${BIZ.city}, a FH Vistorias faz a vistoria sem agendamento, por ${PRICE.display}, com laudo emitido na hora.</p>
    <ol>
      ${STEPS.map((s) => `<li><strong>${s.name}:</strong> ${s.text}</li>`).join('\n      ')}
    </ol>
    <p>Se algo precisar de ajuste, você tem até ${RETURN_POLICY.days} dias úteis para regularizar e voltar sem custo adicional. Por isso, quanto antes fizer a vistoria, mais folga sobra no prazo da transferência. <a href="/vistoria-de-transferencia">Veja o guia completo da vistoria de transferência</a>.</p>

    <h2 id="depois">Depois do laudo</h2>
    <p class="answer">Com o laudo aprovado, você segue com a transferência no DETRAN-BA: entrega da documentação, pagamento das taxas do órgão e emissão do novo documento no seu nome.</p>
    <p>As taxas da transferência são do DETRAN e são pagas ao órgão, à parte da vistoria. Para valores e regras atualizadas, consulte o site do <a href="${DETRAN_URL}" target="_blank" rel="noopener">DETRAN-BA</a>.</p>
    <p>Do lado de quem vendeu, vale lembrar: o vendedor também deve comunicar a venda ao DETRAN. Isso o protege de multas e débitos gerados depois da venda.</p>

    <h2 id="erros">Erros que atrasam a transferência</h2>
    <ul>
      <li><strong>Deixar a vistoria para o último dia</strong> — se houver reprovação, falta tempo para regularizar.</li>
      <li><strong>Vir sem o documento certo</strong> — confirme a lista em <a href="/documentos-necessarios">documentos necessários</a>.</li>
      <li><strong>Lâmpada queimada ou placa danificada</strong> — são correções simples que evitam a reprovação.</li>
      <li><strong>Alteração sem documento</strong> — troca de motor ou de característica precisa estar regularizada.</li>
    </ul>
    ${returnCard()}
    <div class="btns" style="margin-top:20px">${btnWa('Tirar dúvida no WhatsApp', 'Olá! Comprei um veículo e quero fazer a vistoria de transferência. Pode me orientar?', 'btn btn-wa', 'blog_compra')}</div>
  </div>
</section>`,
    faqs: [FAQ.compraVenda, FAQ.documentos, FAQ.quanto],
    faqTitle: 'Perguntas frequentes',
  },
  {
    slug: 'blog/vistoria-de-transferencia-ou-cautelar',
    title: 'Vistoria de Transferência ou Cautelar? Diferenças',
    description: 'Vistoria de transferência é exigida pelo DETRAN; a cautelar é opcional, antes da compra. Entenda a diferença e quando fazer cada uma.',
    h1: 'Vistoria de transferência x vistoria cautelar: qual a diferença?',
    trail: [HOME, BLOG, ['blog/vistoria-de-transferencia-ou-cautelar', 'Transferência x cautelar']],
    article: true,
    published: '2026-10-12',
    excerpt: 'Uma é exigida pelo DETRAN para mudar o veículo de dono; a outra é uma avaliação opcional antes de comprar. Veja quando fazer cada uma.',
    heroSide: 'none',
    body: `
<section class="sec">
  <div class="wrap prose">
    <p class="answer">A <strong>vistoria de transferência</strong> é <strong>obrigatória</strong>: o DETRAN exige para registrar o veículo no nome do novo dono. A <strong>vistoria cautelar</strong> é <strong>opcional</strong>: uma avaliação feita antes da compra para checar histórico e estrutura do veículo. Uma não substitui a outra.</p>

    <h2>O que é a vistoria de transferência?</h2>
    <p class="answer">É a conferência técnica feita por empresa credenciada pelo DETRAN para confirmar a identidade do veículo — chassi, motor, placas e características — e as condições exigidas pelo órgão. O resultado é o laudo usado no processo de transferência.</p>
    <p>Em ${BIZ.city}, a <a href="/vistoria-de-transferencia">vistoria de transferência na FH Vistorias</a> custa ${PRICE.display}, não precisa de agendamento e o laudo sai na hora.</p>

    <h2>O que é a vistoria cautelar?</h2>
    <p class="answer">É uma avaliação voluntária, contratada por quem vai comprar, para investigar o histórico e a estrutura do veículo — por exemplo, sinais de batida, repintura ou registros de leilão. Ela ajuda a decidir a compra, mas não substitui a vistoria exigida pelo DETRAN.</p>

    <h2>Comparando lado a lado</h2>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th scope="col"></th><th scope="col">Transferência</th><th scope="col">Cautelar</th></tr></thead>
        <tbody>
          <tr><th scope="row">É obrigatória?</th><td>Sim, para transferir</td><td>Não, é opcional</td></tr>
          <tr><th scope="row">Quando fazer</th><td>Depois da compra, para mudar o dono</td><td>Antes de fechar a compra</td></tr>
          <tr><th scope="row">Objetivo</th><td>Confirmar identidade e condições exigidas pelo DETRAN</td><td>Avaliar histórico e estrutura para a decisão de compra</td></tr>
          <tr><th scope="row">Resultado</th><td>Laudo para o processo no DETRAN</td><td>Relatório para o comprador</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Qual eu preciso fazer?</h2>
    <p class="answer">Se você <strong>já comprou</strong> e vai colocar o veículo no seu nome, precisa da <strong>vistoria de transferência</strong>. Se <strong>ainda está decidindo</strong> a compra e quer mais segurança sobre o histórico do veículo, a cautelar é uma opção a considerar.</p>
    <p>O foco da FH Vistorias é a vistoria exigida pelo DETRAN-BA. Se tiver dúvida sobre qual o seu caso, chame a equipe no WhatsApp.</p>
    <div class="btns" style="margin-top:20px">${btnWa('Perguntar qual vistoria eu preciso', 'Olá! Quero saber qual vistoria preciso fazer. Meu caso é: ', 'btn btn-wa', 'blog_cautelar')}</div>
  </div>
</section>`,
    faqs: [FAQ.cautelar, FAQ.compraVenda, FAQ.onde],
    faqTitle: 'Perguntas frequentes',
  },
];

export const blogIndex = {
  slug: 'blog',
  title: 'Blog da FH Vistorias | Vistoria Veicular em LEM-BA',
  description: 'Guias práticos sobre vistoria veicular, transferência de veículo e documentos em Luís Eduardo Magalhães, pela FH Vistorias.',
  h1: 'Blog da FH Vistorias',
  trail: [HOME, BLOG],
  pageType: 'CollectionPage',
  eyebrow: `${icon('doc')} Guias práticos`,
  lead: 'Orientações diretas sobre vistoria, transferência e documentos — para resolver a sua situação no DETRAN sem dor de cabeça.',
  heroSide: 'none',
  priority: '0.6',
  get body() {
    return `
<section class="sec">
  <div class="wrap">
    <div class="grid grid-2">
      ${posts
        .map(
          (p) => `<a class="card" href="/${p.slug}"><p style="font-size:.85rem;margin:0 0 6px">${new Date(p.published + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p><h2 style="font-size:1.6rem">${p.h1}</h2><p>${p.excerpt}</p><span class="more">Ler artigo ${icon('arrow')}</span></a>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
  },
};
