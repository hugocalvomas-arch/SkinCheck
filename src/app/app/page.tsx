import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { usuarioActual } from '@/lib/auth'

export default async function Inicio() {
  const { sb, esAdmin } = await usuarioActual()
  const { data: farmacias } = await sb.from('farmacias').select('id, nombre').order('nombre')
  if (farmacias?.length === 1) redirect(`/app/f/${farmacias[0].id}`)
  return (
    <div className="space-y-8">
      <h1 className="text-[2rem] leading-tight">{farmacias?.length ? 'Elige farmacia' : 'Bienvenida a SkinCheck'}</h1>
      {!farmacias?.length && (
        <p className="text-gris text-lg max-w-[60ch]">
          {esAdmin ? 'Aún no hay farmacias. Créalas en Farmacias y usuarios.' : 'Tu cuenta aún no está asociada a ninguna farmacia. Escríbenos y te damos acceso en el día.'}
        </p>
      )}
      <ul className="grid sm:grid-cols-2 gap-4">
        {farmacias?.map((f) => (
          <li key={f.id}>
            <Link href={`/app/f/${f.id}`} className="tarjeta p-6 flex items-center gap-4 hover:border-campo transition-colors duration-100">
              <span className="font-medium text-lg flex-1">{f.nombre}</span>
              <ArrowRight size={20} className="text-gris" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
