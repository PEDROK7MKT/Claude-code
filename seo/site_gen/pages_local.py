"""Páginas de serviço + cidade (Goiânia, Barreiras, LEM)."""
from layout import *

PROVA = ('<section><div class="wrap"><span class="kicker">Prova, não promessa</span><h2>Quem vai cuidar do seu tráfego</h2><div class="grid g4">'
         '<div class="card stat"><b>7 anos</b><span>operando mídia paga</span></div>'
         '<div class="card stat"><b>+40</b><span>clientes atendidos</span></div>'
         '<div class="card stat"><b>+R$ 500 mil</b><span>faturados na Appmax, com diversas premiações</span></div>'
         '<div class="card stat"><b>3</b><span>continentes com clientes</span></div></div>'
         '<p style="margin-top:18px">Antes da PK7, operei o marketing por dentro de empresas como V4 Company, Five Franchising, Loupen, Agência ACCO e Pereira Luz e Cor. '
         '<a href="/pedro-r-gomes/">Conheça o Pedro</a> · <a href="/cases/">veja os cases</a>.</p></div></section>')


def cards(items, cols=3):
    return f'<div class="grid g{cols}">' + ''.join(f'<div class="card"><h3>{t}</h3><p>{p}</p></div>' for t, p in items) + '</div>'


def sec(kicker, h2, inner, intro=''):
    ip = '<p style="max-width:780px;margin-bottom:22px">' + intro + '</p>' if intro else ''
    return f'<section><div class="wrap"><span class="kicker">{kicker}</span><h2>{h2}</h2>{ip}{inner}</div></section>'


def hero(h1, lead, msg, ghost=('/cases/', 'Ver cases')):
    return (f'<div class="wrap hero"><h1>{h1}</h1><p class="lead">{lead}</p><div class="ctas"><a class="btn" href="{wa(msg)}" rel="noopener">Diagnóstico gratuito</a>'
            f'<a class="btn ghost" href="{ghost[0]}">{ghost[1]}</a></div></div>')


PAGES = []

# ------------------------------------------------------------------ 1. Tráfego pago em Goiânia
p = '/trafego-pago-goiania/'
msg = 'Olá, Pedro! Vim pela página de tráfego pago em Goiânia e quero agendar meu diagnóstico gratuito.'
title = 'Tráfego pago em Goiânia: Meta Ads e Google Ads que vendem | PK7'
desc = 'Gestão de tráfego pago em Goiânia e região com Pedro R Gomes (PK7): Meta Ads e Google Ads ligados a pixel, remarketing, IA no WhatsApp e painel do anúncio ao contrato. Diagnóstico gratuito.'
faq = [
    ('Quanto tempo leva para o tráfego pago dar resultado?', 'Na primeira semana a estrutura entra no ar (pixel, conversões, oferta e atendimento). Os primeiros contatos chegam logo que as campanhas rodam, e a campanha costuma estabilizar entre 30 e 45 dias, quando o funil inteiro fica mensurável.'),
    ('Preciso ter site para anunciar?', 'Não necessariamente. Muitos negócios de Goiânia vendem direto pelo WhatsApp, e a campanha pode levar para a conversa. Quando faz diferença, montamos uma página de captura rápida e com pixel, ligada ao mesmo funil.'),
    ('Você atende presencialmente em Goiânia?', 'Sim. Diagnóstico, kick-off e reuniões de resultado podem ser presenciais em Goiânia, Aparecida de Goiânia e região. O dia a dia é pelo WhatsApp e por vídeo.'),
    ('Qual é a verba mínima para anunciar?', 'Depende do nicho, da concorrência e da meta. Dá para começar com uma verba enxuta e aumentar quando o custo por cliente estiver claro. Eu defino isso com você no diagnóstico, com números do seu negócio.'),
    ('Tem fidelidade?', 'Não tem fidelidade longa. Anúncios e acompanhamento são mensais, com contrato simples. Automação e sistemas são projetos com escopo fechado.'),
    ('A conta de anúncios fica no nome de quem?', 'No nome da sua empresa. Você é dono da conta, do pixel e dos dados. Se um dia a gente parar, tudo continua seu.'),
]
body = hero('Tráfego pago em Goiânia que vira venda, não só clique',
            'Sou o Pedro R Gomes, da PK7. Cuido do tráfego pago (Meta Ads e Google Ads) de empresas de Goiânia e região, com atendimento presencial. '
            'Por trás do anúncio monto a máquina de vendas inteira: oferta, pixel, remarketing, atendimento com IA no WhatsApp e um painel que mostra do anúncio ao contrato.', msg)
