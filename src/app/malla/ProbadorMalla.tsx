'use client'
import { useEffect, useRef, useState } from 'react'
import { ESTILOS, MallaFacial, type EstiloMalla } from '../kiosko/[id]/MallaFacial'

// Página para comparar los estilos de malla con la cámara. Todo ocurre en el dispositivo: no se envía ni se guarda nada.
export function ProbadorMalla() {
  const video = useRef<HTMLVideoElement>(null)
  const [estilo, setEstilo] = useState<EstiloMalla>('clinica')
  const [fallo, setFallo] = useState(false)
  useEffect(() => {
    let stream: MediaStream | null = null
    let vivo = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      .then((s) => { if (!vivo) return s.getTracks().forEach((t) => t.stop()); stream = s; if (video.current) video.current.srcObject = s })
      .catch(() => setFallo(true))
    return () => { vivo = false; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])
  return (
    <main className="min-h-[100dvh] bg-fondo px-4 py-6 md:py-10 grid content-start justify-items-center gap-5">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Estilos de malla facial</h1>
      <div role="tablist" aria-label="Estilo" className="flex flex-wrap justify-center gap-2">
        {ESTILOS.map(([id, nombre], k) => (
          <button key={id} role="tab" aria-selected={estilo === id} onClick={() => setEstilo(id)} className={estilo === id ? 'btn' : 'btn-sec'}>
            <span className="font-mono text-xs opacity-70">{k + 1}</span> {nombre}
          </button>
        ))}
      </div>
      <div id="visor" className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-[#0f1b1d]">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <MallaFacial video={video} estilo={estilo} />
        {fallo && <p className="absolute inset-0 grid place-items-center p-6 text-center text-white">No se ha podido abrir la cámara.</p>}
      </div>
      <p className="text-sm text-gris text-center max-w-md">La imagen no sale del dispositivo. Elige el estilo que más te guste y dime su número.</p>
    </main>
  )
}
