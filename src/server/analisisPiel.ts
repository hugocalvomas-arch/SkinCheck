// Análisis de la foto con Perfect Corp (YouCam AI API v2). Cambiar de proveedor = cambiar este archivo.
// La foto se envía al proveedor y no se guarda en SkinCheck. Perfect Corp devuelve puntuaciones
// y enlaces a imágenes (cara con zonas marcadas y simulación del "después") que caducan en unas 2 horas.

export type Puntuaciones = Record<string, number> // aspecto -> 0..100 (más alto = más marcado)

export type ResultadoFoto = {
  puntuaciones: Puntuaciones
  /** ui_score original de Perfect Corp por aspecto (más alto = piel mejor) */
  ui: Record<string, number>
  edad_piel?: number
  puntuacion_global?: number
  imagenes: { marcas: string[]; despues?: string; caducan: string }
}

/** Aspecto de la foto -> problema del motor de Hugo, con el umbral por defecto (provisional, hay que calibrarlo). */
export const UMBRALES_POR_DEFECTO: { aspecto: string; problema: string; umbral: number }[] = [
  { aspecto: 'acne', problema: 'P02', umbral: 40 },
  { aspecto: 'poros', problema: 'P07', umbral: 40 },
  { aspecto: 'brillo', problema: 'P06', umbral: 40 },
  { aspecto: 'manchas', problema: 'P12', umbral: 40 },
  { aspecto: 'tono', problema: 'P14', umbral: 40 },
  { aspecto: 'arrugas', problema: 'P17', umbral: 40 },
  { aspecto: 'firmeza', problema: 'P19', umbral: 40 },
  { aspecto: 'textura', problema: 'P20', umbral: 40 },
  { aspecto: 'rojez', problema: 'P23', umbral: 40 },
  { aspecto: 'hidratacion', problema: 'P29', umbral: 40 },
  { aspecto: 'ojeras', problema: 'P15', umbral: 40 },
]

export const NOMBRE_ASPECTO: Record<string, string> = {
  acne: 'Granitos', poros: 'Poros', brillo: 'Brillo', manchas: 'Manchas', tono: 'Luminosidad', arrugas: 'Arrugas',
  firmeza: 'Firmeza', textura: 'Textura', rojez: 'Rojeces', hidratacion: 'Hidratación', ojeras: 'Ojeras',
}

// aspecto -> clave de Perfect Corp en el análisis (SD) y en la simulación
const ANALISIS: Record<string, string> = {
  acne: 'acne', poros: 'pore', brillo: 'oiliness', manchas: 'age_spot', tono: 'radiance', arrugas: 'wrinkle',
  firmeza: 'firmness', textura: 'texture', rojez: 'redness', hidratacion: 'moisture', ojeras: 'dark_circle_v2',
}
const SIMULACION: Record<string, string> = {
  acne: 'acne', poros: 'pores', brillo: 'oiliness', manchas: 'spots', tono: 'radiance', arrugas: 'wrinkle',
  textura: 'texture', rojez: 'redness', ojeras: 'dark_circle',
}

export function problemasDesdeFoto(p: Puntuaciones, umbrales = UMBRALES_POR_DEFECTO) {
  return [...new Set(umbrales.filter((u) => (p[u.aspecto] ?? 0) >= u.umbral).map((u) => u.problema))]
}

const BASE = 'https://yce-api-01.makeupar.com'
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Api = (ruta: string, init?: { method?: string; body?: unknown }) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any

