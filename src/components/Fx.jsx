import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { BatEmblem } from '../icons.jsx'

// Efeitos de "vida" do HUD: contadores animados, boot, relógio e ticker.
// Tudo em transform/opacity ou texto — barato de renderizar no celular.

// Contador animado sem re-render: escreve o texto direto no DOM via rAF.
export function CountUp({ value, format, duration = 900 }) {
  const ref = useRef(null)
  const prev = useRef(0)
  const fmtRef = useRef(format)
  fmtRef.current = format

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fmt = (x) => (fmtRef.current ? fmtRef.current(x) : Math.round(x).toString())
    const from = prev.current
    prev.current = value
    if (from === value) {
      el.textContent = fmt(value)
      return
    }
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = fmt(from + (value - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span ref={ref} />
}

const BOOT_LINES = [
  'NÚCLEO DO BATCOMPUTADOR… ONLINE',
  'MÓDULOS DE PROSPECÇÃO… CARREGADOS',
  'COFRE E ARQUIVO… SINCRONIZADOS',
  'HUD CALIBRADO — BEM-VINDO, OPERADOR',
]

export function BootScreen({ onDone }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, BOOT_LINES.length - 1)), 340)
    const end = setTimeout(onDone, 2000)
    return () => {
      clearInterval(iv)
      clearTimeout(end)
    }
  }, [onDone])
  return (
    <div className="boot" onClick={onDone} role="status" aria-label="Inicializando">
      <div className="boot-emblem">
        <BatEmblem size={88} />
      </div>
      <div className="boot-lines">
        {BOOT_LINES.slice(0, step + 1).map((l) => (
          <span key={l}>&gt; {l}</span>
        ))}
      </div>
      <div className="boot-bar">
        <div className="boot-fill" />
      </div>
      <small>toque para pular</small>
    </div>
  )
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  return (
    <span className="clock" aria-hidden="true">
      {now.toLocaleTimeString('pt-BR')}
      <i className="clock-cursor">_</i>
    </span>
  )
}

export function StatusTicker({ messages }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setI((x) => x + 1), 3600)
    return () => clearInterval(iv)
  }, [])
  const msg = messages[i % messages.length]
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-dot" />
      <span key={msg} className="ticker-msg">
        {msg}
      </span>
    </div>
  )
}

/* Moldura HUD fixa nas bordas da tela (decorativa, some no mobile) */
export function HudFrame() {
  return <div className="hud-frame" aria-hidden="true" />
}

/* Botão magnético: desliza levemente na direção do ponteiro (mola) */
export function MagneticButton({ children, strength = 0.32, ...props }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 380, damping: 22, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 380, damping: 22, mass: 0.5 })
  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * strength)
    y.set((e.clientY - r.top - r.height / 2) * strength)
  }
  function reset() {
    x.set(0)
    y.set(0)
  }
  return (
    <motion.button style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset} {...props}>
      {children}
    </motion.button>
  )
}

/* Explosão de partículas ciano — feedback de meta batida */
export function Burst() {
  const parts = Array.from({ length: 14 })
  return (
    <span className="burst" aria-hidden="true">
      {parts.map((_, i) => {
        const angle = (i / parts.length) * Math.PI * 2
        const dist = 48 + (i % 3) * 18
        return (
          <motion.i
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.15,
            }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          />
        )
      })}
      <motion.b
        initial={{ scale: 0.25, opacity: 0.9 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      />
    </span>
  )
}