body += sec('O problema', 'Por que tanto anúncio em Goiânia não vende', '<div class="prose">'
            '<p>O anúncio quase sempre funciona: ele traz gente. O dinheiro vaza depois. Nas contas que analiso, o vazamento costuma estar em quatro lugares:</p>'
            '<ul><li><strong>Sem pixel bem configurado:</strong> o Meta e o Google não sabem quem comprou, então otimizam para clique, não para cliente.</li>'
            '<li><strong>Sem remarketing:</strong> quem visitou, clicou ou chamou e não fechou some para sempre.</li>'
            '<li><strong>Sem atendimento rápido:</strong> o lead manda mensagem às 23h ou no horário de almoço e compra de quem respondeu primeiro.</li>'
            '<li><strong>Sem oferta clara:</strong> o anúncio é bonito, mas não dá um motivo para a pessoa agir agora.</li></ul>'
            '<p>Por isso eu não vendo só gestão de anúncio. Entenda o raciocínio completo em <a href="/blog/por-que-o-trafego-pago-nao-vende/">por que o tráfego pago não vende</a>.</p></div>')
body += sec('O que está incluído', 'Tráfego pago com a estrutura inteira', cards([
    ('Estratégia e oferta', 'Público, oferta e mensagem pensados para quem compra em Goiânia, não para quem só curte.'),
    ('Meta Ads', 'Campanhas no Instagram e no Facebook, com criativos que testamos toda semana e verba realocada para o que vende.'),
    ('Google Ads', 'Rede de Pesquisa para quem já está procurando o seu serviço, campanhas locais e YouTube quando fizer sentido.'),
    ('Pixel e conversões', 'Pixel, API de conversões e eventos configurados, para o algoritmo aprender com quem virou cliente.'),
    ('Remarketing', 'Anúncios para quem visitou, clicou ou chamou e ainda não fechou, com mensagem diferente para cada etapa.'),
    ('Atendimento com IA e painel', 'Agente de <a href="/ia-whatsapp-goiania/">IA no WhatsApp</a> que responde em segundos e um painel do anúncio ao contrato assinado.')]))
body += sec('Para quem é', 'Negócios de Goiânia que vendem por conversa',
            '<div class="chips"><span>Clínicas e consultórios</span><span>Imobiliárias e construtoras</span><span>Franquias e redes</span><span>Escolas e cursos</span>'
            '<span>Serviços e B2B</span><span>Comércio e e-commerce</span><span>Estética e bem-estar</span><span>Advocacia e contabilidade</span></div>',
            'Se a sua venda fecha no WhatsApp, numa ligação ou numa reunião, a máquina encaixa. Atendo Goiânia, Aparecida de Goiânia e a região metropolitana presencialmente, e o resto do Brasil online.')
body += sec('Como funciona', 'Do diagnóstico às campanhas no ar', cards([
    ('1 · Diagnóstico gratuito', '30 minutos, presencial em Goiânia ou por vídeo. Olho seus anúncios, seu atendimento e onde o cliente está se perdendo.'),
    ('2 · Estrutura', 'Na primeira semana entram pixel, conversões, oferta, página ou WhatsApp e o atendimento com IA.'),
    ('3 · Campanhas e otimização', 'Campanhas no ar, testes semanais de criativo e reunião mensal de resultado, com o número de clientes, não de curtidas.')]))
body += sec('Investimento', 'Quanto custa tráfego pago em Goiânia', '<div class="prose"><p>São duas partes: a <strong>gestão</strong> (o meu trabalho) e a <strong>verba de anúncio</strong>, que vai direto para o Meta e o Google, no cartão da sua empresa. '
            'A gestão é mensal, sem fidelidade longa, e o valor depende do escopo: só anúncios ou a máquina inteira, com IA e automação. Explico os valores de mercado e como calcular a verba no guia '
            '<a href="/blog/quanto-custa-trafego-pago-goiania/">quanto custa tráfego pago em Goiânia</a>.</p></div>')
