import Link from 'next/link'
import { redirect } from 'next/navigation'
import { usuarioActual } from '@/lib/auth'
import { quitarMiembro } from '../../actions'
import { AsignarMiembro } from './AsignarMiembro'

export default async function FarmaciaAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb, esAdmin } = await usuarioActual()
  if (!esAdmin) redirect('/app')
  const { data: f } = await sb.from('farmacias').select('id, nombre, programa_gestion').eq('id', id).maybeSingle()
  if (!f) return <p>Farmacia no encontrada.</p>
  const [{ data: miembros }, { count: stock }, { count: pendientes }] = await Promise.all([
    sb.rpc('admin_miembros', { p_farmacia: id }),
    sb.from('stock').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
    sb.from('sin_clasificar').select('*', { count: 'exact', head: true }).eq('farmacia_id', id),
  ])
  const lista = (miembros ?? []) as { user_id: string; email: string; rol: string }[]
  return (
    <div className="space-y-6">
      <Link href="/app/admin" className="text-sm text-gris">← Administración</Link>
      <h1 className="text-[2rem] leading-tight">{f.nombre}</h1>
      <p className="text-sm text-gris">
        {f.programa_gestion ?? 'Programa sin indicar'}, {stock ?? 0} productos en stock, {pendientes ?? 0} sin clasificar.{' '}
        <Link href={`/app/f/${id}/stock`} className="underline">Stock</Link>
      </p>
      <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-4">
        <h2 className="font-medium">Usuarios</h2>
        {lista.length === 0 && <p className="text-sm text-gris">Todavía no hay usuarios en esta farmacia.</p>}
        <ul className="divide-y text-sm">
          {lista.map((m) => (
            <li key={m.user_id} className="py-2 flex items-center gap-3">
              <span className="flex-1">{m.email}</span>
              <span className="text-gris">{m.rol}</span>
              <form action={quitarMiembro}>
                <input type="hidden" name="farmacia" value={id} />
                <input type="hidden" name="user" value={m.user_id} />
                <button className="text-error">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
        <AsignarMiembro farmaciaId={id} />
      </section>
    </div>
  )
}
