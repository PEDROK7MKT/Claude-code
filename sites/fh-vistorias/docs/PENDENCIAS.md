# Pendências a confirmar com o cliente

> Gerado por `node build.mjs` a partir de `src/data.mjs`. Enquanto um item estiver aqui,
> o site usa redação neutra (sem inventar o dado). Depois de confirmar, edite `src/data.mjs`
> (ou o texto indicado) e rode o build de novo.

| # | Item | Onde mudar | Situação atual no site |
|---|---|---|---|
| 1 | Domínio | `SITE.url` | Registrar fhvistorias.com.br (ou alternativa) e atualizar SITE.url. |
| 2 | Valor R$ 237,00 | `PRICE` | Confirmar se o valor publicado no Instagram continua vigente para carro, moto e caminhão/reboque. |
| 3 | Valor da segunda via | `PRICE.table` | Hoje o site diz "consulte pelo WhatsApp". |
| 4 | Sábado, domingo e feriados | `HOURS.weekendText` | Confirmar se fecha. Hoje o site diz "consulte pelo WhatsApp". |
| 5 | Número do credenciamento DETRAN-BA | `BIZ.detranCredential` | Aparece no rodapé, na página Sobre e no schema quando preenchido. |
| 6 | CNPJ e razão social | `BIZ.cnpj / BIZ.legalName` | Rodapé, política de privacidade e schema. |
| 7 | E-mail profissional | `BIZ.email` | Contato e política de privacidade (hoje usa só WhatsApp). |
| 8 | Formas de pagamento | `FAQ / Valores` | Pix, cartão, dinheiro? Hoje o site diz "consulte pelo WhatsApp". |
| 9 | Tempo médio da vistoria | `FAQ` | Não há prazo afirmado no site até confirmar. |
| 10 | Lista oficial de documentos por situação | `/documentos-necessarios` | Página traz orientação geral e pede confirmação pelo WhatsApp. Validar com a empresa e o DETRAN-BA. |
| 11 | Casos que exigem vistoria (placa Mercosul, motor, característica, 2ª via de documento) | `/documentos-necessarios, FAQ` | Vieram de post da empresa; validar caso a caso. |
| 12 | Vistoria cautelar | `FAQ` | Confirmar se a FH oferece. Hoje o site só explica a diferença e diz que o foco é a vistoria do DETRAN. |
| 13 | Atendimento a cidades vizinhas | `FAQ / páginas regionais` | Não foram criadas páginas regionais (evitar doorway). Criar só com demanda real. |
| 14 | Coordenadas (lat/lng) da fachada | `BIZ.geo` | Copiar do Google Maps; entra no schema GeoCoordinates. |
| 15 | URL do Perfil de Empresa no Google e link de avaliação | `BIZ.googleMapsProfile / googleReviewLink` | Entram no sameAs e no botão "Avaliar no Google". |
| 16 | Nome do responsável, ano de fundação, fotos reais | `/sobre` | E-E-A-T: pessoas e fotos reais aumentam confiança. Página Sobre já tem espaço para isso. |
| 17 | Estacionamento / acessibilidade / acesso de caminhão | `/contato, /vistoria-de-caminhao` | Hoje o site pede para avisar pelo WhatsApp antes de trazer caminhão ou carreta. |
| 18 | IDs de GA4 / Search Console / Bing | `SITE.ga4Id etc.` | Vazio = nada é carregado. |
