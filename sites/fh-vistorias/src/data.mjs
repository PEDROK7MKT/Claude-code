// Fonte única de verdade da FH Vistorias.
// Tudo que aparece no site, no JSON-LD, no llms.txt e no kit do Google vem daqui:
// mude um dado UMA vez e rode `node build.mjs`. Isso garante NAP idêntico em todo lugar.
//
// Itens com `pendente: true` NÃO foram confirmados com o cliente. O build lista
// todos eles no terminal e em docs/PENDENCIAS.md. Enquanto pendentes, o site usa
// uma redação neutra (sem inventar dado).

export const SITE = {
  // [PENDENTE] domínio ainda não registrado. Trocar aqui e rodar o build.
  url: 'https://fhvistorias.com.br',
  lang: 'pt-BR',
  locale: 'pt_BR',
  updated: '2026-10-12', // "Atualizado em" exibido nas páginas (E-E-A-T / GEO)
  updatedLabel: 'outubro de 2026',
  // IDs de medição — deixe vazio para não carregar nada.
  ga4Id: '', // ex.: 'G-XXXXXXX'
  gscVerification: '', // conteúdo da meta google-site-verification
  bingVerification: '', // conteúdo da meta msvalidate.01
};

export const BIZ = {
  name: 'FH Vistorias',
  alternateName: 'FH Vistorias LEM-BA',
  instagramHandle: 'fhvistorialem',
  slogan: 'Confiança que te move.',
  street: 'Rua São Francisco, 1516',
  district: 'Centro',
  city: 'Luís Eduardo Magalhães',
  cityShort: 'LEM',
  state: 'BA',
  stateName: 'Bahia',
  postalCode: '47850-000',
  country: 'BR',
  phoneDisplay: '(77) 99122-8535',
  phoneE164: '+5577991228535',
  phoneSchema: '+55-77-99122-8535',
  whatsappNumber: '5577991228535',
  whatsappCatalogLink: 'https://wa.me/message/G4ILNTLOXS4JB1',
  instagram: 'https://www.instagram.com/fhvistorialem/',
  // Preencher após criar o Perfil de Empresa no Google / Facebook.
  googleMapsProfile: '', // [PENDENTE] URL do perfil no Google Maps
  googleReviewLink: '', // [PENDENTE] link curto g.page/r/... para avaliações
  facebook: '', // [PENDENTE]
  // Coordenadas exatas da fachada (pegar no Google Maps). Vazio = não entra no schema.
  geo: { lat: '', lng: '' }, // [PENDENTE]
  // Credenciamento DETRAN-BA — exibido no rodapé e no schema quando preenchido.
  detranCredential: '', // [PENDENTE]
  cnpj: '', // [PENDENTE]
  legalName: '', // [PENDENTE] razão social
  email: '', // [PENDENTE]
  foundingYear: '', // [PENDENTE]
  responsible: '', // [PENDENTE] nome do responsável / vistoriador
};

// Horário confirmado no post "Horário de funcionamento".
export const HOURS = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  shifts: [
    { opens: '07:30', closes: '12:10' },
    { opens: '14:00', closes: '17:30' },
  ],
  text: 'Segunda a sexta, das 7h30 às 12h10 e das 14h às 17h30',
  textShort: 'Seg a sex · 7h30–12h10 e 14h–17h30',
  // Briefing: sábado/domingo/feriados [CONFIRMAR]. O post só cita seg–sex.
  weekendText: 'Sábados, domingos e feriados: consulte pelo WhatsApp',
};

// Preço publicado pela própria empresa no Instagram. [CONFIRMAR se segue vigente]
export const PRICE = {
  value: 237,
  display: 'R$ 237,00',
  schema: '237.00',
  table: [
    { item: 'Vistoria de carro', price: 'R$ 237,00', slug: 'vistoria-de-carro' },
    { item: 'Vistoria de moto', price: 'R$ 237,00', slug: 'vistoria-de-moto' },
    { item: 'Vistoria de caminhão e reboque', price: 'R$ 237,00', slug: 'vistoria-de-caminhao' },
    { item: 'Segunda via de vistoria', price: 'Consulte pelo WhatsApp', slug: 'segunda-via-de-vistoria' },
  ],
};

