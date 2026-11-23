import { redirect } from 'next/navigation'
import { usuarioActual } from '@/lib/auth'
import { CARAS, REFERENCIA, proveedores } from '@/server/bancoApis'
import { NOMBRE_ASPECTO } from '@/server/analisisPiel'
import { Banco } from './Banco'

export default async function Apis() {
  const { esAdmin } = await usuarioActual()
  if (!esAdmin) redirect('/app')
  const aspectos = Object.keys(NOMBRE_ASPECTO)
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Comparar APIs de análisis</h1>
        <p className="text-gris mt-1">Las mismas dos caras generadas con IA por cada proveedor que tenga clave en Vercel, al lado de Perfect Corp.</p>
      </div>
      <section className="grid md:grid-cols-2 gap-6">
        {CARAS.map((c) => (
          <div key={c.id} className="bg-papel rounded-[var(--radius-card)] border border-linea p-5 flex gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.foto} alt={c.nombre} className="w-32 rounded-lg object-cover" />
            <div className="flex-1 text-sm">
              <p className="font-medium">{c.nombre}</p>
              <p className="text-gris mb-2">Perfect Corp: global {REFERENCIA[c.id].global}, edad {REFERENCIA[c.id].edad}</p>
              <table className="w-full tabular-nums">
                <tbody>
                  {aspectos.map((a) => (
                    <tr key={a} className="border-t border-linea"><td className="py-0.5">{NOMBRE_ASPECTO[a]}</td><td className="text-right">{REFERENCIA[c.id].ui[a]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
      <Banco proveedores={proveedores()} nombres={NOMBRE_ASPECTO} />
    </div>
  )
}
