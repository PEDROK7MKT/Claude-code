#!/usr/bin/env python3
"""Gera o site estático do Hotel Bougainville em ./site.

Uso: python3 build.py

Todos os dados do hotel ficam no dicionário HOTEL abaixo; mudou telefone,
horário ou endereço, mude aqui e rode o script de novo. Páginas, schema.org,
sitemap.xml, robots.txt e llms.txt são gerados a partir dele.
"""
import json
import os
from datetime import date
from html import escape
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
OUT = ROOT / "site"
IMG = OUT / "assets" / "img"
TODAY = date.today().isoformat()

HOTEL = {
    "name": "Hotel Bougainville",
    "legal_name": "Hotel Bougainville LTDA",
    "cnpj": "13.212.889/0001-12",
    "url": "https://hotelbougainvillebarreiras.com.br",
    "street": "Av. Clériston Andrade, 1521",
    "city": "Barreiras",
    "state": "BA",
    "state_name": "Bahia",
    "cep": "47801-250",
    "lat": -12.1424303,
    "lng": -44.9838270,
    "phone": "(77) 3613-2429",
    "phone_tel": "+557736132429",
    "phone2": "(77) 3613-9779",
    "phone2_tel": "+557736139779",
    "whatsapp": "(77) 99944-3086",
    "whatsapp_num": "5577999443086",
    "reception_tel": "+5577999443086",
    "email": "reservas@hotelbougainvillebarreiras.com.br",
    "checkin": "13:00",
    "checkout": "11:00",
    "checkin_txt": "13h",
    "checkout_txt": "11h",
    "facebook": "https://www.facebook.com/hotelbougainvillebarreiras/",
    "payment": "cartão, PIX e dinheiro",
    "payment_schema": "Cartão, PIX, Dinheiro",
}
H = HOTEL
CHECK_TXT = f"Check-in a partir das {H['checkin_txt']} e check-out até as {H['checkout_txt']}"
ADDRESS_LINE = f"{H['street']} – {H['city']}/{H['state']} – CEP {H['cep']}"
MAPS_QUERY = "Hotel+Bougainville,+Av.+Cl%C3%A9riston+Andrade,+1521,+Barreiras+-+BA"
MAPS_LINK = f"https://www.google.com/maps/search/?api=1&query={MAPS_QUERY}"
MAPS_DIR = f"https://www.google.com/maps/dir/?api=1&destination={H['lat']},{H['lng']}"
MAPS_EMBED = f"https://www.google.com/maps?q={MAPS_QUERY}&z=16&output=embed"
WA_LINK = f"https://wa.me/{H['whatsapp_num']}?text=" + "Ol%C3%A1!%20Gostaria%20de%20consultar%20disponibilidade%20no%20Hotel%20Bougainville."

DISTANCES = [
    ("Centro de Barreiras", "cerca de 1,5 km"),
    ("Aeroporto de Barreiras (BRA)", "cerca de 10 km"),
    ("Rio de Ondas", "cerca de 13 km"),
]

ROOMS = [
    {
        "id": "individual",
        "name": "Apartamento Individual",
        "beds": "1 cama de casal",
        "for": "Para quem viaja sozinho ou em casal",
        "desc": "Quarto com cama de casal, ideal para viagens de trabalho ou para o casal que quer descansar bem depois de um dia corrido em Barreiras.",
        "photos": [("individual-cama-casal", "Apartamento individual com cama de casal arrumada com enxoval bordado do Hotel Bougainville"),
                   ("casal-03", "Quarto com cama de casal, criado-mudo e cortina no Hotel Bougainville"),
                   ("mesa-tv-frigobar", "Mesa de trabalho, TV de tela plana, frigobar e ar-condicionado no quarto")],
        "occupancy": 2,
        "bed_schema": [("cama de casal", 1)],
    },
    {
        "id": "duplo",
        "name": "Apartamento Duplo",
        "beds": "2 camas de solteiro",
        "for": "Para colegas de trabalho, amigos ou pais e filhos",
        "desc": "Duas camas de solteiro independentes: a escolha certa para equipes que vêm a trabalho ou para quem divide o quarto e não abre mão da própria cama.",
        "photos": [("duplo-solteiros", "Apartamento duplo com duas camas de solteiro, TV e mesa de trabalho"),
                   ("duplo-solteiros-02", "Duas camas de solteiro com enxoval branco no apartamento duplo"),
                   ("ar-condicionado-tv", "Ar-condicionado split, TV e cabideiro no apartamento")],
        "occupancy": 2,
        "bed_schema": [("cama de solteiro", 2)],
    },
    {
        "id": "triplo",
        "name": "Apartamento Triplo",
        "beds": "3 camas de solteiro",
        "for": "Para pequenos grupos e famílias",
        "desc": "Três camas de solteiro em um quarto amplo, com espaço de sobra para malas — prático para equipes de campo, amigos e famílias.",
        "photos": [("triplo", "Apartamento triplo com três camas de solteiro e piso claro"),
                   ("triplo-02", "Vista do apartamento triplo a partir da porta, com três camas"),
                   ("mesa-tv-frigobar-02", "Bancada com TV, mesa e frigobar no apartamento triplo")],
        "occupancy": 3,
        "bed_schema": [("cama de solteiro", 3)],
    },
    {
        "id": "quadruplo",
        "name": "Apartamento Quádruplo",
        "beds": "1 cama de casal + 3 camas de solteiro",
        "for": "Para famílias e grupos maiores",
        "desc": "O maior apartamento do hotel: cama de casal e três camas de solteiro no mesmo ambiente, para a família ou o grupo ficar junto com conforto.",
        "photos": [("quadruplo", "Apartamento quádruplo com várias camas arrumadas lado a lado"),
                   ("quadruplo-02", "Camas do apartamento quádruplo com enxoval bordado"),
                   ("quadruplo-03", "Apartamento quádruplo amplo com banheiro privativo ao fundo")],
        "occupancy": 5,
        "bed_schema": [("cama de casal", 1), ("cama de solteiro", 3)],
    },
]
ROOM_AMENITIES = ["Ar-condicionado", "TV de tela plana", "Frigobar", "Wi-Fi grátis",
                  "Banheiro privativo", "Mesa de trabalho", "Enxoval e toalhas", "Quarto não fumante"]

