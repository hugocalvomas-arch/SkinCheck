import { createClient } from '@supabase/supabase-js'
import catalogo from '../../../../../data/catalogo.json'

// Importación única del catálogo de Hugo. Protegida con IMPORT_TOKEN.
// Se elimina (junto con la función SQL importar_productos) tras usarla.
export const maxDuration = 300

export async function POST(req: Request) {
  const token = req.headers.get('x-import-token')
  if (!process.env.IMPORT_TOKEN || token !== process.env.IMPORT_TOKEN) {
    return new Response('no autorizado', { status: 401 })
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  const lista = catalogo as unknown[]
  const tam = 250
  let total = 0
  for (let i = 0; i < lista.length; i += tam) {
    const { data, error } = await sb.rpc('importar_productos', {
      payload: lista.slice(i, i + tam),
      token,
    })
    if (error) return Response.json({ ok: false, desde: i, error: error.message, total }, { status: 500 })
    total += data as number
  }
  return Response.json({ ok: true, total })
}
