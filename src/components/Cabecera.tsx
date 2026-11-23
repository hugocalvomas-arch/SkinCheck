import Link from 'next/link'
import { salir } from '@/app/login/actions'

export function Cabecera({ email, esAdmin }: { email: string; esAdmin: boolean }) {
  return (
    <header className="border-b bg-white print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 text-sm">
        <Link href="/app" className="font-semibold text-base">SkinCheck</Link>
        {esAdmin && <Link href="/app/admin" className="text-neutral-600">Administración</Link>}
        <span className="ml-auto text-neutral-500 hidden sm:inline">{email}</span>
        <form action={salir}><button className="text-neutral-600">Salir</button></form>
      </div>
    </header>
  )
}
