'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { entrar, crearCuenta } from './actions'
import { Logo } from '@/components/Logo'

type Estado = { error?: string; ok?: string } | undefined

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [estado, accion, cargando] = useActionState<Estado, FormData>(modo === 'entrar' ? entrar : crearCuenta, undefined)
  return (
    <main className="min-h-[100dvh] grid md:grid-cols-2 bg-fondo">
      <div className="flex flex-col px-6 md:px-12 py-8">
        <Link href="/" aria-label="Volver a la web"><Logo /></Link>
        <form action={accion} className="w-full max-w-sm m-auto py-12 space-y-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{modo === 'entrar' ? 'Acceso farmacias' : 'Crea tu cuenta'}</h1>
            <p className="text-gris">{modo === 'entrar' ? 'Entra para gestionar tu stock, abrir el modo iPad y ver tus resultados.' : 'Después te asociaremos a tu farmacia.'}</p>
          </div>
          <div>
            <label htmlFor="email" className="etiqueta">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
          </div>
          <div>
            <label htmlFor="password" className="etiqueta">Contraseña</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} className="campo" />
            {modo === 'crear' && <p className="text-sm text-gris mt-1.5">Mínimo 8 caracteres.</p>}
          </div>
          {estado?.error && <p role="alert" className="text-sm rounded-lg bg-aviso-suave text-aviso p-3">{estado.error}</p>}
          {estado?.ok && <p className="text-sm rounded-lg bg-marca-suave text-marca p-3">{estado.ok}</p>}
          <button disabled={cargando} className="btn btn-lg w-full">{cargando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</button>
          <p className="text-sm text-gris text-center">
            {modo === 'entrar' ? '¿Aún no tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button type="button" onClick={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')} className="text-marca font-medium hover:underline">
              {modo === 'entrar' ? 'Créala' : 'Entra'}
            </button>
          </p>
        </form>
        <p className="text-sm text-gris">¿Tu farmacia aún no usa SkinCheck? <Link href="/#contacto" className="text-marca font-medium hover:underline">Pide información</Link></p>
      </div>
      <aside className="hidden md:flex flex-col justify-end bg-marca text-white p-12">
        <div className="max-w-md space-y-4">
          <p className="text-3xl font-semibold tracking-tight leading-tight">Cada análisis termina en una rutina con productos de tu estantería.</p>
          <p className="text-white/80">Sube tu stock una vez y deja el iPad en el mostrador.</p>
        </div>
      </aside>
    </main>
  )
}
