// Dibujo de la malla facial "clínica". Lo usan la cámara del iPad (MallaFacial) y la demo de la portada (video/analisis),
// para que en la web se vea exactamente la misma malla que verá la clienta.

// Uniones de MediaPipe en pares planos [a, b, a, b…]. El óvalo va en orden, para poder cerrarlo como trazado.
export type Uniones = { malla: ArrayLike<number>; ovalo: ArrayLike<number>; ojos: ArrayLike<number>; cejas: ArrayLike<number>; labios: ArrayLike<number> }

export function aPares(...grupos: readonly { start: number; end: number }[][]) {
  const o: number[] = []
  for (const g of grupos) for (const { start, end } of g) o.push(start, end)
  return o
}

// Variantes del estilo clínico. Valores = opacidades (0 = no se dibuja); anillo = radio relativo al ancho de la cara.
export type Config = { color: string; velo: number; malla: number; contorno: number; rasgos: number; puntos: number; escaneo: number; brillo: number; anillo: number; giro: boolean; etiquetas: boolean }
export const ESTILO: Record<string, Config> = {
  clinica:  { color: '127,214,194', velo: 0.05, malla: 0.12, contorno: 0.85, rasgos: 0.3, puntos: 0.6, escaneo: 0.25, brillo: 6, anillo: 0.055, giro: true, etiquetas: true },
  ligera:   { color: '127,214,194', velo: 0, malla: 0.08, contorno: 0.6, rasgos: 0, puntos: 0, escaneo: 0.18, brillo: 0, anillo: 0, giro: false, etiquetas: true },
  azul:     { color: '140,196,255', velo: 0.05, malla: 0.12, contorno: 0.85, rasgos: 0.25, puntos: 0.55, escaneo: 0.25, brillo: 6, anillo: 0.055, giro: true, etiquetas: true },
  perla:    { color: '255,255,255', velo: 0.04, malla: 0.1, contorno: 0.7, rasgos: 0.2, puntos: 0.5, escaneo: 0.18, brillo: 4, anillo: 0.05, giro: false, etiquetas: true },
  rosa:     { color: '255,176,196', velo: 0.05, malla: 0.12, contorno: 0.85, rasgos: 0.25, puntos: 0.55, escaneo: 0.25, brillo: 6, anillo: 0.055, giro: true, etiquetas: true },
}
export const ESTILOS = [['clinica', 'Clínica menta'], ['ligera', 'Ligera'], ['azul', 'Azul clínico'], ['perla', 'Perla'], ['rosa', 'Rosa cosmético']] as const
export type EstiloMalla = (typeof ESTILOS)[number][0]

/**
 * Dibuja la malla sobre `ctx` con los puntos ya en píxeles. La malla de MediaPipe acaba a media frente:
 * aquí se estira hacia arriba desde las cejas para cubrirla hasta el nacimiento del pelo.
 * Devuelve la caja de la cara, para quien quiera comprobar si está centrada.
 */
