import { CARA, PUNTO } from '../caraMalla'
import { Cara } from './PanelMapa'
import { EDAD, GLOBAL, MEDIDAS, PRIMERO, nivel, valor } from './ejemplo'

// Opción D · Foto y radar: a la izquierda, la cara con las zonas que marca el análisis; a la derecha, las once medidas en radar.
// Cuando haya una foto real pasada por la API (imagen de zonas marcadas), va en public/ejemplos/analisis.jpg y se pasa en `foto`.

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
    <svg viewBox={nombres ? "-20 10 540 480" : "30 30 440 440"} className="w-full h-auto overflow-visible" role="img" aria-label="Radar con las once medidas; poros 72 y brillo 61 destacan">
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
        const alto = v >= 50
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

const ZONAS: [string, readonly number[]][] = [
  ['Brillo', PUNTO.frente], ['Poros', PUNTO.nariz], ['Rojez', PUNTO.mejilla], ['Manchas', PUNTO.pomuloD],
  ['Ojeras', PUNTO.ojera], ['Arrugas', PUNTO.pataD], ['Acné', PUNTO.barbilla], ['Firmeza', PUNTO.mandibulaD],
]

function CaraMarcada({ foto }: { foto?: string }) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt="Foto de ejemplo con las zonas que marca el análisis" className="absolute inset-0 w-full h-full object-cover" />
  }
  return (
    <svg viewBox={`-70 -45 ${CARA.ancho + 140} ${CARA.alto + 90}`} className="absolute inset-0 w-full h-full" aria-hidden>
      <Cara />
      {ZONAS.map(([a, p]) => {
        const v = valor(a)
        const alto = v >= 50
        return (
          <g key={a}>
            <circle cx={p[0]} cy={p[1]} r={alto ? 13 : 9} fill="var(--color-accent)" fillOpacity={alto ? 0.22 : 0.08} stroke="var(--color-accent)" strokeOpacity={alto ? 0.9 : 0.4} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle cx={p[0]} cy={p[1]} r={2} fill="var(--color-accent)" />
          </g>
        )
      })}
    </svg>
  )
}

export function PanelFotoRadar({ foto }: { foto?: string }) {
  return (
    <figure className="m-0" aria-label="Lectura de ejemplo del análisis facial: la cara con sus zonas y las once medidas en radar">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] border border-linea rounded-[var(--radius-card)] bg-papel overflow-hidden">
        {/* Cara con las zonas marcadas */}
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[30rem] bg-suave border-b md:border-b-0 md:border-r border-linea">
          <CaraMarcada foto={foto} />
          <span className="sc-escaneo absolute inset-x-0 top-0 h-full pointer-events-none" aria-hidden style={{ background: 'linear-gradient(to bottom, transparent 0, transparent calc(100% - 2px), var(--color-accent) calc(100% - 2px))', opacity: 0.5 }} />
          <ul className="absolute left-4 top-4 m-0 p-0 list-none grid gap-1.5 text-xs">
            {['Poros', 'Brillo'].map((a) => (
              <li key={a} className="inline-flex items-center gap-2 bg-papel/90 border border-linea rounded-full pl-2 pr-3 py-1 w-fit">
                <span className="size-2 rounded-full bg-marca" />{a} <span className="cifra text-marca">{valor(a)}</span> <span className="text-gris">{nivel(valor(a))}</span>
              </li>
            ))}
          </ul>
        </div>
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
                  <span className={`cifra ${valor(a) >= 50 ? 'text-marca' : 'text-gris'}`}>{valor(a)}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="sr-only">{MEDIDAS.map(([a, v]) => `${a} ${v}`).join(', ')}</p>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Lectura de una foto con datos de ejemplo. Más hacia fuera, más marcado.</figcaption>
    </figure>
  )
}
