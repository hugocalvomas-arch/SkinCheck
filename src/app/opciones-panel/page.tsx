import type { Metadata } from 'next'
import { PanelAnalisis } from '@/components/web/PanelAnalisis'
import { PanelMapa } from '@/components/web/paneles/PanelMapa'
import { PanelInforme } from '@/components/web/paneles/PanelInforme'
import { PanelDial } from '@/components/web/paneles/PanelDial'
import { PanelFotoRadar } from '@/components/web/paneles/PanelFotoRadar'

// Página temporal para elegir el panel de la portada. Se borra al decidir.
export const metadata: Metadata = { title: 'Opciones del panel · SkinCheck', robots: { index: false } }

const OPCIONES = [
  ['D', 'Cara y radar', 'A la izquierda la cara con las zonas que marca el análisis; a la derecha, las once medidas en radar.', <PanelFotoRadar key="e" />],
  ['A', 'Mapa facial', 'Cada medida señalada en su zona de la cara, con la malla del iPad.', <PanelMapa key="a" />],
  ['B', 'Informe con rango', 'Como una analítica: cada medida sobre las bandas bien, leve, moderado y marcado.', <PanelInforme key="b" />],
  ['C', 'Esfera', 'La puntuación en el centro y las once medidas en radios.', <PanelDial key="c" />],
  ['Actual', 'Columnas', 'La versión publicada ahora.', <PanelAnalisis key="d" />],
] as const

export default function OpcionesPanel() {
  return (
    <main className="contenedor py-12 grid gap-20">
      {OPCIONES.map(([id, t, d, panel]) => (
        <section key={id} id={`opcion-${id.toLowerCase()}`} className="grid gap-6">
          <header>
            <p className="text-sm text-gris m-0">Opción {id}</p>
            <h2 className="text-[2rem] leading-tight m-0 mt-1">{t}</h2>
            <p className="text-gris m-0 mt-2">{d}</p>
          </header>
          {panel}
        </section>
      ))}
    </main>
  )
}
