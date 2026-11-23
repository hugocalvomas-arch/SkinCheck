'use client'
import { useActionState } from 'react'
import { asignarMiembro } from '../../actions'

export function AsignarMiembro({ farmaciaId }: { farmaciaId: string }) {
  const [estado, accion, pendiente] = useActionState(asignarMiembro, null)
  return (
    <form action={accion} className="flex flex-wrap gap-3 items-center">
      <input type="hidden" name="farmacia" value={farmaciaId} />
      <input name="email" type="email" required placeholder="email del usuario" className="border rounded-lg px-3 py-2 flex-1 min-w-56" />
      <select name="rol" className="border rounded-lg px-2 py-2">
        <option value="auxiliar">Auxiliar</option>
        <option value="titular">Titular</option>
      </select>
      <button disabled={pendiente} className="btn">Añadir</button>
      {estado && 'error' in estado && <p className="w-full text-sm text-error">{estado.error}</p>}
      {estado && 'ok' in estado && <p className="w-full text-sm text-marca">{estado.ok}</p>}
    </form>
  )
}
