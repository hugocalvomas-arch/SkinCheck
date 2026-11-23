'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react'
import { DESTACADAS, EDAD, GLOBAL, PRIMERO, nivel, valor } from './ejemplo'
import { CEJAS, LABIOS, MALLA, OJOS, OVALO, PUNTOS } from './mallaCara'
import { ESTILO, dibujarMallaClinica, type Uniones } from '@/lib/mallaClinica'

// El análisis "en directo", como un vídeo continuo y en bucle: la malla aparece y se ajusta a la cara,
// y después un barrido va pintando lo que detecta la API (sus imágenes reales) mientras el radar se llena.
// Todo sale de un único reloj, así que nunca se para ni salta.

// Las primeras V zonas tienen imagen con algo visible; el resto entra en el radar con el resultado.
const ZONAS: [string, string][] = [
  ['Arrugas', 'arrugas'], ['Manchas', 'manchas'], ['Textura', 'textura'], ['Rojez', 'rojez'], ['Brillo', 'brillo'], ['Firmeza', 'firmeza'],
  ['Hidratación', 'hidratacion'], ['Poros', ''], ['Ojeras', ''], ['Acné', ''], ['Luminosidad', ''],
]
const N = ZONAS.length
const V = ZONAS.filter(([, f]) => f).length

// Línea de tiempo (segundos)
const L = 25 // duración del bucle
const MALLA_FIN = 1.8 // la malla termina de amoldarse
const Z0 = 3.2 // empieza la primera zona
const D = 2.3 // cada zona
const BARRIDO = 1.1 // lo que tarda el barrido de una zona
const R0 = Z0 + V * D + 0.3 // empieza el resultado
const VACIADO = 1.0 // al reiniciar, el radar se vacía suave

const IMG_W = 900
const IMG_H = 1125
const MENTA = ESTILO.clinica.color

const clamp = (x: number) => Math.max(0, Math.min(1, x))
const suave = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c) }
const salida = (x: number) => 1 - Math.pow(1 - clamp(x), 3)
const inicioZona = (i: number) => Z0 + i * D
const barrido = (t: number, i: number) => clamp((t - inicioZona(i)) / BARRIDO)

function valoresEn(t: number) {
  return ZONAS.map(([a, f], k) => {
    const v = valor(a)
    if (t < VACIADO) return v * (1 - suave(t / VACIADO))
    if (f) return v * salida((t - inicioZona(k)) / 1.2)
    return v * salida((t - R0 - 0.2 - (k - V) * 0.15) / 1.0)
  })
}

// Radar
const C = 250
const R = 180
const PASO_ANG = 360 / N
const pol = (rad: number, k: number) => {
  const a = ((k * PASO_ANG - 90) * Math.PI) / 180
  return [C + rad * Math.cos(a), C + rad * Math.sin(a)] as const
}
const anillo = (v: number) => ZONAS.map((_, k) => pol((R * v) / 100, k).join(',')).join(' ')
const ANILLOS: [number, string][] = [[25, 'Leve'], [50, 'Moderado'], [70, 'Marcado'], [100, '']]

