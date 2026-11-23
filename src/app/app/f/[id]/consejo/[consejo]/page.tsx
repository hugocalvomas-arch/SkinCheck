/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { usuarioActual } from '@/lib/auth'
import { marcarVendida } from '../actions'

const eur = (n: number | null) => (n == null ? '' : n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }))
const TURNO: Record<string, string> = { AM: 'Mañana', PM: 'Noche', AMPM: 'Mañana y noche' }

export default async function Resultado({ params }: { params: Promise<{ id: string; consejo: string }> }) {
  const { id, consejo } = await params
  const { sb } = await usuarioActual()
  const { data: c } = await sb.from('consejos').select('id, rutinas, rutina_vendida, creado').eq('id', consejo).eq('farmacia_id', id).maybeSingle()
  if (!c) return <p>Consejo no encontrado.</p>
  const R = c.rutinas as any
  if (R.sin_rutina) return <p className="bg-amber-50 rounded-xl p-5">{R.sin_rutina}</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Rutinas propuestas</h1>
        <Link href={`/app/f/${id}/consejo`} className="ml-auto text-sm underline">Nuevo consejo</Link>
      </div>

      {R.productos_en_stock < 20 && (
        <p className="text-sm bg-amber-50 text-amber-900 rounded-lg p-3">
          Solo hay {R.productos_en_stock} productos reconocidos con stock en esta farmacia. Con tan pocos, algunos pasos pueden quedar sin producto.
        </p>
      )}

      {R.derivacion?.length > 0 && (
        <section className="bg-red-50 text-red-900 rounded-xl p-5 space-y-2">
          <h2 className="font-medium">Recomienda consulta</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">{R.derivacion.map((d: any, i: number) => <li key={i}>{d.texto}</li>)}</ul>
        </section>
      )}

      {R.perfil?.problemas?.length > 0 && (
        <p className="text-sm text-neutral-700">
          <b>Qué se trabaja, por orden:</b> {R.perfil.problemas.map((p: any) => p.corto || p.nombre).join(' · ')}
        </p>
      )}

      {R.rutinas.completa.ingredientes?.length > 0 && (
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-3 text-sm">
          <h2 className="font-medium">Ingredientes recomendados</h2>
          <ul className="space-y-2">
            {R.rutinas.completa.ingredientes.map((o: any, i: number) => (
              <li key={i}>
                <b>{o.nombre}</b>
                <span className="text-neutral-500"> · {o.papel === 'prioridad' ? 'primero' : o.papel === 'siguiente' ? 'después' : o.papel === 'alternativa' ? 'alternativa' : 'más adelante'}{o.turno ? ` · ${TURNO[o.turno] ?? o.turno}` : ''}</span>
                <div className="text-neutral-700">{o.por_que}{o.motivo ? ` ${o.motivo}` : ''}</div>
                {o.limite && <div className="text-neutral-500">Límite: {o.limite}</div>}
              </li>
            ))}
          </ul>
          {R.rutinas.completa.prioridad?.razones?.length > 0 && (
            <p className="text-neutral-600"><b>Por qué {R.rutinas.completa.prioridad.nombre} va primero:</b> {R.rutinas.completa.prioridad.razones.join(' ')}</p>
          )}
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {(['basica', 'media', 'completa'] as const).map((k) => {
          const r = R.rutinas[k]
          const vendida = c.rutina_vendida === k
          return (
            <section key={k} className={`bg-white rounded-xl p-5 shadow-sm space-y-4 ${vendida ? 'ring-2 ring-green-600' : ''}`}>
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold text-lg">{r.nombre}</h2>
                <span className="ml-auto font-semibold">{eur(r.total)}</span>
              </div>
              <ol className="space-y-3 text-sm">
                {r.productos.map((p: any, i: number) => (
                  <li key={i} className="border-t pt-2">
                    <div className="text-xs text-neutral-500">{p.paso} · {TURNO[p.turno] ?? p.turno}{p.aparte ? ' · aparte' : ''}</div>
                    {p.producto ? (
                      <>
                        <div className="font-medium">{p.marca} {p.producto}</div>
                        <div className="text-neutral-600">{p.para}{p.dosis ? ` (${p.dosis})` : ''}</div>
                        {p.ademas?.length > 0 && <div className="text-xs text-green-800">Además: {p.ademas.join('; ')}</div>}
                        <div>{eur(p.precio)}</div>
                      </>
                    ) : (
                      <div className="text-neutral-500">Sin producto en stock. {p.motivo}</div>
                    )}
                  </li>
                ))}
              </ol>
              {r.escalado && <p className="text-xs text-neutral-600">{r.escalado}</p>}
              <Link href={`/app/f/${id}/consejo/${c.id}/hoja?nivel=${k}`} className="block text-center border rounded-lg px-3 py-2 text-sm">Hoja de consejo</Link>
              <form action={marcarVendida}>
                <input type="hidden" name="farmacia" value={id} />
                <input type="hidden" name="consejo" value={c.id} />
                <input type="hidden" name="nivel" value={k} />
                <button className={`w-full rounded-lg px-3 py-2 text-sm ${vendida ? 'bg-green-700 text-white' : 'border'}`}>
                  {vendida ? 'Vendida' : 'Marcar como vendida'}
                </button>
              </form>
            </section>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {R.no_recomiendo?.length > 0 && (
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-2">
            <h2 className="font-medium">Qué evitar</h2>
            <ul className="list-disc pl-5 space-y-1">{R.no_recomiendo.map((v: any, i: number) => <li key={i}><b>{v.activos.join(', ')}</b>: {v.motivo}</li>)}</ul>
          </section>
        )}
        {R.rutinas.completa.avisos?.length > 0 && (
          <section className="bg-white rounded-xl p-5 shadow-sm space-y-2">
            <h2 className="font-medium">Cómo empezar</h2>
            <ul className="list-disc pl-5 space-y-1">{R.rutinas.completa.avisos.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
          </section>
        )}
      </div>
      <form action={marcarVendida}>
        <input type="hidden" name="farmacia" value={id} />
        <input type="hidden" name="consejo" value={c.id} />
        <input type="hidden" name="nivel" value="ninguna" />
        <button className="text-sm text-neutral-500 underline">{c.rutina_vendida === 'ninguna' ? 'Marcado: no compró' : 'No compró ninguna'}</button>
      </form>
      <p className="text-xs text-neutral-500">Esto no es un diagnóstico ni sustituye a una consulta médica.</p>
    </div>
  )
}
