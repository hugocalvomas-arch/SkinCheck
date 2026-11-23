import { Resumen } from './Resumen'
import { GLOBAL, MEDIDAS, nivel } from './ejemplo'

// Opción C · Esfera: la puntuación en el centro y las once medidas en radios, con los cortes 25, 50 y 70 como anillos.
const C = 240
const R0 = 78
const R1 = 178
const r = (v: number) => R0 + ((R1 - R0) * v) / 100
const PASO = 360 / MEDIDAS.length
const pol = (rad: number, ang: number) => {
  const t = ((ang - 90) * Math.PI) / 180
  return [C + rad * Math.cos(t), C + rad * Math.sin(t)] as const
}
const ANILLOS: [number, string][] = [[25, 'Leve'], [50, 'Moderado'], [70, 'Marcado']]

function Esfera({ nombres }: { nombres: boolean }) {
  return (
    <svg viewBox={nombres ? "-100 0 680 480" : "0 0 480 480"} className="w-full h-auto" role="img" aria-label="Esfera con las once medidas; poros 72 y brillo 61 destacan">
      <circle cx={C} cy={C} r={R1} fill="none" stroke="var(--color-rule)" />
      {ANILLOS.map(([v, t]) => (
        <g key={v}>
          <circle cx={C} cy={C} r={r(v)} fill="none" stroke="var(--color-rule)" strokeDasharray="3 4" />
          {nombres && (() => { const [x, y] = pol(r(v), -PASO / 2); return <text x={x - 4} y={y - 3} textAnchor="end" fontSize={11} fill="var(--color-muted)">{t}</text> })()}
        </g>
      ))}
      <circle cx={C} cy={C} r={R0 - 6} fill="var(--color-paper-2)" />
      {MEDIDAS.map(([a, v], k) => {
        const ang = k * PASO
        const alto = v >= 50
        const [x0, y0] = pol(R0, ang)
        const [x1, y1] = pol(r(v), ang)
        const [lx, ly] = pol(R1 + (nombres ? 18 : 16), ang)
        const ancla = Math.abs(lx - C) < 12 ? 'middle' : lx > C ? 'start' : 'end'
        return (
          <g key={a}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={alto ? 'var(--color-accent)' : 'var(--color-accent-mid)'} strokeWidth={16} className="sc-radio" style={{ ['--i' as string]: k }} />
            {nombres ? (
              <text x={lx} y={ly + 4} textAnchor={ancla} fontSize={13} fill="var(--color-ink-2)">
                {a} <tspan fontWeight={500} fill={alto ? 'var(--color-accent)' : 'var(--color-muted)'} style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</tspan>
              </text>
            ) : (
              <text x={lx} y={ly + 6} textAnchor={ancla} fontSize={18} fontWeight={500} fill={alto ? 'var(--color-accent)' : 'var(--color-ink-2)'}>{k + 1}</text>
            )}
          </g>
        )
      })}
      <text x={C} y={C + 10} textAnchor="middle" fontSize={54} fontWeight={500} letterSpacing="-0.03em" fill="var(--color-ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>{GLOBAL}</text>
      <text x={C} y={C + 32} textAnchor="middle" fontSize={12} fill="var(--color-muted)">de 100</text>
    </svg>
  )
}

export function PanelDial() {
  return (
    <figure className="m-0" aria-label="Lectura de ejemplo del análisis facial: esfera con once medidas de la piel">
      <div className="grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] border border-linea rounded-[var(--radius-card)] bg-papel">
        <Resumen sinPuntuacion>
          <div className="hidden lg:grid gap-2 text-sm col-span-2 lg:col-span-1">
            <p className="text-gris m-0">Cómo leerla</p>
            <p className="m-0 text-tinta-2">Cada radio es una medida de 0 a 100. Cuanto más sale hacia fuera, más marcada. Los anillos son los cortes leve, moderado y marcado.</p>
          </div>
        </Resumen>
        <div className="p-6 lg:p-8">
          <div className="hidden md:block max-w-[46rem] mx-auto"><Esfera nombres /></div>
          <div className="md:hidden grid gap-5">
            <div className="max-w-[20rem] mx-auto w-full"><Esfera nombres={false} /></div>
            <ol className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm m-0 p-0 list-none">
              {MEDIDAS.map(([a, v], k) => (
                <li key={a} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-1.5 items-baseline border-b border-linea pb-2">
                  <span className="cifra text-xs text-gris">{k + 1}</span>
                  <span className="truncate">{a}</span>
                  <span className={`cifra ${v >= 50 ? 'text-marca' : 'text-gris'}`} title={nivel(v)}>{v}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Lectura de una foto con datos de ejemplo. Más hacia fuera, más marcado.</figcaption>
    </figure>
  )
}
