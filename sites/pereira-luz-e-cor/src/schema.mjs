// Construtores de JSON-LD (schema.org). Tudo vai num único @graph por página,
// com @id estáveis para que Google e IAs liguem as entidades entre si.
import { site, abs, stripTags, openingHoursSpecification, sameAs, directionsUrl } from './lib.mjs'

export const ID = {
  store: abs('/#loja'),
  website: abs('/#website'),
  logo: abs('/#logo'),
}

const postalAddress = () => {
  const a = site.address
  return {
    '@type': 'PostalAddress',
    streetAddress: a.street,
    addressLocality: a.city,
    addressRegion: a.state,
    ...(a.postalCode ? { postalCode: a.postalCode } : {}),
    addressCountry: a.country,
  }
}

/** Entidade principal: a loja (HardwareStore ⊂ Store ⊂ LocalBusiness). */
export const storeEntity = (categories = []) => ({
  '@type': ['HardwareStore', 'LocalBusiness'],
  '@id': ID.store,
  name: site.name,
  alternateName: site.alternateNames,
  ...(site.legalName ? { legalName: site.legalName } : {}),
  ...(site.cnpj ? { taxID: site.cnpj } : {}),
  slogan: site.slogan,
  description: `${site.name} é uma loja de materiais elétricos, tintas, ferramentas, hidráulica e ferragens no bairro ${site.address.neighborhood}, em ${site.address.city}-${site.address.state}. Atende no balcão e faz orçamento pelo WhatsApp.`,
  url: abs('/'),
  logo: { '@type': 'ImageObject', '@id': ID.logo, url: abs('/assets/img/icon-512.png'), width: 512, height: 512 },
  image: [abs('/assets/img/loja-pereira-fachada-1280.jpg'), abs('/assets/img/og-pereira.jpg')],
  telephone: site.phoneE164,
  ...(site.email ? { email: site.email } : {}),
  address: postalAddress(),
  geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
  hasMap: directionsUrl(),
  openingHoursSpecification: openingHoursSpecification(),
  priceRange: site.priceRange,
  currenciesAccepted: 'BRL',
  paymentAccepted: site.payment.join(', '),
  ...(site.foundingDate ? { foundingDate: site.foundingDate } : {}),
  areaServed: site.areaServed.map((c) => ({ '@type': 'City', name: `${c}, BA` })),
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: site.phoneE164,
    contactType: 'customer service',
    availableLanguage: 'pt-BR',
    areaServed: 'BR',
  },
  knowsAbout: [
    'Materiais elétricos', 'Fios e cabos', 'Disjuntores', 'Chuveiros elétricos', 'Iluminação LED', 'Fita de LED',
    'Tintas', 'Massa corrida', 'Ferramentas', 'Esmerilhadeira', 'Furadeira', 'Hidráulica', 'Caixa d\'água',
    'Parafusos', 'Lubrificantes', 'EPI',
  ],
  ...(categories.length
    ? {
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `Produtos da ${site.name}`,
          itemListElement: categories.map((c) => ({
            '@type': 'OfferCatalog',
            name: c.name,
            url: abs(`/${c.slug}/`),
            description: c.groups.map((g) => g.name).join(', '),
          })),
        },
      }
    : {}),
  ...(sameAs().length ? { sameAs: sameAs() } : {}),
  ...(site.brands.length ? { brand: site.brands.map((b) => ({ '@type': 'Brand', name: b })) } : {}),
})

export const websiteEntity = () => ({
  '@type': 'WebSite',
  '@id': ID.website,
  url: abs('/'),
  name: site.name,
  alternateName: site.alternateNames[0],
  inLanguage: 'pt-BR',
  publisher: { '@id': ID.store },
})

export const breadcrumbList = (path, crumbs) => ({
  '@type': 'BreadcrumbList',
  '@id': abs(path) + '#breadcrumb',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: abs(c.path),
  })),
})

export const webPage = ({ path, title, description, type = 'WebPage', crumbs, image, dateModified }) => ({
  '@type': type,
  '@id': abs(path) + '#webpage',
  url: abs(path),
  name: title,
  description,
  inLanguage: 'pt-BR',
  isPartOf: { '@id': ID.website },
  about: { '@id': ID.store },
  ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: abs(image) } } : {}),
  ...(crumbs && crumbs.length > 1 ? { breadcrumb: { '@id': abs(path) + '#breadcrumb' } } : {}),
  ...(dateModified ? { dateModified } : {}),
})

export const faqPage = (path, faq) => ({
  '@type': 'FAQPage',
  '@id': abs(path) + '#faq',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) },
  })),
})

export const article = (g) => ({
  '@type': 'Article',
  '@id': abs(`/guias/${g.slug}/`) + '#article',
  headline: g.title,
  description: g.seo.description,
  inLanguage: 'pt-BR',
  datePublished: g.datePublished || site.contentDate,
  dateModified: g.dateModified || site.contentDate,
  author: { '@type': 'Organization', name: `Equipe ${site.name}`, url: abs('/sobre/') },
  publisher: { '@id': ID.store },
  mainEntityOfPage: { '@id': abs(`/guias/${g.slug}/`) + '#webpage' },
  image: abs(`/assets/img/og/guia-${g.slug}.jpg`),
  articleSection: g.categoryName,
  wordCount: g.wordCount,
  ...(g.sources?.length ? { citation: g.sources.map((s) => (s.url ? { '@type': 'CreativeWork', name: s.name, url: s.url } : s.name)) } : {}),
})

export const howTo = (g) => ({
  '@type': 'HowTo',
  '@id': abs(`/guias/${g.slug}/`) + '#howto',
  name: g.howTo.name,
  ...(g.howTo.totalTime ? { totalTime: g.howTo.totalTime } : {}),
  ...(g.howTo.supplies?.length ? { supply: g.howTo.supplies.map((s) => ({ '@type': 'HowToSupply', name: s })) } : {}),
  ...(g.howTo.tools?.length ? { tool: g.howTo.tools.map((s) => ({ '@type': 'HowToTool', name: s })) } : {}),
  step: g.howTo.steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.name,
    text: stripTags(s.text),
    url: abs(`/guias/${g.slug}/`) + `#passo-${i + 1}`,
  })),
})

export const itemList = (path, name, entries) => ({
  '@type': 'ItemList',
  '@id': abs(path) + '#lista',
  name,
  itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.name, url: abs(e.path) })),
})

/** Serializa o grafo num <script> seguro. */
export const jsonld = (nodes) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }).replace(/</g, '\\u003c')}</script>`
