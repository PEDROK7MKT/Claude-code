// FH Vistorias — JS mínimo: menu, eventos de conversão, consentimento (LGPD) e mapa sob demanda.
(function () {
  var d = document;
  var GA = window.FH_GA4 || '';
  var KEY = 'fh-consent';

  // Menu mobile
  var btn = d.querySelector('.menu-btn');
  var nav = d.getElementById('menu');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Eventos: whatsapp_click, phone_click, directions_click
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-ev]');
    if (!a) return;
    var params = { link_location: a.getAttribute('data-ev-where') || '', page_path: location.pathname, transport_type: 'beacon' };
    window.gtag('event', a.getAttribute('data-ev'), params);
  });

  // Consentimento: o Google Analytics só carrega depois de "Aceitar".
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    if (!GA || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
    d.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA, { anonymize_ip: true });
  }
  var banner = d.querySelector('.cookie');
  function show() { if (banner) banner.hidden = false; }
  function hide() { if (banner) banner.hidden = true; }
  if (GA) {
    var c = get();
    if (c === 'granted') loadGA();
    else if (c !== 'denied') show();
  }
  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie],[data-cookie-open]');
    if (!t) return;
    if (t.hasAttribute('data-cookie-open')) return show();
    var v = t.getAttribute('data-cookie') === 'accept' ? 'granted' : 'denied';
    set(v);
    hide();
    if (v === 'granted') loadGA();
  });

  // Mapa do Google só carrega no clique (performance + privacidade)
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-map-load]');
    if (!b) return;
    var box = b.closest('[data-map]');
    var f = d.createElement('iframe');
    f.src = box.getAttribute('data-map');
    f.title = 'Mapa: localização da FH Vistorias em Luís Eduardo Magalhães';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    box.innerHTML = '';
    box.appendChild(f);
  });
})();
