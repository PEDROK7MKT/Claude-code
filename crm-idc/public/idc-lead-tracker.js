/*!
 * IDC Lead Tracker — Instituto Décio Carrilho (sem dependências)
 *
 * No site institutodeciocarrilho.com.br:
 *   1. guarda a origem do visitante (utm_*, gclid, página de entrada) por 30 dias
 *      no localStorage, com um cookie de reserva;
 *   2. expõe window.IDCLeads.submit({ name, phone, service, message }) para enviar
 *      o lead de um mini formulário direto ao CRM (webhook, modo público);
 *   3. acrescenta um código curto "[ref: gads-urgencia]" ao texto dos links de
 *      WhatsApp, para a recepção saber a fonte ao cadastrar o lead manualmente.
 *
 * Uso (antes de </body>):
 *   <script src="https://crm.institutodeciocarrilho.com.br/idc-lead-tracker.js" defer></script>
 * Opções (atributos data-* na tag):
 *   data-endpoint="https://.../api/webhook/lead"  — padrão: mesmo domínio do script
 *   data-attribution="last"                       — última campanha vence (padrão: primeira)
 *   data-whatsapp-ref="off"                       — não altera os links de WhatsApp
 * Documentação completa: docs/WEBHOOK.md no repositório do CRM.
 */
