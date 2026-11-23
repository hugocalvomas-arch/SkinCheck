import { EDAD, GLOBAL, PRIMERO } from './ejemplo'

// Columna de resumen común a las tres versiones del panel.
export function Resumen({ sinPuntuacion = false, children }: { sinPuntuacion?: boolean; children?: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-8 grid grid-cols-2 lg:grid-cols-1 gap-6 content-between border-b lg:border-b-0 lg:border-r border-linea">
      {!sinPuntuacion && (
        <div>
          <p className="text-sm text-gris">Puntuación de la piel</p>
          <p className="cifra text-[4.5rem] leading-none font-medium text-tinta mt-2">{GLOBAL}<span className="text-lg text-gris font-normal tracking-normal"> /100</span></p>
        </div>
      )}
      <dl className="grid gap-4 text-sm m-0">
        <div><dt className="text-gris">Edad aparente de la piel</dt><dd className="m-0 mt-1 text-lg font-medium"><span className="cifra">{EDAD}</span> años</dd></div>
        <div><dt className="text-gris">A trabajar primero</dt><dd className="m-0 mt-1 text-lg font-medium">{PRIMERO}</dd></div>
      </dl>
      {children}
    </div>
  )
}
