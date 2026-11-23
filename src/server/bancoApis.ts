// Banco de pruebas de APIs de análisis de piel: pasa las mismas caras de ejemplo por cada proveedor con clave
// y lo pone al lado de Perfect Corp. Solo lo usa el panel de administración; no toca a las clientas.
import fs from 'node:fs/promises'
import path from 'node:path'

export type Medida = { clave: string; aspecto: string | null; valor: string }
export type Prueba = { proveedor: string; cara: string; ms: number; medidas: Medida[]; error?: string }

// Caras generadas con IA, las mismas del vídeo de la portada y del antes/después
export const CARAS = [
  { id: '35', nombre: 'Mujer, 35 años', foto: '/ejemplos/antes.jpg' },
  { id: '55', nombre: 'Mujer, 55 años', foto: '/ejemplos/cara-55.jpg' },
  // Sin referencia de Perfect Corp (no quedan unidades): sirven para ver si cada API detecta acné, arrugas y manchas marcadas
  { id: 'h25', nombre: 'Hombre, 25 años, con acné', foto: '/ejemplos/hombre-25.jpg' },
  { id: 'h60', nombre: 'Hombre, 60 años', foto: '/ejemplos/hombre-60.jpg' },
] as const

// Resultado real de Perfect Corp (23/11/2026) para esas caras, en su escala: 0-100, más alto = mejor.
// No se vuelve a llamar para no gastar unidades.
export const REFERENCIA: Record<string, { global: number; edad: number; ui: Record<string, number> }> = {
  '35': { global: 73.6, edad: 37, ui: { firmeza: 78, poros: 70, brillo: 67, rojez: 68, ojeras: 69, textura: 65, tono: 80, manchas: 75, acne: 91, arrugas: 77, hidratacion: 70 } },
  '55': { global: 67.5, edad: 61, ui: { firmeza: 57, brillo: 69, tono: 60, rojez: 73, poros: 67, textura: 64, manchas: 66, ojeras: 77, acne: 88, arrugas: 61, hidratacion: 61 } },
}

type Proveedor = { id: string; nombre: string; variables: string[]; analizar: (jpg: Buffer) => Promise<Medida[]> }

// Face++ Skin Analyze: gratis (cuota mensual). Devuelve presencia (0/1) por rasgo, no una nota.
const FACEPP_ASPECTO: Record<string, string> = {
  dark_circle: 'ojeras', eye_pouch: 'ojeras', forehead_wrinkle: 'arrugas', crows_feet: 'arrugas', eye_finelines: 'arrugas',
  glabella_wrinkle: 'arrugas', nasolabial_fold: 'firmeza', pores_forehead: 'poros', pores_left_cheek: 'poros',
  pores_right_cheek: 'poros', pores_jaw: 'poros', blackhead: 'poros', acne: 'acne', skin_spot: 'manchas',
}
const TIPO_PIEL = ['grasa', 'seca', 'normal', 'mixta']

const PROVEEDORES: Proveedor[] = [
  {
    id: 'facepp',
    nombre: 'Face++ (Megvii)',
    variables: ['FACEPP_API_KEY', 'FACEPP_API_SECRET'],
    async analizar(jpg) {
      const f = new FormData()
      f.set('api_key', process.env.FACEPP_API_KEY!)
      f.set('api_secret', process.env.FACEPP_API_SECRET!)
      f.set('image_base64', jpg.toString('base64'))
      // La clave gratis admite pocas llamadas por segundo: si responde CONCURRENCY_LIMIT_EXCEEDED, se espera y se reintenta
      let r: Response, d: any // eslint-disable-line @typescript-eslint/no-explicit-any
      for (let i = 0; ; i++) {
        r = await fetch('https://api-us.faceplusplus.com/facepp/v1/skinanalyze', { method: 'POST', body: f, signal: AbortSignal.timeout(30000) })
        d = await r.json()
        if (d.error_message !== 'CONCURRENCY_LIMIT_EXCEEDED' || i >= 4) break
        await new Promise((ok) => setTimeout(ok, 1500))
      }
      if (!r.ok || d.error_message) throw new Error(d.error_message ?? `HTTP ${r.status}`)
      return Object.entries(d.result ?? {}).map(([clave, v]: [string, any]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (clave === 'skin_type') return { clave, aspecto: null, valor: `tipo: ${TIPO_PIEL[v?.skin_type] ?? v?.skin_type}` }
        const conf = v?.confidence != null ? ` (${Math.round(v.confidence * 100)}%)` : ''
        return { clave, aspecto: FACEPP_ASPECTO[clave] ?? null, valor: `${v?.value === '1' || v?.value === 1 ? 'sí' : 'no'}${conf}` }
      })
    },
  },
]

export function proveedores() {
  return PROVEEDORES.map((p) => ({ id: p.id, nombre: p.nombre, variables: p.variables, listo: p.variables.every((v) => !!process.env[v]) }))
}

export async function probar(id: string): Promise<Prueba[]> {
  const p = PROVEEDORES.find((x) => x.id === id)
  if (!p) return []
  const out: Prueba[] = []
  for (const c of CARAS) {
    const t0 = Date.now()
    try {
      const jpg = await fs.readFile(path.join(process.cwd(), 'public', c.foto))
      out.push({ proveedor: p.nombre, cara: c.id, ms: Date.now() - t0, medidas: await p.analizar(jpg) })
      out[out.length - 1].ms = Date.now() - t0
    } catch (e) {
      out.push({ proveedor: p.nombre, cara: c.id, ms: Date.now() - t0, medidas: [], error: (e as Error).message })
    }
  }
  // Queda en los registros de Vercel para poder actualizar la comparativa (solo caras de IA, sin datos de clientas)
  for (const x of out) console.log('[banco-apis]', x.proveedor, x.cara, x.error ?? x.medidas.map((m) => `${m.clave}=${m.valor}`).join(' '))
  return out
}
