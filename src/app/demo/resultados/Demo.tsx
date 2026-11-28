'use client'
import { useState } from 'react'
import { Logo } from '@/components/Logo'
import { Estilos } from '@/app/kiosko/[id]/Kiosko'
import { Informe } from '@/app/kiosko/[id]/Resultados'
import datos from './datos.json'

export function Demo() {
  const [vuelta, setVuelta] = useState(0)
  return (
    <div className="kiosko min-h-[100dvh] bg-papel text-tinta font-sans select-none flex flex-col">
      <Estilos />
      <header className="h-16 shrink-0 flex items-center gap-3 px-6 md:px-10 border-b border-[var(--k-line)] bg-papel">
        <Logo />
        <span className="text-[var(--k-muted)] pl-3 border-l border-[var(--k-line)]">Farmacia de ejemplo</span>
      </header>
      <main className="flex-1 flex">
        <Informe key={vuelta} res={datos} foto="/ejemplos/mapas/foto.webp" simulacion={{ antes: '/ejemplos/antes.jpg', despues: '/ejemplos/despues.jpg' }} farmacia="Farmacia de ejemplo" emailActivo onFin={() => setVuelta((v) => v + 1)} />
      </main>
    </div>
  )
}
