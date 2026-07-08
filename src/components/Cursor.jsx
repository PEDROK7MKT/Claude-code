import { useEffect, useRef, useState } from 'react'

// Cursor HUD de alto desempenho:
// - escreve transform: translate3d() direto no DOM (um único rAF)
// - zero setState / re-render do React durante o movimento
// - glow do ponto via radial-gradient (nenhuma sombra animada)
// - estado "hot" vira classe CSS trocada via classList
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    document.documentElement.classList.add('cursor-fx')

    let tx = -100
    let ty = -100
    let rx = -100
    let ry = -100
    let scale = 1
    let targetScale = 1
    let hot = false
    let raf = 0

    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      // o ponto cola no ponteiro sem esperar o próximo frame do loop
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
    }

    const over = (e) => {
      const h = Boolean(
        e.target.closest(
          'button, a, select, input, textarea, [role="radio"], .kcard, .package, .goal',
        ),
      )
      if (h !== hot) {
        hot = h
        targetScale = h ? 1.7 : 1
        ring.classList.toggle('cursor-hot', h)
      }
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const dx = tx - rx
      const dy = ty - ry
      const ds = targetScale - scale
      // anel já assentado: pula a escrita de estilo neste frame
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(ds) < 0.002) return
      rx += dx * 0.16
      ry += dy * 0.16
      scale += ds * 0.18
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale.toFixed(3)})`
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      document.documentElement.classList.remove('cursor-fx')
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
