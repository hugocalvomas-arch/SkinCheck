'use client'
import { useState } from 'react'

// Imprimir / guardar PDF y enviar por WhatsApp. El teléfono no se guarda.
export function Acciones({ texto }: { texto: string }) {
  const [tel, setTel] = useState('')
  const limpio = tel.replace(/\D/g, '')
  const numero = limpio.length === 9 ? '34' + limpio : limpio
  return (
    <div className="flex flex-wrap gap-3 items-center print:hidden border-t pt-4">
      <button onClick={() => window.print()} className="btn">Imprimir o guardar PDF</button>
      <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Móvil del cliente" inputMode="tel" className="btn-sec text-sm w-40" />
      <a
        href={numero.length >= 11 ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`rounded-lg px-4 py-2 text-sm ${numero.length >= 11 ? 'bg-marca text-sobre-marca' : 'bg-linea text-gris pointer-events-none'}`}
      >
        Enviar por WhatsApp
      </a>
    </div>
  )
}
