#!/usr/bin/env python3
"""Gera as páginas locais e o blog no repositório do site e atualiza cabeçalho/rodapé das páginas existentes,
o sitemap e o llms.txt.  uso: python3 build.py /caminho/pedrok-ads-lp"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from layout import header, footer, EXTRA_CSS, SITE
import pages_local, pages_blog

ROOT = sys.argv[1]
DATE = '2026-11-23'
new = pages_local.PAGES + pages_blog.PAGES
for path, html in new:
    d = os.path.join(ROOT, path.strip('/'))
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
print('geradas', len(new))

# páginas internas existentes: mesmo cabeçalho, rodapé, CSS do rodapé e medição
for path in ['/pedro-r-gomes/', '/servicos/', '/cases/', '/atendimento/']:
    f = os.path.join(ROOT, path.strip('/'), 'index.html'); s = open(f, encoding='utf-8').read()
    s = re.sub(r'<header class="top">.*?</header>', lambda m: header(path), s, count=1, flags=re.S)
    s = re.sub(r'<footer>.*?</footer>', lambda m: footer(), s, count=1, flags=re.S)
    if 'footer .cols{grid-template-columns:2fr 1fr 1.2fr 1.4fr}' not in s:
        s = s.replace('</style>', EXTRA_CSS + '</style>', 1)
    if '/assets/js/pk7.js' not in s:
        s = s.replace('</head>', '<script src="/assets/js/pk7.js" defer></script>\n</head>', 1)
    s = re.sub(r'"dateModified": "[^"]*"', f'"dateModified": "{DATE}T12:00:00-03:00"', s)
    open(f, 'w', encoding='utf-8').write(s)

# onde atendo: liga as cidades às páginas locais
f = os.path.join(ROOT, 'atendimento', 'index.html'); s = open(f, encoding='utf-8').read()
s = s.replace('<h3>Goiânia e região (GO)</h3>', '<h3><a href="/trafego-pago-goiania/">Goiânia e região (GO)</a></h3>', 1)
s = s.replace('<h3>Bahia: Luís Eduardo Magalhães, Barreiras e Itaberaba</h3>',
              '<h3>Bahia: <a href="/trafego-pago-luis-eduardo-magalhaes/">Luís Eduardo Magalhães</a>, <a href="/trafego-pago-barreiras/">Barreiras</a> e Itaberaba</h3>', 1)
open(f, 'w', encoding='utf-8').write(s)

# sitemap
old = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
imgs = {m.group(1): m.group(0) for m in re.finditer(r'<url>\s*<loc>([^<]+)</loc>.*?</url>', old, re.S)}
urls = ['/', '/pedro-r-gomes/', '/servicos/', '/trafego-pago-goiania/', '/gestor-de-trafego-goiania/', '/ia-whatsapp-goiania/',
        '/agencia-de-marketing-digital-goiania/', '/trafego-pago-barreiras/', '/trafego-pago-luis-eduardo-magalhaes/', '/cases/',
        '/atendimento/', '/blog/'] + [p['path'] for p in pages_blog.POSTS]
out = []
for u in urls:
    loc = SITE + u
    if loc in imgs:
        out.append(re.sub(r'<lastmod>[^<]*</lastmod>', f'<lastmod>{DATE}</lastmod>', imgs[loc]))
    else:
        out.append(f'<url><loc>{loc}</loc><lastmod>{DATE}</lastmod></url>')
head = old[:old.find('<url>')]
open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(head + '\n'.join(out) + '\n</urlset>\n')
print('sitemap', len(urls), 'URLs')

# llms.txt: seção de páginas
f = os.path.join(ROOT, 'llms.txt'); s = open(f, encoding='utf-8').read()
block = ('## Páginas\n'
         '- Início: https://www.pk7.com.br/\n- Quem é Pedro R Gomes: https://www.pk7.com.br/pedro-r-gomes/\n- Serviços: https://www.pk7.com.br/servicos/\n'
         '- Tráfego pago em Goiânia: https://www.pk7.com.br/trafego-pago-goiania/\n- Gestor de tráfego em Goiânia: https://www.pk7.com.br/gestor-de-trafego-goiania/\n'
         '- IA no WhatsApp para empresas em Goiânia: https://www.pk7.com.br/ia-whatsapp-goiania/\n'
         '- Agência de marketing digital em Goiânia (modelo PK7): https://www.pk7.com.br/agencia-de-marketing-digital-goiania/\n'
         '- Tráfego pago em Barreiras (BA): https://www.pk7.com.br/trafego-pago-barreiras/\n- Tráfego pago em Luís Eduardo Magalhães (BA): https://www.pk7.com.br/trafego-pago-luis-eduardo-magalhaes/\n'
         '- Cases: https://www.pk7.com.br/cases/\n- Onde atendo: https://www.pk7.com.br/atendimento/\n- Blog: https://www.pk7.com.br/blog/\n'
         + ''.join(f'- {p["title"]}: {SITE}{p["path"]}\n' for p in pages_blog.POSTS))
s = re.sub(r'## Páginas\n(?:- .*\n?)*', '', s).rstrip() + '\n\n' + block
s = s.replace('- 7 anos operando mídia paga; mais de 40 clientes atendidos; clientes em 3 continentes',
              '- 7 anos operando mídia paga; mais de 40 clientes atendidos; clientes em 3 continentes\n- Atendimento presencial em Goiânia e região e no oeste e centro da Bahia (Luís Eduardo Magalhães, Barreiras, Itaberaba); online no Brasil, América do Norte e Europa')
s = s.replace('- Mais de R$ 500 mil faturados em e-commerce próprio (parceiro Appmax)', '- Mais de R$ 500 mil faturados na Appmax, com diversas premiações')
open(f, 'w', encoding='utf-8').write(s)
print('llms.txt ok')
