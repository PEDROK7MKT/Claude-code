# Kit — Perfil de Empresa no Google (Google Meu Negócio) · FH Vistorias

> Textos prontos para copiar e colar. Os dados abaixo são **idênticos** aos do site
> (`src/data.mjs`). Se algum mudar, mude primeiro lá, rode `node build.mjs` e depois
> atualize aqui e no Google, para manter o NAP (nome, endereço, telefone) igual em tudo.

## 1. Campos principais

| Campo | Valor |
|---|---|
| **Nome** | `FH Vistorias` — sem palavras-chave extras (ex.: "FH Vistorias – Vistoria LEM" viola as diretrizes e pode suspender o perfil) |
| **Categoria principal** | Escolher no painel a opção mais próxima de *inspeção de veículos* (ex.: "Serviço de inspeção de veículos"). Conferir a lista disponível em português na hora do cadastro. |
| **Categorias secundárias** | Só se a empresa prestar de fato o serviço. Não adicionar "Despachante" se não for despachante. |
| **Endereço** | Rua São Francisco, 1516 — Centro, Luís Eduardo Magalhães — BA, 47850-000 |
| **Área de atendimento** | **Não preencher** — o cliente vai até a unidade (loja física). |
| **Telefone** | (77) 99122-8535 |
| **Site** | `https://fhvistorias.com.br/?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| **Link de agendamento/mensagem** | `https://wa.me/5577991228535` (ativar também "Mensagens" se disponível) |
| **Horário** | Seg a sex: 07:30–12:10 e 14:00–17:30 (dois turnos no mesmo dia). Sáb e dom: fechado **[confirmar]**. Cadastrar horários especiais em todo feriado. |
| **Data de abertura** | **[confirmar]** |
| **Atributos** | Marcar só o que for verdade: WhatsApp, acessibilidade **[confirmar]**, estacionamento **[confirmar]**, formas de pagamento **[confirmar]**. |

## 2. Descrição (538 de 750 caracteres)

```
A FH Vistorias é uma empresa credenciada pelo DETRAN-BA em Luís Eduardo Magalhães. Fazemos vistoria de transferência para carros, motos e caminhões, com atendimento rápido, sem agendamento e laudo emitido na hora. Se o veículo for reprovado, você tem até 30 dias úteis para regularizar e voltar sem custo adicional. Valor transparente: R$ 237,00 para carro, moto ou caminhão/reboque. Atendimento de segunda a sexta, das 7h30 às 12h10 e das 14h às 17h30, na Rua São Francisco, 1516, Centro.
```

> Não colocar telefone, link ou promoções na descrição — eles têm campos próprios.

## 3. Serviços (aba "Serviços")

| Serviço | Preço | Descrição curta |
|---|---|---|
| Vistoria de carro | R$ 237,00 | Vistoria credenciada pelo DETRAN-BA para carros, utilitários e picapes. Sem agendamento, laudo na hora. |
| Vistoria de moto | R$ 237,00 | Vistoria para transferência de motocicleta. Sem agendamento, laudo na hora. |
| Vistoria de caminhão e reboque | R$ 237,00 | Vistoria para caminhão, reboque e semirreboque. Avise pelo WhatsApp antes de trazer veículo grande. |
| Vistoria de transferência | R$ 237,00 | Vistoria exigida pelo DETRAN-BA para passar o veículo para o nome do novo dono. |
| Segunda via de vistoria | Consulte | Nova via do laudo de vistoria feita na FH. |
| Retorno após reprovação | Sem custo | Até 30 dias úteis para regularizar e voltar sem pagar de novo. |

## 4. Fotos — lote de lançamento (mínimo 15 reais)

- [ ] Logo (512×512) — usar `public/images/logo-fh-vistorias.png` até ter o vetor oficial
- [ ] Capa — `public/images/og-fh-vistorias.png` ou foto da fachada
- [ ] Fachada de dia (de frente e do outro lado da rua, mostrando a placa)
- [ ] Entrada e recepção
- [ ] Área de vistoria com veículo (carro, moto e caminhão — uma de cada)
- [ ] Equipe uniformizada / vistoriador trabalhando
- [ ] Laudo / tablet / equipamento (sem dados de cliente visíveis)
- [ ] 1 vídeo de 15–30 s mostrando o passo a passo
- Depois: 2 a 4 fotos novas por semana. Não usar banco de imagem nem arte de data comemorativa como foto.

## 5. Verificação

Por vídeo (ou o método que o Google oferecer). Gravar no local, num único take: placa/fachada com o nome, rua e número, interior e algo que prove que você é o responsável (chave da porta, ferramenta de trabalho, documento da empresa).