body += PROVA
body += sec('Perguntas frequentes', 'Tráfego pago em Goiânia: dúvidas comuns', faq_html(faq))
body += cta(msg)
graph = [webpage_ld(p, 'Tráfego pago em Goiânia', desc),
         service_ld(p, 'Gestão de tráfego pago em Goiânia', 'Gestão de tráfego pago (Meta Ads e Google Ads)', ['Goiânia', 'Aparecida de Goiânia'], desc),
         faq_ld(p, faq)]
PAGES.append((p, page(p, title, desc, body, graph, [('/', 'Início'), (p, 'Tráfego pago em Goiânia')])))

# ------------------------------------------------------------------ 2. Gestor de tráfego em Goiânia
p = '/gestor-de-trafego-goiania/'
msg = 'Olá, Pedro! Vim pela página de gestor de tráfego em Goiânia e quero agendar meu diagnóstico gratuito.'
title = 'Gestor de tráfego em Goiânia: Pedro R Gomes (PedroK Ads) | PK7'
desc = 'Gestor de tráfego em Goiânia com 7 anos de mídia paga, +40 clientes e +R$ 500 mil faturados na Appmax. Você fala direto com quem opera seus anúncios no Meta e no Google.'
faq = [
    ('O que faz um gestor de tráfego?', 'Planeja, cria e otimiza os anúncios pagos da empresa no Meta (Instagram e Facebook) e no Google: público, verba, criativos, testes e mensuração. O bom gestor mede venda, não clique.'),
    ('Qual a diferença entre um gestor de tráfego e uma agência?', 'Com um gestor você fala com quem opera a conta. Na agência, muitas vezes quem vende o contrato não é quem cuida da sua conta. Na PK7 você fala direto comigo e eu monto o time de especialistas que o projeto pede.'),
    ('Você atende só Goiânia?', 'Atendo presencialmente em Goiânia e região e no oeste e centro da Bahia, com parceiros locais. Online, atendo todo o Brasil, a América do Norte e a Europa.'),
    ('Como sei se um gestor de tráfego é bom?', 'Peça cases com números de venda, confirme que a conta de anúncios fica no nome da sua empresa, pergunte como ele configura o pixel e o remarketing e desconfie de quem promete resultado garantido.'),
]
body = hero('Gestor de tráfego em Goiânia: você fala direto com quem opera',
            'Sou o Pedro R Gomes, o PedroK Ads. Há 7 anos opero mídia paga no Meta e no Google, com mais de 40 clientes e mais de R$ 500 mil faturados na Appmax. '
            'Em Goiânia atendo presencialmente, e quem cuida da sua conta sou eu, não um gerente de conta.', msg, ('/pedro-r-gomes/', 'Conheça o Pedro'))
body += sec('O que eu faço', 'Gestão de tráfego que olha para o contrato, não para o clique', cards([
    ('Planejamento', 'Meta de clientes, custo que o negócio aguenta pagar por cliente e verba distribuída entre Meta e Google.'),
    ('Operação semanal', 'Testes de criativo, público e oferta toda semana. A verba vai para o que vende e sai do que só dá clique.'),
    ('Mensuração', 'Pixel, API de conversões, eventos e UTM. Cada contato tem origem conhecida, do anúncio ao contrato.'),
    ('Remarketing', 'Mensagens diferentes para quem viu, clicou ou chamou e ainda não fechou.'),
    ('Atendimento', 'Quando o gargalo é a resposta, o lead é atendido em segundos pela <a href="/ia-whatsapp-goiania/">IA no WhatsApp</a>.'),
    ('Reunião de resultado', 'Uma vez por mês, com o número que importa: quantos clientes vieram e quanto custou cada um.')]))
body += sec('Comparação', 'Freelancer, agência ou PK7?', '<table class="cmp"><thead><tr><th></th><th>Agência tradicional</th><th>Comigo e meu time</th></tr></thead><tbody>'
            '<tr><td>Com quem você fala</td><td>Vendedor na venda, outra pessoa depois</td><td>Direto comigo, antes e depois de fechar</td></tr>'
            '<tr><td>Como é o plano</td><td>Pacote pronto, igual para todo cliente</td><td>Sob medida para o gargalo da sua operação</td></tr>'
            '<tr><td>O que é medido</td><td>Cliques, alcance e relatório bonito</td><td>Do anúncio ao contrato assinado</td></tr>'
            '<tr><td>Como é o contrato</td><td>Fidelidade longa, com ou sem resultado</td><td>Mensal ou projeto fechado, sem fidelidade longa</td></tr></tbody></table>'
            '<p style="margin-top:16px">Quer o raciocínio completo? Leia <a href="/blog/gestor-de-trafego-ou-agencia/">gestor de tráfego ou agência: qual contratar</a>.</p>')
