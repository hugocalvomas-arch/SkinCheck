import { usuarioActual } from '@/lib/auth'
import { SubirCsv } from './SubirCsv'

export default async function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: farmacia } = await sb.from('farmacias').select('id, nombre, mapeo_csv, programa_gestion').eq('id', id).maybeSingle()
  if (!farmacia) return <p>No tienes acceso a esta farmacia.</p>
  const [{ count: enStock }, { count: pendientes }, { data: ultimo }] = await Promise.all([
    sb.from('stock').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
    sb.from('sin_clasificar').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
    sb.from('stock').select('actualizado').eq('farmacia_id', id).order('actualizado', { ascending: false }).limit(1),
  ])
  const fecha = ultimo?.[0]?.actualizado ? new Date(ultimo[0].actualizado) : null
  const viejo = fecha && Date.now() - fecha.getTime() > 14 * 864e5
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stock · {farmacia.nombre}</h1>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="bg-white rounded-lg px-3 py-2 shadow-sm">{enStock ?? 0} productos reconocidos</span>
        <span className="bg-white rounded-lg px-3 py-2 shadow-sm">{pendientes ?? 0} sin clasificar</span>
        <span className={`rounded-lg px-3 py-2 shadow-sm ${viejo ? 'bg-amber-100' : 'bg-white'}`}>
          {fecha ? `Actualizado el ${fecha.toLocaleDateString('es-ES')}` : 'Sin stock cargado'}
          {viejo && ' · stock desactualizado'}
        </span>
      </div>
      <SubirCsv farmaciaId={id} mapeoGuardado={farmacia.mapeo_csv ?? {}} programaGuardado={farmacia.programa_gestion ?? ''} />
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
