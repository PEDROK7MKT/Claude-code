// Guia: quantas latas de tinta preciso
// ATENÇÃO: todos os números deste guia saem das MESMAS constantes da calculadora
// (assets/js/site.js → bestPack): parede = perímetro × pé-direito − portas (1,68 m²)
// − janelas (1,20 m²); teto = largura × comprimento; litros = área × demãos ÷
// rendimento (11 m²/L liso; 8 m²/L reboco) × 1,1; embalagens 18 L / 3,6 L / 0,9 L
// com custo relativo lata = 3,9 galões e quarto = 0,32 galão.
// Se mudar a calculadora, refaça as tabelas abaixo.
export default {
  slug: 'quantas-latas-de-tinta-preciso',
  category: 'tintas-e-pintura',
  title: 'Quantas latas de tinta eu preciso? Cálculo passo a passo',
  navTitle: 'Quantas latas de tinta preciso?',
  seo: {
    title: 'Quantas Latas de Tinta Preciso? Cálculo | Pereira Luz & Cor',
    description: 'Aprenda a calcular quantas latas de tinta comprar: área, demãos, portas e janelas, com tabela por cômodo. Calcule e peça orçamento no WhatsApp em Barreiras.',
  },
  kicker: 'Guia rápido · Tintas',
  readingMinutes: 7,
  summary: 'Para saber quantas latas de tinta comprar, calcule a área das paredes (perímetro × pé-direito), desconte portas e janelas, multiplique pelo número de demãos e divida pelo rendimento por litro, somando 10% de folga. Um quarto de 3 × 4 m, com 2,60 m de pé-direito e duas demãos em parede lisa, pede cerca de 6,7 litros: <strong>dois galões de 3,6 L</strong>.',
  keyTakeaways: [
    'Litros = área × demãos ÷ rendimento × 1,1 (10% de folga).',
    'Desconte 1,68 m² por porta e 1,20 m² por janela padrão.',
    'Quarto de 3 × 4 m: 6,7 L só nas paredes (2 galões); com o teto, 9,1 L.',
    'De cor escura para clara, conte 3 demãos em vez de 2.',
    'Passou de 12,6 L, a lata de 18 L costuma compensar mais que galões.',
  ],
  sections: [
    {
      h2: 'Como calcular quanta tinta comprar, passo a passo',
      html: `<p>Para calcular a tinta, some as paredes do cômodo (perímetro × pé-direito), tire portas e janelas, acrescente o teto se for pintar, multiplique pelo número de demãos, divida pelo rendimento por litro e some 10% de folga. É exatamente a conta que a <a href="/calculadora-de-tinta/">calculadora de tinta</a> do site faz.</p>
<ol>
<li><strong>Perímetro</strong>: (largura + comprimento) × 2.</li>
<li><strong>Área das paredes</strong>: perímetro × pé-direito, que é a altura do piso até o teto.</li>
<li><strong>Descontos</strong>: 1,68 m² por porta (0,80 × 2,10 m) e 1,20 m² por janela (1,20 × 1,00 m). Abertura bem maior, como porta de garagem? Meça e desconte o tamanho real.</li>
<li><strong>Teto (opcional)</strong>: largura × comprimento.</li>
<li><strong>Litros</strong>: área × demãos ÷ rendimento (na calculadora, 11 m²/L por demão em parede lisa ou com massa corrida e 8 m²/L em reboco, parede áspera ou textura).</li>
<li><strong>Folga</strong>: multiplique por 1,1 (mais 10%) para perdas no rolo e na bandeja, retoques e absorção.</li>
</ol>
<p>Cômodo em L ou irregular? Some o comprimento de cada parede para achar o perímetro.</p>`,
    },
    {
      h2: 'Exemplo completo: quarto de 3 × 4 m, com e sem teto',
      html: `<p>Um quarto de 3 × 4 m, com pé-direito de 2,60 m, uma porta e uma janela, tem 33,52 m² de parede. Com duas demãos em parede lisa, ele precisa de cerca de 6,7 litros de tinta, ou seja, dois galões de 3,6 L. Pintando o teto junto, a área vai para 45,52 m² e a conta sobe para uns 9,1 litros.</p>
<table>
<thead><tr><th>Etapa</th><th>Conta</th><th>Resultado</th></tr></thead>
<tbody>
<tr><td>Perímetro</td><td>(3 + 4) × 2</td><td>14 m</td></tr>
<tr><td>Paredes (bruto)</td><td>14 × 2,60</td><td>36,40 m²</td></tr>
<tr><td>Descontos</td><td>1,68 (porta) + 1,20 (janela)</td><td>− 2,88 m²</td></tr>
<tr><td>Área de parede</td><td>36,40 − 2,88</td><td>33,52 m²</td></tr>
<tr><td>Tinta, 2 demãos, parede lisa</td><td>33,52 × 2 ÷ 11</td><td>6,09 L</td></tr>
<tr><td>Com 10% de folga</td><td>6,09 × 1,1</td><td><strong>≈ 6,7 L</strong></td></tr>
</tbody>
</table>
<p><strong>Sem o teto:</strong> 6,7 litros cabem em <strong>2 galões de 3,6 L</strong> (7,2 L), com meio litro de sobra para retoque.</p>
<p><strong>Com o teto:</strong> some 3 × 4 = 12 m² e a área vai a 45,52 m². São 45,52 × 2 ÷ 11 = 8,28 L e, com a folga, <strong>≈ 9,1 L</strong>. A calculadora sugere <strong>2 galões + 3 quartos de 0,9 L</strong> (9,9 L); <strong>3 galões</strong> (10,8 L) é a alternativa prática, com mais sobra e diferença mínima de custo na estimativa da calculadora. Nem toda linha e cor vem em quarto: confirme no orçamento.</p>
<p>Teto branco e parede colorida? Calcule separado: 6,7 L da cor para as paredes e 2,4 L de branco para o teto (12 × 2 ÷ 11 × 1,1), que a calculadora resolve com 3 quartos ou, com sobra, 1 galão.</p>`,
    },
    {
      h2: 'Tabela: quanta tinta para cada cômodo',
      html: `<p>Com pé-direito de 2,60 m, parede lisa e duas demãos, um banheiro pequeno pede cerca de 3,6 litros, um quarto de 3 × 4 m uns 6,7 litros e uma sala de 4 × 5 m perto de 8,4 litros, contando só as paredes. Os valores usam as constantes da calculadora, já com 10% de folga.</p>
<table>
<thead><tr><th>Cômodo</th><th>Parede</th><th>Só paredes</th><th>Paredes + teto</th></tr></thead>
<tbody>
<tr><td>Banheiro 1,5 × 2,5 m, 1 porta, 1 janela</td><td>17,92 m²</td><td>3,6 L: 1 galão</td><td>4,3 L: 1 galão + 1 quarto</td></tr>
<tr><td>Quarto 3 × 3 m, 1 porta, 1 janela</td><td>28,32 m²</td><td>5,7 L: 1 galão + 3 quartos</td><td>7,5 L: 2 galões + 1 quarto</td></tr>
<tr><td>Cozinha 3 × 3,5 m, 2 portas, 1 janela</td><td>29,24 m²</td><td>5,8 L: 1 galão + 3 quartos</td><td>7,9 L: 2 galões + 1 quarto</td></tr>
<tr><td>Quarto 3 × 4 m, 1 porta, 1 janela</td><td>33,52 m²</td><td>6,7 L: 2 galões</td><td>9,1 L: 2 galões + 3 quartos</td></tr>
<tr><td>Suíte 4 × 4 m, 2 portas, 1 janela</td><td>37,04 m²</td><td>7,4 L: 2 galões + 1 quarto</td><td>10,6 L: 3 galões</td></tr>
<tr><td>Sala 4 × 5 m, 2 portas, 1 janela</td><td>42,24 m²</td><td>8,4 L: 2 galões + 2 quartos</td><td>12,4 L: 3 galões + 2 quartos</td></tr>
</tbody>
</table>
<p>Em banheiro e cozinha com azulejo, meça só a área que vai receber tinta, use o modo “Já sei a área” e prefira tinta acrílica (veja <a href="/guias/tinta-acrilica-ou-latex-pva/">tinta acrílica ou látex PVA</a>).</p>`,
    },
    {
      h2: 'Demãos, superfície e cor: o que muda na conta',
      html: `<p>O número de demãos, o tipo de superfície e a troca de cor são o que mais mexe na quantidade de tinta. No mesmo quarto de 3 × 4 m, a conta vai de 6,7 litros (parede lisa, duas demãos) para 13,7 litros quando as paredes e o teto recebem três demãos.</p>
<table>
<thead><tr><th>Situação (quarto 3 × 4 m)</th><th>Conta</th><th>Litros</th><th>Sugestão</th></tr></thead>
<tbody>
<tr><td>Parede lisa, 2 demãos</td><td>33,52 × 2 ÷ 11 × 1,1</td><td>6,7 L</td><td>2 galões</td></tr>
<tr><td>Parede lisa, 3 demãos (escuro para claro)</td><td>33,52 × 3 ÷ 11 × 1,1</td><td>10,1 L</td><td>3 galões</td></tr>
<tr><td>Reboco ou textura, 2 demãos</td><td>33,52 × 2 ÷ 8 × 1,1</td><td>9,2 L</td><td>2 galões + 3 quartos</td></tr>
<tr><td>Paredes e teto lisos, 3 demãos</td><td>45,52 × 3 ÷ 11 × 1,1</td><td>13,7 L</td><td>1 lata de 18 L</td></tr>
</tbody>
</table>
<ul>
<li><strong>Demãos</strong>: duas é o padrão para manter a cor ou trocar por tom parecido; de escura para clara, conte três. Cores muito vivas, como vermelho e amarelo, podem pedir mais uma: siga a lata. A opção de 1 demão serve só para retoque.</li>
<li><strong>Superfície</strong>: parede lisa, com massa corrida ou já pintada em bom estado rende mais (11 m²/L na calculadora); reboco sem massa, parede áspera e textura “bebem” tinta (8 m²/L).</li>
<li><strong>Reboco novo</strong>: espere a cura (os fabricantes costumam pedir pelo menos 28 dias) e passe selador antes, para a parede não “sugar” a tinta.</li>
</ul>`,
    },
    {
      h2: 'Lata, galão ou quarto: qual combinação comprar',
      html: `<p>Compre pelo total de litros: até uns 12 litros, galões de 3,6 L com quartos de 0,9 L para completar evitam sobra; passou de 12,6 litros, a calculadora já indica a lata de 18 L, porque ela costuma sair mais em conta por litro do que juntar quatro galões.</p>
<ul>
<li><strong>Quarto (0,9 L)</strong>: retoque, porta, detalhe ou para completar a conta.</li>
<li><strong>Galão (3,6 L)</strong>: cômodo pequeno ou médio. Para 4 L, 1 galão + 1 quarto; para 6,7 L, 2 galões.</li>
<li><strong>Lata (18 L)</strong>: casa inteira, sala grande com teto, muro e fachada. A calculadora considera que uma lata custa mais ou menos o mesmo que 3,9 galões.</li>
</ul>
<p>Se vários cômodos vão levar a mesma cor, some as áreas e calcule tudo junto. Uma casa com banheiro, dois quartos (3 × 3 m e 3 × 4 m), cozinha e sala da tabela soma 151,24 m² de parede e pede 30,2 litros: a calculadora indica <strong>1 lata + 3 galões + 2 quartos</strong> (30,6 L). Calculando cômodo por cômodo, você levaria 7 galões e 8 quartos (32,4 L), com mais sobra e mais custo. No orçamento pelo WhatsApp, a gente confirma quais embalagens a linha e a cor escolhidas têm.</p>`,
    },
    {
      h2: 'Por que a conta da calculadora é conservadora',
      html: `<p>A calculadora usa rendimentos baixos de propósito, 11 m² por litro em parede lisa e 8 m² por litro em reboco, para você não ficar sem tinta no meio da parede. O rendimento real muda com a marca, a linha e a superfície e vem impresso na lata; linhas premium costumam render mais, e aí a compra pode ficar menor.</p>
<p>Na embalagem, o rendimento costuma vir em m² por demão para a lata inteira, muitas vezes com “até”, que vale para parede lisa, selada e com a diluição indicada. Divida pelos litros para comparar: 198 m² ÷ 18 L = 11 m²/L. Se a tinta rende mais, refaça a conta com o número da lata: com uma linha hipotética de 15 m²/L, o quarto de 3 × 4 m fica em 33,52 × 2 ÷ 15 × 1,1 = 4,9 L (1 galão + 2 quartos).</p>
<p>A conta não inclui selador, fundo preparador, massa corrida, textura nem esmalte de porta e janela, que têm rendimento próprio na embalagem. Na dúvida sobre o preparo, siga a ficha técnica do fabricante ou um pintor de confiança. O passo a passo está em <a href="/guias/como-pintar-parede-passo-a-passo/">como pintar parede</a> e <a href="/guias/massa-corrida-ou-massa-acrilica/">massa corrida ou massa acrílica</a>.</p>`,
    },
  ],
  howTo: null,
  widget: 'paint-calculator',
  faq: [
    {
      q: 'Uma lata de 18 litros pinta quantos metros quadrados de parede?',
      a: '<p>Na conta conservadora da calculadora, uma lata de 18 L pinta cerca de <strong>90 m² de parede lisa com duas demãos</strong>, já com a folga de 10%, ou uns <strong>65 m² em reboco</strong> ou textura. Um galão de 3,6 L cobre perto de 18 m² de parede lisa, ou cerca de 13 m² em reboco, nas mesmas condições. Linhas que rendem mais pintam área maior: confira o número impresso na embalagem.</p>',
    },
    {
      q: 'Como calcular tinta para muro ou fachada?',
      a: '<p>Multiplique o comprimento pela altura de cada face do muro e use o modo “Já sei a área” da <a href="/calculadora-de-tinta/">calculadora</a>, com a opção reboco ou textura. Um muro de 20 × 2 m pintado de um lado só tem 40 m²: com duas demãos, são uns <strong>11 litros</strong> (3 galões + 1 quarto); pintando os dois lados, 22 litros. Use tinta acrílica para área externa e, aqui no Oeste Baiano, programe a pintura antes das chuvas, que costumam começar por volta de novembro.</p>',
    },
    {
      q: 'A cor pode ficar diferente se eu comprar a tinta em dias diferentes?',
      a: '<p>Pode. Cor preparada sob medida e lotes diferentes podem ter pequena variação de tom, que aparece quando você emenda na mesma parede. Por isso, compre de uma vez a quantidade calculada, já com a folga de 10%. Se precisar complementar, misture as latas num balde antes de aplicar ou termine a parede inteira com a mesma lata. Anote a linha, o nome e o código da cor para pedir igual depois.</p>',
    },
    {
      q: 'O que fazer com a tinta que sobrou?',
      a: '<p>Guarde para retoques: limpe a borda, feche bem a tampa e deixe a lata em local fresco, seco, sem sol e longe de crianças. Anote na tampa a cor e o cômodo onde ela foi usada. Confira a validade na embalagem e nunca jogue sobra de tinta no ralo, na pia ou na terra; para descartar, siga a orientação do fabricante e da prefeitura.</p>',
    },
    {
      q: 'Posso diluir mais a tinta para ela render mais?',
      a: '<p><strong>Não.</strong> Dilua só na proporção indicada na embalagem e com o diluente que ela pede, que é água no caso da tinta base água. Tinta diluída demais cobre menos, escorre e acaba pedindo mais uma demão, o que gasta mais tinta e mais tempo. O rendimento informado na lata já considera a diluição recomendada pelo fabricante.</p>',
    },
  ],
  cta: {
    title: 'Já sabe quantos litros vai levar?',
    text: 'Ponha na lista as latas e galões que a calculadora indicou, junte rolo, fita crepe e bandeja e mande pelo WhatsApp para receber o orçamento, ou passe na loja da Rua São Francisco, 55, no Jardim Ouro Branco.',
    items: [
      'Tinta acrílica fosca (galão 3,6 L)',
      'Tinta acrílica fosca (lata 18 L)',
      'Selador acrílico para reboco novo',
      'Rolo de lã 23 cm pelo baixo (parede lisa)',
      'Fita crepe (várias larguras)',
      'Bandeja para pintura',
    ],
  },
  relatedGuides: ['tinta-acrilica-ou-latex-pva', 'como-pintar-parede-passo-a-passo', 'massa-corrida-ou-massa-acrilica'],
  sources: [
    { name: 'ABNT NBR 15079 — requisitos mínimos de desempenho de tinta látex para edificações (linhas econômica, standard e premium)', url: '' },
    { name: 'ABNT NBR 13245 — execução de pinturas em edificações não industriais: preparação de superfície', url: '' },
    { name: 'Fichas técnicas e embalagens dos fabricantes de tinta (rendimento por demão, diluição, número de demãos e cura do reboco)', url: '' },
  ],
}
