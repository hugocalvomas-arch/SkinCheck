'use client'
import { useState, useTransition } from 'react'
import type { Prueba } from '@/server/bancoApis'
import { probarProveedor } from './actions'

type P = { id: string; nombre: string; variables: string[]; listo: boolean }

export function Banco({ proveedores, nombres }: { proveedores: P[]; nombres: Record<string, string> }) {
  const [res, setRes] = useState<Record<string, Prueba[]>>({})
  const [enCurso, empezar] = useTransition()
  return (
    <section className="space-y-6">
      {proveedores.map((p) => (
        <div key={p.id} className="bg-papel rounded-[var(--radius-card)] border border-linea p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{p.nombre}</p>
              {!p.listo && <p className="text-sm text-gris">Falta en Vercel: {p.variables.join(', ')}</p>}
            </div>
            <button disabled={!p.listo || enCurso} onClick={() => empezar(async () => { const r = await probarProveedor(p.id); setRes((x) => ({ ...x, [p.id]: r })) })}
              className="rounded-lg px-4 py-2 bg-marca text-sobre-marca disabled:opacity-40">{enCurso ? 'Probando…' : 'Probar las dos caras'}</button>
          </div>
          {res[p.id] && (
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              {res[p.id].map((r) => (
                <div key={r.cara}>
                  <p className="font-medium mb-1">Cara {r.cara} · {(r.ms / 1000).toFixed(1)} s</p>
                  {r.error ? <p className="text-red-700">{r.error}</p> : (
                    <table className="w-full">
                      <tbody>
                        {r.medidas.map((m) => (
                          <tr key={m.clave} className="border-t border-linea">
                            <td className="py-0.5 font-mono text-xs">{m.clave}</td>
                            <td className="text-gris">{m.aspecto ? nombres[m.aspecto] : ''}</td>
                            <td className="text-right">{m.valor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
