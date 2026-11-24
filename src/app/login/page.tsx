'use client'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { entrar, crearCuenta, recuperar } from './actions'
import { Logo } from '@/components/Logo'

type Estado = { error?: string; ok?: string } | undefined

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'crear' | 'recuperar'>('entrar')
  const [estado, accion, cargando] = useActionState<Estado, FormData>(modo === 'entrar' ? entrar : modo === 'crear' ? crearCuenta : recuperar, undefined)
  // Vuelta desde un enlace de email caducado o abierto en otro navegador
  const [enlaceMalo, setEnlaceMalo] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al montar, tras la hidratación
  useEffect(() => { setEnlaceMalo(new URLSearchParams(window.location.search).get('error') === 'enlace') }, [])
  const TITULO = { entrar: 'Acceso farmacias', crear: 'Crea tu cuenta', recuperar: 'Recupera tu contraseña' }
  const TEXTO = {
    entrar: 'Entra para gestionar tu stock, abrir el modo iPad y ver tus resultados.',
    crear: 'Después te asociaremos a tu farmacia.',
    recuperar: 'Te mandamos un enlace para elegir una contraseña nueva.',
  }
  const BOTON = { entrar: 'Entrar', crear: 'Crear cuenta', recuperar: 'Enviar enlace' }
  return (
    <main className="min-h-[100dvh] grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-papel">
      <div className="flex flex-col px-6 md:px-12 py-8 min-h-[100dvh]">
        <Link href="/" aria-label="Volver a la web"><Logo /></Link>
        <form action={accion} className="w-full max-w-sm m-auto py-12 grid gap-6">
          <div className="grid gap-3 border-t-2 border-tinta pt-6">
            <h1 className="text-[2.5rem] leading-[1.05]">{TITULO[modo]}</h1>
            <p className="text-gris">{TEXTO[modo]}</p>
          </div>
          <div>
            <label htmlFor="email" className="etiqueta">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
          </div>
          {modo !== 'recuperar' && (
            <div>
              <label htmlFor="password" className="etiqueta">Contraseña</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} className="campo" />
              {modo === 'crear' && <p className="text-sm text-gris mt-1.5">Mínimo 8 caracteres.</p>}
              {modo === 'entrar' && (
                <button type="button" onClick={() => setModo('recuperar')} className="enlace text-sm min-h-11 mt-1">¿Olvidaste tu contraseña?</button>
              )}
            </div>
          )}
          {enlaceMalo && !estado && <p role="alert" className="text-sm rounded-[var(--radius-input)] bg-aviso-suave text-aviso p-4">El enlace ha caducado o se abrió en otro navegador. Pide uno nuevo con «¿Olvidaste tu contraseña?».</p>}
          {estado?.error && <p role="alert" className="text-sm rounded-[var(--radius-input)] bg-aviso-suave text-aviso p-4">{estado.error}</p>}
          {estado?.ok && <p role="status" className="text-sm rounded-[var(--radius-input)] bg-marca-suave text-marca p-4">{estado.ok}</p>}
          <button disabled={cargando} className="btn btn-lg w-full">{cargando ? 'Un momento…' : BOTON[modo]}</button>
          <p className="text-sm text-gris text-center">
            {modo === 'entrar' ? '¿Aún no tienes cuenta? ' : modo === 'crear' ? '¿Ya tienes cuenta? ' : '¿Te acuerdas? '}
            <button type="button" onClick={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')} className="enlace min-h-11 px-1">
              {modo === 'entrar' ? 'Créala' : 'Entra'}
            </button>
          </p>
        </form>
        <p className="text-sm text-gris">¿Tu farmacia aún no usa SkinCheck? <Link href="/#contacto" className="enlace">Pide información</Link></p>
      </div>
      <aside className="hidden md:flex flex-col justify-between bg-marca-suave text-tinta p-12 border-l border-linea">
        <EscalaDecorativa />
        <div className="max-w-lg grid gap-4">
          <p className="text-[2.25rem] font-semibold tracking-[-0.03em] leading-[1.08]">Cada análisis termina en una rutina con productos de tu estantería.</p>
          <p className="text-lg text-tinta-2">Sube tu stock una vez y deja el iPad en el mostrador.</p>
        </div>
      </aside>
    </main>
  )
}

// Las 11 medidas del análisis como escala, a modo de muestra del informe (datos de ejemplo)
function EscalaDecorativa() {
  const m: [string, number][] = [['Poros', 72], ['Brillo', 61], ['Rojez', 48], ['Textura', 41], ['Manchas', 33], ['Hidratación', 29]]
  return (
    <figure className="m-0 max-w-md w-full grid gap-3" aria-label="Ejemplo de lectura del análisis">
      {m.map(([a, v]) => (
        <div key={a} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
          <span className="text-tinta-2">{a}</span>
          <span className="escala bg-papel"><i /><b data-alto={v >= 50 ? '' : undefined} style={{ width: `${v}%` }} /></span>
          <span className="cifra text-right text-gris">{v}</span>
        </div>
      ))}
      <figcaption className="text-xs text-gris mt-2">Datos de ejemplo</figcaption>
    </figure>
  )
}
