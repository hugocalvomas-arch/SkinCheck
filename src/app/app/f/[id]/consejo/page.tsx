import { usuarioActual } from '@/lib/auth'
import { Cuestionario } from './Cuestionario'

// el análisis de la foto tarda entre 15 y 60 segundos
export const maxDuration = 90

export default async function NuevoConsejo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: f } = await sb.from('farmacias').select('id, nombre').eq('id', id).maybeSingle()
  if (!f) return <p>No tienes acceso a esta farmacia.</p>
  return (
    <div className="space-y-6">
      <div className="grid gap-1">
        <h1 className="text-[2rem] leading-tight">Nuevo consejo</h1>
        <p className="text-gris">{f.nombre}</p>
      </div>
      <Cuestionario farmaciaId={id} farmacia={f.nombre} />
    </div>
  )
}
