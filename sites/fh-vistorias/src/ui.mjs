// Componentes de HTML reutilizados por todas as páginas.
import { SITE, BIZ, HOURS, PRICE, RETURN_POLICY, WA_DEFAULT_MSG } from './data.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const abs = (slug) => (slug ? `${SITE.url}/${slug}` : `${SITE.url}/`);
export const href = (slug) => (slug ? `/${slug}` : '/');

export const fullAddress = `${BIZ.street}, ${BIZ.district}, ${BIZ.city} - ${BIZ.state}, ${BIZ.postalCode}`;
export const wa = (msg = WA_DEFAULT_MSG) => `https://wa.me/${BIZ.whatsappNumber}?text=${encodeURIComponent(msg)}`;
export const tel = `tel:${BIZ.phoneE164}`;
const mapsQuery = encodeURIComponent(`${BIZ.name}, ${BIZ.street}, ${BIZ.district}, ${BIZ.city} - ${BIZ.state}, ${BIZ.postalCode}`);
export const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
export const mapsSearch = BIZ.googleMapsProfile || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
export const mapsEmbed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

// Ícones lineares (base: Tabler Icons, MIT) num sprite único por página.
const ICONS = {
  pin: '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>',
  clock: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/>',
  coin: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M14.8 9a2 2 0 0 0-1.8-1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1-1.8-1"/><path d="M12 7v10"/>',
  doc: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 9h1M9 13h6M9 17h6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9c-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5l4.5-5"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="M9 16l2 2l4-4"/>',
  car: '<path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6-6h15m-6 0v-5"/>',
  moto: '<path d="M2 16a3 3 0 1 0 6 0a3 3 0 1 0-6 0M16 16a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/><path d="M7.5 14h5l4-4h-10.5m1.5 4l4-4"/><path d="M13 6h2l1.5 3l2 4"/>',
  truck: '<path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M5 17h-2v-11a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5"/>',
  wa: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"/><path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  phone: '<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5l5 2v4a2 2 0 0 1-2 2a16 16 0 0 1-15-15a2 2 0 0 1 2-2"/>',
  nav: '<path d="M3 11l18-8l-8 18l-2-8z"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/>',
  retry: '<path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8v-2a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6l-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  insta: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><path d="M16.5 7.5v.01"/>',
  star: '<path d="M12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.9-1l3.086-6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/>',
  bolt: '<path d="M13 3v7h6l-8 11v-7h-6l8-11"/>',
  tag: '<path d="M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592-5.592a2.41 2.41 0 0 0 0-3.408l-7.71-7.71a2 2 0 0 0-1.414-.586h-5.172a3 3 0 0 0-3 3z"/>',
  clipboard: '<path d="M9 5h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2l4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
};
export const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(ICONS)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join('')}</defs></svg>`;
export const icon = (name, cls = '') => `<svg class="ico ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

const lupa = `<svg class="lupa" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path class="ring" d="M13 27L4.5 35.5" stroke-width="6" stroke-linecap="round"/><circle class="ring" cx="22" cy="18" r="12.5" fill="#F26A1B" stroke-width="4"/><circle cx="27" cy="13" r="3.2" fill="#fff"/></svg>`;
export const logo = (tag = 'a') =>
  tag === 'a'
    ? `<a class="logo" href="/" aria-label="${BIZ.name} — página inicial"><span class="logo-fh">FH</span><span class="logo-v">vist${lupa}rias</span></a>`
    : `<span class="logo" aria-hidden="true"><span class="logo-fh">FH</span><span class="logo-v">vist${lupa}rias</span></span>`;

// Botões de conversão (com evento de analytics via data-ev).
export const btnWa = (label = 'Chamar no WhatsApp', msg, cls = 'btn btn-wa', where = 'conteudo') =>
  `<a class="${cls}" href="${esc(wa(msg))}" target="_blank" rel="noopener" data-ev="whatsapp_click" data-ev-where="${where}">${icon('wa')}<span>${label}</span></a>`;
export const btnRoute = (label = 'Como chegar', cls = 'btn btn-ghost', where = 'conteudo') =>
  `<a class="${cls}" href="${esc(mapsDirections)}" target="_blank" rel="noopener" data-ev="directions_click" data-ev-where="${where}">${icon('nav')}<span>${label}</span></a>`;
