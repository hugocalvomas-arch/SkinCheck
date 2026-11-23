import { Resumen } from './Resumen'
import { MEDIDAS, nivel } from './ejemplo'

// Opción B · Informe con rango de referencia: como una analítica, cada medida sobre las cuatro bandas del producto.
const BANDAS: [string, number, number, string][] = [
  ['Bien', 0, 25, 'transparent'],
  ['Leve', 25, 50, 'var(--color-paper-2)'],
  ['Moderado', 50, 70, 'var(--color-paper-3)'],
  ['Marcado', 70, 100, 'color-mix(in srgb, var(--color-accent) 16%, var(--color-paper))'],
]

function Pista({ v }: { v: number }) {
  const alto = v >= 50
  return (
    <span className="relative block h-7" aria-hidden>
      {BANDAS.map(([n, a, b, c]) => <span key={n} className="absolute inset-y-0 border-l border-linea first:border-l-0" style={{ left: `${a}%`, width: `${b - a}%`, background: c }} />)}
      <span className="absolute top-1/2 h-[2px] -translate-y-1/2 left-0" style={{ width: `${v}%`, background: alto ? 'var(--color-accent)' : 'var(--color-accent-mid)' }} />
      <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ left: `${v}%`, borderColor: alto ? 'var(--color-accent)' : 'var(--color-ink-2)', background: alto ? 'var(--color-accent)' : 'var(--color-paper)' }} />
    </span>
  )
}

export function PanelInforme() {
  return (
    <figure className="m-0" aria-label="Lectura de ejemplo del análisis facial: once medidas con su rango de referencia">
      <div className="grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] border border-linea rounded-[var(--radius-card)] bg-papel">
        <Resumen />
        <div className="p-6 lg:p-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-gris">
                <th scope="col" className="font-normal pb-3 w-[8.5rem]">Medida</th>
                <th scope="col" className="font-normal pb-3 w-12 text-right pr-5">Valor</th>
                <th scope="col" className="font-normal pb-3 hidden sm:table-cell">
                  <span className="relative block h-5">
                    {BANDAS.map(([n, a, b]) => <span key={n} className="absolute bottom-0 text-xs pl-1.5 border-l border-linea first:border-l-0 first:pl-0 whitespace-nowrap" style={{ left: `${a}%`, width: `${b - a}%` }}>{n} <span className="cifra text-gris/80">{a}</span></span>)}
                  </span>
                </th>
                <th scope="col" className="font-normal pb-3 w-24 pl-5 sm:table-cell hidden">Nivel</th>
              </tr>
            </thead>
            <tbody className="border-t border-tinta">
              {MEDIDAS.map(([a, v]) => {
                const alto = v >= 50
                return (
                  <tr key={a} className="border-b border-linea">
                    <th scope="row" className={`text-left font-normal py-1.5 ${alto ? 'font-medium' : ''}`}>{a}</th>
                    <td className={`cifra text-right pr-5 text-base ${alto ? 'text-marca' : ''}`}>{v}</td>
                    <td className="hidden sm:table-cell py-1"><Pista v={v} /></td>
                    <td className={`pl-5 hidden sm:table-cell ${alto ? 'text-marca font-medium' : 'text-gris'}`}>{nivel(v)}</td>
                    <td className={`sm:hidden text-right text-xs ${alto ? 'text-marca font-medium' : 'text-gris'}`}>{nivel(v)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gris">Lectura de una foto con datos de ejemplo. Cada medida sobre su rango, como en una analítica.</figcaption>
    </figure>
  )
}
