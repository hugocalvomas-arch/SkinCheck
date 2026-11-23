'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowSquareOut, ChartBar, ChatCircleText, DeviceTablet, EnvelopeSimple, Gear, House, List, ListChecks, Package, SignOut, X } from '@phosphor-icons/react'
import { Logo } from './Logo'
import { salir } from '@/app/login/actions'

type Farmacia = { id: string; nombre: string }

export function NavPortal({ farmacias, esAdmin, email }: { farmacias: Farmacia[]; esAdmin: boolean; email: string }) {
  const ruta = usePathname()
  const [abierta, setAbierta] = useState(false)
  const fid = ruta.match(/^\/app\/f\/([^/]+)/)?.[1] ?? (farmacias.length === 1 ? farmacias[0].id : undefined)
  const actual = farmacias.find((f) => f.id === fid)

  const enlaces = fid
    ? [
        { href: `/app/f/${fid}`, t: 'Inicio', i: <House size={20} />, exacto: true },
        { href: `/app/f/${fid}/consejo`, t: 'Consejo en mostrador', i: <ChatCircleText size={20} /> },
        { href: `/app/f/${fid}/stock`, t: 'Stock', i: <Package size={20} /> },
        { href: `/app/f/${fid}/panel`, t: 'Resultados', i: <ChartBar size={20} /> },
      ]
    : []
  const admin = esAdmin
    ? [
        { href: '/app/admin', t: 'Farmacias y usuarios', i: <Gear size={20} />, exacto: true },
        { href: '/app/admin/sin-clasificar', t: 'Sin clasificar', i: <ListChecks size={20} /> },
        { href: '/app/admin/solicitudes', t: 'Solicitudes web', i: <EnvelopeSimple size={20} /> },
      ]
    : []
  const activo = (href: string, exacto?: boolean) => (exacto ? ruta === href : ruta.startsWith(href))
  const Item = ({ href, t, i, exacto }: { href: string; t: string; i: React.ReactNode; exacto?: boolean }) => (
    <Link href={href} onClick={() => setAbierta(false)} aria-current={activo(href, exacto) ? 'page' : undefined}
      className={`flex items-center gap-3 h-10 px-3 rounded-lg text-[15px] transition-colors duration-100 ${activo(href, exacto) ? 'bg-marca-suave text-marca font-medium' : 'text-gris hover:bg-suave hover:text-tinta'}`}>
      {i}{t}
    </Link>
  )

  const contenido = (
    <div className="flex flex-col h-full gap-6 p-4">
      <Link href="/app" className="px-2 pt-1"><Logo /></Link>
      {farmacias.length > 1 && (
        <Link href="/app" className="mx-1 text-sm rounded-lg border border-linea px-3 py-2 hover:bg-suave">
          <span className="block text-gris text-xs">Farmacia</span>
          <span className="block font-medium truncate">{actual?.nombre ?? 'Elegir farmacia'}</span>
        </Link>
      )}
      {farmacias.length === 1 && <p className="px-3 text-sm font-medium truncate">{farmacias[0].nombre}</p>}
      {fid && (
        <a href={`/kiosko/${fid}`} target="_blank" rel="noopener" className="btn mx-1"><DeviceTablet size={20} /> Abrir modo iPad <ArrowSquareOut size={16} /></a>
      )}
      <nav className="space-y-1">{enlaces.map((e) => <Item key={e.href} {...e} />)}</nav>
      {admin.length > 0 && (
        <nav className="space-y-1">
          <p className="px-3 pb-1 text-xs font-medium text-gris">Administración</p>
          {admin.map((e) => <Item key={e.href} {...e} />)}
        </nav>
      )}
      <div className="mt-auto border-t border-linea pt-4 px-1 space-y-2">
        <p className="px-2 text-sm text-gris truncate">{email}</p>
        <form action={salir}><button className="flex items-center gap-3 h-10 px-2 rounded-lg text-gris hover:bg-suave hover:text-tinta w-full"><SignOut size={20} /> Salir</button></form>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-linea print:hidden">{contenido}</aside>
      <div className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-linea flex items-center px-4 print:hidden">
        <Link href="/app"><Logo /></Link>
        <button onClick={() => setAbierta(true)} aria-label="Abrir menú" className="ml-auto w-11 h-11 grid place-items-center rounded-lg hover:bg-suave"><List size={22} /></button>
      </div>
      {abierta && (
        <div className="lg:hidden fixed inset-0 z-40 print:hidden">
          <button aria-label="Cerrar menú" onClick={() => setAbierta(false)} className="absolute inset-0 bg-tinta/30" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button onClick={() => setAbierta(false)} aria-label="Cerrar menú" className="absolute top-3 right-3 w-11 h-11 grid place-items-center rounded-lg hover:bg-suave"><X size={20} /></button>
            {contenido}
          </aside>
        </div>
      )}
    </>
  )
}
