// Puente entre la foto y el motor: aplica las reglas de la base de conocimiento (motor/reglas-foto.json).
// Solo en el servidor: las reglas no llegan al navegador.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { Respuestas } from '@/lib/cuestionario'
import type { ResultadoFoto } from '@/server/analisisPiel'
const { aplicarReglasFoto, notasDe } = require('./motor/reglasFoto.js')

/**
 * Añade a las respuestas lo que deciden las reglas de la foto: problemas, vetos, puntos por activo, avisos y prioridad.
 * Con `fijarPiel`, el tipo de piel sale de la foto (en el iPad no se pregunta; en el mostrador sí, y manda la respuesta).
 */
export function conReglasFoto(r: Respuestas, foto: ResultadoFoto, fijarPiel = true) {
  const rf = aplicarReglasFoto(notasDe(foto), r)
  r.problemas_extra = [...new Set([...(r.problemas_extra ?? []), ...rf.problemas_extra])]
  r.veto_extra = { ...rf.veto_extra, ...(r.veto_extra ?? {}) }
  r.bonus_activos = rf.bonus_activos
  r.derivacion_extra = [...(r.derivacion_extra ?? []), ...rf.derivacion_extra]
  r.avisos_extra = rf.avisos_extra
  r.prioridad_foto = rf.prioridad_foto
  r.limites = rf.limites
  r.mantenimiento = rf.mantenimiento
  r.solar_color = rf.solar_color
  r.hidratante_req = rf.hidratante_req
  r.notas_foto = rf.notas_foto
  r.aspecto_problema = rf.aspecto_problema
  r.reglas_foto = { version: rf.version_reglas, ids: rf.reglas_aplicadas.map((x: any) => x.id) }
  if (fijarPiel && rf.piel) r.piel = rf.piel
  return rf
}
