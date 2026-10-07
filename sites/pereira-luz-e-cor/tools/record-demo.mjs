// Grava um vídeo de demonstração do site (desktop e celular) com cursor visível.
// Uso: node tools/record-demo.mjs [baseUrl] [saida]
//   baseUrl padrão: http://localhost:4173   saída padrão: ./demo
// Gera demo/pereira-desktop.mp4 e demo/pereira-celular.mp4 (requer Playwright + ffmpeg).
import { mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const { chromium, devices } = pw

const BASE = process.argv[2] || 'http://localhost:4173'
const OUT = resolve(process.argv[3] || 'demo')
mkdirSync(OUT, { recursive: true })

// Cursor falso (o headless não desenha o ponteiro no vídeo)
const CURSOR = `
(() => {
  const add = () => {
    if (document.getElementById('__cur')) return
    const c = document.createElement('div'); c.id = '__cur'
    c.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #FFD100;background:rgba(255,209,0,.18);box-shadow:0 0 18px rgba(255,209,0,.6);z-index:2147483647;pointer-events:none;transition:transform .12s,background .12s;transform:translate(-100px,-100px)'
    document.documentElement.appendChild(c)
    let x = -100, y = -100, s = 1
    const paint = () => { c.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')' }
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; paint() }, true)
    addEventListener('mousedown', () => { s = .7; c.style.background = 'rgba(255,209,0,.6)'; paint() }, true)
    addEventListener('mouseup', () => { s = 1; c.style.background = 'rgba(255,209,0,.18)'; paint() }, true)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add()
})()`

const wait = (p, ms) => p.waitForTimeout(ms)

// rolagem suave "de cinema" até um seletor ou posição
async function glide(p, target, ms = 1600, offset = 90) {
  await p.evaluate(async ({ target, ms, offset }) => {
    const el = typeof target === 'string' ? document.querySelector(target) : null
    const to = el ? el.getBoundingClientRect().top + scrollY - offset : target
    const from = scrollY, t0 = performance.now()
    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    await new Promise((res) => {
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms)
        window.scrollTo({ top: from + (to - from) * ease(k), behavior: 'instant' })
        k < 1 ? requestAnimationFrame(step) : res()
      }
      requestAnimationFrame(step)
    })
  }, { target, ms, offset })
}

async function moveTo(p, sel, steps = 28) {
  const el = await p.$(sel)
  if (!el) return null
  const b = await el.boundingBox()
  if (!b) return null
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps })
  return b
}
async function clickSel(p, sel, pause = 500) {
  const b = await moveTo(p, sel)
  if (!b) return
  await wait(p, 250)
  await p.mouse.down(); await wait(p, 90); await p.mouse.up()
  await wait(p, pause)
}
async function typeSlow(p, sel, text, delay = 85) {
  await p.focus(sel)
  await p.$eval(sel, (e) => { e.value = '' })
  await p.type(sel, text, { delay })
}

