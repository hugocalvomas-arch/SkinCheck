'use server'
import { supabaseServer } from '@/lib/supabase/server'
import { clavesDeCodigo, type Campo } from '@/lib/codigos'

export type FilaStock = { cn: string; ean: string; descripcion: string; marca: string; pvp: number; unidades: number }

const PROGRAMAS = ['farmatic', 'nixfarma', 'unycop', 'iofwin', 'bitfarma', 'otro'] as const

export async function guardarStock(
  farmaciaId: string,
  filas: FilaStock[],
  mapeo: Partial<Record<Campo, string>>,
  programa: string,
) {
  const sb = await supabaseServer()
  if (filas.length > 50000) return { error: 'El archivo tiene demasiadas filas (máximo 50.000).' }

  // 1. Claves de cada fila: EAN y/o CN (de cualquiera de las dos columnas)
  const limpias = filas
    .map((f) => {
      const a = clavesDeCodigo(f.ean)
      const b = clavesDeCodigo(f.cn)
      return { ...f, keyEan: a.ean ?? b.ean, keyCn: b.cn ?? a.cn, unidades: Math.max(0, f.unidades || 0) }
    })
    .filter((f) => f.keyEan || f.keyCn)

  // 2. Buscar en el catálogo
  const eans = [...new Set(limpias.map((f) => f.keyEan).filter(Boolean))] as string[]
  const cns = [...new Set(limpias.map((f) => f.keyCn).filter(Boolean))] as string[]
  const porEan = new Map<string, string>()
  const porCn = new Map<string, string>()
  for (const [col, lista, mapa] of [['ean', eans, porEan], ['cn', cns, porCn]] as const) {
    for (let i = 0; i < lista.length; i += 300) {
      const { data, error } = await sb.from('productos').select(`id, ${col}`).in(col, lista.slice(i, i + 300))
      if (error) return { error: error.message }
      for (const p of (data ?? []) as Record<string, string>[]) mapa.set(p[col], p.id)
    }
  }

  // 3. Reconocidos (sumando duplicados) y sin clasificar
  const stock = new Map<string, { farmacia_id: string; producto_id: string; pvp: number; unidades: number }>()
  const sinClasificar = new Map<string, Record<string, unknown>>()
  for (const f of limpias) {
    const id = (f.keyEan && porEan.get(f.keyEan)) || (f.keyCn && porCn.get(f.keyCn))
    if (id) {
      const prev = stock.get(id)
      stock.set(id, {
        farmacia_id: farmaciaId,
        producto_id: id,
        pvp: Math.max(prev?.pvp ?? 0, f.pvp || 0),
        unidades: (prev?.unidades ?? 0) + f.unidades,
      })
    } else {
      const codigo = (f.keyEan ?? f.keyCn)!
      if (!sinClasificar.has(codigo))
        sinClasificar.set(codigo, {
          farmacia_id: farmaciaId,
          codigo,
          ean: f.keyEan ?? null,
          cn: f.keyCn ?? null,
          descripcion: f.descripcion.slice(0, 200),
          marca: f.marca.slice(0, 100) || null,
          pvp: f.pvp || null,
          unidades: f.unidades,
        })
    }
  }

  // 4. Sustituir el stock de la farmacia
  const del = await sb.from('stock').delete().eq('farmacia_id', farmaciaId)
  if (del.error) return { error: del.error.message }
  const filasStock = [...stock.values()]
  for (let i = 0; i < filasStock.length; i += 500) {
    const { error } = await sb.from('stock').insert(filasStock.slice(i, i + 500))
    if (error) return { error: error.message }
  }
  await sb.from('sin_clasificar').delete().eq('farmacia_id', farmaciaId)
  const pendientes = [...sinClasificar.values()]
  for (let i = 0; i < pendientes.length; i += 500) {
    const { error } = await sb.from('sin_clasificar').insert(pendientes.slice(i, i + 500))
    if (error) return { error: error.message }
  }

  // 5. Recordar las columnas para la próxima vez
  const prog = (PROGRAMAS as readonly string[]).includes(programa) ? programa : null
  await sb.rpc('guardar_mapeo_csv', { p_farmacia: farmaciaId, p_mapeo: mapeo, p_programa: prog, p_filas: filas.length })

  return {
    reconocidos: filasStock.length,
    conStock: filasStock.filter((s) => s.unidades > 0).length,
    sinClasificar: pendientes.length,
    descartadas: filas.length - limpias.length,
    total: filas.length,
  }
}
