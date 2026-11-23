'use client'
import { useEffect, useRef } from 'react'

// Demostración del análisis en la portada: vídeo en bucle hecho con HyperFrames a partir del resultado real de la API
// (fuente en video/analisis/). Con "reducir movimiento" se queda en el fotograma del resultado.
export function VideoAnalisis() {
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); return }
    v.play().catch(() => {})
  }, [])
  return (
    <figure className="m-0">
      <div className="border border-linea rounded-[var(--radius-card)] bg-papel overflow-hidden">
        <video
          ref={video}
          className="block w-full h-auto aspect-video"
          src="/ejemplos/video/analisis.mp4"
          poster="/ejemplos/video/analisis.webp"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-label="Demostración del análisis facial: la malla se ajusta a la cara, se analizan las zonas y sale el resultado"
        />
      </div>
      <figcaption className="mt-3 text-sm text-gris">Resultado real del análisis sobre una cara generada con IA. Escala de 0 a 100: más hacia fuera, mejor.</figcaption>
    </figure>
  )
}
