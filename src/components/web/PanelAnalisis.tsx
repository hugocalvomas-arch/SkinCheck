import { ScanSmiley } from '@phosphor-icons/react/dist/ssr'

// Panel de resultados del análisis facial, con datos de ejemplo. Misma lectura que ve la clienta en el iPad.
const MEDIDAS: [string, number][] = [
  ['Poros', 72], ['Brillo', 61], ['Rojez', 48], ['Textura', 41], ['Manchas', 33], ['Hidratación', 29],
  ['Luminosidad', 26], ['Ojeras', 22], ['Arrugas', 17], ['Firmeza', 14], ['Acné', 9],
]
const nivel = (v: number) => (v >= 70 ? 'Marcado' : v >= 50 ? 'Moderado' : v >= 25 ? 'Leve' : 'Bien')
const R = 52
const TOTAL = 2 * Math.PI * R
const GLOBAL = 74

export function PanelAnalisis() {
  return (
    <div className="relative rounded-2xl bg-white border border-linea shadow-[0_30px_80px_-30px_rgba(11,110,91,.28)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 h-12 border-b border-linea">
        <ScanSmiley size={20} className="text-marca" />
        <span className="font-medium">Análisis facial</span>
        <span className="ml-auto font-mono text-xs text-gris">Datos de ejemplo</span>
      </div>

      <div className="grid sm:grid-cols-[auto_1fr] gap-6 p-5">
        <div className="flex sm:flex-col items-center gap-5 sm:gap-4 sm:pr-6 sm:border-r border-linea">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-suave)" strokeWidth="8" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-marca)" strokeWidth="8" strokeLinecap="round"
                className="sc-aro" strokeDasharray={TOTAL} strokeDashoffset={TOTAL * (1 - GLOBAL / 100)} style={{ ['--aro-total' as string]: TOTAL }} />
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <span className="font-mono text-3xl font-semibold num leading-none">{GLOBAL}</span>
              <span className="text-[11px] text-gris mt-1">sobre 100</span>
            </div>
          </div>
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-gris">Edad de la piel</dt><dd className="font-mono text-lg font-medium num">31 años</dd></div>
            <div><dt className="text-gris">A trabajar</dt><dd className="font-medium">Poros y brillo</dd></div>
          </dl>
        </div>

        <ul className="grid gap-2.5 text-sm self-center">
          {MEDIDAS.map(([a, v], i) => (
            <li key={a} className="grid grid-cols-[6.5rem_1fr_2rem_4.5rem] items-center gap-3">
              <span>{a}</span>
              <span className="h-1.5 rounded-full overflow-hidden">
                <span className="sc-barra block h-full rounded-full" style={{ width: `${v}%`, background: v >= 50 ? 'var(--color-marca)' : 'var(--color-marca-media)', ['--i' as string]: i }} />
              </span>
              <span className="font-mono text-xs text-right num">{v}</span>
              <span className={`text-xs ${v >= 50 ? 'text-marca font-medium' : 'text-gris'}`}>{nivel(v)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
