'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from '@/lib/supabase/server'
import { calcularRutinas } from '@/server/rutinas'
import { analizarFoto, problemasDesdeFoto, UMBRALES_POR_DEFECTO, type ResultadoFoto } from '@/server/analisisPiel'
import { construirLectura } from '@/server/lectura'
import { crearInformePdf, type AnteriorPdf } from '@/server/informePdf'
import type { Respuestas } from '@/lib/cuestionario'
import { randomInt } from 'node:crypto'
import { registroConsentimiento } from '@/lib/privacidad'

export type Seguridad = { edad: string; sexo: 'mujer' | 'hombre' | 'nd'; embarazo: 'si' | 'no'; receta: 'si' | 'no'; reactiva: 'nunca' | 'a_veces' | 'siempre' }

const PROBLEMA_DE: Record<string, string> = Object.fromEntries(UMBRALES_POR_DEFECTO.map((u) => [u.aspecto, u.problema]))

/** Recorrido de la clienta en el iPad: 4 respuestas de seguridad + foto (o, si no hay foto, lo que quiere mejorar). */
/** Datos del primer análisis que se enseñan en la revisión. */
export type Anterior = { fecha: string; dias: number; ui: Record<string, number>; global?: number; edad?: number; foto: string | null }
export type Extra = { guardarFoto?: boolean; seguimientoDe?: string }

// Sin letras ni números que se confundan (O/0, I/1, S/5, B/8)
const ALFABETO = 'ACDEFGHJKMNPQRTUVWXY34679'
const nuevoCodigo = () => Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('').replace(/^(...)(...)$/, '$1-$2')
const normalizar = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(...)(...)$/, '$1-$2')
const diasDesde = (f: string) => Math.max(0, Math.floor((Date.now() - new Date(f).getTime()) / 86_400_000))

export async function analizarKiosko(farmaciaId: string, s: Seguridad, foto: string | null, mejorar: string[] = [], acepta = false, extra: Extra = {}) {
  // Embarazo y tratamientos médicos son datos de salud (art. 9 RGPD): sin permiso expreso no se trata nada
  if (acepta !== true) return { error: 'Necesitamos tu permiso para continuar. Si lo prefieres, pide consejo en el mostrador.' }
  const sb = await supabaseServer()
  const { data: f } = await sb.from('farmacias').select('id').eq('id', farmaciaId).maybeSingle()
  if (!f) return { error: 'Este iPad no tiene acceso a la farmacia. Pide ayuda en el mostrador.' }

  // Respuestas que lee el motor de Hugo. Lo que no se pregunta va con el valor más prudente.
  const r: Respuestas = {
    edad: s.edad,
    sexo: s.sexo ?? 'nd', // la API de piel no detecta el sexo: se pregunta
    embarazo: s.sexo === 'hombre' ? 'no' : s.embarazo,
    receta: s.receta,
    reactiva: s.reactiva,
    sienta: ['nada'],
    retinoide_exp: 'nunca',
    fototipo: 'III',
    textura: 'igual',
    preocupa: ['nada'],
    piel: 'normal',
    kiosko: true,
    consentimiento: registroConsentimiento(!!foto, 'kiosko', !!extra.guardarFoto && !extra.seguimientoDe),
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

  // Revisión: el primer análisis tiene que ser de esta farmacia (lo garantiza también la RLS)
  let anterior: Anterior | null = null
  if (extra.seguimientoDe) {
    const { data: a } = await sb.from('consejos').select('id, creado, puntuaciones_foto').eq('id', extra.seguimientoDe).eq('farmacia_id', farmaciaId).maybeSingle()
    const pf = a?.puntuaciones_foto as ResultadoFoto | null
    if (a && pf?.ui) {
      const { data: fs } = await sb.from('fotos_seguimiento').select('jpeg_base64').eq('consejo_id', a.id).maybeSingle()
      anterior = { fecha: a.creado, dias: diasDesde(a.creado), ui: pf.ui, global: pf.puntuacion_global, edad: pf.edad_piel, foto: fs ? `data:image/jpeg;base64,${fs.jpeg_base64}` : null }
    }
  }

  // Código de revisión solo si hay foto (sin puntuaciones no hay nada que comparar) y no es ya una revisión
  const conCodigo = !!fotoRes && !extra.seguimientoDe
  let fila: { id: string; codigo: string | null } | null = null
  for (let intento = 0; intento < 4 && !fila; intento++) {
    const codigo = conCodigo ? nuevoCodigo() : null
    const { data, error } = await sb.from('consejos')
      .insert({ farmacia_id: farmaciaId, respuestas: r, puntuaciones_foto: fotoRes, rutinas, codigo, seguimiento_de: anterior ? extra.seguimientoDe : null })
      .select('id, codigo').single()
    if (!error) fila = data
    else if (error.code !== '23505') return { error: error.message } // 23505: código repetido en esta farmacia, se prueba otro
  }
  if (!fila) return { error: 'No se ha podido guardar el análisis. Inténtalo de nuevo.' }

  // Foto guardada 35 días solo con el permiso aparte; si falla, el análisis sigue valiendo
  if (foto && fotoRes && extra.guardarFoto && !extra.seguimientoDe) {
    const { error } = await sb.from('fotos_seguimiento').insert({ consejo_id: fila.id, farmacia_id: farmaciaId, jpeg_base64: foto })
    if (error) console.error('[seguimiento] foto no guardada', error.message)
  }

  const lectura = construirLectura(fotoRes, mejorar, rutinas)
  return { id: fila.id, codigo: fila.codigo, rutinas: rutinas as unknown as Record<string, unknown>, foto: fotoRes, lectura, anterior }
}

/** Revisión: busca el primer análisis por su código, solo dentro de esta farmacia. */
export async function buscarSeguimiento(farmaciaId: string, codigo: string) {
  const c = normalizar(codigo)
  if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(c)) return { error: 'El código tiene 6 caracteres, por ejemplo K7P-4QX.' }
  const sb = await supabaseServer()
  const { data } = await sb.from('consejos').select('id, creado').eq('farmacia_id', farmaciaId).eq('codigo', c).maybeSingle()
  if (!data) return { error: 'No encontramos ese código en esta farmacia. Revísalo o pide ayuda en el mostrador.' }
  const { count } = await sb.from('fotos_seguimiento').select('consejo_id', { count: 'exact', head: true }).eq('consejo_id', data.id)
  return { id: data.id as string, fecha: data.creado as string, dias: diasDesde(data.creado), conFoto: (count ?? 0) > 0 }
}

