import { Suspense } from 'react'
import { usuarioActual } from '@/lib/auth'
import { Cabecera } from '@/components/Cabecera'

async function Zona({ children }: { children: React.ReactNode }) {
  const { user, esAdmin } = await usuarioActual()
  return (
    <>
      <Cabecera email={user.email ?? ''} esAdmin={esAdmin} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </>
  )
}

// Todo lo de /app depende de la sesión: se renderiza bajo demanda dentro de Suspense
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={<p className="p-8 text-sm text-neutral-500">Cargando…</p>}>
        <Zona>{children}</Zona>
      </Suspense>
    </div>
  )
}
