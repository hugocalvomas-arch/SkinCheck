'use server'
import { supabaseServer } from '@/lib/supabase/server'

// El móvil no tiene sesión: solo puede comprobar el enlace y dejar una foto, con dos funciones de la base de datos.
const valido = (t: string) => /^[A-Za-z0-9_-]{32,64}$/.test(t)

export async function enlaceVivo(token: string) {
  if (!valido(token)) return false
  const sb = await supabaseServer()
  const { data } = await sb.rpc('enlace_movil_vivo', { p_token: token })
  return data === true
}

export async function subirFotoMovil(token: string, foto: string) {
  if (!valido(token) || !foto || foto.length > 3_000_000 || !/^[A-Za-z0-9+/=]+$/.test(foto)) return { ok: false }
  const sb = await supabaseServer()
  const { data } = await sb.rpc('subir_foto_movil', { p_token: token, p_foto: foto })
  return { ok: data === true }
}