(() => {
  "use strict";

  if (window.IDCLeads) return; // script incluído duas vezes

  const script = document.currentScript;
  const options = (script && script.dataset) || {};
  const ENDPOINT =
    options.endpoint || new URL("/api/webhook/lead", (script && script.src) || window.location.href).href;
  const STORAGE_KEY = "idc_lead_tracking";
  const COOKIE_NAME = "idc_lt";
  const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
  const TIMEOUT_MS = 10000;
  const CLICK_PARAMS = ["gclid", "gbraid", "wbraid"];
  const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].concat(CLICK_PARAMS);
  const WHATSAPP_LINK = /^(https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\/|whatsapp:\/\/)/i;

  const clip = (value, max) => (value ? String(value).slice(0, max) : undefined);
  const slug = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // ---------------------------------------------------------------------------
  // 1. Origem do visitante (localStorage + cookie de reserva)
  // ---------------------------------------------------------------------------

  function readStored() {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage bloqueado (modo privado, política do navegador)
    }
    if (!raw) {
      const match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"));
      raw = match ? decodeURIComponent(match[1]) : null;
    }
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return data && typeof data.ts === "number" && Date.now() - data.ts < TTL_MS ? data : null;
    } catch {
      return null;
    }
  }

  function writeStored(data) {
    const raw = JSON.stringify(data);
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      // segue só com o cookie
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      COOKIE_NAME + "=" + encodeURIComponent(raw) + "; Max-Age=" + TTL_MS / 1000 + "; Path=/; SameSite=Lax" + secure;
  }

  /** Sem UTM: tenta a origem pelo referrer (busca orgânica do Google, Instagram). */
  function fromReferrer() {
    let host = "";
    try {
      host = new URL(document.referrer).hostname;
    } catch {
      return {};
    }
    if (!host || host === window.location.hostname) return {};
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return { utm_source: "google", utm_medium: "organic" };
    if (/(^|\.)instagram\.com$/.test(host)) return { utm_source: "instagram", utm_medium: "social" };
    return { referrer: clip(host, 100) };
  }

  /**
   * Primeira visita com origem vence por 30 dias. Exceção: quem entrou direto e
   * depois clicou num anúncio passa a ser atribuído ao anúncio (visita com UTM/gclid
   * substitui registro sem rastreio). Com data-attribution="last", a última vence.
   */
  function capture() {
    const params = new URLSearchParams(window.location.search);
    const current = {
      ts: Date.now(),
      landing_page: clip(window.location.pathname, 200),
      url: clip(window.location.origin + window.location.pathname + window.location.search, 500),
      tracked: false,
    };
    TRACKING_PARAMS.forEach((key) => {
      const value = params.get(key);
      if (value) {
        current[key] = clip(value, 200);
        current.tracked = true;
      }
    });
    if (!current.tracked) Object.assign(current, fromReferrer());

    const stored = readStored();
    if (!stored || (current.tracked && (options.attribution === "last" || !stored.tracked))) {
      writeStored(current);
      return current;
    }
    return stored;
  }

  const tracking = capture();
  const currentTracking = () => readStored() || tracking;

  // ---------------------------------------------------------------------------
  // 3. Código de rastreio para o WhatsApp: "<fonte>-<página>", ex. gads-urgencia
  // ---------------------------------------------------------------------------

  /** gads = Google Ads · org = Google orgânico · gmn = Google Meu Negócio · ig = Instagram · site = direto */
  function refCode(data) {
    const t = data || currentTracking();
    const source = (t.utm_source || "").toLowerCase();
    const medium = (t.utm_medium || "").toLowerCase();
    const hints = [source, medium, (t.utm_campaign || "").toLowerCase()].join(" ");
    let code = "site";
    if (CLICK_PARAMS.some((key) => t[key]) || (/google|adwords/.test(source) && /cpc|ppc|paid/.test(medium))) code = "gads";
    else if (/\b(gmn|gmb|gbp)\b|business|meu.?negocio/.test(hints)) code = "gmn";
    else if (/insta|^ig$/.test(source)) code = "ig";
    else if (source === "google") code = "org";
    else if (source) code = slug(source).slice(0, 12) || "site";

    const segments = String(t.landing_page || "/").split("/").filter(Boolean);
    const page = slug(segments[segments.length - 1]).slice(0, 24) || "home";
    return code + "-" + page;
  }

  /** Acrescenta "[ref: ...]" ao parâmetro text de um link do WhatsApp (uma vez só). */
  function tagWhatsAppUrl(href, ref) {
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return href;
    }
    if (!WHATSAPP_LINK.test(url.href)) return href;
    const text = url.searchParams.get("text") || "";
    if (/\[ref: [^\]]+\]/.test(text)) return href;
    const tagged = (text ? text + " " : "") + "[ref: " + (ref || refCode()) + "]";
    // monta a query à mão: wa.me espera %20 (URLSearchParams usaria "+")
    const others = url.search
      .slice(1)
      .split("&")
      .filter((part) => part && !/^text=/i.test(part));
    others.push("text=" + encodeURIComponent(tagged));
    url.search = "?" + others.join("&");
    return url.href;
  }

  if (options.whatsappRef !== "off") {
    // captura: funciona também para links criados depois (menus, popups, botões flutuantes)
    document.addEventListener(
      "click",
      (event) => {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link) return;
        const tagged = tagWhatsAppUrl(link.href, link.getAttribute("data-idc-ref"));
        if (tagged !== link.href) link.href = tagged;
      },
      true,
    );
  }

  /** Link wa.me pronto, já com o código: IDCLeads.whatsappUrl("5577999998888", "Olá!") */
  function whatsappUrl(phone, message) {
    const digits = String(phone || "").replace(/\D/g, "");
    const base = "https://wa.me/" + digits + (message ? "?text=" + encodeURIComponent(message) : "");
    return options.whatsappRef === "off" ? base : tagWhatsAppUrl(base);
  }

  // ---------------------------------------------------------------------------
  // 2. Envio do lead ao CRM (modo público: sem segredo, origem autorizada)
  // ---------------------------------------------------------------------------

  /**
   * Envia { name, phone, service?, service_detail?, message?, website? } junto com a
   * origem guardada. Resolve sempre com { ok: true, id: null, duplicate_of: null }:
   * no modo público o CRM não informa o id nem se o telefone já estava cadastrado
   * (proteção LGPD). Rejeita com Error (mensagem em pt-BR do CRM, `status` e
   * `fields` com os erros por campo).
   * Formulário urlencoded = requisição "simples" (sem preflight CORS); keepalive
   * garante o envio mesmo se a página for trocada pelo WhatsApp logo em seguida.
   */
  function submit(lead) {
    const t = currentTracking();
    const input = lead || {};
    const fields = {
      name: input.name,
      phone: input.phone,
      service: input.service,
      service_detail: input.service_detail,
      message: input.message,
      website: input.website, // campo isca: deve chegar vazio
      source: input.source,
      url: t.url,
      landing_page: t.landing_page,
      utm_source: t.utm_source,
      utm_medium: t.utm_medium,
      utm_campaign: t.utm_campaign,
      utm_term: t.utm_term,
      utm_content: t.utm_content,
      gclid: t.gclid,
    };
    const body = new URLSearchParams();
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (value !== undefined && value !== null && value !== "") body.append(key, String(value));
    });

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

    return window
      .fetch(ENDPOINT, {
        method: "POST",
        body,
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        signal: controller ? controller.signal : undefined,
      })
      .then((response) =>
        response
          .json()
          .catch(() => ({}))
          .then((json) => {
            if (response.ok && json.ok) return json;
            const error = new Error(json.error || "Não foi possível enviar seus dados. Tente novamente.");
            error.status = response.status;
            error.fields = json.fields || [];
            throw error;
          }),
      )
      .finally(() => {
        if (timer) window.clearTimeout(timer);
      });
  }

  window.IDCLeads = {
    submit,
    whatsappUrl,
    refCode: () => refCode(),
    getTracking: () => Object.assign({}, currentTracking()),
  };
})();
