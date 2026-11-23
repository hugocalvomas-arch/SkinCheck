import Link from 'next/link'
import { redirect } from 'next/navigation'
import { usuarioActual } from '@/lib/auth'
import { FilaClasificar, type Pendiente } from './FilaClasificar'

export default async function SinClasificar() {
  const { sb, esAdmin } = await usuarioActual()
  if (!esAdmin) redirect('/app')
  const { data } = await sb
    .from('sin_clasificar')
    .select('codigo, ean, cn, descripcion, marca, pvp, unidades, farmacia_id')
    .order('codigo')
    .limit(5000)
  // agrupar el mismo código de varias farmacias: primero los que más farmacias tienen
  const grupos = new Map<string, Pendiente>()
  for (const r of data ?? []) {
    const g = grupos.get(r.codigo)
    if (g) {
      g.farmacias += 1
      g.unidades += Number(r.unidades ?? 0)
    } else
      grupos.set(r.codigo, {
        codigo: r.codigo,
        ean: r.ean,
        cn: r.cn,
        descripcion: r.descripcion ?? '',
        marca: r.marca ?? '',
        pvp: r.pvp,
        farmacias: 1,
        unidades: Number(r.unidades ?? 0),
      })
  }
  const lista = [...grupos.values()].sort((a, b) => b.farmacias - a.farmacias || b.unidades - a.unidades).slice(0, 100)
  return (
    <div className="space-y-6">
      <Link href="/app/admin" className="text-sm text-neutral-500">← Administración</Link>
      <h1 className="text-2xl font-semibold">Sin clasificar</h1>
      <p className="text-sm text-neutral-600">
        {grupos.size} códigos distintos. Se muestran los 100 que más farmacias tienen. Busca el producto en tu catálogo y asócialo:
        se guarda su EAN o CN y pasa al stock de todas esas farmacias.
      </p>
      <ul className="space-y-3">
        {lista.map((p) => <FilaClasificar key={p.codigo} p={p} />)}
      </ul>
    </div>
  )
}