function Radar({ vals, actual, nombres = true }: { vals: number[]; actual: number; nombres?: boolean }) {
  const forma = ZONAS.map((_, k) => pol((R * vals[k]) / 100, k).join(',')).join(' ')
  return (
    <svg viewBox={nombres ? '-20 10 540 480' : '30 30 440 440'} className="w-full h-auto overflow-visible" role="img" aria-label="Radar con las once medidas de la piel">
      {ANILLOS.map(([v, t]) => (
        <g key={v}>
          <polygon points={anillo(v)} fill="none" stroke="var(--color-rule)" strokeDasharray={v === 100 ? undefined : '3 4'} />
          {t && nombres && <text x={C + 5} y={C - (R * v) / 100 - 4} fontSize={10.5} fill="var(--color-muted)">{t}</text>}
        </g>
      ))}
      {ZONAS.map(([a], k) => { const [x, y] = pol(R, k); return <line key={a} x1={C} y1={C} x2={x} y2={y} stroke={k === actual ? 'var(--color-accent)' : 'var(--color-rule)'} strokeOpacity={k === actual ? 0.5 : 1} /> })}
      <polygon points={forma} fill="var(--color-accent)" fillOpacity={0.14} stroke="var(--color-accent)" strokeWidth={1.75} strokeLinejoin="round" />
      {ZONAS.map(([a], k) => {
        const v = vals[k]
        const hecho = v > 0.5
        const alto = DESTACADAS.includes(a)
        const [x, y] = pol((R * v) / 100, k)
        const [lx, ly] = pol(R + (nombres ? 22 : 24), k)
        const ancla = Math.abs(lx - C) < 14 ? 'middle' : lx > C ? 'start' : 'end'
        const activo = k === actual
        return (
          <g key={a}>
            {hecho && <circle cx={x} cy={y} r={activo ? 5.5 : alto ? 4.5 : 3} fill={alto || activo ? 'var(--color-accent)' : 'var(--color-paper)'} stroke="var(--color-accent)" strokeWidth={1.5} />}
            {nombres ? (
              <>
                <text x={lx} y={ly - 2} textAnchor={ancla} fontSize={14} fontWeight={activo ? 600 : 400} fill={activo ? 'var(--color-accent)' : 'var(--color-ink-2)'}>{a}</text>
                <text x={lx} y={ly + 16} textAnchor={ancla} fontSize={16} fontWeight={500} fill={alto || activo ? 'var(--color-accent)' : 'var(--color-muted)'} style={{ fontVariantNumeric: 'tabular-nums' }}>{hecho ? Math.round(v) : '–'}</text>
              </>
            ) : (
              <text x={lx} y={ly + 8} textAnchor={ancla} fontSize={24} fontWeight={500} fill={activo || alto ? 'var(--color-accent)' : 'var(--color-ink-2)'}>{k + 1}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// La misma malla que ve la clienta en la cámara del iPad. Aparece de golpe algo descolocada,
// se amolda a la cara (frente incluida) y se retira cuando empiezan los resultados.
const UNIONES: Uniones = { malla: MALLA, ovalo: OVALO, ojos: OJOS, cejas: CEJAS, labios: LABIOS }
function dibujarMalla(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h)
  const op = t < 0.12 ? t / 0.12 : t < Z0 ? 1 : 1 - suave((t - Z0) / 0.8)
  if (op <= 0.01) return
  const e = Math.max(w / IMG_W, h / IMG_H)
  const ox = (w - IMG_W * e) / 2
  const oy = (h - IMG_H * e) / 2
  const desv = 1 - salida(t / MALLA_FIN) // 1 = recién aparecida, 0 = sobre la cara
  const cx = 0.52, cy = 0.55
  const giro = -0.12 * desv
  const esc = 1 + 0.14 * desv
  const dx = 0.04 * desv, dy = -0.05 * desv
  const cos = Math.cos(giro), sin = Math.sin(giro)
  const n = PUNTOS.length / 2
  const Q: number[][] = new Array(n)
  for (let i = 0; i < n; i++) {
    const x = PUNTOS[i * 2] - cx, y = PUNTOS[i * 2 + 1] - cy
    const ruido = 0.018 * desv
    Q[i] = [
      ox + (cx + (x * cos - y * sin) * esc + dx + ruido * Math.sin(t * 3.1 + i * 1.7)) * IMG_W * e,
      oy + (cy + (x * sin + y * cos) * esc + dy + ruido * Math.cos(t * 2.7 + i * 2.3)) * IMG_H * e,
    ]
  }
  ctx.globalAlpha = op
  dibujarMallaClinica(ctx, Q, UNIONES, ESTILO.clinica, { t, quieto: false })
  ctx.globalAlpha = 1
}

export function PanelEnVivo() {
  const [t, setT] = useState(R0 + 2.5) // sin movimiento: el resultado completo
  const lienzo = useRef<HTMLCanvasElement>(null)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let visible = true
    const ini = performance.now()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    if (caja.current) io.observe(caja.current)
    const frame = (ahora: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const tt = ((ahora - ini) / 1000) % L
      setT(tt)
      const c = lienzo.current
      const ctx = c?.getContext('2d')
      if (c && ctx) {
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const w = c.clientWidth, h = c.clientHeight
        if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        dibujarMalla(ctx, w, h, tt)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [])

  const vals = valoresEn(t)
  const zona = t >= Z0 && t < R0 ? Math.min(V - 1, Math.floor((t - Z0) / D)) : -1
  const fin = t >= R0
  const global = GLOBAL * salida((t - R0) / 1.4)
  const rotulo = t < Z0 ? 'Detectando la cara…' : fin ? 'Análisis completo' : `Analizando ${ZONAS[zona][0].toLowerCase()}…`
  const zoom = 1.035 + 0.03 * Math.sin((2 * Math.PI * t) / L)
  const rz = zona >= 0 ? barrido(t, zona) : 0

  return (
    <figure className="m-0" aria-label="Demostración del análisis facial: la malla se ajusta a la cara, se analizan las zonas y sale el resultado">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] border border-linea rounded-[var(--radius-card)] bg-papel overflow-hidden">
        {/* Foto, malla y zonas */}
        <div ref={caja} className="relative aspect-[4/5] md:aspect-auto md:min-h-[34rem] bg-camara overflow-hidden border-b md:border-b-0 md:border-r border-linea">
          <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: '52% 48%' }}>
            <img src="/ejemplos/zonas/foto.webp" alt="Cara de ejemplo generada con IA" className="absolute inset-0 w-full h-full object-cover" />
            {ZONAS.slice(0, V).map(([n, f], i) => {
              const r = barrido(t, i)
              const siguienteCompleta = i < V - 1 && barrido(t, i + 1) >= 1
              const op = i === V - 1 ? 1 - suave((t - R0) / 1.2) : 1
              const ver = t >= inicioZona(i) && !siguienteCompleta && op > 0
              return (
                <img key={f} src={`/ejemplos/zonas/${f}.webp`} alt={ver ? `Zonas de ${n.toLowerCase()} marcadas por el análisis` : ''} aria-hidden={!ver}
                  className="absolute inset-0 w-full h-full object-cover" loading="eager"
                  style={{ opacity: ver ? op : 0, clipPath: `inset(0 0 ${(1 - suave(r)) * 100}% 0)`, zIndex: i + 1 }} />
              )
            })}
            <canvas ref={lienzo} aria-hidden className="absolute inset-0 w-full h-full z-[20] pointer-events-none" />
            {rz > 0 && rz < 1 && (
              <span aria-hidden className="absolute inset-x-0 z-[21] h-[3px] pointer-events-none" style={{ top: `${suave(rz) * 100}%`, background: `rgb(${MENTA})`, boxShadow: `0 0 18px 4px rgba(${MENTA},.7)` }} />
            )}
          </div>
          {/* Rótulo */}
          <div className="absolute z-[30] left-4 top-4 bg-papel/95 border border-linea rounded-[var(--radius-input)] px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-gris"><span className={`size-2 rounded-full bg-marca ${fin ? '' : 'animate-pulse'}`} />{rotulo}</span>
            {zona >= 0 && <span className="block font-medium mt-0.5">{ZONAS[zona][0]} <span className="cifra text-marca">{Math.round(vals[zona])}</span> <span className="text-gris font-normal">{nivel(valor(ZONAS[zona][0]))}</span></span>}
          </div>
          {/* Progreso continuo */}
          <div aria-hidden className="absolute z-[30] inset-x-4 bottom-4 h-1 rounded-full bg-white/35 overflow-hidden">
            <span className="block h-full bg-white" style={{ width: `${(t / L) * 100}%` }} />
          </div>
        </div>

        {/* Resultado */}
        <div className="p-6 lg:p-8 grid gap-4 content-start">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-gris m-0">Puntuación de la piel</p>
              <p className="cifra text-[4rem] leading-none font-medium text-tinta mt-2 mb-0">{global > 0.5 ? Math.round(global) : '–'}<span className="text-lg text-gris font-normal tracking-normal"> /100</span></p>
            </div>
            <dl className="flex gap-8 text-sm m-0 transition-opacity duration-500" style={{ opacity: fin ? 1 : 0.35 }}>
              <div><dt className="text-gris">Edad aparente</dt><dd className="m-0 mt-1 text-lg font-medium">{fin ? <><span className="cifra">{EDAD}</span> años</> : '…'}</dd></div>
              <div><dt className="text-gris">A trabajar primero</dt><dd className="m-0 mt-1 text-lg font-medium">{fin ? PRIMERO : '…'}</dd></div>
            </dl>
          </div>
          <div className="hidden md:block max-w-[36rem] w-full mx-auto pt-4"><Radar vals={vals} actual={zona} /></div>
          <div className="md:hidden grid gap-5 pt-2">
            <div className="max-w-[17rem] w-full mx-auto"><Radar vals={vals} actual={zona} nombres={false} /></div>
            <ol className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm m-0 p-0 list-none">
              {ZONAS.map(([a], k) => (
                <li key={a} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-1.5 items-baseline border-b border-linea pb-2">
                  <span className="cifra text-xs text-gris">{k + 1}</span>
                  <span className={`truncate ${k === zona ? 'text-marca font-medium' : ''}`}>{a}</span>
                  <span className={`cifra ${DESTACADAS.includes(a) || k === zona ? 'text-marca' : 'text-gris'}`}>{vals[k] > 0.5 ? Math.round(vals[k]) : '–'}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Resultado real del análisis sobre una cara generada con IA. Más hacia fuera, más marcado.</figcaption>
    </figure>
  )
}