export const btnPhone = (label = BIZ.phoneDisplay, cls = 'btn btn-line', where = 'conteudo') =>
  `<a class="${cls}" href="${tel}" data-ev="phone_click" data-ev-where="${where}">${icon('phone')}<span>${label}</span></a>`;

// As 4 perguntas que todo cliente de vistoria faz: onde, quanto, o que levar, precisa agendar.
// Visual de ficha/laudo (papel branco, linhas tracejadas, check laranja), como a prancheta das artes da FH.
export const quickFacts = () => `<div class="ficha">
  <div class="ficha-head"><span>Antes de vir</span><span>${BIZ.cityShort}-${BIZ.state}</span></div>
  <dl>
    <div><dt>Onde fica</dt><dd>${BIZ.street}, ${BIZ.district}</dd></div>
    <div><dt>Quanto custa</dt><dd>${PRICE.display} <small>carro, moto ou caminhão</small></dd></div>
    <div><dt>O que levar</dt><dd>O veículo e os documentos <a href="/documentos-necessarios">ver lista</a></dd></div>
    <div><dt>Precisa agendar?</dt><dd>Não. <small>Seg a sex, 7h30–12h10 e 14h–17h30</small></dd></div>
  </dl>
</div>`;

export const NAV = [
  ['vistoria-de-transferencia', 'Transferência'],
  ['valores', 'Valores'],
  ['documentos-necessarios', 'Documentos'],
  ['como-funciona', 'Como funciona'],
  ['perguntas-frequentes', 'Dúvidas'],
  ['sobre', 'Sobre'],
  ['contato', 'Contato'],
];

export const header = (slug) => `<header class="hdr">
  <div class="wrap">
    ${logo()}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">${icon('menu')}<span>Menu</span></button>
    <nav class="nav" id="menu" aria-label="Principal">
      ${NAV.map(([s, l]) => `<a href="${href(s)}"${s === slug ? ' aria-current="page"' : ''}>${l}</a>`).join('\n      ')}
    </nav>
    ${btnWa('WhatsApp', undefined, 'btn btn-wa btn-sm hdr-cta', 'header')}
  </div>
</header>`;

export const crumbs = (trail) =>
  `<nav class="crumbs" aria-label="Você está em"><ol>${trail
    .map(([s, name], i) => (i === trail.length - 1 ? `<li aria-current="page">${name}</li>` : `<li><a href="${href(s)}">${name}</a></li>`))
    .join('')}</ol></nav>`;

export const ctaBand = (title = 'Precisa fazer a vistoria? Venha hoje mesmo.', text = `Sem agendamento. ${HOURS.text}. ${BIZ.street}, ${BIZ.district}.`) => `<section class="cta-band" aria-label="Fale com a FH Vistorias">
  <div class="wrap">
    <div><h2>${title}</h2><p>${text}</p></div>
    <div class="btns">${btnWa('Chamar no WhatsApp', undefined, 'btn btn-wa', 'faixa_cta')}${btnRoute('Como chegar', 'btn btn-line', 'faixa_cta')}</div>
  </div>
</section>`;

export const faqBlock = (faqs, title = 'Perguntas frequentes') => `<section class="sec sec-mist" id="duvidas">
  <div class="wrap">
    <div class="sec-head"><h2>${title}</h2></div>
    <div class="faq">
      ${faqs.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary><h3>${f.q}</h3></summary><div class="a">${f.a.startsWith('<') ? f.a : `<p>${f.a}</p>`}</div></details>`).join('\n      ')}
    </div>
  </div>
</section>`;

export const napBlock = () => `<address class="nap">
  <div class="row">${icon('pin')}<div><strong>${BIZ.name}</strong><br>${BIZ.street}, ${BIZ.district}<br>${BIZ.city}-${BIZ.state}, ${BIZ.postalCode}</div></div>
  <div class="row">${icon('phone')}<div><a href="${tel}" data-ev="phone_click" data-ev-where="nap">${BIZ.phoneDisplay}</a> (telefone e WhatsApp)</div></div>
  <div class="row">${icon('clock')}<div>${HOURS.text}.<br>${HOURS.weekendText}.</div></div>