/** Derecho de supresión desde el iPad: borra la foto guardada y anula el código. */
export async function borrarSeguimiento(farmaciaId: string, consejoId: string) {
  const sb = await supabaseServer()
  await sb.from('fotos_seguimiento').delete().eq('consejo_id', consejoId).eq('farmacia_id', farmaciaId)
  // Supresión (art. 17 RGPD): igual que la purga de los 12 meses. Se borran las respuestas de salud, las puntuaciones,
  // el perfil y el código; la farmacia conserva solo la rutina propuesta y si la vendió.
  const { data: c } = await sb.from('consejos').select('rutinas').eq('id', consejoId).eq('farmacia_id', farmaciaId).maybeSingle()
  const rutinas = c?.rutinas && typeof c.rutinas === 'object' ? structuredClone(c.rutinas) : c?.rutinas ?? null
  if (rutinas && typeof rutinas === 'object') {
    for (const k of ['perfil', 'derivacion', 'no_recomiendo']) delete rutinas[k]
    for (const n of ['basica', 'media', 'completa']) if (rutinas.rutinas?.[n]) delete rutinas.rutinas[n].avisos
  }
  const { error } = await sb.from('consejos')
    .update({ codigo: null, respuestas: { purgado: true, borrado_por_la_clienta: new Date().toISOString() }, puntuaciones_foto: null, rutinas })
    .eq('id', consejoId).eq('farmacia_id', farmaciaId)
  if (error) return { error: 'No se ha podido borrar. Pide ayuda en el mostrador.' }
  return { ok: true as const }
}

/**
 * Informe completo en PDF al email de la clienta. SkinRead no guarda el email; Resend conserva un registro del envío
 * (en su cuenta, en EE. UU.), así que hay que contarlo en el aviso (AVISO_EMAIL).
 * Necesita RESEND_API_KEY y INFORME_REMITENTE (p. ej. "SkinRead <informe@tudominio.es>") en Vercel.
 */
export async function enviarInformeEmail(consejoId: string, email: string, fotoCliente: string | null, nivel: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Revisa el email: parece que no está bien escrito.' }
  const clave = process.env.RESEND_API_KEY
  const remitente = process.env.INFORME_REMITENTE
  if (!clave || !remitente) return { error: 'El envío por email aún no está activado en esta farmacia. Pide el informe en el mostrador.' }

  const sb = await supabaseServer()
  const { data: c } = await sb.from('consejos').select('respuestas, puntuaciones_foto, rutinas, codigo, seguimiento_de, farmacias(nombre)').eq('id', consejoId).maybeSingle()
  if (!c) return { error: 'No encontramos tu análisis. Pide ayuda en el mostrador.' }
  const rutinas = c.rutinas as any
  const foto = (c.puntuaciones_foto ?? null) as ResultadoFoto | null
  const extra: string[] = (c.respuestas as any)?.problemas_extra ?? []
  const mejorar = UMBRALES_POR_DEFECTO.filter((u) => extra.includes(u.problema)).map((u) => u.aspecto)
  const lectura = construirLectura(foto, mejorar, rutinas)
  const rutina = rutinas?.rutinas?.[nivel] ?? rutinas?.rutinas?.media
  const farmacia = (c.farmacias as any)?.nombre ?? 'Tu farmacia'

  let pdf: Buffer
  try {
    let anterior: AnteriorPdf | null = null
    if (c.seguimiento_de) {
      const { data: a } = await sb.from('consejos').select('creado, puntuaciones_foto').eq('id', c.seguimiento_de).maybeSingle()
      const pf = a?.puntuaciones_foto as ResultadoFoto | null
      if (a && pf?.ui) {
        const { data: fs } = await sb.from('fotos_seguimiento').select('jpeg_base64').eq('consejo_id', c.seguimiento_de).maybeSingle()
        anterior = { fecha: a.creado, ui: pf.ui, global: pf.puntuacion_global, edad: pf.edad_piel, foto: fs ? `data:image/jpeg;base64,${fs.jpeg_base64}` : null }
      }
    }
    pdf = await crearInformePdf({ farmacia, foto, fotoCliente, lectura, rutina, avisos: rutina?.avisos ?? [], codigo: c.codigo as string | null, anterior })
  } catch {
    return { error: 'No hemos podido preparar el informe. Inténtalo de nuevo.' }
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: remitente,
      to: [email],
      subject: `Tu informe de piel · ${farmacia}`,
      text: `Hola:\n\nTe enviamos el informe completo de tu análisis de piel en ${farmacia}: tus resultados explicados, las fotos por zona, los ingredientes que te convienen y tu rutina paso a paso.\n\nSi tienes cualquier duda, pásate por la farmacia.\n\nEste informe es orientativo y no sustituye a una consulta médica.`,
      attachments: [{ filename: 'informe-piel.pdf', content: pdf.toString('base64') }],
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null)
  if (!r?.ok) return { error: 'No se ha podido enviar. Revisa el email o inténtalo en un momento.' }
  return { ok: true as const }
}
