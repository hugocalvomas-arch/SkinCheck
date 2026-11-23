import { redirect } from 'next/navigation'
import { usuarioActual } from '@/lib/auth'

export default async function Solicitudes() {
  const { sb, esAdmin } = await usuarioActual()
  if (!esAdmin) redirect('/app')
  const { data, error } = await sb.from('solicitudes').select('*').order('creado', { ascending: false }).limit(200)
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Solicitudes de la web</h1>
      {error && <p className="rounded-lg bg-aviso-suave text-aviso p-4">Falta crear la tabla de solicitudes en Supabase.</p>}
      {!error && !data?.length && <p className="text-gris">Aún no ha llegado ninguna solicitud.</p>}
      <ul className="grid gap-3">
        {data?.map((s) => (
          <li key={s.id} className="tarjeta p-5 grid sm:grid-cols-[1fr_auto] gap-2">
            <div>
              <p className="font-medium">{s.farmacia}{s.ciudad ? `, ${s.ciudad}` : ''}</p>
              <p className="text-gris">{s.nombre} · <a href={`mailto:${s.email}`} className="text-marca hover:underline">{s.email}</a>{s.telefono ? ` · ${s.telefono}` : ''}</p>
              {s.programa && <p className="text-sm text-gris">Programa: {s.programa}</p>}
              {s.mensaje && <p className="mt-2">{s.mensaje}</p>}
            </div>
            <p className="text-sm text-gris num">{new Date(s.creado).toLocaleString('es-ES')}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
