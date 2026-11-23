import { usuarioActual } from '@/lib/auth'
import { Cuestionario } from './Cuestionario'

export default async function NuevoConsejo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await usuarioActual()
  const { data: f } = await sb.from('farmacias').select('id, nombre').eq('id', id).maybeSingle()
  if (!f) return <p>No tienes acceso a esta farmacia.</p>
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo consejo · {f.nombre}</h1>
      <Cuestionario farmaciaId={id} />
    </div>
  )
}