async function record(name, contextOpts, scenario) {
  const dir = join(OUT, `.tmp-${name}`)
  rmSync(dir, { recursive: true, force: true })
  const browser = await chromium.launch()
  const { videoSize, ...opts } = contextOpts
  const ctx = await browser.newContext({ ...opts, recordVideo: { dir, size: videoSize || opts.viewport } })
  await ctx.addInitScript(CURSOR)
  await ctx.addInitScript(() => { try { localStorage.clear() } catch {} })
  const p = await ctx.newPage()
  p.on('popup', (pop) => pop.close().catch(() => {}))
  await ctx.route(/wa\.me|whatsapp|google\.com\/maps/, (r) => r.abort())
  await scenario(p)
  await ctx.close()
  await browser.close()
  const webm = readdirSync(dir).find((f) => f.endsWith('.webm'))
  const raw = join(OUT, `pereira-${name}.webm`)
  renameSync(join(dir, webm), raw)
  rmSync(dir, { recursive: true, force: true })
  const mp4 = join(OUT, `pereira-${name}.mp4`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', mp4])
  rmSync(raw)
  console.log('✔', mp4)
}

// ------------------------------------------------------------- desktop
await record('desktop', { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 }, async (p) => {
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await p.mouse.move(300, 400)
  await wait(p, 2600) // animação do hero
  // luz seguindo o cursor
  for (const [x, y] of [[900, 300], [1150, 420], [1000, 600], [820, 380]]) { await p.mouse.move(x, y, { steps: 30 }); await wait(p, 200) }
  await clickSel(p, '.float--2', 1400) // adiciona tinta à lista
  await glide(p, '#produtos', 1800)
  await wait(p, 900)
  await moveTo(p, '.ccard:nth-child(1)'); await wait(p, 900)
  await moveTo(p, '.ccard:nth-child(3)'); await wait(p, 900)
  await moveTo(p, '.ccard:nth-child(6)'); await wait(p, 700)
  await glide(p, '.steps', 1800, 40)
  await wait(p, 3200) // conversa do WhatsApp aparecendo
  await glide(p, '.paint', 1800, 30)
  await wait(p, 800)
  await typeSlow(p, '.paint [name=largura]', '4', 150)
  await wait(p, 400)
  await typeSlow(p, '.paint [name=comprimento]', '5', 150)
  await wait(p, 500)
  await clickSel(p, '.paint [name=teto]', 900)
  await clickSel(p, '.paint [data-calc-add]', 1500)
  await glide(p, '.pros', 1600, 40); await wait(p, 900)
  await glide(p, '.store', 1800, 40); await wait(p, 1800)
  await glide(p, '.faq-home', 1800, 40); await wait(p, 600)
  await clickSel(p, '.faq-home .faq__item:nth-child(3) summary', 1400)
  // busca
  await glide(p, 0, 1400)
  await clickSel(p, '[data-search-open]', 700)
  await p.type('[data-search-input]', 'disjuntor', { delay: 110 })
  await wait(p, 1200)
  await clickSel(p, '.sres:nth-of-type(2) .sres__add', 900)
  await clickSel(p, '.sres:nth-of-type(3) .sres__add', 900)
  await p.keyboard.press('Escape'); await wait(p, 500)
  // lista de orçamento
  await clickSel(p, '.hdr [data-list-open]', 1200)
  await clickSel(p, '.qitem:nth-child(1) [data-q="1"]', 500)
  await clickSel(p, '.qitem:nth-child(1) [data-q="1"]', 700)
  await typeSlow(p, '[data-list-note]', 'Tinta branco neve, disjuntor curva C', 45)
  await wait(p, 600)
  await moveTo(p, '[data-list-send]'); await wait(p, 1600)
  await p.keyboard.press('Escape'); await wait(p, 500)
  // categoria pelo mega menu
  await moveTo(p, '[data-mega-toggle]'); await wait(p, 1300)
  await moveTo(p, '.mega__item:nth-child(1)'); await wait(p, 500)
  await clickSel(p, '.mega__item:nth-child(1)', 300)
  await p.waitForLoadState('networkidle'); await wait(p, 1500)
  await glide(p, '#itens', 1800, 130); await wait(p, 700)
  await clickSel(p, '.group:nth-child(1) .chip:nth-child(2)', 700)
  await clickSel(p, '.group:nth-child(1) .chip:nth-child(4)', 900)
  await glide(p, '.tips', 2000, 40); await wait(p, 1500)
  // guia
  await p.goto(BASE + '/guias/qual-fio-usar-no-chuveiro-eletrico/', { waitUntil: 'networkidle' })
  await wait(p, 1800)
  await glide(p, '.answer', 1400, 120); await wait(p, 2200)
  await glide(p, '.prose table', 2000, 160); await wait(p, 2500)
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await wait(p, 2500)
})

// ------------------------------------------------------------- celular
await record('celular', { ...devices['iPhone 13'], deviceScaleFactor: 2, viewport: { width: 390, height: 844 }, videoSize: { width: 780, height: 1688 } }, async (p) => {
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await wait(p, 3000)
  await glide(p, '.hero__art', 1500, 120); await wait(p, 1200)
  await p.tap('.float--3').catch(() => {}); await wait(p, 1400)
  await glide(p, '#produtos', 1800); await wait(p, 900)
  await glide(p, '.ccard:nth-child(3)', 2000, 120); await wait(p, 700)
  await glide(p, '.steps .phone', 1800, 60); await wait(p, 3000)
  await glide(p, '.paint .calc', 1800, 70); await wait(p, 1800)
  await glide(p, '.store__photo', 1800, 90); await wait(p, 1500)
  await glide(p, 0, 1600)
  await p.tap('[data-menu-open]'); await wait(p, 1800)
  await p.tap('.mnav__cats a:nth-child(3)'); await p.waitForLoadState('networkidle'); await wait(p, 1500)
  await glide(p, '#itens', 1600, 130); await wait(p, 600)
  await p.tap('.group:nth-child(1) .chip:nth-child(1)').catch(() => {}); await wait(p, 900)
  await p.tap('.group:nth-child(2) .chip:nth-child(2)').catch(() => {}); await wait(p, 1100)
  await p.tap('.fab-list').catch(() => {}); await wait(p, 2600)
  await p.keyboard.press('Escape'); await wait(p, 800)
})
