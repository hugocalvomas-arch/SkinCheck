'use client'
import { useState, useTransition } from 'react'
import { cambiarSinStock } from './actions'

// Interruptor: recomendar solo lo que hay en la estantería, o también lo que la farmacia puede pedir
export function SinStock({ farmaciaId, inicial }: { farmaciaId: string; inicial: boolean }) {
  const [activo, setActivo] = useState(inicial)
  const [error, setError] = useState<string | null>(null)
  const [cargando, empezar] = useTransition()
  const cambiar = () => {
    const nuevo = !activo
    setActivo(nuevo)
    setError(null)
    empezar(async () => {
      const r = await cambiarSinStock(farmaciaId, nuevo)
      if ('error' in r) { setActivo(!nuevo); setError(r.error ?? 'error') }
    })
  }
  return (
    <section className="rounded-[var(--radius-card)] border border-linea p-6 grid gap-3">
      <div className="flex items-start gap-4">
        <div className="grid gap-1 flex-1">
          <h2 className="text-lg">Recomendar productos que no tengo en stock</h2>
          <p className="text-gris text-sm max-w-[65ch]">
            {activo
              ? 'Activado. Se recomienda primero lo que tienes. Si para un paso no tienes nada que sirva, se propone un producto del catálogo marcado como «Bajo pedido», para que se lo pidas a la clienta.'
              : 'Desactivado. Solo se recomienda lo que tienes en la estantería. Si para un paso no tienes nada que sirva, ese paso queda sin producto.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label="Recomendar productos que no tengo en stock"
          disabled={cargando}
          onClick={cambiar}
          className={`relative shrink-0 w-14 h-8 rounded-full transition-colors duration-150 ${activo ? 'bg-marca' : 'bg-linea'} disabled:opacity-60`}
        >
          <span className={`absolute top-1 left-1 size-6 rounded-full bg-papel shadow transition-transform duration-150 ${activo ? 'translate-x-6' : ''}`} />
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-aviso">{error}</p>}
    </section>
  )
}
