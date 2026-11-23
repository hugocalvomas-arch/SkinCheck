// Lectura del análisis facial con datos de ejemplo: las 11 medidas en su escala de 0 a 100,
// con los mismos cortes que usa el informe de la clienta (Leve 25, Moderado 50, Marcado 70).
const MEDIDAS: [string, number][] = [
  ['Poros', 72], ['Brillo', 61], ['Rojez', 48], ['Textura', 41], ['Manchas', 33], ['Hidratación', 29],
  ['Luminosidad', 26], ['Ojeras', 22], ['Arrugas', 17], ['Firmeza', 14], ['Acné', 9],
]
const nivel = (v: number) => (v >= 70 ? 'Marcado' : v >= 50 ? 'Moderado' : v >= 25 ? 'Leve' : 'Bien')
const CORTES: [number, string][] = [[70, 'Marcado'], [50, 'Moderado'], [25, 'Leve']]
const GLOBAL = 74

export function PanelAnalisis() {
  return (
    <figure className="m-0" aria-label="Lectura de ejemplo del análisis facial: once medidas de la piel de 0 a 100">
      <div className="grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] border border-linea rounded-[var(--radius-card)] bg-papel">
        {/* Resumen */}
        <div className="p-6 lg:p-8 grid grid-cols-2 lg:grid-cols-1 gap-6 content-between border-b lg:border-b-0 lg:border-r border-linea">
          <div>
            <p className="text-sm text-gris">Puntuación de la piel</p>
            <p className="cifra text-[4.5rem] leading-none font-medium text-tinta mt-2">{GLOBAL}<span className="text-lg text-gris font-normal tracking-normal"> /100</span></p>
          </div>
          <dl className="grid gap-4 text-sm m-0">
            <div><dt className="text-gris">Edad aparente de la piel</dt><dd className="m-0 mt-1 text-lg font-medium"><span className="cifra">31</span> años</dd></div>
            <div><dt className="text-gris">A trabajar primero</dt><dd className="m-0 mt-1 text-lg font-medium">Poros y brillo</dd></div>
          </dl>
        </div>

        {/* Escalas verticales (escritorio) */}
        <div className="hidden md:block p-6 lg:p-8">
          <div className="relative grid grid-cols-11 gap-3 h-[19rem] pr-20">
            {CORTES.map(([c, t]) => (
              <span key={c} aria-hidden className="absolute left-0 right-0 border-t border-dashed border-linea" style={{ bottom: `${c}%` }}>
                <span className="absolute right-0 -translate-y-1/2 text-xs text-gris bg-papel pl-2">{t}</span>
              </span>
            ))}
            {MEDIDAS.map(([a, v], i) => (
              <div key={a} className="relative h-full flex flex-col justify-end items-center">
                <span className={`cifra text-sm mb-1 ${v >= 50 ? 'text-marca font-medium' : 'text-gris'}`}>{v}</span>
                <span className="relative w-full max-w-7 rounded-t-[3px] overflow-hidden" style={{ height: `${v}%` }}>
                  <span className="sc-columna absolute inset-0" style={{ background: v >= 50 ? 'var(--color-accent)' : 'var(--color-accent-mid)', ['--i' as string]: i }} />
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-11 gap-3 pr-20 border-t border-tinta pt-3">
            {MEDIDAS.map(([a]) => <span key={a} className="text-[0.8125rem] text-center leading-tight text-tinta-2 whitespace-nowrap tracking-[-0.01em]">{a}</span>)}
          </div>
        </div>

        {/* Escalas horizontales (móvil) */}
        <ul className="md:hidden p-6 grid gap-3 text-sm m-0 list-none">
          {MEDIDAS.map(([a, v], i) => (
            <li key={a} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
              <span>{a}</span>
              <span className="escala"><i /><b className="sc-barra" data-alto={v >= 50 ? '' : undefined} style={{ width: `${v}%`, ['--i' as string]: i }} /></span>
              <span className={`text-xs text-right ${v >= 50 ? 'text-marca font-medium' : 'text-gris'}`}><span className="cifra">{v}</span> {nivel(v)}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Lectura de una foto con datos de ejemplo. Más alto, más marcado.</figcaption>
    </figure>
  )
}
