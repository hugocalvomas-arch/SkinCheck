import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Enlace del email de confirmación: canjea el código por la sesión y entra en /app
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (code) {
    const sb = await supabaseServer()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL('/app', url.origin))
  }
  return NextResponse.redirect(new URL('/login?error=enlace', url.origin))
}
