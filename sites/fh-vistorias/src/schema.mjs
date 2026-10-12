// JSON-LD (schema.org). Cada página recebe um @graph com a entidade da empresa
// (sempre o mesmo @id), o WebSite, a WebPage, o BreadcrumbList e os nós específicos.
import { SITE, BIZ, HOURS, PRICE } from './data.mjs';
import { abs, wa } from './ui.mjs';

export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;

const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function orgNode() {
  const sameAs = [BIZ.instagram, BIZ.googleMapsProfile, BIZ.facebook, BIZ.whatsappCatalogLink].filter(Boolean);
  const node = {
    '@type': ['LocalBusiness', 'AutomotiveBusiness'],
    '@id': ORG_ID,
    name: BIZ.name,
    alternateName: BIZ.alternateName,
    description: `Empresa credenciada pelo DETRAN-BA que realiza vistoria veicular de transferência para carros, motos e caminhões em ${BIZ.city}, Bahia, com laudo emitido na hora e sem agendamento.`,
    slogan: BIZ.slogan,
    url: `${SITE.url}/`,
    logo: { '@type': 'ImageObject', url: `${SITE.url}/images/logo-fh-vistorias.png`, width: 512, height: 512 },
    image: [`${SITE.url}/images/og-fh-vistorias.png`],
    telephone: BIZ.phoneSchema,
    priceRange: `R$ ${PRICE.value}`,
    currenciesAccepted: 'BRL',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BIZ.street,
      addressLocality: BIZ.city,
      addressRegion: BIZ.state,
      postalCode: BIZ.postalCode,
      addressCountry: BIZ.country,
    },
    openingHoursSpecification: HOURS.shifts.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: HOURS.days,
      opens: s.opens,
      closes: s.closes,
    })),
    areaServed: { '@type': 'City', name: BIZ.city, containedInPlace: { '@type': 'State', name: BIZ.stateName } },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BIZ.phoneSchema,
      contactType: 'customer service',
      availableLanguage: 'pt-BR',
      url: wa(),
    },
    knowsAbout: [
      'Vistoria veicular',
      'Vistoria de transferência de propriedade',
      'Vistoria de moto',
      'Vistoria de caminhão e reboque',
      'Laudo de vistoria DETRAN-BA',
    ],
    sameAs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Serviços de vistoria veicular',
      itemListElement: [
        ['Vistoria veicular de carro', 'vistoria-de-carro', true],
        ['Vistoria veicular de moto', 'vistoria-de-moto', true],
        ['Vistoria de caminhão e reboque', 'vistoria-de-caminhao', true],
        ['Segunda via de vistoria', 'segunda-via-de-vistoria', false],
      ].map(([name, slug, priced]) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name, url: abs(slug) },
        ...(priced ? { price: PRICE.schema, priceCurrency: 'BRL' } : {}),
      })),
    },
  };
  if (BIZ.geo.lat && BIZ.geo.lng) node.geo = { '@type': 'GeoCoordinates', latitude: BIZ.geo.lat, longitude: BIZ.geo.lng };
  if (BIZ.googleMapsProfile) node.hasMap = BIZ.googleMapsProfile;
  if (BIZ.email) node.email = BIZ.email;
  if (BIZ.legalName) node.legalName = BIZ.legalName;
  if (BIZ.cnpj) node.taxID = BIZ.cnpj;
  if (BIZ.foundingYear) node.foundingDate = BIZ.foundingYear;
  if (BIZ.detranCredential)
    node.hasCredential = {
      '@type': 'EducationalOccupationalCredential',
      name: `Credenciamento DETRAN-BA nº ${BIZ.detranCredential}`,
      credentialCategory: 'Credenciamento para vistoria veicular',
      recognizedBy: { '@type': 'GovernmentOrganization', name: 'Departamento Estadual de Trânsito da Bahia (DETRAN-BA)', url: 'https://www.detran.ba.gov.br/' },
    };
  return node;
}

export function websiteNode() {
  return { '@type': 'WebSite', '@id': SITE_ID, url: `${SITE.url}/`, name: BIZ.name, inLanguage: SITE.lang, publisher: { '@id': ORG_ID } };
}

export function breadcrumbNode(trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(trail[trail.length - 1][0])}#breadcrumb`,
    itemListElement: trail.map(([slug, name], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(slug) })),
  };
}

export function webPageNode(page, type = 'WebPage') {
  const n = {
    '@type': type,
    '@id': `${abs(page.slug)}#webpage`,
    url: abs(page.slug),
    name: page.title,
    description: page.description,
    inLanguage: SITE.lang,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    dateModified: page.modified || SITE.updated,
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE.url}${page.image || '/images/og-fh-vistorias.png'}` },
  };
  if (page.trail.length > 1) n.breadcrumb = { '@id': `${abs(page.slug)}#breadcrumb` };
  return n;
}

export function serviceNode(page, s) {
  const n = {
    '@type': 'Service',
    '@id': `${abs(page.slug)}#service`,
    name: s.name,
    serviceType: s.serviceType || 'Vistoria veicular',
    description: s.description,
    url: abs(page.slug),
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'City', name: BIZ.city },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceLocation: { '@id': ORG_ID },
      servicePhone: { '@type': 'ContactPoint', telephone: BIZ.phoneSchema },
    },
  };
  if (s.price !== false) n.offers = { '@type': 'Offer', price: PRICE.schema, priceCurrency: 'BRL', url: abs('valores') };
  return n;
}

export function faqNode(page, faqs) {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(page.slug)}#faq`,
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: strip(f.q), acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })),
  };
}

export function howToNode(page, steps) {
  return {
    '@type': 'HowTo',
    '@id': `${abs(page.slug)}#howto`,
    name: 'Como fazer a vistoria veicular na FH Vistorias em Luís Eduardo Magalhães',
    description: 'Passo a passo da vistoria de transferência, da chegada à emissão do laudo.',
    totalCost: { '@type': 'MonetaryAmount', currency: 'BRL', value: PRICE.schema },
    supply: [{ '@type': 'HowToSupply', name: 'Veículo a ser vistoriado' }, { '@type': 'HowToSupply', name: 'Documento do veículo e documento de identificação' }],
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: strip(s.text), url: `${abs(page.slug)}#passo-${i + 1}` })),
  };
}

export function articleNode(page) {
  return {
    '@type': 'BlogPosting',
    '@id': `${abs(page.slug)}#article`,
    headline: strip(page.h1),
    description: page.description,
    datePublished: page.published,
    dateModified: page.modified || page.published,
    inLanguage: SITE.lang,
    mainEntityOfPage: { '@id': `${abs(page.slug)}#webpage` },
    author: { '@type': 'Organization', '@id': ORG_ID, name: BIZ.name },
    publisher: { '@id': ORG_ID },
    image: `${SITE.url}/images/og-fh-vistorias.png`,
  };
}

export function graphFor(page) {
  const g = [orgNode(), websiteNode(), webPageNode(page, page.pageType)];
  if (page.trail.length > 1) g.push(breadcrumbNode(page.trail));
  if (page.service) g.push(serviceNode(page, page.service));
  if (page.howto) g.push(howToNode(page, page.howto));
  if (page.article) g.push(articleNode(page));
  if (page.faqs?.length && page.faqSchema !== false) g.push(faqNode(page, page.faqs));
  return { '@context': 'https://schema.org', '@graph': g };
}
