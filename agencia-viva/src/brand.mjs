// Logos das plataformas (cores originais), usados pelo site (build.mjs) e pelo vídeo (video/)
import BP from './brand-paths.mjs'

export const brandSvg = {
  instagram: () => { const id = 'g-ig'; return `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="url(#${id})"/><path transform="translate(4.6 4.6) scale(.617)" fill="#fff" d="${BP.instagram}"/></svg>` },
  facebook: () => `<svg viewBox="-1 -1 26 26"><path fill="#0866ff" d="${BP.facebook}"/></svg>`,
  tiktok: () => `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><g transform="translate(5 4.6) scale(.6)"><path fill="#25f4ee" transform="translate(-1 -1)" d="${BP.tiktok}"/><path fill="#fe2c55" transform="translate(1 1)" d="${BP.tiktok}"/><path fill="#fff" d="${BP.tiktok}"/></g></svg>`,
  meta: () => { const id = 'g-meta'; return `<svg viewBox="-1.5 -1.5 27 27"><path fill="url(#${id})" d="${BP.meta}"/></svg>` },
  googleads: () => '<svg viewBox="0 0 24 24"><path d="M4.4 18.6L11 6" stroke="#fbbc04" stroke-width="6.4" stroke-linecap="round"/><path d="M11 6l7.4 12.6" stroke="#4285f4" stroke-width="6.4" stroke-linecap="round"/><circle cx="4.4" cy="18.6" r="3.3" fill="#34a853"/></svg>',
  google: () => '<svg viewBox="0 0 24 24"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#fbbc05" d="M6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2z"/><path fill="#ea4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"/></svg>',
  googlemaps: () => {
    const segs = BP.googlemaps.split(/(?=M)/)
    const col = ['#34a853', '#fbbc04', '#ea4335', '#4285f4', '#ea4335']
    return `<svg viewBox="-2 -1 28 26">${segs.map((d, i) => `<path fill="${col[i] || '#4285f4'}" d="${d}"/>`).join('')}</svg>`
  },
  whatsapp: () => `<svg viewBox="-1 -1 26 26"><path fill="#25d366" d="${BP.whatsapp}"/></svg>`,
  youtube: () => `<svg viewBox="-1 -1 26 26"><path fill="#ff0000" d="${BP.youtube}"/></svg>`,
}
// degradês dos logos: definidos uma vez por página (SVG invisível, mas não display:none, senão o Chrome ignora)
export const brandDefs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><radialGradient id="g-ig" cx="28%" cy="108%" r="140%"><stop offset="0" stop-color="#fdf497"/><stop offset=".08" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".62" stop-color="#d6249f"/><stop offset=".92" stop-color="#285aeb"/></radialGradient><linearGradient id="g-meta" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#0064e1"/><stop offset=".6" stop-color="#0082fb"/><stop offset="1" stop-color="#0082fb"/></linearGradient></defs></svg>'
export const brandName = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', meta: 'Meta Ads', googleads: 'Google Ads', google: 'Google', googlemaps: 'Google Maps', whatsapp: 'WhatsApp', youtube: 'YouTube' }
export const pad = new Set(['googleads', 'google', 'googlemaps', 'whatsapp', 'youtube', 'meta', 'facebook'])
