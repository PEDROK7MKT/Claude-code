# Kit — Perfil da Empresa no Google (Google Meu Negócio)

Tudo pronto para copiar e colar. **Antes de começar**, feche os itens marcados
em `CHECKLIST-PUBLICACAO.md` (principalmente o horário):
o NAP (nome, endereço, telefone) do perfil tem que ser **idêntico** ao do site.

---

## 1. Dados básicos (copiar exatamente assim)

| Campo | Valor |
|---|---|
| **Nome da empresa** | `Pereira Luz & Cor` |
| **Categoria principal** | `Loja de ferragens` |
| **Categorias adicionais** | `Loja de materiais elétricos` · `Loja de tintas` · `Loja de ferramentas` · `Loja de materiais de construção` · `Loja de material hidráulico` · `Loja de artigos de iluminação` |
| **Endereço** | Rua São Francisco, 55 — Jardim Ouro Branco — Barreiras — BA — CEP 47802-121 *(confirmar CEP)* |
| **Telefone principal** | (77) 99192-0081 |
| **Site** | `https://www.pereiraluzecor.com.br/?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| **WhatsApp (Contato → Chat)** | `https://wa.me/5577991920081` |
| **Horário** | Igual ao do site *(confirmar)* |
| **Data de abertura** | Data da inauguração da loja nova |

> ⚠️ **Nome**: use só `Pereira Luz & Cor`, como está na fachada. Nada de
> "Pereira Luz & Cor – Material Elétrico em Barreiras": é keyword stuffing e
> pode suspender o perfil. As palavras-chave entram nas categorias, na
> descrição, nos produtos e nas postagens.
>
> ⚠️ **Categorias**: digite o termo e escolha a sugestão do próprio Google
> (os nomes exatos em português podem variar levemente). A principal pesa
> mais no ranqueamento — se o faturamento for majoritariamente elétrico,
> troque para `Loja de materiais elétricos` como principal.

## 2. Descrição (692 de 750 caracteres)

```
A Pereira Luz & Cor é uma loja de ferragens, materiais elétricos e tintas na Rua São Francisco, 55, bairro Jardim Ouro Branco, em Barreiras-BA. Aqui você encontra fios e cabos, disjuntores, tomadas, chuveiros e resistências, lâmpadas e fita de LED, tinta acrílica, massa corrida, tinta spray, ferramentas manuais e elétricas, discos de corte, torneiras, mangueira por metro, caixa d'água, escadas, carrinho de mão, compressores, parafusos, WD-40 e muito mais. Atendemos no balcão com orientação técnica para você comprar certo e fazemos orçamento pelo WhatsApp: monte sua lista no nosso site e envie. Atendemos moradores, eletricistas, pintores, pedreiros e encanadores de Barreiras e região.
```

## 3. Produtos (aba "Produtos" — 1 por categoria, com foto real da prateleira)

Cada produto: nome, categoria, foto, descrição curta e botão **"Saiba mais"**
apontando para a página da categoria no site.

| Produto | Categoria no GBP | Link |
|---|---|---|
| Fios e cabos flexíveis | Materiais elétricos | `/materiais-eletricos/` |
| Disjuntores, DR e DPS | Materiais elétricos | `/materiais-eletricos/#disjuntores-dr-e-dps` |
| Chuveiros e resistências | Materiais elétricos | `/materiais-eletricos/` |
| Fita de LED e fontes | Iluminação | `/iluminacao-e-led/` |
| Lâmpadas LED | Iluminação | `/iluminacao-e-led/` |
| Tinta acrílica e látex | Tintas | `/tintas-e-pintura/` |
| Massa corrida e selador | Tintas | `/tintas-e-pintura/` |
| Tinta spray | Tintas | `/tintas-e-pintura/` |
| Furadeiras e parafusadeiras | Ferramentas | `/ferramentas/` |
| Discos de corte (maquita) | Ferramentas | `/ferramentas/` |
| Mangueira por metro | Hidráulica | `/hidraulica/` |
| Caixa d'água | Hidráulica | `/hidraulica/` |
| Torneiras e registros | Hidráulica | `/hidraulica/` |
| Escadas de alumínio | Equipamentos | `/equipamentos-para-obra/` |
| Compressores e lavadoras | Equipamentos | `/equipamentos-para-obra/` |
| Parafusos, buchas e WD-40 | Fixação | `/fixacao-e-lubrificantes/` |

## 4. Atributos para marcar (se verdadeiros)

Pix · Cartão de crédito · Cartão de débito · Entrada acessível para cadeirantes
(só se tiver) · Retirada na loja · Atendimento pelo WhatsApp.

