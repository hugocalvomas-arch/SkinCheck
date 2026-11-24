// Puente entre la foto y el motor: aplica las reglas de la base de conocimiento (motor/reglas-foto.json).
// Solo en el servidor: las reglas no llegan al navegador.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { Respuestas } from '@/lib/cuestionario'
import type { ResultadoFoto } from '@/server/analisisPiel'
const { aplicarAlMotor, notasDe } = require('./motor/reglasFoto.js')

/**
 * Añade a las respuestas lo que deciden las reglas de la foto: problemas, vetos, puntos por activo, avisos y prioridad.
 * Con `fijarPiel`, el tipo de piel sale de la foto (en el iPad no se pregunta; en el mostrador sí, y manda la respuesta).
 */
export function conReglasFoto(r: Respuestas, foto: ResultadoFoto, fijarPiel = true) {
  return aplicarAlMotor(r, notasDe(foto), { fijarPiel })
}
