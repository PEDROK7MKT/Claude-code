# Auditoria de presença digital — Hotel Bougainville (Barreiras-BA)

Data: 21/11/2026 · Escopo: site e domínio, plataformas de reserva (OTAs) e
metabuscadores, mapas e diretórios, redes sociais, reputação, concorrência,
visibilidade em buscas e em assistentes de IA.

Legenda: **(snippet)** = dado visto só no resumo de busca, porque o site bloqueia
leitura automática; precisa ser conferido manualmente.

---

## 1. Resumo executivo

| Área | Situação | Comentário |
|---|---|---|
| Site e segurança | 🟢 Ótimo | Site novo no ar no domínio oficial, Lighthouse 100/100/100/100 no celular |
| Domínio | 🟡 Atenção | Vence em **31/01/2027**; contato administrativo ainda é o dev antigo |
| E-mail | 🟡 Atenção | Funciona, mas fica na conta Uni5 do dev; sem DMARC |
| Plataformas de reserva | 🔴 Fraco | Só Booking/Agoda de verdade; fora de Expedia, Hoteis.com, Decolar, Trip.com |
| Informações nas plataformas | 🔴 Fraco | Check-in, café, CEP, telefone e quartos errados em quase todas |
| Google Maps / Perfil da Empresa | 🔴 Urgente | Possível ficha duplicada marcada **"fechado permanentemente"** |
| Reputação | 🟡 Médio | ~8/10 nas OTAs, **3,5/5 no TripAdvisor**; ninguém responde avaliações |
| Visibilidade em busca/IA | 🔴 Fraco | Não aparece em "hotel em Barreiras" nem nas listas que as IAs citam |
| Redes sociais | 🟡 Médio | Instagram e Facebook existem; Facebook sem WhatsApp; sem TikTok/YouTube |

**As 5 ações de maior impacto:**
1. Reivindicar e corrigir o **Perfil da Empresa no Google** e eliminar a ficha "fechada".
2. Corrigir os dados no **extranet do Booking**, que alimenta Agoda, Kayak, Trivago e dezenas de sites-clone.
3. Entrar em **Expedia/Hoteis.com e Decolar** (eles dominam as buscas "hotel em Barreiras").
4. Programa de **avaliações** (pedir no check-out + responder todas), começando pelo TripAdvisor.
5. **Renovar o domínio** e assumir o contato administrativo antes de 31/01/2027.

---

## 2. Ativos próprios

### Site — https://hotelbougainvillebarreiras.com.br
- No ar desde 03/11/2026, hospedado na Vercel; `www` redireciona para o domínio principal.
- Lighthouse (celular): **Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100**.
  LCP 1,9 s, CLS 0, TBT 30 ms.
- Segurança: HTTPS + HSTS, CSP rígida, X-Frame-Options, nosniff, Referrer/Permissions-Policy.
  Caminhos do WordPress antigo bloqueados (403); páginas de demonstração antigas dão 404;
  URLs antigas válidas (`/about-us/`, `/home-3/`) redirecionam.
- SEO/GEO: schema.org `Hotel` + `HotelRoom` + `FAQPage`, sitemap, robots liberando robôs de IA, `llms.txt`.
- **Pendente:** cadastrar no **Google Search Console** e no **Bing Webmaster Tools** e enviar o sitemap.
  Hoje o site não aparece nem na busca pela marca (é novo); o Google ainda mostra títulos
  antigos ("Home 3 - Hotel Boungainville"), que somem após a reindexação.
- Pequeno ajuste de acessibilidade: o rótulo do logo não bate com o texto visível (corrigir).

### Domínio — hotelbougainvillebarreiras.com.br (Registro.br)
- Titular: Hotel Bougainville LTDA (CNPJ 13.212.889/0001-12) ✅
- Contato técnico: PEGOM273 (agência) ✅ · **Contato administrativo: MMS875 (dev antigo)** ⚠️
- **Expira em 31/01/2027** ⚠️ — renovar já (de preferência por vários anos).
- DNS: Registro.br (d.sec.dns.br / f.sec.dns.br). Site → Vercel; e-mail → Uni5.