body += sec('Antes de contratar', 'Checklist para escolher um gestor de tráfego em Goiânia', '<div class="prose"><ol>'
            '<li>A conta de anúncios, o pixel e os dados ficam no nome da sua empresa.</li>'
            '<li>Ele mostra cases com número de venda, não só print de alcance.</li>'
            '<li>Ele explica como configura pixel, conversões e remarketing.</li>'
            '<li>Ele pergunta como você atende o lead, porque anúncio sem atendimento é dinheiro jogado fora.</li>'
            '<li>O contrato é simples, sem fidelidade longa.</li>'
            '<li>Você sabe exatamente quem vai operar a sua conta.</li></ol></div>')
body += PROVA
body += sec('Perguntas frequentes', 'Gestor de tráfego: dúvidas comuns', faq_html(faq))
body += cta(msg)
graph = [webpage_ld(p, 'Gestor de tráfego em Goiânia', desc, about='#pedro'),
         service_ld(p, 'Gestor de tráfego em Goiânia', 'Gestão de tráfego pago', ['Goiânia', 'Aparecida de Goiânia'], desc), faq_ld(p, faq)]
PAGES.append((p, page(p, title, desc, body, graph, [('/', 'Início'), (p, 'Gestor de tráfego em Goiânia')])))

# ------------------------------------------------------------------ 3. IA no WhatsApp em Goiânia
p = '/ia-whatsapp-goiania/'
msg = 'Olá, Pedro! Vim pela página de IA no WhatsApp e quero entender como funcionaria na minha empresa.'
title = 'IA no WhatsApp para empresas em Goiânia: atendimento 24h | PK7'
desc = 'Agente de IA no WhatsApp para empresas de Goiânia: responde em segundos, 24h, qualifica o contato e agenda a reunião sozinho. Implantação e acompanhamento com Pedro R Gomes (PK7).'
faq = [
    ('A IA vai inventar informação para o meu cliente?', 'Ela é treinada só com as informações que você aprova (serviços, preços, horários, regras) e tem instruções do que não pode responder. Quando a pergunta foge do roteiro ou o cliente pede, a conversa passa para uma pessoa do seu time.'),
    ('Funciona com o número que eu já uso?', 'Depende de como o número está hoje. Para automação séria, o caminho é a plataforma oficial do WhatsApp para empresas. Avalio o seu caso no diagnóstico e te digo a opção mais segura.'),
    ('Preciso fazer tráfego pago junto?', 'Não. A IA atende quem já chega pelo Instagram, pelo Google ou por indicação. Mas ela rende mais quando o tráfego traz volume, porque nenhum contato fica sem resposta.'),
    ('Em quanto tempo fica pronto?', 'As primeiras respostas automáticas costumam rodar na primeira semana. Depois ajustamos com conversas reais até a IA falar do jeito da sua marca.'),
    ('E a LGPD?', 'O atendimento coleta só os dados necessários para atender e agendar, com aviso ao cliente. Os dados ficam no seu CRM, sob controle da sua empresa.'),
]
body = hero('IA no WhatsApp para empresas de Goiânia: atende em segundos, 24h',
            'O lead que manda mensagem às 23h, no horário de almoço ou no domingo compra de quem responde primeiro. '
            'Eu implanto um agente de IA no seu WhatsApp que responde em segundos, conversa como a sua marca, separa curioso de comprador e agenda a reunião sozinho. O seu time só entra para fechar.', msg)
