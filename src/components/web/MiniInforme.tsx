import { Moon, Sun } from '@phosphor-icons/react/dist/ssr'
import { Logo } from '@/components/Logo'

import { aTrabajar, nivelPiel } from '@/lib/escalaPiel'

// Vista previa del informe que recibe la clienta en el iPad (mismas piezas visuales, datos de ejemplo).
// Escala de Perfect Corp: más alto = piel en mejor estado.
const ASPECTOS: [string, number][] = [['Poros', 28], ['Brillo', 42], ['Rojeces', 56], ['Textura', 61], ['Manchas', 69], ['Arrugas', 82]]

export function MiniInforme() {
  return (
    <div className="rounded-[var(--radius-card)] border border-linea bg-papel shadow-tarjeta overflow-hidden">
      <div className="h-12 flex items-center gap-3 px-5 border-b border-linea text-sm">
        <Logo />
        <span className="text-gris">Tu farmacia</span>
      </div>
      <div className="p-6 grid gap-6">
        <div>
          <p className="text-2xl font-semibold tracking-[-0.025em]">Tu informe de piel</p>
          <p className="text-gris mt-1">Lo que más conviene trabajar: poros y brillo.</p>
        </div>
        <ul className="grid gap-3 text-sm m-0 p-0 list-none">
          {ASPECTOS.map(([a, v]) => (
            <li key={a} className="grid grid-cols-[4.75rem_minmax(0,1fr)_1.75rem_4.75rem] items-center gap-3">
              <span>{a}</span>
              <span className="escala"><i /><b data-alto={aTrabajar(v) ? '' : undefined} style={{ width: `${v}%` }} /></span>
              <span className="num text-right">{v}</span>
              <span className={`text-right text-xs ${aTrabajar(v) ? 'font-medium text-marca' : 'text-gris'}`}>{nivelPiel(v)}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-x-6 text-sm border-t border-linea pt-5">
          {[
            { icono: <Sun size={16} />, t: 'Mañana', p: [['Gel limpiador suave', '15,90 €'], ['Sérum de niacinamida', '7,50 €'], ['Fluido SPF 50', '24,95 €']] },
            { icono: <Moon size={16} />, t: 'Noche', p: [['Gel limpiador suave', '15,90 €'], ['Crema con retinal', '32,50 €'], ['Crema reparadora', '13,20 €']] },
          ].map((b) => (
            <div key={b.t} className="grid gap-2 content-start">
              <p className="flex items-center gap-1.5 font-medium text-marca">{b.icono} {b.t}</p>
              {b.p.map(([n, pr]) => <p key={n} className="flex justify-between gap-2"><span className="truncate">{n}</span><span className="num text-gris">{pr}</span></p>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
