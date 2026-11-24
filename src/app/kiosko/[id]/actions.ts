'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from '@/lib/supabase/server'
import { calcularRutinas } from '@/server/rutinas'
import { analizarFoto, problemasDesdeFoto, UMBRALES_POR_DEFECTO, type ResultadoFoto } from '@/server/analisisPiel'
import { construirLectura } from '@/server/lectura'
import { crearInformePdf } from '@/server/informePdf'
import type { Respuestas } from '@/lib/cuestionario'

export type Seguridad = { edad: string; sexo: 'mujer' | 'hombre' | 'nd'; embarazo: 'si' | 'no'; receta: 'si' | 'no'; reactiva: 'nunca' | 'a_veces' | 'siempre' }

async function esDeLaFarmacia(sb: Awaited<ReturnType<typeof supabaseServer>>, farmaciaId: string) {
  const { data: u } = await sb.auth.getUser()
  if (!u.user) return false
  const { data } = await sb.from('miembros').select('farmacia_id').eq('farmacia_id', farmaciaId).eq('user_id', u.user.id).maybeSingle()
  return !!data
}

// Freno contra el uso del iPad para mandar correos en masa: pocos envíos por análisis y solo en la hora siguiente.
// Es por instancia del servidor (best effort); la defensa principal es que hace falta la sesión de la farmacia.
const envios = new Map<string, number>()
const MAX_ENVIOS_POR_ANALISIS = 3

const PROBLEMA_DE: Record<string, string> = Object.fromEntries(UMBRALES_POR_DEFECTO.map((u) => [u.aspecto, u.problema]))

/** Recorrido de la clienta en el iPad: 4 respuestas de seguridad + foto (o, si no hay foto, lo que quiere mejorar). */
export async function analizarKiosko(farmaciaId: string, s: Seguridad, foto: string | null, mejorar: string[] = []) {
  const sb = await supabaseServer()
  // Se comprueba que el usuario del iPad es de esta farmacia ANTES de gastar un análisis de la API:
  // un admin que no es miembro vería la farmacia, pagaría el análisis y luego no podría guardarlo.
  if (!(await esDeLaFarmacia(sb, farmaciaId))) return { error: 'Este iPad no tiene acceso a la farmacia. Pide ayuda en el mostrador.' }
  if (foto && foto.length > 6_000_000) return { error: 'La foto es demasiado grande. Vuelve a hacerla.' }

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
  const { data, error } = await sb.from('consejos').insert({ farmacia_id: farmaciaId, respuestas: r, puntuaciones_foto: fotoRes, rutinas }).select('id').single()
  if (error) return { error: error.message }
  const lectura = construirLectura(fotoRes, mejorar, rutinas)
  return { id: data.id as string, rutinas: rutinas as unknown as Record<string, unknown>, foto: fotoRes, lectura }
}

/**
 * Informe completo en PDF al email de la clienta. El email solo se usa para este envío: no se guarda en ningún sitio.
 * Necesita RESEND_API_KEY y INFORME_REMITENTE (p. ej. "SkinCheck <informe@tudominio.es>") en Vercel.
 */
export async function enviarInformeEmail(consejoId: string, email: string, fotoCliente: string | null, nivel: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Revisa el email: parece que no está bien escrito.' }
  const clave = process.env.RESEND_API_KEY
  const remitente = process.env.INFORME_REMITENTE
  if (!clave || !remitente) return { error: 'El envío por email aún no está activado en esta farmacia. Pide el informe en el mostrador.' }

  const sb = await supabaseServer()
  const { data: c } = await sb.from('consejos').select('creado, respuestas, puntuaciones_foto, rutinas, farmacias(nombre)').eq('id', consejoId).maybeSingle()
  if (!c) return { error: 'No encontramos tu análisis. Pide ayuda en el mostrador.' }
  if (Date.now() - new Date(c.creado as string).getTime() > 60 * 60 * 1000) return { error: 'Este análisis ya no admite envíos por email. Pide el informe en el mostrador.' }
  const n = envios.get(consejoId) ?? 0
  if (n >= MAX_ENVIOS_POR_ANALISIS) return { error: 'Ya hemos enviado este informe varias veces. Pide ayuda en el mostrador.' }
  envios.set(consejoId, n + 1)
  if (envios.size > 5000) envios.clear()
  const rutinas = c.rutinas as any
  const foto = (c.puntuaciones_foto ?? null) as ResultadoFoto | null
  const extra: string[] = (c.respuestas as any)?.problemas_extra ?? []
  const mejorar = UMBRALES_POR_DEFECTO.filter((u) => extra.includes(u.problema)).map((u) => u.aspecto)
  const lectura = construirLectura(foto, mejorar, rutinas)
  const rutina = rutinas?.rutinas?.[nivel] ?? rutinas?.rutinas?.media
  const farmacia = (c.farmacias as any)?.nombre ?? 'Tu farmacia'

  let pdf: Buffer
  try {
    pdf = await crearInformePdf({ farmacia, foto, fotoCliente, lectura, rutina, avisos: rutina?.avisos ?? [] })
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
