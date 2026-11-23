import { Suspense } from 'react'
import { usuarioActual } from '@/lib/auth'
import { NavPortal } from '@/components/NavPortal'

async function Zona({ children }: { children: React.ReactNode }) {
  const { sb, user, esAdmin } = await usuarioActual()
  const { data: farmacias } = await sb.from('farmacias').select('id, nombre').order('nombre')
  return (
    <>
      <NavPortal farmacias={farmacias ?? []} esAdmin={esAdmin} email={user.email ?? ''} />
      <main className="lg:pl-64 print:pl-0">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">{children}</div>
      </main>
    </>
  )
}

// Todo lo de /app depende de la sesión: se renderiza bajo demanda dentro de Suspense
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-fondo">
      <Suspense fallback={<p className="p-8 text-sm text-gris">Cargando…</p>}>
        <Zona>{children}</Zona>
      </Suspense>
    </div>
  )
}
