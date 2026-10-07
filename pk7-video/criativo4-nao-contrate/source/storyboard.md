# PK7 · Criativo 4 — "NÃO CONTRATE A PK7 (se você for um desses 4)"

**Formato:** Reels/Feed 1080×1920 · 30 fps · **45,6 s** (1368 frames) · motion graphics em HTML/CSS/JS renderizado frame a frame
**Voz:** Raquel (ElevenLabs), PT-BR, 3ª pessoa · 112 palavras faladas (PK7 contado como 3) · média de 2,46 palavras/s, nenhuma cena acima de 2,7
**Base:** conceito A (maior soma dos juízes: 47 + 46 + 48), com todos os must-fix aplicados
**Enxertos:** o "recibo" do B (sublinhado vermelho no trecho das agências e marca-texto lime no trecho da PK7, no mesmo print real), o "intervalo" cinético do B (INCENTIVO + PERSONALIZAÇÃO), o princípio do C (a borda do recorte é a borda do oclusor), as camadas de música do C, a ressalva "é muito comum" mantida dentro do recorte e os chips que espelham a citação, ambos do D, o rig de oclusão T4 e o selo die-cut T3
**Capa (thumbnail):** frame **15,6 s**, com o quadro lime "CONTRATE A PK7 SE VOCÊ…" e o Pedro comemorando. Nunca usar o frame 0 ("NÃO CONTRATE") como capa.

Keyframes de referência já renderizados com o mesmo grid deste roteiro (mock estático, não é o vídeo final):
`scratchpad/c4/sb/kf/hook.png · dq4.png · cover.png · r1.png · r2.png · r3.png · r4.png · num.png · num3.png · cta.png` (as versões `_qa.png` mostram a zona segura).
Mock e QA: `scratchpad/c4/sb/keyframes.html`, `shoot.js` (`--sweep` faz 51 passos de subida) e `check.py`. Resultado: **0 px expostos** nos 102 frames de subida/descida dos dois rigs.

---

## 1. A ideia em uma frase
Uma marca que manda você **não** contratá-la, se você for um dos 4 perfis errados. Os 4 vícios saem do próprio texto da IA do Google: métricas de vaidade, relatórios mensais complexos, pacotes padronizados e ser "passado" para júnior ou estagiário. O quadro vermelho vira um painel split-flap: ✕ vira ✓ e o "NÃO" cai da tela. Cada ✓ ganha um **recibo**, um print real do Google. Depois vem "prova, não promessa", e o fecho retoma o começo: "Ainda tá aqui? Então você não é nenhum dos 4."

## 2. Por que é melhor que V1, V2 e V3
1. **O gancho é mais forte.** "NÃO CONTRATE A PK7." aparece com carimbo vermelho no frame 0, e a lista vazia de 4 itens já está na tela em 1,0 s. O espectador passa a se perguntar sobre si mesmo. V1, V2 e V3 abriam com premissa neutra ou com uma história de dor.
2. **Um único objeto conduz a história.** O quadro passa de lista vazia a ✕ vermelhos, vira split-flap, ganha ✓ lime, se transforma nas manchetes dos recibos e volta no fecho. Os 4 motivos estão na tela aos **13,2 s**.
3. **A autoridade do Google ganhou outra função.** Cada print agora mostra os dois lados no mesmo parágrafo real: o vício das agências com sublinhado vermelho e o diferencial da PK7 com marca-texto lime. Não repete o ciclo pergunta/print da V3.
4. **O avatar está resolvido na geometria.** O Pedro só aparece atrás de um objeto opaco da cena (rig T4, com recorte cuja borda está dentro do oclusor) ou como selo die-cut (T3). O hero-present só aparece segurando dois cards que cobrem as mãos cortadas. Isso foi verificado em 102 frames de subida, com 0 px de borda exposta.
5. **CTA com uma ação só e rastreável.** O espectador toca no WhatsApp com a mensagem sugerida "Oi Pedro, não sou nenhum dos 4 😄", que serve de palavra-chave do anúncio. Não há pílula de busca, que a V1 e a V3 já tinham usado.

## 3. Grid global e componentes

**Zona segura:** todo conteúdo importante fica em **y 250–1230**. Abaixo de y 1000, nada passa de **x 920**. O eixo é x = 540 e os cards ocupam **x 160–920** (760 de largura). Manchetes ficam em y 262–454, com linhas de 76 px (y 262–338 e 350–426), salvo indicação.
**Tokens:** os de `video3/index.html` (linhas 1–66): navy #0A0F2C, lime #B7E400, blue #1E50E6, light #F4F6FF, card #121A3A, muted #8A93B8, loss #FF4D5E. Fundo `.scene` com grade de pontos, `#grain` e `#vig`.
**Fontes:** Space Grotesk 700 em caixa alta, com letter-spacing −0,01em, para manchetes, chips e quadro. Plus Jakarta Sans 600/700 para o corpo. Todas as larguras abaixo foram **medidas no Chromium com as fontes reais**.

**QUADRO (o objeto central).** Fundo #0E1640 **100% opaco**, raio 28, borda 2 px rgba(255,255,255,.08), sombra 0 40px 90px −30px rgba(0,0,0,.85).
Cada linha tem raio 18 e é composta por: tile de número (contorno 3 px rgba(255,255,255,.18), Space Grotesk 28), texto e caixa de check.
- Caixa de check vazia: contorno 4 px #FF4D5E.
- Linha ✕: fundo rgba(255,77,94,.13) e caixa preenchida #FF4D5E com ✕ branco.
- Linha ✓: fundo #B7E400, texto navy e caixa navy com ✓ lime.

| Estado | Quando | Retângulo | Linhas | Texto | Tile / check |
|---|---|---|---|---|---|
| B0 vazio | 0–2,8 s | x160 y724 760×496, pad 20 | 4×109, gap 8, barras cinza no lugar do texto | — | 56 / 60 |
| B1 dock | 3,1–11,9 s | x160 y888 760×334, pad 14 | 4×70, gap 6 | 40 px (a mais longa, "QUER RELATÓRIO BONITO", mede 459 px) | 44 / 48 |
| B2 centro + flap | 12,25–14,2 s | x160 y540 760×534, pad 20 | 4×116, gap 10 | 42 px dentro do flap ("QUER FALAR COM O PEDRO" mede 516 px) | 52 / 56 |
| B3 rodapé | 14,55–16,75 s | x160 y780 760×444, pad 18 | 4×96, gap 8 | 42 px | 52 / 56 |