AMENITIES = [  # (schema name, icon, title, text)
    ("Recepção 24 horas", "clock", "Recepção 24 horas", "Chegou de madrugada ou vai sair cedo para a estrada? A recepção funciona o tempo todo."),
    ("Café da manhã incluso", "coffee", "Café da manhã incluso", "Incluso na diária: buffet com pães, bolos, frutas, sucos e pratos quentes regionais."),
    ("Estacionamento gratuito", "car", "Estacionamento grátis", "Vaga para o seu carro sem custo adicional durante a hospedagem."),
    ("Wi-Fi gratuito", "wifi", "Wi-Fi grátis", "Internet sem fio em todo o hotel, nos quartos e nas áreas comuns."),
    ("Ar-condicionado", "snow", "Ar-condicionado", "Todos os apartamentos têm ar-condicionado split."),
    ("Elevador", "elevator", "Elevador", "Acesso fácil a todos os andares, inclusive com bagagem."),
    ("Limpeza do quarto", "bell", "Limpeza do apartamento", "Arrumação e limpeza do apartamento durante a sua estadia."),
    ("Lavanderia", "shirt", "Lavanderia", "Serviço de lavanderia para estadias mais longas."),
    ("Quartos não fumantes", "nosmoke", "Ambiente não fumante", "Apartamentos livres de fumo, mais saudáveis e sem cheiro."),
]

FAQ = [
    ("Onde fica o Hotel Bougainville em Barreiras?",
     f"O Hotel Bougainville fica na {H['street']}, em Barreiras, Bahia (CEP {H['cep']}), na saída para Salvador, a cerca de 1,5 km do centro da cidade e a cerca de 10 km do Aeroporto de Barreiras."),
    ("Qual o horário de check-in e check-out?",
     f"O check-in é a partir das {H['checkin_txt']} e o check-out até as {H['checkout_txt']}. A recepção funciona 24 horas, então dá para chegar a qualquer hora."),
    ("O café da manhã está incluso na diária?",
     "Sim. O café da manhã está incluso na diária e é servido em buffet no salão do hotel, com pães, pão de alho, bolos, frutas, salada de frutas, sucos de caju e laranja, ovos mexidos e pratos quentes regionais, como carne acebolada com mandioca."),
    ("O Hotel Bougainville tem estacionamento?",
     "Sim, o estacionamento é gratuito para hóspedes."),
    ("Tem Wi-Fi?",
     "Sim, o Wi-Fi é gratuito em todo o hotel, nos apartamentos e nas áreas comuns."),
    ("Quais tipos de quarto o hotel oferece?",
     "São quatro tipos de apartamento: Individual (1 cama de casal), Duplo (2 camas de solteiro), Triplo (3 camas de solteiro) e Quádruplo (1 cama de casal e 3 de solteiro). Todos têm ar-condicionado, TV, frigobar, Wi-Fi e banheiro privativo."),
    ("O hotel é bom para quem viaja a trabalho?",
     "Sim. Os apartamentos têm mesa de trabalho e Wi-Fi grátis, a recepção é 24 horas e o hotel fica numa avenida de fácil acesso, perto do centro e com estacionamento grátis — prático para quem vem a Barreiras e ao Oeste da Bahia a negócios."),
    ("O hotel recebe famílias?",
     "Sim. Os apartamentos Triplo e Quádruplo acomodam famílias e grupos no mesmo quarto."),
    ("Como faço uma reserva?",
     f"Você pode reservar pelo número da recepção {H['whatsapp']} (ligação ou WhatsApp), pelos telefones fixos {H['phone']} e {H['phone2']} ou pelo e-mail {H['email']}. No site, o formulário de reserva já monta a mensagem com as suas datas."),
    ("Quais formas de pagamento o hotel aceita?",
     f"O Hotel Bougainville aceita {H['payment']}."),
    ("O hotel tem lavanderia?",
     "Sim, o hotel oferece serviço de lavanderia para os hóspedes."),
    ("Tem elevador?",
     "Sim, o hotel tem elevador com acesso a todos os andares."),
    ("É permitido fumar nos quartos?",
     "Não. Os apartamentos do Hotel Bougainville são não fumantes."),
]

GALLERY = [
    ("Recepção e hall", [
        ("entrada-totem", "Entrada do Hotel Bougainville com totem e fachada de vidro"),
        ("balcao-recepcao", "Balcão da recepção 24 horas do Hotel Bougainville"),
        ("parede-logo", "Parede com a logo do Hotel Bougainville na recepção"),
        ("lobby-entrada", "Lobby de entrada com poltronas e porta de vidro"),
        ("hall-elevador", "Hall com elevador, aparador e relógio decorativo"),
        ("hall-decoracao", "Detalhe da decoração do hall: relógio, vaso e esculturas"),
        ("hall-escada-elevador", "Hall dos andares com escada e elevador"),
        ("logo-hotel-bougainville", "Logo do Hotel Bougainville, uma flor de buganvília roxa"),
    ]),
    ("Áreas de estar", [
        ("sala-de-estar", "Sala de estar com sofá de couro, poltrona, mesa de centro e TV"),
        ("sala-de-estar-02", "Sala de estar ampla com plantas e janela com vista"),
        ("sala-de-estar-03", "Ambiente de estar com sofá, poltronas e tapete"),
        ("lounge", "Lounge com sofá de couro e janelas amplas"),
        ("estar-corredor-vista", "Recanto de estar no corredor com vista para a cidade"),
        ("estar-escada", "Área de estar junto à escada com sofá e poltronas"),
    ]),
    ("Café da manhã", [
        ("salao-cafe", "Salão de café da manhã com mesas de madeira e janelas com vista"),
        ("buffet-completo", "Buffet de café da manhã com louças, pães e frutas"),
        ("pratos-quentes", "Réchauds com pratos quentes no café da manhã"),
        ("carne-acebolada-mandioca", "Carne acebolada e mandioca cozida no buffet do café da manhã"),
        ("ovos-calabresa-salsicha", "Ovos mexidos, calabresa e salsicha ao molho no café da manhã"),
        ("pao-de-alho", "Pão de alho servido no café da manhã"),
        ("paes", "Cesta de pães franceses frescos no café da manhã"),
        ("salada-de-frutas", "Salada de frutas, melancia e tangerinas no buffet"),
        ("frutas-buffet", "Frutas fatiadas no buffet: melão, melancia e mamão"),
        ("sucos-caju-laranja", "Jarras de suco de caju e suco de laranja"),
        ("bolos", "Bolos caseiros e pães no café da manhã"),
    ]),
    ("Apartamentos", [
        ("individual-cama-casal", "Apartamento individual com cama de casal"),
        ("casal-02", "Quarto com cama de casal e cortina"),
        ("casal-04", "Cama de casal com enxoval bordado"),
        ("duplo-solteiros", "Apartamento duplo com duas camas de solteiro e TV"),
        ("triplo", "Apartamento triplo com três camas de solteiro"),
        ("quadruplo", "Apartamento quádruplo com várias camas"),
        ("solteiro", "Quarto com cama de solteiro"),
        ("mesa-tv-frigobar", "Mesa de trabalho, TV e frigobar no apartamento"),
        ("espelho", "Espelho amplo e camas no apartamento"),
        ("enxoval-bordado", "Enxoval com a logo do Hotel Bougainville bordada"),
        ("enxoval-toalhas", "Toalhas bordadas sobre a cama"),
    ]),
    ("Banheiros", [
        ("banheiro-granito-box", "Banheiro com bancada de granito e box de vidro"),
        ("banheiro-amenities", "Banheiro com amenities e bancada de granito"),
        ("banheiro-box-02", "Banheiro com box de vidro e chuveiro"),
        ("lavabo", "Lavabo com bancada de granito"),
        ("banheiro-social-barras", "Banheiro social com barras de apoio"),
    ]),
    ("Fachada", [
        ("fachada-lateral-01", "Prédio do Hotel Bougainville visto da avenida"),
        ("fachada-rua-03", "Fachada do Hotel Bougainville na Av. Clériston Andrade"),
        ("fachada-frontal-05", "Letreiro do Hotel Bougainville no alto do prédio"),
    ]),
]

