'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { supabaseServer } from '@/lib/supabase/server'

export async function entrar(_: unknown, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.auth.signInWithPassword({
    email: String(form.get('email')),
    password: String(form.get('password')),
  })
  if (error) return { error: 'Email o contraseña incorrectos.' }
  redirect('/app')
}

export async function crearCuenta(_: unknown, form: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.auth.signUp({
    email: String(form.get('email')),
    password: String(form.get('password')),
    options: { emailRedirectTo: `${await origen()}/auth/callback` },
  })
  if (error) return { error: error.message }
  return { ok: 'Cuenta creada. Revisa tu email para confirmarla y después entra.' }
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
