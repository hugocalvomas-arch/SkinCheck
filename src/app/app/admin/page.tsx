import Link from 'next/link'
import { redirect } from 'next/navigation'
import { usuarioActual } from '@/lib/auth'
import { crearFarmacia } from './actions'

export default async function Admin() {
  const { sb, esAdmin } = await usuarioActual()
  if (!esAdmin) redirect('/app')
  const [{ data: farmacias }, { count: pendientes }, { count: conCodigo }] = await Promise.all([
    sb.from('farmacias').select('id, nombre, programa_gestion, creada').order('nombre'),
    sb.from('sin_clasificar').select('*', { count: 'exact', head: true }),
    sb.from('productos').select('*', { count: 'exact', head: true }).or('ean.not.is.null,cn.not.is.null'),
  ])
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Administración</h1>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/app/admin/sin-clasificar" className="bg-papel rounded-lg px-3 py-2 underline">
          {pendientes ?? 0} códigos sin clasificar
        </Link>
        <span className="bg-papel rounded-lg px-3 py-2">{conCodigo ?? 0} productos del catálogo con EAN o CN</span>
        <Link href="/app/admin/apis" className="bg-papel rounded-lg px-3 py-2 underline">Comparar APIs de análisis</Link>
      </div>

      <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-4">
        <h2 className="font-medium">Nueva farmacia</h2>
        <form action={crearFarmacia} className="flex flex-wrap gap-3">
          <input name="nombre" required placeholder="Nombre de la farmacia" className="border rounded-lg px-3 py-2 flex-1 min-w-56" />
          <select name="programa" className="border rounded-lg px-2 py-2">
            <option value="">Programa de gestión</option>
            <option value="farmatic">Farmatic</option>
            <option value="nixfarma">Nixfarma</option>
            <option value="unycop">Unycop</option>
            <option value="iofwin">IOFWin</option>
            <option value="bitfarma">Bitfarma</option>
            <option value="otro">Otro</option>
          </select>
          <button className="btn">Crear</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Farmacias ({farmacias?.length ?? 0})</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {farmacias?.map((f) => (
            <li key={f.id}>
              <Link href={`/app/admin/f/${f.id}`} className="block bg-papel rounded-[var(--radius-card)] border border-linea p-6 hover:shadow">
                <div className="font-medium">{f.nombre}</div>
                <div className="text-sm text-gris">{f.programa_gestion ?? 'Programa sin indicar'}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
