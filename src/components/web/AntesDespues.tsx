'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { ArrowsLeftRight, UserFocus } from '@phosphor-icons/react'

// Comparador antes/después con barra deslizable. Sin imágenes, muestra un hueco neutro.
export function AntesDespues({ antes, despues, etiquetaAntes = 'Hoy', etiquetaDespues = 'Simulación a 8 semanas', escaneo = false }: { antes?: string; despues?: string; etiquetaAntes?: string; etiquetaDespues?: string; escaneo?: boolean }) {
  const [x, setX] = useState(50)
  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)))
  }
  return (
    <div className="relative w-full aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden bg-suave touch-none cursor-ew-resize select-none"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); mover(e) }}
      onPointerMove={(e) => { if (e.buttons) mover(e) }}
      role="slider" aria-label="Comparar antes y después" aria-valuenow={Math.round(x)} aria-valuemin={0} aria-valuemax={100}
      tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowLeft') setX(Math.max(0, x - 5)); if (e.key === 'ArrowRight') setX(Math.min(100, x + 5)) }}>
      {antes && despues ? (
        <>
          <img src={despues} alt={etiquetaDespues} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <img src={antes} alt={etiquetaAntes} className="absolute inset-0 w-full h-full object-cover" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} draggable={false} />
        </>
      ) : (
        <>
          <div className="absolute inset-0 grid place-items-center bg-suave text-marca-media"><UserFocus size={120} weight="thin" /></div>
          <div className="absolute inset-0 grid place-items-center bg-marca-suave text-marca" style={{ clipPath: `inset(0 0 0 ${x}%)` }}><UserFocus size={120} weight="thin" /></div>
        </>
      )}
      {escaneo && (
        <div aria-hidden className="pointer-events-none absolute inset-6">
          {['top-0 left-0 border-t-2 border-l-2 rounded-tl-lg', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg'].map((c) => (
            <span key={c} className={`absolute w-7 h-7 border-marca ${c}`} />
          ))}
          <span className="absolute inset-0 overflow-hidden"><span className="sc-escaneo block h-full border-b border-marca bg-marca-suave/40 opacity-0" /></span>
        </div>
      )}
      <div className="absolute top-0 bottom-0 w-px bg-sobre-marca" style={{ left: `${x}%` }}>
        <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-papel text-tinta grid place-items-center shadow-pomo"><ArrowsLeftRight size={20} /></span>
      </div>
      <span className="absolute bottom-3 left-3 text-xs font-medium bg-papel text-tinta rounded-md px-2 py-1">{etiquetaAntes}</span>
      <span className="absolute bottom-3 right-3 text-xs font-medium bg-papel text-tinta rounded-md px-2 py-1">{etiquetaDespues}</span>
    </div>
  )
}
