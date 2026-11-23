import Link from 'next/link'
import { usuarioActual } from '@/lib/auth'

export default async function Inicio() {
  const { sb, esAdmin } = await usuarioActual()
  const { data: farmacias } = await sb.from('farmacias').select('id, nombre, programa_gestion').order('nombre')
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tus farmacias</h1>
      {!farmacias?.length && (
        <p className="text-neutral-600">
          {esAdmin ? 'Aún no hay farmacias. Créalas en Administración.' : 'Tu cuenta aún no está asociada a ninguna farmacia. Pide acceso a SkinCheck.'}
        </p>
      )}
      <ul className="grid sm:grid-cols-2 gap-4">
        {farmacias?.map((f) => (
          <li key={f.id} className="bg-white rounded-xl p-5 shadow-sm space-y-3">
            <div className="font-medium">{f.nombre}</div>
            <div className="text-sm text-neutral-500">{f.programa_gestion ?? 'Programa sin indicar'}</div>
            <div className="flex gap-2">
              <Link href={`/kiosko/${f.id}`} className="inline-block text-sm bg-neutral-900 text-white rounded-lg px-3 py-1.5">Abrir modo iPad</Link>
              <Link href={`/app/f/${f.id}/consejo`} className="inline-block text-sm border rounded-lg px-3 py-1.5">Consejo en mostrador</Link>
              <Link href={`/app/f/${f.id}/stock`} className="inline-block text-sm border rounded-lg px-3 py-1.5">Stock</Link>
              <Link href={`/app/f/${f.id}/panel`} className="inline-block text-sm border rounded-lg px-3 py-1.5">Panel</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
