// Motor de rutinas de Hugo (motor v2 de su web) sobre el stock de una farmacia.
// Solo se usa en el servidor: las reglas no llegan nunca al navegador.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const motor = require('./motor/motor.js')
const { TODOS } = require('./motor/catalogo.js')

type Stock = { producto_id: string; pvp: number | null; unidades: number }

export const NIVELES = [
  { clave: 'basica', nombre: 'Básica', productos: 3, presupuesto: 'bajo' },
  { clave: 'media', nombre: 'Media', productos: 4, presupuesto: 'medio' },
  { clave: 'completa', nombre: 'Completa', productos: 5, presupuesto: 'alto' },
] as const

const RECOMENDABLES: any[] = TODOS.filter((p: any) => !p.retirado && !p.sin_verificar)
const POR_ID = new Map<string, any>(RECOMENDABLES.map((p: any) => [p.id, p]))

/** Productos del catálogo del motor que la farmacia tiene con stock, con el PVP de la farmacia. */
export function catalogoDeFarmacia(stock: Stock[]) {
  const lista: any[] = []
  for (const s of stock) {
    if (!(s.unidades > 0)) continue
    const p = POR_ID.get(s.producto_id)
    if (!p) continue
    const pvp = s.pvp && s.pvp > 0 ? Number(s.pvp) : p.pvp_eur
    if (pvp == null) continue
    lista.push({ ...p, pvp_eur: pvp, sin_precio_es: false })
  }
  return lista
}

function resumen(out: any) {
  return {
    total: out.total,
    modo: out.modo,
    productos: out.productos.map((p: any) => ({
      paso: p.paso, turno: p.turno, slot: p.slot, id: p.id ?? null, marca: p.marca ?? null, producto: p.producto ?? null,
      precio: p.precio ?? null, formato_ml: p.formato_ml ?? null, para: p.para, activo: p.activo ?? null, dosis: p.dosis ?? null,
      motivo: p.producto ? null : p.motivo ?? null, aparte: !!p.aparte,
      dosis_tipo: p.dosis_tipo ?? null, ademas: p.ademas ?? [],
    })),
    rutina: out.rutina,
    semana: out.semana,
    escalado: out.escalado,
    avisos: out.avisos,
    queda_fuera: out.queda_fuera,
    ingredientes: (out.opciones ?? []).map((o: any) => ({ papel: o.papel, nombre: o.nombre, turno: o.turno, objetivos: o.objetivos, por_que: o.por_que, limite: o.limite, motivo: o.motivo })),
    prioridad: out.prioridad ?? null,
  }
}

export function calcularRutinas(respuestas: Record<string, any>, stock: Stock[]) {
  if (respuestas.edad === '-14')
    return { sin_rutina: 'Con menos de 14 años no damos rutina: lo indicado es consultarlo con el pediatra o el dermatólogo.' }
  const lista = catalogoDeFarmacia(stock)
  const rutinas: Record<string, any> = {}
  let comun: any = null
  for (const n of NIVELES) {
    const out = motor.calcularCon({ ...respuestas, productos: n.productos, presupuesto: n.presupuesto }, lista)
    rutinas[n.clave] = { nombre: n.nombre, ...resumen(out) }
    comun ??= { perfil: out.perfil, derivacion: out.derivacion, no_recomiendo: out.no_recomiendo }
  }
  return { ...comun, rutinas, productos_en_stock: lista.length }
}
