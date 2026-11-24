// Motor de rutinas de Hugo (motor v2 de su web) sobre el stock de una farmacia.
// Solo se usa en el servidor: las reglas no llegan nunca al navegador.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const motor = require('./motor/motor.js')
const { TODOS } = require('./motor/catalogo.js')

type Stock = { producto_id: string; pvp: number | null; unidades: number }

// Sin tope de precio en ningún nivel (Hugo, 24/11): los niveles solo cambian el número de productos.
export const NIVELES = [
  { clave: 'basica', nombre: 'Básica', productos: 3, presupuesto: 'alto' },
  { clave: 'media', nombre: 'Media', productos: 4, presupuesto: 'alto' },
  { clave: 'completa', nombre: 'Completa', productos: 5, presupuesto: 'alto' },
] as const

const RECOMENDABLES: any[] = TODOS.filter((p: any) => !p.retirado && !p.sin_verificar && !p.fuera_farmacia)
const POR_ID = new Map<string, any>(RECOMENDABLES.map((p: any) => [p.id, p]))

// Ventaja que da tener stock: mayor que cualquier diferencia de puntuación entre productos, así el motor
// solo recurre a un producto sin stock cuando la farmacia no tiene ninguno que sirva para ese paso.
const PREFERENCIA_STOCK = 10

/**
 * Productos que el motor puede recomendar en esta farmacia, con su PVP.
 * Con `sinStock`, también los del catálogo que la farmacia no tiene (marcados `bajo_pedido`), detrás de los que sí.
 */
export function catalogoDeFarmacia(stock: Stock[], sinStock = false) {
  const lista: any[] = []
  const tiene = new Set<string>()
  for (const s of stock) {
    if (!(s.unidades > 0)) continue
    const p = POR_ID.get(s.producto_id)
    if (!p) continue
    const pvp = s.pvp && s.pvp > 0 ? Number(s.pvp) : p.pvp_eur
    if (pvp == null) continue
    lista.push({ ...p, pvp_eur: pvp, sin_precio_es: false, _preferencia: sinStock ? PREFERENCIA_STOCK : 0 })
    tiene.add(p.id)
  }
  if (sinStock) for (const p of RECOMENDABLES) if (!tiene.has(p.id) && p.pvp_eur != null) lista.push({ ...p, bajo_pedido: true })
  return lista
}

function resumen(out: any, bajoPedido: Set<string>) {
  return {
    total: out.total,
    modo: out.modo,
    productos: out.productos.map((p: any) => ({
      paso: p.paso, turno: p.turno, slot: p.slot, id: p.id ?? null, marca: p.marca ?? null, producto: p.producto ?? null,
      precio: p.precio ?? null, formato_ml: p.formato_ml ?? null, para: p.para, activo: p.activo ?? null, dosis: p.dosis ?? null,
      motivo: p.producto ? null : p.motivo ?? null, aparte: !!p.aparte,
      dosis_tipo: p.dosis_tipo ?? null, ademas: p.ademas ?? [], frecuencia: p.frecuencia ?? null,
      bajo_pedido: p.id ? bajoPedido.has(p.id) : false,
    })),
    rutina: out.rutina,
    semana: out.semana,
    escalado: out.escalado,
    avisos: out.avisos,
    queda_fuera: out.queda_fuera,
    ingredientes: (out.opciones ?? []).map((o: any) => ({ papel: o.papel, nombre: o.nombre, ficha: o.ficha ?? null, turno: o.turno, objetivos: o.objetivos, por_que: o.por_que, limite: o.limite, motivo: o.motivo })),
    prioridad: out.prioridad ?? null,
  }
}

export function calcularRutinas(respuestas: Record<string, any>, stock: Stock[], sinStock = false) {
  if (respuestas.edad === '-14')
    return { sin_rutina: 'Con menos de 14 años no damos rutina: lo indicado es consultarlo con el pediatra o el dermatólogo.' }
  const lista = catalogoDeFarmacia(stock, sinStock)
  const bajoPedido = new Set<string>(lista.filter((p) => p.bajo_pedido).map((p) => p.id))
  const rutinas: Record<string, any> = {}
  let comun: any = null
  for (const n of NIVELES) {
    const out = motor.calcularCon({ ...respuestas, productos: n.productos, presupuesto: n.presupuesto }, lista)
    rutinas[n.clave] = { nombre: n.nombre, ...resumen(out, bajoPedido) }
    comun ??= { perfil: out.perfil, derivacion: out.derivacion, no_recomiendo: out.no_recomiendo }
  }
  // Con un tratamiento con receta, las tres rutinas son la misma de soporte: en el iPad se enseña una sola (Hugo, 24/11)
  const unica = respuestas.receta === 'si'
  return { ...comun, rutinas, unica, productos_en_stock: lista.length - bajoPedido.size, sin_stock: sinStock }
}
