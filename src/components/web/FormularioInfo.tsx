'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import { pedirInformacion, type EstadoSolicitud } from '@/app/acciones-web'

export function FormularioInfo() {
  const [estado, accion, enviando] = useActionState<EstadoSolicitud, FormData>(pedirInformacion, undefined)
  if (estado?.ok)
    return (
      <div className="border-t-2 border-tinta pt-8 grid gap-3" role="status">
        <CheckCircle size={40} className="text-marca" />
        <p className="text-2xl font-semibold tracking-tight">Recibido. Te escribimos en menos de 48 horas.</p>
        <p className="text-gris">Te enviaremos las tarifas y, si quieres, organizamos una demostración en tu farmacia.</p>
      </div>
    )
  return (
    <form action={accion} className="border-t-2 border-tinta pt-8 grid sm:grid-cols-2 gap-x-6 gap-y-6">
      <Campo id="nombre" etiqueta="Tu nombre" autoComplete="name" required />
      <Campo id="farmacia" etiqueta="Farmacia" autoComplete="organization" required />
      <Campo id="email" etiqueta="Email" type="email" autoComplete="email" required />
      <Campo id="telefono" etiqueta="Teléfono (opcional)" type="tel" autoComplete="tel" />
      <Campo id="ciudad" etiqueta="Ciudad" autoComplete="address-level2" />
      <div>
        <label htmlFor="programa" className="etiqueta">Programa de gestión</label>
        <select id="programa" name="programa" className="campo" defaultValue="">
          <option value="" disabled>Elige uno</option>
          {['Farmatic', 'Nixfarma', 'Unycop', 'IOFWin', 'Bitfarma', 'Otro', 'No lo sé'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="mensaje" className="etiqueta">¿Algo que quieras contarnos? (opcional)</label>
        <textarea id="mensaje" name="mensaje" rows={3} className="campo" />
      </div>
      <input type="text" name="web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="sm:col-span-2 flex gap-3 text-sm text-gris">
        <input type="checkbox" name="privacidad" required className="mt-0.5 w-5 h-5 shrink-0 accent-marca" />
        <span>Acepto que SkinRead use estos datos para contactarme y enviarme información comercial sobre el servicio. Puedo retirar el permiso cuando quiera. Más información en la <Link href="/privacidad#web" className="underline underline-offset-4">política de privacidad</Link>.</span>
      </label>
      {estado?.error && <p role="alert" className="sm:col-span-2 text-sm rounded-[var(--radius-input)] bg-aviso-suave text-aviso p-4">{estado.error}</p>}
      <div className="sm:col-span-2">
        <button disabled={enviando} className="btn btn-lg">{enviando ? 'Enviando…' : 'Pedir información'}</button>
      </div>
    </form>
  )
}

function Campo({ id, etiqueta, type = 'text', required, autoComplete }: { id: string; etiqueta: string; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta">{etiqueta}</label>
      <input id={id} name={id} type={type} required={required} autoComplete={autoComplete} className="campo" />
    </div>
  )
}
