// Lee en el navegador la exportación de stock de la farmacia.
// Admite Excel (.xlsx, .xls, .ods), CSV y TXT delimitado (; , tabulador o |),
// en UTF-8 o Windows-1252 (lo habitual en programas de gestión antiguos).
import Papa from 'papaparse'
import { puntuarFilaCabecera } from './codigos'

export type Tabla = { cabeceras: string[]; filas: Record<string, string>[]; aviso?: string }

async function aMatriz(file: File): Promise<{ matriz: unknown[][]; aviso?: string }> {
  const nombre = file.name.toLowerCase()
  if (/\.(xlsx|xlsm|xls|ods)$/.test(nombre)) {
    const XLSX = await import('xlsx')
    const libro = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    // la hoja con más filas suele ser la del listado
    const hoja = libro.SheetNames.map((n) => libro.Sheets[n]).sort(
      (a, b) => (XLSX.utils.sheet_to_json(b, { header: 1 }).length) - (XLSX.utils.sheet_to_json(a, { header: 1 }).length),
    )[0]
    // valores crudos: un EAN guardado como número sale entero (no "8,41E+12");
    // los ceros iniciales perdidos de un CN se recuperan en clavesDeCodigo
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, defval: '', raw: true })
      .map((f) => f.map((c) => (typeof c === 'number' && Number.isInteger(c) ? c.toFixed(0) : c)))
    return { matriz }
  }
  const buf = await file.arrayBuffer()
  let texto: string
  let aviso: string | undefined
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    texto = new TextDecoder('windows-1252').decode(buf)
  }
  texto = texto.replace(/^﻿/, '')
  const r = Papa.parse<string[]>(texto, { skipEmptyLines: true, delimitersToGuess: [';', '\t', ',', '|'] })
  const anchoMax = Math.max(0, ...r.data.slice(0, 50).map((f) => f.length))
  if (anchoMax <= 1) aviso = 'El archivo parece de ancho fijo (sin separadores). Expórtalo a Excel o CSV desde tu programa.'
  return { matriz: r.data, aviso }
}

export async function leerExportacion(file: File): Promise<Tabla> {
  const { matriz, aviso } = await aMatriz(file)
  // Muchas exportaciones llevan título, fecha o nombre de la farmacia antes de la cabecera:
  // buscamos en las 20 primeras filas la que más se parece a una cabecera.
  let idx = 0
  let mejor = -1
  matriz.slice(0, 20).forEach((fila, i) => {
    const p = puntuarFilaCabecera(fila)
    if (p > mejor) [idx, mejor] = [i, p]
  })
  if (mejor <= 0) idx = matriz.findIndex((f) => f.filter((c) => String(c ?? '').trim()).length >= 2)
  if (idx < 0) return { cabeceras: [], filas: [], aviso: aviso ?? 'No se ha encontrado ninguna tabla en el archivo.' }

  // cabeceras únicas y no vacías
  const vistos = new Map<string, number>()
  const cabeceras = matriz[idx].map((c, i) => {
    let h = String(c ?? '').trim() || `Columna ${i + 1}`
    const n = vistos.get(h) ?? 0
    vistos.set(h, n + 1)
    if (n) h = `${h} (${n + 1})`
    return h
  })

  const filas: Record<string, string>[] = []
  for (const f of matriz.slice(idx + 1)) {
    const celdas = f.map((c) => String(c ?? '').trim())
    if (!celdas.some(Boolean)) continue
    // filas de totales o subtítulos de familia: sin ningún número
    if (!celdas.some((c) => /\d/.test(c))) continue
    if (/^total/i.test(celdas[0] ?? '')) continue
    const o: Record<string, string> = {}
    cabeceras.forEach((h, i) => (o[h] = celdas[i] ?? ''))
    filas.push(o)
  }
  return { cabeceras, filas, aviso }
}