### E-mail — reservas@hotelbougainvillebarreiras.com.br
- MX e SPF apontam para a Uni5 e funcionam.
- **Risco:** a caixa está na conta de hospedagem do dev antigo. Se ele cancelar, o e-mail para.
- **Sem DMARC e sem DKIM** — e-mails do hotel podem cair em spam.
- Ação: migrar para Google Workspace ou Zoho Mail no nome do hotel e configurar SPF/DKIM/DMARC.

---

## 3. Plataformas de reserva e metabuscadores

| Plataforma | Está? | Nota | Problemas encontrados |
|---|---|---|---|
| Booking.com | ✅ | 7,9–8,4 (264–280 aval.) | Versão EN dizia "não aceita reservas no momento" (snippet) — **conferir no extranet**; preço visto R$451, o mais alto da cidade na data |
| Agoda | ✅ (via Booking) | 8,2 (249) (snippet) | Check-in/out 12h/12h |
| Kayak | ✅ | 8,4 (206) | 12h/12h; quartos "Standard/Deluxe"; sem WhatsApp e sem site |
| Trivago | ✅ | 7,7 (236) (snippet) | 12h/12h |
| Google Hotels | ✅ | 4,2 (124) (snippet) | Não verificado: site, telefone, fotos |
| TripAdvisor | ✅ | **3,5/5 (46)** (snippet) | Avaliações antigas (2014–2016); CEP 47800-390 errado; sem resposta da gerência |
| Skyscanner | ✅ | — | CEP 47801-050 errado; café não informado |
| Wego | ✅ | 8,4 (149) | CEP duplo, "70 quartos", 12h |
| Hurb | ✅ | — | **Check-in 15h** (errado) |
| Atrápalo | ✅ | 7,5 (2) | Diz que **aceita pets e tem piscina** (errado) |
| ZenHotels, Destinia, cozycozy, GoHotels | ✅ | 7,0–8,3 | Destinia: "Boungainville", CEP errado, preço R$0 |
| hotels-brazil.net e outros clones | ✅ | — | Diz que **café NÃO é servido** (errado); fora do controle do hotel |
| **Expedia / Hoteis.com** | ❌ | — | Concorrentes (Ventura, Solar, Morubixaba) estão |
| **Decolar** | ❌ | — | — |
| **Trip.com** | ❌ | — | Lista "melhores hotéis" de Barreiras não inclui o Bougainville |
| Momondo / HotelsCombined | ❌ | — | Ausente das listas da cidade |
| Airbnb, MaxMilhas, Zarpo, CVC, ViajaNet | ❌ | — | — |
| Motor de reservas / channel manager | ❌ | — | Reserva só por WhatsApp; sem Omnibees/HBook/Cloudbeds |

**Erro que se repete em quase todas:** check-in/check-out 12h/12h (correto 13h/11h);
café da manhã não informado como incluso; CEP 47801-050 (correto 47801-250);
só o fixo 3613-2429 (sem WhatsApp); quartos com nomes genéricos; site oficial ausente.
**Número de quartos** varia entre 35, 70 e 72 — confirmar com o hotel.

---

## 4. Mapas, diretórios e cadastros oficiais

| Onde | Situação | Ação |
|---|---|---|
| **Google Perfil da Empresa** | Ficha ativa 4,2★ (124) (snippet). Indício de **ficha duplicada "Hotel Bougainville de Barreiras", 4,1★ (758), "fechado permanentemente"** (Cybo, snippet) | **Urgente:** verificar no Maps, reivindicar, unificar/reabrir, colocar WhatsApp, site, fotos novas, check-in 13h |
| **Receita Federal (CNPJ)** | Ativa, CNAE Hotéis; **telefones antigos (77) 3611-5698 / 3611-7799** e e-mail do contador | Atualizar via contador (REDESIM/JUCEB) — essa base alimenta dezenas de diretórios |
| **Cadastur (MTur)** | Não verificado (portal fora do ar na auditoria) | Consultar o CNPJ; obrigatório para meios de hospedagem |
| OpenStreetMap | Prédio sem endereço → apps deduzem "Flamengo, 47800-390" | Adicionar endereço completo, telefone e site (alimenta Apple Maps e apps) |
| TeleListas | 2 fichas, telefone antigo e CEP errado | Corrigir/unificar |
| Solutudo | 2 fichas, telefones antigos | Corrigir/unificar |
| Pousadas.vip | Categoria "Pousada", horário seg–sex 9h–18h, cidade errada (PA) | Reivindicar e corrigir |
| Hotel.com.br | "Boungainville", sem número | Pedir correção |
| Foursquare | Ficha de 2014–2016 | Atualizar |
| Cvent | 72 quartos, sem telefone/site, FAQ vazio | Completar (atrai eventos corporativos) |
| **Apple Maps, Bing Places, Waze** | Não encontrado | **Cadastrar** (Apple Business Connect, Bing Places) |
| Apontador, GuiaMais, Yelp | Não encontrado | Cadastrar (baixa prioridade) |
| Prefeitura / Setur Barreiras | Sem lista de hospedagem encontrada | Contatar a secretaria de turismo |