NAV = [("/", "Início"), ("/o-hotel/", "O Hotel"), ("/acomodacoes/", "Acomodações"),
       ("/servicos/", "Serviços"), ("/galeriadefotos/", "Fotos"),
       ("/perguntas-frequentes/", "Dúvidas"), ("/contato/", "Contato")]

ICONS = {
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "coffee": '<path d="M4 9h13v4a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/>',
    "car": '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="13.5" r=".5"/><circle cx="16.5" cy="13.5" r=".5"/>',
    "wifi": '<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
    "snow": '<path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/>',
    "elevator": '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 9l3-3 3 3M9 15l3 3 3-3"/>',
    "bell": '<path d="M4 18h16"/><path d="M6 18a6 6 0 0 1 12 0"/><path d="M12 10V8"/><path d="M10 8h4"/>',
    "shirt": '<path d="M8 3l4 3 4-3 5 4-3 3v11H6V10L3 7z"/>',
    "nosmoke": '<path d="M3 15h13v3H3zM19 15v3M3 3l18 18"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    "phone": '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "bed": '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
    "star": '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
}
WA_SVG = ('<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3z"/></svg>')
LOGO_SVG = ('<svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">'
            '<g fill="#6a3d9a"><path d="M20 4c5 4 7 9 4 14-2 3-6 3-8 0-3-5-1-10 4-14z"/>'
            '<path d="M5 30c1-6 5-10 11-9 3 1 5 4 3 7-3 5-8 5-14 2z" opacity=".85"/>'
            '<path d="M35 30c-6 3-11 3-14-2-2-3 0-6 3-7 6-1 10 3 11 9z" opacity=".7"/></g>'
            '<circle cx="20" cy="23" r="2.6" fill="#fffefb"/></svg>')


def icon(name, size=24):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


_dims = {}


def variants(name):
    found = []
    for f in IMG.glob(f"{name}-*.webp"):
        w = f.stem[len(name) + 1:]
        if w.isdigit():
            found.append(int(w))
    if not found:
        raise SystemExit(f"Imagem não encontrada: {name}")
    return sorted(found)


def img(name, alt, sizes="100vw", eager=False, cls=""):
    ws = variants(name)
    if name not in _dims:
        with Image.open(IMG / f"{name}-{ws[-1]}.webp") as im:
            _dims[name] = im.size
    w, h = _dims[name]
    srcset = ", ".join(f"/assets/img/{name}-{x}.webp {x}w" for x in ws)
    mid = next((x for x in ws if x >= 960), ws[-1])
    attrs = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ""
    return (f'<img src="/assets/img/{name}-{mid}.webp" srcset="{srcset}" sizes="{sizes}" '
            f'width="{w}" height="{h}" alt="{escape(alt)}" {attrs}{c}>')


def biggest(name):
    return f"/assets/img/{name}-{variants(name)[-1]}.webp"


# ---------- Schema.org ----------

def hotel_schema():
    return {
        "@context": "https://schema.org",
        "@type": "Hotel",
        "@id": f"{H['url']}/#hotel",
        "name": H["name"],
        "alternateName": ["Hotel Bougainville Barreiras", "Bougainville Barreiras"],
        "legalName": H["legal_name"],
        "taxID": H["cnpj"],
        "description": "Hotel em Barreiras, Bahia, com recepção 24 horas, café da manhã incluso com pratos regionais, estacionamento e Wi-Fi grátis. Apartamentos individual, duplo, triplo e quádruplo com ar-condicionado, TV e frigobar.",
        "url": f"{H['url']}/",
        "telephone": H["reception_tel"],
        "email": H["email"],
        "image": [H["url"] + biggest(n) for n in ("sala-de-estar", "salao-cafe", "individual-cama-casal", "balcao-recepcao", "entrada-totem")],
        "logo": f"{H['url']}/assets/logo.svg",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": H["street"],
            "addressLocality": H["city"],
            "addressRegion": H["state"],
            "postalCode": H["cep"],
            "addressCountry": "BR",
        },
        "geo": {"@type": "GeoCoordinates", "latitude": H["lat"], "longitude": H["lng"]},
        "hasMap": MAPS_LINK,
        "checkinTime": H["checkin"],
        "checkoutTime": H["checkout"],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00", "closes": "23:59",
        },
        "smokingAllowed": False,
        "availableLanguage": ["pt-BR"],
        "currenciesAccepted": "BRL",
        "paymentAccepted": H["payment_schema"],
        "amenityFeature": [{"@type": "LocationFeatureSpecification", "name": a[0], "value": True} for a in AMENITIES],
        "containsPlace": [room_schema(r) for r in ROOMS],
        "areaServed": {"@type": "City", "name": "Barreiras"},
        "sameAs": [H["facebook"]],
        "contactPoint": [
            {"@type": "ContactPoint", "telephone": H["reception_tel"], "contactType": "reservations", "description": "Recepção 24h – ligação e WhatsApp", "areaServed": "BR", "availableLanguage": "Portuguese"},
            {"@type": "ContactPoint", "telephone": H["phone_tel"], "contactType": "reservations", "description": "Telefone fixo"},
            {"@type": "ContactPoint", "telephone": H["phone2_tel"], "contactType": "reservations", "description": "Telefone fixo"},
        ],
    }


