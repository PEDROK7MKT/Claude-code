# Checklist antes de publicar

Tudo que depende do cliente está em **um único arquivo**: `site.config.mjs`.
Mudou lá → `npm run build` → o site inteiro, o schema, o `llms.txt` e o
sitemap se atualizam.

## 1. Confirmar com o cliente (bloqueia a publicação)

- [x] **Telefone/WhatsApp oficial:** (77) 99192-0081, confirmado pelo
      cliente (o mesmo da fachada). Já aplicado no site.
- [ ] **Horário de funcionamento** (hoje no site: seg–sex 7h30–18h, sáb
      7h30–13h — valor provisório). Campo: `hours`.
- [ ] **Formas de pagamento** (hoje: Pix, crédito, débito, dinheiro). Campo: `payment`.
- [ ] **CEP**: 47802-121 (lado ímpar da Rua São Francisco, Jardim Ouro
      Branco). Conferir no site dos Correios.
- [ ] **Domínio**: sugerido `pereiraluzecor.com.br` (registrar no Registro.br).
      Campo: `url`. Se for outro, troque e rode o build.
- [ ] **Instagram/Facebook** da loja, se existirem. Campo: `social`.
- [ ] **Faz entrega?** Se sim, `delivery: true` (e me peça para incluir a
      seção de entrega com bairros/condições).
- [ ] **Marcas** que a loja revende (Suvinil, Coral, Tigre, Lorenzetti…).
      Cada marca confirmada vira texto indexável. Campo: `brands`.
- [ ] **Data de inauguração** (opcional). Campo: `foundingDate`.

## 2. Depois de criar o Perfil da Empresa no Google

- [ ] Copiar o pin exato da fachada (lat/long com 5+ casas) → `geo`.
- [ ] Link "Compartilhar" do perfil → `googleMapsUrl` (vira o "Como chegar").
- [ ] Link "Pedir avaliações" → `googleReviewUrl`.
- [ ] Rodar `npm run build` e publicar de novo.

## 3. Publicar

O site é 100% estático (pasta `www/`), funciona em qualquer hospedagem:

- **Vercel** (recomendado): importar o repositório, *Root Directory* =
  `sites/pereira-luz-e-cor`, *Build Command* = `npm run build`, *Output* =
  `www`. O `vercel.json` gerado já configura URLs limpas e cache.
- **Netlify / Cloudflare Pages**: mesmas configurações; o `_headers` já vem
  gerado. ⚠️ No Cloudflare, **desligue "Block AI bots / AI Crawl Control"**
  — senão ChatGPT, Claude, Perplexity etc. não conseguem ler o site (o
  bloqueio do firewall passa por cima do robots.txt).
- **Hostinger / cPanel**: rodar `npm run build` e subir o conteúdo de `www/`
  para `public_html/`.

## 4. Logo após publicar (no mesmo dia)

- [ ] **Google Search Console**: adicionar o domínio, enviar `/sitemap.xml`,
      pedir indexação da home e das 8 categorias.
- [ ] **Bing Webmaster Tools**: importar do Search Console (alimenta Bing,
      Copilot e o ChatGPT search).
- [ ] Testar o schema em https://validator.schema.org (cole a URL da home).
- [ ] Testar o link no WhatsApp (a prévia com a imagem deve aparecer).
- [ ] Colocar o link do site no Perfil da Empresa, Instagram e Facebook.

## 5. Opcional (recomendado na sequência)

- [ ] GA4 ou Plausible para medir visitas e cliques no WhatsApp (os botões já
      têm `data-track="wa-..."` para cada posição).
- [ ] Fotos reais do interior para as páginas de categoria.
- [ ] Novos guias a cada mês (ver `ESTRATEGIA-SEO-GEO-AEO.md`).
