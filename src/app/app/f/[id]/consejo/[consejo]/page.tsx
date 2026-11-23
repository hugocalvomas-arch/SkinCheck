/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { usuarioActual } from '@/lib/auth'
import { marcarVendida } from '../actions'
import { FotoAnalisis } from './FotoAnalisis'

const eur = (n: number | null) => (n == null ? '' : n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }))
const TURNO: Record<string, string> = { AM: 'Mañana', PM: 'Noche', AMPM: 'Mañana y noche' }

export default async function Resultado({ params }: { params: Promise<{ id: string; consejo: string }> }) {
  const { id, consejo } = await params
  const { sb } = await usuarioActual()
  const { data: c } = await sb.from('consejos').select('id, rutinas, rutina_vendida, creado, puntuaciones_foto').eq('id', consejo).eq('farmacia_id', id).maybeSingle()
  if (!c) return <p>Consejo no encontrado.</p>
  const R = c.rutinas as any
  if (R.sin_rutina) return <p className="bg-aviso-suave rounded-[var(--radius-card)] p-5">{R.sin_rutina}</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[2rem] leading-tight">Rutinas propuestas</h1>
        <Link href={`/app/f/${id}/consejo`} className="ml-auto text-sm underline">Nuevo consejo</Link>
      </div>

      {c.puntuaciones_foto?.puntuaciones && <FotoAnalisis f={c.puntuaciones_foto} />}

      {R.productos_en_stock < 20 && (
        <p className="text-sm bg-aviso-suave text-aviso rounded-lg p-3">
          Solo hay {R.productos_en_stock} productos reconocidos con stock en esta farmacia. Con tan pocos, algunos pasos pueden quedar sin producto.
        </p>
      )}

      {R.derivacion?.length > 0 && (
        <section className="bg-aviso-suave text-aviso rounded-[var(--radius-card)] p-5 space-y-2">
          <h2 className="font-medium">Recomienda consulta</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">{R.derivacion.map((d: any, i: number) => <li key={i}>{d.texto}</li>)}</ul>
        </section>
      )}

      {R.perfil?.problemas?.length > 0 && (
        <p className="text-sm text-tinta-2">
          <b>Qué se trabaja, por orden:</b> {R.perfil.problemas.map((p: any) => p.corto || p.nombre).join(', ')}
        </p>
      )}

      {R.rutinas.completa.ingredientes?.length > 0 && (
        <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-3 text-sm">
          <h2 className="font-medium">Ingredientes recomendados</h2>
          <ul className="space-y-2">
            {R.rutinas.completa.ingredientes.map((o: any, i: number) => (
              <li key={i}>
                <b>{o.nombre}</b>
                <span className="text-gris">, {o.papel === 'prioridad' ? 'primero' : o.papel === 'siguiente' ? 'después' : o.papel === 'alternativa' ? 'alternativa' : 'más adelante'}{o.turno ? `, ${TURNO[o.turno] ?? o.turno}` : ''}</span>
                <div className="text-tinta-2">{o.por_que}{o.motivo ? ` ${o.motivo}` : ''}</div>
                {o.limite && <div className="text-gris">Límite: {o.limite}</div>}
              </li>
            ))}
          </ul>
          {R.rutinas.completa.prioridad?.razones?.length > 0 && (
            <p className="text-gris"><b>Por qué {R.rutinas.completa.prioridad.nombre} va primero:</b> {R.rutinas.completa.prioridad.razones.join(' ')}</p>
          )}
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {(['basica', 'media', 'completa'] as const).map((k) => {
          const r = R.rutinas[k]
          const vendida = c.rutina_vendida === k
          return (
            <section key={k} className={`bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-4 ${vendida ? 'ring-2 ring-marca' : ''}`}>
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold text-lg">{r.nombre}</h2>
                <span className="ml-auto font-semibold">{eur(r.total)}</span>
              </div>
              <ol className="space-y-3 text-sm">
                {r.productos.map((p: any, i: number) => (
                  <li key={i} className="border-t pt-2">
                    <div className="text-xs text-gris">{p.paso}, {(TURNO[p.turno] ?? p.turno).toLowerCase()}{p.aparte ? ', aparte' : ''}</div>
                    {p.producto ? (
                      <>
                        <div className="font-medium">{p.marca} {p.producto}</div>
                        <div className="text-gris">{p.para}{p.dosis ? ` (${p.dosis})` : ''}</div>
                        {p.ademas?.length > 0 && <div className="text-xs text-marca">Además: {p.ademas.join('; ')}</div>}
                        <div>{eur(p.precio)}</div>
                      </>
                    ) : (
                      <div className="text-gris">Sin producto en stock. {p.motivo}</div>
                    )}
                  </li>
                ))}
              </ol>
              {r.escalado && <p className="text-xs text-gris">{r.escalado}</p>}
              <Link href={`/app/f/${id}/consejo/${c.id}/hoja?nivel=${k}`} className="btn-sec w-full text-sm">Hoja de consejo</Link>
              <form action={marcarVendida}>
                <input type="hidden" name="farmacia" value={id} />
                <input type="hidden" name="consejo" value={c.id} />
                <input type="hidden" name="nivel" value={k} />
                <button className={`w-full text-sm ${vendida ? 'btn' : 'btn-sec'}`}>
                  {vendida ? 'Vendida' : 'Marcar como vendida'}
                </button>
              </form>
            </section>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {R.no_recomiendo?.length > 0 && (
          <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-2">
            <h2 className="font-medium">Qué evitar</h2>
            <ul className="list-disc pl-5 space-y-1">{R.no_recomiendo.map((v: any, i: number) => <li key={i}><b>{v.activos.join(', ')}</b>: {v.motivo}</li>)}</ul>
          </section>
        )}
        {R.rutinas.completa.avisos?.length > 0 && (
          <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-2">
            <h2 className="font-medium">Cómo empezar</h2>
            <ul className="list-disc pl-5 space-y-1">{R.rutinas.completa.avisos.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
          </section>
        )}
      </div>
      <form action={marcarVendida}>
        <input type="hidden" name="farmacia" value={id} />
        <input type="hidden" name="consejo" value={c.id} />
        <input type="hidden" name="nivel" value="ninguna" />
        <button className="text-sm text-gris underline">{c.rutina_vendida === 'ninguna' ? 'Marcado: no compró' : 'No compró ninguna'}</button>
      </form>
      <p className="text-xs text-gris">Esto no es un diagnóstico ni sustituye a una consulta médica.</p>
    </div>
  )
}