def room_schema(r):
    return {
        "@type": "HotelRoom",
        "@id": f"{H['url']}/acomodacoes/#{r['id']}",
        "name": r["name"],
        "description": r["desc"],
        "image": H["url"] + biggest(r["photos"][0][0]),
        "bed": [{"@type": "BedDetails", "typeOfBed": t, "numberOfBeds": n} for t, n in r["bed_schema"]],
        "occupancy": {"@type": "QuantitativeValue", "maxValue": r["occupancy"]},
        "amenityFeature": [{"@type": "LocationFeatureSpecification", "name": a, "value": True} for a in ROOM_AMENITIES],
        "smokingAllowed": False,
    }


def website_schema():
    return {"@context": "https://schema.org", "@type": "WebSite", "@id": f"{H['url']}/#website",
            "url": f"{H['url']}/", "name": H["name"], "inLanguage": "pt-BR", "publisher": {"@id": f"{H['url']}/#hotel"}}


def faq_schema(items):
    return {"@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}


def crumbs_schema(trail):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": H["url"] + p} for i, (p, n) in enumerate(trail)]}


# ---------- Layout ----------

def header(current):
    links = "".join(f'<a href="{p}"{" aria-current=\"page\"" if p == current else ""}>{n}</a>' for p, n in NAV)
    return f"""<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Hotel Bougainville – página inicial">{LOGO_SVG}<span><span class="brand-name">Bougainville</span><span class="brand-sub">Hotel · Barreiras-BA</span></span></a>
    <nav class="nav" aria-label="Principal">{links}<a class="btn btn-primary" href="/contato/#reserva">Reservar</a></nav>
    <details class="menu"><summary>Menu</summary><nav class="menu-panel" aria-label="Principal (celular)">{links}<a class="btn btn-primary" href="/contato/#reserva">Reservar</a></nav></details>
  </div>
</header>"""


def footer():
    nav = "".join(f'<li><a href="{p}">{n}</a></li>' for p, n in NAV)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <h2>Hotel Bougainville</h2>
        <address>{H['street']}<br>{H['city']} – {H['state_name']}<br>CEP {H['cep']}</address>
        <p><a href="{MAPS_DIR}" rel="noopener" target="_blank">Como chegar</a></p>
      </div>
      <div>
        <h2>Reservas</h2>
        <ul>
          <li>Recepção (ligação e WhatsApp): <a href="tel:{H['reception_tel']}">{H['whatsapp']}</a></li>
          <li>Telefone: <a href="tel:{H['phone_tel']}">{H['phone']}</a></li>
          <li>Telefone: <a href="tel:{H['phone2_tel']}">{H['phone2']}</a></li>
          <li><a href="mailto:{H['email']}">{H['email']}</a></li>
        </ul>
      </div>
      <div>
        <h2>Navegação</h2>
        <ul>{nav}</ul>
      </div>
      <div>
        <h2>Horários</h2>
        <ul><li>Recepção 24 horas</li><li>Check-in a partir das {H['checkin_txt']}</li><li>Check-out até as {H['checkout_txt']}</li><li>Pagamento: {H['payment']}</li></ul>
        <p><a href="{H['facebook']}" rel="noopener" target="_blank">Facebook</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© {date.today().year} {H['legal_name']} · CNPJ {H['cnpj']}</span>
      <span>Hotel em Barreiras, Oeste da Bahia</span>
    </div>
  </div>
</footer>
<a class="wa-float" href="{WA_LINK}" rel="noopener" target="_blank" aria-label="Falar com a recepção pelo WhatsApp">{WA_SVG}</a>"""


def page(path, title, desc, body, ld=(), og_image="og-hotel-bougainville.jpg", preload=None):
    canonical = H["url"] + path
    og = f"{H['url']}/assets/img/{og_image}"
    lds = "\n".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",", ":"))}</script>' for x in ld)
    pre = f'<link rel="preload" as="image" href="{preload[0]}" imagesrcset="{preload[1]}" imagesizes="100vw" fetchpriority="high">' if preload else ""
    current = path if path in dict(NAV) else ""
    html = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title>
<meta name="description" content="{escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#34204f">
<meta name="geo.region" content="BR-BA">
<meta name="geo.placename" content="Barreiras">
<meta name="geo.position" content="{H['lat']};{H['lng']}">
<meta name="ICBM" content="{H['lat']}, {H['lng']}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Hotel Bougainville">
<meta property="og:title" content="{escape(title)}">
<meta property="og:description" content="{escape(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
{pre}
<link rel="stylesheet" href="/assets/site.css">
{lds}
</head>
<body>
{header(current)}
<main id="conteudo">
{body}
</main>
{footer()}
<script src="/assets/site.js" defer></script>
</body>
</html>
"""
    dest = OUT / path.strip("/") / "index.html" if path != "/404" else OUT / "404.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(html, encoding="utf-8")
    return path


def page_hero(trail, eyebrow, h1, lead):
    items = "".join(
        f'<li><a href="{p}">{escape(n)}</a></li>' if i < len(trail) - 1 else f'<li aria-current="page">{escape(n)}</li>'
        for i, (p, n) in enumerate(trail))
    return f"""<section class="page-hero"><div class="wrap">
<nav class="crumbs" aria-label="Você está em"><ol>{items}</ol></nav>
<span class="eyebrow">{eyebrow}</span><h1>{h1}</h1><p class="lead">{lead}</p>
</div></section>"""


def booking_block():
    opts = "".join(f"<option>{r['name']} ({r['beds']})</option>" for r in ROOMS)
    return f"""<section class="section" id="reserva"><div class="wrap">
<div class="booking">
  <div>
    <span class="eyebrow eyebrow-light">Reserva direta</span>
    <h2>Consulte disponibilidade pelo WhatsApp</h2>
    <p>Escolha as datas e o tipo de apartamento. A mensagem já vai pronta para a recepção, que responde com valores e confirma a sua reserva.</p>
    <p>Prefere ligar? <a class="btn btn-light" href="tel:{H['reception_tel']}">{H['whatsapp']}</a></p>
  </div>
  <form class="form" id="reserva-form" data-whatsapp="{H['whatsapp_num']}" novalidate>
    <label>Entrada<input type="date" name="checkin" required></label>
    <label>Saída<input type="date" name="checkout" required></label>
    <label>Hóspedes<select name="hospedes"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option></select></label>
    <label class="full">Apartamento<select name="quarto">{opts}<option>Ainda não sei</option></select></label>
    <label class="full">Seu nome (opcional)<input type="text" name="nome" autocomplete="name" maxlength="60"></label>
    <p class="form-error" role="alert"></p>
    <button class="btn btn-light full" type="submit">{WA_SVG} Enviar pelo WhatsApp</button>
    <p class="form-note">Sem cadastro e sem cobrança pelo site: você conversa direto com o hotel.</p>
  </form>
</div>
</div></section>"""


def cta_band():
    return f"""<section class="section cta-band"><div class="wrap">
<h2>Vai passar por Barreiras?</h2>
<p>Fale direto com a recepção e garanta o seu apartamento com café da manhã incluso, estacionamento e Wi-Fi grátis.</p>
<div class="hero-actions"><a class="btn btn-light" href="{WA_LINK}" rel="noopener" target="_blank">{WA_SVG} Chamar no WhatsApp</a>
<a class="btn btn-outline-light" href="tel:{H['reception_tel']}">Ligar {H['whatsapp']}</a></div>
</div></section>"""


def room_cards():
    out = []
    for r in ROOMS:
        name, alt = r["photos"][0]
        out.append(f"""<article class="card">{img(name, alt, "(min-width: 900px) 280px, 100vw")}
<div class="card-body"><h3>{r['name']}</h3><p class="beds">{r['beds']}</p><p>{r['for']}.</p>
<a class="more" href="/acomodacoes/#{r['id']}">Ver detalhes →</a></div></article>""")
    return '<div class="cards">' + "".join(out) + "</div>"


def features(items=AMENITIES):
    return '<div class="features">' + "".join(
        f'<div class="feature">{icon(i, 28)}<h3>{t}</h3><p>{d}</p></div>' for _, i, t, d in items) + "</div>"


def faq_html(items):
    return '<div class="faq">' + "".join(f"<details><summary>{escape(q)}</summary><p>{escape(a)}</p></details>" for q, a in items) + "</div>"


def distances_html():
    return '<ul class="distances">' + "".join(f"<li><span>{a}</span><span>{b}</span></li>" for a, b in DISTANCES) + "</ul>"


# ---------- Pages ----------

def home():
    hero_name = "sala-de-estar"
    ws = variants(hero_name)
    pre = (f"/assets/img/{hero_name}-{ws[-1]}.webp", ", ".join(f"/assets/img/{hero_name}-{x}.webp {x}w" for x in ws))
    body = f"""<section class="hero">
{img(hero_name, "Sala de estar do Hotel Bougainville com sofá de couro, poltrona e TV", "100vw", eager=True)}
<div class="wrap">
<span class="eyebrow">Hotel em Barreiras · Bahia</span>
<h1>Hotel Bougainville: descanso e praticidade em Barreiras</h1>
<p>Apartamentos renovados com ar-condicionado, café da manhã incluso com sabor regional, estacionamento e Wi-Fi grátis, na Av. Clériston Andrade, perto do centro.</p>
<div class="hero-actions"><a class="btn btn-primary" href="/contato/#reserva">Consultar disponibilidade</a><a class="btn btn-light" href="/acomodacoes/">Ver apartamentos</a></div>
</div>
</section>
<section class="facts" aria-label="Destaques"><div class="wrap"><ul>
<li>{icon('clock')} Recepção 24 horas</li><li>{icon('coffee')} Café da manhã incluso</li><li>{icon('car')} Estacionamento grátis</li><li>{icon('wifi')} Wi-Fi grátis</li><li>{icon('snow')} Ar-condicionado</li>
</ul></div></section>

<section class="section"><div class="wrap split">
<div>
<span class="eyebrow">Bem-vindo</span>
<h2>Um hotel em Barreiras feito para quem chega cansado e sai cedo</h2>
<p>O Hotel Bougainville fica na {H['street']}, na saída para Salvador, a cerca de 1,5 km do centro de Barreiras. É o endereço de quem vem ao Oeste da Bahia a trabalho, de famílias de passagem pela cidade e de quem quer conhecer as cachoeiras e os rios da região.</p>
<p>O hotel passou por renovação: recepção nova, salas de estar confortáveis, apartamentos com mesa de trabalho e banheiros com bancada em granito. Tudo pensado para uma noite bem dormida.</p>
<ul class="checks"><li>{CHECK_TXT}</li><li>Café da manhã incluso na diária</li><li>Elevador para todos os andares</li><li>Apartamentos não fumantes</li></ul>
<a class="btn btn-ghost" href="/o-hotel/">Conheça o hotel</a>
</div>
{img("balcao-recepcao", "Balcão da recepção 24 horas do Hotel Bougainville em Barreiras", "(min-width: 880px) 50vw, 100vw")}
</div></section>

<section class="section section-alt"><div class="wrap">
<div class="section-head"><span class="eyebrow">Acomodações</span><h2>Apartamentos para viajar sozinho, a dois, em equipe ou em família</h2>
<p class="lead">Todos com ar-condicionado, TV de tela plana, frigobar, Wi-Fi grátis e banheiro privativo.</p></div>
{room_cards()}
</div></section>

<section class="section"><div class="wrap split reverse">
<div>
<span class="eyebrow">Café da manhã</span>
<h2>Café da manhã com gosto da Bahia</h2>
<p>Incluso na diária, o café da manhã é servido no salão com vista da cidade: pão francês quentinho, pão de alho, bolos, frutas da estação, salada de frutas e sucos de caju e laranja.</p>
<p>Na mesa quente tem ovos mexidos, calabresa, salsicha ao molho e carne acebolada com mandioca — café de verdade para quem vai encarar a estrada ou um dia inteiro de reuniões.</p>
<a class="btn btn-ghost" href="/servicos/#cafe-da-manha">Ver o café da manhã</a>
</div>
{img("carne-acebolada-mandioca", "Carne acebolada com mandioca no buffet do café da manhã do Hotel Bougainville", "(min-width: 880px) 50vw, 100vw")}
</div></section>

<section class="section section-alt"><div class="wrap">
<div class="section-head"><span class="eyebrow">Estrutura</span><h2>Tudo o que você precisa durante a estadia</h2></div>
{features(AMENITIES[:6])}
</div></section>

<section class="section"><div class="wrap split">
<div>
<span class="eyebrow">Localização</span>
<h2>Fácil de chegar, perto de tudo em Barreiras</h2>
<p><strong>{ADDRESS_LINE}</strong></p>
{distances_html()}
<p class="mt"><a class="btn btn-primary" href="{MAPS_DIR}" rel="noopener" target="_blank">Traçar rota no Google Maps</a></p>
</div>
{img("entrada-totem", "Entrada do Hotel Bougainville na Av. Clériston Andrade, em Barreiras", "(min-width: 880px) 50vw, 100vw")}
</div></section>

<section class="section section-alt"><div class="wrap">
<div class="section-head"><span class="eyebrow">Dúvidas</span><h2>Perguntas frequentes</h2></div>
{faq_html(FAQ[:5])}
<p class="mt"><a href="/perguntas-frequentes/">Ver todas as perguntas →</a></p>
</div></section>
{booking_block()}"""
    return page("/", "Hotel em Barreiras-BA com café da manhã incluso | Bougainville",
                "Hotel em Barreiras, Bahia, na Av. Clériston Andrade: recepção 24h, café da manhã incluso, estacionamento e Wi-Fi grátis. Reserve pelo WhatsApp (77) 99944-3086.",
                body, ld=[hotel_schema(), website_schema(), faq_schema(FAQ[:5])], preload=pre)


def o_hotel():
    trail = [("/", "Início"), ("/o-hotel/", "O Hotel")]
    body = page_hero(trail, "O Hotel", "Sobre o Hotel Bougainville",
                     "Hospedagem confortável e sem complicação em Barreiras, no Oeste da Bahia.") + f"""
<section class="section"><div class="wrap split">
<div>
<h2>Conforto, boa localização e atendimento de verdade</h2>
<p>O Hotel Bougainville é um hotel em Barreiras (BA) para quem busca comodidade e não abre mão de uma boa localização. Estamos na {H['street']}, na saída para Salvador, com acesso fácil ao centro, aos comércios e às principais avenidas da cidade.</p>
<p>O nome vem da buganvília, a flor que colore o sertão e o cerrado baianos — e que hoje é também a nossa marca. Ela resume o que queremos oferecer: um lugar acolhedor, bem cuidado e com a cara da região.</p>
<p>Recebemos quem vem a Barreiras a trabalho, representantes comerciais, equipes do agronegócio do Oeste Baiano, famílias e turistas que vêm conhecer as cachoeiras, rios e trilhas da região.</p>
</div>
{img("parede-logo", "Parede da recepção com a logo do Hotel Bougainville", "(min-width: 880px) 50vw, 100vw")}
</div></section>

<section class="section section-alt"><div class="wrap split reverse">
<div>
<h2>Um hotel renovado</h2>
<p>A recepção, o hall e as áreas de estar foram renovados, com salas de estar amplas, iluminação natural e decoração nova. Os apartamentos ganharam mesa de trabalho, TV de tela plana, frigobar e ar-condicionado split, e os banheiros têm bancada em granito e box de vidro.</p>
<ul class="checks two"><li>Recepção 24 horas</li><li>Elevador</li><li>Salas de estar</li><li>Café da manhã incluso</li><li>Salão de café com vista</li><li>Estacionamento grátis</li><li>Wi-Fi em todo o hotel</li></ul>
</div>
{img("sala-de-estar-02", "Sala de estar ampla e iluminada do Hotel Bougainville", "(min-width: 880px) 50vw, 100vw")}
</div></section>

<section class="section"><div class="wrap">
<div class="section-head"><h2>Onde estamos</h2><p class="lead">{ADDRESS_LINE}</p></div>
<div class="split"><div>{distances_html()}<p class="mt"><a class="btn btn-primary" href="{MAPS_DIR}" rel="noopener" target="_blank">Como chegar</a></p></div>
{img("lobby-entrada", "Lobby de entrada do Hotel Bougainville", "(min-width: 880px) 50vw, 100vw")}</div>
</div></section>
{cta_band()}"""
    return page("/o-hotel/", "O Hotel | Hotel Bougainville em Barreiras-BA",
                "Conheça o Hotel Bougainville, hotel renovado em Barreiras (BA), na Av. Clériston Andrade: recepção 24h, salas de estar, café da manhã e estacionamento grátis.",
                body, ld=[crumbs_schema(trail)], og_image="og-hotel-bougainville.jpg")


def acomodacoes():
    trail = [("/", "Início"), ("/acomodacoes/", "Acomodações")]
    rooms = []
    for r in ROOMS:
        photos = "".join(img(n, a, "(min-width: 880px) 30vw, 50vw") for n, a in r["photos"])
        rooms.append(f"""<article class="room" id="{r['id']}">
<div class="room-photos">{photos}</div>
<div>
<span class="tag">{r['beds']}</span>
<h2>{r['name']}</h2>
<p>{r['desc']}</p>
<p class="muted">{r['for']}.</p>
<h3>No apartamento</h3>
<ul class="checks two">{''.join(f'<li>{a}</li>' for a in ROOM_AMENITIES)}</ul>
<a class="btn btn-primary" href="/contato/#reserva">Consultar disponibilidade</a>
</div>
</article>""")
    body = page_hero(trail, "Acomodações", "Apartamentos do Hotel Bougainville",
                     "Quatro tipos de apartamento, do individual ao quádruplo. Todos com ar-condicionado, TV, frigobar, Wi-Fi grátis e banheiro privativo.") + \
        '<section class="section section-tight"><div class="wrap">' + "".join(rooms) + "</div></section>" + f"""
<section class="section section-alt"><div class="wrap split">
<div><h2>Detalhes que fazem diferença</h2>
<p>Enxoval branco com a logo do hotel bordada, toalhas macias, banheiro com bancada em granito e box de vidro. {CHECK_TXT}. Café da manhã incluso na diária.</p></div>
{img("enxoval-bordado", "Enxoval com a logo do Hotel Bougainville bordada", "(min-width: 880px) 50vw, 100vw")}
</div></section>
{booking_block()}"""
    ld = [crumbs_schema(trail), {"@context": "https://schema.org", "@type": "ItemList", "name": "Apartamentos do Hotel Bougainville",
                                 "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": room_schema(r)} for i, r in enumerate(ROOMS)]}]
    return page("/acomodacoes/", "Quartos e apartamentos | Hotel Bougainville Barreiras",
                "Apartamentos individual, duplo, triplo e quádruplo no Hotel Bougainville, em Barreiras-BA. Ar-condicionado, TV, frigobar, Wi-Fi grátis e banheiro privativo.",
                body, ld=ld)


