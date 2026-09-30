// Renderiza o Reels da Viva quadro a quadro (1080x1920, 30 fps) e monta o MP4 com trilha e efeitos.
//   node render.mjs                    → out/viva-reel.mp4 (+ versão só com efeitos, pra usar música do Instagram)
//   node render.mjs --de 10 --ate 20   → só um trecho (pra revisar rápido)
//   node render.mjs --folha            → também gera folhas de contato (1 quadro a cada 0,5 s) em out/folhas
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { cpus } from 'node:os'

const aqui = dirname(fileURLToPath(import.meta.url))
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1] }
const tem = n => process.argv.includes('--' + n)
const FPS = 30, W = 1080, H = 1920
const FFMPEG = process.env.FFMPEG || (existsSync('/root/bin/ffmpeg') ? '/root/bin/ffmpeg' : 'ffmpeg')
const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs'
const { chromium } = await import(PW)

execFileSync('node', [join(aqui, 'build-reel.mjs')], { stdio: 'inherit' })
const out = join(aqui, 'out'), tmp = arg('tmp', join(out, 'quadros'))
mkdirSync(out, { recursive: true }); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true })

const browser = await chromium.launch()
const abrir = async () => {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  p.on('pageerror', e => { console.error('erro na página:', e); process.exitCode = 1 })
  await p.goto(pathToFileURL(join(aqui, 'reel.html')).href)
  await p.evaluate(() => document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.decode().catch(() => {})))))
  await p.waitForFunction(() => window.REEL && window.REEL.pronto)
  return p
}
const p0 = await abrir()
const info = await p0.evaluate(() => ({ dur: window.REEL.dur, musica: window.REEL.musica, cues: window.REEL.cues }))

// locução (ElevenLabs) em video/voz/: acelera um pouco (--tempo, padrão 1.1), acha cada frase e faz o vídeo seguir a voz.
// Cada cena é esticada/encolhida pra começar logo antes da sua frase (alinhar.py → alinhamento.json).
const vozDir = join(aqui, 'voz'), vozArq = !tem('sem-voz') && existsSync(vozDir) && readdirSync(vozDir).find(f => /\.(mp3|wav|m4a)$/i.test(f))
let alin = null
if (vozArq) {
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', join(vozDir, vozArq), '-af', `atempo=${arg('tempo', '1.1')}`, '-ac', '1', '-ar', '48000', '-sample_fmt', 's16', join(out, 'voz.wav')])
  execFileSync('python3', [join(aqui, 'alinhar.py'), join(out, 'voz.wav'), join(aqui, 'cenas.json'), join(out, 'alinhamento.json')], { stdio: 'inherit' })
  alin = JSON.parse(readFileSync(join(out, 'alinhamento.json'), 'utf8'))
  console.log(`locução: ${vozArq}`)
}
// mapa de tempo: original (roteiro) ↔ novo (vídeo final), linear dentro de cada cena
const nos = alin ? [...alin.cenas.map(c => [c.a, c.A]), [alin.cenas.at(-1).b, alin.cenas.at(-1).B]] : [[0, 0], [info.dur, info.dur]]
const interp = (x, xs, ys) => { if (x <= xs[0]) return ys[0] + (x - xs[0]); for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (x - xs[i - 1]) * (ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]); return ys.at(-1) + (x - xs.at(-1)) }
const paraNovo = t => interp(t, nos.map(n => n[0]), nos.map(n => n[1]))
const paraOrig = T => interp(T, nos.map(n => n[1]), nos.map(n => n[0]))
if (alin) {
  info.cues = info.cues.map(c => ({ ...c, t: +paraNovo(c.t).toFixed(3) }))
  const m = info.musica
  info.musica = { ...m, drop: paraNovo(m.drop), fim: paraNovo(m.fim), calmo: (m.calmo || []).map(([a, b]) => [paraNovo(a), paraNovo(b)]) }
  info.dur = alin.dur
}
const de = +arg('de', 0), ate = Math.min(+arg('ate', info.dur), info.dur)
const f0 = Math.round(de * FPS), f1 = Math.round(ate * FPS)
console.log(`duração ${info.dur.toFixed(2)} s · quadros ${f0}–${f1 - 1} · ${info.cues.length} efeitos sonoros`)

