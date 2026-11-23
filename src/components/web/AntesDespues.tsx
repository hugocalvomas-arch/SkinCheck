'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { ArrowsLeftRight, UserFocus } from '@phosphor-icons/react'

// Comparador antes/después con barra deslizable. Sin imágenes, muestra un hueco neutro.
export function AntesDespues({ antes, despues, etiquetaAntes = 'Hoy', etiquetaDespues = 'Simulación a 8 semanas' }: { antes?: string; despues?: string; etiquetaAntes?: string; etiquetaDespues?: string }) {
  const [x, setX] = useState(50)
  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)))
  }
  return (
    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-suave touch-none cursor-ew-resize select-none"
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
          <div className="absolute inset-0 grid place-items-center bg-[#e9efee] text-marca-media"><UserFocus size={120} weight="thin" /></div>
          <div className="absolute inset-0 grid place-items-center bg-marca-suave text-marca" style={{ clipPath: `inset(0 0 0 ${x}%)` }}><UserFocus size={120} weight="thin" /></div>
        </>
      )}
      <div className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${x}%` }}>
        <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white text-tinta grid place-items-center shadow-[0_4px_16px_rgba(15,27,29,.18)]"><ArrowsLeftRight size={20} /></span>
      </div>
      <span className="absolute bottom-3 left-3 text-xs font-medium bg-white/90 text-tinta rounded-md px-2 py-1">{etiquetaAntes}</span>
      <span className="absolute bottom-3 right-3 text-xs font-medium bg-white/90 text-tinta rounded-md px-2 py-1">{etiquetaDespues}</span>
    </div>
  )
}
