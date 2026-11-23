"""Blog: guias que respondem quem ainda está pesquisando antes de contratar."""
from layout import *

DATE = '2026-11-23'
POSTS = []


def article(slug, title, h1, desc, kicker, lead, body_html, faq, msg, related):
    p = f'/blog/{slug}/'
    rel = ''.join(f'<a class="card" href="{u}"><h3>{t}</h3><p>{d}</p></a>' for u, t, d in related)
    body = (f'<div class="wrap hero"><span class="kicker">{kicker}</span><h1>{h1}</h1><p class="lead">{lead}</p>'
            f'<p class="meta">Por <a href="/pedro-r-gomes/">Pedro R Gomes (PedroK Ads)</a> · Goiânia · 23 de novembro de 2026</p></div>'
            f'<section><div class="wrap prose">{body_html}</div></section>')
    if faq:
        body += f'<section><div class="wrap"><span class="kicker">Perguntas frequentes</span><h2>Dúvidas comuns</h2>{faq_html(faq)}</div></section>'
    body += f'<section><div class="wrap"><span class="kicker">Continue lendo</span><h2>Para ir mais fundo</h2><div class="grid g3">{rel}</div></div></section>'
    body += cta(msg)
    graph = [webpage_ld(p, h1, desc),
             {"@type": "BlogPosting", "@id": SITE + p + "#artigo", "headline": h1, "description": desc, "inLanguage": "pt-BR",
              "datePublished": DATE, "dateModified": DATE, "mainEntityOfPage": {"@id": SITE + p + "#pagina"},
              "author": {"@id": SITE + "/#pedro"}, "publisher": {"@id": SITE + "/#org"},
              "image": SITE + "/assets/og-pedro-r-gomes-pk7.jpg"}]
    if faq:
        graph.append(faq_ld(p, faq))
    POSTS.append(dict(path=p, title=h1, desc=desc))
    return (p, page(p, title, desc, body, graph, [('/', 'Início'), ('/blog/', 'Blog'), (p, h1)]))


PAGES = []