## 6. Postagens (1 a 2 por semana) — 8 prontas

1. **Valor** — "Vistoria em LEM por R$ 237,00: carro, moto ou caminhão. Sem agendamento e com laudo na hora. Rua São Francisco, 1516, Centro." Botão: *Saiba mais* → `/valores`
2. **Reprovou?** — "Vistoria reprovada não é dor de cabeça: na FH você tem até 30 dias úteis para regularizar e voltar sem custo adicional." → `/vistoria-reprovada-o-que-fazer`
3. **Sem agendamento** — "Não precisa agendar: venha de segunda a sexta, 7h30–12h10 e 14h–17h30." Botão: *Ligar*
4. **Documentos** — "O que levar para a vistoria? O veículo, o documento dele e um documento com foto. Confirme o seu caso pelo WhatsApp." → `/documentos-necessarios`
5. **Transferência** — "Comprou um veículo? A vistoria de transferência é a etapa exigida pelo DETRAN-BA para colocar no seu nome." → `/vistoria-de-transferencia`
6. **Caminhão** — "Atendemos caminhão, reboque e semirreboque. Vai trazer veículo grande? Avise pelo WhatsApp antes." → `/vistoria-de-caminhao`
7. **Moto** — "Vistoria de moto em LEM: R$ 237,00, laudo na hora." → `/vistoria-de-moto`
8. **Bastidor** — foto real da equipe + "Segurança, agilidade e confiança. É assim que a FH trabalha." → `/sobre`

Avisos de feriado: publicar 2 dias antes e cadastrar horário especial.

## 7. Avaliações

**Meta:** 20 avaliações em 60 dias; depois 4 a 8 por mês.

1. Criar o link curto de avaliação no painel (Pedir avaliações) e colar em `BIZ.googleReviewLink` no `src/data.mjs` — o botão "Avaliar no Google" aparece sozinho na página de contato.
2. Imprimir QR Code do link para o balcão.
3. Mensagem pós-atendimento no WhatsApp:

```
Obrigado por escolher a FH Vistorias! Se puder, deixe sua avaliação no Google — leva 30 segundos e ajuda muito outras pessoas de LEM a nos encontrar: [LINK]
```

**Modelos de resposta** (responder 100%, em até 48 h, sem exagerar em palavra-chave):

- Positiva: "Obrigado, [nome]! Ficamos felizes em ajudar na sua vistoria aqui em LEM. Conte sempre com a FH Vistorias!"
- Neutra: "Obrigado pelo retorno, [nome]. Vamos usar o seu comentário para melhorar. Se quiser, fale com a gente no WhatsApp (77) 99122-8535."
- Negativa: "[Nome], sentimos muito pela experiência. Queremos entender o que aconteceu e resolver — pode nos chamar no WhatsApp (77) 99122-8535?"

**Nunca:** comprar avaliação, pedir só para quem gostou, dar desconto ou brinde em troca de nota.

## 8. Instagram e WhatsApp Business

**Bio do Instagram (148 de 150 caracteres):**
```
Vistoria veicular credenciada DETRAN-BA
📍 R. São Francisco, 1516, Centro · LEM-BA
Sem agendamento · Laudo na hora
🕗 Seg–Sex 7h30–12h10 · 14h–17h30
```
- Link na bio: `https://fhvistorias.com.br/?utm_source=instagram&utm_medium=social&utm_campaign=bio`
- Destaques: Valores · Como funciona · Documentos · Localização · Avaliações
- Categoria do perfil comercial: serviço automotivo; endereço preenchido.

**WhatsApp Business:** mesmo endereço, horário (dois turnos), site, e-mail; catálogo com os 4 serviços e preços; mensagem de ausência fora do horário; etiqueta "avaliação enviada".

## 9. Citações — cadastrar com o NAP exatamente assim

```
FH Vistorias
Rua São Francisco, 1516 — Centro, Luís Eduardo Magalhães — BA, 47850-000
(77) 99122-8535
https://fhvistorias.com.br
```

- [ ] Bing Places (dá para importar do Google)
- [ ] Apple Business Connect (Apple Maps / Siri)
- [ ] Facebook (página da empresa)
- [ ] Waze (Waze for Cities / editor de lugares)
- [ ] Foursquare
- [ ] Guias comerciais locais e a associação comercial de LEM
- [ ] Parcerias com despachantes e revendas de LEM (link para o site)

Depois de criar o perfil, cole a URL do Google Maps em `BIZ.googleMapsProfile` e as coordenadas em `BIZ.geo` (`src/data.mjs`) e rode o build: elas entram no `sameAs`/`hasMap`/`geo` do JSON-LD.