export function dibujarMallaClinica(
  ctx: CanvasRenderingContext2D,
  Q: number[][],
  u: Uniones,
  E: Config,
  { t, quieto, escaneo = true }: { t: number; quieto: boolean; escaneo?: boolean },
) {
  const arriba = Q[10], barbilla = Q[152]
  let ux = arriba[0] - barbilla[0], uy = arriba[1] - barbilla[1]
  const largo = Math.hypot(ux, uy) || 1
  ux /= largo; uy /= largo
  const bx = (Q[105][0] + Q[334][0]) / 2, by = (Q[105][1] + Q[334][1]) / 2
  // Se estira más en el centro que en las sienes, para que la frente quede redondeada y no cuadrada
  const EXT = 0.55
  const semi = Math.hypot(Q[454][0] - Q[234][0], Q[454][1] - Q[234][1]) / 2 || 1
  const pts = Q.map(([x, y]) => {
    const d = (x - bx) * ux + (y - by) * uy
    if (d <= 0) return [x, y]
    const l = ((x - bx) * -uy + (y - by) * ux) / semi
    const k = d * EXT * Math.max(0.15, 1 - l * l * 0.85)
    return [x + ux * k, y + uy * k]
  })
  const altoFrente = ((arriba[0] - bx) * ux + (arriba[1] - by) * uy) * (1 + EXT)

  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const ancho = x1 - x0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2

  // Contorno de la cara como trazado cerrado
  const ovalo = new Path2D()
  ovalo.moveTo(pts[u.ovalo[0]][0], pts[u.ovalo[0]][1])
  for (let k = 1; k < u.ovalo.length; k += 2) ovalo.lineTo(pts[u.ovalo[k]][0], pts[u.ovalo[k]][1])
  ovalo.closePath()

  const lineas = (pares: ArrayLike<number>, color: string, w: number) => {
    ctx.beginPath()
    for (let k = 0; k < pares.length; k += 2) { const a = pts[pares[k]], b = pts[pares[k + 1]]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]) }
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke()
  }

  const C = E.color
  if (E.velo) { ctx.fillStyle = `rgba(${C},${E.velo})`; ctx.fill(ovalo) }
  if (E.malla) lineas(u.malla, `rgba(255,255,255,${E.malla})`, 0.5)
  if (E.contorno) {
    ctx.shadowColor = `rgba(${C},.8)`; ctx.shadowBlur = E.brillo
    lineas(u.ovalo, `rgba(${C},${E.contorno})`, 1.4)
    ctx.shadowBlur = 0
  }
  if (E.rasgos) {
    // Ojos, cejas y labios muy suaves: si se marcan fuerte la cara parece una máscara
    lineas(u.ojos, `rgba(${C},${E.rasgos})`, 1)
    lineas(u.cejas, `rgba(${C},${E.rasgos * 0.7})`, 1)
    lineas(u.labios, `rgba(${C},${E.rasgos})`, 1)
  }
  if (E.puntos) {
    ctx.fillStyle = `rgba(255,255,255,${E.puntos})`
    for (let i = 0; i < pts.length; i += 5) ctx.fillRect(pts[i][0] - 0.7, pts[i][1] - 0.7, 1.4, 1.4)
  }

  // Barrido de escaneo, recortado a la forma de la cara
  if (E.escaneo && escaneo && !quieto) {
    const fase = (t % 3.2) / 3.2
    const ly = y0 + (y1 - y0) * fase
    const h = (y1 - y0) * 0.2
    ctx.save()
    ctx.clip(ovalo)
    const g = ctx.createLinearGradient(0, ly - h, 0, ly)
    g.addColorStop(0, `rgba(${C},0)`); g.addColorStop(1, `rgba(${C},${E.escaneo})`)
    ctx.fillStyle = g; ctx.fillRect(x0, ly - h, ancho, h)
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x0, ly - 0.5, ancho, 1)
    ctx.restore()
  }

  // Marcas por zona
  const r = ancho * E.anillo
  const zonas: [number, number, string, 'arriba' | 'abajo' | 'lado'][] = [
    [bx + ux * altoFrente * 0.5, by + uy * altoFrente * 0.5, 'Frente', 'arriba'],
    [pts[205][0], pts[205][1], 'Mejilla', 'lado'],
    [pts[425][0], pts[425][1], 'Mejilla', 'lado'],
    [pts[4][0], pts[4][1], 'Nariz', 'arriba'],
    [pts[200][0], pts[200][1], 'Mentón', 'abajo'],
  ]
  ctx.font = `500 ${Math.max(12, Math.round(ancho * 0.032))}px var(--font-geist-mono), ui-monospace, monospace`
  zonas.forEach(([x, y, nombre, pos], k) => {
    if (E.anillo) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
      if (E.giro) {
        const giro = quieto ? 0 : t * 1.2 + k
        ctx.strokeStyle = `rgba(${C},1)`; ctx.lineWidth = 1.8
        ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro, giro + Math.PI * 0.6); ctx.stroke()
        ctx.beginPath(); ctx.arc(x, y, r * 1.45, giro + Math.PI, giro + Math.PI * 1.6); ctx.stroke()
      }
    }
    ctx.fillStyle = E.anillo ? 'rgba(255,255,255,.95)' : `rgba(${C},1)`
    ctx.beginPath(); ctx.arc(x, y, E.anillo ? 1.8 : 3, 0, Math.PI * 2); ctx.fill()
    if (!E.etiquetas) return
    const sep = Math.max(r * 1.8, 10)
    ctx.shadowColor = 'rgba(15,27,29,.85)'; ctx.shadowBlur = 4
    ctx.fillStyle = 'rgba(255,255,255,.95)'
    if (pos === 'lado') {
      const izq = x < cx
      ctx.textAlign = izq ? 'right' : 'left'
      ctx.fillText(nombre, x + (izq ? -sep : sep), y + 4)
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(nombre, x, pos === 'arriba' ? y - sep : y + sep + 10)
    }
    ctx.shadowBlur = 0
  })

  return { x0, x1, y0, y1, ancho, cx, cy }
}