# ------------------------------------------------------------------ Quanto custa
PAGES.append(article(
    'quanto-custa-trafego-pago-goiania',
    'Quanto custa tráfego pago em Goiânia em 2026? Gestão e verba | PK7',
    'Quanto custa tráfego pago em Goiânia em 2026?',
    'Quanto custa contratar tráfego pago em Goiânia: a diferença entre gestão e verba de anúncio, faixas de preço do mercado, como calcular a verba e o que faz o barato sair caro.',
    'Guia · Investimento',
    'Tráfego pago tem dois custos, e quase todo mundo confunde os dois: o valor da <strong>gestão</strong> e a <strong>verba de anúncio</strong>. Neste guia eu explico cada um, as faixas que o mercado pratica e como calcular quanto você precisa investir.',
    '''<h2>1. Gestão e verba são coisas diferentes</h2>
<p><strong>Gestão</strong> é o trabalho de quem planeja, cria, opera e otimiza as campanhas: o gestor de tráfego ou a agência. Normalmente é um valor mensal.</p>
<p><strong>Verba</strong> é o dinheiro que vai direto para o Meta (Instagram e Facebook) e para o Google, pago no cartão ou boleto da sua empresa. É ela que compra as impressões e os cliques.</p>
<p>Um orçamento honesto sempre separa as duas. Se alguém te passa um valor único "com anúncio incluso", pergunte quanto daquilo vai de fato para a plataforma.</p>

<h2>2. Quanto o mercado cobra pela gestão em Goiânia</h2>
<p>Os valores variam muito conforme o escopo. Em Goiânia há prestadores anunciando gestão a partir de algumas centenas de reais por mês, normalmente para uma plataforma só e sem criação. No outro extremo, agências cobram bem mais caro, porque incluem criação, conteúdo e outros serviços no pacote.</p>
<p>O preço sozinho diz pouco. O que importa é o que está incluído:</p>
<ul>
<li>Quantas plataformas (só Meta, ou Meta e Google)?</li>
<li>Quem faz os criativos?</li>
<li>O pixel, a API de conversões e o remarketing estão incluídos?</li>
<li>Alguém cuida do que acontece depois do clique: o atendimento e o funil?</li>
<li>Como é a reunião de resultado, e qual número é medido?</li>
</ul>

<h2>3. Como calcular a verba de anúncio</h2>
<p>A verba não sai de um chute. Ela sai de conta reversa, partindo de quantos clientes você quer por mês:</p>
<ol>
<li><strong>Meta de clientes por mês</strong>, por exemplo 10.</li>
<li><strong>Taxa de fechamento</strong> dos seus contatos. Se você fecha 1 a cada 5 conversas, precisa de 50 conversas.</li>
<li><strong>Custo por conversa</strong> no seu nicho em Goiânia. Ele só aparece de verdade depois das primeiras semanas de campanha.</li>
<li><strong>Verba = conversas necessárias × custo por conversa.</strong></li>
</ol>
<div class="box"><p><strong>Exemplo ilustrativo:</strong> se você quer 10 clientes, fecha 20% das conversas e cada conversa custa R$ 25, a conta é 50 conversas × R$ 25 = R$ 1.250 de verba no mês. São números de exemplo, não uma promessa: o custo real depende do nicho, da oferta e da concorrência.</p></div>
<p>O ponto mais importante: <strong>a taxa de fechamento pesa tanto quanto o custo do clique</strong>. Responder rápido, ter oferta clara e fazer remarketing pode dobrar a taxa de fechamento, e isso corta pela metade a verba necessária para a mesma meta.</p>

<h2>4. O que faz o tráfego barato sair caro</h2>
<ul>
<li><strong>Medir clique em vez de venda.</strong> Campanha com clique barato e nenhum cliente é a mais cara que existe.</li>
<li><strong>Pixel mal configurado.</strong> O algoritmo aprende com os eventos errados e traz o público errado.</li>
<li><strong>Ninguém respondendo.</strong> Lead que espera horas compra do concorrente. Por isso uso <a href="/ia-whatsapp-goiania/">IA no WhatsApp</a> para responder em segundos.</li>
<li><strong>Conta no nome do gestor.</strong> Se a relação acaba, você perde o histórico, o pixel e os públicos.</li>
<li><strong>Fidelidade longa.</strong> Quem confia no próprio trabalho não precisa prender o cliente.</li>
</ul>

<h2>5. Como eu cobro na PK7</h2>
<p>A gestão é mensal, sem fidelidade longa. O valor depende do escopo: só anúncios, ou a máquina inteira (anúncios, pixel, remarketing, atendimento com IA e painel). Automação e sistemas são projetos com escopo fechado. A verba de anúncio vai direto para o Meta e o Google, no nome da sua empresa.</p>
<p>No <strong>diagnóstico gratuito de 30 minutos</strong> (presencial em Goiânia ou por vídeo) eu olho a sua operação, faço a conta da verba com os seus números e te passo o valor exato. Saiba mais sobre o <a href="/trafego-pago-goiania/">tráfego pago em Goiânia</a>.</p>''',
    [('Qual a verba mínima para começar?', 'Não existe um número mágico. Dá para começar enxuto e aumentar quando o custo por cliente estiver claro. O importante é ter verba suficiente para o algoritmo aprender, e isso se calcula com os números do seu nicho.'),
     ('O valor da gestão inclui a verba?', 'Não deveria. Gestão é o trabalho; verba é o que vai para o Meta e o Google. Sempre peça os dois valores separados.'),
     ('Em quanto tempo o investimento se paga?', 'Depende do ticket e do ciclo de venda. Em geral a campanha estabiliza entre 30 e 45 dias, e é a partir daí que dá para medir o custo por cliente com segurança.')],
    'Olá, Pedro! Li o guia de quanto custa tráfego pago e quero fazer a conta da minha verba no diagnóstico gratuito.',
    [('/trafego-pago-goiania/', 'Tráfego pago em Goiânia', 'Como eu cuido das campanhas e da estrutura por trás delas.'),
     ('/blog/por-que-o-trafego-pago-nao-vende/', 'Por que o tráfego pago não vende', 'Os 4 vazamentos que fazem a verba sumir.'),
     ('/blog/gestor-de-trafego-ou-agencia/', 'Gestor de tráfego ou agência?', 'Qual modelo faz mais sentido para a sua empresa.')]))

