'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { pendientes, visibles, type Respuestas } from '@/lib/cuestionario'
import { calcularRutinas } from '@/server/rutinas'
import { recomiendaSinStock } from '@/server/ajustesFarmacia'
import { analizarFoto, problemasDesdeFoto, type ResultadoFoto } from '@/server/analisisPiel'
import { registroConsentimiento } from '@/lib/privacidad'

export async function crearConsejo(farmaciaId: string, r: Respuestas, foto: string | null = null, acepta = false) {
  if (acepta !== true) return { error: 'Falta el permiso expreso de la clienta.' }
  const sb = await supabaseServer()
  if (pendientes(r).length) return { error: 'Faltan preguntas por contestar.' }
  // solo se guardan las respuestas de preguntas visibles (nada de texto libre ni datos personales)
  const limpias: Respuestas = {}
  for (const q of visibles(r)) limpias[q.id] = r[q.id]
  limpias.consentimiento = registroConsentimiento(!!foto, 'mostrador')
  // Foto (opcional): se analiza y se descarta; quedan las puntuaciones y enlaces del proveedor que caducan en 2 h
  let puntuaciones: ResultadoFoto | null = null
  if (foto) {
    const a = await analizarFoto(foto)
    if ('error' in a) return { error: a.error }
    puntuaciones = a
    limpias.problemas_extra = problemasDesdeFoto(a.puntuaciones)
  }
  const stock: { producto_id: string; pvp: number | null; unidades: number }[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await sb.from('stock').select('producto_id, pvp, unidades').eq('farmacia_id', farmaciaId).gt('unidades', 0).range(desde, desde + 999)
    if (error) return { error: error.message }
    stock.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  const resultado = calcularRutinas(limpias, stock, await recomiendaSinStock(sb, farmaciaId))
  const { data, error } = await sb.from('consejos').insert({ farmacia_id: farmaciaId, respuestas: limpias, puntuaciones_foto: puntuaciones, rutinas: resultado }).select('id').single()
  if (error) return { error: error.message }
  redirect(`/app/f/${farmaciaId}/consejo/${data.id}`)
}

export async function marcarVendida(form: FormData) {
  const sb = await supabaseServer()
  const farmacia = String(form.get('farmacia')), consejo = String(form.get('consejo'))
  const nivel = String(form.get('nivel'))
  await sb.from('consejos').update({ rutina_vendida: ['basica', 'media', 'completa', 'ninguna'].includes(nivel) ? nivel : null }).eq('id', consejo)
  revalidatePath(`/app/f/${farmacia}/consejo/${consejo}`)
}