def servicos():
    trail = [("/", "Início"), ("/servicos/", "Serviços")]
    cafe = [("salao-cafe", "Salão de café da manhã do Hotel Bougainville com mesas e vista da cidade"),
            ("pratos-quentes", "Pratos quentes no buffet do café da manhã"),
            ("pao-de-alho", "Pão de alho do café da manhã"),
            ("sucos-caju-laranja", "Sucos de caju e de laranja no café da manhã")]
    body = page_hero(trail, "Serviços", "Serviços e estrutura do hotel",
                     "Recepção 24 horas, café da manhã incluso, estacionamento e Wi-Fi grátis: o essencial bem feito.") + f"""
<section class="section"><div class="wrap">{features()}</div></section>

<section class="section section-alt" id="cafe-da-manha"><div class="wrap">
<div class="section-head"><span class="eyebrow">Café da manhã</span><h2>Café da manhã incluso, com pratos quentes e sabores regionais</h2>
<p class="lead">Incluso na diária e servido no salão do hotel, com janelas amplas e vista da cidade.</p></div>
<div class="split">
<div>
<h3>O que você encontra no buffet</h3>
<ul class="checks two"><li>Pão francês e pão de alho</li><li>Bolos caseiros</li><li>Frutas da estação</li><li>Salada de frutas</li><li>Sucos de caju e laranja</li><li>Café, leite e achocolatado</li><li>Ovos mexidos</li><li>Calabresa e salsicha ao molho</li><li>Carne acebolada com mandioca</li></ul>
<p class="muted">O cardápio pode variar conforme o dia.</p>
</div>
{img(cafe[0][0], cafe[0][1], "(min-width: 880px) 50vw, 100vw")}
</div>
<div class="gallery mt">{''.join(f'<a href="{biggest(n)}" data-lightbox data-caption="{escape(a)}">{img(n, a, "(min-width: 900px) 280px, 50vw")}</a>' for n, a in cafe[1:])}</div>
</div></section>

<section class="section"><div class="wrap split reverse">
<div><span class="eyebrow">Áreas comuns</span><h2>Salas de estar para relaxar ou esperar com conforto</h2>
<p>O hotel tem salas de estar com sofás, poltronas e TV, além de recantos de descanso nos corredores com vista para a cidade. Bom para uma conversa, uma ligação de trabalho ou para esperar o check-in.</p></div>
{img("estar-corredor-vista", "Recanto de estar com sofá de couro e vista para a cidade", "(min-width: 880px) 50vw, 100vw")}
</div></section>
{cta_band()}"""
    return page("/servicos/", "Serviços e café da manhã | Hotel Bougainville Barreiras",
                "Recepção 24h, café da manhã incluso, estacionamento grátis, Wi-Fi, elevador, lavanderia e limpeza do quarto no Hotel Bougainville, em Barreiras-BA.",
                body, ld=[crumbs_schema(trail)])


