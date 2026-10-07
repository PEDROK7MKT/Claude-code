// Guia: como pintar parede passo a passo (tem howTo).
// ATENÇÃO: os números de quantidade de tinta saem das MESMAS constantes da
// calculadora (assets/js/site.js → bestPack): parede = perímetro × pé-direito −
// portas (1,68 m²) − janelas (1,20 m²); teto = largura × comprimento; litros =
// área × demãos ÷ rendimento (11 m²/L liso; 8 m²/L reboco) × 1,1; embalagens
// 18 L / 3,6 L / 0,9 L com custo relativo lata = 3,9 galões e quarto = 0,32 galão.
// Se mudar a calculadora, refaça a tabela da 1ª seção e a FAQ de escuro para claro.
export default {
  slug: 'como-pintar-parede-passo-a-passo',
  category: 'tintas-e-pintura',
  title: 'Como pintar parede passo a passo: do preparo à última demão',
  navTitle: 'Como pintar parede passo a passo',
  seo: {
    title: 'Como pintar parede: passo a passo | Pereira Luz & Cor',
    description: 'Como pintar parede: preparo, lixa, trincas, selador, massa, recorte com trincha, rolo e demãos. Calcule a tinta e peça orçamento no WhatsApp em Barreiras.',
  },
  kicker: 'Passo a passo · Tintas',
  readingMinutes: 9,
  summary: 'Para pintar parede, proteja piso, móveis e rodapés, raspe e lixe o que estiver solto, trate furos e trincas, tire o pó, aplique selador ou fundo quando a parede pedir, recorte os cantos com trincha e passe o rolo em duas demãos, respeitando o intervalo indicado na lata. Pinte o teto primeiro e, para área externa, prefira os meses secos.',
  keyTakeaways: [
    'A ordem é: proteger, raspar e lixar, tratar trincas, limpar, selar ou fundear, massa (se precisar), recorte e rolo.',
    'Reboco novo: espere a cura (em geral pelo menos 28 dias) e passe selador; reboco que solta pó pede fundo preparador.',
    'Recorte uma parede com trincha e já passe o rolo nela, com a faixa ainda fresca, para não marcar.',
    'O intervalo entre demãos é o da lata: não encurte por causa do calor.',
    'Quarto de 3 × 4 m: cerca de 6,7 L de tinta nas paredes lisas, 2 galões de 3,6 L.',
  ],
  sections: [
    {
      h2: 'Antes de começar: material e quantidade de tinta',
      html: `<p>Antes de pintar, separe tudo o que a parede vai pedir (tinta, selador ou fundo, massa, lixa, fita crepe, lona, rolo, trincha e bandeja) e calcule a tinta pela área real. Compre tudo de uma vez, para não parar o serviço no meio nem arriscar um lote com tom diferente.</p>
<p>A <a href="/calculadora-de-tinta/">calculadora de tinta</a> faz assim: perímetro × pé-direito, menos 1,68 m² por porta e 1,20 m² por janela, × demãos ÷ rendimento por demão (11 m²/L em parede lisa, 8 m²/L em reboco) + 10% de folga.</p>
<table>
<thead><tr><th>Quarto 3 × 4 m, pé-direito 2,60 m, 1 porta, 1 janela</th><th>Área</th><th>Tinta</th><th>Sugestão da calculadora</th></tr></thead>
<tbody>
<tr><td>Paredes lisas, 2 demãos</td><td>33,52 m²</td><td>≈ 6,7 L</td><td>2 galões de 3,6 L</td></tr>
<tr><td>Paredes e teto lisos, 2 demãos</td><td>45,52 m²</td><td>≈ 9,1 L</td><td>2 galões + 3 quartos, ou 3 galões (10,8 L) com mais sobra</td></tr>
<tr><td>Paredes em reboco, 2 demãos</td><td>33,52 m²</td><td>≈ 9,2 L</td><td>2 galões + 3 quartos</td></tr>
<tr><td>Paredes lisas, de escuro para claro (3 demãos)</td><td>33,52 m²</td><td>≈ 10,1 L</td><td>3 galões</td></tr>
</tbody>
</table>
<p>A conta é conservadora: o rendimento real muda com a marca e a linha e vem impresso na lata (linhas premium costumam render mais). Selador, fundo e massa têm rendimento próprio. O cálculo completo está em <a href="/guias/quantas-latas-de-tinta-preciso/">quantas latas de tinta preciso</a>.</p>`,
    },
    {
      h2: 'Preparo da parede: proteger, lixar, limpar e tratar trincas',
      html: `<p>A preparação é o que faz a pintura durar: proteja piso, móveis e rodapés, raspe o que estiver soltando, lixe, limpe pó e gordura, trate mofo e trincas e só pinte com a parede firme, limpa e seca. Tinta sobre parede suja ou esfarelando descasca junto.</p>
<ul>
<li><strong>Proteção</strong>: junte os móveis no centro, cubra com lona, forre o piso e passe fita crepe em rodapé e batente. Para tirar espelhos de tomada, desligue antes o disjuntor do circuito; na dúvida, só cubra com fita.</li>
<li><strong>Lixa</strong>: raspe a tinta solta e lixe a parede de leve (quanto maior o número do grão, mais fina a lixa). Acetinado ou semibrilho deve ser lixado até ficar fosco, para a tinta nova aderir. Use óculos e máscara contra pó.</li>
<li><strong>Limpeza</strong>: tire o pó com escova ou pano; gordura sai com água e detergente neutro. Mofo se limpa com água sanitária diluída na proporção da ficha técnica da tinta, com luvas e janela aberta; enxágue e deixe secar bem. Nunca misture água sanitária com outros produtos de limpeza.</li>
<li><strong>Furos e fissuras finas</strong>: abra de leve com a ponta da espátula, tire o pó e preencha com massa ou com selante acrílico próprio para trincas. Depois de seco, lixe rente.</li>
</ul>
<p><strong>Chame um profissional</strong> se a trinca é larga, corre na diagonal a partir do canto de porta ou janela, aumenta ou volta depois de consertada, ou se o mofo sempre volta e a tinta estufa: pode ser estrutura ou umidade, e tinta não resolve. Um engenheiro ou pedreiro de confiança deve avaliar antes.</p>`,
    },
    {
      h2: 'Selador, fundo preparador ou massa: o que vai antes da tinta',
      html: `<p>O que vai antes da tinta depende de como a parede está: reboco novo e curado leva selador acrílico; reboco fraco, que solta pó, parede caiada e gesso levam fundo preparador; pintura antiga firme pede só lixa e limpeza; e a massa entra quando você quer a parede lisa ou precisa corrigir defeitos.</p>
<table>
<thead><tr><th>Como está a parede</th><th>O que fazer antes da tinta</th></tr></thead>
<tbody>
<tr><td>Reboco novo</td><td>Esperar a cura (os fabricantes costumam pedir pelo menos 28 dias) e passar selador acrílico</td></tr>
<tr><td>Reboco fraco, que esfarela ou solta pó na mão</td><td>Escovar e aplicar fundo preparador de paredes</td></tr>
<tr><td>Caiação ou tinta velha que solta pó branco</td><td>Raspar o que estiver solto, escovar e aplicar fundo preparador</td></tr>
<tr><td>Gesso</td><td>Fundo preparador que traga indicação para gesso na embalagem</td></tr>
<tr><td>Pintura antiga firme</td><td>Lixar de leve e tirar o pó; remendo de massa leva antes um pouco de fundo, para não manchar</td></tr>
</tbody>
</table>
<p>Em reboco novo, o selador vem antes da massa. Massa corrida PVA é só para parede interna e seca; em área externa ou úmida, use massa acrílica (veja <a href="/guias/massa-corrida-ou-massa-acrilica/">massa corrida ou massa acrílica</a>). Aplique em camadas finas, lixe com lixa fina e tire todo o pó.</p>`,
    },
    {
      h2: 'Como fazer o recorte com trincha e passar o rolo',
      html: `<p>Pinte primeiro o teto e depois as paredes, sempre de cima para baixo. Em cada parede, faça o recorte com trincha nos cantos, junto ao teto, ao rodapé e aos batentes, e logo em seguida passe o rolo, com a faixa da trincha ainda fresca, para as duas se misturarem sem deixar marca.</p>
<ul>
<li><strong>Tinta</strong>: mexa bem e dilua só como a lata indica (às vezes a primeira demão leva mais água).</li>
<li><strong>Recorte</strong>: faça uma faixa de uns 5 a 10 cm nos encontros e em volta das tomadas, carregando só a ponta das cerdas.</li>
<li><strong>Rolo</strong>: molhe na bandeja e rode na parte rugosa até tirar o excesso. Aplique em faixas de cerca de 1 m de largura, em movimento de W ou N, espalhe sem recarregar e termine com passadas leves de cima para baixo, num só sentido.</li>
<li><strong>Borda molhada</strong>: emende sempre na tinta fresca e termine a parede de uma vez, sem voltar o rolo onde já começou a secar.</li>
</ul>
<p>Não aperte o rolo: pressão demais espirra tinta e marca a parede. Entre uma demão e outra, embrulhe rolo e trincha em saco plástico para não secarem.</p>`,
    },
    {
      h2: 'Quanto tempo esperar entre uma demão e outra',
      html: `<p>Espere o intervalo entre demãos impresso na lata antes de passar a próxima: em muitas tintas base água ele fica em torno de 4 horas, mas muda com a linha, a temperatura e a ventilação. A tinta seca ao toque bem antes disso, e a segunda demão aplicada cedo demais arrasta a primeira e deixa marcas.</p>
<ul>
<li><strong>Número de demãos</strong>: duas é o padrão; de cor escura para clara, conte três. Cores muito vivas podem pedir mais uma: siga a lata.</li>
<li><strong>Cura</strong>: a tinta seca em horas, mas só atinge a resistência total depois da cura, que leva semanas; até lá, não esfregue a parede.</li>
<li><strong>Calor e ar seco</strong> secam a superfície mais rápido, mas não encurte o intervalo; só trabalhe em trechos menores para não perder a borda molhada.</li>
</ul>`,
    },
    {
      h2: 'Melhor época para pintar em Barreiras',
      html: `<p>A melhor época para pintar em Barreiras é a seca, de maio a setembro, principalmente fachada e muro, que assim secam e curam sem risco de chuva. Dentro de casa dá para pintar o ano todo, com o cômodo ventilado; fora, cuidado com o calor de setembro e outubro e com as chuvas, mais ou menos de novembro a março.</p>
<ul>
<li><strong>Seca (maio a setembro)</strong>: melhor fase para área externa; evite dia de vento forte, que joga poeira na tinta.</li>
<li><strong>Calor forte (setembro e outubro)</strong>: parede no sol esquenta e a tinta seca rápido demais, marcando as emendas. Pinte a fachada de manhã cedo ou no fim da tarde, com a parede na sombra.</li>
<li><strong>Chuvas (novembro a março)</strong>: só pinte área externa com a parede seca e sem previsão de chuva para as horas seguintes. Confira na lata os limites de temperatura e umidade.</li>
</ul>
<p>Na fachada, use sempre tinta acrílica; veja <a href="/guias/tinta-acrilica-ou-latex-pva/">tinta acrílica ou látex PVA</a>.</p>`,
    },
    {
      h2: 'Limpeza das ferramentas e descarte da sobra',
      html: `<p>Limpe as ferramentas assim que terminar: com tinta base água, tire o excesso do rolo e da trincha na borda da lata ou em jornal e lave num balde com água e sabão; com esmalte e verniz base solvente, use o diluente indicado na lata. Nunca jogue tinta, água de lavagem ou solvente no ralo, na pia ou na terra.</p>
<ul>
<li><strong>Água de lavagem</strong>: deixe descansar até a tinta assentar e descarte o resíduo como orientam o fabricante e a prefeitura.</li>
<li><strong>Sobra de tinta</strong>: feche bem e guarde em local fresco e longe de crianças, com a cor anotada na tampa.</li>
<li><strong>Lata vazia</strong>: deixe o restinho secar com a lata aberta, em local ventilado e fora do alcance de crianças e animais, e descarte conforme a coleta da sua cidade.</li>
<li><strong>Panos e estopas com solvente</strong>: deixe secar abertos, ao ar livre e longe de fogo, antes de jogar fora.</li>
</ul>`,
    },
  ],
  howTo: {
    name: 'Passo a passo para pintar parede',
    totalTime: 'PT10H',
    supplies: [
      'Tinta acrílica ou látex PVA (quantidade pela calculadora)',
      'Selador acrílico ou fundo preparador, quando a parede pedir',
      'Massa corrida (área interna e seca) ou massa acrílica (área externa e úmida)',
      'Selante acrílico para trincas',
      'Lixa para parede (grão médio e fino)',
      'Fita crepe',
      'Lona plástica ou papelão para o piso',
      'Detergente neutro, água limpa e panos',
    ],
    tools: [
      'Rolo de lã 23 cm (pelo baixo para parede lisa, pelo alto para reboco)',
      'Trincha ou pincel para recorte',
      'Bandeja para pintura',
      'Extensor (cabo) para rolo',
      'Espátula e desempenadeira de aço',
      'Escada firme',
      'Balde e misturador',
      'Óculos de proteção, luvas e máscara contra pó',
    ],
    steps: [
      {
        name: 'Escolha o dia e calcule a tinta',
        text: 'Prefira dias secos e sem vento forte; na área externa, evite chuva prevista e parede no sol. Calcule os litros na <a href="/calculadora-de-tinta/">calculadora de tinta</a> e compre tudo de uma vez, já com a folga.',
      },
      {
        name: 'Esvazie e proteja o cômodo',
        text: 'Tire ou junte os móveis no centro, cubra com lona e forre o piso. Passe fita crepe em rodapés, batentes e janelas. Para tirar espelhos de tomada e interruptor, desligue antes o disjuntor do circuito; na dúvida, só cubra com fita.',
      },
      {
        name: 'Raspe, lixe e trate furos e trincas',
        text: 'Raspe a tinta solta com espátula, lixe a parede de leve e tire o brilho de acabamento acetinado ou semibrilho. Preencha furos e fissuras finas com massa ou selante acrílico e lixe rente depois de seco. Trinca larga ou que volta pede avaliação de um profissional.',
      },
      {
        name: 'Limpe a parede e deixe secar',
        text: 'Tire o pó com escova ou pano, lave gordura com água e detergente neutro e trate o mofo com água sanitária diluída conforme a ficha técnica, enxaguando depois. Só siga com a parede bem seca.',
      },
      {
        name: 'Aplique selador ou fundo, se precisar',
        text: 'Reboco novo e curado leva selador acrílico; reboco que solta pó, caiação e gesso levam fundo preparador. Pintura antiga firme dispensa esta etapa. Respeite a secagem indicada na embalagem.',
      },
      {
        name: 'Passe massa onde for preciso',
        text: 'Para deixar a parede lisa, aplique massa corrida (área interna e seca) ou massa acrílica (área externa e úmida) em camadas finas com desempenadeira de aço. Depois de seca, lixe com lixa fina e tire todo o pó.',
      },
      {
        name: 'Prepare a tinta e o rolo',
        text: 'Mexa bem a tinta, dilua só com o que a lata indica e na proporção indicada e despeje uma parte na bandeja. Enrole fita crepe no rolo de lã novo e puxe para tirar os pelos soltos.',
      },
      {
        name: 'Faça o recorte com trincha',
        text: 'Comece pelo teto. Com trincha ou pincel, pinte uma faixa de 5 a 10 cm nos cantos, junto ao teto, ao rodapé, aos batentes e em volta das tomadas, uma parede de cada vez.',
      },
      {
        name: 'Passe o rolo e repita as demãos',
        text: 'Logo depois do recorte, passe o rolo em faixas de cerca de 1 m, em W ou N, espalhe e termine de cima para baixo, sem parar no meio da parede. Espere o intervalo da lata e aplique a segunda demão; de escuro para claro, conte três.',
      },
      {
        name: 'Tire a fita, limpe e guarde',
        text: 'Retire a fita crepe depois da última demão, com a tinta ainda fresca, puxando devagar. Lave as ferramentas num balde, nunca no ralo, guarde a sobra bem fechada e deixe o cômodo ventilado.',
      },
    ],
  },
  widget: null,
  faq: [
    {
      q: 'Qual rolo usar para pintar parede?',
      a: '<p>Para tinta acrílica ou látex PVA, use <strong>rolo de lã</strong>: de pelo baixo em parede lisa ou com massa e de pelo alto em reboco, parede áspera e textura, porque o pelo comprido alcança as reentrâncias. O de 23 cm é o tamanho mais usado em parede. O rolo de espuma é para esmalte e verniz em superfície lisa e, em parede, costuma deixar bolhas. No teto, rolo antirrespingo e extensor facilitam o serviço.</p>',
    },
    {
      q: 'Quanto tempo leva para pintar um quarto?',
      a: '<p>Um quarto de 3 × 4 m com a parede em bom estado costuma levar <strong>um dia de serviço</strong>: algumas horas de proteção e preparo, de uma a duas horas por demão e a espera entre demãos indicada na lata. Se a parede precisar de massa, selador ou consertos, conte mais um ou dois dias, porque cada produto tem sua secagem. Reboco novo ainda precisa curar antes, o que costuma levar semanas.</p>',
    },
    {
      q: 'Como cobrir uma parede escura com cor clara?',
      a: '<p>Conte <strong>três demãos</strong> em vez de duas e mantenha a diluição da lata, sem engrossar nem afinar a tinta por conta própria. No quarto de 3 × 4 m, com paredes lisas, a conta passa de 6,7 para cerca de 10,1 litros, ou <strong>3 galões de 3,6 L</strong>. Se a cor antiga ainda aparecer depois da terceira demão, consulte a embalagem ou pergunte no balcão antes de continuar. Faça a sua conta na <a href="/calculadora-de-tinta/">calculadora de tinta</a>.</p>',
    },
    {
      q: 'Quando tirar a fita crepe depois de pintar?',
      a: '<p>Tire a fita <strong>logo depois da última demão</strong>, com a tinta ainda fresca, puxando devagar e num ângulo baixo, para a borda ficar reta. Se a tinta já secou por cima da fita, passe um estilete rente à borda antes de puxar, senão a película sai junto. Não deixe fita crepe comum por dias na parede ou no sol: ela gruda e deixa cola.</p>',
    },
    {
      q: 'Depois de pintar, quando posso usar o quarto de novo?',
      a: '<p>Mantenha portas e janelas abertas durante e depois da pintura e só volte a usar o cômodo com a tinta seca e sem cheiro forte; se der, durma em outro cômodo na primeira noite, principalmente crianças, gestantes e quem tem problema respiratório. Encoste móveis só depois da secagem final indicada na lata e deixe para esfregar a parede depois da cura. Esmalte e verniz base solvente pedem ventilação ainda maior.</p>',
    },
    {
      q: 'Onde comprar tinta e material de pintura em Barreiras?',
      a: '<p>Na <strong>Pereira Luz & Cor</strong>, na Rua São Francisco, 55, bairro Jardim Ouro Branco, em Barreiras. A loja é nova e trabalha com tinta acrílica, látex PVA, selador, fundo preparador, massa, lixas, rolos, trinchas, fita crepe e lona, em várias linhas e medidas. Monte sua lista aqui no site e envie pelo WhatsApp para receber o orçamento, ou passe no balcão para tirar dúvidas. Veja como chegar na página de <a href="/contato/">contato</a>.</p>',
    },
  ],
  cta: {
    title: 'Vai pintar a casa?',
    text: 'Monte a lista com tinta, selador, massa, rolo, trincha e fita crepe e envie pelo WhatsApp para receber o orçamento, ou passe na loja da Rua São Francisco, 55, no Jardim Ouro Branco.',
    items: [
      'Tinta acrílica fosca (galão 3,6 L)',
      'Selador acrílico para reboco novo',
      'Rolo de lã 23 cm pelo baixo (parede lisa)',
      'Trincha para recorte e moldura (várias larguras)',
      'Fita crepe (várias larguras)',
      'Lona plástica para cobrir piso e móveis',
    ],
  },
  relatedGuides: ['quantas-latas-de-tinta-preciso', 'tinta-acrilica-ou-latex-pva', 'massa-corrida-ou-massa-acrilica'],
  sources: [
    { name: 'ABNT NBR 13245 — execução de pinturas em edificações não industriais: preparação de superfície', url: '' },
    { name: 'Fichas técnicas e embalagens dos fabricantes de tinta, selador, fundo preparador e massa (diluição, intervalo entre demãos, secagem, cura e limpeza)', url: '' },
    { name: 'INMET — Normais Climatológicas do Brasil (estação de Barreiras-BA): estação seca e período chuvoso', url: '' },
  ],
}
