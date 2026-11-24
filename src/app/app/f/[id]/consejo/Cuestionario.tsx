'use client'
import { useState, useTransition } from 'react'
import { BLOQUES, opciones, pendientes, visibles, type Respuestas } from '@/lib/cuestionario'
import { crearConsejo } from './actions'
import { Camara } from './Camara'
import { AVISO_DETALLE, AVISO_INICIO } from '@/lib/privacidad'

export function Cuestionario({ farmaciaId, farmacia }: { farmaciaId: string; farmacia: string }) {
  const [acepta, setAcepta] = useState(false)
  const [r, setR] = useState<Respuestas>({})
  const [foto, setFoto] = useState<string | null>(null)
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
  // Las preguntas incluyen datos de salud (embarazo, tratamientos): primero se informa y se pide permiso expreso
  if (!acepta)
    return (
      <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-4 max-w-2xl">
        <h2 className="font-medium">Antes de empezar, lee esto con la clienta</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">{AVISO_INICIO(farmacia).map((t) => <li key={t}>{t}</li>)}</ul>
        <details className="text-sm text-gris">
          <summary className="cursor-pointer">Más información</summary>
          <ul className="list-disc pl-5 space-y-2 mt-2">{AVISO_DETALLE.map((t) => <li key={t}>{t}</li>)}</ul>
        </details>
        <button type="button" onClick={() => setAcepta(true)} className="btn">La clienta acepta</button>
      </section>
    )
  return (
    <div className="space-y-8">
      <Camara onFoto={setFoto} />
      {BLOQUES.map((b) => {
        const qs = vis.filter((q) => q.bloque === b)
        if (!qs.length) return null
        return (
          <section key={b} className="space-y-5">
            <h2 className="text-lg border-b border-tinta pb-2">{b}</h2>
            {qs.map((q) => (
              <div key={q.id} className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-3">
                <p className="font-medium">{q.t}</p>
                {q.nota && <p className="text-sm text-gris">{q.nota}</p>}
                <div className="flex flex-wrap gap-2">
                  {opciones(q, r).map(([v, txt, sub]) => {
                    const sel = q.multi ? (r[q.id] || []).includes(v) : r[q.id] === v
                    return (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => elegir(q.id, v, q.multi)}
                        className={`text-left rounded-lg border px-3 py-2 text-sm ${sel ? 'bg-marca-suave text-marca border-marca font-medium' : 'bg-papel border-linea hover:border-campo'}`}
                      >
                        {txt}
                        {sub && <span className={`block text-xs ${sel ? 'text-marca' : 'text-gris'}`}>{sub}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        )
      })}
      <div className="sticky bottom-0 bg-suave py-4 flex items-center gap-4">
        <button
          disabled={faltan.length > 0 || enviando}
          onClick={() => start(async () => { setError(''); const res = await crearConsejo(farmaciaId, r, foto, acepta); if (res?.error) setError(res.error) })}
          className="btn"
        >
          {enviando ? (foto ? 'Analizando la piel… (hasta 1 minuto)' : 'Calculando…') : 'Ver rutinas'}
        </button>
        <span className="text-sm text-gris">{faltan.length ? (faltan.length === 1 ? 'Falta 1 pregunta' : `Faltan ${faltan.length} preguntas`) : 'Listo'}</span>
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    </div>
  )
}
