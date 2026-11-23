'use client'
import { useActionState, useState } from 'react'
import { entrar, crearCuenta } from './actions'

type Estado = { error?: string; ok?: string } | undefined

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [estado, accion, cargando] = useActionState<Estado, FormData>(
    modo === 'entrar' ? entrar : crearCuenta,
    undefined
  )
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
      <form action={accion} className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-4">
        <h1 className="text-2xl font-semibold">SkinCheck</h1>
        <p className="text-sm text-neutral-500">{modo === 'entrar' ? 'Entra en tu farmacia' : 'Crea tu cuenta'}</p>
        <input name="email" type="email" required placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
        <input name="password" type="password" required minLength={8} placeholder="Contraseña (mín. 8)" className="w-full border rounded-lg px-3 py-2" />
        {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
        {estado?.ok && <p className="text-sm text-green-700">{estado.ok}</p>}
        <button disabled={cargando} className="w-full bg-neutral-900 text-white rounded-lg py-2 disabled:opacity-50">
          {modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
        </button>
        <button type="button" onClick={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')} className="w-full text-sm text-neutral-500">
          {modo === 'entrar' ? '¿No tienes cuenta? Créala' : 'Ya tengo cuenta'}
        </button>
      </form>
    </main>
  )
}
