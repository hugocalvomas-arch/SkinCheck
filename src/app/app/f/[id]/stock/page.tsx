import { usuarioActual } from '@/lib/auth'
import { SubirCsv } from './SubirCsv'
import { SinStock } from './SinStock'

export default async function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: farmacia } = await sb.from('farmacias').select('*').eq('id', id).maybeSingle()
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
      <div className="grid gap-1">
        <h1 className="text-[2rem] leading-tight">Stock</h1>
        <p className="text-gris">{farmacia.nombre}</p>
      </div>
      <dl className="grid sm:grid-cols-3 border-y border-linea m-0">
        <div className="py-5 sm:pr-6"><dt className="text-sm text-gris">Productos reconocidos</dt><dd className="cifra text-[2rem] leading-none mt-2 m-0">{enStock ?? 0}</dd></div>
        <div className="py-5 sm:px-6 sm:border-l max-sm:border-t border-linea"><dt className="text-sm text-gris">Sin clasificar</dt><dd className="cifra text-[2rem] leading-none mt-2 m-0">{pendientes ?? 0}</dd></div>
        <div className={`py-5 sm:px-6 sm:border-l max-sm:border-t border-linea ${viejo ? 'bg-aviso-suave text-aviso' : ''}`}><dt className={`text-sm ${viejo ? '' : 'text-gris'}`}>Última subida</dt><dd className="mt-2 m-0 font-medium">
          {fecha ? `Última subida: ${fecha.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })}${farmacia.stock_filas ? `, ${farmacia.stock_filas} filas` : ''}` : 'Sin stock cargado'}
          {viejo && '. Stock desactualizado'}</dd>
        </div>
      </dl>
      <SinStock farmaciaId={id} inicial={farmacia.recomendar_sin_stock === true} />
      <SubirCsv farmaciaId={id} mapeoGuardado={farmacia.mapeo_csv ?? {}} programaGuardado={farmacia.programa_gestion ?? ''} />
      {(reconocidos?.length ?? 0) + (sinClas?.length ?? 0) > 0 && (
        <section className="space-y-3 text-sm">
          <h2 className="text-lg">Stock cargado</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-gris border-b border-tinta"><th className="font-normal pr-3 py-2">Producto</th><th className="font-normal pr-3 py-2">Código</th><th className="font-normal pr-3 py-2 text-right">PVP</th><th className="font-normal pr-3 py-2 text-right">Stock</th><th className="font-normal py-2">Estado</th></tr></thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(reconocidos ?? []).map((r: any, i: number) => (
                  <tr key={'r' + i} className="border-b border-linea"><td className="pr-3 py-2.5">{r.productos?.marca} {r.productos?.nombre}</td><td className="pr-3"></td><td className="pr-3 text-right num">{r.pvp ?? ''}</td><td className="pr-3 text-right num">{r.unidades}</td><td className="text-marca">Reconocido</td></tr>
                ))}
                {(sinClas ?? []).map((r) => (
                  <tr key={r.codigo} className="border-b border-linea"><td className="pr-3 py-2.5">{r.descripcion}</td><td className="pr-3 cifra text-gris">{r.ean ? `EAN ${r.ean}` : `CN ${r.cn}`}</td><td className="pr-3 text-right num">{r.pvp ?? ''}</td><td className="pr-3 text-right num">{r.unidades ?? ''}</td><td className="text-aviso">Sin clasificar</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {(pendientes ?? 0) > 0 && <p className="text-gris">Los productos sin clasificar no se recomiendan hasta que se asocien al catálogo.</p>}
        </section>
      )}
      <details className="rounded-[var(--radius-card)] bg-suave p-6 text-sm text-tinta-2">
        <summary className="font-medium cursor-pointer text-tinta">Cómo exportar el stock desde tu programa</summary>
        <ul className="list-disc pl-5 mt-3 space-y-2">
          <li><b className="font-semibold text-tinta">Qué necesitamos:</b> código nacional (CN) y/o código de barras (EAN), descripción, PVP con IVA y stock actual. El laboratorio o la marca ayudan, pero no son obligatorios.</li>
          <li><b className="font-semibold text-tinta">Filtra solo parafarmacia o dermocosmética</b> (por familia) si tu programa lo permite. Así el archivo pesa menos.</li>
          <li><b className="font-semibold text-tinta">Farmatic:</b> saca el listado de artículos o de inventario con esos campos y expórtalo a Excel.</li>
          <li><b className="font-semibold text-tinta">Nixfarma:</b> Almacén → Inventario, marca los criterios, pulsa el icono de exportar y elige esos campos para Excel.</li>
          <li><b className="font-semibold text-tinta">Otros programas (Unycop, IOFWin, Bitfarma…):</b> cualquier listado de artículos exportado a Excel o CSV sirve.</li>
          <li>Se admiten .xlsx, .xls, .ods, .csv y .txt con separadores. Da igual que haya filas de título antes de la tabla.</li>
        </ul>
      </details>
    </div>
  )
}
