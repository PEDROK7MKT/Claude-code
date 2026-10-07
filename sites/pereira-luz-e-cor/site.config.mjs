// ============================================================================
//  PEREIRA LUZ & COR — FONTE ÚNICA DE DADOS DA LOJA
//  Tudo que é NAP (nome, endereço, telefone), horário e links sai daqui:
//  páginas, schema.org (JSON-LD), llms.txt, sitemap e botões de WhatsApp.
//  Altere aqui e rode `npm run build` — o site inteiro se atualiza.
//
//  ⚠️  Itens marcados com  CONFIRMAR  precisam ser validados com o cliente
//      ANTES de publicar e ANTES de criar o Perfil da Empresa no Google
//      (o NAP do site e do Google precisam ser idênticos).
// ============================================================================

export default {
  // Domínio final, sem barra no fim. Usado em canonical, sitemap, OG e JSON-LD.
  url: 'https://www.pereiraluzecor.com.br', // CONFIRMAR: domínio registrado

  name: 'Pereira Luz & Cor',
  legalName: '', // CONFIRMAR: razão social (do CNPJ), se quiser no schema
  cnpj: '', // CONFIRMAR: opcional
  tagline: 'Materiais elétricos, tintas e ferramentas',
  slogan: 'Energia e cor para a sua obra',
  alternateNames: ['Pereira Luz e Cor', 'Pereira Materiais Elétricos e Tintas', 'Pereira Luz & Cor Barreiras'],

  // Telefone/WhatsApp. `whatsapp` = só dígitos com DDI 55 + DDD.
  // Confirmado pelo cliente em 07/10/2026 (é o mesmo da fachada).
  phoneDisplay: '(77) 99192-0081',
  phoneE164: '+5577991920081',
  whatsapp: '5577991920081',
  email: '', // CONFIRMAR: opcional

  address: {
    street: 'Rua São Francisco, 55',
    neighborhood: 'Jardim Ouro Branco',
    city: 'Barreiras',
    state: 'BA',
    stateName: 'Bahia',
    postalCode: '47802-121', // CEP do lado ímpar da R. São Francisco (Jardim Ouro Branco) — CONFIRMAR nos Correios
    country: 'BR',
  },

  // Coordenadas APROXIMADAS (trecho da R. São Francisco entre Sandra Regina e
  // Jardim Ouro Branco). CONFIRMAR com o
  // pin exato da fachada no Google Maps depois de criar o perfil.
  geo: { lat: -12.1508, lng: -44.98709 },

  // Link do Google Maps. Depois de criar o Perfil da Empresa, troque pelo
  // link "Compartilhar" do perfil (ex.: https://maps.app.goo.gl/xxxx).
  googleMapsUrl: '',
  // Link direto "Escrever avaliação" do Perfil da Empresa (aparece no site
  // quando preenchido). Ex.: https://g.page/r/XXXXXXXX/review
  googleReviewUrl: '',

  // Horário de funcionamento — PROVISÓRIO: confirmar ao criar o Perfil da
  // Empresa no Google e atualizar aqui. Formato 24h. Dias: mo tu we th fr sa su
  hours: [
    { days: ['mo', 'tu', 'we', 'th', 'fr'], opens: '07:30', closes: '18:00' },
    { days: ['sa'], opens: '07:30', closes: '13:00' },
  ],
  timezone: 'America/Bahia',

  // Formas de pagamento — confirmadas pelo cliente em 07/10/2026
  payment: ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Boleto'],
  priceRange: '$$',

  // Entrega: deixe false até confirmar (será coletado ao criar o perfil no Google).
  delivery: false,

  // Redes sociais (deixe vazio o que não existir). Entram no schema `sameAs`.
  social: {
    instagram: 'https://www.instagram.com/pereira_luzecor/',
    facebook: '',
    tiktok: '',
    youtube: '',
  },

  // Marcas que a loja revende. Só preencha com marcas confirmadas pelo
  // cliente — cada marca vira texto indexável ("Tintas X em Barreiras").
  brands: [],

  // Cidades atendidas (areaServed). Barreiras primeiro.
  areaServed: [
    'Barreiras',
    'Luís Eduardo Magalhães',
    'São Desidério',
    'Riachão das Neves',
    'Angical',
    'Catolândia',
    'Baianópolis',
    'Cristópolis',
    'Formosa do Rio Preto',
    'Wanderley',
  ],

  foundingDate: '', // CONFIRMAR: ex. '2026-09' (inauguração da loja nova)

  // Crédito no rodapé (opcional)
  agency: { name: '', url: '' },

  // Data de publicação/atualização padrão dos conteúdos
  contentDate: '2026-10-07',
}
