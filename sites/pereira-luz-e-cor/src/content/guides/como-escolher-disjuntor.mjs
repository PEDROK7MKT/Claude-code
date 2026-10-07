export default {
  slug: 'como-escolher-disjuntor',
  category: 'materiais-eletricos',
  title: 'Como escolher disjuntor: amperagem, curva, DR e DPS',
  seo: {
    title: 'Como escolher disjuntor, DR e DPS | Pereira Luz & Cor',
    description: 'Disjuntor protege o fio: veja qual amperagem usar, curva B ou C, quando o DR é obrigatório e para que serve o DPS. Peça orçamento no WhatsApp em Barreiras.',
  },
  kicker: 'Guia rápido · Elétrica',
  readingMinutes: 8,
  summary: 'Para escolher o disjuntor, comece pelo fio: pela NBR 5410, a corrente nominal tem que ficar entre a corrente do circuito e o que o fio aguenta. Em casa, fio 1,5 mm² costuma levar 10 A, e o de 2,5 mm², 16 A ou 20 A. Curva B para cargas resistivas, C para motores e ar-condicionado; DR de 30 mA nas áreas molhadas e DPS contra surtos.',
  keyTakeaways: [
    'O disjuntor protege o fio, não o aparelho: a amperagem nunca pode passar do que o fio aguenta.',
    'Curva B para chuveiro, iluminação e tomadas comuns; curva C para ar-condicionado, bomba d\'água e motores.',
    'Uma fase e neutro: monopolar. Duas fases: bipolar. Equipamento trifásico: tripolar.',
    'Banheiro, cozinha, área de serviço, garagem e tomadas externas precisam de DR de 30 mA (NBR 5410).',
    'Disjuntor que cai toda hora é aviso de problema: trocar por um maior deixa o fio sem proteção. Chame um eletricista.',
  ],
  sections: [
    {
      h2: 'O disjuntor protege o fio, não o aparelho',
      html: `<p>O disjuntor certo é aquele que desarma antes de o fio esquentar demais: pela NBR 5410, a corrente nominal dele precisa ser <strong>maior ou igual à corrente que o circuito usa</strong> e <strong>menor ou igual à corrente que o fio aguenta</strong> do jeito que ele foi instalado. Por isso, a escolha começa pela bitola do fio, não pelo aparelho.</p><p>A tabela traz a capacidade de condução da norma para o caso mais comum em casa: fio de cobre com isolação de PVC, em conduíte embutido na parede (método B1), com dois condutores carregados e 30 °C de temperatura ambiente.</p><table><thead><tr><th>Fio (cobre)</th><th>Corrente máxima no fio</th><th>Disjuntor que costuma acompanhar</th></tr></thead><tbody><tr><td>1,5 mm²</td><td>17,5 A</td><td>10 A</td></tr><tr><td>2,5 mm²</td><td>24 A</td><td>16 A ou 20 A</td></tr><tr><td>4 mm²</td><td>32 A</td><td>25 A ou 32 A</td></tr><tr><td>6 mm²</td><td>41 A</td><td>32 A ou 40 A</td></tr><tr><td>10 mm²</td><td>57 A</td><td>50 A</td></tr></tbody></table><p>Esses valores caem com vários circuitos no mesmo conduíte, fio passando por forro ou telhado quente (comum em Barreiras entre setembro e outubro) ou três fases carregadas: a 40 °C, o fio com isolação de PVC conduz cerca de 13% a menos. Distâncias longas também podem pedir fio mais grosso por causa da queda de tensão. Essas contas são do eletricista.</p>`,
    },
    {
      h2: 'Valores comuns por circuito (só para orientar)',
      html: `<p>Numa casa comum, o mais frequente é iluminação com fio 1,5 mm² e disjuntor de 10 A e tomadas com fio 2,5 mm² e disjuntor de 16 A ou 20 A; chuveiro e ar-condicionado ficam em circuito próprio, com fio e disjuntor tirados do manual do aparelho. Use a tabela para conversar com o eletricista, não para dispensar o projeto.</p><table><thead><tr><th>Circuito</th><th>Fio mais usado</th><th>Disjuntor mais usado</th><th>Curva</th></tr></thead><tbody><tr><td>Iluminação</td><td>1,5 mm²</td><td>10 A</td><td>B</td></tr><tr><td>Tomadas de sala e quartos</td><td>2,5 mm²</td><td>16 A ou 20 A</td><td>B ou C</td></tr><tr><td>Tomadas de cozinha e área de serviço</td><td>2,5 mm²</td><td>16 A ou 20 A, com DR</td><td>C</td></tr><tr><td>Chuveiro 5.500 W em 127 V</td><td>10 mm²</td><td>50 A, com DR</td><td>B</td></tr><tr><td>Chuveiro 7.500 W em 220 V</td><td>6 mm²</td><td>40 A, com DR</td><td>B</td></tr><tr><td>Ar-condicionado split de 9.000 a 12.000 BTU/h em 220 V</td><td>2,5 mm²</td><td>o que o manual pedir (em geral de 10 A a 20 A)</td><td>C</td></tr></tbody></table><p>Os mínimos da norma são 1,5 mm² para iluminação e 2,5 mm² para tomadas, e todo ponto previsto para aparelho de mais de 10 A deve ter circuito independente. Para o chuveiro, veja <a href="/guias/qual-fio-usar-no-chuveiro-eletrico/">qual fio usar no chuveiro elétrico</a>.</p>`,
    },
    {
      h2: 'Curva B, C ou D: qual a diferença',
      html: `<p>A curva diz com que rapidez o disjuntor desarma num pico forte de corrente: a curva B desarma na hora com 3 a 5 vezes a corrente nominal, a C com 5 a 10 vezes e a D com 10 a 20 vezes. Contra sobrecarga, um disjuntor de 20 A curva B e um de 20 A curva C protegem o fio do mesmo jeito.</p><table><thead><tr><th>Curva</th><th>Desarme instantâneo</th><th>Uso mais comum</th></tr></thead><tbody><tr><td>B</td><td>3 a 5 vezes a corrente nominal</td><td>Chuveiro, iluminação, aquecedor, tomadas comuns e circuitos longos</td></tr><tr><td>C</td><td>5 a 10 vezes</td><td>Ar-condicionado, geladeira, bomba d'água, máquina de lavar e tomadas onde se ligam aparelhos com motor</td></tr><tr><td>D</td><td>10 a 20 vezes</td><td>Motores grandes, transformadores e máquinas de partida pesada (uso mais industrial)</td></tr></tbody></table><p>Aparelho com motor puxa um pico de corrente na partida e pode derrubar um disjuntor curva B sem defeito nenhum, como acontece em tomada de obra com betoneira, compressor ou maquita (apelido, vindo da marca Makita, que o povo dá à esmerilhadeira e à serra mármore). Por isso, muitos eletricistas usam curva C também nas tomadas.</p>`,
    },
    {
      h2: 'Monopolar, bipolar ou tripolar?',
      html: `<p>O número de polos acompanha o número de fases do circuito: monopolar para circuito com uma fase e neutro, bipolar para circuito com duas fases (o 220 V das redes 127/220 V) e tripolar para equipamento trifásico. Toda fase precisa passar pelo disjuntor, e o neutro nunca deve ser interrompido sozinho.</p><ul><li><strong>Monopolar:</strong> um polo, protege uma fase. É o mais usado em iluminação e tomadas ligadas entre fase e neutro.</li><li><strong>Bipolar:</strong> dois polos presos um ao outro, que desligam juntos. Vai em chuveiro e ar-condicionado de 220 V ligados em duas fases. Nunca use dois monopolares separados no lugar dele: se um cair, a outra fase continua energizando o aparelho.</li><li><strong>Tripolar:</strong> três polos, para bomba, motor e máquina de solda trifásicos, comuns em sítios, fazendas e oficinas do Oeste Baiano. Em motores, o eletricista pode indicar também disjuntor-motor ou relé térmico.</li></ul><p>Onde a tomada já é 220 V entre fase e neutro, o eletricista define o dispositivo conforme o aterramento; na dúvida sobre a tensão, peça a medição antes de comprar. O disjuntor geral do padrão de entrada segue a norma da concessionária (na Bahia, a Neoenergia Coelba) e não se troca por conta própria.</p>`,
    },
    {
      h2: 'DR de 30 mA: onde a NBR 5410 exige',
      html: `<p>O DR (dispositivo diferencial residual) de 30 mA é obrigatório pela NBR 5410 nos circuitos que atendem áreas molhadas e externas, porque desliga a energia em fração de segundo quando percebe corrente fugindo pelo corpo de alguém ou por um defeito. O disjuntor comum não faz isso: ele protege o fio, e o DR protege as pessoas.</p><p>A norma exige DR de alta sensibilidade (até 30 mA) em:</p><ul><li>circuitos que atendem locais com chuveiro ou banheira;</li><li>tomadas em áreas externas e tomadas internas que possam alimentar aparelhos do lado de fora;</li><li>cozinha, copa-cozinha, lavanderia, área de serviço, garagem e outros cômodos molhados ou que são lavados.</li></ul><p>Um DR pode proteger um ou vários circuitos, e a corrente nominal dele (25 A, 40 A, 63 A) deve ser compatível com os disjuntores. Ele exige ligação correta, com o neutro passando por ele e sem neutro ligado ao terra depois dele. Aperte o botão de teste na frequência que o fabricante indicar; se não desarmar, chame o eletricista.</p>`,
    },
    {
      h2: 'DPS: proteção contra surtos e raios',
      html: `<p>O DPS (dispositivo de proteção contra surtos) fica no quadro e desvia para o terra os picos de tensão causados por raios e manobras na rede, protegendo geladeira, TV, computador, portão eletrônico e motores. Ele não substitui o disjuntor nem o DR: cada dispositivo cuida de um problema diferente.</p><p>A NBR 5410 exige DPS, por exemplo, quando a instalação é alimentada por rede aérea numa região com mais de 25 dias de trovoada por ano. Em Barreiras, as trovoadas se concentram no período de chuva, mais ou menos de novembro a março, então vale incluir o DPS na conversa com o eletricista. Dois cuidados: sem um aterramento bem feito, o DPS não tem para onde mandar o surto; e a classe, a tensão máxima de operação e a corrente de descarga dependem da rede da sua casa. Filtro de linha não faz o papel do DPS.</p>`,
    },
    {
      h2: 'Disjuntor caindo toda hora? Nunca troque por um maior',
      html: `<p>Disjuntor que desarma com frequência está avisando que algo passou do limite (aparelhos demais, curto-circuito, mau contato ou fio fino), e trocar por um de amperagem maior não resolve: só tira a proteção do fio, que esquenta além do que a isolação aguenta e pode derreter a capa e começar um incêndio dentro da parede.</p><ul><li><strong>Sobrecarga:</strong> ferro de passar, micro-ondas e air fryer ligados juntos no mesmo circuito, ou benjamim com vários aparelhos.</li><li><strong>Curto-circuito:</strong> fio descascado, aparelho com defeito, umidade dentro da caixa de tomada.</li><li><strong>Mau contato:</strong> emenda ou borne frouxo esquenta e pode derrubar o disjuntor mesmo sem sobrecarga.</li><li><strong>Curva errada ou disjuntor gasto:</strong> motor derrubando curva B na partida, ou disjuntor velho desarmando abaixo do valor.</li></ul><p>Se quem cai é o DR, há fuga de corrente (resistência de chuveiro vazando, fio encostando em metal, umidade), e tirar o DR é tirar a proteção contra choque. Com segurança, você pode anotar qual circuito caiu e o que estava ligado, desligar alguns aparelhos e chamar um eletricista. Não abra o quadro nem troque disjuntor: mesmo com o geral desligado, os bornes de entrada continuam energizados.</p>`,
    },
  ],
  howTo: null,
  widget: null,
  faq: [
    {
      q: 'Quantos watts aguenta um disjuntor de 20 A?',
      a: 'Um disjuntor de 20 A suporta cerca de <strong>2.540 W em 127 V</strong> e <strong>4.400 W em 220 V</strong>, pela conta potência = tensão × corrente. Na prática, não planeje usar o circuito no limite: vários aparelhos juntos, motor na partida e calor no conduíte pesam. E o disjuntor só pode ser de 20 A se o fio aguentar essa corrente, como o 2,5 mm² em conduíte embutido. Quem dimensiona o circuito é o eletricista.',
    },
    {
      q: 'Interruptor DR e disjuntor DR são a mesma coisa?',
      a: 'Não são a mesma coisa: o interruptor DR só desliga o circuito quando percebe fuga de corrente, protegendo as pessoas contra choque, mas não protege o fio contra sobrecarga e curto, por isso trabalha junto com um disjuntor comum; já o disjuntor DR (também chamado de DDR) junta as duas funções numa peça só. Para atender a NBR 5410 nas áreas molhadas, qualquer um dos dois precisa ser de até 30 mA.',
    },
    {
      q: 'O que significam C20 e 3000 escritos no disjuntor?',
      a: 'No disjuntor, <strong>C20</strong> quer dizer curva C e corrente nominal de 20 A (B16 seria curva B, 16 A), e o número dentro de um retângulo, como <strong>3000</strong> ou 4500, é a capacidade de interrupção em ampères, ou seja, o tamanho do curto-circuito que ele corta com segurança. O mínimo necessário depende do ponto da instalação e quem define é o projeto. Confira também o número de polos e só compre disjuntor com selo do Inmetro.',
    },
    {
      q: 'Qual a diferença entre disjuntor DIN e NEMA?',
      a: 'A diferença é o formato e o encaixe: o disjuntor DIN, geralmente branco, prende num trilho metálico de 35 mm e é o padrão dos quadros novos; o NEMA, geralmente preto, é o formato mais antigo, comum em quadros de casas mais velhas. Um não substitui o outro sem adaptar o quadro. Para trocar, mande foto do quadro e do disjuntor antigo pelo WhatsApp e consulte disponibilidade.',
    },
    {
      q: 'É normal o disjuntor ficar quente?',
      a: 'Ficar levemente morno com o circuito trabalhando perto do limite pode acontecer, mas disjuntor muito quente, com cheiro de queimado, plástico escurecido ou estalos não é normal. Costuma ser mau contato no borne, sobrecarga ou disjuntor com defeito. Desligue aquele circuito (ou o geral) pela alavanca, não use os aparelhos dele e chame um eletricista para abrir o quadro e corrigir.',
    },
    {
      q: 'Quantos disjuntores preciso no quadro de uma casa?',
      a: 'Você precisa de um disjuntor para cada circuito, e a NBR 5410, como regra, separa iluminação de tomadas, pede circuitos exclusivos para as tomadas de cozinha e área de serviço e circuito próprio para cada aparelho acima de 10 A, como chuveiro e ar-condicionado. Some o geral, o DR e o DPS, deixe espaço sobrando no quadro para ampliações e peça ao eletricista o número exato, que sai do projeto.',
    },
  ],
  cta: {
    title: 'Vai montar ou reformar o quadro?',
    text: 'Monte sua lista com os disjuntores, DR, DPS e fios que o seu eletricista indicou e mande pelo WhatsApp, ou passe na loja no Jardim Ouro Branco para conferir com a gente.',
    items: [
      'Disjuntor DIN monopolar',
      'Disjuntor DIN bipolar',
      'Interruptor DR bipolar 30 mA',
      'DPS para quadro de distribuição',
      'Quadro de distribuição de embutir',
      'Fio flexível 2,5 mm² (rolo 100 m)',
    ],
  },
  relatedGuides: ['qual-fio-usar-no-chuveiro-eletrico', 'como-escolher-lampada-led'],
  sources: [
    { name: 'ABNT NBR 5410:2004 — Instalações elétricas de baixa tensão (capacidade de condução, seções mínimas, DR e DPS)', url: '' },
    { name: 'ABNT NBR NM 60898 / IEC 60898-1 — Disjuntores para instalações domésticas e similares (curvas B, C e D)', url: '' },
    { name: 'IEC 61008-1 e IEC 61009-1 — Interruptores e disjuntores a corrente diferencial-residual (DR)', url: '' },
    { name: 'Manuais de instalação dos fabricantes de chuveiros e de ar-condicionado (tabelas de fio e disjuntor)', url: '' },
  ],
}
