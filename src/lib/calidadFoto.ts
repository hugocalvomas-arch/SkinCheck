// Comprobaciones de la foto del iPad. Todo se calcula en el dispositivo con los puntos de MediaPipe:
// no sale ninguna imagen para decidir si la clienta está bien colocada.

export type EstadoCara =
  | 'buscando' | 'lejos' | 'cerca' | 'descentrada' | 'girada' | 'inclinada' | 'barbilla_arriba' | 'barbilla_abajo'
  | 'oscura' | 'sombra' | 'ojos' | 'sonrisa' | 'moviendo' | 'lista' | 'sin_detector'

export const AVISO: Record<EstadoCara, string> = {
  buscando: 'Buscando tu cara',
  lejos: 'Acércate un poco',
  cerca: 'Aléjate un poco',
  descentrada: 'Céntrate en el óvalo',
  girada: 'Mira de frente a la cámara',
  inclinada: 'Pon la cabeza recta',
  barbilla_arriba: 'Baja un poco la barbilla',
  barbilla_abajo: 'Sube un poco la barbilla',
  oscura: 'Falta luz: ponte con la luz de frente',
  sombra: 'La luz te da de lado: gírate hacia ella',
  ojos: 'Abre los ojos y mira a la cámara',
  sonrisa: 'Relaja la cara, sin sonreír',
  moviendo: 'No te muevas',
  lista: 'Perfecto, no te muevas',
  sin_detector: 'Colócate en el óvalo y pulsa el botón',
}

export type Medidas = {
  /** Puntos en la caja visible, en píxeles (ya en espejo) */
  Q: number[][]
  W: number
  H: number
  /** Brillo medio de cada mitad de la cara, de 0 a 255 (null si aún no se ha medido) */
  luz: { izq: number; der: number } | null
  /** Desplazamiento medio desde el fotograma anterior, en fracción del ancho de la cara */
  movimiento: number
  /** Blendshapes de MediaPipe por nombre, de 0 a 1 */
  gestos: Record<string, number>
}

// Umbrales. Están del lado permisivo: mejor una foto buena que una clienta esperando.
export const UMBRAL = {
  anchoMin: 0.38, anchoMax: 0.78,
  centro: 0.15,
  giro: 0.09, inclinacion: 8, // fracción del ancho / grados
  barbillaMin: 0.33, barbillaMax: 0.6,
  luzMin: 70, sombra: 0.3,
  ojos: 0.55, sonrisa: 0.5,
  movimiento: 0.012,
}

export function evaluarCara(m: Medidas): EstadoCara {
  const { Q, W, H } = m
  const xs = Q.map((p) => p[0]), ys = Q.map((p) => p[1])
  const izq = Math.min(...xs), der = Math.max(...xs), arr = Math.min(...ys), aba = Math.max(...ys)
  const ancho = der - izq, cx = (izq + der) / 2, cy = (arr + aba) / 2

  if (ancho < W * UMBRAL.anchoMin) return 'lejos'
  if (ancho > W * UMBRAL.anchoMax) return 'cerca'
  if (Math.abs(cx - W / 2) > W * UMBRAL.centro || Math.abs(cy - H * 0.48) > H * UMBRAL.centro) return 'descentrada'

  // Inclinación: ángulo de la línea entre los extremos de los ojos (33 y 263)
  const [ax, ay] = Q[33], [bx, by] = Q[263]
  const grados = Math.abs((Math.atan2(by - ay, bx - ax) * 180) / Math.PI)
  if (Math.min(grados, 180 - grados) > UMBRAL.inclinacion) return 'inclinada'

  // Giro: la nariz (1) tiene que caer a mitad de camino entre las mejillas (234 y 454)
  const m1 = Q[234][0], m2 = Q[454][0]
  const r = (Q[1][0] - Math.min(m1, m2)) / (Math.abs(m2 - m1) || 1)
  if (Math.abs(r - 0.5) > UMBRAL.giro) return 'girada'

  // Barbilla: dónde cae la nariz entre la línea de los ojos y la barbilla (152)
  const ojosY = (ay + by) / 2
  const p = (Q[1][1] - ojosY) / ((Q[152][1] - ojosY) || 1)
  if (p < UMBRAL.barbillaMin) return 'barbilla_arriba'
  if (p > UMBRAL.barbillaMax) return 'barbilla_abajo'

  if (m.luz) {
    const media = (m.luz.izq + m.luz.der) / 2
    if (media < UMBRAL.luzMin) return 'oscura'
    if (Math.abs(m.luz.izq - m.luz.der) / Math.max(1, Math.max(m.luz.izq, m.luz.der)) > UMBRAL.sombra) return 'sombra'
  }

  const g = m.gestos
  if (((g.eyeBlinkLeft ?? 0) + (g.eyeBlinkRight ?? 0)) / 2 > UMBRAL.ojos) return 'ojos'
  if (((g.mouthSmileLeft ?? 0) + (g.mouthSmileRight ?? 0)) / 2 > UMBRAL.sonrisa) return 'sonrisa'

  if (m.movimiento > UMBRAL.movimiento) return 'moviendo'
  return 'lista'
}

/** Brillo medio y nitidez (varianza del laplaciano) de una zona de una imagen en escala de grises */
export function brilloYNitidez(px: Uint8ClampedArray, w: number, h: number) {
  const gris = new Float32Array(w * h)
  let suma = 0
  for (let i = 0; i < w * h; i++) {
    const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]
    gris[i] = v; suma += v
  }
  let n = 0, s = 0, s2 = 0
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    const l = gris[i - 1] + gris[i + 1] + gris[i - w] + gris[i + w] - 4 * gris[i]
    s += l; s2 += l * l; n++
  }
  const media = s / (n || 1)
  return { brillo: suma / (w * h || 1), nitidez: s2 / (n || 1) - media * media }
}
