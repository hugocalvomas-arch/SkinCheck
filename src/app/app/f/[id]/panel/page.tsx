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
      <h2 className="text-lg">{t}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-linea">
        {[
          ['Consejos', String(r.consejos)],
          ['Rutinas vendidas', `${r.vendidas} (${r.conversion} %)`],
          ['Venta estimada', eur(r.venta)],
          ['Ticket medio', eur(r.ticket)],
        ].map(([k, v]) => (
          <div key={k} className="py-5 pr-5 [&:not(:first-child)]:pl-5 [&:not(:first-child)]:border-l border-linea max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(3)]:pl-0 max-sm:[&:nth-child(n+3)]:border-t">
            <div className="text-sm text-gris">{k}</div>
            <div className="cifra text-[1.75rem] leading-none mt-3">{v}</div>
          </div>
        ))}
      </div>
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm m-0">
        {[['Básica', r.porNivel.basica], ['Media', r.porNivel.media], ['Completa', r.porNivel.completa]].map(([n, x]) => (
          <div key={n as string} className="flex gap-2"><dt className="text-gris">{n}</dt><dd className="m-0 cifra">{x}</dd></div>
        ))}
        {r.sinMarcar > 0 && <div className="text-aviso">{r.sinMarcar} consejos sin marcar si se vendieron</div>}
      </dl>
    </section>
  )

  return (
    <div className="space-y-8">
      <div className="grid gap-1">
        <h1 className="text-[2rem] leading-tight">Resultados</h1>
        <p className="text-gris">{f.nombre}</p>
      </div>
      <Tarjetas t="Últimos 30 días" r={mes} />
      <Tarjetas t="Desde el principio" r={total} />
      <section className="space-y-2">
        <h2 className="font-medium">Últimos consejos</h2>
        <ul className="bg-papel rounded-[var(--radius-card)] border border-linea divide-y text-sm">
          {consejos.slice(0, 20).map((c) => (
            <li key={c.id} className="px-4 py-2 flex gap-3">
              <span>{new Date(c.creado).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })}</span>
              <span className="text-gris">{c.rutina_vendida ? (c.rutina_vendida === 'ninguna' ? 'No compró' : `Vendida: ${c.rutina_vendida}`) : 'Sin marcar'}</span>
              <Link href={`/app/f/${id}/consejo/${c.id}`} className="ml-auto underline">Ver</Link>
            </li>
          ))}
          {!consejos.length && <li className="px-4 py-3 text-gris">Todavía no hay consejos.</li>}
        </ul>
      </section>
      <p className="text-xs text-gris">La venta estimada suma el precio de la rutina marcada como vendida. El % de reposición llegará con los recordatorios.</p>
    </div>
  )
}
