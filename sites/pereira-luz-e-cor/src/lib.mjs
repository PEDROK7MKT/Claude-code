// Helpers compartilhados pelo gerador.
import site from '../site.config.mjs'

export { site }

/** Escapa texto para HTML. */
export const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Remove tags HTML (para meta, JSON-LD e llms.txt). */
export const stripTags = (html = '') =>
  String(html)
    .replace(/<\/(p|li|h\d|tr|div)>/gi, '$&\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()

/** Normaliza para busca/slug: minúsculas, sem acento. */
export const normalize = (s = '') =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export const slugify = (s = '') =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** URL absoluta a partir de um caminho do site ("/tintas-e-pintura/"). */
export const abs = (path = '/') => site.url.replace(/\/$/, '') + path

/** Link do WhatsApp com mensagem pré-preenchida. */
export const wa = (text = `Olá, ${site.name}! Vim pelo site e gostaria de um orçamento.`) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`

export const addressLine = () => {
  const a = site.address
  return `${a.street} – ${a.neighborhood}, ${a.city} – ${a.state}${a.postalCode ? `, ${a.postalCode}` : ''}`
}

export const mapsQuery = () => {
  const a = site.address
  return `${site.name}, ${a.street}, ${a.neighborhood}, ${a.city} - ${a.state}`
}

/** Link "Como chegar" (rota no Google Maps). */
export const directionsUrl = () =>
  site.googleMapsUrl ||
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery())}`

/** Iframe do mapa (sem API key). */
export const mapEmbedUrl = () =>
  `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery())}&z=16&output=embed`

const DAY_ORDER = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']
const DAY_PT = { mo: 'Segunda', tu: 'Terça', we: 'Quarta', th: 'Quinta', fr: 'Sexta', sa: 'Sábado', su: 'Domingo' }
const DAY_SCHEMA = {
  mo: 'Monday', tu: 'Tuesday', we: 'Wednesday', th: 'Thursday', fr: 'Friday', sa: 'Saturday', su: 'Sunday',
}
export const fmtTime = (t) => {
  const [h, m] = t.split(':')
  return m === '00' ? `${+h}h` : `${+h}h${m}`
}

/** Linhas legíveis do horário: [{label:'Segunda a sexta', value:'7h30 às 18h'}]. */
export const hoursRows = () => {
  const rows = site.hours.map((h) => {
    const ds = [...h.days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    const contiguous = ds.every((d, i) => i === 0 || DAY_ORDER.indexOf(d) === DAY_ORDER.indexOf(ds[i - 1]) + 1)
    const label =
      ds.length === 1
        ? DAY_PT[ds[0]]
        : contiguous
          ? `${DAY_PT[ds[0]]} a ${DAY_PT[ds[ds.length - 1]].toLowerCase()}`
          : ds.map((d) => DAY_PT[d]).join(', ')
    return { label, value: `${fmtTime(h.opens)} às ${fmtTime(h.closes)}` }
  })
  const open = new Set(site.hours.flatMap((h) => h.days))
  const closed = DAY_ORDER.filter((d) => !open.has(d))
  if (closed.length) rows.push({ label: closed.map((d) => DAY_PT[d]).join(', '), value: 'Fechado' })
  return rows
}

export const hoursText = () => hoursRows().map((r) => `${r.label}: ${r.value}`).join(' · ')

export const openingHoursSpecification = () =>
  site.hours.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days.map((d) => DAY_SCHEMA[d]),
    opens: h.opens,
    closes: h.closes,
  }))

/** Formato curto "Mo-Fr 07:30-18:00" (llms.txt). */
export const openingHoursShort = () =>
  site.hours
    .map((h) => {
      const d = h.days.map((x) => x[0].toUpperCase() + x[1])
      return `${d.length > 2 ? `${d[0]}-${d[d.length - 1]}` : d.join(',')} ${h.opens}-${h.closes}`
    })
    .join('; ')

export const fmtDatePt = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${d} de ${meses[m - 1]} de ${y}`
}

export const sameAs = () => Object.values(site.social).filter(Boolean)

/** Junta classes ignorando falsy. */
export const cx = (...a) => a.filter(Boolean).join(' ')
