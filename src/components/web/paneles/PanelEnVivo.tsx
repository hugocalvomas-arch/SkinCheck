'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react'
import { DESTACADAS, EDAD, GLOBAL, PRIMERO, nivel, valor } from './ejemplo'

// El análisis "en directo": escaneo de la cara, las 11 zonas una a una con la imagen real que devuelve la API
// y su punta del radar subiendo a la vez, y al final el resultado. En bucle; al tocar un paso se queda fijo.

const ZONAS: [string, string][] = [
  ['Arrugas', 'arrugas'], ['Manchas', 'manchas'], ['Poros', 'poros'], ['Brillo', 'brillo'], ['Rojez', 'rojez'], ['Textura', 'textura'],
  ['Hidratación', 'hidratacion'], ['Ojeras', 'ojeras'], ['Firmeza', 'firmeza'], ['Acné', 'acne'], ['Luminosidad', 'luminosidad'],
]
const N = ZONAS.length
const PASOS = N + 2 // 0 = escaneo, 1..N = zonas, N+1 = resultado
const DURACION = (p: number) => (p === 0 ? 2400 : p === N + 1 ? 5200 : 1500)

// Radar
const C = 250
const R = 180
const PASO_ANG = 360 / N
const pol = (rad: number, k: number) => {
  const t = ((k * PASO_ANG - 90) * Math.PI) / 180
  return [C + rad * Math.cos(t), C + rad * Math.sin(t)] as const
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

export function PanelEnVivo() {
  const [paso, setPaso] = useState(N + 1)
  const [fijo, setFijo] = useState(false)
  const [vals, setVals] = useState<number[]>(() => ZONAS.map(([a]) => valor(a)))
  const [global, setGlobal] = useState(GLOBAL)
  const quieto = useRef(false)

  // Arranca la secuencia (si el usuario no pide menos movimiento)
  useEffect(() => {
    quieto.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!quieto.current) setPaso(0)
  }, [])

  // Avance automático
  useEffect(() => {
    if (fijo || quieto.current) return
    const t = setTimeout(() => setPaso((p) => (p + 1) % PASOS), DURACION(paso))
    return () => clearTimeout(t)
  }, [paso, fijo])

  // Valores del radar y puntuación, animados hacia su objetivo en cada paso
  useEffect(() => {
    const objetivo = ZONAS.map(([a], k) => (paso === N + 1 || k < paso ? valor(a) : 0))
    const objGlobal = paso === N + 1 ? GLOBAL : 0
    if (quieto.current) { setVals(objetivo); setGlobal(objGlobal); return }
    let raf = 0
    const ini = performance.now()
    const desde = [...vals]
    const desdeG = global
    const dur = paso === 0 ? 400 : 700
    const tick = (t: number) => {
      const e = Math.min(1, (t - ini) / dur)
      const s = 1 - Math.pow(1 - e, 3)
      setVals(desde.map((d, k) => d + (objetivo[k] - d) * s))
      setGlobal(desdeG + (objGlobal - desdeG) * s)
      if (e < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paso]) // eslint-disable-line react-hooks/exhaustive-deps

  const zona = paso >= 1 && paso <= N ? paso - 1 : -1
  const fin = paso === N + 1
  const rotulo = paso === 0 ? 'Escaneando la cara…' : fin ? 'Análisis completo' : `Analizando ${ZONAS[zona][0].toLowerCase()}…`

  return (
    <figure className="m-0" aria-label="Demostración del análisis facial: la foto se escanea, se analizan las once zonas y sale el resultado">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] border border-linea rounded-[var(--radius-card)] bg-papel overflow-hidden">
        {/* Foto con las zonas */}
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[34rem] bg-suave overflow-hidden border-b md:border-b-0 md:border-r border-linea">
          <img src="/ejemplos/zonas/foto.webp" alt="Cara de ejemplo generada con IA" className="absolute inset-0 w-full h-full object-cover" />
          {ZONAS.map(([n, f], k) => (
            <img key={f} src={`/ejemplos/zonas/${f}.webp`} alt="" aria-hidden loading={k < 3 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" style={{ opacity: k === zona ? 1 : 0 }} data-zona={n} />
          ))}
          {/* Encuadre y escaneo */}
          <div aria-hidden className="pointer-events-none absolute inset-x-6 top-6 bottom-14 transition-opacity duration-500" style={{ opacity: fin ? 0 : 1 }}>
            {['top-0 left-0 border-t-2 border-l-2 rounded-tl-lg', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg'].map((c) => (
              <span key={c} className={`absolute w-8 h-8 border-white/90 ${c}`} />
            ))}
            {paso === 0 && <span className="absolute inset-0 overflow-hidden"><span className="sc-escaneo block h-full border-b-2 border-white" style={{ background: 'linear-gradient(to bottom, transparent 70%, rgba(255,255,255,.35))' }} /></span>}
          </div>
          {/* Rótulo del paso */}
          <div className="absolute left-4 top-4 bg-papel/95 border border-linea rounded-[var(--radius-input)] px-3 py-2 text-sm" aria-live="polite">
            <span className="flex items-center gap-2 text-gris">
              <span className={`size-2 rounded-full ${fin ? 'bg-marca' : 'bg-marca animate-pulse'}`} />{rotulo}
            </span>
            {zona >= 0 && <span className="block font-medium mt-0.5">{ZONAS[zona][0]} <span className="cifra text-marca">{valor(ZONAS[zona][0])}</span> <span className="text-gris font-normal">{nivel(valor(ZONAS[zona][0]))}</span></span>}
          </div>
          {/* Progreso por pasos */}
          <div className="absolute inset-x-4 bottom-4 flex gap-1" role="tablist" aria-label="Pasos del análisis">
            {Array.from({ length: PASOS }, (_, p) => {
              const nombre = p === 0 ? 'Escaneo' : p === N + 1 ? 'Resultado' : ZONAS[p - 1][0]
              return (
                <button key={p} role="tab" aria-selected={p === paso} aria-label={nombre} title={nombre}
                  onClick={() => { setPaso(p); setFijo(true) }} className="group flex-1 h-6 grid items-center">
                  <span className={`block h-1 rounded-full transition-colors ${p <= paso ? 'bg-white' : 'bg-white/40'} group-hover:bg-white`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Resultado */}
        <div className="p-6 lg:p-8 grid gap-4 content-start">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-gris m-0">Puntuación de la piel</p>
              <p className="cifra text-[4rem] leading-none font-medium text-tinta mt-2 mb-0">{fin || global > 0.5 ? Math.round(global) : '–'}<span className="text-lg text-gris font-normal tracking-normal"> /100</span></p>
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
