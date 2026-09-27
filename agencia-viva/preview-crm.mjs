// Prévia do CRM em um arquivo só, com dados de exemplo (sem Supabase):
//   cd crm && npx vite build --mode demo && cd .. && node preview-crm.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
const dir = 'crm/demo-dist', pub = 'crm/public'
const data = (f, tipo) => `data:${tipo};base64,${readFileSync(f).toString('base64')}`
const troca = s => s
  .replaceAll('/crm/archivo.woff2', data(`${pub}/archivo.woff2`, 'font/woff2'))
  .replaceAll('/crm/instrument-serif-italic.woff2', data(`${pub}/instrument-serif-italic.woff2`, 'font/woff2'))
  .replaceAll('/crm/logo-viva.png', data(`${pub}/logo-viva.png`, 'image/png'))
const assets = readdirSync(`${dir}/assets`)
const css = troca(readFileSync(`${dir}/assets/${assets.find(f => f.endsWith('.css'))}`, 'utf8'))
const js = troca(readFileSync(`${dir}/assets/${assets.find(f => f.endsWith('.js'))}`, 'utf8')).replaceAll('</script', '<\\/script')
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CRM Viva · demonstração</title>
<style>${css}
.demo-tag{position:fixed;left:50%;bottom:12px;translate:-50% 0;z-index:9999;background:#ffd84d;color:#0b0b0b;font:700 12px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:9px 14px;border-radius:99px;box-shadow:0 4px 14px rgba(0,0,0,.2);pointer-events:none;white-space:nowrap}</style></head>
<body><div id="root"></div><div class="demo-tag">Demonstração · dados de exemplo, nada é salvo</div>
<script type="module">${js}</script></body></html>`
mkdirSync('preview', { recursive: true })
writeFileSync('preview/previa-crm-viva.html', html)
console.log(`✓ prévia do CRM: preview/previa-crm-viva.html (${Math.round(html.length / 1024)} KB)`)