export const RETURN_POLICY = {
  days: 30,
  text: 'Se o veículo for reprovado, você tem até 30 dias úteis para regularizar e voltar sem custo adicional.',
};

export const WA_DEFAULT_MSG = 'Olá! Vim pelo site e quero fazer uma vistoria. Pode me orientar?';

export const PENDENCIAS = [
  { campo: 'Domínio', onde: 'SITE.url', nota: 'Registrar fhvistorias.com.br (ou alternativa) e atualizar SITE.url.' },
  { campo: 'Valor R$ 237,00', onde: 'PRICE', nota: 'Confirmar se o valor publicado no Instagram continua vigente para carro, moto e caminhão/reboque.' },
  { campo: 'Valor da segunda via', onde: 'PRICE.table', nota: 'Hoje o site diz "consulte pelo WhatsApp".' },
  { campo: 'Sábado, domingo e feriados', onde: 'HOURS.weekendText', nota: 'Confirmar se fecha. Hoje o site diz "consulte pelo WhatsApp".' },
  { campo: 'Número do credenciamento DETRAN-BA', onde: 'BIZ.detranCredential', nota: 'Aparece no rodapé, na página Sobre e no schema quando preenchido.' },
  { campo: 'CNPJ e razão social', onde: 'BIZ.cnpj / BIZ.legalName', nota: 'Rodapé, política de privacidade e schema.' },
  { campo: 'E-mail profissional', onde: 'BIZ.email', nota: 'Contato e política de privacidade (hoje usa só WhatsApp).' },
  { campo: 'Formas de pagamento', onde: 'FAQ / Valores', nota: 'Pix, cartão, dinheiro? Hoje o site diz "consulte pelo WhatsApp".' },
  { campo: 'Tempo médio da vistoria', onde: 'FAQ', nota: 'Não há prazo afirmado no site até confirmar.' },
  { campo: 'Lista oficial de documentos por situação', onde: '/documentos-necessarios', nota: 'Página traz orientação geral e pede confirmação pelo WhatsApp. Validar com a empresa e o DETRAN-BA.' },
  { campo: 'Casos que exigem vistoria (placa Mercosul, motor, característica, 2ª via de documento)', onde: '/documentos-necessarios, FAQ', nota: 'Vieram de post da empresa; validar caso a caso.' },
  { campo: 'Vistoria cautelar', onde: 'FAQ', nota: 'Confirmar se a FH oferece. Hoje o site só explica a diferença e diz que o foco é a vistoria do DETRAN.' },
  { campo: 'Atendimento a cidades vizinhas', onde: 'FAQ / páginas regionais', nota: 'Não foram criadas páginas regionais (evitar doorway). Criar só com demanda real.' },
  { campo: 'Coordenadas (lat/lng) da fachada', onde: 'BIZ.geo', nota: 'Copiar do Google Maps; entra no schema GeoCoordinates.' },
  { campo: 'URL do Perfil de Empresa no Google e link de avaliação', onde: 'BIZ.googleMapsProfile / googleReviewLink', nota: 'Entram no sameAs e no botão "Avaliar no Google".' },
  { campo: 'Nome do responsável, ano de fundação, fotos reais', onde: '/sobre', nota: 'E-E-A-T: pessoas e fotos reais aumentam confiança. Página Sobre já tem espaço para isso.' },
  { campo: 'Estacionamento / acessibilidade / acesso de caminhão', onde: '/contato, /vistoria-de-caminhao', nota: 'Hoje o site pede para avisar pelo WhatsApp antes de trazer caminhão ou carreta.' },
  { campo: 'IDs de GA4 / Search Console / Bing', onde: 'SITE.ga4Id etc.', nota: 'Vazio = nada é carregado.' },
];