---

## 5. Reputação

| Fonte | Nota | Avaliações |
|---|---|---|
| Kayak | 8,4 | 206 |
| Booking | 7,9–8,4 | 264–280 |
| Agoda | 8,2 | 249 |
| Trivago | 7,7 | 236 |
| Google | 4,2 / 5 | 124 (snippet) |
| **TripAdvisor** | **3,5 / 5** | 46 (antigas) |
| Facebook | 8 recomendações | 8 |

- Pontos fortes nas notas detalhadas: **localização (8,5–8,7)** e **café (8,5)**.
- Pontos fracos (Kayak): **limpeza 6,0 · serviço 6,0 · estacionamento 6,0**.
- **Elogios:** localização, simpatia da equipe, café com variedade, quartos grandes, estacionamento grátis, silêncio à noite.
- **Reclamações:** café "fraco" em algumas avaliações recentes (inclusive jan/2026), recepção pouco experiente, poucas vagas de garagem, relato de manutenção (elevador travando), barulho da BR (avaliação antiga).
- **Nenhuma resposta da gerência encontrada** nas plataformas.
- A reforma recente (fotos de 2026) ainda não aparece nas avaliações e nas fotos das OTAs — oportunidade.

---

## 6. Redes sociais

| Canal | Situação |
|---|---|
| Instagram @hotelbougainville | Oficial; seguidores e link da bio não verificados (bloqueio) — **conferir se a bio tem o site e o WhatsApp** |
| Facebook /hotelbougainvillebarreiras | ~852 seguidores, 8 recomendações; nome "Hotel bougainville" (b minúsculo); telefone fixo, **sem WhatsApp** |
| TikTok, YouTube, LinkedIn | Não encontrado |

Atenção a homônimos: @bouganvillehotel (Beberibe-CE) e outros "Bougainville" no Brasil.

---

## 7. Concorrência (Barreiras)

| Hotel | Nota (Booking) | Diferencial | Força online |
|---|---|---|---|
| Ventura Hotel | 8,6 (489) · TA nº 1 | Café muito elogiado | ⭐⭐⭐ |
| Solar das Mangueiras | 7,6 (940) | Piscina, restaurante, aceita pet; Instagram ~6,5 mil | ⭐⭐⭐ |
| Paris Hotel / Apart | 8,7 (255) | Café buffet | ⭐⭐ |
| Hotel Morubixaba | Kayak 7,6 | Restaurante, 3 salas de reunião; Instagram ~8,3 mil | ⭐⭐ |
| Rancho Verde | 8,7 (219) | Piscina, academia | ⭐⭐ |
| Hotel Rio Grande | 8,4 (100) | Centro | ⭐ |
| Príncipe Hotel | 7,9 (89) | Piscina, centro | ⭐ |
| Barreiras Loft / City House | 9,2 (337) | Apartamentos baratos | ⭐⭐ |
| **Bougainville** | 7,9–8,4 (~270) | 72 quartos, elevador, café incluso, **site próprio** | ⭐ hoje |

- **Nenhum concorrente tem site próprio forte** — vantagem real do Bougainville se o site for indexado e trabalhado.
- No dia da coleta, o Bougainville estava **mais caro** que os concorrentes diretos no Booking (R$451 × R$240–322). Revisar a estratégia de tarifa e paridade.

---

## 8. Visibilidade em buscas e IA

| Busca | Bougainville aparece? |
|---|---|
| hotel em Barreiras BA | Não |
| melhores hotéis em Barreiras | Não |
| hotel perto do aeroporto de Barreiras | Só em "mais reservados" no Booking |
| hotel Barreiras café da manhã | Não |
| onde ficar em Barreiras | Não |
| hotel Barreiras Bahia Farm Show | Não |
| Hotel Bougainville Barreiras (marca) | Sim, mas por agregadores; o site novo ainda não |

