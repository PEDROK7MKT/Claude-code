# Valora Suisse · Loading page de lançamento · Plano de design

> Página de pré-lançamento divulgada pelo Instagram (90%+ mobile, boa parte aberta
> dentro do navegador do próprio Instagram). O plano foi escrito antes do código,
> criticado por quatro revisores independentes contra o brief (seção 8) e só então
> construído na versão abaixo.

---

## 1. Stack: HTML, CSS e JS puro, sem build

HTML estático, um CSS e dois módulos ES nativos (`js/config.js` + `js/main.js`), sem dependências.

**Por quê:**
- A abertura é uma coreografia de camadas (aba, lacre, corpo do envelope). A **Web Animations
  API** dá controle fino por elemento (atraso, curva, keyframes com offset), devolve promessas
  para encadear etapas, e dá para cancelar e ter um ramo para "reduzir movimento". Tudo isso
  em poucos KB.
- React + Framer Motion somariam ~60–90 KB de JS para o navegador do Instagram baixar e
  interpretar antes do primeiro quadro. A página não tem estado complexo que justifique isso.
- Arquivos estáticos publicam em qualquer lugar (Vercel, Netlify, GitHub Pages) sem configuração.

## 2. Paleta e papéis

| Token | Hex | Papel | Contraste medido |
|---|---|---|---|
| Verde Valora | `#032D1F` | envelope, rodapé, botão primário, títulos | Marfim sobre Verde **13,0:1** |
| Musgo | `#384937` | textos de apoio em itálico, forro do envelope | sobre Marfim **8,4:1** |
| Dourado Champagne | `#CFA35C` | lacre, ✦, estrelas do forro, fio da troca de pedra. **Texto só sobre Verde** | sobre Verde **6,5:1** · sobre Marfim 2,0:1 (nunca como texto) |
| Marfim | `#F6EEE1` | fundo da página inteira **e das fotos** | — |
| Grafite | `#201F1D` | texto corrido | sobre Marfim **14,3:1** |

Funcionais derivados: `#5E6A5C` (pedra não escolhida, 4,9:1) e `#8A3324` (erro de formulário, 6,9:1).
O Verde aparece só como capa e contracapa (envelope e rodapé); o resto da página é Marfim.
Não há gradiente decorativo.

## 3. Tipografia

| Uso | Fonte | Mobile → Desktop |
|---|---|---|
| H1 | Cormorant Garamond 500 | 40–47px → 84px |
| Nomes das pedras (o próprio seletor) | Cormorant itálico 400 | 36–41px → 56px |
| Frases das pedras | Cormorant itálico | 24–26px → 34px |
| Contagem | Cormorant 400, `lining-nums tabular-nums` | 38–41px → 60px (menor que o H1) |
| Rótulos de apoio (sem caixa-alta) | Cormorant itálico 19px, Musgo | — |
| Interface e corpo | Montserrat 400/500, 14–15px | → 16px |
| Nome de produto | **Montserrat 700** 13px | — |
| Campos de formulário | Montserrat 19px (≥ 16px, sem zoom no iOS) | — |
| Logo | lockup empilhado ✦ / VALORA / SUISSE, como no estojo | — |

O ✦ é SVG (a fonte não tem o glifo) e aparece só no logo, no forro do envelope e no lacre.
Nenhum título tem rótulo em caixa-alta acima dele.

## 4. O momento de abertura: "O lacre"

A tela é o **verso de um envelope Verde Valora**. A aba desce em "V" a **33°** (a mesma
inclinação em qualquer tela) até **um lacre de cera dourada com o monograma V**. O lacre é uma
imagem renderizada com relevo e luz vindo do alto à esquerda, como nas fotos de produto, e já foi
cortado em duas metades exatamente na borda da aba.

```
chegada   envelope e lacre já na tela (sem depender de fonte); o texto do convite surge em
          +0,4 s e "Abrir o convite" em +1,4 s. Nada pulsa.
toque     (ou arrastar para cima, rolar, teclado; automático em 4,5 s)
 0 ms     pressão no lacre (0,98) e a fratura se desenha: traço de cera escura na borda da aba
~300 ms   as metades se soltam 2–3 px; a aba levanta na nossa direção levando a metade de cima
          (perspectiva no próprio transform, sem preserve-3d: estável no WebKit do iPhone)
~600 ms   por baixo aparece o forro Musgo com estrelas douradas
~700 ms   o corpo do envelope (com a metade de baixo do lacre) desce e sai; a foto do anel
          assenta de 1,03 para 1. A página já responde ao toque a partir daqui.
~1,4 s    fim
```

- É o **único** momento coreografado da página.
- Quem volta em até 7 dias vê uma versão curta automática. Link com `#lista` ou `?intro=0` pula.
- "Reduzir movimento": o envelope só esmaece.
- Robustez: o envelope só existe se o JS assumir (script inline + rede de segurança de 2,5 s);
  uma trava de 12 s libera a página em qualquer cenário; o conteúdo por trás fica `inert` só
  enquanto o envelope está fechado.
