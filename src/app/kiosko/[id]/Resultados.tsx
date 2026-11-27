'use client'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ArrowLeft, ArrowRight, ArrowsLeftRight, CalendarCheck, Check, Clock, Drop, EnvelopeSimple, Eye, Flask, HandSoap, Moon, Sun, Umbrella } from '@phosphor-icons/react'
import { aTrabajar, nivelPiel } from '@/lib/escalaPiel'
import { AVISO_EMAIL } from '@/lib/privacidad'
import { enviarInformeEmail } from './actions'

// Resultado en el iPad como un recorrido con «Siguiente»: primero la piel (foto y medidas),
// luego los ingredientes y por qué, luego los productos, y al final cómo llevárselo.
// Cada pantalla entra con movimiento: las piezas aparecen una detrás de otra.
// Solo presentación: los datos llegan tal cual del motor (rutinas) y de la lectura (objetivos e ingredientes).

export const NOMBRE_RESULTADO: Record<string, string> = {
  acne: 'Granitos', poros: 'Poros', brillo: 'Brillo', manchas: 'Manchas', tono: 'Luminosidad', arrugas: 'Arrugas',
  firmeza: 'Firmeza', textura: 'Textura', rojez: 'Rojeces', hidratacion: 'Hidratación', ojeras: 'Ojeras',
}
// "Vitamina C pura" y "vitamina C estable" cuentan como el mismo ingrediente al buscarlo en la rutina
const raiz = (t: string) => t.toLowerCase().replace(/\s+(pura|estable)$/, '')
const eur = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }))
const primeraFrase = (t?: string | null) => { const f = (t ?? '').split(/(?<=\.)\s/)[0]?.trim() ?? ''; return f && !f.endsWith('.') ? `${f}.` : f }
const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Clave = 'evolucion' | 'piel' | 'ingredientes' | 'productos' | 'llevar'
const ETIQUETA: Record<Clave, string> = { evolucion: 'Tu evolución', piel: 'Tu piel', ingredientes: 'Ingredientes', productos: 'Tu rutina', llevar: 'Llévatela' }
const SIGUIENTE: Record<Clave, string> = { evolucion: 'Ver tu piel hoy', piel: 'Ver tus ingredientes', ingredientes: 'Ver tus productos', productos: 'Llévatela', llevar: 'Terminar' }
type Nivel = 'basica' | 'media' | 'completa'