# ------------------------------------------------------------------ Gestor ou agência
PAGES.append(article(
    'gestor-de-trafego-ou-agencia',
    'Gestor de tráfego ou agência: qual contratar? | PK7',
    'Gestor de tráfego ou agência: qual contratar?',
    'Gestor de tráfego, agência de marketing ou um modelo misto? As diferenças de atendimento, custo, escopo e risco, e um checklist para escolher sem errar.',
    'Guia · Contratação',
    'Na hora de terceirizar os anúncios, a dúvida é sempre a mesma: contrato um gestor de tráfego ou uma agência? Os dois podem dar certo e os dois podem dar errado. Abaixo, o que muda de verdade entre eles.',
    '''<h2>O que um gestor de tráfego entrega</h2>
<p>O gestor de tráfego planeja e opera os anúncios no Meta e no Google: público, verba, criativos, testes e mensuração. A grande vantagem é a proximidade: <strong>você fala com quem mexe na sua conta</strong>.</p>
<p>O risco é o escopo. Muitos gestores cuidam só do anúncio, e o resto do funil (oferta, página, atendimento, remarketing) fica sem dono. Aí o anúncio traz gente e a venda não acontece.</p>

<h2>O que uma agência entrega</h2>
<p>A agência costuma oferecer mais serviços no mesmo contrato: tráfego, conteúdo, design, site. A vantagem é ter tudo num lugar só.</p>
<p>O risco é o modelo. Em muitas agências, quem vende o contrato não é quem cuida da sua conta, os planos vêm em pacotes iguais para todos os clientes e o relatório mede alcance e curtida, não venda.</p>

<h2>A pergunta certa não é "gestor ou agência"</h2>
<p>A pergunta certa é: <strong>quem vai ser responsável pelo resultado do funil inteiro?</strong> Tráfego sozinho não vende. Venda é a soma de anúncio, oferta, pixel, remarketing, atendimento rápido e medição. Se ninguém é dono dessa soma, não importa o nome do contrato.</p>
<p>Foi por isso que montei a PK7 num modelo misto: eu lidero cada projeto pessoalmente, como um gestor, e trago um time de especialistas independentes (tráfego, IA, automação, SEO, design) quando o gargalo pede, como uma agência. Você fala direto comigo, antes e depois de fechar.</p>

<h2>Checklist para escolher</h2>
<ol>
<li>A conta de anúncios, o pixel e os dados ficam no nome da sua empresa.</li>
<li>Você sabe exatamente quem vai operar a sua conta.</li>
<li>Há cases com número de venda, não só print de alcance.</li>
<li>A proposta fala de pixel, remarketing e atendimento, não só de anúncio.</li>
<li>A reunião de resultado mede clientes e custo por cliente.</li>
<li>O contrato é simples, sem fidelidade longa.</li>
</ol>
<p>Se você está em Goiânia, veja como trabalho como <a href="/gestor-de-trafego-goiania/">gestor de tráfego em Goiânia</a>, ou leia sobre a <a href="/agencia-de-marketing-digital-goiania/">alternativa à agência de marketing</a>.</p>''',
    [('Gestor de tráfego é mais barato que agência?', 'Normalmente a gestão sozinha custa menos que um pacote de agência, mas o pacote inclui outros serviços. Compare o que está incluído e quem vai fazer cada coisa, não só o preço.'),
     ('Posso ter gestor e agência ao mesmo tempo?', 'Pode, mas alguém precisa ser dono do resultado do funil. Sem isso, cada um otimiza a sua parte e a venda fica no meio do caminho.')],
    'Olá, Pedro! Li o guia gestor de tráfego ou agência e quero agendar meu diagnóstico gratuito.',
    [('/gestor-de-trafego-goiania/', 'Gestor de tráfego em Goiânia', 'Quem eu sou e como cuido das contas.'),
     ('/blog/quanto-custa-trafego-pago-goiania/', 'Quanto custa tráfego pago em Goiânia', 'Gestão, verba e como calcular.'),
     ('/blog/por-que-o-trafego-pago-nao-vende/', 'Por que o tráfego pago não vende', 'Os 4 vazamentos que fazem a verba sumir.')]))

