'use client'
import { useEffect, useRef } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { ESTILO, aPares, dibujarMallaClinica, type EstiloMalla, type Uniones } from '@/lib/mallaClinica'
import { CARA_EN_RECORTE, LADO_MIN, evaluarCara, type EstadoCara } from '@/lib/calidadFoto'

export type CajaCara = { x0: number; x1: number; y0: number; y1: number }

export { ESTILOS, type EstiloMalla } from '@/lib/mallaClinica'

// Malla facial en vivo sobre la cámara. Todo se calcula en el iPad (MediaPipe, modelo y wasm servidos
// desde /public/mediapipe): no sale ninguna imagen del dispositivo para dibujar esto.

export type { EstadoCara } from '@/lib/calidadFoto'

let cargador: Promise<{ fl: FaceLandmarker; mod: typeof import('@mediapipe/tasks-vision') }> | null = null
function cargar() {
  if (!cargador) {
    cargador = (async () => {
      const mod = await import('@mediapipe/tasks-vision')
      const fileset = await mod.FilesetResolver.forVisionTasks('/mediapipe/wasm')
      const crear = (delegate: 'GPU' | 'CPU') => mod.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task', delegate },
        runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
      })
      const fl = await crear('GPU').catch(() => crear('CPU'))
      return { fl, mod }
    })()
    cargador.catch(() => { cargador = null })
  }
  return cargador
}


export function MallaFacial({ video, onEstado, caja, estilo = 'clinica' }: { video: React.RefObject<HTMLVideoElement | null>; onEstado?: (e: EstadoCara) => void; caja?: React.MutableRefObject<CajaCara | null>; estilo?: EstiloMalla }) {
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
    let previo: number[][] | null = null
    let movimiento = 0
    let luz: { izq: number; der: number } | null = null
    let cuadro = 0
    const muestra = document.createElement('canvas')
    muestra.width = 48; muestra.height = 32
    const mctx = muestra.getContext('2d', { willReadFrequently: true })
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const fijar = (e: EstadoCara) => { if (e !== estado) { estado = e; avisar.current?.(e) } }

    cargar().then(({ fl, mod }) => {
      const T = mod.FaceLandmarker
      const uniones: Uniones = {
        malla: aPares(T.FACE_LANDMARKS_TESSELATION), ovalo: aPares(T.FACE_LANDMARKS_FACE_OVAL),
        ojos: aPares(T.FACE_LANDMARKS_LEFT_EYE, T.FACE_LANDMARKS_RIGHT_EYE),
        cejas: aPares(T.FACE_LANDMARKS_LEFT_EYEBROW, T.FACE_LANDMARKS_RIGHT_EYEBROW), labios: aPares(T.FACE_LANDMARKS_LIPS),
      }
      const bucle = () => {
        if (!vivo) return
        raf = requestAnimationFrame(bucle)
        const v = video.current, c = lienzo.current
        if (!v || !c || v.readyState < 2 || !v.videoWidth) return
        const W = c.clientWidth, H = c.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1)
        if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
        const ctx = c.getContext('2d')!
        let puntos: NormalizedLandmark[] | undefined
        const gestos: Record<string, number> = {}
        if (v.currentTime !== ultimo) {
          ultimo = v.currentTime
          try {
            const r = fl.detectForVideo(v, performance.now())
            puntos = r.faceLandmarks[0]
            for (const c of r.faceBlendshapes?.[0]?.categories ?? []) gestos[c.categoryName] = c.score
          } catch { return }
        } else return

        // De coordenadas del vídeo a la caja visible (object-cover) y en espejo
        const s = Math.max(W / v.videoWidth, H / v.videoHeight)
        const ox = (W - v.videoWidth * s) / 2, oy = (H - v.videoHeight * s) / 2
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        if (!puntos) { suave = null; previo = null; luz = null; opacidad = 0; fijar('buscando'); return }
        const crudo = puntos.map((p) => [W - (p.x * v.videoWidth * s + ox), p.y * v.videoHeight * s + oy])

        // Movimiento entre fotogramas, en fracción del ancho de la cara (suavizado)
        const anchoCara = Math.abs(crudo[454][0] - crudo[234][0]) || 1
        if (previo) {
          let d = 0
          for (const i of [1, 33, 263, 152, 10]) d += Math.hypot(crudo[i][0] - previo[i][0], crudo[i][1] - previo[i][1])
          movimiento = movimiento * 0.6 + (d / 5 / anchoCara) * 0.4
        }
        previo = crudo.map((q) => [q[0], q[1]])

        // Luz de cada mitad de la cara, cada 6 fotogramas, sobre una muestra pequeña del vídeo
        if (mctx && cuadro++ % 6 === 0) {
          const px = puntos.map((p) => p.x * v.videoWidth), py = puntos.map((p) => p.y * v.videoHeight)
          const x0 = Math.max(0, Math.min(...px)), x1 = Math.min(v.videoWidth, Math.max(...px))
          const y0 = Math.max(0, py[10]), y1 = Math.min(v.videoHeight, py[152])
          if (x1 - x0 > 8 && y1 - y0 > 8) {
            mctx.drawImage(v, x0, y0, x1 - x0, y1 - y0, 0, 0, muestra.width, muestra.height)
            const d = mctx.getImageData(0, 0, muestra.width, muestra.height).data
            let a = 0, b = 0
            for (let y = 0; y < muestra.height; y++) for (let x = 0; x < muestra.width; x++) {
              const i = (y * muestra.width + x) * 4, l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
              if (x < muestra.width / 2) a += l; else b += l
            }
            const n = (muestra.width / 2) * muestra.height
            luz = { izq: a / n, der: b / n }
          }
        }

        // Suavizado para que la malla no tiemble
        if (suave && suave.length === crudo.length) suave.forEach((q, i) => { q[0] += (crudo[i][0] - q[0]) * 0.55; q[1] += (crudo[i][1] - q[1]) * 0.55 })
        else suave = crudo

        const t = performance.now() / 1000
        opacidad = Math.min(1, opacidad + 0.06)
        ctx.globalAlpha = opacidad
        dibujarMallaClinica(ctx, suave, uniones, ESTILO[estiloRef.current] ?? ESTILO.clinica, { t, quieto })
        // Caja de la cara en el vídeo (sin espejo), para recortar la foto alrededor de ella
        const nx = puntos.map((p) => p.x), ny = puntos.map((p) => p.y)
        if (caja) caja.current = { x0: Math.min(...nx), x1: Math.max(...nx), y0: Math.min(...ny), y1: Math.max(...ny) }
        // Con una cámara de poca resolución hay que acercarse más para que el recorte tenga al menos 480 px
        // (cara en px del vídeo = cara en pantalla / s; hace falta LADO_MIN × CARA_EN_RECORTE)
        const anchoMin = (LADO_MIN * CARA_EN_RECORTE * s) / W
        fijar(evaluarCara({ Q: crudo, W, H, luz, movimiento, gestos, anchoMin }))
        ctx.globalAlpha = 1
      }
      bucle()
    }).catch(() => fijar('sin_detector'))

    return () => { vivo = false; cancelAnimationFrame(raf) }
  }, [video])

  return <canvas ref={lienzo} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />
}
