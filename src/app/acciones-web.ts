'use server'
import { supabaseServer } from '@/lib/supabase/server'

export type EstadoSolicitud = { ok?: boolean; error?: string } | undefined

const PROGRAMAS = ['Farmatic', 'Nixfarma', 'Unycop', 'IOFWin', 'Bitfarma', 'Otro', 'No lo sé']
const txt = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max)

export async function pedirInformacion(_: EstadoSolicitud, f: FormData): Promise<EstadoSolicitud> {
  if (txt(f, 'web', 100)) return { ok: true } // campo trampa para bots
  const datos = {
    nombre: txt(f, 'nombre', 120),
    farmacia: txt(f, 'farmacia', 160),
    ciudad: txt(f, 'ciudad', 120) || null,
    email: txt(f, 'email', 200).toLowerCase(),
    telefono: txt(f, 'telefono', 40) || null,
    programa: PROGRAMAS.includes(txt(f, 'programa', 40)) ? txt(f, 'programa', 40) : null,
    mensaje: txt(f, 'mensaje', 2000) || null,
  }
  if (datos.nombre.length < 2 || datos.farmacia.length < 2) return { error: 'Indica tu nombre y el de la farmacia.' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email)) return { error: 'Revisa el email.' }
  if (f.get('privacidad') !== 'on') return { error: 'Necesitamos tu permiso para contactarte.' }
  const sb = await supabaseServer()
  const { error } = await sb.from('solicitudes').insert(datos)
  if (error) {
    console.error('[solicitudes]', error.message)
    return { error: 'No se ha podido enviar. Inténtalo de nuevo en unos minutos.' }
  }
  return { ok: true }
}
