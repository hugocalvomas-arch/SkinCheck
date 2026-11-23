import { usuarioActual } from '@/lib/auth'
import { SubirCsv } from './SubirCsv'

export default async function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: farmacia } = await sb.from('farmacias').select('id, nombre, mapeo_csv, programa_gestion, stock_subido, stock_filas').eq('id', id).maybeSingle()
  if (!farmacia) return <p>No tienes acceso a esta farmacia.</p>
  const [{ count: enStock }, { count: pendientes }, { data: reconocidos }, { data: sinClas }] = await Promise.all([
    sb.from('stock').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
    sb.from('sin_clasificar').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
    sb.from('stock').select('unidades, pvp, productos(marca, nombre)').eq('farmacia_id', id).order('unidades', { ascending: false }).limit(200),
    sb.from('sin_clasificar').select('codigo, ean, cn, descripcion, marca, pvp, unidades').eq('farmacia_id', id).order('descripcion').limit(200),
  ])
  const fecha = farmacia.stock_subido ? new Date(farmacia.stock_subido) : null
  const viejo = fecha && Date.now() - fecha.getTime() > 14 * 864e5
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stock · {farmacia.nombre}</h1>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="bg-white rounded-lg px-3 py-2 shadow-sm">{enStock ?? 0} productos reconocidos</span>
        <span className="bg-white rounded-lg px-3 py-2 shadow-sm">{pendientes ?? 0} sin clasificar</span>
        <span className={`rounded-lg px-3 py-2 shadow-sm ${viejo ? 'bg-amber-100' : 'bg-white'}`}>
          {fecha ? `Última subida: ${fecha.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })}${farmacia.stock_filas ? ` · ${farmacia.stock_filas} filas` : ''}` : 'Sin stock cargado'}
          {viejo && ' · stock desactualizado'}
        </span>
      </div>
      <SubirCsv farmaciaId={id} mapeoGuardado={farmacia.mapeo_csv ?? {}} programaGuardado={farmacia.programa_gestion ?? ''} />
      {(reconocidos?.length ?? 0) + (sinClas?.length ?? 0) > 0 && (
        <section className="bg-white rounded-xl p-6 shadow-sm space-y-3 text-sm">
          <h2 className="font-medium">Stock cargado</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-neutral-500"><th className="pr-3 pb-1">Producto</th><th className="pr-3 pb-1">Código</th><th className="pr-3 pb-1">PVP</th><th className="pr-3 pb-1">Stock</th><th className="pb-1">Estado</th></tr></thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(reconocidos ?? []).map((r: any, i: number) => (
                  <tr key={'r' + i} className="border-t"><td className="pr-3 py-1">{r.productos?.marca} {r.productos?.nombre}</td><td className="pr-3"></td><td className="pr-3">{r.pvp ?? ''}</td><td className="pr-3">{r.unidades}</td><td className="text-green-700">Reconocido</td></tr>
                ))}
                {(sinClas ?? []).map((r) => (
                  <tr key={r.codigo} className="border-t"><td className="pr-3 py-1">{r.descripcion}</td><td className="pr-3 text-neutral-500">{r.ean ? `EAN ${r.ean}` : `CN ${r.cn}`}</td><td className="pr-3">{r.pvp ?? ''}</td><td className="pr-3">{r.unidades ?? ''}</td><td className="text-amber-700">Sin clasificar</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {(pendientes ?? 0) > 0 && <p className="text-neutral-500">Los productos sin clasificar no se recomiendan hasta que se asocien al catálogo.</p>}
        </section>
      )}
      <details className="bg-white rounded-xl p-6 shadow-sm text-sm text-neutral-700">
        <summary className="font-medium cursor-pointer">Cómo exportar el stock desde tu programa</summary>
        <ul className="list-disc pl-5 mt-3 space-y-2">
          <li><b>Qué necesitamos:</b> código nacional (CN) y/o código de barras (EAN), descripción, PVP con IVA y stock actual. El laboratorio o la marca ayudan, pero no son obligatorios.</li>
          <li><b>Filtra solo parafarmacia o dermocosmética</b> (por familia) si tu programa lo permite. Así el archivo pesa menos.</li>
          <li><b>Farmatic:</b> saca el listado de artículos o de inventario con esos campos y expórtalo a Excel.</li>
          <li><b>Nixfarma:</b> Almacén → Inventario, marca los criterios, pulsa el icono de exportar y elige esos campos para Excel.</li>
          <li><b>Otros programas (Unycop, IOFWin, Bitfarma…):</b> cualquier listado de artículos exportado a Excel o CSV sirve.</li>
          <li>Se admiten .xlsx, .xls, .ods, .csv y .txt con separadores. Da igual que haya filas de título antes de la tabla.</li>
        </ul>
      </details>
    </div>
  )
}
