import { NextResponse, type NextRequest } from 'next/server'
import { usuarioActual } from '@/lib/auth'
import { analizarFoto } from '@/server/analisisPiel'

// TEMPORAL: pasa la cara de ejemplo de la portada (public/ejemplos/cara-ia.jpg, generada con IA) una vez por
// Perfect Corp y descarga un .zip con las imágenes que devuelve. Solo administradores. Gasta unas 18 unidades.
// Borrar en cuanto tengamos las imágenes.
export const maxDuration = 60

const crcTabla = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (const x of b) c = crcTabla[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }

// Zip sin compresión (store): basta para unas pocas imágenes.
function zip(archivos: { nombre: string; datos: Uint8Array }[]) {
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const f of archivos) {
    const nombre = new TextEncoder().encode(f.nombre)
    const crc = crc32(f.datos)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint32(14, crc, true)
    local.setUint32(18, f.datos.length, true); local.setUint32(22, f.datos.length, true); local.setUint16(26, nombre.length, true)
    partes.push(new Uint8Array(local.buffer), nombre, f.datos)
    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint32(16, crc, true)
    cen.setUint32(20, f.datos.length, true); cen.setUint32(24, f.datos.length, true); cen.setUint16(28, nombre.length, true); cen.setUint32(42, offset, true)
    central.push(new Uint8Array(cen.buffer), nombre)
    offset += 30 + nombre.length + f.datos.length
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0)
  const fin = new DataView(new ArrayBuffer(22))
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true)
  fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true)
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)] as BlobPart[], { type: 'application/zip' })
}

const pagina = (cuerpo: string) => new NextResponse(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Análisis de la cara de ejemplo</title><body style="font:16px system-ui;max-width:34rem;margin:3rem auto;padding:0 1rem;line-height:1.5">${cuerpo}</body>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
)

export async function GET(req: NextRequest) {
  const { esAdmin } = await usuarioActual()
  if (!esAdmin) return new NextResponse('Solo administradores.', { status: 403 })
  if (req.nextUrl.searchParams.get('confirmar') !== '1') {
    return pagina(`<h1 style="font-size:1.4rem">Analizar la cara de ejemplo</h1><img src="/ejemplos/cara-ia.jpg" alt="" style="width:9rem;border-radius:8px"><p>Pasa esta foto (generada con IA) una vez por Perfect Corp. Gasta unas 18 unidades y tarda hasta un minuto. Al terminar se descarga un .zip con las imágenes.</p><form><input type="hidden" name="confirmar" value="1"><button style="font:inherit;padding:.7rem 1.2rem;background:#0b6e5b;color:#fff;border:0;border-radius:8px">Analizar y descargar</button></form>`)
  }
  const foto = await fetch(new URL('/ejemplos/cara-ia.jpg', req.url))
  if (!foto.ok) return new NextResponse('No encuentro la foto de ejemplo.', { status: 500 })
  const r = await analizarFoto(Buffer.from(await foto.arrayBuffer()).toString('base64'))
  if ('error' in r) return pagina(`<p>Error: ${r.error}</p>`)
  const urls = [...r.imagenes.marcas, ...(r.imagenes.despues ? [r.imagenes.despues] : [])]
  const archivos: { nombre: string; datos: Uint8Array }[] = [
    { nombre: 'resultado.json', datos: new TextEncoder().encode(JSON.stringify({ ...r, imagenes: { ...r.imagenes, urls } }, null, 2)) },
  ]
  for (const [k, u] of urls.entries()) {
    try {
      const res = await fetch(u)
      if (!res.ok) continue
      const tipo = res.headers.get('content-type') ?? ''
      const ext = tipo.includes('png') ? 'png' : tipo.includes('jpeg') || tipo.includes('jpg') ? 'jpg' : (new URL(u).pathname.split('.').pop() ?? 'bin').slice(0, 4)
      const base = u === r.imagenes.despues ? 'despues' : (new URL(u).pathname.split('/').pop() ?? `imagen_${k}`).replace(/\.[a-z0-9]+$/i, '').slice(0, 40)
      archivos.push({ nombre: `${String(k + 1).padStart(2, '0')}_${base}.${ext}`, datos: new Uint8Array(await res.arrayBuffer()) })
    } catch { /* una imagen que falle no bloquea las demás */ }
  }
  return new NextResponse(zip(archivos), { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="analisis-cara-ejemplo.zip"' } })
}