## 5. Fotos (subir no dia da criação — perfis com fotos recebem mais cliques)

1. **Fachada de dia**, de frente, mostrando o letreiro inteiro (sem o poste na frente, se possível — fotografe um pouco de lado).
2. **Fachada no fim da tarde** com as luzes acesas.
3. **Entrada / porta de vidro**.
4. **Interior** — 1 foto por corredor: elétrica, tintas, ferramentas, hidráulica.
5. **Balcão de atendimento** com a equipe (uniforme da marca).
6. **Produtos destaque**: caixa d'água, escadas, compressor, lavadora, prateleira de tintas, parede de fita de LED.
7. **Logo** (`assets/img/icon-512.png`) e **capa** (`assets/img/og-pereira.jpg`).

Regras: foto real (nada de banco de imagem), horizontal, boa luz, sem texto por cima.

## 6. Verificação por vídeo (o padrão para lojas novas)

Gravar **ao vivo pelo app** (Google Maps ou Perfil da Empresa), sem cortes,
de 30 s a 2 min, de dia, depois que o letreiro estiver instalado:

1. Começar **na rua**, mostrando a placa da Rua São Francisco ou o número 55.
2. Virar para a **fachada** e mostrar o letreiro "Pereira Luz & Cor" inteiro.
3. Mostrar os **vizinhos** dos dois lados (prova de localização).
4. **Entrar na loja** mostrando prateleiras com produtos.
5. Mostrar algo que só o dono acessa: **abrir o caixa, a maquininha ou o estoque**.

Não mostrar rostos, documentos nem números de cartão. A análise leva até
~5 dias úteis; se reprovar, grave de novo seguindo à risca os passos acima.

## 7. Pedido de avaliação (WhatsApp + QR Code no balcão)

Depois de verificado, copie em **Perfil → Pedir avaliações** o link curto e
coloque em `site.config.mjs → googleReviewUrl` (o site passa a exibir o botão).

Mensagem pronta para mandar ao cliente depois da compra:

```
Oi, {nome}! Aqui é da Pereira Luz & Cor 😊 Obrigado pela compra!
Se a gente te ajudou, deixa uma avaliação rapidinha no Google? Leva 30 segundos e ajuda demais a loja nova:
{link}
```

Imprima um QR Code com o mesmo link e cole no balcão e na maquininha:
"Gostou do atendimento? Avalie a Pereira no Google ⭐".

**Responda todas as avaliações** (boas e ruins) em até 48 h, citando o
produto quando fizer sentido ("Que bom que a fita de LED ficou show!").
Nunca compre nem invente avaliações.

## 8. Postagens (1 por semana — mantém o perfil "vivo")

| Semana | Tipo | Ideia |
|---|---|---|
| 1 | Novidade | "Loja nova no Jardim Ouro Branco!" — foto da fachada + botão "Ligar/WhatsApp" |
| 2 | Produto | Calculadora de tinta: "Quantas latas para pintar seu quarto?" → link `/calculadora-de-tinta/` |
| 3 | Dica | "Qual fio usar no chuveiro?" → link do guia |
| 4 | Produto | Mangueira por metro — "leve só o que precisa" |
| 5 | Dica | Fita de LED: 12 V ou 220 V? → link do guia |
| 6 | Novidade | Fotos dos corredores / chegada de mercadoria |

Antes da chuva (out–nov): impermeabilizante, calha, caixa d'água. No calor
(set–out): ventilador, chuveiro, LED. No período seco (mai–set): pintura.

## 9. Citações (mesmo NAP em todo lugar — isso alimenta Google, Bing e as IAs)

Cadastre na ordem, sempre com o **mesmo** nome, endereço e telefone:

1. **Bing Places** (dá para importar do Google) — alimenta Bing e Copilot.
2. **Apple Business Connect** — Apple Maps e Siri.
3. **Instagram** e **Facebook** com endereço e botão de WhatsApp.
4. **Waze** (Waze for Cities / pin de empresa).
5. Diretórios que aparecem nas buscas de Barreiras: **Solutudo**, **ClickDisk**,
   **ListaMais**, **GuiaMais**, **Apontador**, **TeleListas**.

Na pesquisa, o buscador de IA respondeu "loja de material elétrico em
Barreiras" montando a resposta **a partir desses diretórios** — estar neles
com NAP consistente é atalho direto para aparecer em respostas de IA.

---

**Bloco NAP para colar em qualquer cadastro:**

```
Pereira Luz & Cor
Rua São Francisco, 55 – Jardim Ouro Branco, Barreiras – BA, 47802-121
(77) 99192-0081
https://www.pereiraluzecor.com.br
```