- A **confirmação da lista** fecha a história com o mesmo objeto: o lacre é carimbado no convite.

## 5. Seções (nesta ordem)

1. **Hero**: foto do anel sangrando a largura (44svh), logo sobre o papel, H1
   "Zircônia / ou moissanite.", "*Cada uma com a sua luz.*", data com fuso e botão
   **visível sem rolar** mesmo em 360×640 dentro do Instagram.
2. **Contagem**: "Até a abertura" + dias · horas · minutos, sem fios e sem segundos (muda uma vez
   por minuto; os segundos só aparecem no último dia). Calculada sempre a partir do relógio, no
   fuso de Brasília. Ao zerar, a página vira "A coleção está aberta".
3. **Escolha sua pedra**: os nomes das pedras **são** o controle (radios nativos). A frase do
   brief fica acima da foto; as duas frases ocupam a mesma célula (sem pulo de layout) e trocam
   por esmaecimento. A foto troca numa **cortina que acompanha o dedo**, com parallax (a foto nova
   anda a 30%) e um fio dourado na borda. Soltar depois de 30% (ou num gesto rápido) completa;
   antes volta. Tocar no nome faz o mesmo movimento sozinho. Tudo em `transform`.
   Abaixo: "Imagem ilustrativa." (até a marca confirmar a pedra de cada peça), a linha
   "as duas são pedras criadas em laboratório" e o botão para a lista.
4. **Lista de convidados**: um campo (WhatsApp; "Prefiro receber por e-mail" troca o campo),
   máscara que não pula o cursor, validação de DDD, consentimento LGPD acima do botão, envio real
   para webhook com timeout, fila de reenvio e confirmação carimbada ("Você está na lista.", o
   contato por extenso, "Corrigir número", agenda, compartilhar).
5. **Galeria**: bracelete aberto em largura total, pulseira riviera a 78%, anel a 56%, com 88px
   entre peças. As joias flutuam no Marfim.
6. **Rodapé** (Verde): logo, "*Ce qui a de la valeur demeure.*" + tradução, Instagram, privacidade.

## 6. Wireframe mobile (390 × 700, viewport útil no Instagram)

```
 ABERTURA                          HERO + CONTAGEM                    ESCOLHA SUA PEDRA
┌──────────────────────────┐      ┌──────────────────────────┐       ┌──────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │          ✦               │       │ Escolha sua pedra        │
│▓▓▓▓▓▓▓ aba (verde) ▓▓▓▓▓▓│      │        VALORA      ◢env  │       │ Zircônia    Moissanite   │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │        SUISSE            │       │ ‾‾‾‾‾‾‾‾                 │
│ ╲▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╱ │      │      [anel no papel]     │       │ Uma pedra criada, com    │
│    ╲▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╱    │      ├──────────────────────────┤       │ brilho delicado e…       │
│       ╲▓▓▓▓▓▓▓▓▓▓╱       │      │ Zircônia                 │       │ Zircônia cúbica · Mohs…  │
│         ( lacre V )      │      │ ou moissanite.           │       │ ┌──────────────┊───────┐ │
│                          │      │ Cada uma com a sua luz.  │       │ │ riviera      ┊ anel ←│ │
│ Um convite da Valora…    │      │ Abre em 10 de outubro,   │       │ │ no estojo    ┊ (dedo)│ │
│      Abrir o convite     │      │ às 20h (Brasília)        │       │ └──────────────┊───────┘ │
│   ╱                  ╲   │      │ [   Entrar na lista    ] │       │ Imagem ilustrativa.      │
└──────────────────────────┘      │ ──────────────────────── │       │ As duas são criadas em…  │
                                  │ Até a abertura           │       │ [ Receber o aviso…     ] │
                                  │ 13    08    46           │       └──────────────────────────┘
                                  └──────────────────────────┘
 LISTA DE CONVIDADOS               CONFIRMAÇÃO                        GALERIA + RODAPÉ
┌──────────────────────────┐      ┌──────────────────────────┐       ┌──────────────────────────┐
│╔════════════════════════╗│      │╔════════════════════════╗│       │ [bracelete aberto 100%]  │
│║ Lista de convidados    ║│      │║        (lacre)         ║│       │ Bracelete aberto         │
│║ Deixe seu WhatsApp…    ║│      │║  Você está na lista.   ║│       │        [riviera 78%]     │
│║ Seu WhatsApp           ║│      │║ Vamos avisar no (11)…  ║│       │ [anel 56%]               │
│║ ______________________ ║│      │║    Corrigir número     ║│       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│║ Prefiro receber por…   ║│      │║ [ Salvar na agenda ]   ║│       │▓   ✦ VALORA SUISSE     ▓│
│║ Ao tocar em Entrar…    ║│      │║ Compartilhar o convite ║│       │▓ Ce qui a de la valeur… ▓│
│║ [   Entrar na lista  ] ║│      │║       Até lá.          ║│       │▓     @valorasuisse      ▓│
│╚════════════════════════╝│      │╚════════════════════════╝│       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────┘      └──────────────────────────┘       └──────────────────────────┘
```

