'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { cambiarContrasena } from '../login/actions'
import { Logo } from '@/components/Logo'

// Llega aquí desde el enlace de "¿Olvidaste tu contraseña?", ya con la sesión abierta por /auth/callback
export default function NuevaContrasena() {
  const [estado, accion, cargando] = useActionState<{ error?: string } | undefined, FormData>(cambiarContrasena, undefined)
  return (
    <main className="min-h-[100dvh] flex flex-col px-6 md:px-12 py-8 bg-papel">
      <Link href="/" aria-label="Volver a la web"><Logo /></Link>
      <form action={accion} className="w-full max-w-sm m-auto py-12 grid gap-6">
        <div className="grid gap-3 border-t-2 border-tinta pt-6">
          <h1 className="text-[2.5rem] leading-[1.05]">Contraseña nueva</h1>
          <p className="text-gris">Elige una contraseña de al menos 8 caracteres.</p>
        </div>
        <div>
          <label htmlFor="password" className="etiqueta">Contraseña nueva</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="campo" />
        </div>
        <div>
          <label htmlFor="repetir" className="etiqueta">Repítela</label>
          <input id="repetir" name="repetir" type="password" required minLength={8} autoComplete="new-password" className="campo" />
        </div>
        {estado?.error && <p role="alert" className="text-sm rounded-[var(--radius-input)] bg-aviso-suave text-aviso p-4">{estado.error}</p>}
        <button disabled={cargando} className="btn btn-lg w-full">{cargando ? 'Un momento…' : 'Guardar y entrar'}</button>
      </form>
    </main>
  )
}
