'use client'
import { AVISO_FOTO } from '@/lib/privacidad'
import { useEffect, useRef, useState } from 'react'

// Cámara del navegador (iPad o móvil). La foto se queda en memoria y solo se envía al pulsar "Analizar".
export function Camara({ onFoto }: { onFoto: (jpegBase64: string | null) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [consiente, setConsiente] = useState(false)
  const [activa, setActiva] = useState(false)
  const [foto, setFoto] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!activa) return
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => {
        stream = s
        if (video.current) video.current.srcObject = s
      })
      .catch(() => setError('No se ha podido abrir la cámara. Revisa los permisos del navegador.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [activa])

  function capturar() {
    const v = video.current
    if (!v) return
    // recorte vertical 3:4 centrado: la cara debe ocupar más del 60 % del ancho (requisito del proveedor)
    const alto = v.videoHeight
    const ancho = Math.min(v.videoWidth, Math.round((alto * 3) / 4))
    const x = Math.round((v.videoWidth - ancho) / 2)
    const escala = Math.min(1, 1280 / alto)
    const c = document.createElement('canvas')
    c.width = Math.round(ancho * escala)
    c.height = Math.round(alto * escala)
    c.getContext('2d')!.drawImage(v, x, 0, ancho, alto, 0, 0, c.width, c.height)
    const datos = c.toDataURL('image/jpeg', 0.85)
    setFoto(datos)
    setActiva(false)
    onFoto(datos.split(',')[1])
  }

  function repetir() {
    setFoto(null)
    onFoto(null)
    setActiva(true)
  }

  return (
    <div className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-3">
      <p className="font-medium">Foto de la cara (opcional)</p>
      <label className="flex gap-2 text-sm text-tinta-2">
        <input type="checkbox" checked={consiente} onChange={(e) => { setConsiente(e.target.checked); if (!e.target.checked) { setActiva(false); setFoto(null); onFoto(null) } }} />
        <span>
          La clienta acepta que se haga una foto de su cara para analizar el aspecto de la piel con IA. {AVISO_FOTO.join(' ')} Puede seguir sin foto.
        </span>
      </label>
      {consiente && !activa && !foto && (
        <button type="button" onClick={() => setActiva(true)} className="btn-sec text-sm">Abrir cámara</button>
      )}
      {activa && (
        <div className="space-y-2">
          <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden rounded-lg bg-black">
            <video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
            <div className="absolute left-[12%] right-[12%] top-[10%] bottom-[14%] rounded-[50%] border-2 border-white/80 pointer-events-none" />
          </div>
          <p className="text-xs text-gris">Acerca la cara hasta llenar el óvalo. Buena luz, de frente, sin gafas, pelo fuera de la frente y sin maquillaje si es posible.</p>
          <button type="button" onClick={capturar} className="btn">Hacer foto</button>
        </div>
      )}
      {foto && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="Foto tomada" className="w-40 rounded-lg -scale-x-100" />
          <button type="button" onClick={repetir} className="btn-sec text-sm">Repetir</button>
        </div>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