body += sec('O que a IA faz', 'Um atendente que não dorme, não esquece e não demora', cards([
    ('Responde na hora', 'Em segundos, a qualquer hora, com as informações que você aprovou: serviços, preços, horários e formas de pagamento.'),
    ('Qualifica', 'Faz as perguntas certas e separa quem está pesquisando de quem quer comprar agora.'),
    ('Agenda', 'Marca a avaliação, a visita ou a reunião direto na agenda, antes de o lead esfriar.'),
    ('Passa para o humano', 'Quando é hora de fechar, ou quando o cliente pede, a conversa vai para o seu time com o resumo pronto.'),
    ('Registra tudo', 'Cada conversa vira um registro no CRM, com origem: anúncio, Google, Instagram ou indicação.'),
    ('Reativa', 'Chama de volta quem parou de responder ou quem já comprou e pode comprar de novo.')]))
body += sec('Para quem é', 'Onde a IA no WhatsApp mais faz diferença',
            '<div class="chips"><span>Clínicas e consultórios</span><span>Imobiliárias</span><span>Escolas e cursos</span><span>Estética</span><span>Oficinas e serviços</span><span>Restaurantes e delivery</span><span>Indústria e distribuidores</span><span>B2B</span></div>',
            'Negócios de Goiânia que recebem muita mensagem repetida ("tem horário?", "quanto custa?", "onde fica?") e perdem cliente por demora.')
body += sec('Como implanto', 'Do roteiro ao agente no ar', cards([
    ('1 · Mapeamento', 'Levantamos as perguntas que mais chegam, as regras do seu negócio e o que a IA nunca pode prometer.'),
    ('2 · Treino e tom de voz', 'A IA aprende o seu jeito de falar e as suas informações. Você aprova antes de ir ao ar.'),
    ('3 · No ar e ajustes', 'As primeiras respostas rodam na primeira semana. Depois ajustamos com conversas reais e acompanhamos todo mês.')]))
body += ('<section><div class="wrap"><div class="box lime"><p><strong>IA não substitui o seu vendedor.</strong> Ela tira dele o trabalho repetitivo e entrega o lead quente, na hora certa. '
         'Junto com o <a href="/trafego-pago-goiania/">tráfego pago</a>, é a parte da máquina que garante que nenhum contato pago fique sem resposta.</p></div></div></section>')
body += PROVA
body += sec('Perguntas frequentes', 'IA no WhatsApp: dúvidas comuns', faq_html(faq))
body += cta(msg, h='Quer ver como ficaria no seu WhatsApp?', p='No diagnóstico gratuito eu mostro o que dá para automatizar primeiro no seu atendimento.')
graph = [webpage_ld(p, 'IA no WhatsApp para empresas em Goiânia', desc),
         service_ld(p, 'Agente de IA no WhatsApp para empresas', 'Automação de atendimento com inteligência artificial no WhatsApp', ['Goiânia', 'Aparecida de Goiânia'], desc), faq_ld(p, faq)]
PAGES.append((p, page(p, title, desc, body, graph, [('/', 'Início'), (p, 'IA no WhatsApp em Goiânia')])))

# ------------------------------------------------------------------ 4. Agência de marketing digital em Goiânia
p = '/agencia-de-marketing-digital-goiania/'
msg = 'Olá, Pedro! Vim pela página de agência de marketing em Goiânia e quero agendar meu diagnóstico gratuito.'
title = 'Agência de marketing digital em Goiânia? Conheça o modelo PK7'
desc = 'Procurando agência de marketing digital em Goiânia? A PK7 entrega tráfego pago, IA no WhatsApp, automação, sites e SEO com um responsável só: você fala direto com Pedro R Gomes.'
faq = [
    ('A PK7 é uma agência?', 'Não no modelo tradicional. Eu, Pedro R Gomes, lidero cada projeto e monto um time de especialistas independentes (tráfego, IA, automação, SEO, design) conforme o que o seu negócio precisa. Você fala direto comigo.'),
    ('Quais serviços vocês fazem?', 'Tráfego pago no Meta e no Google, IA no WhatsApp, automação e CRM, sites, lojas e sistemas sob medida, SEO local e presença no Google e nas IAs, identidade visual e estratégia.'),
    ('Atende empresas fora de Goiânia?', 'Sim. Presencialmente em Goiânia e região e no oeste e centro da Bahia; online no Brasil inteiro, na América do Norte e na Europa.'),
]
body = hero('Procurando agência de marketing digital em Goiânia? Conheça o modelo sem agência',
            'Se você já contratou agência, conhece o roteiro: vendedor brilhante na reunião, pacote igual ao de todo mundo e relatório bonito no lugar de vendas. '
            'Na PK7 você tem o marketing completo com um responsável só: eu lidero, e um time de especialistas executa o que o seu gargalo pede.', msg, ('/servicos/', 'Ver serviços'))
