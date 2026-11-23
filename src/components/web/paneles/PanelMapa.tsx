import { CARA, CONTORNO, MALLA, PUNTO, RASGOS } from '../caraMalla'
import { Resumen } from './Resumen'
import { nivel, valor } from './ejemplo'

// Opción A · Mapa facial: cada medida señalada en su zona de la cara, sobre la misma malla que ve la clienta en el iPad.
const K = 1.35
const OX = 245
const OY = 26
const en = ([x, y]: readonly [number, number] | readonly number[]) => [OX + x * K, OY + y * K] as const

type Zona = { a: string; p: readonly number[]; y: number }
const IZQ: Zona[] = [
  { a: 'Arrugas', p: PUNTO.pataD, y: 62 },
  { a: 'Ojeras', p: PUNTO.ojera, y: 142 },
  { a: 'Manchas', p: PUNTO.pomuloD, y: 222 },
  { a: 'Firmeza', p: PUNTO.mandibulaD, y: 302 },
]
const DER: Zona[] = [
  { a: 'Brillo', p: PUNTO.frente, y: 62 },
  { a: 'Poros', p: PUNTO.nariz, y: 142 },
  { a: 'Rojez', p: PUNTO.mejilla, y: 222 },
  { a: 'Acné', p: PUNTO.barbilla, y: 302 },
]
const TODA = ['Textura', 'Hidratación', 'Luminosidad']
const MOVIL = [...DER, ...IZQ].sort((x, y) => valor(y.a) - valor(x.a))

export function Cara() {
  return (
    <g>
      <path d={MALLA} fill="none" stroke="var(--color-accent-mid)" strokeOpacity={0.45} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      <path d={RASGOS} fill="none" stroke="var(--color-accent)" strokeOpacity={0.55} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path d={CONTORNO} fill="none" stroke="var(--color-accent)" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
    </g>
  )
}

function Etiqueta({ z, lado }: { z: Zona; lado: 'izq' | 'der' }) {
  const v = valor(z.a)
  const alto = v >= 50
  const [px, py] = en(z.p)
  const x = lado === 'izq' ? 196 : 564
  const ancla = lado === 'izq' ? 'end' : 'start'
  const lx = lado === 'izq' ? 206 : 554
  return (
    <g>
      <polyline points={`${lx},${z.y + 4} ${lado === 'izq' ? lx + 18 : lx - 18},${z.y + 4} ${px},${py}`} fill="none" stroke={alto ? 'var(--color-accent)' : 'var(--color-field)'} strokeWidth={1} />
      {alto && <circle cx={px} cy={py} r={10} fill="var(--color-accent)" fillOpacity={0.14} />}
      <circle cx={px} cy={py} r={4} fill={alto ? 'var(--color-accent)' : 'var(--color-paper)'} stroke={alto ? 'var(--color-accent)' : 'var(--color-ink-2)'} strokeWidth={1.25} />
      <text x={x} y={z.y - 12} textAnchor={ancla} fontSize={13} fill="var(--color-muted)">{z.a}</text>
      <text x={x} y={z.y + 12} textAnchor={ancla} fontSize={24} fontWeight={500} letterSpacing="-0.02em" fill={alto ? 'var(--color-accent)' : 'var(--color-ink)'} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {lado === 'izq' ? <><tspan fontSize={13} fontWeight={400} letterSpacing="0" fill="var(--color-muted)">{nivel(v)}  </tspan>{v}</> : <>{v}<tspan fontSize={13} fontWeight={400} letterSpacing="0" fill="var(--color-muted)">  {nivel(v)}</tspan></>}
      </text>
    </g>
  )
}

export function PanelMapa() {
  return (
    <figure className="m-0" aria-label="Lectura de ejemplo del análisis facial: cada medida señalada en su zona de la cara">
      <div className="grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] border border-linea rounded-[var(--radius-card)] bg-papel">
        <Resumen />
        <div className="p-6 lg:p-8 grid gap-6">
          {/* Escritorio: cara con las zonas señaladas */}
          <svg viewBox="0 0 760 360" className="hidden md:block w-full h-auto" role="img" aria-label="Poros 72 y brillo 61 destacan; el resto entre leve y bien">
            <g transform={`translate(${OX} ${OY}) scale(${K})`}><Cara /></g>
            {IZQ.map((z) => <Etiqueta key={z.a} z={z} lado="izq" />)}
            {DER.map((z) => <Etiqueta key={z.a} z={z} lado="der" />)}
          </svg>
          {/* Móvil: cara con números y la lista debajo */}
          <div className="md:hidden grid gap-5">
            <svg viewBox={`-10 -6 ${CARA.ancho + 20} ${CARA.alto + 12}`} className="w-[62%] mx-auto h-auto" aria-hidden>
              <Cara />
              {MOVIL.map((z, k) => {
                const alto = valor(z.a) >= 50
                return (
                  <g key={z.a}>
                    <circle cx={z.p[0]} cy={z.p[1]} r={7.5} fill={alto ? 'var(--color-accent)' : 'var(--color-paper)'} stroke={alto ? 'var(--color-accent)' : 'var(--color-ink-2)'} strokeWidth={1} />
                    <text x={z.p[0]} y={z.p[1] + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={alto ? 'var(--color-accent-ink)' : 'var(--color-ink)'}>{k + 1}</text>
                  </g>
                )
              })}
            </svg>
            <ol className="grid gap-2.5 text-sm m-0 p-0 list-none">
              {MOVIL.map((z, k) => {
                const v = valor(z.a)
                return (
                  <li key={z.a} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-2 border-b border-linea pb-2.5">
                    <span className="cifra text-xs text-gris">{k + 1}</span>
                    <span>{z.a}</span>
                    <span className={v >= 50 ? 'text-marca font-medium' : 'text-gris'}><span className="cifra">{v}</span> {nivel(v)}</span>
                  </li>
                )
              })}
            </ol>
          </div>
          {/* Medidas de toda la cara */}
          <div className="border-t border-linea pt-5 grid sm:grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-x-8 gap-y-3 items-center text-sm">
            <span className="text-gris">En toda la cara</span>
            {TODA.map((a) => {
              const v = valor(a)
              return (
                <div key={a} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <span>{a}</span>
                  <span className="escala"><i /><b style={{ width: `${v}%` }} /></span>
                  <span className="cifra text-right text-gris">{v}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Lectura de una foto con datos de ejemplo. Cada medida, en su zona de la cara.</figcaption>
    </figure>
  )
}
