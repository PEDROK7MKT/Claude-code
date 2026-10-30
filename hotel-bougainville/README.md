# Hotel Bougainville Barreiras — material para o novo site

Levantamento feito em 20/10/2026 para servir de base ao redesign de
https://hotelbougainvillebarreiras.com.br/

## Site novo (`site/`)

Site estático (HTML + CSS + 2 KB de JS), sem WordPress, sem plugins, sem
banco de dados e sem PHP — não há nada para invadir nem para "quebrar" com
atualização, que foram os problemas do site antigo.

- `build.py` gera tudo em `site/` a partir da ficha `HOTEL` no topo do
  arquivo: páginas, schema.org, `sitemap.xml`, `robots.txt` e `llms.txt`.
  Para mudar telefone, horário ou texto: edite `build.py` e rode
  `python3 build.py` (precisa só de Python 3 e Pillow).
- Páginas (mesmas URLs do site antigo, para não perder posição no Google):
  `/`, `/o-hotel/`, `/acomodacoes/`, `/servicos/`, `/galeriadefotos/`,
  `/contato/` e a nova `/perguntas-frequentes/`.
- Reserva: formulário que monta a mensagem com as datas e abre o WhatsApp
  do hotel. Sem formulário de servidor, sem spam, sem dados guardados.

### SEO local
- Título, descrição, canonical e Open Graph únicos por página.
- Schema.org `Hotel` completo (endereço, coordenadas, horários, check-in/out,
  comodidades, CNPJ, quartos como `HotelRoom` com camas e ocupação),
  `FAQPage`, `BreadcrumbList`, `ImageGallery`, `WebSite`.
- Meta tags geo (BR-BA, Barreiras, coordenadas do OpenStreetMap).
- Mesmo nome, endereço e telefone (NAP) em todas as páginas e no rodapé.
- Imagens WebP responsivas com `alt` descritivo, fontes locais, sem CLS.
- `sitemap.xml` e `robots.txt`.

### GEO (ChatGPT, Gemini, Perplexity, Claude)
- `robots.txt` libera explicitamente os robôs de IA.
- `llms.txt` com a ficha do hotel em texto limpo.
- Página de perguntas frequentes com respostas diretas e factuais — é o
  formato que os assistentes citam.
- Sem nota/estrelas no schema: o Google proíbe avaliações "autodeclaradas"
  em LocalBusiness e penaliza. A nota deve vir do Perfil da Empresa no Google.