body += sec('O que você encontra aqui', 'Tudo que uma agência faz, ligado a um funil só', cards([
    ('Tráfego pago', '<a href="/trafego-pago-goiania/">Meta Ads e Google Ads</a> medidos pelo contrato, não pelo clique.'),
    ('IA no WhatsApp', '<a href="/ia-whatsapp-goiania/">Atendimento em segundos, 24h</a>, que qualifica e agenda.'),
    ('Automação e CRM', 'Um funil só, do anúncio ao contrato, com número confiável.'),
    ('Sites e sistemas', 'Sites, lojas e sistemas sob medida, ligados ao mesmo funil.'),
    ('Google e IAs', 'SEO local, Perfil da Empresa no Google e presença no ChatGPT e no Gemini.'),
    ('Marca', 'Identidade visual e posicionamento em nível profissional.')]))
body += sec('Por que não sou agência', 'O problema é o incentivo do modelo', '<div class="prose"><p>A agência tradicional ganha quando fecha o contrato, não quando você vende. Por isso o comercial costuma ser impecável e o pós-venda some: você vira mais um cliente no mesmo pacote de sempre.</p>'
            '<p>Eu trabalho do jeito oposto: diagnóstico antes da proposta, plano sob medida para o gargalo da sua operação e reunião de resultado com o número que importa. Sem fidelidade longa. Leia também <a href="/blog/gestor-de-trafego-ou-agencia/">gestor de tráfego ou agência: qual contratar</a>.</p></div>')
body += PROVA
body += sec('Perguntas frequentes', 'Agência de marketing em Goiânia: dúvidas comuns', faq_html(faq))
body += cta(msg)
graph = [webpage_ld(p, 'Agência de marketing digital em Goiânia: o modelo PK7', desc), faq_ld(p, faq)]
PAGES.append((p, page(p, title, desc, body, graph, [('/', 'Início'), (p, 'Agência de marketing digital em Goiânia')])))


# ------------------------------------------------------------------ 5 e 6. Oeste baiano
def bahia(p, city, short, h1, lead, about, niches, faq_extra, title, desc):
    msg = f'Olá, Pedro! Vim pela página de tráfego pago em {city} e quero agendar meu diagnóstico gratuito.'
    faq = [
        (f'Você atende presencialmente em {city}?', f'Sim, com parceiros locais no oeste baiano e visitas minhas aos clientes da região. O dia a dia é pelo WhatsApp e por vídeo, como com os clientes de Goiânia.'),
        ('Dá para anunciar só para a minha cidade?', f'Dá. No Meta e no Google a campanha pode mirar um raio em volta do seu negócio, só {short} ou {short} e as cidades vizinhas, conforme onde estão os seus clientes.'),
        ('Tem fidelidade?', 'Não tem fidelidade longa. Anúncios e acompanhamento são mensais, com contrato simples.'),
    ] + faq_extra
    body = hero(h1, lead, msg)
    body += sec(f'Por que {short}', about[0], f'<div class="prose">{about[1]}</div>')
    body += sec('O que está incluído', 'A máquina de vendas inteira, não só o anúncio', cards([
        ('Meta Ads e Google Ads', f'Campanhas no Instagram, no Facebook e no Google para quem está em {short} e na região.'),
        ('Pixel e remarketing', 'Quem visitou, clicou ou chamou e não fechou volta a ver a sua oferta.'),
        ('IA no WhatsApp', '<a href="/ia-whatsapp-goiania/">Atendimento em segundos, 24h</a>, que qualifica e agenda.'),
        ('Perfil da Empresa no Google', f'Para aparecer no mapa quando alguém procura o seu serviço em {short}.'),
        ('Painel', 'Do anúncio ao contrato, num número só.'),
        ('Reunião de resultado', 'Uma vez por mês, com o número de clientes e o custo de cada um.')]))
    body += sec('Para quem é', f'Negócios de {short} que vendem por conversa', '<div class="chips">' + ''.join(f'<span>{n}</span>' for n in niches) + '</div>')
    body += PROVA
    body += sec('Perguntas frequentes', f'Tráfego pago em {city}: dúvidas comuns', faq_html(faq))
    body += cta(msg)
    graph = [webpage_ld(p, f'Tráfego pago em {city}', desc),
             service_ld(p, f'Gestão de tráfego pago em {city}', 'Gestão de tráfego pago (Meta Ads e Google Ads)', [city], desc), faq_ld(p, faq)]
    PAGES.append((p, page(p, title, desc, body, graph, [('/', 'Início'), ('/atendimento/', 'Onde atendo'), (p, f'Tráfego pago em {city}')])))


