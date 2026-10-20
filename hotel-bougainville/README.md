# Hotel Bougainville Barreiras — material para o novo site

Levantamento feito em 20/10/2026 para servir de base ao redesign de
https://hotelbougainvillebarreiras.com.br/

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

## Ficha do hotel

| | |
|---|---|
| Nome | Hotel Bougainville |
| Razão social | Hotel Bougainville LTDA |
| CNPJ | 13.212.889/0001-12 |
| Categoria | 3 estrelas |
| Endereço | Av. Clériston Andrade, 1521 – Vila Brasil (Saída para Salvador) – Barreiras/BA – CEP 47801-250 |
| Telefones fixos | (77) 3613-2429 / (77) 3613-9779 |
| Celular / WhatsApp | (77) 9 9944-3086 *(confirmar com o cliente se é WhatsApp)* |
| E-mail | reservas@hotelbougainvillebarreiras.com.br |
| Facebook | https://www.facebook.com/hotelbougainvillebarreiras/ |
| Instagram | não encontrado — pedir ao cliente |
| Check-in / Check-out | 12h / 12h |
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
