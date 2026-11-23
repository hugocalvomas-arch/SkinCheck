// Importación del catálogo en Supabase durante el build de Vercel.
// Solo se ejecuta si existe IMPORT_TOKEN. Es idempotente (upsert por id).
import { readFileSync } from 'node:fs'

const token = process.env.IMPORT_TOKEN
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!token || !url || !key) {
  console.log('[catalogo-motor] sin IMPORT_TOKEN: se omite la importación')
  process.exit(0)
}
const lista = JSON.parse(readFileSync(new URL('../data/catalogo_motor.json', import.meta.url)))
let total = 0
for (let i = 0; i < lista.length; i += 250) {
  const r = await fetch(`${url}/rest/v1/rpc/importar_productos`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: lista.slice(i, i + 250), token }),
  })
  if (!r.ok) {
    console.error('[catalogo-motor] error en el lote', i, r.status, await r.text())
    process.exit(0) // no rompe el build; se revisa en los logs
  }
  total += Number(await r.text())
}
console.log(`[catalogo-motor] importados ${total} productos`)