</address>`;

export const footer = () => `<footer class="ftr">
  <div class="wrap">
    <div>
      ${logo()}
      <p>Vistoria veicular credenciada pelo DETRAN-BA em ${BIZ.city} (${BIZ.state}). Carro, moto e caminhão, sem agendamento e com laudo emitido na hora.</p>
      ${napBlock()}
    </div>
    <div>
      <h2>Serviços</h2>
      <ul>
        <li><a href="/vistoria-veicular-luis-eduardo-magalhaes">Vistoria veicular em LEM</a></li>
        <li><a href="/vistoria-de-transferencia">Vistoria de transferência</a></li>
        <li><a href="/vistoria-de-carro">Vistoria de carro</a></li>
        <li><a href="/vistoria-de-moto">Vistoria de moto</a></li>
        <li><a href="/vistoria-de-caminhao">Vistoria de caminhão e reboque</a></li>
        <li><a href="/segunda-via-de-vistoria">Segunda via de vistoria</a></li>
        <li><a href="/vistoria-reprovada-o-que-fazer">Vistoria reprovada</a></li>
      </ul>
    </div>
    <div>
      <h2>Informações</h2>
      <ul>
        <li><a href="/valores">Valores</a></li>
        <li><a href="/como-funciona">Como funciona</a></li>
        <li><a href="/documentos-necessarios">Documentos necessários</a></li>
        <li><a href="/perguntas-frequentes">Perguntas frequentes</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/sobre">Sobre a FH</a></li>
        <li><a href="/contato">Contato e localização</a></li>
        <li><a href="${BIZ.instagram}" target="_blank" rel="noopener">Instagram @${BIZ.instagramHandle}</a></li>
      </ul>
    </div>
    <div class="legal">
      <span>© ${new Date(SITE.updated).getFullYear()} ${BIZ.legalName || BIZ.name}${BIZ.cnpj ? ` · CNPJ ${BIZ.cnpj}` : ''} · <strong>Empresa credenciada pelo DETRAN-BA</strong>${BIZ.detranCredential ? ` · Credenciamento nº ${BIZ.detranCredential}` : ''}</span>
      <span><a href="/politica-de-privacidade">Política de privacidade</a> · <button type="button" class="linkish" data-cookie-open style="background:none;border:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;padding:0">Cookies</button></span>
    </div>
  </div>
</footer>
<a class="wa-float" href="${esc(wa())}" target="_blank" rel="noopener" aria-label="Chamar a FH Vistorias no WhatsApp" data-ev="whatsapp_click" data-ev-where="botao_flutuante">${icon('wa')}</a>
<nav class="actionbar" aria-label="Ações rápidas">
  <a href="${tel}" data-ev="phone_click" data-ev-where="barra_mobile">${icon('phone')}Ligar</a>
  <a class="wa" href="${esc(wa())}" target="_blank" rel="noopener" data-ev="whatsapp_click" data-ev-where="barra_mobile">${icon('wa')}WhatsApp</a>
  <a href="${esc(mapsDirections)}" target="_blank" rel="noopener" data-ev="directions_click" data-ev-where="barra_mobile">${icon('nav')}Rota</a>
</nav>
<div class="cookie" role="dialog" aria-live="polite" aria-label="Aviso de cookies" hidden>
  <p>Usamos cookies de medição (Google Analytics) só com a sua permissão, para entender como o site é usado. Saiba mais na <a href="/politica-de-privacidade">política de privacidade</a>.</p>
  <div class="btns"><button type="button" class="btn btn-dark btn-sm" data-cookie="accept">Aceitar</button><button type="button" class="btn btn-line btn-sm" data-cookie="reject">Recusar</button></div>
</div>`;

export const updated = () => `<p class="updated">Informações conferidas e atualizadas em ${SITE.updatedLabel}.</p>`;

export const returnCard = () => `<div class="note"><strong>Reprovou? Não paga tudo de novo.</strong> ${RETURN_POLICY.text} <a href="/vistoria-reprovada-o-que-fazer">Entenda como funciona</a>.</div>`;
