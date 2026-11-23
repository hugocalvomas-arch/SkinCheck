'use client'
import { useState, useTransition } from 'react'
import { BLOQUES, opciones, pendientes, visibles, type Respuestas } from '@/lib/cuestionario'
import { crearConsejo } from './actions'

export function Cuestionario({ farmaciaId }: { farmaciaId: string }) {
  const [r, setR] = useState<Respuestas>({})
  const [error, setError] = useState('')
  const [enviando, start] = useTransition()
  const faltan = pendientes(r)

  function elegir(id: string, v: string | number, multi?: boolean) {
    setR((prev) => {
      if (!multi) return { ...prev, [id]: v }
      const act: (string | number)[] = prev[id] || []
      let nuevo = act.includes(v) ? act.filter((x) => x !== v) : [...act, v]
      // "nada" excluye lo demás
      if (v === 'nada') nuevo = act.includes('nada') ? [] : ['nada']
      else nuevo = nuevo.filter((x) => x !== 'nada')
      return { ...prev, [id]: nuevo }
    })
  }

  const vis = visibles(r)
  return (
    <div className="space-y-8">
      {BLOQUES.map((b) => {
        const qs = vis.filter((q) => q.bloque === b)
        if (!qs.length) return null
        return (
          <section key={b} className="space-y-5">
            <h2 className="text-sm uppercase tracking-wide text-neutral-500">{b}</h2>
            {qs.map((q) => (
              <div key={q.id} className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                <p className="font-medium">{q.t}</p>
                {q.nota && <p className="text-sm text-neutral-500">{q.nota}</p>}
                <div className="flex flex-wrap gap-2">
                  {opciones(q, r).map(([v, txt, sub]) => {
                    const sel = q.multi ? (r[q.id] || []).includes(v) : r[q.id] === v
                    return (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => elegir(q.id, v, q.multi)}
                        className={`text-left rounded-lg border px-3 py-2 text-sm ${sel ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white hover:bg-neutral-50'}`}
                      >
                        {txt}
                        {sub && <span className={`block text-xs ${sel ? 'text-neutral-300' : 'text-neutral-500'}`}>{sub}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        )
      })}
      <div className="sticky bottom-0 bg-neutral-50 py-4 flex items-center gap-4">
        <button
          disabled={faltan.length > 0 || enviando}
          onClick={() => start(async () => { const res = await crearConsejo(farmaciaId, r); if (res?.error) setError(res.error) })}
          className="bg-neutral-900 text-white rounded-lg px-5 py-2.5 disabled:opacity-40"
        >
          {enviando ? 'Calculando…' : 'Ver rutinas'}
        </button>
        <span className="text-sm text-neutral-500">{faltan.length ? `Faltan ${faltan.length} preguntas` : 'Listo'}</span>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