function cliente(clave: string): Api {
  return async (ruta, init = {}) => {
    const res = await fetch(BASE + ruta, {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new ErrorProveedor(res.status, json?.error_code ?? json?.error ?? `HTTP ${res.status}`)
    return json
  }
}

class ErrorProveedor extends Error {
  constructor(public status: number, public codigo: string) { super(codigo) }
}

const MENSAJES: Record<string, string> = {
  error_no_face: 'No se ve ninguna cara en la foto. Repite la foto de frente.',
  error_src_face_too_small: 'La cara sale muy pequeña. Acércate más a la cámara.',
  error_src_face_out_of_bound: 'La cara se sale de la foto. Céntrala dentro del óvalo.',
  error_lighting_dark: 'Hay poca luz. Busca un sitio más iluminado y repite la foto.',
  error_pose: 'Mira de frente a la cámara y repite la foto.',
  error_below_min_image_size: 'La foto tiene poca resolución. Repite la foto.',
  CreditInsufficiency: 'Se han agotado las unidades del servicio de análisis. Avisa a la farmacia.',
  'Invalid API key': 'La clave del servicio de análisis no es válida.',
}
const mensaje = (codigo: string) => MENSAJES[codigo] ?? `No se ha podido analizar la foto (${codigo}). Repite la foto o sigue sin ella.`

async function subir(api: Api, jpeg: Buffer) {
  const r = await api('/s2s/v2.0/file', { method: 'POST', body: { files: [{ content_type: 'image/jpeg', file_name: 'foto.jpg', file_size: jpeg.length }] } })
  const f = r?.data?.files?.[0]
  const put = f?.requests?.[0]
  if (!f?.file_id || !put?.url) throw new ErrorProveedor(500, 'respuesta de subida inesperada')
  const res = await fetch(put.url, { method: put.method ?? 'PUT', headers: put.headers ?? { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(jpeg) })
  if (!res.ok) throw new ErrorProveedor(res.status, 'error_upload')
  return f.file_id as string
}

async function esperarTarea(api: Api, ruta: string, limiteMs = 45_000) {
  const inicio = Date.now()
  let pausa = 1500
  while (Date.now() - inicio < limiteMs) {
    await espera(pausa)
    pausa = Math.min(pausa + 500, 3000)
    const r = await api(ruta)
    const d = r?.data ?? {}
    const estado = d.task_status ?? d.status
    if (estado === 'success') return d
    if (estado === 'error') throw new ErrorProveedor(400, d.error ?? d.error_message ?? 'error')
  }
  throw new ErrorProveedor(504, 'TaskTimeout')
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Su documentación muestra dos formas de resultado: lista `output[]` con `type`, o un objeto por aspecto.
function leerPuntuaciones(d: any) {
  const ui: Record<string, number> = {}
  const urls: string[] = []
  let global: number | undefined, edad: number | undefined
  const porClave = Object.fromEntries(Object.entries(ANALISIS).map(([a, k]) => [k, a]))
  const visitar = (nodo: any, clave?: string) => {
    if (!nodo || typeof nodo !== 'object') return
    if (Array.isArray(nodo)) return nodo.forEach((x) => visitar(x, clave))
    const tipo = nodo.type ?? clave
    if (typeof nodo.ui_score === 'number' && tipo && porClave[tipo] && ui[porClave[tipo]] == null) ui[porClave[tipo]] = nodo.ui_score
    if (tipo === 'all' || tipo === 'all_score') global ??= nodo.score ?? nodo.ui_score
    if (tipo === 'skin_age') edad ??= nodo.score ?? nodo.ui_score ?? nodo.value
    for (const [k, v] of Object.entries(nodo)) {
      if (typeof v === 'string' && /^https?:\/\//.test(v)) urls.push(v)
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) urls.push(...v.filter((x) => /^https?:\/\//.test(x)))
      else if (k === 'skin_age' && typeof v === 'number') edad ??= v
      else if (k === 'all' && v && typeof v === 'object' && typeof (v as any).score === 'number') global ??= (v as any).score
      else visitar(v, k)
    }
  }
  visitar(d.results ?? d)
  return { ui, urls: [...new Set(urls)], global, edad }
}

// Forma del resultado sin enlaces, para calibrar (aparece en los logs de Vercel)
function forma(x: any, prof = 0): any {
  if (prof > 4) return '…'
  if (Array.isArray(x)) return x.length ? [forma(x[0], prof + 1), `(${x.length})`] : []
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, forma(v, prof + 1)]))
  return typeof x === 'string' ? (x.startsWith('http') ? 'url' : x.slice(0, 30)) : x
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function analizarFoto(jpegBase64: string): Promise<ResultadoFoto | { error: string }> {
  const clave = process.env.PERFECTCORP_API_KEY
  if (!clave) return { error: 'El análisis con foto aún no está activado (falta la clave del proveedor). Sigue sin foto.' }
  if (jpegBase64.length > 4_000_000) return { error: 'La foto es demasiado grande.' }
  const api = cliente(clave)
  try {
    const fileId = await subir(api, Buffer.from(jpegBase64, 'base64'))

    // 1. Análisis: 11 aspectos en calidad SD (14 unidades), con las zonas pintadas sobre la cara
    const t = await api('/s2s/v2.0/task/skin-analysis', {
      method: 'POST',
      body: { src_file_id: fileId, dst_actions: Object.values(ANALISIS), miniserver_args: { enable_mask_overlay: true }, format: 'json' },
    })
    const d = await esperarTarea(api, `/s2s/v2.0/task/skin-analysis/${t.data.task_id}`)
    console.log('[perfectcorp] analisis', JSON.stringify(forma(d)))
    const { ui, urls, global, edad } = leerPuntuaciones(d)
    if (!Object.keys(ui).length) return { error: 'El servicio de análisis ha respondido en un formato inesperado. Sigue sin foto.' }
    const puntuaciones: Puntuaciones = Object.fromEntries(Object.entries(ui).map(([a, s]) => [a, Math.max(0, Math.min(100, 100 - s))]))

    // 2. Simulación del "después": los 4 aspectos más marcados que se pueden simular (4 unidades)
    let despues: string | undefined
    const top = Object.entries(puntuaciones).filter(([a, v]) => SIMULACION[a] && v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4)
    if (top.length) {
      try {
        const cuerpo: Record<string, unknown> = { src_file_id: fileId }
        for (const [a, v] of top) cuerpo[SIMULACION[a]] = Math.round(Math.min(0.8, Math.max(0.3, v / 100 + 0.2)) * 100) / 100
        const ts = await api('/s2s/v2.0/task/skin-simulation', { method: 'POST', body: cuerpo })
        const ds = await esperarTarea(api, `/s2s/v2.0/task/skin-simulation/${ts.data.task_id}`)
        console.log('[perfectcorp] simulacion', JSON.stringify(forma(ds)))
        despues = leerPuntuaciones(ds).urls[0]
      } catch (e) {
        console.error('[perfectcorp] simulacion fallida', (e as Error).message) // el análisis sigue valiendo sin simulación
      }
    }

    return {
      puntuaciones,
      ui,
      edad_piel: edad,
      puntuacion_global: global,
      imagenes: { marcas: urls, despues, caducan: new Date(Date.now() + 2 * 3600_000).toISOString() },
    }
  } catch (e) {
    const codigo = e instanceof ErrorProveedor ? e.codigo : (e as Error).message
    console.error('[perfectcorp] error', codigo)
    return { error: mensaje(codigo) }
  }
}
