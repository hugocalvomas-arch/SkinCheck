/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { usuarioActual } from '@/lib/auth'

const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

// Panel del titular: consejos, rutinas vendidas y venta estimada en los últimos 30 días y en total.
export default async function Panel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: f } = await sb.from('farmacias').select('nombre').eq('id', id).maybeSingle()
  if (!f) return <p>No tienes acceso a esta farmacia.</p>
  const { data } = await sb.from('consejos').select('id, creado, rutina_vendida, rutinas').eq('farmacia_id', id).order('creado', { ascending: false }).limit(2000)
  const consejos = data ?? []
  const hace30 = Date.now() - 30 * 864e5

  const resumen = (lista: any[]) => {
    const vendidas = lista.filter((c) => c.rutina_vendida && c.rutina_vendida !== 'ninguna')
    const venta = vendidas.reduce((s, c) => s + (c.rutinas?.rutinas?.[c.rutina_vendida]?.total ?? 0), 0)
    const porNivel = { basica: 0, media: 0, completa: 0 } as Record<string, number>
    vendidas.forEach((c) => (porNivel[c.rutina_vendida] = (porNivel[c.rutina_vendida] ?? 0) + 1))
    return {
      consejos: lista.length,
      vendidas: vendidas.length,
      conversion: lista.length ? Math.round((vendidas.length / lista.length) * 100) : 0,
      venta,
      ticket: vendidas.length ? venta / vendidas.length : 0,
      porNivel,
      sinMarcar: lista.filter((c) => !c.rutina_vendida).length,
    }
  }
  const mes = resumen(consejos.filter((c) => new Date(c.creado).getTime() >= hace30))
  const total = resumen(consejos)

  const Tarjetas = ({ t, r }: { t: string; r: ReturnType<typeof resumen> }) => (
    <section className="space-y-3">
      <h2 className="font-medium">{t}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Consejos', String(r.consejos)],
          ['Rutinas vendidas', `${r.vendidas} (${r.conversion} %)`],
          ['Venta estimada', eur(r.venta)],
          ['Ticket medio', eur(r.ticket)],
        ].map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-xs text-neutral-500">{k}</div>
            <div className="text-xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-neutral-600">
        Básica {r.porNivel.basica} · Media {r.porNivel.media} · Completa {r.porNivel.completa}
        {r.sinMarcar > 0 && ` · ${r.sinMarcar} consejos sin marcar si se vendieron`}
      </p>
    </section>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Panel · {f.nombre}</h1>
      <Tarjetas t="Últimos 30 días" r={mes} />
      <Tarjetas t="Desde el principio" r={total} />
      <section className="space-y-2">
        <h2 className="font-medium">Últimos consejos</h2>
        <ul className="bg-white rounded-xl shadow-sm divide-y text-sm">
          {consejos.slice(0, 20).map((c) => (
            <li key={c.id} className="px-4 py-2 flex gap-3">
              <span>{new Date(c.creado).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })}</span>
              <span className="text-neutral-500">{c.rutina_vendida ? (c.rutina_vendida === 'ninguna' ? 'No compró' : `Vendida: ${c.rutina_vendida}`) : 'Sin marcar'}</span>
              <Link href={`/app/f/${id}/consejo/${c.id}`} className="ml-auto underline">Ver</Link>
            </li>
          ))}
          {!consejos.length && <li className="px-4 py-3 text-neutral-500">Todavía no hay consejos.</li>}
        </ul>
      </section>
      <p className="text-xs text-neutral-500">La venta estimada suma el precio de la rutina marcada como vendida. El % de reposición llegará con los recordatorios.</p>
    </div>
  )
}
