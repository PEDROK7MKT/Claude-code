Você vai executar, no meu Chrome, as ações de indexação do site https://www.pk7.com.br no Bing e no Google. Eu estou acompanhando a tela e autorizo as ações listadas abaixo — SOMENTE elas. O site já foi atualizado e publicado; aqui é só avisar os buscadores.

REGRAS
- Faça apenas o que está nesta lista, na ordem. Não remova sites, não altere configurações de rastreamento, não mexa em usuários/permissões, não gere chaves de API, não clique em "Excluir"/"Remover".
- Antes de cada ação que envia algo (Enviar, Submit, Request indexing, Solicitar indexação), diga em uma linha o que vai enviar e então envie.
- Se aparecer CAPTCHA, login, verificação em duas etapas ou qualquer tela inesperada, PARE e me peça para resolver. Não tente contornar.
- Se uma ação não estiver disponível ou der erro, copie a mensagem literal e siga para o próximo passo.
- Ao final, gere o relatório no formato pedido.

URLS DO SITE (as 5 páginas)
https://www.pk7.com.br/
https://www.pk7.com.br/pedro-r-gomes/
https://www.pk7.com.br/servicos/
https://www.pk7.com.br/cases/
https://www.pk7.com.br/atendimento/

PASSO 1 — CONFERIR QUE O SITE ESTÁ NO AR (só leitura)
1. Abra https://www.pk7.com.br/pedro-r-gomes/ numa aba nova. Confirme que a página carrega com o título "PEDRO R GOMES / PEDROK ADS" e a foto do Pedro.
2. Abra https://www.pk7.com.br/sitemap.xml e confirme que lista as 5 URLs acima.
3. Abra https://www.pk7.com.br/029307820597946f26338df5fb9d717d.txt e confirme que mostra exatamente: 029307820597946f26338df5fb9d717d
Se algum desses falhar, PARE e me avise.

PASSO 2 — INDEXNOW (avisar o Bing na hora)
Abra cada link abaixo numa aba (é só abrir; página em branco ou "OK" = sucesso, HTTP 200/202). Anote o que aparecer em cada um:
https://www.bing.com/indexnow?url=https://www.pk7.com.br/&key=029307820597946f26338df5fb9d717d
https://www.bing.com/indexnow?url=https://www.pk7.com.br/pedro-r-gomes/&key=029307820597946f26338df5fb9d717d
https://www.bing.com/indexnow?url=https://www.pk7.com.br/servicos/&key=029307820597946f26338df5fb9d717d
https://www.bing.com/indexnow?url=https://www.pk7.com.br/cases/&key=029307820597946f26338df5fb9d717d
https://www.bing.com/indexnow?url=https://www.pk7.com.br/atendimento/&key=029307820597946f26338df5fb9d717d

PASSO 3 — BING WEBMASTER TOOLS (https://www.bing.com/webmasters, site cadastrado como https://pk7.com.br/)
1. Sitemaps: localize https://www.pk7.com.br/sitemap.xml e use a opção de reenviar/"Resubmit" (se não houver, use "Submit sitemap" com essa mesma URL). Anote status e número de URLs descobertas.
2. URL Submission (Envio de URL): cole as 5 URLs do site (uma por linha) e envie. Anote a cota restante depois do envio.
3. URL Inspection: inspecione https://www.pk7.com.br/ e clique em "Request indexing" (Solicitar indexação) se o botão existir. Depois inspecione https://www.pk7.com.br/pedro-r-gomes/ e faça o mesmo. Anote o resultado de cada uma.
4. Adicionar a versão com www: em "Add site"/"Adicionar site", escolha "Import from Google Search Console" (Importar do Google Search Console). Se aparecer https://www.pk7.com.br/ (ou a propriedade de domínio pk7.com.br) disponível para importar e ainda não estiver na lista, importe. Se já estiver ou não aparecer, apenas anote. NÃO remova o site https://pk7.com.br/ existente.

PASSO 4 — GOOGLE SEARCH CONSOLE (https://search.google.com/search-console, propriedade sc-domain:pk7.com.br)
1. Sitemaps: confirme que https://www.pk7.com.br/sitemap.xml está lá; se houver opção de reenviar, envie de novo a mesma URL. Anote "Páginas encontradas".
2. Inspeção de URL: inspecione https://www.pk7.com.br/ → clique "Solicitar indexação". Repita para https://www.pk7.com.br/pedro-r-gomes/, https://www.pk7.com.br/servicos/, https://www.pk7.com.br/cases/ e https://www.pk7.com.br/atendimento/. (O Google limita alguns pedidos por dia; se aparecer "Cota excedida", pare e anote.)
3. Na inspeção da home, use "Testar URL publicado" e anote se aparecem itens em "Dados estruturados"/"Aprimoramentos" (ex.: Perfil, Navegação estrutural, Perguntas frequentes) e se há erros.

PASSO 5 — FACEBOOK/WHATSAPP (atualizar a imagem de compartilhamento)
1. Abra https://developers.facebook.com/tools/debug/ (se pedir login do Facebook e eu não estiver logado, PULE este passo).
2. Cole https://www.pk7.com.br/ e clique "Debug"/"Depurar" e depois "Scrape Again"/"Extrair novamente". Anote se a imagem mostrada é a nova (foto do Pedro com o texto "PEDRO R GOMES").
3. Repita com https://www.pk7.com.br/pedro-r-gomes/

FORMATO DO RELATÓRIO
Gere um arquivo Markdown EXECUCAO_INDEXACAO_PK7.md (ofereça para download ou mostre todo o conteúdo num bloco de código), com:
# Execução de indexação PK7 — <data e hora>
## Resumo (o que foi feito, o que falhou, o que ficou pendente para mim)
## Passo 1 — Site no ar (ok/falhou por item)
## Passo 2 — IndexNow (resposta de cada um dos 5 links)
## Passo 3 — Bing Webmaster (sitemap, envio de URL + cota, inspeções, versão www)
## Passo 4 — Google Search Console (sitemap, solicitações de indexação, dados estruturados detectados)
## Passo 5 — Facebook Debugger (imagem nova ou antiga)
## Mensagens literais de erro (se houver)
Não invente resultados: o que não foi feito ou não apareceu, escreva "não executado" ou "não verificado".
