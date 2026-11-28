import type { supabaseServer } from '@/lib/supabase/server'

type Sb = Awaited<ReturnType<typeof supabaseServer>>

/**
 * ¿Recomienda esta farmacia también productos que no tiene en stock (los pide para la clienta)?
 * Se lee con select('*') para que, si aún no se ha añadido la columna en Supabase, valga "no" y nada falle.
 */
export async function recomiendaSinStock(sb: Sb, farmaciaId: string) {
  const { data } = await sb.from('farmacias').select('*').eq('id', farmaciaId).maybeSingle()
  return (data as { recomendar_sin_stock?: boolean } | null)?.recomendar_sin_stock === true
}
