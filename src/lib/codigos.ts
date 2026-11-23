// Lógica común para leer exportaciones de los programas de gestión de farmacia
// (Farmatic, Nixfarma, Unycop, IOFWin, Bitfarma...). No hay un formato estándar
// público, así que se detecta todo de forma tolerante y el usuario confirma.

/** Quita acentos, puntos y espacios dobles: "Cód. Nacional" -> "cod nacional" */
export const normalizarTexto = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[._\-/()º°:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Solo dígitos. "8.470.001.546.532" o "154653.2" -> dígitos */
export const soloDigitos = (c: unknown) => String(c ?? '').replace(/\D/g, '')

/**
 * Devuelve las claves con las que se puede cruzar un código contra el catálogo.
 * - CN (código nacional): 6 dígitos. Si viene con dígito de control ("154653.2" o "1546532"), se quita.
 * - EAN-13 (y UPC-12 rellenado a 13). Los EAN "847000" + CN + control llevan el CN dentro.
 */
export function clavesDeCodigo(bruto: unknown): { ean?: string; cn?: string } {
  let s = String(bruto ?? '').trim()
  // Excel a veces convierte "8412345678901" en "8.41235E+12": no es recuperable
  if (/e\+/i.test(s)) return {}
  // "154653.2" / "154653-2": CN con dígito de control separado
  const conControl = s.match(/^(\d{6})[.\-\s]\d$/)
  if (conControl) return { cn: conControl[1] }
  // "8412345678901.0" exportado como número
  s = s.replace(/[.,]0+$/, '')
  const d = soloDigitos(s)
  if (d.length === 13) {
    return d.startsWith('847000') ? { ean: d, cn: d.slice(6, 12) } : { ean: d }
  }
  if (d.length === 12) return { ean: '0' + d }
  if (d.length === 14 && d.startsWith('0')) return { ean: d.slice(1) } // GTIN-14
  if (d.length === 8) return { ean: d } // EAN-8
  if (d.length === 7) return { cn: d.slice(0, 6) }
  if (d.length === 6) return { cn: d }
  if (d.length > 0 && d.length < 6) return { cn: d.padStart(6, '0') } // ceros iniciales perdidos en Excel
  return {}
}

/** Números con formato español o inglés: "1.234,56 €", "12,5", "12.5", "-3" */
export const aNumero = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v ?? '').trim().replace(/\s|€|eur/gi, '')
  if (!s) return 0
  let n = s
  if (s.includes(',') && s.includes('.')) {
    // el último separador es el decimal
    n = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (s.includes(',')) n = s.replace(',', '.')
  const x = Number(n)
  return Number.isFinite(x) ? x : 0
}

// Sinónimos de cabecera ya normalizados (sin acentos ni puntos).
// "incluye": basta con que la cabecera contenga el término; "excluye": descarta la columna.
type Regla = { exactos: string[]; incluye: string[]; excluye: string[] }
export const CAMPOS = {
  cn: {
    exactos: ['cn', 'c n', 'cod', 'codigo', 'cod nac', 'cnacional', 'nacional', 'erp id', 'referencia', 'ref', 'articulo id'],
    incluye: ['codigo nacional', 'cod nacional', 'cod nac', 'cn '],
    excluye: ['barras', 'ean', 'proveedor', 'laboratorio', 'familia', 'postal'],
  },
  ean: {
    exactos: ['ean', 'ean13', 'ean 13', 'gtin', 'cod barras', 'codigo barras', 'codigo de barras', 'barcode'],
    incluye: ['barras', 'ean', 'gtin'],
    excluye: [],
  },
  descripcion: {
    exactos: ['descripcion', 'nombre', 'articulo', 'denominacion', 'producto', 'desc'],
    incluye: ['descripcion', 'denominacion', 'nombre'],
    excluye: ['familia', 'laboratorio', 'proveedor'],
  },
  pvp: {
    exactos: ['pvp', 'p v p', 'precio', 'pvp iva', 'pvp con iva', 'precio venta', 'pvp actual', 'pvpiva'],
    incluye: ['pvp', 'precio venta', 'p v p'],
    excluye: ['sin iva', 'coste', 'compra', 'pmc', 'puc', 'pvl', 'medio', 'ultimo'],
  },
  stock: {
    exactos: ['stock', 'existencias', 'unidades', 'stock actual', 'stk', 'stock real', 'uds', 'cantidad', 'stock total'],
    incluye: ['stock', 'existencia'],
    excluye: ['minimo', 'maximo', 'min', 'max', 'pendiente', 'valor', 'seguridad', 'optimo'],
  },
  marca: {
    exactos: ['laboratorio', 'marca', 'fabricante', 'lab'],
    incluye: ['laboratorio', 'marca', 'fabricante'],
    excluye: [],
  },
} satisfies Record<string, Regla>
export type Campo = keyof typeof CAMPOS
export const OBLIGATORIOS: Campo[] = ['stock']

function puntuar(cabecera: string, r: Regla) {
  const h = normalizarTexto(cabecera)
  if (!h) return 0
  if (r.exactos.includes(h)) return 3
  if (r.excluye.some((x) => h.split(' ').includes(x) || h.includes(x))) return 0
  if (r.incluye.some((x) => (h + ' ').includes(x))) return 2
  return 0
}

/** Asigna a cada campo la cabecera que mejor encaja, sin repetir columnas. */
export function detectarColumnas(cabeceras: string[]) {
  const res: Partial<Record<Campo, string>> = {}
  const usadas = new Set<string>()
  // primero los más específicos para que "Cód. barras" no se lo quede el CN
  for (const campo of ['ean', 'cn', 'stock', 'pvp', 'descripcion', 'marca'] as Campo[]) {
    let mejor = ''
    let p = 0
    for (const h of cabeceras) {
      if (usadas.has(h)) continue
      const s = puntuar(h, CAMPOS[campo])
      if (s > p) [mejor, p] = [h, s]
    }
    if (mejor) {
      res[campo] = mejor
      usadas.add(mejor)
    }
  }
  return res
}

/** Puntúa una fila como posible cabecera (cuántas celdas parecen nombres de campo). */
export function puntuarFilaCabecera(celdas: unknown[]) {
  return celdas.reduce<number>((acc, c) => {
    const t = String(c ?? '')
    if (!t || /^\d+([.,]\d+)?$/.test(t.trim())) return acc
    return acc + ((Object.values(CAMPOS) as Regla[]).some((r) => puntuar(t, r) > 0) ? 1 : 0)
  }, 0)
}