def galeria():
    trail = [("/", "Início"), ("/galeriadefotos/", "Fotos")]
    groups = []
    for title, items in GALLERY:
        links = "".join(f'<a href="{biggest(n)}" data-lightbox data-caption="{escape(a)}">{img(n, a, "(min-width: 900px) 280px, 50vw")}</a>' for n, a in items)
        groups.append(f'<div class="gallery-group"><h2>{title}</h2><div class="gallery">{links}</div></div>')
    body = page_hero(trail, "Galeria", "Fotos do Hotel Bougainville",
                     "Recepção, salas de estar, apartamentos, banheiros e o nosso café da manhã.") + \
        '<section class="section"><div class="wrap">' + "".join(groups) + "</div></section>" + \
        '<dialog class="lightbox" id="lightbox" aria-label="Foto ampliada"><button type="button" aria-label="Fechar">×</button><img alt=""><p></p></dialog>' + cta_band()
    gallery_ld = {"@context": "https://schema.org", "@type": "ImageGallery", "name": "Fotos do Hotel Bougainville",
                  "about": {"@id": f"{H['url']}/#hotel"},
                  "image": [{"@type": "ImageObject", "contentUrl": H["url"] + biggest(n), "description": a} for _, items in GALLERY for n, a in items]}
    return page("/galeriadefotos/", "Fotos | Hotel Bougainville em Barreiras-BA",
                "Veja fotos do Hotel Bougainville em Barreiras: recepção, salas de estar, apartamentos, banheiros e café da manhã.",
                body, ld=[crumbs_schema(trail), gallery_ld])


