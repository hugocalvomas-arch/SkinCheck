'use client'
import { useState, useTransition } from 'react'
import { buscarProductos, clasificar } from '../actions'

export type Pendiente = {
  codigo: string; ean: string | null; cn: string | null; descripcion: string; marca: string
  pvp: number | null; farmacias: number; unidades: number
}
type Producto = { id: string; marca: string; nombre: string; formato_ml: number | null; ean: string | null; cn: string | null }

export function FilaClasificar({ p }: { p: Pendiente }) {
  const [q, setQ] = useState(p.descripcion)
  const [res, setRes] = useState<Producto[] | null>(null)
  const [msg, setMsg] = useState('')
  const [hecho, setHecho] = useState(false)
  const [pendiente, start] = useTransition()

  if (hecho) return null
  return (
    <li className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-3 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="font-medium">{p.descripcion || '(sin descripción)'}</span>
        {p.marca && <span className="text-gris">{p.marca}</span>}
        <span className="text-gris">{p.ean ? `EAN ${p.ean}` : ''} {p.cn ? `CN ${p.cn}` : ''}</span>
        <span className="text-gris">{p.pvp ? `${p.pvp} €` : ''}</span>
        <span className="ml-auto text-gris">{p.farmacias} farmacia(s), {p.unidades} uds</span>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => setRes(await buscarProductos(q)))
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} className="border rounded-lg px-3 py-1.5 flex-1" placeholder="Buscar en el catálogo (marca o nombre)" />
        <button disabled={pendiente} className="border rounded-lg px-3 py-1.5">Buscar</button>
      </form>
      {res && res.length === 0 && <p className="text-gris">Nada encontrado. Prueba con menos palabras (por ejemplo, la marca y una palabra del nombre).</p>}
      {res && res.length > 0 && (
        <ul className="divide-y">
          {res.map((r) => (
            <li key={r.id} className="py-1.5 flex items-center gap-3">
              <span className="flex-1">
                <b>{r.marca}</b> {r.nombre} {r.formato_ml ? `· ${r.formato_ml} ml` : ''}
                {(r.ean || r.cn) && <span className="text-gris">, ya tiene {r.ean ? 'EAN' : 'CN'}</span>}
              </span>
              <button
                disabled={pendiente}
                className="btn"
                onClick={() =>
                  start(async () => {
                    const r2 = await clasificar(p.codigo, r.id)
                    if ('error' in r2) setMsg(r2.error ?? 'Error')
                    else setHecho(true)
                  })
                }
              >
                Asociar
              </button>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="text-error">{msg}</p>}
    </li>
  )
}
