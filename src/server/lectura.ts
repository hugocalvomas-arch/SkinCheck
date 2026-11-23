// Traduce el análisis y la salida del motor a una lectura fácil para la clienta:
// qué conviene trabajar, qué significa, qué ingredientes lo tratan y qué esperar.
// Los ingredientes, el alcance y los plazos salen del motor de Hugo; aquí solo se ordenan y se cruzan.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NOMBRE_ASPECTO, UMBRALES_POR_DEFECTO, aspectosObjetivo, type ResultadoFoto } from '@/server/analisisPiel'
// Fichas de ingredientes de la web de Hugo (hugosbeautyproject.com, contenido/panel-ingrediente), copiadas el 23/11/2026
import FICHAS from '@/server/datos/fichas-ingredientes.json'

const FICHA = FICHAS as Record<string, { frase: string; resumen: Record<string, string> }>

// Qué mide cada aspecto, en una frase. PENDIENTE: revisión de Hugo.
export const QUE_ES: Record<string, string> = {
  arrugas: 'Líneas finas y arrugas, sobre todo en la frente y alrededor de los ojos.',
  manchas: 'Zonas más oscuras por el sol o el paso del tiempo.',
  textura: 'La superficie de la piel se ve menos lisa y uniforme.',
  rojez: 'Zonas enrojecidas, sobre todo en mejillas y nariz.',
  brillo: 'Exceso de grasa en la superficie, sobre todo en la zona T.',
  firmeza: 'La piel ha perdido algo de tensión, sobre todo en el óvalo de la cara.',
  hidratacion: 'A la piel le falta agua: se ve más apagada y puede notarse tirante.',
  poros: 'Poros más visibles, sobre todo en nariz y mejillas.',
  ojeras: 'Sombra oscura bajo los ojos.',
  acne: 'Granitos e imperfecciones.',
  tono: 'Piel apagada o con el tono poco uniforme.',
}

const ALCANCE: Record<string, string> = {
  'trata': 'La cosmética lo trata bien.',
  'trata la arruga fina': 'La cosmética mejora la arruga fina; la profunda, poco.',
  'trata, despacio': 'Se trata, pero despacio.',
  'trata con rutina corta': 'Mejora con una rutina corta y suave.',
  'mejora': 'Mejora su aspecto con constancia.',
  'ayuda': 'La cosmética ayuda.',
  'ayuda poco': 'La cosmética ayuda poco: mejor tener expectativas realistas.',
  'acompaña': 'La rutina acompaña, pero no lo resuelve sola.',
}

const PROBLEMA_DE: Record<string, string> = Object.fromEntries(UMBRALES_POR_DEFECTO.map((u) => [u.aspecto, u.problema]))

export type Ingrediente = { nombre: string; turno: string | null; para: string[]; ahora: boolean; por_que: string; motivo: string | null; frase: string | null; cuando: string | null }
export type Objetivo = { aspecto: string; nombre: string; nota: number | null; que_es: string; alcance: string | null; plazo: string | null; ingredientes: string[] }
export type Lectura = { objetivos: Objetivo[]; ingredientes: Ingrediente[] }

/**
 * Objetivos en orden de prioridad (de la foto: del más marcado al menos; sin foto: lo que eligió la clienta)
 * y los ingredientes clave, una sola vez cada uno, con los objetivos que trata.
 */
export function construirLectura(foto: ResultadoFoto | null, mejorar: string[], rutinas: any): Lectura {
  const aspectos = (foto ? aspectosObjetivo(foto.puntuaciones).map((u) => u.aspecto) : mejorar.filter((a) => PROBLEMA_DE[a])).slice(0, 3)
  const problemas: any[] = rutinas?.perfil?.problemas ?? []
  const opciones: any[] = (rutinas?.rutinas?.completa?.ingredientes ?? []).filter((o: any) => o.papel !== 'alternativa')
  const ingredientes = new Map<string, Ingrediente>()
  const objetivos = aspectos.map((a) => {
    const pr = problemas.find((p) => p.id === PROBLEMA_DE[a])
    const nombre = NOMBRE_ASPECTO[a] ?? a
    const ings = pr ? opciones.filter((o) => (o.objetivos ?? []).includes(pr.corto)) : []
    for (const o of ings) {
      const ya = ingredientes.get(o.nombre)
      if (ya) { ya.para.push(nombre); continue }
      const f = o.ficha ? FICHA[o.ficha] : undefined
      // "Con 5 productos no cabe" es un detalle del motor; a la clienta le basta con saber que entra más adelante
      const motivo = o.motivo && !/no cabe/i.test(o.motivo) ? o.motivo : o.motivo ? 'Entraría en una rutina con más pasos.' : null
      ingredientes.set(o.nombre, { nombre: o.nombre, turno: o.turno ?? null, para: [nombre], ahora: o.papel !== 'no_ahora', por_que: o.por_que ?? '', motivo, frase: f?.frase || null, cuando: f?.resumen?.['Cuándo usar'] || null })
    }
    return {
      aspecto: a,
      nombre,
      nota: foto?.ui?.[a] != null ? Math.round(foto.ui[a]) : foto ? Math.round(100 - (foto.puntuaciones[a] ?? 0)) : null,
      que_es: QUE_ES[a] ?? '',
      alcance: pr ? ALCANCE[pr.alcance] ?? null : null,
      plazo: pr?.plazo && !/sin plazo/i.test(pr.plazo) ? pr.plazo : null,
      ingredientes: ings.map((o) => o.nombre),
    }
  })
  // Primero los que entran ya en la rutina
  return { objetivos, ingredientes: [...ingredientes.values()].sort((x, y) => Number(y.ahora) - Number(x.ahora)) }
}