def perguntas():
    trail = [("/", "Início"), ("/perguntas-frequentes/", "Perguntas frequentes")]
    body = page_hero(trail, "Dúvidas", "Perguntas frequentes",
                     "Check-in, café da manhã, estacionamento, quartos e reservas: respostas rápidas para planejar a sua estadia em Barreiras.") + \
        f'<section class="section"><div class="wrap">{faq_html(FAQ)}</div></section>' + cta_band()
    return page("/perguntas-frequentes/", "Perguntas frequentes | Hotel Bougainville Barreiras",
                "Horário de check-in e check-out, café da manhã, estacionamento, Wi-Fi, tipos de quarto e como reservar no Hotel Bougainville, em Barreiras-BA.",
                body, ld=[crumbs_schema(trail), faq_schema(FAQ)])


def contato():
    trail = [("/", "Início"), ("/contato/", "Contato")]
    body = page_hero(trail, "Contato", "Contato e localização",
                     "Fale direto com a recepção do Hotel Bougainville pelo WhatsApp, telefone ou e-mail.") + f"""
<section class="section"><div class="wrap contact-grid">
<div>
<h2>Fale com a gente</h2>
<ul class="contact-list">
<li>{WA_SVG}<div><strong>Recepção (ligação e WhatsApp)</strong><a href="tel:{H['reception_tel']}">{H['whatsapp']}</a> · <a href="{WA_LINK}" rel="noopener" target="_blank">abrir WhatsApp</a></div></li>
<li>{icon('phone')}<div><strong>Telefones fixos</strong><a href="tel:{H['phone_tel']}">{H['phone']}</a> · <a href="tel:{H['phone2_tel']}">{H['phone2']}</a></div></li>
<li>{icon('mail')}<div><strong>E-mail</strong><a href="mailto:{H['email']}">{H['email']}</a></div></li>
<li>{icon('pin')}<div><strong>Endereço</strong>{H['street']}<br>{H['city']} – {H['state_name']} – CEP {H['cep']}<br><a href="{MAPS_DIR}" rel="noopener" target="_blank">Traçar rota no Google Maps</a></div></li>
<li>{icon('clock')}<div><strong>Horários</strong>Recepção 24 horas · Check-in a partir das {H['checkin_txt']} · Check-out até as {H['checkout_txt']}</div></li>
<li>{icon('star')}<div><strong>Pagamento</strong>Aceitamos {H['payment']}</div></li>
</ul>
<h3 class="mt">Distâncias</h3>
{distances_html()}
</div>
<iframe class="map" src="{MAPS_EMBED}" title="Mapa com a localização do Hotel Bougainville em Barreiras" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</div></section>
{booking_block()}"""
    return page("/contato/", "Contato e reservas | Hotel Bougainville Barreiras-BA",
                f"Reserve no Hotel Bougainville pelo WhatsApp {H['whatsapp']} ou telefone {H['phone']}. Endereço: {H['street']}, Barreiras-BA, CEP {H['cep']}.",
                body, ld=[crumbs_schema(trail)])