# ------------------------------------------------------------------ Por que não vende
PAGES.append(article(
    'por-que-o-trafego-pago-nao-vende',
    'Por que o tráfego pago não vende? Os 4 vazamentos | PK7',
    'Por que o tráfego pago não vende (e como resolver)',
    'Seu anúncio traz gente e não traz venda? Os 4 vazamentos mais comuns (pixel, remarketing, atendimento e oferta) e as 5 peças da máquina de vendas que fazem o tráfego vender.',
    'Guia · Estratégia',
    'Só tráfego não vende. E quase ninguém te conta isso. O anúncio faz a parte dele: traz gente. O problema é o que acontece depois do clique.',
    '''<h2>O anúncio traz gente. Só que ela vaza.</h2>
<p>Pense na sua operação como um balde: o anúncio enche o balde de pessoas interessadas. Se o balde tem furos, você pode colocar o dobro de verba que ele nunca enche. Os furos mais comuns são quatro.</p>
<h3>1. Sem pixel</h3>
<p>O pixel (e a API de conversões) é o que registra o comportamento de quem chega pelo anúncio: quem viu, clicou e chamou. Sem ele, o Meta e o Google não sabem quem virou cliente e otimizam para o clique mais barato, que quase nunca é o cliente certo.</p>
<h3>2. Sem remarketing</h3>
<p>A maioria das pessoas não compra no primeiro contato. Remarketing é voltar a aparecer para quem demonstrou interesse e não comprou. Sem ele, cada clique que não fechou é dinheiro jogado fora.</p>
<h3>3. Sem atendimento</h3>
<p>O lead manda mensagem às 23h, no almoço ou no domingo, e ninguém responde. Quando alguém responde, ele já comprou de outro. Velocidade de resposta é um dos fatores que mais mexem na taxa de fechamento.</p>
<h3>4. Sem oferta</h3>
<p>Anúncio bonito sem um motivo claro para agir agora vira curtida, não cliente. Oferta é o que transforma atenção em conversa.</p>

<h2>O problema não é o tráfego. É estrutura.</h2>
<p>A solução é montar a máquina de vendas, com cinco peças funcionando juntas:</p>
<ol>
<li><strong>Estratégia e oferta:</strong> anúncio certo para a pessoa certa, com motivo para comprar.</li>
<li><strong>Pixel:</strong> registra o comportamento de quem viu, clicou e chamou.</li>
<li><strong>Remarketing:</strong> aparece de novo para quem se interessou e não comprou.</li>
<li><strong>Atendimento com IA:</strong> responde em segundos, 24h, e separa curioso de comprador. Veja a <a href="/ia-whatsapp-goiania/">IA no WhatsApp</a>.</li>
<li><strong>Funil e painel:</strong> do anúncio ao contrato, num número só.</li>
</ol>
<div class="box lime"><p><strong>Tráfego + estrutura = venda.</strong> É por isso que na PK7 eu não vendo só tráfego: monto a máquina inteira.</p></div>

<h2>Como saber se o seu balde tem furo</h2>
<ul>
<li>Você sabe quantos clientes vieram dos anúncios no mês passado, e não só quantos cliques?</li>
<li>O pixel está registrando conversas e vendas, ou só visitas?</li>
<li>Quem clicou e não comprou volta a ver um anúncio seu?</li>
<li>Uma mensagem às 23h é respondida em minutos ou na manhã seguinte?</li>
</ul>
<p>Se alguma resposta foi "não sei", tem dinheiro vazando. No <a href="/trafego-pago-goiania/">diagnóstico gratuito</a> eu te mostro onde.</p>''',
    [('Aumentar a verba resolve?', 'Se o balde tem furo, mais verba só faz vazar mais rápido. Primeiro tapa os furos (pixel, remarketing, atendimento, oferta), depois escala.'),
     ('Preciso de todas as 5 peças?', 'Para vender de forma previsível, sim. Mas não precisa fazer tudo no mesmo dia: o diagnóstico mostra qual furo está custando mais caro e por onde começar.')],
    'Olá, Pedro! Li o guia por que o tráfego pago não vende e quero descobrir onde está o furo da minha operação.',
    [('/trafego-pago-goiania/', 'Tráfego pago em Goiânia', 'A máquina inteira, do anúncio ao contrato.'),
     ('/ia-whatsapp-goiania/', 'IA no WhatsApp', 'O atendimento que responde em segundos, 24h.'),
     ('/blog/quanto-custa-trafego-pago-goiania/', 'Quanto custa tráfego pago em Goiânia', 'Gestão, verba e como calcular.')]))

# ------------------------------------------------------------------ índice do blog
p = '/blog/'
title = 'Blog da PK7: tráfego pago, IA no WhatsApp e vendas | Pedro R Gomes'
desc = 'Guias práticos de Pedro R Gomes (PK7) sobre tráfego pago, custo de anúncios, IA no WhatsApp, pixel, remarketing e como fazer o marketing virar venda.'
lst = ''.join(f'<a class="card" href="{x["path"]}"><h3>{x["title"]}</h3><p>{x["desc"]}</p></a>' for x in POSTS)
body = (f'<div class="wrap hero"><h1>Blog: tráfego pago que vira venda</h1><p class="lead">Guias práticos, sem enrolação, para quem quer entender o que faz o marketing virar venda antes de contratar alguém.</p></div>'
        f'<section><div class="wrap"><div class="posts">{lst}</div></div></section>' + cta('Olá, Pedro! Vim pelo blog e quero agendar meu diagnóstico gratuito.'))
graph = [webpage_ld(p, 'Blog da PK7', desc, extra={"@type": "CollectionPage"}),
         {"@type": "Blog", "@id": SITE + p + "#blog", "name": "Blog da PK7", "url": SITE + p, "publisher": {"@id": SITE + "/#org"},
          "blogPost": [{"@id": SITE + x["path"] + "#artigo"} for x in POSTS]}]
PAGES.append((p, page(p, title, desc, body, graph, [('/', 'Início'), (p, 'Blog')])))
