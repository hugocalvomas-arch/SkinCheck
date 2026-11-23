'use server'
import { supabaseServer } from '@/lib/supabase/server'
import { calcularRutinas } from '@/server/rutinas'
import { analizarFoto, problemasDesdeFoto, UMBRALES_POR_DEFECTO, type ResultadoFoto } from '@/server/analisisPiel'
import type { Respuestas } from '@/lib/cuestionario'

export type Seguridad = { edad: string; embarazo: 'si' | 'no'; receta: 'si' | 'no'; reactiva: 'nunca' | 'a_veces' | 'siempre' }

const PROBLEMA_DE: Record<string, string> = Object.fromEntries(UMBRALES_POR_DEFECTO.map((u) => [u.aspecto, u.problema]))

/** Recorrido de la clienta en el iPad: 4 respuestas de seguridad + foto (o, si no hay foto, lo que quiere mejorar). */
export async function analizarKiosko(farmaciaId: string, s: Seguridad, foto: string | null, mejorar: string[] = []) {
  const sb = await supabaseServer()
  const { data: f } = await sb.from('farmacias').select('id').eq('id', farmaciaId).maybeSingle()
  if (!f) return { error: 'Este iPad no tiene acceso a la farmacia. Pide ayuda en el mostrador.' }

  // Respuestas que lee el motor de Hugo. Lo que no se pregunta va con el valor más prudente.
  const r: Respuestas = {
    edad: s.edad,
    sexo: 'nd',
    embarazo: s.embarazo,
    receta: s.receta,
    reactiva: s.reactiva,
    sienta: ['nada'],
    retinoide_exp: 'nunca',
    fototipo: 'III',
    textura: 'igual',
    preocupa: ['nada'],
    piel: 'normal',
    kiosko: true,
  }

  let fotoRes: ResultadoFoto | null = null
  if (foto) {
    const a = await analizarFoto(foto)
    if ('error' in a) return { error: a.error }
    fotoRes = a
    r.problemas_extra = problemasDesdeFoto(a.puntuaciones)
    const p = a.puntuaciones
    r.piel = (p.brillo ?? 0) >= 50 ? 'brillo_total' : (p.brillo ?? 0) >= 35 ? 'brillo_T' : (p.hidratacion ?? 0) >= 50 ? 'tirante' : 'normal'
  } else {
    r.problemas_extra = [...new Set(mejorar.map((a) => PROBLEMA_DE[a]).filter(Boolean))]
    if (mejorar.includes('brillo')) r.piel = 'brillo_T'
    else if (mejorar.includes('hidratacion')) r.piel = 'tirante'
  }

  const stock: { producto_id: string; pvp: number | null; unidades: number }[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await sb.from('stock').select('producto_id, pvp, unidades').eq('farmacia_id', farmaciaId).gt('unidades', 0).range(desde, desde + 999)
    if (error) return { error: error.message }
    stock.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  const rutinas = calcularRutinas(r, stock)
  const { data, error } = await sb.from('consejos').insert({ farmacia_id: farmaciaId, respuestas: r, puntuaciones_foto: fotoRes, rutinas }).select('id').single()
  if (error) return { error: error.message }
  return { id: data.id as string, rutinas: rutinas as unknown as Record<string, unknown>, foto: fotoRes }
}