def not_found():
    body = """<section class="section"><div class="wrap center">
<span class="eyebrow">Erro 404</span><h1>Página não encontrada</h1>
<p class="lead">O endereço pode ter mudado. Veja as opções abaixo ou fale com a recepção.</p>
<div class="hero-actions"><a class="btn btn-primary" href="/">Ir para o início</a><a class="btn btn-ghost" href="/contato/">Contato</a></div>
</div></section>"""
    page("/404", "Página não encontrada | Hotel Bougainville", "Página não encontrada.", body)
    p = OUT / "404.html"
    p.write_text(p.read_text(encoding="utf-8").replace('content="index, follow, max-image-preview:large"', 'content="noindex"'), encoding="utf-8")


# ---------- SEO / GEO files ----------

def seo_files(paths):
    urls = "".join(f"<url><loc>{H['url']}{p}</loc><lastmod>{TODAY}</lastmod></url>" for p in paths)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n', encoding="utf-8")

    (OUT / "robots.txt").write_text(f"""User-agent: *
Allow: /

# Buscadores e assistentes de IA podem ler o site (GEO)
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: {H['url']}/sitemap.xml
""", encoding="utf-8")

    rooms = "\n".join(f"- {r['name']}: {r['beds']}. {r['for']}." for r in ROOMS)
    faq = "\n".join(f"### {q}\n{a}\n" for q, a in FAQ)
    dist = "\n".join(f"- {a}: {b}" for a, b in DISTANCES)
    (OUT / "llms.txt").write_text(f"""# Hotel Bougainville – Barreiras, Bahia

> Hotel em Barreiras (BA), no Oeste da Bahia, na {H['street']} (saída para Salvador). Recepção 24 horas, café da manhã incluso na diária com pratos regionais, estacionamento grátis e Wi-Fi grátis. Apartamentos individual, duplo, triplo e quádruplo com ar-condicionado, TV, frigobar e banheiro privativo.

## Dados principais
- Nome: {H['name']} (razão social {H['legal_name']}, CNPJ {H['cnpj']})
- Endereço: {ADDRESS_LINE}, Brasil
- Coordenadas: {H['lat']}, {H['lng']}
- Reservas: recepção (ligação e WhatsApp) {H['whatsapp']} · Telefones fixos {H['phone']} e {H['phone2']} · {H['email']}
- Check-in: a partir das {H['checkin_txt']} · Check-out: até as {H['checkout_txt']} · Recepção 24 horas
- Café da manhã: incluso na diária
- Pagamento: {H['payment']}
- Site: {H['url']}/

## Apartamentos
{rooms}
Todos com: {", ".join(ROOM_AMENITIES)}.

## Estrutura e serviços
{chr(10).join(f"- {a[2]}: {a[3]}" for a in AMENITIES)}

## Distâncias aproximadas
{dist}

## Perguntas frequentes
{faq}
## Páginas
- [Início]({H['url']}/)
- [O Hotel]({H['url']}/o-hotel/)
- [Acomodações]({H['url']}/acomodacoes/)
- [Serviços e café da manhã]({H['url']}/servicos/)
- [Fotos]({H['url']}/galeriadefotos/)
- [Perguntas frequentes]({H['url']}/perguntas-frequentes/)
- [Contato e localização]({H['url']}/contato/)
""", encoding="utf-8")

    (OUT / "assets" / "logo.svg").write_text(LOGO_SVG.replace('width="38" height="38" ', 'xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', ""), encoding="utf-8")


def main():
    paths = [home(), o_hotel(), acomodacoes(), servicos(), galeria(), perguntas(), contato()]
    not_found()
    seo_files(paths)
    print(f"{len(paths)} páginas geradas em {OUT}")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
