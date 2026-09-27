# Valora Suisse · Loading page de lançamento

Página de pré-lançamento da nova coleção (zircônia e moissanite), feita para o
tráfego do Instagram: mobile primeiro, leve e sem dependências.

- **HTML + CSS + JS puro**, sem etapa de build. Módulos ES nativos. Sem bibliotecas externas.
- Primeira tela (envelope, fontes, foto do hero, CSS e JS, com gzip): **~235 KB**. A página
  inteira, com todas as fotos em AVIF num celular de tela 3x: ~550 KB. Quem entra por `#lista`
  não baixa o lacre.
- Fontes (Cormorant Garamond e Montserrat) hospedadas na própria página.

## Rodar localmente

```bash
cd valora-lancamento
npx http-server -p 4173 -c-1     # ou: python3 -m http.server 4173
# abra http://localhost:4173
```

Parâmetros úteis na URL:

| Parâmetro | Efeito |
|---|---|
| `?intro=1` | força a abertura completa (mesmo para quem já viu) |
| `?intro=0` | pula a abertura |
| `#lista` | pula a abertura e vai direto ao formulário (use nos stories "entre na lista") |
| botão "voltar" | quem volta de outra página (ex.: política de privacidade) não vê a abertura de novo |
| `?slow=5` | deixa as animações 5× mais lentas, para conferir a coreografia |

A abertura completa aparece na 1ª visita; quem volta em até 7 dias vê uma versão curta automática.

## Antes de publicar: o que a marca precisa confirmar

Tudo que é editável está em **`js/config.js`** (itens marcados com `⚠ CONFIRMAR`):

1. **Data e hora da abertura** (`launchISO`, sempre com `-03:00`). Se mudar, atualize também
   o texto do `index.html` (`<title>`, `og:*`, `<time>`) e o arquivo `assets/lancamento.ics`.
2. **Qual pedra está em cada foto** (`stones.*.pieceConfirmed`). Enquanto for `false`, a legenda
   do seletor diz só "Imagem ilustrativa." (a página não afirma nada sobre a composição da peça).
3. **WhatsApp da marca** (`whatsappBrand`) — habilita o botão "Confirmar pelo WhatsApp".
4. **Backend da lista** (`waitlistEndpoint`) — sem ele, o envio é simulado.
5. **Instagram** e **link da loja** para depois da abertura.
6. **Texto de consentimento** (`consent` no config) e **política de privacidade**
   (`privacidade.html`) — preencher razão social, CNPJ, contato, fornecedores e prazo de guarda
   (trechos destacados entre colchetes) e confirmar que "responder SAIR" / "link no fim do e-mail"
   existem de fato. Mudou o texto? Mude também `consentVersion`.
7. **Logo oficial em SVG** — o lockup atual é tipográfico (Cormorant + Montserrat) e não reproduz
   a cauda do "R" do logo gravado nos estojos. Com o SVG, basta trocar os três `.brand` do HTML.

## Lista de espera · como plugar o backend

`js/main.js → submitLead()` envia um `POST` `application/x-www-form-urlencoded` (sem preflight
de CORS) com: `channel`, `contact` (E.164 ou e-mail), `stone`, `consent`, `consent_text`,
`consent_version`, `page`, `referrer`, `created_at` e `utm_*`.

- **n8n**: nó *Webhook* (POST) → *Google Sheets*/CRM. Em *Options → Allowed Origins (CORS)* use `*`.
  O campo `stone` vem vazio quando a pessoa não mexeu no seletor de pedra.
- **Zapier**: *Webhooks by Zapier → Catch Hook*.
- **Make**: *Custom webhook*.

A confirmação só aparece com resposta 2xx. Se falhar, o cadastro fica guardado no aparelho e é
reenviado na próxima visita, e a pessoa vê a opção de entrar pelo WhatsApp.

**Sobre o envio por WhatsApp**: listas de transmissão do app WhatsApp Business só chegam a quem
salvou o número da marca. Para avisar a lista inteira no dia, use a API oficial (WhatsApp Business
Platform) com um modelo de mensagem aprovado, ou peça para as pessoas tocarem em "Confirmar pelo
WhatsApp" (isso abre a conversa e permite salvar o contato).

## Medição (opcional)

Eventos vão para `window.dataLayer` (Google Tag Manager) e, se `analyticsEndpoint` estiver
preenchido, por `sendBeacon`: `intro_view`, `intro_open {mode, ms}`, `stone_select {pedra, via}`,
`cta_click {origem}`, `lead_submit {canal, pedra}`, `lead_error`, `share`.

Links sugeridos: bio `?utm_source=instagram&utm_medium=bio` · stories
`?utm_source=instagram&utm_medium=story&utm_content=AAAAMMDD#lista`.

## Publicar

É um site estático: arraste a pasta `valora-lancamento/` para Netlify Drop, importe na Vercel
(sem build, diretório `valora-lancamento`) ou sirva por GitHub Pages. Depois de publicar, troque
`og:image` no `index.html` por um endereço absoluto (`https://…/assets/og-image.jpg`) para a prévia
do link aparecer no Instagram e no WhatsApp.

## Estrutura

```
valora-lancamento/
├── index.html            página
├── privacidade.html      política de privacidade (preencher)
├── css/style.css         estilos (tokens da marca no topo)
├── js/config.js          ⚠ tudo que a marca edita
├── js/main.js            abertura, contagem, seletor de pedra, lista
└── assets/
    ├── produto-1..3.jpg  fotos originais
    ├── img/              fotos otimizadas (AVIF/WebP/JPG, fundo Marfim)
    ├── lacre*.webp       lacre renderizado (inteiro e as duas metades)
    ├── papel-*.webp      textura do envelope
    ├── fonts/            Cormorant Garamond + Montserrat (subset latin)
    ├── og-image.jpg      prévia de link 1200×630
    └── lancamento.ics    evento de agenda
```