bahia('/trafego-pago-barreiras/', 'Barreiras', 'Barreiras',
      'Tráfego pago em Barreiras (BA): anúncios que trazem cliente do oeste baiano',
      'Cuido do tráfego pago (Meta Ads e Google Ads) de empresas de Barreiras, com atendimento presencial com parceiros locais e a máquina de vendas inteira por trás do anúncio: pixel, remarketing, IA no WhatsApp e painel do anúncio ao contrato.',
      ('Barreiras compra pelo Instagram e pelo WhatsApp',
       '<p>Barreiras é o polo de comércio e serviços do oeste baiano: gente de toda a região vem para a cidade consultar, estudar, comprar e contratar. E essa decisão começa no celular, numa busca no Google ou num anúncio no Instagram, e termina numa conversa no WhatsApp.</p>'
       '<p>Quem aparece primeiro e responde mais rápido leva o cliente. Muita empresa ainda anuncia sem pixel, sem remarketing e sem ninguém respondendo à noite. É aí que está a vantagem para quem estrutura a máquina primeiro.</p>'),
      ['Clínicas e consultórios', 'Escolas e faculdades', 'Imobiliárias e loteamentos', 'Comércio e varejo', 'Serviços para o agro', 'Estética e bem-estar', 'Restaurantes', 'Serviços e B2B'],
      [('Atende Luís Eduardo Magalhães também?', 'Sim. Veja a página de <a href="/trafego-pago-luis-eduardo-magalhaes/">tráfego pago em Luís Eduardo Magalhães</a>.')],
      'Tráfego pago em Barreiras (BA): Meta Ads e Google Ads | PK7',
      'Gestão de tráfego pago em Barreiras e no oeste baiano: Meta Ads, Google Ads, pixel, remarketing e IA no WhatsApp, com atendimento presencial com parceiros locais. Diagnóstico gratuito.')

bahia('/trafego-pago-luis-eduardo-magalhaes/', 'Luís Eduardo Magalhães', 'LEM',
      'Tráfego pago em Luís Eduardo Magalhães (LEM): anúncios para a capital do agro',
      'Cuido do tráfego pago (Meta Ads e Google Ads) de empresas de Luís Eduardo Magalhães, com atendimento presencial com parceiros locais. Por trás do anúncio monto a máquina de vendas inteira: pixel, remarketing, IA no WhatsApp e painel do anúncio ao contrato.',
      ('LEM cresce rápido, e a concorrência também',
       '<p>Luís Eduardo Magalhães é um dos polos do agronegócio do país, com empresas que vendem para produtores, revendas e para a população que não para de chegar à cidade. Muita venda ali é de ticket alto e decidida em conversa: uma visita, uma proposta, um WhatsApp.</p>'
       '<p>Para esse tipo de venda, anúncio sozinho não resolve. O que funciona é a combinação de público certo, remarketing para quem demonstrou interesse e atendimento rápido, inclusive fora do horário comercial. É isso que eu monto.</p>'),
      ['Revendas e serviços para o agro', 'Máquinas e implementos', 'Imobiliárias e loteamentos', 'Construção e acabamento', 'Clínicas e consultórios', 'Escolas e cursos', 'Comércio e varejo', 'Serviços e B2B'],
      [('Atende Barreiras também?', 'Sim. Veja a página de <a href="/trafego-pago-barreiras/">tráfego pago em Barreiras</a>.')],
      'Tráfego pago em Luís Eduardo Magalhães (LEM) | PK7',
      'Gestão de tráfego pago em Luís Eduardo Magalhães (LEM): Meta Ads, Google Ads, remarketing e IA no WhatsApp para empresas do agro e do comércio. Atendimento presencial com parceiros locais.')
