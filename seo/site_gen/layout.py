"""Layout compartilhado das páginas internas do pk7.com.br (cabeçalho, rodapé, schema, WhatsApp por página)."""
import json, os, urllib.parse

SITE = 'https://www.pk7.com.br'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE_CSS = open(os.path.join(HERE, 'base.css'), encoding='utf-8').read()
EXTRA_CSS = """
footer .cols{grid-template-columns:2fr 1fr 1.2fr 1.4fr}
@media (max-width:860px){footer .cols{grid-template-columns:1fr}}
.prose{max-width:780px}
.prose h2{margin:44px 0 14px}
.prose h3{margin:26px 0 8px;text-transform:none;letter-spacing:-.01em;font-size:22px}
.prose p,.prose li{font-size:18px;line-height:1.7;color:#3b4060}
.prose p+p{margin-top:14px}
.prose ul,.prose ol{padding-left:24px;margin-top:12px;display:grid;gap:8px}
.prose a,.card a,.lead a{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
.prose strong{color:var(--navy)}
.box{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px 26px;margin-top:22px}
.box.lime{background:#F3FBD6;border-color:#DCEB9C}
.faq{display:grid;gap:12px;max-width:860px}
.faq details{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px 22px}
.faq summary{font-weight:700;font-size:18px;cursor:pointer;color:var(--navy);list-style-position:outside}
.faq details p{margin-top:10px;font-size:17px}
.meta{font-size:15px;color:var(--muted);margin-top:14px}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.chips span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-size:15px;font-weight:600;color:var(--navy)}
.posts{display:grid;gap:18px}
.posts a.card{text-decoration:none}
.posts a.card h3{text-transform:none;font-size:24px;letter-spacing:-.01em}
"""
NAV = [('/pedro-r-gomes/', 'Pedro R Gomes'), ('/servicos/', 'Serviços'), ('/trafego-pago-goiania/', 'Tráfego em Goiânia'),
       ('/cases/', 'Cases'), ('/blog/', 'Blog'), ('/atendimento/', 'Onde atendo')]
LOCAL = [('/trafego-pago-goiania/', 'Tráfego pago em Goiânia'), ('/gestor-de-trafego-goiania/', 'Gestor de tráfego em Goiânia'),
         ('/ia-whatsapp-goiania/', 'IA no WhatsApp em Goiânia'), ('/agencia-de-marketing-digital-goiania/', 'Agência de marketing em Goiânia'),
         ('/trafego-pago-barreiras/', 'Tráfego pago em Barreiras'), ('/trafego-pago-luis-eduardo-magalhaes/', 'Tráfego pago em LEM')]
WA_DEFAULT = 'Olá, Pedro! Vim pelo site e quero agendar meu diagnóstico gratuito.'


def wa(msg=WA_DEFAULT, num='5562993684568'):
    return f'https://wa.me/{num}?text=' + urllib.parse.quote(msg, safe='')


def header(path):
    nav = ''.join(f'<a href="{h}"' + (' aria-current="page"' if h == path else '') + f'>{t}</a>' for h, t in NAV)
    return (f'<header class="top"><div class="wrap"><a class="brand" href="/">PEDRO R GOMES | PK7</a><nav aria-label="Páginas">{nav}</nav>'
            f'<a class="btn" href="{wa()}" rel="noopener">Falar no WhatsApp</a></div></header>')


def footer():
    nav = ''.join(f'<a href="{h}">{t}</a>' for h, t in [('/', 'Início')] + NAV)
    loc = ''.join(f'<a href="{h}">{t}</a>' for h, t in LOCAL)
    return ('<footer><div class="wrap cols">\n'
            '<div><div class="t">PK7 · Pedro R Gomes (PedroK Ads)</div><p>Tráfego pago, IA no WhatsApp e automação de vendas. Presencial em Goiânia e região e no oeste e centro da Bahia; online no Brasil e em 3 continentes.</p></div>\n'
            f'<div><div class="t">Navegue</div>{nav}</div>\n'
            f'<div><div class="t">Atendimento</div>{loc}</div>\n'
            f'<div><div class="t">Contato</div><a href="{wa()}" rel="noopener">WhatsApp Brasil · +55 62 99368-4568</a>'
            f'<a href="{wa(num="31685412747")}" rel="noopener">WhatsApp Europa · +31 6 85412747</a><a href="mailto:pedrokadsmktt@gmail.com">pedrokadsmktt@gmail.com</a>'
            '<a href="https://www.instagram.com/pedrok.ads" rel="me noopener">Instagram @pedrok.ads</a><a href="https://www.linkedin.com/in/pedrorgomes-pk7/" rel="me noopener">LinkedIn</a></div>\n'
            '</div></footer>')


def crumbs_html(trail):
    out = []
    for i, (u, n) in enumerate(trail):
        out.append(n if i == len(trail) - 1 else f'<a href="{u}">{n}</a>')
    return '<div class="wrap crumbs">' + ' › '.join(out) + '</div>'


def breadcrumb_ld(path, trail):
    return {"@type": "BreadcrumbList", "@id": SITE + path + "#breadcrumb",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (u, n) in enumerate(trail)]}


def faq_html(faq):
    return '<div class="faq">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faq) + '</div>'


def faq_ld(path, faq):
    import re
    strip = lambda h: re.sub(r'<[^>]+>', '', h)
    return {"@type": "FAQPage", "@id": SITE + path + "#faq",
            "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faq]}


def page(path, title, desc, body, graph, trail):
    url = SITE + path
    ld = {"@context": "https://schema.org", "@graph": [breadcrumb_ld(path, trail)] + graph}
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="PK7 · Pedro R Gomes">
<meta property="og:url" content="{url}"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/assets/og-pedro-r-gomes-pk7.jpg"><meta property="og:image:alt" content="Pedro R Gomes (PedroK Ads), fundador da PK7">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{SITE}/assets/og-pedro-r-gomes-pk7.jpg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/fonts/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<style>{BASE_CSS}{EXTRA_CSS}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script src="/assets/js/pk7.js" defer></script>
</head><body>
{header(path)}
<main>
{crumbs_html(trail)}
{body}
</main>
{footer()}
</body></html>
"""


def cta(msg, h='Vamos ligar a sua máquina de vendas?', p='Diagnóstico gratuito de 30 minutos, direto comigo. Sem pitch, sem slide.', btn='Agendar diagnóstico'):
    return (f'<section><div class="wrap"><div class="cta"><div><h2>{h}</h2><p>{p}</p></div>'
            f'<a class="btn" href="{wa(msg)}" rel="noopener">{btn}</a></div></div></section>')


def webpage_ld(path, name, desc, about='#org', extra=None):
    d = {"@type": "WebPage", "@id": SITE + path + "#pagina", "url": SITE + path, "name": name, "description": desc, "inLanguage": "pt-BR",
         "isPartOf": {"@id": SITE + "/#site"}, "about": {"@id": SITE + "/" + about}, "breadcrumb": {"@id": SITE + path + "#breadcrumb"},
         "dateModified": "2026-11-23T12:00:00-03:00"}
    if extra:
        d.update(extra)
    return d


def service_ld(path, name, stype, areas, desc):
    return {"@type": "Service", "@id": SITE + path + "#servico", "name": name, "serviceType": stype, "description": desc,
            "provider": {"@id": SITE + "/#org"}, "areaServed": [{"@type": "City", "name": a} for a in areas],
            "url": SITE + path, "availableChannel": {"@type": "ServiceChannel", "serviceUrl": wa(), "name": "WhatsApp"}}