## 7. Mobile e desempenho

- `viewport-fit=cover`; `env(safe-area-inset-*)` no logo do topo e no rodapé; `svh` nas alturas.
- `color-scheme: only light` (o Android não escurece a página quando o Instagram está no tema escuro).
- Alvos de toque ≥ 44px; `:active` com escala 0,97 (com listener de `touchstart` para funcionar no iOS).
- Fotos em AVIF 4:2:0 / WebP / JPG (480/800/1254) com `srcset`; só o hero tem prioridade alta.
- Fontes na própria página, com `preload`. Textura do papel em WebP de 6 KB (sem filtro em tempo real).
- `prefers-reduced-motion` respeitado também nas animações feitas em JS.

## 8. Revisão do plano contra o brief

O primeiro plano passou por quatro revisores independentes (direção de arte de luxo, UX mobile
e conversão, técnica/acessibilidade/performance, copy/marca/LGPD). O que mudou:

| O que o plano tinha | Problema apontado | Como ficou |
|---|---|---|
| Lacre vetorial que era "carimbado" na chegada, rachava com fenda brilhante e caía com gravidade e 5 fragmentos | Linguagem de "baú de recompensa" de jogo, e fisicamente errado | Lacre renderizado com relevo; a fratura é um traço escuro na borda da aba; metade sobe com a aba, metade sai com o corpo. Nada cai, nada pulsa |
| Aba de 0 a −180° com forro no verso | O verso nunca aparece (sai da tela), e `preserve-3d` + `clip-path` falha no WebKit | Aba em SVG com `perspective()` no transform; o forro fica no corpo e aparece quando ela levanta |
| Esperar fontes (1,2 s) + abertura automática em 3,4 s + 1,6 s de coreografia | Até ~7 s até ver conteúdo; rolar não fazia nada | Envelope pintado no primeiro quadro; qualquer gesto abre; página responde em ~0,7 s após o toque |
| Hero com foto de 56svh, eyebrow, subtítulo, contagem de 4 colunas e botão | Botão abaixo da dobra no Instagram; a contagem maior que o título | Hero = foto 44svh + H1 + linha + data + botão, visível em 360×640. Contagem em seção própria, menor que o H1 |
| H1 "Duas pedras. / Um brilho que permanece." e eyebrows ✦ acima de todo título | Fórmula típica de texto de IA; "permanece" promete durabilidade que ninguém garantiu; ✦ virou papel de parede | H1 "Zircônia ou moissanite. / Cada uma com a sua luz."; nenhum rótulo acima de títulos |
| Seletor em abas com fio deslizante, pontinhos, losango crescendo + ✦ piscando + texto palavra por palavra | Cinco efeitos num toque; losango = transição do PowerPoint; leitor de tela lia palavra por palavra | Nomes das pedras como radios; uma única transição (cortina presa ao dedo); frases sobrepostas trocando por esmaecimento |
| Réguas de dureza e brilho com ponto deslizante | Ranking que rebaixa a zircônia | Uma linha de fato por pedra, sem gráfico |
| "Na foto: Bracelete tennis" | A marca não confirmou qual pedra está em cada peça; "bracelete tennis" não é termo da joalheria brasileira | "Imagem ilustrativa." até confirmar (config); "Pulseira riviera"; linha "as duas são criadas em laboratório" |
| Fotos de fundo branco sobre Marfim/Verde | Quadrados brancos colados na página | Fundo das fotos convertido para Marfim, com a sombra preservada; pedra do anel protegida para continuar neutra |
| Lista depois da galeria, barra fixa inferior com segundos | Formulário a 4 telas do hero; barra de promoção cobrindo conteúdo | Lista logo depois da pedra; sem barra fixa; os botões levam direto ao campo |
| Consentimento genérico, envio simulado, .ics por data-URL, sessionStorage | LGPD incompleta; lead perdido sem aviso; .ics não abre no Instagram; abertura repetida a cada toque na bio | Texto de consentimento por canal + política de privacidade; POST sem preflight com timeout e fila de reenvio; Google Agenda no Instagram e Android, .ics estático no resto; localStorage por 7 dias |

**O que ficou como estava, de propósito:**
- **Lista antes da galeria**: um revisor queria a galeria antes e lista e rodapé juntos no fim.
  Ficou a ordem que encurta o caminho até o formulário.
- **Nenhuma animação guiada pelo dedo na abertura**: um revisor sugeriu a aba acompanhando o
  arraste. Qualquer arraste abre, mas a aba não segue o dedo. Isso deixa o comportamento mais
  previsível dentro do navegador do Instagram.
- **Acento circunflexo alto**: é o desenho original da Cormorant Garamond ("Zircônia"), não um erro.