**RECIBO (print real).** Card branco x 160–920, raio 28, sombra 0 40px 90px −30px rgba(0,0,0,.8).
- Cabeçalho: na faixa y+22 a y+58, ponto Google de 4 cores (28 px) + "Google · Modo IA" (Plus Jakarta 700 24, #5F6368). À direita, a pílula "● PRINT REAL" (ponto #FF4D5E, Space Grotesk 22 navy, fundo #FFECEE).
- Divisor de 2 px #EEF1F7 em y+68.
- Recorte do print em y+80, largura 708 (x 186–894), com overflow hidden. Margem inferior de 24.
- Marcas por cima do print:
  - **Marca-texto lime**: rgba(183,228,0,.62) com mix-blend-mode multiply, raio 6, varrendo da esquerda para a direita. Nunca cobre o texto.
  - **Sublinhado vermelho**: 6 px #FF4D5E, raio 3, desenhado da esquerda para a direita.
- O pixel do print **nunca é alterado**: sem véus, sem tarjas, sem riscos. O PT-PT do print ("equipa", "Contacto", "gostos") fica como está.
- **Legenda** 18 px abaixo do card: "▬ VÍCIOS DAS AGÊNCIAS" (traço vermelho) · "▬ DIFERENCIAL PK7" (traço lime), em Space Grotesk 22, rgba(244,246,255,.8). Os dois termos vêm do próprio texto do Google ("vícios das agências comuns", "diferenciais").

**Transições:**
- Máscara de linha nas manchetes: 0,3 s, com 0,08 s entre linhas.
- Whip-pan entre recibos: 0,2 s com motion blur de 3 frames.
- Slash lime/azul (#cur) em S11→S12.
- Corte seco com scratch em S12→S13.

---

## 4. Narração

**Texto (como se lê):**
> Não contrate a PK7 se você… quer curtida, e não cliente. Quer relatório bonito todo mês. Quer pacote pronto, de prateleira. Ou aceita ser passado pro estagiário. Agora, se você quer o contrário… a PK7 é pra você. Quem descreve é a IA do Google: foco em faturar. Sem pacote padrão: time de especialistas sob demanda. E você fala direto com o Pedro. Não com estagiário. A IA do Google resume: incentivo e personalização. Cem mil faturados como parceiro Appmax. Hoje, mais de quinhentos mil em e-commerce próprio. Mais de quarenta clientes. Ainda tá aqui? Então você não é nenhum dos quatro. Chama o Pedro no WhatsApp.

**Para o ElevenLabs (bloco único, com grafia fonética):**
> Não contrate a pê cá sete... se você... quer curtida, e não cliente. Quer relatório bonito todo mês. Quer pacote pronto, de prateleira. Ou aceita ser passado pro estagiário. Agora... se você quer o contrário... a pê cá sete é pra você. Quem descreve é a i-á do Google: foco em faturar. Sem pacote padrão: time de especialistas sob demanda. E você fala direto com o Pedro. Não com estagiário. A i-á do Google resume: incentivo e personalização. Cem mil faturados como parceiro Ép-max. Hoje, mais de quinhentos mil em i-comérci próprio. Mais de quarenta clientes. Ainda tá aqui? Então você não é nenhum dos quatro. Chama o Pedro no WhatsApp.

Gere em uma passada só. Depois corte e alinhe cada frase às janelas abaixo; uma folga de até ±0,15 s por frase é aceitável. Se a Raquel passar da janela, encurte a pausa "..." antes de acelerar.

---

## 5. Roteiro cena a cena

Notação: **(lime)** indica palavras em #B7E400. Coordenadas em px no canvas 1080×1920.

### S01 · 0,00–3,00 · GANCHO: "Aviso honesto"
**Texto na tela:**
- Pílula: "⚠ AVISO HONESTO"
- Linha 1: [carimbo vermelho "NÃO"] "CONTRATE"
- Linha 2 **(lime)**: "A PK7."
- Subtítulo: "…SE VOCÊ FOR **UM DESSES 4: (lime)**"
- Quadro B0: 4 linhas vazias (1–4), com barras cinza e caixas de contorno vermelho.

**Layout:**
- Pílula: Space Grotesk 28, contorno 3 px #FF4D5E, fundo rgba(255,77,94,.12), texto #FF4D5E. Centrada em y 250–298, cerca de 290 px de largura.
- Linha 1: y 318–462, 112 px.
  - Carimbo "NÃO": fundo #FF4D5E, texto branco, borda 7 px #C8283A, raio 16, girado −4°, sombra lime-red.
  - Gap de 24 até "CONTRATE".
  - A linha toda mede cerca de 845 px e ocupa x ≈117–962.
- Linha 2: "A PK7." com 150 px e 426 de largura, em y 478–628.
- Subtítulo: 46 px, 616 de largura, em y 652–698.
- Quadro: B0 em x 160–920, y 724–1220.

**Movimento:**
- **Frame 0 já legível, sem fade.** Pílula e linhas 1–2 estão na tela. O carimbo nasce em escala 1,10 e assenta em 1,0 até 0,25 s, com tremida de câmera de 6 px que decai.
- 0,25–0,55: o subtítulo sobe por máscara.
- 0,40–0,95: o quadro cai (y +60→0, com fade). As linhas entram com um clique cada, em 0,45, 0,57, 0,69 e 0,81.
- **Em 1,0 s, tudo está na tela.**
- 1,0–2,8: push-in lento de 1,00→1,03. O tile "1" pisca lime em 2,2 e em 2,6.
- 2,80–3,10 (dock):
  - A pílula some.
  - "A PK7." sobe e se junta ao fim da linha 1, que vira "[NÃO] CONTRATE A PK7" em 64 px, y 252–338.
  - O subtítulo encolhe e vira a linha 2, "SE VOCÊ…" **(lime)**, 64 px, y 352–416.
  - O quadro compacta para B1.

**Avatar:** nenhum.
**Narração (0,05–2,75):** "Não contrate a PK7 se você…" (8 palavras em 3,0 s, 2,67/s).
**Efeitos sonoros:**
- 0,00: baque de carimbo + sub hit.
- 0,25: tique de máquina de escrever no subtítulo.
- 0,45/0,57/0,69/0,81: 4 cliques de UI.
- Música: pizzicato irônico e esparso + baixo abafado, 120 BPM.

### S02 · 3,00–5,20 · Desqualificador 1: QUER CURTIDA
**Texto na tela:** "PROMO DE HOJE!" · "CURTIDAS ↑↑↑" · "caixa" · "exemplo" · linha 1 do quadro: "QUER CURTIDA" + ✕

**Layout:** palco de foco em x 160–920, y 440–870.
- Card de post (#121A3A, raio 28): x 290–790, y 450–860, rotação 3°.
  - Topo de 64 px: círculo cinza e 2 barras cinza. Não aparece nome de marca.
  - Imagem 500×260 com gradiente 135° #1E50E6→#B7E400 e "PROMO DE HOJE!" (Space Grotesk 44, branco).
  - Barra de ações: ♥ vermelho cheio e "CURTIDAS ↑↑↑" (Space Grotesk 26).
- Bloco "caixa" sobreposto: x 640–860, y 790–860, rotação −2°, fundo navy, borda rgba(255,77,94,.5). Leva "caixa" (Plus Jakarta 24, muted) e uma **linha vermelha reta, sem número**.
- Tag "exemplo" (Plus Jakarta 600 24, 80% branco) dentro do card, embaixo à esquerda.

**Movimento:**
- 3,00–3,30: o card entra pela direita com mola.
- 3,45: duplo toque. Um coração branco gigante salta no centro (0→1,3→1 em 0,25 s) e some entre 3,9 e 4,1.
- 3,5–5,0: 12 corações pequenos sobem pela borda direita.
- 4,40–4,70: a linha 1 digita "QUER CURTIDA" (0,03 s por caractere).
- 4,80: ✕ carimbado (1,6→1 em 5 frames), com flash vermelho na linha.
- 5,00–5,20: o card sai pela esquerda (x −800, rotação −8°).

**Avatar:** nenhum.
**Narração (3,10–4,90):** "…quer curtida, e não cliente." (5 palavras em 2,2 s, 2,27/s).
**Efeitos sonoros:** swoosh de entrada · "pop" no duplo toque · "plinks" de curtida acelerando · tiques de digitação · baque de buzzer no ✕ (4,80).

### S03 · 5,20–7,40 · Desqualificador 2: QUER RELATÓRIO BONITO
**Texto na tela:** "RELATÓRIO MENSAL ✨" · "alcance ↑ · impressões ↑ · engajamento ↑" · "✨ LINDO!" · "…e as vendas?" · "exemplo" · linha 2: "QUER RELATÓRIO BONITO" + ✕

**Layout:**
- PDF brilhante, branco, 480×380: x 300–780, y 460–840, rotação −3°.
  - Faixa de cabeçalho em gradiente azul→lime com "RELATÓRIO MENSAL ✨" (Space Grotesk 28, branco).
- Selo dourado "✨ LINDO!" (Space Grotesk 26): x 640–790, y 450–500, rotação 10°.
- Post-it #FF6B78: 220×140 em x 610–830, y 720–860, rotação −8°, com "…e as vendas?" (Plus Jakarta 700 34, branco).
- Tag "exemplo" dentro do PDF, embaixo à esquerda.
- **Nenhum número em lugar nenhum.**

**Movimento:**
- 5,20–5,50: o PDF sobe com whoosh de papel.
- 5,55–6,15: 4 páginas folheiam, cada uma com um gráfico bonito: rosca, 3 barras subindo, sparkline e a linha "alcance ↑ · impressões ↑ · engajamento ↑" (22 px).
- 6,05: o selo "LINDO!" estala.
- 6,30: o post-it bate.
- 6,60–6,90: a linha 2 digita.
- 7,00: ✕.
- 7,20–7,40: o PDF sai pela esquerda.

**Avatar:** nenhum.
**Narração (5,30–7,10):** "Quer relatório bonito todo mês." (5 palavras em 2,2 s, 2,27/s).
**Efeitos sonoros:** whoosh de papel · folhear rápido · brilho/shimmer · tapa do post-it · baque no ✕.

### S04 · 7,40–9,60 · Desqualificador 3: QUER PACOTE PRONTO
**Texto na tela:** "mesma caixa pra todo mundo" · "BARBEARIA" · "CLÍNICA" · "RESTAURANTE" · "PADRÃO" (×3) · "exemplo" · linha 3: "QUER PACOTE PRONTO" + ✕

**Layout:**
- Legenda "mesma caixa pra todo mundo": Plus Jakarta 600 32, #C5CEF0, 456 de largura, em y 460–500.
- Esteira: x 160–920, y 790–822, cinza-escuro com chevrons andando a 300 px/s.
- 3 caixas de papelão idênticas (170×150, kraft #C8A270 com fita) em y 640–790. Cada uma tem uma etiqueta branca (Space Grotesk 20 navy): BARBEARIA, CLÍNICA, RESTAURANTE.
- Prensa navy (#1A2350, borda lime) em x 470–610, y 440–600.
- Tag "exemplo" em x 170, y 836.

**Movimento:**
- As caixas entram em 7,45 pela esquerda, a 420 px/s, com espaçamento de 250.
- A prensa bate em 7,95, 8,35 e 8,75, quando cada caixa passa por x 540 (0,12 s para descer, 0,15 s para subir). A cada batida fica o carimbo vermelho "PADRÃO" (Space Grotesk 30, contorno, rotação −6°).
- 8,80–9,10: a linha 3 digita.
- 9,20: ✕.
- 9,40–9,60: tudo sai pela esquerda.

**Avatar:** nenhum.
**Narração (7,50–9,30):** "Quer pacote pronto, de prateleira." (5 palavras em 2,2 s, 2,27/s).
**Efeitos sonoros:** zumbido da esteira · 3 batidas metálicas da prensa no tempo · baque no ✕.

### S05 · 9,60–11,90 · Desqualificador 4: ACEITA ESTAGIÁRIO
**Texto na tela:** "Agência · atendimento" · "cena ilustrativa" · "VENDEDOR" · "contrato assinado ✓" · "ESTAGIÁRIO" · "EM TREINAMENTO" · "transferindo seu atendimento…" · linha 4: "ACEITA ESTAGIÁRIO" + ✕

**Layout:** tela de transferência (não é chat), card #121A3A com raio 32, em x 200–880, y 450–860.
- Cabeçalho de 96 px: círculo cinza "A" + "Agência · atendimento" (Plus Jakarta 700 30). À direita, **"cena ilustrativa"** (Plus Jakarta 600 24, rgba(244,246,255,.82)).
- Lado esquerdo: coluna de 240 de largura em x 230–470 com círculo cinza de 110, "VENDEDOR" (Space Grotesk 26, #C5CEF0) e "contrato assinado ✓" (Plus Jakarta 600 22, lime).
- Seta tracejada no centro.
- Lado direito: coluna em x 620–850 com círculo de anel vermelho, "ESTAGIÁRIO" (Space Grotesk 26) e o selo amarelo #FFD24D "EM TREINAMENTO" (Space Grotesk 18, navy).
- "transferindo seu atendimento…" (Plus Jakarta 700 28, #C5CEF0) em y 780.
- Barra de progresso em y 822, com 10 px de altura.

**Movimento:**
- 9,60–9,90: o card entra (escala 0,9→1, com fade).
- 10,00: "contrato assinado ✓" estala.
- 10,25–10,55: a seta se desenha. Entre 10,30 e 10,70, um ícone de pasta desliza do vendedor ao estagiário, ilustrando o "passado".
- 10,70: aparece "transferindo…". A barra rasteja até cerca de 68% e trava, sem mostrar %.
- 11,00–11,30: a linha 4 digita.
- 11,40: ✕. As 4 linhas ficam vermelhas.
- 11,50: o quadro treme ±6 px por 0,2 s.
- 11,70–11,90: o card sai.

**Avatar:** nenhum.
**Narração (9,70–11,70):** "Ou aceita ser passado pro estagiário." (6 palavras em 2,3 s, 2,61/s).
**Efeitos sonoros:** blip de chamada transferida · música de espera abafada (1 compasso) · loop de spinner · baque no ✕ · tremida do quadro.

### S06 · 11,90–14,20 · A VIRADA: split-flap
**Texto na tela:**
- Linha 1: QUER CURTIDA → **QUER VENDA**
- Linha 2: QUER RELATÓRIO BONITO → **QUER FATURAR**
- Linha 3: QUER PACOTE PRONTO → **QUER TIME SOB MEDIDA**
- Linha 4: ACEITA ESTAGIÁRIO → **QUER FALAR COM O PEDRO**
- Caixas: ✕ → ✓
- Manchete: "[NÃO] CONTRATE A PK7 / SE VOCÊ…" vira "**CONTRATE A PK7 (lime)** / SE VOCÊ… (branco)".

**Layout:** quadro B2 em x 160–920, y 540–1074. O texto de cada linha fica dentro de uma "carcaça" de flap: fundo #0B1236, linha de divisão escura de 2 px no meio da altura e pinos de dobradiça nas pontas. Manchete no topo, em y 252–416.

**Movimento:**
- 11,90: a música corta (0,3 s de silêncio).
- 11,90–12,25: o quadro salta do dock até o centro (outBack 1,2).
- 12,25–13,15: **flap por linha** (não por caractere). Cada linha faz 3 viradas de 0,12 s: embaralhado A, embaralhado B e alvo.
  - Embaralhado = letras aleatórias A–Z, Á e Ç no comprimento do alvo.
  - A metade superior gira em rotateX 0→−90°, revelando a próxima.
  - Início de cada linha: 12,25 + 0,18·i. Pousos: 12,61, 12,79, 12,97 e **13,15**.
  - Ao pousar: o fundo inunda de lime da esquerda para a direita em 0,10 s, o texto fica navy e a caixa vermelha vira navy com ✓ lime em 0,12 s.
- 13,20: uma rachadura parte o carimbo "NÃO".
- 13,25–13,85: o "NÃO" cai com gravidade e giro de +25°, **por trás do quadro**, e sai pela base.
- 13,35–13,60: "CONTRATE A PK7" fecha o vão, se recentra e fica lime. "SE VOCÊ…" fica branco.
- **13,50: drop** da música + flash radial lime atrás do quadro (0→,6→0 em 0,3 s).
- 13,70–14,10: a manchete cresce de 64 para 76 px e vai para y 262 e 350.

**Avatar:** nenhum.
**Narração (12,00–14,00):** "Agora, se você quer o contrário…" (6 palavras em 2,3 s, 2,61/s).
**Efeitos sonoros:**
- 11,90: corte seco (silêncio).
- 12,25–13,15: clack-clack de painel Solari (1 clique por virada) + riser.
- 13,25: whoosh da queda do "NÃO".
- 13,15: "ding" brilhante no 4º ✓.
- 13,50: drop. O groove vira confiante e para cima.

### S07 · 14,20–16,80 · "A PK7 é pra você": o Pedro surge atrás do quadro (CAPA em 15,6 s)
**Texto na tela:**
- Manchete: "**CONTRATE A PK7 (lime)**" / "SE VOCÊ…"
- Quadro: "✓ QUER VENDA" · "✓ QUER FATURAR" · "✓ QUER TIME SOB MEDIDA" · "✓ QUER FALAR COM O PEDRO"

**Layout:**
- Manchete 76 px: linha 1 com 584 de largura em y 262–338, linha 2 em y 350–426.
- Quadro B3 em x 160–920, y 780–1224.
- Halo azul atrás do Pedro: radial rgba(46,98,255,.55)→0 de 580 px centrado em (540, 620), **sem anel lime**.

**Movimento:**
- 14,20–14,55: o quadro desce para B3 (outCubic). O Pedro só começa a subir **depois** que o quadro pousa.
- 14,55–15,15: o Pedro sobe (ty +440→0, **outCubic, sem overshoot**). O halo vai de escala 0,55→1 com fade.
- 15,00: faíscas lime nos dois punhos, 8 partículas em cada, em (375, 506) e (708, 506).
- 15,25/15,50/15,75/16,00: os ✓ pulsam em sequência, no tempo.
- 15,15–16,45: respiração com ty entre 0 e +6, sempre para baixo.
- 16,45–16,75: o Pedro mergulha (ty→+460, inCubic).

**Avatar (rig T4, oclusor = quadro):** `pose-celebrate.webp`.
- Caixa da imagem: x 306, y 415, w 468 (fator 0,914).
- **Oclusor:** topo do quadro em y 780, que corresponde à fonte y 399 (no limite de ≤462).
- **Recorte do rig:** overflow hidden de y 0 a **868**, o que corresponde à fonte y 496. A linha dura da imagem fica em y 883, 15 px de fonte abaixo do recorte.
- Máscara: fade nos últimos 12% (fonte ≥440), sempre por trás do quadro.
- AO: gradiente com máscara do próprio alfa, escurecendo os 170 px acima de y 780.
- Os punhos (fonte x 34–483) ficam em x 337–748, y ≈460. O tronco na linha do oclusor ocupa x 441–637, longe dos cantos arredondados.
- Começa 100% escondido (ty +440 deixa o topo em 900, abaixo do recorte).
- **Nunca sobe acima do y final.** Toda a subida acontece com o quadro parado.

**Narração (14,30–16,10):** "…a PK7 é pra você." (7 palavras em 2,6 s, 2,69/s).
**Efeitos sonoros:** whoosh de subida "boing" curto · 2 estalos de faísca · 4 tiques nos pulsos de ✓ · groove cheio.

### S08 · 16,80–21,00 · Recibo 1: ✓ QUER VENDA · ✓ QUER FATURAR
**Texto na tela:**
- Manchete 76 px: "**✓ (lime)** QUER **VENDA (lime)**" (523) / "**✓ (lime)** QUER **FATURAR (lime)**" (604)
- Recibo: cabeçalho "Google · Modo IA" + "● PRINT REAL"
- Print real `doc4.jpg`, recorte de fonte x 24–700, y 437–815. O texto do print é literal: "1. Foco em Vendas e Resultados (Sem "Relatórios Bonitos")" / "As agências tradicionais costumam focar-se em métricas de vaidade (como gostos e visualizações) e na entrega de relatórios mensais complexos. O modelo da PK7 é focado diretamente no gargalo do seu negócio: faturar. O objetivo central é construir uma"
- Legenda: "VÍCIOS DAS AGÊNCIAS" · "DIFERENCIAL PK7"

**Layout:**
- Card em x 160–920, y 462–962. Recorte em x 186–894, y 542–938, escala 1,0473.
- Legenda em y 980–1004.
- Marcas (coordenadas absolutas):
  - **Lime 1** "Foco em Vendas e Resultados": x 227–768, y 551–595.
  - **Sublinhado vermelho** "métricas de vaidade (como gostos e / visualizações)" + "relatórios mensais / complexos": x 198–696 em y 759; x 196–386 em y 805; x 625–873 em y 805; x 196–339 em y 850. Todos com 6 px.
  - **Lime 2** "gargalo do seu negócio: / faturar": x 408–773, y 856–897 e x 190–298, y 901–937.

**Movimento:**
- 16,75–16,95: a manchete antiga sai pela máscara. As linhas 3–4 e a moldura do quadro descem para fora (y +800).
- 16,75–17,15: as linhas 1 e 2 fazem FLIP-morph e viram as duas linhas da manchete (o texto vai de navy para branco, com ✓, "VENDA" e "FATURAR" em lime).
- 16,95–17,35: o recibo sobe (y +520→0, rotação 2°→0).
- 17,40–17,95: lime 1. Em 17,95 o ✓ da linha 1 da manchete pulsa (1,2→1).
- 18,10: a legenda aparece.
- 18,10–18,80: os 4 sublinhados vermelhos, um após o outro (0,17 s cada).
- 19,25–19,85: lime 2. Em 19,85 o ✓ da linha 2 pulsa.
- 19,85–20,80: push-in de 1,00→1,03.
- 20,80–21,00: whip-pan para a esquerda.

**Avatar:** nenhum.
**Narração (16,90–20,40):** "Quem descreve é a IA do Google: foco em faturar." (10 palavras em 4,2 s, 2,38/s).
**Efeitos sonoros:** whoosh do card · "swipe" de marca-texto (agudo) ×2 · risco de caneta grave ×4 no vermelho · tique no pulso do ✓ · camada de hi-hat entra na música (a cada recibo entra uma camada nova).

### S09 · 21,00–24,40 · Recibo 2: ✓ QUER TIME SOB MEDIDA
**Texto na tela:**
- Manchete: "**✓ (lime)** QUER TIME" (458) / "**SOB MEDIDA (lime)**" (435)
- Print real `doc1.jpg`, recorte de fonte x 20–660, y 944–1198: "• Modelo Especialista Independente: Recusa o formato tradicional de agências com pacotes padronizados, optando por liderar equipas sob demanda formadas por especialistas em tráfego, SEO/GEO, identidade visual e automação. [www.pk7.co…]"
- Legenda: "VÍCIOS DAS AGÊNCIAS" · "DIFERENCIAL PK7"
- Chips: "TRÁFEGO" · "SEO/GEO" · "IDENTIDADE VISUAL" · "AUTOMAÇÃO"

**Layout:**
- Card em y 462–847. Recorte em x 186–894, y 542–823, escala 1,1062, o que dá texto de cerca de 30 px.
- Legenda em y 865–889.
- Chips (Space Grotesk 32, contorno lime de 3 px, fundo #121A44, texto lime, 64 de altura):
  - TRÁFEGO: x 336–533, y 925–989.
  - SEO/GEO: x 553–744, y 925–989.
  - IDENTIDADE VISUAL: x 224–580, y 1005–1069.
  - AUTOMAÇÃO: x 600–855, y 1005–1069.
- Marcas:
  - **Sublinhado vermelho** "o formato tradicional de agências com" (x 236–756, y 636) e "pacotes padronizados" (x 237–536, y 680).
  - **Lime** "equipas sob demanda formadas por" (x 229–734, y 689–727) e "especialistas" (x 229–416, y 731–772).

**Movimento:**
- 21,00–21,30: a manchete troca pela máscara.
- 21,00–21,35: o card entra pela direita com blur.
- 21,50: a legenda aparece.
- 21,50–22,20: sublinhado vermelho.
- 22,30–23,00: lime. Em 23,00 o ✓ pulsa.
- 23,00–23,50: os 4 chips estalam (0→1,1→1, com 0,12 s entre eles).
- 24,15–24,40: tudo desce para fora.

**Avatar:** nenhum.
**Narração (21,10–24,00):** "Sem pacote padrão: time de especialistas sob demanda." (8 palavras em 3,4 s, 2,35/s).
**Efeitos sonoros:** whip · risco vermelho · swipe lime · 4 cliques de encaixe subindo de tom · entra a camada de clap.

### S10 · 24,40–28,80 · Recibo 3: ✓ QUER FALAR COM O PEDRO (o Pedro é apresentado)
**Texto na tela:**
- Manchete: "**✓ (lime)** QUER FALAR" (508) / "**COM O PEDRO (lime)**" (486)
- Tiles: "TRÁFEGO" / "META + GOOGLE" · "AUTOMAÇÃO" / "IA NO WHATSAPP"
- Pílula: "PEDRO R GOMES · FUNDADOR DA PK7"
- Recibo: print real `doc4.jpg`, recorte de fonte x 24–700, y 1022–1244. Inclui a ressalva: "Nas agências, é muito comum ser atendido por um vendedor brilhante e, assim que o contrato é assinado, ser "passado" para um gestor de conta júnior ou estagiário. Na PK7, você fala diretamente com o Pedro, garantindo que a"

**Layout:**
- Card em x 160–920, y 890–1226. Recorte em y 970–1203, escala 1,0473.
- Pílula lime (Space Grotesk 24, navy, 464×40) **montada na borda superior do card**: x 308–772, y 870–910, acima de tudo.
- Tiles 200×200 (gradiente #24318A→#111843, raio 28, ícone lime de 76 px, título Space Grotesk 28, subtítulo 19 #AFC0FF): esquerdo em x 214–414, direito em x 666–866, ambos em y 556–756.
- Halo de 600 px centrado em (540, 640).
- Marcas:
  - **Lime** "Na PK7, você fala" (x 473–727, y 1111–1152) e "diretamente com o Pedro" (x 190–569, y 1157–1198).
  - **Sublinhado vermelho** "júnior ou estagiário" (x 194–459, y 1151).

**Movimento:**
- 24,40–24,70: a manchete troca.
- 24,40–24,75: o card sobe até y 890.
- 24,75–25,40: **o Pedro sobe** (ty +560→0, outCubic, sem overshoot). O halo vai de 0,55→1.
- Os tiles sobem junto, **em pé**, até as bases passarem do topo do card (≈25,15). Só então giram para −5° e +5° com outBack (s 2,6) até 25,55.
- 25,35–25,60: a pílula do nome bate na borda (1,25→1).
- 25,60–26,40: lime.
- 26,80–27,20: sublinhado vermelho.
- 27,30–28,40: respiração (ty 0…+6) e micro-parallax nos tiles.
- 28,40–28,50: os tiles voltam a ficar em pé.
- 28,45–28,75: o Pedro mergulha (ty→+560).
- 28,70–28,85: o card sai.

**Avatar (rig T4 HERO, o único uso do hero-present):** `hero-present.webp`.
- Caixa da imagem: x 260, y 402, w 560 (fator 1,09375).
- **Oclusor:** topo do card em y 890, que corresponde à fonte y 446 (no limite de ≤446). A pílula começa em y 870 (fonte 428) e esconde a faixa de fade.
- **Recorte do rig:** y 0 a **945**, fonte 494,6, com 16 px de fonte de margem. A linha dura fica em y 962.
- **Mãos cortadas (colunas x=0 e x=511, fonte y 174–262):** totalmente atrás dos tiles.
  - Tile esquerdo cobre fonte x ≤140 e y 141–324. Margem de 46 px de palco à esquerda e 36 em cima.
  - Tile direito cobre fonte x ≥371. Margem de 47 px à direita.
- O rosto (x 444–643) fica livre dos dois tiles, com 25 px de folga.
- Os tiles são filhos do mesmo mover e andam rígidos com o avatar.
- O cap fica em y 457, abaixo da manchete, que termina em 426.
- AO ancorado em y 870.

**Narração (24,60–27,80):** "E você fala direto com o Pedro. Não com estagiário." (10 palavras em 4,4 s, 2,27/s).
**Efeitos sonoros:** whoosh de subida · 2 "clicks" dos tiles abrindo · tapa da pílula · swipe lime · risco vermelho · entra o stab de baixo synth.

### S11 · 28,80–31,80 · O resumo da IA do Google
**Texto na tela:**
- Manchete: "O RESUMO DA" (485) / "**IA DO GOOGLE: (lime)**" (505)
- Print real `doc4.jpg`, recorte de fonte x 24–700, y 14–240: "A principal vantagem de contratar o Pedro R Gomes (PedroK Ads) e a equipa da PK7 em vez de uma agência tradicional resume-se ao modelo de incentivo e à personalização do serviço."
- Tipografia cinética: "**INCENTIVO (lime)**" · "+ PERSONALIZAÇÃO"

**Layout:**
- Card em x 160–920, y 470–811. Recorte em y 550–787.
- **Lime** "modelo de incentivo e à personalização do" (x 191–833, y 695–736) e "serviço." (x 190–317, y 742–783).
- "INCENTIVO" com 110 px e 533 de largura, em y 850–960.
- "+ PERSONALIZAÇÃO" com 72 px e 652 de largura, em y 980–1052, ocupando x 214–866.

**Movimento:**
- 28,80–29,10: a manchete aparece pela máscara.
- 28,85–29,20: o card sobe.
- 29,40–30,20: lime.
- 30,25: "INCENTIVO" sai de trás da borda inferior do card (máscara).
- 30,55: "+ PERSONALIZAÇÃO" sai do mesmo jeito.
- 31,55–31,85: slash lime/azul diagonal.

**Avatar:** nenhum.
**Narração (28,90–31,50):** "A IA do Google resume: incentivo e personalização." (8 palavras em 3,0 s, 2,67/s).
**Efeitos sonoros:** swish do card · swipe longo · 2 batidas graves suaves nas palavras · entram os stabs de acorde · whoosh do slash.

### S12 · 31,80–39,00 · PROVA, NÃO PROMESSA
**Texto na tela:**
- Manchete 90 px: "PROVA," (301) / "**NÃO PROMESSA. (lime)**" (683)
- Batida 1: [placa real] "FOTO REAL" · "1º MARCO" · "**R$ 100 MIL (lime)**" · "faturados como / parceiro Appmax"
- Batida 2: "HOJE" · "em e-commerce próprio" · "+R$ 500 MIL"
- Batida 3: "**+40 (lime)**" · "CLIENTES / ATENDIDOS" · "3 CONTINENTES" · "AMÉRICA DO SUL" · "AMÉRICA DO NORTE" · "EUROPA" · [7 logos] · "alguns clientes atendidos · logos reais"

**Layout:**
- Manchete: linha 1 em y 262–352, linha 2 em y 364–454.
- **Batida 1:**
  - Polaroid com `plaque2.jpg` (300×441 + 10 px de borda branca = 320×461), centro (320, 735), rotação −4°.
  - Chip "FOTO REAL" (Space Grotesk 22, lime) em x 150–275, y 925–961, rotação −4°.
  - Coluna direita em x 510–920:
    - Chip "1º MARCO" em y 560–600.
    - "R$ 100 MIL" com 80 px e 406 de largura, em y 622–702.
    - Legenda em Plus Jakarta 600 30, #C5CEF0, em y 716–794.
- **Batida 2:** card separado em x 160–920, y 990–1150 (#121A3A, borda lime de 3 px, raio 28).
  - Linha superior em y 1008–1042: chip "HOJE" + "em e-commerce próprio" (Plus Jakarta 600 28).
  - Número em Space Grotesk 84, tabular, em y 1056–1140.
- **Batida 3:**
  - Linha "+40" (170 px) + "CLIENTES/ATENDIDOS" (44 px), centrada em y 490–660.
  - "3 CONTINENTES" (48 px) em y 690–738.
  - 3 chips de continente (Space Grotesk 20, com ponto lime) em y 752–786.
  - Logos em tiles brancos 180×80 com raio 18:
    - Linha 1, x 159–921, y 820–900: cafe-fafa, idc, hebreus-barbershop, sandubao-goiano.
    - Linha 2, x 256–824, y 914–994: top-fachadas, luanne-trotta, delicias-da-roca.
  - Legenda (Plus Jakarta 600 24, 70%) em y 1006–1036.

**Movimento:**
- 31,85: a manchete aparece pela máscara.
- 31,95–32,35: o polaroid cai (rotação −10→−4°, escala 1,15→1).
- 32,40: chip FOTO REAL.
- 32,45, 32,55 e 32,70: a coluna entra em sequência. "R$ 100 MIL" entra com punch de 1,3→1.
- 34,40–34,70: o card de 500 sobe.
- 34,70–35,70: o contador vai de **+R$ 0 MIL → +R$ 500 MIL** (easeOutCubic, sem partir de 100 e sem seta ligando à placa). Em 35,70 o número fica lime com um flash.
- 37,00–37,30: as batidas 1 e 2 sobem e somem. A manchete fica.
- 37,05–37,60: "+40" conta de 0→40.
- 37,50: "3 CONTINENTES".
- 37,65/37,75/37,85: os chips pulsam.
- 37,90–38,50: os logos estalam com 0,08 s entre eles.
- 38,50: legenda.

**Avatar:** nenhum. A foto real é a protagonista.
**Narração:**
- 31,95–34,20: "Cem mil faturados como parceiro Appmax."
- 34,50–37,00: "Hoje, mais de quinhentos mil em e-commerce próprio."
- 37,20–38,70: "Mais de quarenta clientes."
- Total: 19 palavras em 7,2 s, 2,64/s.

**Efeitos sonoros:** "thwap" da foto · carimbo do chip · tiques digitais suaves no contador e "ding" no fim · 3 pops dos pinos · 7 pops borbulhantes dos logos · groove completo.

### S13 · 39,00–45,60 · CTA: "Ainda tá aqui?" + selo do Pedro
**Texto na tela:**
- Batida 1: "AINDA TÁ **AQUI? (lime)**" → as 4 linhas vermelhas (QUER CURTIDA ✕ · QUER RELATÓRIO BONITO ✕ · QUER PACOTE PRONTO ✕ · ACEITA ESTAGIÁRIO ✕) → "ENTÃO VOCÊ NÃO É" / "**NENHUM DOS 4. (lime)**"
- Batida 2:
  - Anel do selo: "PEDRO R GOMES • PEDROK ADS"
  - Adesivo: "IA do Google" + “Na PK7, você fala **diretamente com o Pedro (lime)**”
  - "SUGESTÃO DE MENSAGEM" · "Oi Pedro, não sou nenhum dos 4 😄"
  - Botão: "CHAMAR NO WHATSAPP →"
  - Rodapé: "pk7.com.br · @pedrok.ads"

**Layout:**
- "AINDA TÁ AQUI?": 100 px, 712 de largura, em y 262–362.
- Linhas vermelhas compactas em x 160–920: 4×80 com gap 10, em y 470–820.
- Manchete final: "ENTÃO VOCÊ NÃO É" com 64 px em y 262–326, e "NENHUM DOS 4." com 100 px e 737 de largura em y 340–440.
- **Selo T3** centrado em (540, 700), escala 0,86, rotação −3°, tema navy, texto do anel em ring-at 40°. Ocupa cerca de y 463–919, com o cap saltando para fora em cima e a mão que aponta saltando embaixo à esquerda.
- Adesivo da citação: card branco de 250 de largura em x 676–926, y 500–665, rotação +6°. Leva "IA do Google" (Plus Jakarta 700 20, ponto Google) e a citação (Plus Jakarta 600 26/1,25) com marca lime.
- "SUGESTÃO DE MENSAGEM" (Space Grotesk 20, 65%) em x 184, y 924–946.
- Campo de texto: pílula branca em x 160–920, y 952–1020, com o texto (Plus Jakarta 700 32, 545 de largura), cursor verde e botão de enviar verde **sem enviar**.
- Botão lime em x 160–920, y 1036–1132: ícone do WhatsApp + Space Grotesk 40, 483 de largura, com halo.
- Rodapé (Plus Jakarta 600 30, 75%) em y 1152–1190.

**Movimento:**
- 39,00: **corte seco**. "AINDA TÁ AQUI?" estala (1,2→1).
- 39,20–39,70: as 4 linhas vermelhas batem da esquerda, uma por vez, com 0,12 s entre elas.
- 40,20–40,50: a manchete troca pela máscara para "ENTÃO VOCÊ NÃO É / NENHUM DOS 4."
- **41,05–41,20:** um traço lime diagonal de 16 px corta as 4 linhas, de (170, 460) a (910, 830).
- 41,20–41,70: as linhas se partem e caem com gravidade e giro.
- **41,55–42,00:** o selo entra com "slap-on" de 14 frames (escala 1,35→0,96→1, rotação +14°→−3°, sombra apertando, tremida de 3 px). 4 frames depois, a mão salta com overshoot de 1,06→1.
- 42,05–42,30: o adesivo da citação bate, inclinado para o lado oposto.
- 42,20: o campo sobe.
- 42,40–43,55: a mensagem é digitada (0,035 s por caractere). **Ela nunca é enviada.**
- 42,50: o botão entra com mola (0,8→1,04→1).
- 42,70: rodapé.
- A partir de 43,40, o botão "respira" (1↔1,03 a cada 0,8 s).
- 43,50: brilho varre o selo.
- 44,20: um ripple suave no botão.
- 44,40: sting final.
- Segura limpo até 45,60.
- O selo flutua de leve: ±4 px e ±0,8° a cada 2 s.

**Avatar (selo T3):** `pose-point.webp` no selo die-cut, montado com `cut/pose-point-pop.png` e os parâmetros cx 250, cy 296, R 198.
- Fundo do disco em ≤ fonte y 496. Margem ≥15 px.
- Só saltam para fora componentes que não tocam nenhuma borda da imagem: o cap e a mão que aponta com a manga.
- Borda branca die-cut ≥12 px. O selo anima como uma peça só.
- Não há outro Pedro no frame.

**Narração:**
- 39,10–39,90: "Ainda tá aqui?"
- 40,05–41,90: "Então você não é nenhum dos quatro."
- 42,30–44,00: "Chama o Pedro no WhatsApp."
- Total: 15 palavras em 6,6 s, 2,27/s.

**Efeitos sonoros:**
- 39,00: scratch de disco ("hã?") + o groove cai para low-pass.
- 4 batidas das linhas.
- 41,05: swoosh do traço + detritos caindo.
- 41,55: "thup" do selo e o groove volta.
- Teclado durante a digitação, **sem som de envio**.
- Clique suave no ripple.
- 44,40: sting final lime.

---

## 6. Música e mixagem
- 120 BPM. De 0 a 11,9 s: pizzicato irônico e esparso + baixo abafado. Os ✕ caem perto do tempo.
- 11,90–12,20: silêncio. 12,25–13,15: clack Solari + riser. **13,50: drop.**
- Do S07 ao S11 o groove é confiante, e cada recibo soma uma camada (enxerto do C): hats no S08, claps no S09, baixo synth no S10 e acordes no S11. O S12 é o groove cheio.
- 39,00: scratch e low-pass. 41,55: o groove volta. 44,40: sting.
- Música a −12 dB por baixo da narração (ducking). Efeitos sonoros a −6 dB em relação à narração.

## 7. Sistema de avatar (regras duras para o dev)
1. **Nenhuma borda da fonte pode aparecer.** A linha y=511 e as colunas opacas x=0 e x=511 do hero-present ficam sempre atrás de um oclusor opaco ou fora de uma máscara curva, com ≥15 px de margem na fonte.
2. **T4 (oclusão)** é a linguagem principal:
   - S07: celebrate atrás do quadro.
   - S10: hero-present atrás do print, segurando os tiles.
   - O retângulo de recorte do rig (overflow hidden) termina **dentro** do oclusor. Os últimos 12% da imagem têm fade de máscara. Há AO com máscara do alfa nos 170 px acima da borda.
   - Os oclusores são 100% opacos: nada de transparência ou backdrop-filter.
3. **Movimento:** o avatar só se move **para baixo** do seu y final (subir para entrar, mergulhar para sair, respirar entre 0 e +6). Nunca há overshoot do avatar para cima, e não há crossfade entre poses. O overshoot fica só nos tiles, no halo e no selo.
4. **hero-present só no rig de tiles do S10.** Os tiles cobrem as colunas cortadas com ≥36 px de margem de palco, andam rígidos com o avatar e ficam em pé enquanto atravessam a borda do card. Só giram ±5° depois de passar.
5. **T3 (selo)** só no CTA, com pose-point, montado a partir da saída do `gen_masks.py`. A pose de laptop e a hero-present nunca viram selo.
6. **Não usar:** T1 (card com mãos cortadas), o tile de "chamada ao vivo" do T2 e as poses head-wow e pose-laptop. O Pedro **nunca aparece duas vezes** no mesmo frame.
7. **QA automático em todo frame renderizado:**
   - Passe de silhueta: avatar branco e oclusores pretos (`?dbg=1`).
   - Passe de tiles: `?dbg=2`.
   - Afirmar 0 px na última linha da imagem, na linha de recorte, nas colunas de borda do hero-present e abaixo do topo de qualquer oclusor. Qualquer valor diferente de zero falha o build.
   - Frames críticos: 14,55–15,15, 16,45–16,75, 24,75–25,55 e 28,40–28,75.

## 8. Conformidade e honestidade
- Só fatos permitidos. As citações do Google aparecem **literais nos prints reais**, com o PT-PT intacto ("equipa", "gostos"), e a narração parafraseia em PT-BR. A frase é sempre "a IA do Google **descreve**" ou "**resume**", nunca "recomenda". O placar e o selo não atribuem veredito ao Google.
- As ressalvas do Google ficam dentro dos recortes: "costumam" no S08 e "é muito comum" no S10. Os vícios são preferências do espectador, não ataques a agências nomeadas. A agência é sempre genérica ("Agência · atendimento"), sem logo.
- Todas as cenas dramatizadas levam etiqueta de ≥24 px dentro do card: S02, S03 e S04 levam "exemplo"; S05 leva "cena ilustrativa".
- Sem números inventados: sem contagem de curtidas, "caixa" com linha reta sem valor, relatório sem números e barra de progresso sem %.
- **R$ 100 mil** é rotulado sempre como "1º marco · faturados como parceiro Appmax" (placa real, "FOTO REAL"). **+R$ 500 mil** fica sempre em card separado, rotulado "hoje · em e-commerce próprio". O contador sai de 0, nunca de 100, e não há seta da placa para o número.
- Sem promessa de resultado, ROI, preço ou prazo de contrato. "QUER VENDA / QUER FATURAR" descrevem o que o espectador quer; a peça não diz que a PK7 entrega. O enquadramento "PROVA, NÃO PROMESSA" é obrigatório.
- A mensagem sugerida fica **não enviada** no campo, com a etiqueta "SUGESTÃO DE MENSAGEM", sem som de envio e sem balão entregue. Na veiculação, configurar o link do WhatsApp com `?text=Oi%20Pedro%2C%20n%C3%A3o%20sou%20nenhum%20dos%204` (confirmar com o cliente) para servir de palavra-chave de rastreio.
- Logos: "alguns clientes atendidos · logos reais". Não há depoimentos.
- Capa personalizada no frame 15,6 s.
- Variante opcional para teste A/B do gancho, vinda do D: "AGÊNCIA… VOCÊ CONTRATA NO PAPO DO VENDEDOR?" (versão suavizada; não usar "na lábia"). Só testar se o cliente aprovar.

## 9. Legendas (SRT, arquivo à parte; não queimar no vídeo, porque a tela já é tipográfica)
| # | Início | Fim | Texto |
|---|---|---|---|
| 1 | 0,05 | 2,75 | Não contrate a PK7 se você… |
| 2 | 3,10 | 4,90 | …quer curtida, e não cliente. |
| 3 | 5,30 | 7,10 | Quer relatório bonito todo mês. |
| 4 | 7,50 | 9,30 | Quer pacote pronto, de prateleira. |
| 5 | 9,70 | 11,70 | Ou aceita ser passado pro estagiário. |
| 6 | 12,00 | 14,00 | Agora, se você quer o contrário… |
| 7 | 14,30 | 16,10 | …a PK7 é pra você. |
| 8 | 16,90 | 20,40 | Quem descreve é a IA do Google: foco em faturar. |
| 9 | 21,10 | 24,00 | Sem pacote padrão: time de especialistas sob demanda. |
| 10 | 24,60 | 26,40 | E você fala direto com o Pedro. |
| 11 | 26,80 | 27,80 | Não com estagiário. |
| 12 | 28,90 | 31,50 | A IA do Google resume: incentivo e personalização. |
| 13 | 31,95 | 34,20 | Cem mil faturados como parceiro Appmax. |
| 14 | 34,50 | 37,00 | Hoje, mais de quinhentos mil em e-commerce próprio. |
| 15 | 37,20 | 38,70 | Mais de quarenta clientes. |
| 16 | 39,10 | 39,90 | Ainda tá aqui? |
| 17 | 40,05 | 41,90 | Então você não é nenhum dos quatro. |
| 18 | 42,30 | 44,00 | Chama o Pedro no WhatsApp. |

## 10. Checklist de QA do render
- [ ] O frame 0 já é legível. Em 1,0 s, o subtítulo e as 4 linhas vazias estão na tela.
- [ ] Os 4 ✓ estão na tela em 13,15 s, e a capa no frame 15,6 está correta.
- [ ] O QA de silhueta dá 0 px em todos os frames (S07, S10, S13).
- [ ] Nenhum texto passa de x 920 abaixo de y 1000, e nada importante passa de y 1230.
- [ ] Todas as marcas caem sobre as palavras certas (coordenadas calculadas pelas caixas de palavra dos prints) e nenhum pixel dos prints foi alterado.
- [ ] As etiquetas exemplo/cena ilustrativa têm ≥24 px e estão legíveis.
- [ ] Nenhuma frase da narração passa de 2,7 palavras/s, e a duração total fica entre 45,0 e 46,0 s.