### Segurança (`site/.htaccess` para Apache/cPanel, `site/vercel.json` para Vercel)
- HTTPS forçado + HSTS, domínio sem `www`.
- CSP rígida (só scripts e estilos do próprio site; só o mapa do Google de fora).
- `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Páginas de demonstração/spam antigas (`/hotel-ft-paris/`,
  `/go-to-mountain-village/`) e caminhos do WordPress (`/wp-admin`,
  `/wp-login.php`, `/xmlrpc.php`…) respondem **410 Gone**, para o Google
  tirar do índice e os robôs pararem de tentar.
- Listagem de diretórios desligada.

### Publicar
1. Subir o **conteúdo** da pasta `site/` para a raiz do site
   (`public_html` / `www`), incluindo o `.htaccess` (arquivo oculto).
   Na Vercel: importar a pasta `site/` como projeto estático.
2. Apagar o WordPress antigo do servidor (fazer backup antes).
3. Google Search Console: verificar o domínio e enviar `sitemap.xml`;
   pedir remoção das URLs antigas de demonstração.
4. Perfil da Empresa no Google: conferir nome, endereço, telefone, site e
   fotos iguais aos do site.

### Confirmado pelo hotel (30/10/2026)
- Recepção (ligação e WhatsApp): (77) 99944-3086
- Check-in 13h, check-out 11h
- Café da manhã incluso na diária

### Confirmar com o hotel antes de publicar
- [ ] Quádruplo: 1 casal + 3 solteiro — confere? Quantas pessoas no máximo?
- [ ] Lavanderia e serviço de quarto ainda existem?
- [ ] Aceita pets? Formas de pagamento? (não estão no site por falta de dado)
- [ ] Instagram do hotel (para colocar no rodapé e no schema).
- [ ] Foto atual da fachada inteira (as 3 de fachada são antigas, da Wego).
- [ ] Logo em vetor (o ícone do site é um desenho provisório inspirado na flor).

### Fotos
`fotos/2026/` — 51 fotos selecionadas da pasta "HOTEL BGVL" do Google Drive
(enviadas em 30/10/2026), organizadas por área. As versões web estão em
`site/assets/img/`.

## Situação do site atual

- **O site está fora do ar.** Toda URL (home, páginas, `wp-json`, `robots.txt`,
  sitemap, uploads) responde **HTTP 500** com erro fatal do WordPress:
  `Class 'MailPoetVendor\Twig\Environment' not found` no plugin **MailPoet**
  (arquivos do vendor do plugin estão faltando). Roda em PHP 7.3.
  Solução imediata para o cliente: desativar o MailPoet (renomear a pasta
  `wp-content/plugins/mailpoet` via FTP/cPanel) ou reinstalar o plugin.
- O tema é um template de hotel em inglês com **conteúdo de demonstração
  nunca removido**: páginas "Home 3", "About Us", "Hotel FT. Paris" (outro
  hotel, preços e e-mail fictícios) e "Visiting Mountain village" — esta
  última, segundo os resultados de busca, tem texto sobre um "Coinbase tech
  hub", o que pode indicar spam injetado. Vale verificar o servidor antes
  de reaproveitar qualquer coisa.
- Título das páginas tem erro de digitação: "Hotel **Boungainville**".
- Rodapé "© 2022".
- Não foi possível recuperar o HTML original: o site retorna 500 e o
  Wayback Machine / archive.ph bloquearam este ambiente (429). Os textos
  abaixo vêm dos trechos indexados pelo Google e de agregadores (Kayak,
  Wego). As fotos vêm do CDN da Wego, em resolução original.

### Páginas do site antigo (mapa)

| Página | URL | Aproveitar? |
|---|---|---|
| Home | `/` | Sim |
| O Hotel | `/o-hotel/` | Sim |
| Acomodações | `/acomodacoes/` | Sim |
| Serviços | `/servicos/` | Sim (tinha texto placeholder) |
| Galeria de Fotos | `/galeriadefotos/` | Sim |
| Contato | `/contato/` | Sim |
| Home 3, About Us, Hotel FT. Paris, Visiting Mountain village | — | **Não** (demo do tema) |

Se o novo site mudar as URLs, fazer redirect 301 das cinco páginas acima.

## Domínio (consulta Registro.br/RDAP em 20/10/2026)

| | |
|---|---|
| Titular | **Hotel Bougainville LTDA — CNPJ 13.212.889/0001-12** |
| Contato administrativo e técnico | Melquisedeque Mano dos Santos (ID `MMS875`, webdesigner@hotmail.com) — o dev antigo |
| Registrado em | 31/01/2012 |
| **Expira em** | **31/01/2027** |
| DNS | dns1–dns4.uni5.net (hospedagem Uni5) |

O domínio pertence à empresa, mas quem tem o login e administra é o dev.

## Ficha do hotel

| | |
|---|---|
| Nome | Hotel Bougainville |
| Razão social | Hotel Bougainville LTDA |
| CNPJ | 13.212.889/0001-12 |
| Categoria | 3 estrelas |
| Endereço | Av. Clériston Andrade, 1521 – Vila Brasil (Saída para Salvador) – Barreiras/BA – CEP 47801-250 |
| Telefones fixos | (77) 3613-2429 / (77) 3613-9779 |
| Recepção (celular / WhatsApp) | (77) 9 9944-3086 (confirmado pelo hotel) |
| E-mail | reservas@hotelbougainvillebarreiras.com.br |
| Facebook | https://www.facebook.com/hotelbougainvillebarreiras/ |
| Instagram | não encontrado — pedir ao cliente |
| Check-in / Check-out | 13h / 11h (confirmado pelo hotel) |
| Distâncias | Centro ~1,4 km · Aeroporto de Barreiras (BRA) ~10 km · Rio de Ondas ~13 km |

Telefones antigos que aparecem em cadastros de CNPJ: (77) 3611-5698 e
(77) 3611-7799 — provavelmente desatualizados.

### Textos do site antigo (trechos recuperados)

- "Ideal para quem busca comodidade e não abre mão de uma boa localização."
- "Café da manhã diversificado", "quartos para não fumantes",
  "recepção 24 horas", "estacionamento gratuito".
- Próximo a restaurantes; Rio de Ondas a cerca de 13 km.

### Acomodações

Todos os apartamentos têm ar-condicionado, frigobar e TV.

| Tipo | Camas |
|---|---|
| Individual | 1 cama de casal |
| Duplo | 2 camas de solteiro |
| Triplo | 3 camas de solteiro |
| Quádruplo | 1 cama de casal + 3 de solteiro |

Agregadores também citam: banheiro privativo com ducha e ducha higiênica,
mesa de trabalho, guarda-roupa, TV a cabo, quartos família.

### Serviços e estrutura

Café da manhã (buffet com pratos quentes) · Recepção 24h · Wi-Fi grátis em
todo o hotel · Estacionamento gratuito · Serviço de quarto · Lavanderia ·
Elevador · Quartos não fumantes · Acessibilidade · Espaço com computador.

### Reputação (para selos/depoimentos)

- Kayak: **8,3 "Muito bom"** (205 avaliações). Pontos fortes: localização
  (8,5) e café da manhã (8,5). Pontos fracos: limpeza, atendimento e
  estacionamento (6,0).
- Wego: 8,4 (149 avaliações).

## Fotos (`fotos/`)

29 fotos atuais + 7 antigas, em resolução original (até 2500px).
`previa-fotos.jpg` mostra todas lado a lado.

- `fachada/` — 8 (prédio, letreiro, entrada; a 01 e a 02 servem para hero)
- `recepcao-e-areas-comuns/` — 9 (recepção, corredores, elevador)
- `cafe-da-manha/` — 3 (salão, buffet, pratos quentes)
- `quartos/` — 6 (individual, duplo, casal + solteiro, triplo)
- `banheiros/` — 3
- `antigas/` — 7 fotos de uma reforma anterior (960px, decoração rosa);
  não usar no site novo

Faltam fotos do quarto quádruplo e da logo em vetor — pedir ao cliente.
