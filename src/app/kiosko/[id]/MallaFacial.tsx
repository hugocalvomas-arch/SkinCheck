'use client'
import { useEffect, useRef } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { ESTILO, aPares, dibujarMallaClinica, type EstiloMalla, type Uniones } from '@/lib/mallaClinica'

export { ESTILOS, type EstiloMalla } from '@/lib/mallaClinica'

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

        const t = performance.now() / 1000
        opacidad = Math.min(1, opacidad + 0.06)
        ctx.globalAlpha = opacidad
        const { ancho, cx, cy } = dibujarMallaClinica(ctx, suave, uniones, ESTILO[estiloRef.current] ?? ESTILO.clinica, { t, quieto })
        fijar(ancho < W * 0.38 ? 'lejos' : Math.abs(cx - W / 2) > W * 0.15 || Math.abs(cy - H * 0.48) > H * 0.15 ? 'descentrada' : 'lista')
        ctx.globalAlpha = 1
      }
      bucle()
    }).catch(() => {})

    return () => { vivo = false; cancelAnimationFrame(raf) }
  }, [video])

  return <canvas ref={lienzo} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />
}
