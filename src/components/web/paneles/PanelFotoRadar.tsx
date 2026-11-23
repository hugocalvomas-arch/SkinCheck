import { VisorZonas } from './VisorZonas'
import { DESTACADAS, EDAD, GLOBAL, MEDIDAS, PRIMERO, valor } from './ejemplo'

// Opción D · Foto y radar: a la izquierda, la cara con las zonas que marca el análisis; a la derecha, las once medidas en radar.
// Imágenes y cifras: resultado real de Perfect Corp sobre una cara generada con IA.

const ORDEN = ['Poros', 'Brillo', 'Textura', 'Hidratación', 'Luminosidad', 'Manchas', 'Rojez', 'Acné', 'Firmeza', 'Arrugas', 'Ojeras']
const C = 250
const R = 180
const PASO = 360 / ORDEN.length
const pol = (rad: number, k: number) => {
  const t = ((k * PASO - 90) * Math.PI) / 180
  return [C + rad * Math.cos(t), C + rad * Math.sin(t)] as const
}
const anillo = (v: number) => ORDEN.map((_, k) => pol((R * v) / 100, k).join(',')).join(' ')
const ANILLOS: [number, string][] = [[25, 'Leve'], [50, 'Moderado'], [70, 'Marcado'], [100, '']]

function Radar({ nombres = true }: { nombres?: boolean }) {
  const forma = ORDEN.map((a, k) => pol((R * valor(a)) / 100, k).join(',')).join(' ')
  return (
    <svg viewBox={nombres ? "-20 10 540 480" : "30 30 440 440"} className="w-full h-auto overflow-visible" role="img" aria-label="Radar con las once medidas; textura 35 y brillo 33 son las más marcadas">
      {ANILLOS.map(([v, t]) => (
        <g key={v}>
          <polygon points={anillo(v)} fill="none" stroke={v === 100 ? 'var(--color-rule)' : 'var(--color-rule)'} strokeDasharray={v === 100 ? undefined : '3 4'} />
          {t && nombres && <text x={C + 5} y={C - (R * v) / 100 - 4} fontSize={10.5} fill="var(--color-muted)">{t}</text>}
        </g>
      ))}
      {ORDEN.map((a, k) => { const [x, y] = pol(R, k); return <line key={a} x1={C} y1={C} x2={x} y2={y} stroke="var(--color-rule)" /> })}
      <polygon points={forma} fill="var(--color-accent)" fillOpacity={0.14} stroke="var(--color-accent)" strokeWidth={1.75} strokeLinejoin="round" className="sc-radar" />
      {ORDEN.map((a, k) => {
        const v = valor(a)
        const alto = DESTACADAS.includes(a)
        const [x, y] = pol((R * v) / 100, k)
        const [lx, ly] = pol(R + (nombres ? 22 : 24), k)
        const ancla = Math.abs(lx - C) < 14 ? 'middle' : lx > C ? 'start' : 'end'
        return (
          <g key={a}>
            <circle cx={x} cy={y} r={alto ? 4.5 : 3} fill={alto ? 'var(--color-accent)' : 'var(--color-paper)'} stroke="var(--color-accent)" strokeWidth={1.5} />
            {nombres ? (
              <>
                <text x={lx} y={ly - 2} textAnchor={ancla} fontSize={14} fill="var(--color-ink-2)">{a}</text>
                <text x={lx} y={ly + 16} textAnchor={ancla} fontSize={16} fontWeight={500} fill={alto ? 'var(--color-accent)' : 'var(--color-muted)'} style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</text>
              </>
            ) : (
              <text x={lx} y={ly + 8} textAnchor={ancla} fontSize={24} fontWeight={500} fill={alto ? 'var(--color-accent)' : 'var(--color-ink-2)'}>{k + 1}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function PanelFotoRadar() {
  return (
    <figure className="m-0" aria-label="Lectura de ejemplo del análisis facial: la cara con sus zonas y las once medidas en radar">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] border border-linea rounded-[var(--radius-card)] bg-papel overflow-hidden">
        {/* Las zonas que devuelve el análisis */}
        <div className="relative aspect-[4/5] md:aspect-auto border-b md:border-b-0 md:border-r border-linea"><VisorZonas /></div>
        {/* Resultado */}
        <div className="p-6 lg:p-8 grid gap-4 content-start">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-gris m-0">Puntuación de la piel</p>
              <p className="cifra text-[4rem] leading-none font-medium text-tinta mt-2 mb-0">{GLOBAL}<span className="text-lg text-gris font-normal tracking-normal"> /100</span></p>
            </div>
            <dl className="flex gap-8 text-sm m-0">
              <div><dt className="text-gris">Edad aparente</dt><dd className="m-0 mt-1 text-lg font-medium"><span className="cifra">{EDAD}</span> años</dd></div>
              <div><dt className="text-gris">A trabajar primero</dt><dd className="m-0 mt-1 text-lg font-medium">{PRIMERO}</dd></div>
            </dl>
          </div>
          <div className="hidden md:block max-w-[36rem] w-full mx-auto pt-4"><Radar /></div>
          <div className="md:hidden grid gap-5 pt-2">
            <div className="max-w-[17rem] w-full mx-auto"><Radar nombres={false} /></div>
            <ol className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm m-0 p-0 list-none">
              {ORDEN.map((a, k) => (
                <li key={a} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-1.5 items-baseline border-b border-linea pb-2">
                  <span className="cifra text-xs text-gris">{k + 1}</span>
                  <span className="truncate">{a}</span>
                  <span className={`cifra ${DESTACADAS.includes(a) ? 'text-marca' : 'text-gris'}`}>{valor(a)}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="sr-only">{MEDIDAS.map(([a, v]) => `${a} ${v}`).join(', ')}</p>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Resultado real del análisis sobre una cara generada con IA. Más hacia fuera, más marcado.</figcaption>
    </figure>
  )
}
