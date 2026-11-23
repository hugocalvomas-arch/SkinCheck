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

const MENTA = '127,214,194'

export const ESTILOS = [['clinica', 'Clínica'], ['holograma', 'Holograma'], ['espectro', 'Espectro'], ['relieve', 'Relieve 3D'], ['proporciones', 'Proporciones']] as const
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
        const EXT = 0.5
        const pts = Q.map(([x, y]) => { const d = (x - bx) * ux + (y - by) * uy; return d > 0 ? [x + ux * d * EXT, y + uy * d * EXT] : [x, y] })
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

        const e = estiloRef.current
        if (e === 'clinica') {
          // Velo suave, malla fina y contornos
          ctx.fillStyle = `rgba(${MENTA},.07)`; ctx.fill(ovalo)
          lineas(T.FACE_LANDMARKS_TESSELATION, 'rgba(255,255,255,.14)', 0.6)
          ctx.shadowColor = `rgba(${MENTA},.9)`; ctx.shadowBlur = 8
          lineas(T.FACE_LANDMARKS_CONTOURS, `rgba(${MENTA},.95)`, 1.4)
          ctx.shadowBlur = 0

          // Puntos
          ctx.fillStyle = 'rgba(255,255,255,.8)'
          for (let i = 0; i < pts.length; i += 4) ctx.fillRect(pts[i][0] - 0.8, pts[i][1] - 0.8, 1.6, 1.6)

          // Barrido de escaneo, recortado a la forma de la cara
          if (!quieto) {
            const fase = (t % 2.8) / 2.8
            const ly = y0 + (y1 - y0) * fase
            const h = (y1 - y0) * 0.22
            ctx.save()
            ctx.clip(ovalo)
            const g = ctx.createLinearGradient(0, ly - h, 0, ly)
            g.addColorStop(0, `rgba(${MENTA},0)`); g.addColorStop(1, `rgba(${MENTA},.32)`)
            ctx.fillStyle = g; ctx.fillRect(x0, ly - h, ancho, h)
            ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x0, ly - 0.75, ancho, 1.5)
            ctx.restore()
          }

          // Anillos por zona
          const r = ancho * 0.065
          const zonas: [number, number, string, 'arriba' | 'abajo' | 'lado'][] = [
            [bx + ux * altoFrente * 0.5, by + uy * altoFrente * 0.5, 'Frente', 'arriba'],
            [pts[205][0], pts[205][1], 'Mejilla', 'lado'],
            [pts[425][0], pts[425][1], 'Mejilla', 'lado'],
            [pts[4][0], pts[4][1], 'Nariz', 'arriba'],
            [pts[200][0], pts[200][1], 'Mentón', 'abajo'],
          ]
          ctx.font = `500 ${Math.max(13, Math.round(ancho * 0.036))}px var(--font-geist-mono), ui-monospace, monospace`
          zonas.forEach(([x, y, nombre, pos], k) => {
            const giro = quieto ? 0 : t * 1.4 + k
            ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
            ctx.strokeStyle = `rgba(${MENTA},1)`; ctx.lineWidth = 2.2
            ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro, giro + Math.PI * 0.7); ctx.stroke()
            ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro + Math.PI, giro + Math.PI * 1.7); ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,.95)'
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
            ctx.shadowColor = 'rgba(15,27,29,.85)'; ctx.shadowBlur = 5
            if (pos === 'lado') {
              const izq = x < cx
              ctx.textAlign = izq ? 'right' : 'left'
              ctx.fillText(nombre, x + (izq ? -r * 1.8 : r * 1.8), y + 4)
            } else {
              ctx.textAlign = 'center'
              ctx.fillText(nombre, x, pos === 'arriba' ? y - r * 1.75 : y + r * 1.75 + 10)
            }
            ctx.shadowBlur = 0
          })
        } else if (e === 'holograma') {
          // Nube de puntos con una onda de luz que sale de la nariz
          ctx.fillStyle = `rgba(${MENTA},.05)`; ctx.fill(ovalo)
          lineas(T.FACE_LANDMARKS_FACE_OVAL, 'rgba(255,255,255,.35)', 1)
          const [nx, ny] = pts[4]
          const R = Math.hypot(ancho, y1 - y0) / 2
          for (const [x, y] of pts) {
            const d = Math.hypot(x - nx, y - ny) / R
            const onda = quieto ? 0.5 : 0.5 + 0.5 * Math.sin(d * 9 - t * 3.5)
            ctx.globalAlpha = opacidad * (0.55 + 0.45 * onda)
            ctx.fillStyle = onda > 0.75 ? 'rgba(255,255,255,1)' : `rgba(${MENTA},1)`
            ctx.beginPath(); ctx.arc(x, y, 1.2 + onda * 1.8, 0, Math.PI * 2); ctx.fill()
          }
          ctx.globalAlpha = opacidad
        } else if (e === 'espectro') {
          // Mapa de color por zonas, como una cámara de análisis
          ctx.save(); ctx.clip(ovalo)
                    const pulso = (k: number) => (quieto ? 0.8 : 0.65 + 0.35 * Math.sin(t * 1.6 + k))
          const mancha = (x: number, y: number, rad: number, rgb: string, k: number) => {
            const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
            g.addColorStop(0, `rgba(${rgb},${0.6 * pulso(k)})`); g.addColorStop(0.5, `rgba(${rgb},${0.3 * pulso(k)})`); g.addColorStop(1, `rgba(${rgb},0)`)
            ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
          }
          mancha(bx + ux * altoFrente * 0.45, by + uy * altoFrente * 0.45, ancho * 0.38, '255,190,90', 0)
          mancha(pts[4][0], pts[4][1], ancho * 0.2, '255,120,110', 1)
          mancha(pts[205][0], pts[205][1], ancho * 0.26, '127,214,194', 2)
          mancha(pts[425][0], pts[425][1], ancho * 0.26, '127,214,194', 3)
          mancha(pts[145][0], pts[145][1] + ancho * 0.05, ancho * 0.14, '130,160,255', 4)
          mancha(pts[374][0], pts[374][1] + ancho * 0.05, ancho * 0.14, '130,160,255', 5)
          mancha(pts[200][0], pts[200][1], ancho * 0.22, '255,150,190', 6)
          ctx.restore()
          lineas(T.FACE_LANDMARKS_TESSELATION, 'rgba(255,255,255,.12)', 0.5)
          lineas(T.FACE_LANDMARKS_FACE_OVAL, 'rgba(255,255,255,.9)', 1.5)
          // Leyenda
          const ley: [string, string][] = [['255,190,90', 'Brillo'], ['255,120,110', 'Poros'], ['127,214,194', 'Hidratación'], ['130,160,255', 'Ojeras'], ['255,150,190', 'Rojez']]
          ctx.font = '500 12px var(--font-geist-mono), ui-monospace, monospace'; ctx.textAlign = 'left'
          ley.forEach(([rgb, txt], k) => {
            const lx = 16, ly = H - 16 - (ley.length - 1 - k) * 20
            ctx.fillStyle = `rgba(${rgb},1)`; ctx.beginPath(); ctx.arc(lx + 5, ly - 4, 5, 0, Math.PI * 2); ctx.fill()
            ctx.shadowColor = 'rgba(15,27,29,.85)'; ctx.shadowBlur = 4
            ctx.fillStyle = '#fff'; ctx.fillText(txt, lx + 16, ly); ctx.shadowBlur = 0
          })
        } else if (e === 'relieve') {
          // Luz estructurada: líneas que se curvan con el volumen de la cara (profundidad z de la malla)
          const GX = 18, GY = 24
          const zr = new Float32Array((GX + 1) * (GY + 1)), wr = new Float32Array((GX + 1) * (GY + 1))
          const alto = y1 - y0
          pts.forEach(([x, y], i) => {
            const gx = Math.round(((x - x0) / ancho) * GX), gy = Math.round(((y - y0) / alto) * GY)
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
              const X = gx + dx, Y = gy + dy
              if (X < 0 || Y < 0 || X > GX || Y > GY) continue
              const w = dx === 0 && dy === 0 ? 2 : 1
              zr[Y * (GX + 1) + X] += (puntos![i].z || 0) * w; wr[Y * (GX + 1) + X] += w
            }
          })
          const zEn = (x: number, y: number) => {
            const fx = Math.max(0, Math.min(GX, ((x - x0) / ancho) * GX)), fy = Math.max(0, Math.min(GY, ((y - y0) / alto) * GY))
            const X = Math.round(fx), Y = Math.round(fy), k = Y * (GX + 1) + X
            return wr[k] ? zr[k] / wr[k] : 0
          }
          ctx.save(); ctx.clip(ovalo)
          ctx.fillStyle = 'rgba(15,27,29,.18)'; ctx.fillRect(x0, y0, ancho, alto)
          const paso = Math.max(5, alto / 46)
          const desp = quieto ? 0 : (t * 14) % paso
          const barrido = quieto ? -1 : y0 + ((t % 3) / 3) * alto
          for (let ly = y0 - paso + desp; ly < y1 + paso; ly += paso) {
            ctx.beginPath()
            for (let lx = x0; lx <= x1; lx += 5) {
              const yy = ly + zEn(lx, ly) * ancho * 0.45
              if (lx === x0) ctx.moveTo(lx, yy); else ctx.lineTo(lx, yy)
            }
            const cerca = barrido > 0 ? Math.max(0, 1 - Math.abs(ly - barrido) / (alto * 0.12)) : 0
            ctx.strokeStyle = cerca > 0 ? `rgba(255,255,255,${0.5 + 0.5 * cerca})` : `rgba(${MENTA},.6)`
            ctx.lineWidth = 1 + cerca
            ctx.stroke()
          }
          ctx.restore()
          lineas(T.FACE_LANDMARKS_FACE_OVAL, `rgba(${MENTA},.95)`, 1.6)
        } else {
          // Proporciones: tercios y quintos faciales, como en medicina estética
          const nxp = -uy, nyp = ux // perpendicular al eje de la cara
          const proj = (x: number, y: number) => (x - bx) * ux + (y - by) * uy
          const cortes: [number, string][] = [
            [altoFrente, 'Nacimiento del pelo'], [0, 'Cejas'], [proj(pts[2][0], pts[2][1]), 'Base de la nariz'], [proj(pts[152][0], pts[152][1]), 'Mentón'],
          ]
          lineas(T.FACE_LANDMARKS_FACE_OVAL, 'rgba(255,255,255,.55)', 1)
          lineas(T.FACE_LANDMARKS_LEFT_EYE, 'rgba(255,255,255,.55)', 1)
          lineas(T.FACE_LANDMARKS_RIGHT_EYE, 'rgba(255,255,255,.55)', 1)
          lineas(T.FACE_LANDMARKS_LIPS, 'rgba(255,255,255,.55)', 1)
          const media = ancho * 0.62
          const punto = (d: number, l: number) => [bx + ux * d + nxp * l, by + uy * d + nyp * l]
          ctx.strokeStyle = `rgba(${MENTA},1)`; ctx.lineWidth = 1.4
          ctx.setLineDash([6, 5])
          cortes.forEach(([d]) => { const a = punto(d, -media), b2 = punto(d, media); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke() })
          // Línea media y quintos (comisuras de los ojos)
          ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1
          const quintos = [pts[234], pts[33], pts[133], pts[362], pts[263], pts[454]]
          quintos.forEach(([qx, qy]) => {
            const l = (qx - bx) * nxp + (qy - by) * nyp
            const a = punto(cortes[0][0], l), b2 = punto(cortes[3][0], l)
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke()
          })
          ctx.setLineDash([])
          // Medidas de cada tercio
          const total = cortes[0][0] - cortes[3][0] || 1
          ctx.font = `500 ${Math.max(12, Math.round(ancho * 0.032))}px var(--font-geist-mono), ui-monospace, monospace`
          ctx.shadowColor = 'rgba(15,27,29,.85)'; ctx.shadowBlur = 4
          ;[0, 1, 2].forEach((k) => {
            const dm = (cortes[k][0] + cortes[k + 1][0]) / 2
            const pct = Math.round(((cortes[k][0] - cortes[k + 1][0]) / total) * 100)
            const txt = `${['Superior', 'Medio', 'Inferior'][k]} ${pct}%`
            let [lx, ly] = punto(dm, media + 8)
            ctx.textAlign = 'left'
            if (lx + ctx.measureText(txt).width > W - 8) { [lx, ly] = punto(dm, -media - 8); ctx.textAlign = 'right' }
            ctx.fillStyle = '#fff'
            ctx.fillText(txt, lx, ly + 4)
            const a = punto(cortes[k][0], media), b2 = punto(cortes[k + 1][0], media)
            ctx.strokeStyle = `rgba(${MENTA},1)`; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke()
          })
          ctx.shadowBlur = 0
          // Puntos de referencia
          ;[10, 4, 2, 152, 33, 263, 61, 291].forEach((i) => {
            const [x, y] = pts[i]
            ctx.strokeStyle = `rgba(${MENTA},1)`; ctx.lineWidth = 1.4
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke()
          })
        }
        ctx.globalAlpha = 1
      }
      bucle()
    }).catch(() => {})

    return () => { vivo = false; cancelAnimationFrame(raf) }
  }, [video])

  return <canvas ref={lienzo} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />
}
