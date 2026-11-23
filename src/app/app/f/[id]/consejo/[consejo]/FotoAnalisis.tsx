/* eslint-disable @next/next/no-img-element */
import { NOMBRE_ASPECTO, type ResultadoFoto } from '@/server/analisisPiel'

// Resultado de la foto: cara con zonas marcadas, simulación del "después" y nivel de cada aspecto.
// Las imágenes las aloja el proveedor y caducan a las 2 horas; después solo quedan las puntuaciones.
export function FotoAnalisis({ f }: { f: ResultadoFoto }) {
  const vigentes = f.imagenes && new Date(f.imagenes.caducan) > new Date()
  const marcas = vigentes ? f.imagenes.marcas.filter((u) => u !== f.imagenes.despues) : []
  const aspectos = Object.entries(f.puntuaciones).sort((a, b) => b[1] - a[1])
  return (
    <section className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-medium">Lo que vemos en tu piel</h2>
        {f.edad_piel != null && <span className="text-sm text-gris">Edad aparente de la piel: {f.edad_piel}</span>}
        {f.puntuacion_global != null && <span className="text-sm text-gris">Puntuación global: {f.puntuacion_global}/100</span>}
      </div>
      {vigentes && (marcas.length > 0 || f.imagenes.despues) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {marcas[0] && (
            <figure className="space-y-1">
              <img src={marcas[0]} alt="Zonas marcadas en la cara" className="w-full rounded-lg" />
              <figcaption className="text-xs text-gris">Hoy, con las zonas a trabajar marcadas</figcaption>
            </figure>
          )}
          {f.imagenes.despues && (
            <figure className="space-y-1">
              <img src={f.imagenes.despues} alt="Simulación de la mejora" className="w-full rounded-lg" />
              <figcaption className="text-xs text-gris">Simulación orientativa de cómo podría mejorar con constancia. No es una promesa de resultado.</figcaption>
            </figure>
          )}
        </div>
      )}
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {aspectos.map(([a, v]) => (
          <li key={a} className="flex items-center gap-2">
            <span className="w-28 shrink-0">{NOMBRE_ASPECTO[a] ?? a}</span>
            <span className="flex-1 h-2 bg-suave rounded-full overflow-hidden">
              <span className="block h-full bg-marca" style={{ width: `${v}%` }} />
            </span>
            <span className="w-10 text-right text-gris">{v}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gris">Más alto = más marcado. Es un análisis cosmético orientativo, no un diagnóstico médico.</p>
    </section>
  )
}
