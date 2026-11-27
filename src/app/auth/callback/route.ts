import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabase/server'

// Enlaces de los emails de Supabase (confirmar cuenta y recuperar contraseña).
// Acepta el código (?code=, mismo navegador) y el token_hash (?token_hash=&type=, sirve desde cualquier dispositivo
// si la plantilla del email de Supabase apunta aquí). Solo redirige a rutas internas.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const pedido = url.searchParams.get('next') ?? ''
  const tipo = url.searchParams.get('type') as EmailOtpType | null
  const next = /^\/[a-z0-9\-/]*$/i.test(pedido) && !pedido.startsWith('//') ? pedido : tipo === 'recovery' ? '/nueva-contrasena' : '/app'
  const sb = await supabaseServer()
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  } else if (tokenHash && tipo) {
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/login?error=enlace', url.origin))
}
