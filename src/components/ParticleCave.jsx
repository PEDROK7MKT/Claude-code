import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from 'three'

// Poeira da caverna em WebGL: partículas ciano com profundidade real,
// deriva lenta e parallax ao ponteiro. Pausa quando a aba fica oculta.
export default function ParticleCave() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    let renderer
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      })
    } catch {
      return // sem WebGL: o fundo CSS continua carregando o clima
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

    const scene = new Scene()
    const camera = new PerspectiveCamera(60, 1, 0.1, 120)
    camera.position.z = 32

    const isMobile = window.matchMedia('(max-width: 760px)').matches
    const N = isMobile ? 220 : 560
    const pos = new Float32Array(N * 3)
    const speed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90
      pos[i * 3 + 1] = (Math.random() - 0.5) * 52
      pos[i * 3 + 2] = (Math.random() - 0.5) * 44
      speed[i] = 0.25 + Math.random() * 0.9
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    const mat = new PointsMaterial({
      color: 0x00d4ff,
      size: 0.16,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const points = new Points(geo, mat)
    scene.add(points)

    let tx = 0
    let ty = 0
    let mx = 0
    let my = 0
    const onMove = (e) => {
      tx = e.clientX / window.innerWidth - 0.5
      ty = e.clientY / window.innerHeight - 0.5
    }
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', resize)

    let raf
    let running = true
    let t0 = performance.now()
    const loop = (t) => {
      if (!running) return
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (t - t0) / 1000)
      t0 = t
      const arr = geo.attributes.position.array
      for (let i = 0; i < N; i++) {
        arr[i * 3 + 1] += speed[i] * dt * 0.9
        if (arr[i * 3 + 1] > 27) arr[i * 3 + 1] = -27
      }
      geo.attributes.position.needsUpdate = true
      mx += (tx - mx) * 0.035
      my += (ty - my) * 0.035
      points.rotation.y = mx * 0.4
      points.rotation.x = my * 0.22
      renderer.render(scene, camera)
    }
    const onVis = () => {
      const active = !document.hidden
      if (active && !running) {
        running = true
        t0 = performance.now()
        raf = requestAnimationFrame(loop)
      } else if (!active) {
        running = false
        cancelAnimationFrame(raf)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={ref} className="particle-cave" aria-hidden="true" />
}
