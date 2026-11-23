import { Moon, Sun } from '@phosphor-icons/react/dist/ssr'

// Vista previa real del informe que recibe la clienta en el iPad (mismos componentes visuales, datos de ejemplo).
const ASPECTOS: [string, number][] = [['Poros', 72], ['Brillo', 58], ['Rojeces', 44], ['Textura', 39], ['Manchas', 31], ['Arrugas', 18]]
const nivel = (v: number) => (v >= 70 ? 'Marcado' : v >= 50 ? 'Moderado' : v >= 25 ? 'Leve' : 'Bien')

export function MiniInforme() {
  return (
    <div className="rounded-[2rem] bg-tinta p-3 shadow-[0_24px_60px_-20px_rgba(15,27,29,.35)]">
      <div className="rounded-[1.4rem] bg-fondo overflow-hidden">
        <div className="h-10 flex items-center gap-2 px-4 border-b border-linea bg-white text-sm">
          <span className="w-5 h-5 rounded bg-marca text-white grid place-items-center text-[11px] font-semibold">S</span>
          <span className="font-semibold">SkinCheck</span>
          <span className="text-gris">Tu farmacia</span>
        </div>
        <div className="p-5 grid gap-5">
          <div>
            <p className="text-xl font-semibold tracking-tight">Tu informe de piel</p>
            <p className="text-sm text-gris">Lo que más conviene trabajar: poros y brillo.</p>
          </div>
          <ul className="grid gap-2 text-sm">
            {ASPECTOS.map(([a, v]) => (
              <li key={a} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3">
                <span>{a}</span>
                <span className="h-1.5 rounded-full bg-linea overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${v}%`, background: v >= 50 ? 'var(--color-marca)' : 'var(--color-marca-media)' }} /></span>
                <span className={`text-right text-xs ${v >= 50 ? 'font-medium' : 'text-gris'}`}>{nivel(v)}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icono: <Sun size={16} />, t: 'Mañana', p: [['Gel limpiador suave', '15,90 €'], ['Sérum de niacinamida', '7,50 €'], ['Fluido SPF 50', '24,95 €']] },
              { icono: <Moon size={16} />, t: 'Noche', p: [['Gel limpiador suave', '15,90 €'], ['Crema con retinal', '32,50 €'], ['Crema reparadora', '13,20 €']] },
            ].map((b) => (
              <div key={b.t} className="tarjeta p-3 space-y-2">
                <p className="flex items-center gap-1.5 font-medium text-marca">{b.icono} {b.t}</p>
                {b.p.map(([n, pr]) => <p key={n} className="flex justify-between gap-2"><span className="truncate">{n}</span><span className="num text-gris">{pr}</span></p>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