As IAs (ChatGPT, Gemini, Perplexity) respondem a partir dessas listas (Booking, Trip.com,
TripAdvisor, Hoteis.com) — por isso hoje tendem a não recomendar o Bougainville.

---

## 9. Calendário de demanda

- **Bahia Farm Show 2027: 7 a 12 de junho** (Luís Eduardo Magalhães; em anos anteriores os hotéis da região lotaram dias antes).
- São João: segunda quinzena de junho (2025: 18 a 21/06).
- Carnaval Barreiras Folia (2026: 405 mil pessoas em 5 dias).
- Aniversário de Barreiras: 26 de maio.
- Turismo de natureza (Rio de Ondas, cachoeiras): melhor época de maio a setembro.
- Dia a dia: demanda corporativa e do agronegócio durante a semana.

---

## 10. Plano de ação

### Imediato (próximas 2 semanas)
- [ ] Renovar o domínio (vence 31/01/2027) e pedir ao dev o contato administrativo.
- [ ] Google Perfil da Empresa: reivindicar, verificar a ficha "fechada", corrigir tudo, fotos novas.
- [ ] Google Search Console + Bing Webmaster: verificar domínio e enviar sitemap.
- [ ] Extranet do Booking: confirmar se está aceitando reservas; corrigir check-in 13h, check-out 11h, café incluso, quartos, CEP, WhatsApp, site, fotos novas.
- [ ] Consultar o Cadastur do CNPJ.
- [ ] Instagram e Facebook: bio com site e WhatsApp; Facebook com nome "Hotel Bougainville".

### Curto prazo (30–60 dias)
- [ ] Cadastrar em **Expedia/Hoteis.com** e **Decolar**.
- [ ] Reivindicar o **TripAdvisor**, corrigir dados, responder avaliações.
- [ ] Apple Business Connect, Bing Places, Waze, OpenStreetMap.
- [ ] Corrigir TeleListas, Solutudo, Pousadas.vip, Hotel.com.br, Foursquare, Cvent, Hurb, Atrápalo, Skyscanner.
- [ ] Atualizar telefones na Receita (via contador).
- [ ] Migrar o e-mail para Workspace/Zoho no nome do hotel + DMARC/DKIM.
- [ ] Programa de avaliações: QR code na recepção e mensagem de WhatsApp pós-check-out pedindo avaliação no Google/TripAdvisor.

### Médio prazo (60–120 dias)
- [ ] Motor de reservas + channel manager (ex.: Omnibees, HBook, Cloudbeds) → reserva direta no site e **Google Hotels Free Booking Links**.
- [ ] Página "Hospedagem para a Bahia Farm Show 2027" (pré-reserva, grupos, empresas expositoras) — publicar até fevereiro.
- [ ] Página corporativa (tarifa acordo, nota fiscal, faturamento para empresas do agro).
- [ ] Conteúdos-guia para busca e IA: "Onde ficar em Barreiras", "Como chegar ao Rio de Ondas", "Barreiras no São João".
- [ ] Revisão de tarifa vs. concorrentes e paridade entre OTAs e venda direta.

### Rotina mensal (serviço contínuo)
- Responder 100% das avaliações (Google, Booking, TripAdvisor).
- Relatório de notas, volume de avaliações, posição nas buscas e reservas diretas.
- Conferir dados nas plataformas (horários, fotos, tarifas).
- Posts e Reels no Instagram (café, quartos, localização, eventos da cidade).

---

## 11. Confirmar com o hotel
- Número exato de quartos (35, 70 ou 72 aparecem nas plataformas).
- Distância real até o aeroporto (plataformas dizem 7,6 km, 10 km e 17 km).
- Quem tem acesso ao extranet do Booking, ao Google Perfil da Empresa e ao TripAdvisor.
- Se o Booking está aceitando reservas.
- Número do Cadastur.
- Dados do Instagram (seguidores, quem administra).

## 12. Limitações
Google Maps, Instagram, Facebook, Booking, TripAdvisor, Agoda, Trivago e vários diretórios
bloqueiam leitura automática; nesses casos usamos os resumos de busca, marcados como
(snippet). Preços e notas mudam com o tempo e a data pesquisada. O portal do Cadastur estava
fora do ar durante a auditoria.
