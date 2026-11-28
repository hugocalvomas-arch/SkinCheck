'use client'
import { useState } from 'react'
import { Logo } from '@/components/Logo'
import { Camara, Estilos } from '@/app/kiosko/[id]/Kiosko'

/* eslint-disable @next/next/no-img-element */
export function DemoCamara() {
  const [foto, setFoto] = useState<string | null>(null)
  const [vuelta, setVuelta] = useState(0)
  return (
    <div className="kiosko min-h-[100dvh] bg-papel text-tinta font-sans select-none flex flex-col">
      <Estilos />
      <header className="h-16 shrink-0 flex items-center gap-3 px-6 md:px-10 border-b border-[var(--k-line)] bg-papel">
        <Logo />
        <span className="text-[var(--k-muted)] pl-3 border-l border-[var(--k-line)]">Demo de la cámara · la foto no se envía</span>
      </header>
      <main className="flex-1 flex">
        {foto ? (
          <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-8 grid md:grid-cols-[minmax(0,1fr)_320px] gap-10 items-center">
            <img src={foto} alt="Foto hecha" className="h-[min(72dvh,680px)] aspect-[3/4] mx-auto rounded-[var(--radius-card)] object-cover -scale-x-100" />
            <div className="space-y-6">
              <h2 className="text-[2.25rem] leading-[1.05]">Esta es la foto que se enviaría a analizar</h2>
              <button onClick={() => { setFoto(null); setVuelta((v) => v + 1) }} className="boton w-full">Repetir</button>
            </div>
          </div>
        ) : <Camara key={vuelta} error="" onFoto={(_, url) => setFoto(url)} />}
      </main>
    </div>
  )
}
