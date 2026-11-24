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
  // Solo quien pertenece a la farmacia puede cambiar su stock (un admin que no es miembro fallaría a mitad)
  const { data: u } = await sb.auth.getUser()
  if (!u.user) return { error: 'Tu sesión ha caducado. Vuelve a entrar.' }
  const { data: m } = await sb.from('miembros').select('farmacia_id').eq('farmacia_id', farmaciaId).eq('user_id', u.user.id).maybeSingle()
  if (!m) return { error: 'Tu usuario no pertenece a esta farmacia, así que no puede cambiar su stock.' }
  if (filas.length > 50000) return { error: 'El archivo tiene demasiadas filas (máximo 50.000).' }

  // 1. Claves de cada fila: EAN y/o CN (de cualquiera de las dos columnas)
  const limpias = filas
    .map((f) => {
      const a = clavesDeCodigo(f.ean)
      const b = clavesDeCodigo(f.cn)
      return { ...f, keyEan: a.ean ?? b.ean, keyCn: b.cn ?? a.cn, unidades: Math.max(0, Math.round(f.unidades || 0)), pvp: Number.isFinite(f.pvp) && f.pvp > 0 ? Math.round(f.pvp * 100) / 100 : 0 }
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

  // Marca de esta subida: lo que no la lleve al final es del stock anterior y se borra
  const marca = new Date().toISOString()

  // 3. Reconocidos (sumando duplicados) y sin clasificar
  const stock = new Map<string, { farmacia_id: string; producto_id: string; pvp: number; unidades: number; actualizado: string }>()
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
        actualizado: marca,
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
          visto: marca,
        })
    }
  }

  // 4. Sustituir el stock de la farmacia sin dejarla nunca vacía: primero se escribe el nuevo
  //    (upsert por farmacia+producto) y solo cuando todo ha entrado se borra lo que no venía en el archivo.
  //    Si algo falla a mitad, queda el stock anterior más lo ya escrito, nunca una farmacia sin stock.
  const filasStock = [...stock.values()]
  for (let i = 0; i < filasStock.length; i += 500) {
    const { error } = await sb.from('stock').upsert(filasStock.slice(i, i + 500), { onConflict: 'farmacia_id,producto_id' })
    if (error) return { error: 'No se ha podido guardar el stock. El anterior sigue activo. Vuelve a intentarlo. (' + error.message + ')' }
  }
  const pendientes = [...sinClasificar.values()]
  for (let i = 0; i < pendientes.length; i += 500) {
    const { error } = await sb.from('sin_clasificar').upsert(pendientes.slice(i, i + 500), { onConflict: 'farmacia_id,codigo' })
    if (error) return { error: error.message }
  }
  const del = await sb.from('stock').delete().eq('farmacia_id', farmaciaId).lt('actualizado', marca)
  if (del.error) return { error: del.error.message }
  await sb.from('sin_clasificar').delete().eq('farmacia_id', farmaciaId).lt('visto', marca)

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