// quadros em paralelo (cada aba pega quadros intercalados)
const N = Math.max(1, Math.min(+arg('abas', Math.max(1, cpus().length - 1)), 6))
const abas = [p0, ...(await Promise.all(Array.from({ length: N - 1 }, abrir)))]
let feitos = 0
const t0 = Date.now()
await Promise.all(abas.map(async (p, k) => {
  for (let f = f0 + k; f < f1; f += N) {
    await p.evaluate(t => { window.REEL.seek(t) }, paraOrig(f / FPS))
    await p.screenshot({ path: join(tmp, `${String(f - f0).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 })
    if (++feitos % 150 === 0) console.log(`  ${feitos}/${f1 - f0} quadros (${((Date.now() - t0) / 1000).toFixed(0)} s)`)
  }
}))
await browser.close()

// áudio: mesma lista de efeitos, com e sem música
const cfg = { dur: info.dur, ...info.musica, cues: info.cues.filter(c => c.t >= de && c.t < ate).map(c => ({ ...c, t: c.t - de })) }
if (cfg.drop != null) cfg.drop -= de
if (cfg.fim != null) cfg.fim -= de
cfg.calmo = (cfg.calmo || []).map(([a, b]) => [a - de, b - de])
cfg.dur = ate - de
writeFileSync(join(out, 'cues.json'), JSON.stringify(cfg, null, 1))
const nome = arg('nome', de === 0 && ate === info.dur ? 'viva-reel' : `trecho-${de}-${ate}`)
const extraVoz = []
if (alin && de === 0) {
  writeFileSync(join(out, 'pedacos.json'), JSON.stringify(alin.cenas.map(c => ({ s: c.voz[0], e: c.voz[1], t: c.t }))))
  extraVoz.push('--voz', join(out, 'voz.wav'), '--pedacos', join(out, 'pedacos.json'))
}
execFileSync('python3', [join(aqui, 'audio.py'), join(out, 'cues.json'), join(out, 'audio.wav'), ...extraVoz], { stdio: 'inherit' })
execFileSync('python3', [join(aqui, 'audio.py'), join(out, 'cues.json'), join(out, 'audio-fx.wav'), '--sem-musica', ...extraVoz], { stdio: 'inherit' })

const video = (wav, arq) => execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, '%05d.jpg'), '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', join(out, arq)], { stdio: 'inherit' })
video(join(out, 'audio.wav'), `${nome}.mp4`)
if (!tem('so-principal')) video(join(out, 'audio-fx.wav'), `${nome}-so-efeitos.mp4`)

if (tem('folha')) {
  // folhas de contato: 1 quadro a cada 0,5 s, 6x4 por folha (12 s por folha), com o tempo escrito
  const fdir = join(out, 'folhas'); rmSync(fdir, { recursive: true, force: true }); mkdirSync(fdir, { recursive: true })
  const passo = +arg('passo', 0.5), porFolha = 24
  const lista = []
  for (let t = de; t < ate - 1e-6; t += passo) lista.push(t)
  const b2 = await chromium.launch()
  const pg = await b2.newPage({ viewport: { width: 6 * 274 + 4, height: 4 * 510 + 4 } })
  for (let i = 0; i < lista.length; i += porFolha) {
    const tiles = lista.slice(i, i + porFolha).map(t => { const f = Math.min(f1 - 1, Math.round(t * FPS)) - f0
      // --zona: pinta de vermelho o que a interface do Reels cobre (topo, legenda embaixo, botões à direita)
      const zona = tem('zona') ? '<i style="left:0;right:0;top:0;height:57px"></i><i style="left:0;right:0;top:370px;bottom:0"></i><i style="left:235px;right:0;top:57px;height:313px"></i>' : ''
      return `<figure><img src="${pathToFileURL(join(tmp, String(f).padStart(5, '0') + '.jpg')).href}">${zona}<figcaption>${t.toFixed(1)}s</figcaption></figure>` }).join('')
    const fh = join(tmp, `folha-${i}.html`)
    writeFileSync(fh, `<style>body{margin:0;background:#777;display:grid;align-content:start;grid-template-columns:repeat(6,270px);gap:4px;padding:4px}figure{margin:0;position:relative}img{width:270px;height:480px;display:block}figcaption{position:absolute;left:4px;top:4px;background:#d00;color:#fff;font:700 18px sans-serif;padding:2px 6px}figure i{position:absolute;background:rgba(255,0,0,.22)}</style>${tiles}`)
    await pg.goto(pathToFileURL(fh).href)
    await pg.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))))
    await pg.screenshot({ path: join(fdir, `folha-${String(i / porFolha + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 80, fullPage: true })
  }
  await b2.close()
  console.log(`✓ folhas: ${readdirSync(fdir).length} em ${fdir}`)
}
if (!tem('manter-quadros')) rmSync(tmp, { recursive: true, force: true })
console.log(`✓ ${join(out, nome + '.mp4')} em ${((Date.now() - t0) / 1000).toFixed(0)} s`)
