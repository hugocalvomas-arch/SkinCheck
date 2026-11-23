'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { usuarioActual } from '@/lib/auth'

async function admin() {
  const u = await usuarioActual()
  if (!u.esAdmin) redirect('/app')
  return u.sb
}

export async function crearFarmacia(form: FormData) {
  const sb = await admin()
  const nombre = String(form.get('nombre') ?? '').trim()
  if (!nombre) return
  const { data, error } = await sb
    .from('farmacias')
    .insert({ nombre, programa_gestion: String(form.get('programa') ?? '') || null })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  redirect(`/app/admin/f/${data.id}`)
}

export async function asignarMiembro(_: unknown, form: FormData) {
  const sb = await admin()
  const farmacia = String(form.get('farmacia'))
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const rol = form.get('rol') === 'titular' ? 'titular' : 'auxiliar'
  const { data, error } = await sb.rpc('admin_asignar_miembro', { p_farmacia: farmacia, p_email: email, p_rol: rol })
  if (error) return { error: error.message }
  if (data === 'no_existe') return { error: 'Ese email aún no tiene cuenta. Pídele que se registre primero en /login.' }
  revalidatePath(`/app/admin/f/${farmacia}`)
  return { ok: `${email} añadido como ${rol}.` }
}

export async function quitarMiembro(form: FormData) {
  const sb = await admin()
  const farmacia = String(form.get('farmacia'))
  await sb.from('miembros').delete().eq('farmacia_id', farmacia).eq('user_id', String(form.get('user')))
  revalidatePath(`/app/admin/f/${farmacia}`)
}

export async function buscarProductos(q: string) {
  const sb = await admin()
  const t = q.trim().replace(/[%,()]/g, ' ')
  if (t.length < 2) return []
  const palabras = t.split(/\s+/).filter(Boolean).slice(0, 4)
  let consulta = sb.from('productos').select('id, marca, nombre, formato_ml, ean, cn').limit(12)
  for (const p of palabras) consulta = consulta.or(`nombre.ilike.%${p}%,marca.ilike.%${p}%`)
  const { data } = await consulta
  return data ?? []
}

const MENSAJES: Record<string, string> = {
  no_existe: 'Ese producto no existe.',
  sin_pendientes: 'Ese código ya no está pendiente.',
  ean_en_otro_producto: 'Ese EAN ya está asociado a otro producto.',
  cn_en_otro_producto: 'Ese CN ya está asociado a otro producto.',
}

export async function clasificar(codigo: string, productoId: string) {
  const sb = await admin()
  const { data, error } = await sb.rpc('admin_clasificar', { p_codigo: codigo, p_producto: productoId })
  if (error) return { error: error.message }
  if (!String(data).startsWith('ok')) return { error: MENSAJES[data as string] ?? String(data) }
  revalidatePath('/app/admin/sin-clasificar')
  return { ok: true }
}
