Você vai fazer uma auditoria completa, SOMENTE LEITURA, da presença do site https://www.pk7.com.br nos buscadores, usando as abas que já estão abertas e logadas no meu Chrome. O resultado vai ser lido por outro assistente que cuida do código do site, então seja preciso e copie textos e números exatamente como aparecem.

REGRAS
- Não altere nenhuma configuração, não remova nem adicione sites, não envie nada, não clique em "Verificar", "Enviar" ou "Excluir". Só observe e anote. Se algo exigir ação, descreva o que seria feito e onde, mas NÃO faça.
- Não copie senhas, tokens de API nem chaves secretas para o relatório. O código de verificação msvalidate.01 (meta tag) pode ser copiado; ele é público por natureza.
- Se uma tela não carregar ou não existir, registre "não disponível" e siga em frente.
- Tire o máximo de dados de cada tela (datas, contagens, mensagens de erro literais).

PARTE 1 — BING WEBMASTER TOOLS (https://www.bing.com/webmasters)
1. Quais sites estão cadastrados na conta? Para cada um: URL exata (com/sem www, http/https) e status de verificação (verificado ou não).
2. Para pk7.com.br / www.pk7.com.br:
   a. Está verificado? Por qual método (importação do Google Search Console, meta tag, arquivo XML, DNS)? Se NÃO estiver, abra as opções de verificação e copie a meta tag completa que o Bing oferece (<meta name="msvalidate.01" content="...">) e o nome do arquivo XML oferecido.
   b. Sitemaps: quais estão enviados, status, data do último processamento, número de URLs descobertas, erros/avisos literais.
   c. Envio de URL (URL Submission): cota diária e URLs já enviadas.
   d. IndexNow: está ativo? Alguma chave configurada? URLs recebidas via IndexNow?
   e. Inspeção de URL: inspecione https://www.pk7.com.br/ e copie o resultado (indexada ou não, data do último rastreamento, problemas).
   f. Relatório de Pesquisa/Desempenho: impressões, cliques e principais consultas dos últimos 3 meses (se houver dados).
   g. Explorador do site / Rastreamento: páginas descobertas, indexadas, erros de rastreamento, bloqueios por robots.txt.
   h. Recomendações / SEO / Problemas: copie cada recomendação e sua gravidade.
   i. Configurações de rastreamento (crawl control) e qualquer bloqueio.
3. Se houver a opção "Importar do Google Search Console", diga se está disponível e se o site do Google aparece para importar.

PARTE 2 — GOOGLE SEARCH CONSOLE (https://search.google.com/search-console), se houver aba ou acesso
1. Propriedades cadastradas para pk7.com.br (domínio ou prefixo de URL) e status de verificação.
2. Indexação de páginas: indexadas x não indexadas, motivos literais.
3. Sitemaps: enviados, status, URLs descobertas.
4. Inspeção de URL de https://www.pk7.com.br/: indexada? Data do último rastreamento? "Dados estruturados" / "Aprimoramentos" detectados (ex.: Perguntas frequentes, Perfil, Logo) e erros.
5. Desempenho (3 meses): cliques, impressões, principais consultas e se aparecem buscas pelo nome ("pedro r gomes", "pedrok ads", "pk7").

PARTE 3 — COMO A MARCA APARECE HOJE (abra abas novas)
1. Bing: pesquise "pedro r gomes pk7", "pedrok ads", "pk7.com.br" e "site:pk7.com.br". Anote se o site aparece, em que posição, título e descrição exibidos, e quais imagens aparecem.
2. Google: as mesmas pesquisas. Abra também o Modo IA / Visão geral criada por IA para "pedrok ads pk7" e copie a resposta e de onde vieram as imagens (site, Instagram, outros).
3. ChatGPT (se houver aba logada): numa conversa temporária ou com memória desativada, pergunte "Quem é Pedro R Gomes da PK7 (PedroK Ads)?" com busca na web ativa. Copie a resposta e as fontes citadas.
4. Instagram @pedrok.ads (só observar): foto de perfil é foto real ou personagem? Bio contém link para pk7.com.br e o nome "Pedro R Gomes"? Há posts fixados com o Batman ou outra imagem que não seja o Pedro?
5. LinkedIn https://www.linkedin.com/in/pedrorgomes-pk7/ (só observar): foto, título, link para o site.

FORMATO DE SAÍDA
Gere um único arquivo Markdown chamado AUDITORIA_BING_GOOGLE_PK7.md (ofereça para download ou mostre todo o conteúdo num bloco de código para eu copiar), com estas seções:
# Auditoria PK7 — <data e hora>
## 1. Resumo (5 a 10 linhas: o que está bom, o que está faltando, o que impede o ChatGPT de achar o site)
## 2. Bing Webmaster Tools (um subtítulo por item 2a–2i, com os dados copiados)
## 3. Google Search Console
## 4. Resultados de busca e IAs (Bing, Google/Modo IA, ChatGPT)
## 5. Perfis sociais (Instagram, LinkedIn)
## 6. Problemas encontrados (tabela: problema | onde | gravidade alta/média/baixa | ação sugerida | precisa de mudança no código do site? sim/não)
## 7. Dados para o desenvolvedor (códigos de verificação, nomes de arquivos de verificação, mensagens de erro literais, URLs exatas)
Não invente nada: se não viu, escreva "não verificado".
