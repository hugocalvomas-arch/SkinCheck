/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { ArrowRight, ChatCircleText, Check, DeviceTablet, Package } from '@phosphor-icons/react/dist/ssr'
import { usuarioActual } from '@/lib/auth'

const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fecha = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const haceDias = (n: number) => new Date(Date.now() - n * 864e5).toISOString()
const NIVEL: Record<string, string> = { basica: 'Básica', media: 'Media', completa: 'Completa', ninguna: 'No compró' }

// Inicio de la farmacia: lo importante de un vistazo y el siguiente paso claro.
export default async function InicioFarmacia({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: f } = await sb.from('farmacias').select('nombre, stock_subido, stock_filas').eq('id', id).maybeSingle()
  if (!f) return <p>No tienes acceso a esta farmacia.</p>
  const hace30 = haceDias(30)
  const [{ count: enStock }, { count: sinClasificar }, { data: consejos }] = await Promise.all([
    sb.from('stock').select('*', { count: 'exact', head: true }).eq('farmacia_id', id).gt('unidades', 0),
    sb.from('sin_clasificar').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
    sb.from('consejos').select('id, creado, rutina_vendida, rutinas, respuestas').eq('farmacia_id', id).gte('creado', hace30).order('creado', { ascending: false }).limit(1000),
  ])
  const lista = consejos ?? []
  const vendidas = lista.filter((c: any) => c.rutina_vendida && c.rutina_vendida !== 'ninguna')
  const venta = vendidas.reduce((s: number, c: any) => s + (c.rutinas?.rutinas?.[c.rutina_vendida]?.total ?? 0), 0)
  const conversion = lista.length ? Math.round((vendidas.length / lista.length) * 100) : 0
  const tieneStock = (enStock ?? 0) > 0

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-[2rem] leading-tight">{f.nombre}</h1>
          <p className="text-gris">Resumen de los últimos 30 días</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/app/f/${id}/consejo`} className="btn-sec"><ChatCircleText size={20} /> Consejo en mostrador</Link>
          <a href={`/kiosko/${id}`} target="_blank" rel="noopener" className="btn"><DeviceTablet size={20} /> Abrir modo iPad</a>
        </div>
      </header>

      {!tieneStock && (
        <section className="border-t-2 border-tinta pt-6 space-y-5">
          <h2 className="text-xl">Ponlo en marcha en dos pasos</h2>
          <ol className="grid md:grid-cols-2 gap-4">
            <li className="rounded-[var(--radius-card)] bg-marca-suave p-6 space-y-3">
              <p className="font-medium">1. Sube tu stock</p>
              <p className="text-gris">Exporta el listado de parafarmacia desde tu programa de gestión y súbelo. Así solo se recomienda lo que tienes.</p>
              <Link href={`/app/f/${id}/stock`} className="btn">Subir stock <ArrowRight size={18} /></Link>
            </li>
            <li className="rounded-[var(--radius-card)] border border-linea p-6 space-y-3">
              <p className="font-medium">2. Deja el iPad en el mostrador</p>
              <p className="text-gris">Abre el modo iPad en Safari y añádelo a la pantalla de inicio para verlo a pantalla completa.</p>
              <a href={`/kiosko/${id}`} target="_blank" rel="noopener" className="btn-sec">Abrir modo iPad</a>
            </li>
          </ol>
        </section>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 border-y border-linea">
        <Kpi t="Análisis" v={String(lista.length)} />
        <Kpi t="Rutinas vendidas" v={String(vendidas.length)} d={lista.length ? `${conversion} % de los análisis` : undefined} />
        <Kpi t="Venta estimada" v={eur(venta)} />
        <Kpi t="Ticket medio" v={vendidas.length ? eur(venta / vendidas.length) : '-'} />
      </section>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <section>
          <div className="flex items-center pb-3 border-b border-tinta">
            <h2 className="text-lg">Últimos análisis</h2>
            <Link href={`/app/f/${id}/panel`} className="ml-auto text-sm enlace">Ver resultados</Link>
          </div>
          {lista.length ? (
            <ul className="divide-y divide-linea">
              {lista.slice(0, 6).map((c: any) => (
                <li key={c.id}>
                  <Link href={`/app/f/${id}/consejo/${c.id}`} className="flex items-center gap-4 px-2 py-3.5 hover:bg-suave transition-colors duration-100">
                    <span className="cifra text-sm text-gris w-32 shrink-0">{fecha(c.creado)}</span>
                    <span className="flex-1 truncate">{(c.rutinas?.perfil?.problemas ?? []).slice(0, 2).map((p: any) => p.corto || p.nombre).join(', ') || 'Rutina general'}</span>
                    <span className={`text-sm ${c.rutina_vendida && c.rutina_vendida !== 'ninguna' ? 'text-marca font-medium' : 'text-gris'}`}>
                      {c.rutina_vendida ? NIVEL[c.rutina_vendida] : 'Sin marcar'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="py-5 text-gris">Todavía no hay análisis. Abre el modo iPad para empezar.</p>}
        </section>

        <section className="rounded-[var(--radius-card)] bg-suave p-6 space-y-4">
          <h2 className="text-lg flex items-center gap-2"><Package size={20} className="text-marca" /> Stock</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-sm text-gris">Productos con stock</dt><dd className="cifra text-[1.75rem] mt-1">{enStock ?? 0}</dd></div>
            <div><dt className="text-sm text-gris">Sin reconocer</dt><dd className="cifra text-[1.75rem] mt-1">{sinClasificar ?? 0}</dd></div>
          </dl>
          <p className="text-sm text-gris flex items-center gap-2">
            {f.stock_subido ? <><Check size={16} className="text-marca" /> Actualizado el {new Date(f.stock_subido).toLocaleDateString('es-ES')}</> : 'Aún no has subido el stock.'}
          </p>
          <Link href={`/app/f/${id}/stock`} className="btn-sec w-full">Actualizar stock</Link>
        </section>
      </div>
    </div>
  )
}

function Kpi({ t, v, d }: { t: string; v: string; d?: string }) {
  return (
    <div className="py-6 pr-6 [&:not(:first-child)]:pl-6 [&:not(:first-child)]:border-l border-linea max-lg:[&:nth-child(3)]:border-l-0 max-lg:[&:nth-child(3)]:pl-0 max-lg:[&:nth-child(n+3)]:border-t">
      <p className="text-sm text-gris">{t}</p>
      <p className="cifra text-[2.25rem] leading-none mt-3 text-tinta">{v}</p>
      {d && <p className="text-sm text-gris mt-1">{d}</p>}
    </div>
  )
}
