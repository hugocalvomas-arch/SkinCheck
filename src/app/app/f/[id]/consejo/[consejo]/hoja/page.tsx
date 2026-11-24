/* eslint-disable @typescript-eslint/no-explicit-any */
import { usuarioActual } from '@/lib/auth'
import { Acciones } from './Acciones'

const eur = (n: number | null) => (n == null ? '' : n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }))

// Hoja de consejo para el cliente: se imprime o se guarda como PDF desde el navegador, o se envía por WhatsApp.
export default async function Hoja({ params, searchParams }: { params: Promise<{ id: string; consejo: string }>; searchParams: Promise<{ nivel?: string }> }) {
  const { id, consejo } = await params
  const { nivel = 'media' } = await searchParams
  const { sb } = await usuarioActual()
  const [{ data: f }, { data: c }] = await Promise.all([
    sb.from('farmacias').select('nombre, logo_url').eq('id', id).maybeSingle(),
    sb.from('consejos').select('rutinas, creado').eq('id', consejo).eq('farmacia_id', id).maybeSingle(),
  ])
  if (!f || !c) return <p>No encontrado.</p>
  const R = c.rutinas as any
  const r = R.rutinas?.[nivel]
  if (!r) return <p>Rutina no encontrada.</p>
  const prods = r.productos.filter((p: any) => p.producto)
  const manana = prods.filter((p: any) => p.turno === 'AM' || p.turno === 'AMPM')
  const noche = prods.filter((p: any) => p.turno === 'PM' || p.turno === 'AMPM')
  const texto = [
    `Tu rutina de ${f.nombre}:`,
    'MAÑANA: ' + manana.map((p: any) => `${p.paso}: ${p.marca} ${p.producto}`).join(' · '),
    'NOCHE: ' + noche.map((p: any) => `${p.paso}: ${p.marca} ${p.producto}`).join(' · '),
    r.escalado ? `Cómo empezar: ${r.escalado}` : '',
    'Esto no es un diagnóstico. Si algo te preocupa o no mejora, consúltalo.',
  ].filter(Boolean).join('\n')

  const Lista = ({ titulo, items }: { titulo: string; items: any[] }) => (
    <section className="space-y-2">
      <h2 className="font-semibold">{titulo}</h2>
      <ol className="space-y-2">
        {items.map((p: any, i: number) => (
          <li key={i} className="flex gap-3">
            <span className="text-gris w-5">{i + 1}.</span>
            <div>
              <div className="font-medium">{p.paso}: {p.marca} {p.producto}{p.bajo_pedido ? ' (bajo pedido)' : ''}</div>
              <div className="text-sm text-gris">{p.para}</div>
            </div>
            <span className="ml-auto whitespace-nowrap text-sm">{eur(p.precio)}</span>
          </li>
        ))}
      </ol>
    </section>
  )

  return (
    <div className="max-w-2xl mx-auto bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-6 print:shadow-none print:p-0">
      <header className="flex items-center gap-4 border-b pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {f.logo_url && <img src={f.logo_url} alt="" className="h-12" />}
        <div>
          <div className="text-xl font-semibold">{f.nombre}</div>
          <div className="text-sm text-gris">Tu rutina del {new Date(c.creado).toLocaleDateString('es-ES')}</div>
        </div>
      </header>
      <Lista titulo="Por la mañana" items={manana} />
      <Lista titulo="Por la noche" items={noche} />
      {r.escalado && <p className="text-sm"><b>Cómo empezar:</b> {r.escalado}</p>}
      {r.avisos?.length > 0 && <ul className="list-disc pl-5 text-sm space-y-1">{r.avisos.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>}
      {R.derivacion?.length > 0 && <ul className="list-disc pl-5 text-sm space-y-1 text-error">{R.derivacion.map((d: any, i: number) => <li key={i}>{d.texto}</li>)}</ul>}
      <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{eur(r.total)}</span></div>
      <p className="text-xs text-gris">Esto no es un diagnóstico ni sustituye a una consulta médica. Si algo te preocupa o no mejora, consúltalo con tu farmacéutico o tu médico.</p>
      <Acciones texto={texto} />
    </div>
  )
}
