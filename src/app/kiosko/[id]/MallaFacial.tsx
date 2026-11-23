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


// Variantes del estilo clínico. Valores = opacidades (0 = no se dibuja); anillo = radio relativo al ancho de la cara.
type Config = { color: string; velo: number; malla: number; contorno: number; rasgos: number; puntos: number; escaneo: number; brillo: number; anillo: number; giro: boolean; etiquetas: boolean }
const ESTILO: Record<string, Config> = {
  clinica:  { color: '127,214,194', velo: 0.05, malla: 0.12, contorno: 0.85, rasgos: 0.3, puntos: 0.6, escaneo: 0.25, brillo: 6, anillo: 0.055, giro: true, etiquetas: true },
  ligera:   { color: '127,214,194', velo: 0, malla: 0.08, contorno: 0.6, rasgos: 0, puntos: 0, escaneo: 0.18, brillo: 0, anillo: 0, giro: false, etiquetas: true },
  azul:     { color: '140,196,255', velo: 0.05, malla: 0.12, contorno: 0.85, rasgos: 0.25, puntos: 0.55, escaneo: 0.25, brillo: 6, anillo: 0.055, giro: true, etiquetas: true },
  perla:    { color: '255,255,255', velo: 0.04, malla: 0.1, contorno: 0.7, rasgos: 0.2, puntos: 0.5, escaneo: 0.18, brillo: 4, anillo: 0.05, giro: false, etiquetas: true },
  rosa:     { color: '255,176,196', velo: 0.05, malla: 0.12, contorno: 0.85, rasgos: 0.25, puntos: 0.55, escaneo: 0.25, brillo: 6, anillo: 0.055, giro: true, etiquetas: true },
}
export const ESTILOS = [['clinica', 'Clínica menta'], ['ligera', 'Ligera'], ['azul', 'Azul clínico'], ['perla', 'Perla'], ['rosa', 'Rosa cosmético']] as const
export type EstiloMalla = (typeof ESTILOS)[number][0]

