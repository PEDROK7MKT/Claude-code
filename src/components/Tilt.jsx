import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const COARSE =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

// Tilt 3D com glare que segue o ponteiro — desligado em telas de toque.
export default function Tilt({ children, max = 7, className = '' }) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 280, damping: 28, mass: 0.7 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)
  const gx = useTransform(px, (v) => `${v * 100}%`)
  const gy = useTransform(py, (v) => `${v * 100}%`)

  if (COARSE) return <div className={`tilt ${className}`}>{children}</div>

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  function onLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      className={`tilt ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      <motion.span className="tilt-glare" style={{ '--gx': gx, '--gy': gy }} aria-hidden="true" />
    </motion.div>
  )
}
