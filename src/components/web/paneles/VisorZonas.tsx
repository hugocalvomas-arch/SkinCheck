'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import { nivel, valor } from './ejemplo'

// Las imágenes que devuelve el análisis (una por aspecto, con su zona pintada) pasando solas; al tocar una, se queda fija.
const ZONAS: [string, string][] = [
  ['Arrugas', 'arrugas'], ['Brillo', 'brillo'], ['Rojez', 'rojez'], ['Textura', 'textura'],
  ['Hidratación', 'hidratacion'], ['Manchas', 'manchas'], ['Ojeras', 'ojeras'], ['Firmeza', 'firmeza'],
]

export function VisorZonas() {
  const [activa, setActiva] = useState(0)
  const [fija, setFija] = useState(false)
  useEffect(() => {
    if (fija || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setActiva((k) => (k + 1) % ZONAS.length), 2600)
    return () => clearInterval(t)
  }, [fija])
  const [nombre] = ZONAS[activa]
  const v = valor(nombre)
  return (
    <div className="relative h-full min-h-[26rem] bg-suave overflow-hidden">
      <img src="/ejemplos/zonas/foto.webp" alt="Cara de ejemplo generada con IA" className="absolute inset-0 w-full h-full object-cover" />
      {ZONAS.map(([n, f], k) => (
        <img key={f} src={`/ejemplos/zonas/${f}.webp`} alt={k === activa ? `Zonas de ${n.toLowerCase()} marcadas por el análisis` : ''} aria-hidden={k !== activa}
          loading={k < 2 ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: k === activa ? 1 : 0 }} />
      ))}
      <span aria-hidden className="sc-escaneo absolute inset-x-0 top-0 h-full pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent calc(100% - 2px), rgba(255,255,255,.85) calc(100% - 2px))' }} />
      <div className="absolute left-4 top-4 bg-papel/95 border border-linea rounded-[var(--radius-input)] px-3 py-2 text-sm" aria-live="polite">
        <span className="text-gris">Zona analizada</span>
        <span className="block font-medium">{nombre} <span className="cifra text-marca">{v}</span> <span className="text-gris font-normal">{nivel(v)}</span></span>
      </div>
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Elegir zona">
        {ZONAS.map(([n], k) => (
          <button key={n} role="tab" aria-selected={k === activa} onClick={() => { setActiva(k); setFija(true) }}
            className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${k === activa ? 'bg-marca text-sobre-marca border-marca' : 'bg-papel/90 text-tinta border-linea hover:border-tinta-2'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
