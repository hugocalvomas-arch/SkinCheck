'use client'
import { useEffect, useRef } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'

// Malla facial en vivo sobre la cámara. Todo se calcula en el iPad (MediaPipe, modelo y wasm servidos
// desde /public/mediapipe): no sale ninguna imagen del dispositivo para dibujar esto.

export type EstadoCara = 'buscando' | 'lejos' | 'descentrada' | 'lista'

let cargador: Promise<{ fl: FaceLandmarker; mod: typeof import('@mediapipe/tasks-vision') }> | null = null
function cargar() {
  if (!cargador) {
    cargador = (async () => {
      const mod = await import('@mediapipe/tasks-vision')
      const fileset = await mod.FilesetResolver.forVisionTasks('/mediapipe/wasm')
      const crear = (delegate: 'GPU' | 'CPU') => mod.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task', delegate },
        runningMode: 'VIDEO', numFaces: 1,
      })
      const fl = await crear('GPU').catch(() => crear('CPU'))
      return { fl, mod }
    })()
    cargador.catch(() => { cargador = null })
  }
  return cargador
}

// Zonas que se marcan con anillos (índices de la malla de 478 puntos)
const ZONAS: [number, string][] = [[151, 'Frente'], [205, 'Mejilla'], [425, 'Mejilla'], [4, 'Nariz'], [200, 'Mentón']]
const MENTA = '127,214,194'

export function MallaFacial({ video, onEstado }: { video: React.RefObject<HTMLVideoElement | null>; onEstado?: (e: EstadoCara) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const avisar = useRef(onEstado)
  useEffect(() => { avisar.current = onEstado }, [onEstado])

  useEffect(() => {
    let vivo = true
    let raf = 0
    let ultimo = -1
    let estado: EstadoCara | null = null
    let opacidad = 0
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const fijar = (e: EstadoCara) => { if (e !== estado) { estado = e; avisar.current?.(e) } }

    cargar().then(({ fl, mod }) => {
      const T = mod.FaceLandmarker
      const bucle = () => {
        if (!vivo) return
        raf = requestAnimationFrame(bucle)
        const v = video.current, c = lienzo.current
        if (!v || !c || v.readyState < 2 || !v.videoWidth) return
        const W = c.clientWidth, H = c.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1)
        if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
        const ctx = c.getContext('2d')!
        let puntos: NormalizedLandmark[] | undefined
        if (v.currentTime !== ultimo) {
          ultimo = v.currentTime
          try { puntos = fl.detectForVideo(v, performance.now()).faceLandmarks[0] } catch { return }
        } else return

        // De coordenadas del vídeo a la caja visible (object-cover) y en espejo
        const s = Math.max(W / v.videoWidth, H / v.videoHeight)
        const ox = (W - v.videoWidth * s) / 2, oy = (H - v.videoHeight * s) / 2
        const P = (p: NormalizedLandmark) => [W - (p.x * v.videoWidth * s + ox), p.y * v.videoHeight * s + oy] as const

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        if (!puntos) { opacidad = Math.max(0, opacidad - 0.1); fijar('buscando'); return }
        opacidad = Math.min(1, opacidad + 0.08)

        const xs = puntos.map((p) => P(p)[0]), ys = puntos.map((p) => P(p)[1])
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
        const ancho = x1 - x0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
        fijar(ancho < W * 0.38 ? 'lejos' : Math.abs(cx - W / 2) > W * 0.15 || Math.abs(cy - H * 0.48) > H * 0.15 ? 'descentrada' : 'lista')
        const t = performance.now() / 1000
        ctx.globalAlpha = opacidad

        const lineas = (con: { start: number; end: number }[], color: string, w: number) => {
          ctx.beginPath()
          for (const { start, end } of con) { const a = P(puntos![start]), b = P(puntos![end]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]) }
          ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke()
        }

        // Malla fina y contornos
        lineas(T.FACE_LANDMARKS_TESSELATION, 'rgba(255,255,255,.16)', 0.6)
        ctx.shadowColor = `rgba(${MENTA},.9)`; ctx.shadowBlur = 8
        lineas(T.FACE_LANDMARKS_CONTOURS, `rgba(${MENTA},.95)`, 1.4)
        ctx.shadowBlur = 0

        // Puntos
        ctx.fillStyle = 'rgba(255,255,255,.85)'
        for (let i = 0; i < puntos.length; i += 4) { const [x, y] = P(puntos[i]); ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6) }

        // Barrido de escaneo sobre la cara
        if (!quieto) {
          const fase = (t % 2.6) / 2.6
          const by = y0 + (y1 - y0) * fase
          const g = ctx.createLinearGradient(0, by - 40, 0, by)
          g.addColorStop(0, `rgba(${MENTA},0)`); g.addColorStop(1, `rgba(${MENTA},.28)`)
          ctx.fillStyle = g; ctx.fillRect(x0 - 10, by - 40, ancho + 20, 40)
          ctx.fillStyle = `rgba(${MENTA},.9)`; ctx.fillRect(x0 - 10, by, ancho + 20, 1.2)
        }

        // Anillos por zona
        const r = ancho * 0.07
        ctx.font = `500 ${Math.max(13, Math.round(ancho * 0.034))}px var(--font-geist-mono), ui-monospace, monospace`
        ZONAS.forEach(([i, nombre], k) => {
          const [x, y] = P(puntos![i])
          const giro = quieto ? 0 : t * 1.4 + k
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
          ctx.strokeStyle = `rgba(${MENTA},1)`; ctx.lineWidth = 2.2
          ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro, giro + Math.PI * 0.7); ctx.stroke()
          ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro + Math.PI, giro + Math.PI * 1.7); ctx.stroke()
          ctx.fillStyle = 'rgba(255,255,255,.95)'
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
          const izq = x < cx
          ctx.textAlign = izq ? 'right' : 'left'
          ctx.shadowColor = 'rgba(15,27,29,.8)'; ctx.shadowBlur = 4
          ctx.fillText(nombre, x + (izq ? -r * 1.8 : r * 1.8), y + 4)
          ctx.shadowBlur = 0
        })

        // Esquinas de encuadre alrededor de la cara
        const m = ancho * 0.08, L = ancho * 0.12
        ctx.strokeStyle = `rgba(${MENTA},.95)`; ctx.lineWidth = 2
        ;[[x0 - m, y0 - m, 1, 1], [x1 + m, y0 - m, -1, 1], [x0 - m, y1 + m, 1, -1], [x1 + m, y1 + m, -1, -1]].forEach(([x, y, dx, dy]) => {
          ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke()
        })
        ctx.globalAlpha = 1
      }
      bucle()
    }).catch(() => {})

    return () => { vivo = false; cancelAnimationFrame(raf) }
  }, [video])

  return <canvas ref={lienzo} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />
}
