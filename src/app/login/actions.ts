'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { supabaseServer } from '@/lib/supabase/server'

export async function entrar(_: unknown, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.auth.signInWithPassword({
    email: String(form.get('email')).trim(),
    password: String(form.get('password')),
  })
  if (error) return { error: error.message.includes('not confirmed') ? 'Aún no has confirmado tu email. Busca el correo de confirmación (mira también en spam).' : 'Email o contraseña incorrectos.' }
  redirect('/app')
}

export async function crearCuenta(_: unknown, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.auth.signUp({
    email: String(form.get('email')).trim(),
    password: String(form.get('password')),
    options: { emailRedirectTo: `${await origen()}/auth/callback` },
  })
  if (error) return { error: error.message.includes('registered') ? 'Ese email ya tiene cuenta. Entra o recupera la contraseña.' : 'No se ha podido crear la cuenta. Revisa el email y que la contraseña tenga 8 caracteres o más.' }
  return { ok: 'Cuenta creada. Revisa tu email para confirmarla y después entra.' }
}

// "¿Olvidaste tu contraseña?": manda el enlace de Supabase. La respuesta es la misma exista o no la cuenta,
// para no revelar qué emails están dados de alta.
export async function recuperar(_: unknown, form: FormData) {
  const email = String(form.get('email') ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Revisa el email.' }
  const sb = await supabaseServer()
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${await origen()}/auth/callback?next=/nueva-contrasena` })
  return { ok: 'Si ese email tiene cuenta, te llegará un enlace para elegir una contraseña nueva. Ábrelo en este mismo navegador.' }
}

export async function cambiarContrasena(_: unknown, form: FormData) {
  const password = String(form.get('password') ?? '')
  if (password.length < 8) return { error: 'La contraseña necesita al menos 8 caracteres.' }
  if (password !== String(form.get('repetir') ?? '')) return { error: 'Las dos contraseñas no coinciden.' }
  const sb = await supabaseServer()
  const { data } = await sb.auth.getUser()
  if (!data.user) return { error: 'El enlace ha caducado. Pide otro desde la pantalla de acceso.' }
  const { error } = await sb.auth.updateUser({ password })
  if (error) return { error: error.message.includes('different') ? 'Elige una contraseña distinta de la anterior.' : 'No se ha podido cambiar. Vuelve a intentarlo.' }
  redirect('/app')
}

export async function salir() {
  const sb = await supabaseServer()
  await sb.auth.signOut()
  redirect('/login')
}

async function origen() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}
