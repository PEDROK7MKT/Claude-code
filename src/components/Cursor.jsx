import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// Cursor HUD: ponto ciano cravado no ponteiro + anel com física de mola
// que cresce sobre elementos interativos. Só em telas com mouse.
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [hot, setHot] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 320, damping: 26, mass: 0.6 })
  const ry = useSpring(y, { stiffness: 320, damping: 26, mass: 0.6 })

  useEffect(() => {
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    setEnabled(true)
    document.documentElement.classList.add('cursor-fx')
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e) =>
      setHot(
        Boolean(
          e.target.closest(
            'button, a, select, input, textarea, [role="radio"], .kcard, .package, .goal',
          ),
        ),
      )
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    return () => {
      document.documentElement.classList.remove('cursor-fx')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
    }
  }, [x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} aria-hidden="true" />
      <motion.div
        className={`cursor-ring ${hot ? 'cursor-hot' : ''}`}
        style={{ x: rx, y: ry }}
        aria-hidden="true"
      />
    </>
  )
}
