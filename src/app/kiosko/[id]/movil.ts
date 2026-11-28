'use server'
import { randomBytes } from 'node:crypto'
import { supabaseServer } from '@/lib/supabase/server'

// Foto desde el móvil (Hugo, 28/11): la pantalla de la farmacia crea un enlace de un solo uso (10 min)
// y lo enseña en un QR. El móvil deja ahí la foto; esta pantalla la recoge y borra la fila en el acto.

async function esMiembro(sb: Awaited<ReturnType<typeof supabaseServer>>, farmaciaId: string) {
  const { data: u } = await sb.auth.getUser()
  if (!u.user) return false
  const { data } = await sb.from('miembros').select('farmacia_id').eq('farmacia_id', farmaciaId).eq('user_id', u.user.id).maybeSingle()
  return !!data
}

export async function crearEnlaceMovil(farmaciaId: string): Promise<{ token: string } | { error: string }> {
  const sb = await supabaseServer()
  if (!(await esMiembro(sb, farmaciaId))) return { error: 'Esta pantalla no tiene acceso a la farmacia.' }
  const token = randomBytes(24).toString('base64url')
  const { error } = await sb.from('fotos_movil').insert({ token, farmacia_id: farmaciaId })
  if (error) return { error: 'No se ha podido preparar el código. Haz la foto con esta cámara.' }
  return { token }
}

/** null mientras el móvil no la haya enviado; 'caducado' si el enlace ya no existe. */
export async function recogerFotoMovil(farmaciaId: string, token: string): Promise<{ foto: string } | { foto: null; caducado?: boolean }> {
  const sb = await supabaseServer()
  const { data } = await sb.from('fotos_movil').select('jpeg_base64, caduca').eq('token', token).eq('farmacia_id', farmaciaId).maybeSingle()
  if (!data || new Date(data.caduca).getTime() < Date.now()) return { foto: null, caducado: true }
  if (!data.jpeg_base64) return { foto: null }
  await sb.from('fotos_movil').delete().eq('token', token)
  return { foto: data.jpeg_base64 }
}

export async function anularEnlaceMovil(farmaciaId: string, token: string) {
  const sb = await supabaseServer()
  await sb.from('fotos_movil').delete().eq('token', token).eq('farmacia_id', farmaciaId)
}