export function Informe({ res, foto, farmacia, emailActivo = true, onFin }: { res: any; foto: string | null; farmacia: string; emailActivo?: boolean; onFin: () => void }) {
  const R = res.rutinas
  const F = res.foto
  const [k, setK] = useState(0)
  const [dir, setDir] = useState(1)
  const [nivel, setNivel] = useState<Nivel>('media')
  const arriba = useRef<HTMLDivElement>(null)

  if (R?.sin_rutina)
    return (
      <div className="w-full px-6 md:px-10 py-12 flex flex-col items-center justify-center gap-6">
        <h2 className="titulo max-w-2xl">{R.sin_rutina}</h2>
        <button onClick={onFin} className="boton">Terminar</button>
      </div>
    )

  const pasos: Clave[] = [...(res.anterior && F ? ['evolucion' as const] : []), 'piel', 'ingredientes', 'productos', 'llevar']
  const actual = pasos[k]
  const ir = (n: number) => {
    if (n < 0) return
    if (n >= pasos.length) return onFin()
    setDir(n > k ? 1 : -1)
    setK(n)
    arriba.current?.scrollIntoView({ block: 'start' })
  }

  const rut = R.rutinas[nivel]
  const productos: any[] = (rut.productos ?? []).filter((p: any) => p.producto)
  const conProducto = (g: any) => productos.find((p: any) => p.activo && raiz(p.activo) === raiz(g.nombre))

  return (
    <div ref={arriba} className="w-full flex flex-col scroll-mt-16">
      <EstilosRecorrido />
      <Progreso pasos={pasos} k={k} onIr={ir} />
      <div key={actual + nivel} className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 pt-6 pb-10 r-paso" style={{ ['--dir' as any]: dir }}>
        {actual === 'evolucion' && <Evolucion anterior={res.anterior} F={F} foto={foto} />}
        {actual === 'piel' && <PasoPiel F={F} foto={foto} objetivos={res.lectura?.objetivos ?? []} />}
        {actual === 'ingredientes' && <PasoIngredientes ingredientes={res.lectura?.ingredientes ?? []} objetivos={res.lectura?.objetivos ?? []} conProducto={conProducto} />}
        {actual === 'productos' && <PasoProductos R={R} nivel={nivel} onNivel={setNivel} ingredientes={res.lectura?.ingredientes ?? []} />}
        {actual === 'llevar' && <PasoLlevar res={res} rut={rut} foto={foto} farmacia={farmacia} nivel={nivel} emailActivo={emailActivo} />}
      </div>
      <footer className="sticky bottom-0 z-10 border-t border-[var(--k-line)] bg-papel/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-24 flex items-center gap-4">
          {k > 0 ? <button onClick={() => ir(k - 1)} className="boton-sec"><ArrowLeft size={20} /> Atrás</button> : <span />}
          <span className="ml-auto hidden sm:block text-[var(--k-muted)] num">{k + 1} de {pasos.length}</span>
          <button onClick={() => ir(k + 1)} className={`boton ${k < pasos.length - 1 ? 'r-latir' : ''}`} key={actual}>
            {SIGUIENTE[actual]} {k < pasos.length - 1 ? <ArrowRight size={20} weight="bold" /> : <Check size={20} weight="bold" />}
          </button>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Barra de progreso ---------- */

function Progreso({ pasos, k, onIr }: { pasos: Clave[]; k: number; onIr: (n: number) => void }) {
  return (
    <nav aria-label="Pasos del resultado" className="w-full max-w-6xl mx-auto px-6 md:px-10 pt-6">
      <ol className="grid gap-3 list-none p-0 m-0" style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}>
        {pasos.map((p, n) => (
          <li key={p}>
            <button onClick={() => n <= k && onIr(n)} disabled={n > k} aria-current={n === k ? 'step' : undefined} className="w-full text-left grid gap-2 disabled:cursor-default">
              <span className="h-1 rounded-full bg-[var(--k-line)] overflow-hidden">
                <span className={`block h-full bg-[var(--k-accent)] origin-left ${n < k ? '' : n === k ? 'r-llenar' : 'scale-x-0'}`} />
              </span>
              <span className={`text-sm ${n === k ? 'text-[var(--k-text)] font-medium' : n < k ? 'text-[var(--k-accent)]' : 'text-[var(--k-muted)]'}`}>{ETIQUETA[p]}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ---------- Título que entra palabra a palabra ---------- */

function Titulo({ texto, retraso = 0, className = '' }: { texto: string; retraso?: number; className?: string }) {
  return (
    <h2 className={`text-[clamp(2.25rem,4vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.06] m-0 ${className}`} aria-label={texto}>
      {texto.split(' ').map((w, n) => (
        <span key={n} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <span className="inline-block r-palabra" style={{ ['--d' as any]: `${retraso + n * 60}ms` }}>{w}&nbsp;</span>
        </span>
      ))}
    </h2>
  )
}

/** Número que sube de 0 a su valor */
function Cifra({ valor, retraso = 0, dur = 900 }: { valor: number; retraso?: number; dur?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const d = sinMovimiento() ? 0 : dur
    const t0 = performance.now() + (d ? retraso : 0)
    let id = 0
    const f = (t: number) => {
      const u = d ? Math.min(1, Math.max(0, (t - t0) / d)) : 1
      setV(valor * (1 - Math.pow(1 - u, 3)))
      if (u < 1) id = requestAnimationFrame(f)
    }
    id = requestAnimationFrame(f)
    return () => cancelAnimationFrame(id)
  }, [valor, retraso, dur])
  return <>{Math.round(v)}</>
}

/* ---------- 1. Tu piel ---------- */

function PasoPiel({ F, foto, objetivos }: { F: any; foto: string | null; objetivos: any[] }) {
  const filas = F?.ui
    ? Object.keys(NOMBRE_RESULTADO).filter((a) => F.ui[a] != null).map((a) => ({ a, nombre: NOMBRE_RESULTADO[a], nota: Math.round(F.ui[a]) })).sort((x, y) => x.nota - y.nota)
    : []
  const prioridad = new Set(objetivos.map((o: any) => o.aspecto))
  const zonas: Record<string, string> = F?.imagenes?.zonas ?? {}
  // Los mapas se enseñan de la nota más baja a la más alta
  const conMapa = filas.filter((f) => zonas[f.a])
  const [activo, setActivo] = useState(-1)
  const [fijo, setFijo] = useState(false)
  const [vista, setVista] = useState<'analisis' | 'simulacion'>('analisis')

  useEffect(() => {
    if (!conMapa.length || fijo) return
    const t = setTimeout(() => setActivo((x) => (x + 1) % conMapa.length), activo < 0 ? 2300 : 2800)
    return () => clearTimeout(t)
  }, [activo, fijo, conMapa.length])

  // Sin foto: lo que eligió la clienta, explicado en una línea
  if (!filas.length)
    return (
      <div className="grid gap-8 max-w-3xl">
        <Titulo texto="Lo que vamos a trabajar" />
        <ol className="grid gap-4 list-none p-0 m-0">
          {objetivos.map((o: any, n: number) => (
            <li key={o.aspecto} className="r-sube grid grid-cols-[3rem_1fr] gap-4 items-start border-t border-[var(--k-line)] pt-4" style={{ ['--d' as any]: `${400 + n * 220}ms` }}>
              <span className="cifra text-3xl text-[var(--k-accent)]">{n + 1}</span>
              <span><span className="block text-2xl font-medium">{o.nombre}</span><span className="text-[var(--k-muted)] text-lg">{o.que_es}</span></span>
            </li>
          ))}
        </ol>
      </div>
    )

  const base = foto ?? F?.imagenes?.marcas?.[0]
  const mostrado = activo >= 0 ? conMapa[activo] : null
  const despues = foto && F?.imagenes?.despues

  return (
    <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-12 items-start">
      <div className="w-full max-w-md mx-auto grid gap-3">
        {vista === 'simulacion' && despues ? <AntesDespues antes={foto!} despues={despues} /> : (
          <figure className="m-0 relative aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden bg-[var(--k-soft)] r-foto">
            {base && <img src={base} alt="Tu foto" className={`absolute inset-0 w-full h-full object-cover ${foto ? '-scale-x-100' : ''}`} />}
            {conMapa.map((f, n) => (
              <img key={f.a} src={zonas[f.a]} alt={`Zonas de ${f.nombre.toLowerCase()}`} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${foto ? '-scale-x-100' : ''}`} style={{ opacity: n === activo ? 1 : 0 }} />
            ))}
            <span className="r-escaneo" aria-hidden />
            <Esquinas />
            {mostrado && (
              <figcaption key={mostrado.a} className="absolute left-4 bottom-4 r-etiqueta rounded-full bg-cristal text-sobre-marca pl-4 pr-3 py-2 flex items-center gap-3 text-lg">
                {mostrado.nombre}<span className="cifra rounded-full bg-papel text-[var(--k-text)] px-2.5 py-0.5 text-base">{mostrado.nota}</span>
              </figcaption>
            )}
          </figure>
        )}
        {despues && (
          <div role="tablist" className="inline-flex justify-self-center rounded-[var(--radius-card)] border border-[var(--k-line)] p-1 r-sube" style={{ ['--d' as any]: '900ms' }}>
            {(['analisis', 'simulacion'] as const).map((v) => (
              <button key={v} role="tab" aria-selected={vista === v} onClick={() => setVista(v)} className={`h-11 px-4 rounded-lg text-sm ${vista === v ? 'bg-[var(--k-accent)] text-sobre-marca' : 'text-[var(--k-muted)]'}`}>
                {v === 'analisis' ? 'Tu análisis' : 'Con tu rutina'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Titulo texto="Así está tu piel" retraso={150} />
          <p className="texto m-0 r-sube" style={{ ['--d' as any]: '450ms' }}>Hemos medido {filas.length} aspectos de 0 a 100. Cuanto más alto, mejor.</p>
        </div>
        <ul className="grid gap-0.5 list-none p-0 m-0">
          {filas.map((f, n) => {
            const conM = conMapa.findIndex((c) => c.a === f.a)
            const resaltada = mostrado?.a === f.a
            return (
              <li key={f.a} className="r-sube" style={{ ['--d' as any]: `${600 + n * 70}ms` }}>
                <button disabled={conM < 0} onClick={() => { setActivo(conM); setFijo(true); setVista('analisis') }}
                  className={`w-full grid grid-cols-[8.5rem_minmax(0,1fr)_2.25rem_5.5rem] items-center gap-3 rounded-lg px-2 py-[3px] text-left transition-colors duration-300 ${resaltada ? 'bg-[var(--k-accent-soft)]' : ''} disabled:cursor-default`}>
                  <span className={`text-lg ${prioridad.has(f.a) ? 'font-medium' : ''}`}>{f.nombre}</span>
                  <span className="escala"><i /><b className="r-barra" data-alto={aTrabajar(f.nota) || prioridad.has(f.a) ? '' : undefined} style={{ width: `${Math.max(4, f.nota)}%`, ['--d' as any]: `${750 + n * 70}ms` }} /></span>
                  <span className="cifra text-lg text-right"><Cifra valor={f.nota} retraso={750 + n * 70} /></span>
                  <span className={`text-sm text-right ${prioridad.has(f.a) ? 'text-[var(--k-accent)] font-medium' : 'text-[var(--k-muted)]'}`}>{prioridad.has(f.a) ? 'A trabajar' : nivelPiel(f.nota)}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {objetivos.length > 0 && (
          <p className="m-0 text-lg r-sube" style={{ ['--d' as any]: `${800 + filas.length * 70}ms` }}>
            <span className="text-[var(--k-muted)]">Lo primero que conviene trabajar: </span>
            <span className="font-medium">{lista(objetivos.map((o: any) => o.nombre.toLowerCase()))}.</span>
          </p>
        )}
      </div>
    </div>
  )
}

const lista = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] ?? '')

/* ---------- 2. Ingredientes ---------- */

function PasoIngredientes({ ingredientes, objetivos, conProducto }: { ingredientes: any[]; objetivos: any[]; conProducto: (g: any) => any }) {
  // Primero los que ya van en la rutina; como mucho 4 para que se lean de un vistazo
  const lista4 = [...ingredientes].sort((a, b) => Number(!!conProducto(b)) - Number(!!conProducto(a)) || Number(b.ahora) - Number(a.ahora)).slice(0, 4)
  const nota: Record<string, number | null> = Object.fromEntries(objetivos.map((o: any) => [o.nombre, o.nota]))
  if (!lista4.length) return <Titulo texto="Tu farmacéutico te explicará los ingredientes" />
  const cols = lista4.length === 4 ? 2 : lista4.length
  return (
    <div className="grid gap-8">
      <div className="grid gap-3 max-w-3xl">
        <Titulo texto="Los ingredientes que necesita tu piel" />
        <p className="texto m-0 r-sube" style={{ ['--d' as any]: '400ms' }}>Elegidos para lo que hemos visto en tu foto.</p>
      </div>
      <ol className="grid gap-5 list-none p-0 m-0 md:[grid-template-columns:var(--cols)]" style={{ ['--cols' as any]: `repeat(${cols}, minmax(0, 1fr))` }}>
        {lista4.map((g: any, n: number) => {
          const d = 700 + n * 650
          const despues = !g.ahora
          return (
            <li key={g.nombre} className={`r-carta relative rounded-[var(--radius-card)] border bg-[var(--k-bg)] p-6 grid gap-4 content-start shadow-tarjeta ${despues ? 'border-dashed border-[var(--k-line)]' : 'border-[var(--k-line)]'}`} style={{ ['--d' as any]: `${d}ms` }}>
              <div className="flex items-center justify-between gap-3">
                <Anillo n={n + 1} retraso={d + 250} apagado={despues} />
                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--k-muted)] rounded-full bg-[var(--k-soft)] px-3 py-1.5">
                  {g.turno === 'PM' ? <Moon size={16} /> : <Sun size={16} />}{g.turno === 'PM' ? 'Noche' : g.turno === 'AMPM' ? 'Mañana y noche' : 'Mañana'}
                </span>
              </div>
              <div className="grid gap-1.5">
                <span className={`text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.025em] ${despues ? 'text-[var(--k-muted)]' : ''}`}>{g.nombre}</span>
                <span className="text-lg leading-snug text-[var(--k-text)]">{primeraFrase(g.por_que) || primeraFrase(g.frase)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.para.map((a: string, m: number) => (
                  <span key={a} className="r-chip inline-flex items-center gap-2 rounded-full bg-[var(--k-accent-soft)] text-[var(--k-accent)] pl-3 pr-1.5 py-1 text-sm font-medium" style={{ ['--d' as any]: `${d + 450 + m * 110}ms` }}>
                    {a}{nota[a] != null && <span className="cifra rounded-full bg-papel px-2 py-0.5 text-xs text-[var(--k-text)]">{nota[a]}</span>}
                  </span>
                ))}
              </div>
              {(despues || g.cuando) && (
                <p className="m-0 pt-3 border-t border-[var(--k-line)] text-sm text-[var(--k-muted)] flex items-start gap-2 leading-snug">
                  <Clock size={16} className="shrink-0 mt-0.5" />{despues ? `Más adelante. ${g.motivo ?? ''}` : g.cuando}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Número dentro de un círculo que se dibuja */
function Anillo({ n, retraso, apagado }: { n: number; retraso: number; apagado?: boolean }) {
  return (
    <span className="relative w-14 h-14 grid place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r="26" fill="none" stroke="var(--k-line)" strokeWidth="2" />
        <circle cx="28" cy="28" r="26" fill="none" stroke={apagado ? 'var(--k-muted)' : 'var(--k-accent)'} strokeWidth="2" strokeLinecap="round" className="r-trazo" pathLength={100} strokeDasharray="100" style={{ ['--d' as any]: `${retraso}ms` }} />
      </svg>
      <span className={`cifra text-xl ${apagado ? 'text-[var(--k-muted)]' : 'text-[var(--k-accent)]'}`}>{n}</span>
    </span>
  )
}

/* ---------- 3. Productos ---------- */

const ICONO_PASO = (paso: string) => {
  const p = paso.toLowerCase()
  if (p.includes('limpi')) return <HandSoap size={22} />
  if (p.includes('protector') || p.includes('solar')) return <Umbrella size={22} />
  if (p.includes('contorno') || p.includes('ojos')) return <Eye size={22} />
  if (p.includes('sérum') || p.includes('serum')) return <Drop size={22} />
  return <Flask size={22} />
}

function PasoProductos({ R, nivel, onNivel, ingredientes }: { R: any; nivel: Nivel; onNivel: (n: Nivel) => void; ingredientes: any[] }) {
  const rut = R.rutinas[nivel]
  const productos: any[] = (rut.productos ?? []).filter((p: any) => p.producto)
  const manana = productos.filter((p: any) => p.turno === 'AM' || p.turno === 'AMPM')
  const noche = productos.filter((p: any) => p.turno === 'PM' || p.turno === 'AMPM')
  const nombreActivo = (p: any) => (p.activo ? ingredientes.find((g: any) => raiz(g.nombre) === raiz(p.activo))?.nombre ?? p.activo.charAt(0).toUpperCase() + p.activo.slice(1) : null)
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="grid gap-3">
          <Titulo texto="Tu rutina, paso a paso" />
          <p className="texto m-0 r-sube" style={{ ['--d' as any]: '400ms' }}>Productos que tenemos aquí, en la farmacia.</p>
        </div>
        <div role="tablist" aria-label="Nivel de la rutina" className="md:ml-auto inline-flex rounded-[var(--radius-card)] border border-[var(--k-line)] bg-[var(--k-bg)] p-1 r-sube" style={{ ['--d' as any]: '300ms' }}>
          {(['basica', 'media', 'completa'] as const).map((n) => (
            <button key={n} role="tab" aria-selected={nivel === n} onClick={() => onNivel(n)}
              className={`h-11 px-4 rounded-lg text-sm ${nivel === n ? 'bg-[var(--k-accent)] text-sobre-marca' : 'text-[var(--k-muted)] hover:text-[var(--k-text)]'}`}>
              {R.rutinas[n].nombre} <span className="num">{eur(R.rutinas[n].total)}</span>
            </button>
          ))}
        </div>
      </div>
      {productos.length ? (
        <div className="grid md:grid-cols-2 gap-8">
          <Columna icono={<Sun size={20} />} titulo="Mañana" productos={manana} desde={0} nombreActivo={nombreActivo} />
          <Columna icono={<Moon size={20} />} titulo="Noche" productos={noche} desde={manana.length} nombreActivo={nombreActivo} />
        </div>
      ) : <p className="texto">Pide al farmacéutico que te enseñe los productos de tu rutina.</p>}
    </div>
  )
}

function Columna({ icono, titulo, productos, desde, nombreActivo }: { icono: React.ReactNode; titulo: string; productos: any[]; desde: number; nombreActivo: (p: any) => string | null }) {
  return (
    <div className="grid gap-3 content-start">
      <p className="m-0 flex items-center gap-2 font-medium text-[var(--k-accent)] r-sube" style={{ ['--d' as any]: `${500 + desde * 260}ms` }}>{icono} {titulo}</p>
      <ol className="grid gap-3 list-none p-0 m-0">
        {productos.map((p: any, n: number) => {
          const act = nombreActivo(p)
          return (
            <li key={`${p.paso}-${n}`} className="r-producto rounded-[var(--radius-card)] border border-[var(--k-line)] bg-[var(--k-bg)] px-4 py-3 grid grid-cols-[3rem_minmax(0,1fr)_auto] gap-x-4 gap-y-1 items-center" style={{ ['--d' as any]: `${650 + (desde + n) * 260}ms` }}>
              <span className="row-span-2 w-12 h-12 rounded-full bg-[var(--k-accent-soft)] text-[var(--k-accent)] grid place-items-center">{ICONO_PASO(p.paso)}</span>
              <span className="text-sm text-[var(--k-muted)] flex items-center gap-2 flex-wrap">
                {n + 1}. {p.paso}
                {act && <span className="rounded-full bg-[var(--k-accent)] text-sobre-marca px-2 py-0.5 text-xs font-medium">{act}</span>}
              </span>
              <span className="row-span-2 cifra text-lg whitespace-nowrap">{eur(p.precio)}</span>
              <span className="text-lg leading-snug"><span className="text-[var(--k-muted)]">{p.marca}</span> {p.producto}</span>
            </li>
          )
        })}
        {!productos.length && <li className="text-[var(--k-muted)]">Sin productos en este turno.</li>}
      </ol>
    </div>
  )
}

/* ---------- 4. Llévatela ---------- */

function PasoLlevar({ res, rut, foto, farmacia, nivel, emailActivo }: { res: any; rut: any; foto: string | null; farmacia: string; nivel: Nivel; emailActivo: boolean }) {
  const [qr, setQr] = useState('')
  const productos: any[] = (rut.productos ?? []).filter((p: any) => p.producto)
  const manana = productos.filter((p: any) => p.turno === 'AM' || p.turno === 'AMPM')
  const noche = productos.filter((p: any) => p.turno === 'PM' || p.turno === 'AMPM')
  async function generarQr() {
    const lineas = [`Mi rutina SkinRead (${farmacia})`, '']
    if (manana.length) lineas.push('Mañana:', ...manana.map((p: any) => `- ${p.marca} ${p.producto}`), '')
    if (noche.length) lineas.push('Noche:', ...noche.map((p: any) => `- ${p.marca} ${p.producto}`), '')
    lineas.push(`Total: ${eur(rut.total)}`, res.codigo ? `Código de revisión: ${res.codigo}. Vuelve en 4 semanas para comparar.` : 'Repite el análisis en 4 semanas para comparar.')
    setQr(await QRCode.toDataURL(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, { margin: 1, width: 400, errorCorrectionLevel: 'L', color: { dark: '#0f1b1d', light: '#ffffff' } }))
  }
  return (
    <div className="grid gap-8">
      <div className="grid gap-3 max-w-3xl">
        <Titulo texto="Llévate tu rutina" />
        <p className="texto m-0 r-sube" style={{ ['--d' as any]: '400ms' }}>Enseña esta pantalla en el mostrador para que te preparen los productos.</p>
      </div>
      {res.codigo && (
        <section className="r-sube rounded-[var(--radius-card)] border-2 border-[var(--k-accent)] p-6 grid md:grid-cols-[auto_1fr] gap-x-8 gap-y-2 items-center" style={{ ['--d' as any]: '600ms' }}>
          <p className="cifra text-[3rem] leading-none tracking-[0.12em] text-[var(--k-accent)] m-0">{res.codigo}</p>
          <div>
            <p className="text-xl font-medium m-0">Tu código de revisión</p>
            <p className="text-[var(--k-muted)] leading-relaxed m-0">Vuelve en unas 4 semanas y toca «Vengo a mi revisión». Haz una foto a esta pantalla: también va en WhatsApp y en el informe por email.</p>
          </div>
        </section>
      )}
      <section className={`grid gap-4 ${emailActivo ? 'md:grid-cols-2' : ''}`}>
        {emailActivo && <div className="r-sube" style={{ ['--d' as any]: '800ms' }}><InformeEmail consejo={res.id} foto={foto} nivel={nivel} /></div>}
        <div className="r-sube rounded-[var(--radius-card)] bg-[var(--k-accent-soft)] p-6 grid grid-cols-[1fr_auto] gap-6 items-center" style={{ ['--d' as any]: '950ms' }}>
          <div className="space-y-2">
            <p className="text-xl font-medium flex items-center gap-2 m-0"><CalendarCheck size={22} className="text-[var(--k-accent)]" /> Llévatela en el móvil</p>
            <p className="text-[var(--k-muted)] leading-relaxed m-0">Guarda la rutina en WhatsApp y repite el análisis en 4 semanas.</p>
          </div>
          {qr ? <img src={qr} alt="Código QR con tu rutina" className="w-36 h-36 rounded-[var(--radius-input)] border border-[var(--k-line)] r-chip" /> : <button onClick={generarQr} className="boton-sec">Ver código</button>}
        </div>
      </section>
      <p className="text-sm text-[var(--k-muted)] m-0">Análisis cosmético orientativo, no un diagnóstico médico. La simulación está generada con IA y no es una promesa de resultado.</p>
    </div>
  )
}

function InformeEmail({ consejo, foto, nivel }: { consejo: string; foto: string | null; nivel: string }) {
  const [email, setEmail] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok' | string>('')
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  async function enviar() {
    setEstado('enviando')
    const r = await enviarInformeEmail(consejo, email.trim(), foto, nivel)
    setEstado('error' in r ? (r.error ?? 'error') : 'ok')
  }
  return (
    <div className="h-full rounded-[var(--radius-card)] border border-[var(--k-line)] bg-[var(--k-bg)] p-6 space-y-3">
      <p className="text-xl font-medium flex items-center gap-2 m-0"><EnvelopeSimple size={22} className="text-[var(--k-accent)]" /> Informe completo por email</p>
      {estado === 'ok' ? <p className="text-[var(--k-muted)] leading-relaxed">Enviado a {email.trim()}. Revisa también la carpeta de spam.</p> : (
        <>
          <p className="text-[var(--k-muted)] leading-relaxed m-0">{foto ? 'Un PDF con tus fotos por zona, cada medida explicada, los ingredientes y la rutina paso a paso.' : 'Un PDF con los ingredientes y la rutina paso a paso.'}</p>
          <div className="flex gap-2">
            <input type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com"
              className="flex-1 min-w-0 h-12 px-4 rounded-[var(--radius-input)] border border-[var(--k-line)] bg-[var(--k-bg)] text-lg" />
            <button onClick={enviar} disabled={!valido || !acepta || estado === 'enviando'} className="boton !h-12">{estado === 'enviando' ? 'Enviando…' : 'Enviar'}</button>
          </div>
          <label className="flex items-start gap-2 text-sm text-[var(--k-muted)]">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[var(--k-accent)]" />
            {AVISO_EMAIL(!!foto)}
          </label>
          {estado && estado !== 'enviando' && <p className="text-sm text-[var(--k-warn)]">{estado}</p>}
        </>
      )}
    </div>
  )
}

/* ---------- Revisión: el antes y el ahora ---------- */

function Evolucion({ anterior: A, F, foto }: { anterior: any; F: any; foto: string | null }) {
  const filas = Object.keys(NOMBRE_RESULTADO).filter((a) => A.ui?.[a] != null && F.ui?.[a] != null)
    .map((a) => ({ a, antes: Math.round(A.ui[a]), ahora: Math.round(F.ui[a]) })).sort((x, y) => (y.ahora - y.antes) - (x.ahora - x.antes))
  const fecha = new Date(A.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })
  return (
    <section className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-12 items-start">
      <div className="max-w-md w-full mx-auto r-foto">
        {A.foto && foto ? <AntesDespues antes={A.foto} despues={foto} etiquetaAntes={fecha} etiquetaDespues="Hoy" />
          : foto ? <img src={foto} alt="Tu foto de hoy" className="w-full rounded-[var(--radius-card)] -scale-x-100" /> : null}
      </div>
      <div className="space-y-6">
        <Titulo texto="Tu evolución" retraso={150} />
        <p className="texto m-0 r-sube" style={{ ['--d' as any]: '400ms' }}>Desde el {fecha} · {A.dias} días</p>
        <ul className="grid gap-2 list-none p-0 m-0">
          {filas.map((f, n) => {
            const d = f.ahora - f.antes
            return (
              <li key={f.a} className="r-sube grid grid-cols-[8.5rem_5.5rem_3rem] items-baseline gap-3 py-1.5 border-b border-[var(--k-line)]" style={{ ['--d' as any]: `${550 + n * 70}ms` }}>
                <span className="text-lg">{NOMBRE_RESULTADO[f.a]}</span>
                <span className="cifra text-[var(--k-muted)]">{f.antes} → <span className="text-[var(--k-text)]"><Cifra valor={f.ahora} retraso={650 + n * 70} /></span></span>
                <span className={`cifra text-right font-medium ${d >= 3 ? 'text-[var(--k-accent)]' : 'text-[var(--k-muted)]'}`}>{d > 0 ? '+' : ''}{d}</span>
              </li>
            )
          })}
        </ul>
        <p className="text-sm text-[var(--k-muted)] m-0">Más alto, piel en mejor estado. Cambios de 1 o 2 puntos pueden deberse a la luz o a la postura.</p>
      </div>
    </section>
  )
}

/* ---------- Piezas ---------- */

export function AntesDespues({ antes, despues, etiquetaAntes = 'Hoy', etiquetaDespues = 'Con tu rutina (simulación IA)' }: { antes: string; despues: string; etiquetaAntes?: string; etiquetaDespues?: string }) {
  const [x, setX] = useState(50)
  const [tocado, setTocado] = useState(false)
  // Al aparecer, el deslizador se mueve solo una vez para que se vea que se puede arrastrar
  useEffect(() => {
    if (sinMovimiento()) return
    const pasos = [50, 78, 22, 50]
    const ini = performance.now() + 700, dur = 2200
    let id = 0
    const f = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - ini) / dur)) * (pasos.length - 1)
      const i = Math.min(pasos.length - 2, Math.floor(k)), u = k - i, e = u * u * (3 - 2 * u)
      setX(pasos[i] + (pasos[i + 1] - pasos[i]) * e)
      if (k < pasos.length - 1) id = requestAnimationFrame(f)
    }
    id = requestAnimationFrame(f)
    const parar = () => cancelAnimationFrame(id)
    window.addEventListener('pointerdown', parar, { once: true })
    return () => { parar(); window.removeEventListener('pointerdown', parar) }
  }, [])
  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)))
  }
  return (
    <figure className="space-y-3 m-0">
      <div className="relative w-full aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden bg-[var(--k-soft)] touch-none cursor-ew-resize"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setTocado(true); mover(e) }}
        onPointerMove={(e) => { if (e.buttons) mover(e) }}>
        {/* Las dos en espejo, como la ve la clienta en la cámara; si solo se gira una, no coinciden */}
        <img src={despues} alt={etiquetaDespues} className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <img src={antes} alt={etiquetaAntes} className="absolute inset-0 w-full h-full object-cover -scale-x-100" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} />
        <div className="absolute top-0 bottom-0 w-px bg-sobre-marca" style={{ left: `${x}%` }}>
          <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-papel text-[var(--k-text)] grid place-items-center shadow-pomo"><ArrowsLeftRight size={20} /></span>
        </div>
      </div>
      <figcaption className="flex justify-between text-sm text-[var(--k-muted)]"><span>{etiquetaAntes}</span><span className={`transition-opacity ${tocado ? 'opacity-0' : ''}`}>Desliza para comparar</span><span>{etiquetaDespues}</span></figcaption>
    </figure>
  )
}

export function Esquinas() {
  const c = 'absolute w-8 h-8 border-[var(--k-accent)] pointer-events-none'
  return (
    <>
      <span className={`${c} top-4 left-4 border-t-2 border-l-2 rounded-tl-lg`} />
      <span className={`${c} top-4 right-4 border-t-2 border-r-2 rounded-tr-lg`} />
      <span className={`${c} bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg`} />
      <span className={`${c} bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg`} />
    </>
  )
}

function EstilosRecorrido() {
  return (
    <style>{`
      .r-paso { animation: r-paso 560ms cubic-bezier(.16,1,.3,1) both; }
      @keyframes r-paso { from { opacity: 0; transform: translateX(calc(var(--dir, 1) * 56px)); } }
      .r-palabra { animation: r-palabra 760ms cubic-bezier(.16,1,.3,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-palabra { from { transform: translateY(105%); } }
      .r-sube { animation: r-sube 720ms cubic-bezier(.16,1,.3,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-sube { from { opacity: 0; transform: translateY(22px); filter: blur(6px); } }
      .r-carta { animation: r-carta 900ms cubic-bezier(.34,1.32,.64,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-carta { 0% { opacity: 0; transform: translateY(70px) scale(.9) rotate(-1.2deg); filter: blur(10px); } 55% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: none; } }
      .r-producto { animation: r-producto 700ms cubic-bezier(.34,1.4,.64,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-producto { from { opacity: 0; transform: translateX(-40px) scale(.96); } }
      .r-chip { animation: r-chip 520ms cubic-bezier(.34,1.56,.64,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-chip { from { opacity: 0; transform: scale(.6); } }
      .r-barra { animation: r-barra 1000ms cubic-bezier(.16,1,.3,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-barra { from { transform: scaleX(0); } }
      .r-trazo { animation: r-trazo 900ms cubic-bezier(.65,0,.35,1) both; animation-delay: var(--d, 0ms); }
      @keyframes r-trazo { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
      .r-foto { animation: r-foto 900ms cubic-bezier(.16,1,.3,1) both; }
      @keyframes r-foto { from { opacity: 0; transform: scale(.94); clip-path: inset(8% 8% 8% 8% round 18px); } to { clip-path: inset(0 0 0 0 round 0); } }
      .r-escaneo { position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--k-accent); box-shadow: 0 0 18px 4px var(--color-face-ready); opacity: 0; animation: r-escaneo 1.9s cubic-bezier(.45,0,.55,1) 350ms both; }
      @keyframes r-escaneo { 0% { top: 4%; opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { top: 96%; opacity: 0 } }
      .r-etiqueta { animation: r-chip 480ms cubic-bezier(.34,1.56,.64,1) both; transform-origin: left center; }
      .r-llenar { animation: r-barra 700ms cubic-bezier(.16,1,.3,1) both; }
      .r-latir { animation: r-latir 2.4s ease-in-out 3.5s 3; }
      @keyframes r-latir { 0%,100% { box-shadow: 0 0 0 0 rgba(11,110,91,0) } 50% { box-shadow: 0 0 0 8px rgba(11,110,91,.16) } }
      @media (prefers-reduced-motion: reduce) {
        .r-paso, .r-palabra, .r-sube, .r-carta, .r-producto, .r-chip, .r-barra, .r-trazo, .r-foto, .r-escaneo, .r-etiqueta, .r-llenar, .r-latir { animation: none; }
        .r-escaneo { display: none; }
      }
    `}</style>
  )
}
