import { Suspense } from 'react'
import { usuarioActual } from '@/lib/auth'
import { Kiosko } from './Kiosko'

// el análisis de la foto tarda entre 15 y 60 segundos
export const maxDuration = 90

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: f } = await sb.from('farmacias').select('id, nombre').eq('id', id).maybeSingle()
  if (!f) return <p className="p-10">Este usuario no tiene acceso a esta farmacia.</p>
  return <Kiosko farmaciaId={f.id} farmacia={f.nombre} precio="9,99 €" />
}

export default function Pagina({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Contenido params={params} />
    </Suspense>
  )
}