export function MallaFacial({ video, onEstado, estilo = 'clinica' }: { video: React.RefObject<HTMLVideoElement | null>; onEstado?: (e: EstadoCara) => void; estilo?: EstiloMalla }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const estiloRef = useRef(estilo)
  useEffect(() => { estiloRef.current = estilo }, [estilo])
  const avisar = useRef(onEstado)
  useEffect(() => { avisar.current = onEstado }, [onEstado])

  useEffect(() => {
    let vivo = true
    let raf = 0
    let ultimo = -1
    let estado: EstadoCara | null = null
    let opacidad = 0
    let suave: number[][] | null = null
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        if (!puntos) { suave = null; opacidad = 0; fijar('buscando'); return }
        const crudo = puntos.map((p) => [W - (p.x * v.videoWidth * s + ox), p.y * v.videoHeight * s + oy])

        // Suavizado para que la malla no tiemble
        if (suave && suave.length === crudo.length) suave.forEach((q, i) => { q[0] += (crudo[i][0] - q[0]) * 0.55; q[1] += (crudo[i][1] - q[1]) * 0.55 })
        else suave = crudo
        const Q = suave

        // La malla de MediaPipe acaba a media frente: se estira hacia arriba desde la línea de las cejas
        const arriba = Q[10], barbilla = Q[152]
        let ux = arriba[0] - barbilla[0], uy = arriba[1] - barbilla[1]
        const largo = Math.hypot(ux, uy) || 1
        ux /= largo; uy /= largo
        const bx = (Q[105][0] + Q[334][0]) / 2, by = (Q[105][1] + Q[334][1]) / 2
        // Se estira más en el centro que en las sienes, para que la frente quede redondeada y no cuadrada
        const EXT = 0.55
        const semi = Math.hypot(Q[454][0] - Q[234][0], Q[454][1] - Q[234][1]) / 2 || 1
        const pts = Q.map(([x, y]) => {
          const d = (x - bx) * ux + (y - by) * uy
          if (d <= 0) return [x, y]
          const l = ((x - bx) * -uy + (y - by) * ux) / semi
          const k = d * EXT * Math.max(0.15, 1 - l * l * 0.85)
          return [x + ux * k, y + uy * k]
        })
        const altoFrente = ((arriba[0] - bx) * ux + (arriba[1] - by) * uy) * (1 + EXT)

        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
        const ancho = x1 - x0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
        fijar(ancho < W * 0.38 ? 'lejos' : Math.abs(cx - W / 2) > W * 0.15 || Math.abs(cy - H * 0.48) > H * 0.15 ? 'descentrada' : 'lista')
        const t = performance.now() / 1000
        opacidad = Math.min(1, opacidad + 0.06)
        ctx.globalAlpha = opacidad

        // Contorno de la cara como trazado cerrado
        const ovalo = new Path2D()
        const sig = new Map(T.FACE_LANDMARKS_FACE_OVAL.map((c) => [c.start, c.end]))
        const i0 = T.FACE_LANDMARKS_FACE_OVAL[0].start
        let j = i0, n = 0
        ovalo.moveTo(pts[j][0], pts[j][1])
        do { j = sig.get(j) ?? i0; ovalo.lineTo(pts[j][0], pts[j][1]) } while (j !== i0 && ++n < 64)
        ovalo.closePath()

        const lineas = (con: { start: number; end: number }[], color: string, w: number) => {
          ctx.beginPath()
          for (const { start, end } of con) { ctx.moveTo(pts[start][0], pts[start][1]); ctx.lineTo(pts[end][0], pts[end][1]) }
          ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke()
        }

        const E = ESTILO[estiloRef.current] ?? ESTILO.clinica
        const C = E.color
        if (E.velo) { ctx.fillStyle = `rgba(${C},${E.velo})`; ctx.fill(ovalo) }
        if (E.malla) lineas(T.FACE_LANDMARKS_TESSELATION, `rgba(255,255,255,${E.malla})`, 0.5)
        if (E.contorno) {
          ctx.shadowColor = `rgba(${C},.8)`; ctx.shadowBlur = E.brillo
          lineas(T.FACE_LANDMARKS_FACE_OVAL, `rgba(${C},${E.contorno})`, 1.4)
          ctx.shadowBlur = 0
        }
        if (E.rasgos) {
          // Ojos, cejas y labios muy suaves: si se marcan fuerte la cara parece una máscara
          lineas(T.FACE_LANDMARKS_LEFT_EYE, `rgba(${C},${E.rasgos})`, 1)
          lineas(T.FACE_LANDMARKS_RIGHT_EYE, `rgba(${C},${E.rasgos})`, 1)
          lineas(T.FACE_LANDMARKS_LEFT_EYEBROW, `rgba(${C},${E.rasgos * 0.7})`, 1)
          lineas(T.FACE_LANDMARKS_RIGHT_EYEBROW, `rgba(${C},${E.rasgos * 0.7})`, 1)
          lineas(T.FACE_LANDMARKS_LIPS, `rgba(${C},${E.rasgos})`, 1)
        }
        if (E.puntos) {
          ctx.fillStyle = `rgba(255,255,255,${E.puntos})`
          for (let i = 0; i < pts.length; i += 5) ctx.fillRect(pts[i][0] - 0.7, pts[i][1] - 0.7, 1.4, 1.4)
        }

        // Barrido de escaneo, recortado a la forma de la cara
        if (E.escaneo && !quieto) {
          const fase = (t % 3.2) / 3.2
          const ly = y0 + (y1 - y0) * fase
          const h = (y1 - y0) * 0.2
          ctx.save()
          ctx.clip(ovalo)
          const g = ctx.createLinearGradient(0, ly - h, 0, ly)
          g.addColorStop(0, `rgba(${C},0)`); g.addColorStop(1, `rgba(${C},${E.escaneo})`)
          ctx.fillStyle = g; ctx.fillRect(x0, ly - h, ancho, h)
          ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x0, ly - 0.5, ancho, 1)
          ctx.restore()
        }

        // Marcas por zona
        const r = ancho * E.anillo
        const zonas: [number, number, string, 'arriba' | 'abajo' | 'lado'][] = [
          [bx + ux * altoFrente * 0.5, by + uy * altoFrente * 0.5, 'Frente', 'arriba'],
          [pts[205][0], pts[205][1], 'Mejilla', 'lado'],
          [pts[425][0], pts[425][1], 'Mejilla', 'lado'],
          [pts[4][0], pts[4][1], 'Nariz', 'arriba'],
          [pts[200][0], pts[200][1], 'Mentón', 'abajo'],
        ]
        ctx.font = `500 ${Math.max(12, Math.round(ancho * 0.032))}px var(--font-geist-mono), ui-monospace, monospace`
        zonas.forEach(([x, y, nombre, pos], k) => {
          if (E.anillo) {
            ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
            if (E.giro) {
              const giro = quieto ? 0 : t * 1.2 + k
              ctx.strokeStyle = `rgba(${C},1)`; ctx.lineWidth = 1.8
              ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro, giro + Math.PI * 0.6); ctx.stroke()
              ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro + Math.PI, giro + Math.PI * 1.6); ctx.stroke()
            }
          }
          ctx.fillStyle = E.anillo ? 'rgba(255,255,255,.95)' : `rgba(${C},1)`
          ctx.beginPath(); ctx.arc(x, y, E.anillo ? 1.8 : 3, 0, Math.PI * 2); ctx.fill()
          if (!E.etiquetas) return
          const sep = Math.max(r * 1.8, 10)
          ctx.shadowColor = 'rgba(15,27,29,.85)'; ctx.shadowBlur = 4
          ctx.fillStyle = 'rgba(255,255,255,.95)'
          if (pos === 'lado') {
            const izq = x < cx
            ctx.textAlign = izq ? 'right' : 'left'
            ctx.fillText(nombre, x + (izq ? -sep : sep), y + 4)
          } else {
            ctx.textAlign = 'center'
            ctx.fillText(nombre, x, pos === 'arriba' ? y - sep : y + sep + 10)
          }
          ctx.shadowBlur = 0
        })
        ctx.globalAlpha = 1
      }
      bucle()
    }).catch(() => {})

    return () => { vivo = false; cancelAnimationFrame(raf) }
  }, [video])

  return <canvas ref={lienzo} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />
}
