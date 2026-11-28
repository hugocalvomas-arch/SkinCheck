'use client'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { MallaFacial, type EstadoCara } from './MallaFacial'
import { AVISO, brilloYNitidez } from '@/lib/calidadFoto'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck, Camera, Check, Drop, ScanSmiley, ShieldCheck, Sparkle, Trash, X } from '@phosphor-icons/react'
import { Esquinas, Informe } from './Resultados'
import { analizarKiosko, borrarSeguimiento, buscarSeguimiento, type Seguridad } from './actions'
import { Logo } from '@/components/Logo'
import { AVISO_DETALLE, AVISO_FOTO, AVISO_GUARDAR_FOTO, AVISO_INICIO } from '@/lib/privacidad'

// Recorrido de la clienta en el iPad del mostrador. Dirección visual: clínica, fondo claro,
// un único acento verde farmacia, Geist + números tabulares, iconos Phosphor.
// Revisión: reclamo → código → (mismo recorrido) → informe con el antes y el ahora
// reclamo → aviso de privacidad y permiso expreso → 4 preguntas de seguridad → consentimiento de la foto → foto → análisis → informe → vuelta al reclamo

type Paso = 'reclamo' | 'codigo' | 'aviso' | 'no_acepta' | 'preguntas' | 'consentimiento' | 'camara' | 'mejorar' | 'analizando' | 'resultado' | 'menor'
type Props = { farmaciaId: string; farmacia: string; precio: string; emailActivo: boolean }
type Revision = { id: string; fecha: string; dias: number; conFoto: boolean }

const PREGUNTAS: { id: keyof Seguridad; t: string; nota: string; ops: [string, string][]; si?: (s: Partial<Seguridad>) => boolean }[] = [
  { id: 'edad', t: '¿Qué edad tienes?', nota: 'Algunos ingredientes dependen de la edad.', ops: [['-14', 'Menos de 14'], ['14-17', '14 a 17'], ['18-24', '18 a 24'], ['25-34', '25 a 34'], ['35-44', '35 a 44'], ['45-54', '45 a 54'], ['55-64', '55 a 64'], ['65+', '65 o más']] },
  { id: 'sexo', t: '¿Eres mujer u hombre?', nota: 'El análisis de la foto no lo distingue, y cambia algunos productos (por ejemplo, el afeitado).', ops: [['mujer', 'Mujer'], ['hombre', 'Hombre'], ['nd', 'Prefiero no decirlo']] },
  { id: 'embarazo', si: (s) => s.sexo !== 'hombre' && !['55+', '55-64', '65+'].includes(s.edad ?? ''), t: '¿Estás embarazada o dando el pecho?', nota: 'Hay ingredientes que no se recomiendan en el embarazo, y otros que conviene evitar mientras das el pecho.', ops: [['embarazo', 'Estoy embarazada'], ['lactancia', 'Estoy dando el pecho'], ['no', 'No, o no aplica']] },
  { id: 'receta', t: '¿Sigues algún tratamiento para la piel indicado por un médico?', nota: 'Si es así, no añadiremos activos que interfieran con él.', ops: [['no', 'No'], ['si', 'Sí']] },
  { id: 'reactiva', t: '¿Tu piel reacciona cuando pruebas un producto nuevo?', nota: 'Picor, rojez o escozor. Así sabemos si empezar por lo más suave.', ops: [['nunca', 'Casi nunca'], ['a_veces', 'A veces'], ['siempre', 'Casi siempre']] },
  // Hugo, 24/11: quien empieza con un retinoide va a la concentración baja; quien ya lo tolera sigue con la suya
  { id: 'retinoide', si: (s) => s.edad !== '14-17' && s.embarazo !== 'embarazo' && s.embarazo !== 'lactancia' && s.receta !== 'si', t: '¿Usas ya retinol o retinal?', nota: 'De esto depende la concentración con la que empiezas y cuántas noches a la semana.', ops: [['nunca', 'No, nunca'], ['reciente', 'Sí, desde hace menos de 3 meses'], ['tolera', 'Sí, y lo tolero bien']] },
  // Hito 1 (Hugo, 27/11): tratamiento en consulta (cuál y cuándo) y fototipo declarado
  { id: 'procedimiento', t: '¿Te has hecho algún tratamiento en consulta en las últimas 2 semanas?', nota: 'Después de un peeling, un láser o microagujas, la piel necesita una rutina distinta durante un tiempo.', ops: [['no', 'No'], ['peeling', 'Un peeling'], ['laser', 'Láser o luz pulsada'], ['microagujas', 'Microagujas o radiofrecuencia con agujas'], ['limpieza', 'Una limpieza facial'], ['otro', 'Otro, o no sé cuál']] },
  { id: 'procedimiento_cuando', si: (s) => !!s.procedimiento && s.procedimiento !== 'no', t: '¿Cuándo te lo hiciste?', nota: 'Lo que puedes usar después depende del tiempo que ha pasado y de lo que te indicaron.', ops: [['semana', 'Hace menos de una semana'], ['dos_semanas', 'Hace una o dos semanas']] },
  { id: 'fototipo', t: 'El primer día de sol fuerte, sin protección, tu piel…', nota: 'Así sé cuánto te conviene un protector solar con color. El protector 50+ va siempre.', ops: [['I', 'Se quema siempre y nunca se broncea'], ['II', 'Se quema con facilidad y coge poco color'], ['III', 'A veces se quema y se broncea poco a poco'], ['IV', 'Casi nunca se quema y se broncea bien'], ['V', 'Se pone muy morena y rara vez se quema'], ['VI', 'No se quema nunca'], ['nd', 'No lo sé']] },
]

const MEJORAR: [string, string][] = [
  ['acne', 'Granitos'], ['poros', 'Poros'], ['brillo', 'Brillo'], ['manchas', 'Manchas'], ['tono', 'Tono apagado'], ['arrugas', 'Arrugas'],
  ['firmeza', 'Firmeza'], ['textura', 'Textura'], ['rojez', 'Rojeces'], ['hidratacion', 'Sequedad'], ['ojeras', 'Ojeras'],
]
const PASOS_ANALISIS = ['Detectar el rostro', 'Medir poros, textura y brillo', 'Medir manchas, rojeces y ojeras', 'Medir arrugas y firmeza', 'Elegir ingredientes', 'Preparar tu rutina', 'Generar la simulación']
const INACTIVIDAD_MS = 150_000

export function Kiosko({ farmaciaId, farmacia, precio, emailActivo }: Props) {
  const [paso, setPaso] = useState<Paso>('reclamo')
  const [i, setI] = useState(0)
  const [seg, setSeg] = useState<Partial<Seguridad>>({})
  const [foto, setFoto] = useState<string | null>(null)
  const [res, setRes] = useState<any>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState<Revision | null>(null)
  const [guardarFoto, setGuardarFoto] = useState(false)
  // Hugo, 24/11: las preguntas van justo después de la foto. Antes solo se pregunta la edad (menores de 14, sin foto).
  const [pend, setPend] = useState<{ b64: string | null; m: string[] } | null>(null)
  const [listas, setListas] = useState(false)
  const [, start] = useTransition()

  const reiniciar = useCallback(() => {
    setPaso('reclamo'); setI(0); setSeg({}); setFoto(null); setRes(null); setError(''); setRevision(null); setGuardarFoto(false); setPend(null); setListas(false)
  }, [])

  // Privacidad: sin interacción, vuelve al inicio y descarta todo
  useEffect(() => {
    if (paso === 'reclamo' || paso === 'analizando') return
    let t = setTimeout(reiniciar, INACTIVIDAD_MS)
    const tocar = () => { clearTimeout(t); t = setTimeout(reiniciar, INACTIVIDAD_MS) }
    window.addEventListener('pointerdown', tocar)
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', tocar) }
  }, [paso, reiniciar])

  // Siguiente pregunta que aplica (el embarazo no se pregunta a hombres ni a partir de 55 años)
  const siguiente = (desde: number, s: Partial<Seguridad>) => { let k = desde; while (k < PREGUNTAS.length && PREGUNTAS[k].si && !PREGUNTAS[k].si!(s)) k++; return k }
  const anterior = (desde: number, s: Partial<Seguridad>) => { let k = desde; while (k >= 0 && PREGUNTAS[k].si && !PREGUNTAS[k].si!(s)) k--; return k }

  function responder(id: keyof Seguridad, v: string) {
    const s = { ...seg, [id]: v }
    if (PREGUNTAS[i + 1]?.id === 'embarazo' && !PREGUNTAS[i + 1].si!(s)) (s as Partial<Seguridad>).embarazo = 'no'
    setSeg(s)
    if (id === 'edad') return setPaso(v === '-14' ? 'menor' : 'consentimiento')
    const k = siguiente(i + 1, s)
    if (k < PREGUNTAS.length) return setI(k)
    setListas(true)
    analizar(pend?.b64 ?? null, pend?.m ?? [], s)
  }

  // Con la foto hecha (o los objetivos elegidos), las preguntas; si ya estaban contestadas (repetir foto tras un error), directo al análisis
  function trasCaptura(b64: string | null, m: string[]) {
    if (listas) return analizar(b64, m)
    setPend({ b64, m })
    setI(siguiente(1, seg))
    setPaso('preguntas')
  }

  function analizar(fotoB64: string | null, mejorar: string[] = [], s: Partial<Seguridad> = seg) {
    setError('')
    setPaso('analizando')
    start(async () => {
      const r = await analizarKiosko(farmaciaId, s as Seguridad, fotoB64, mejorar, true, { guardarFoto, seguimientoDe: revision?.id })
      if ('error' in r) { setError(r.error ?? 'No se ha podido completar el análisis.'); setPaso(fotoB64 ? 'camara' : 'mejorar'); return }
      setRes(r)
      setPaso('resultado')
    })
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Estilos />
      <header className="h-16 shrink-0 flex items-center gap-3 px-6 md:px-10 border-b border-[var(--k-line)] bg-papel">
        <Logo />
        <span className="text-[var(--k-muted)] pl-3 border-l border-[var(--k-line)]">{farmacia}</span>
        {paso !== 'reclamo' && paso !== 'analizando' && (
          <button onClick={reiniciar} className="ml-auto inline-flex items-center gap-2 text-sm text-[var(--k-muted)] h-11 px-3 rounded-xl hover:bg-[var(--k-soft)]">
            <X size={18} /> Salir
          </button>
        )}
      </header>
      <main key={paso + i} className={`flex-1 flex ${paso === 'resultado' ? '' : 'entrar'}`}>
        {paso === 'reclamo' && <Reclamo precio={precio} onEmpezar={() => setPaso('aviso')} onRevision={() => setPaso('codigo')} />}
        {paso === 'codigo' && <Codigo farmaciaId={farmaciaId} onSeguir={(r) => { setRevision(r); setPaso('aviso') }} onFin={reiniciar} />}
        {paso === 'aviso' && <Aviso farmacia={farmacia} onAcepta={() => setPaso('preguntas')} onRechaza={() => setPaso('no_acepta')} />}
        {paso === 'no_acepta' && (
          <Bloque>
            <h2 className="titulo">Sin problema</h2>
            <p className="texto">Pide consejo en el mostrador y te atenderán en persona.</p>
            <button onClick={reiniciar} className="boton">Volver al inicio</button>
          </Bloque>
        )}
        {paso === 'preguntas' && <Pregunta q={PREGUNTAS[i]} n={i} valor={seg[PREGUNTAS[i].id]} onResp={(v) => responder(PREGUNTAS[i].id, v)} onAtras={() => { if (i === 0) return setPaso('aviso'); const k = anterior(i - 1, seg); return k >= 1 ? setI(k) : setPaso(pend?.b64 ? 'camara' : 'mejorar') }} />}
        {paso === 'menor' && (
          <Bloque>
            <h2 className="titulo">Para menores de 14 años, mejor en persona</h2>
            <p className="texto">Pide consejo en el mostrador. Te atenderán junto a un adulto.</p>
            <button onClick={reiniciar} className="boton">Volver al inicio</button>
          </Bloque>
        )}
        {paso === 'consentimiento' && <Consentimiento revision={!!revision} guardar={guardarFoto} onGuardar={setGuardarFoto} onFoto={() => setPaso('camara')} onSinFoto={() => setPaso('mejorar')} />}
        {paso === 'camara' && <Camara error={error} onFoto={(b64, url) => { setFoto(url); trasCaptura(b64, []) }} />}
        {paso === 'mejorar' && <Mejorar error={error} onListo={(m) => trasCaptura(null, m)} />}
        {paso === 'analizando' && <Analizando foto={foto} />}
        {paso === 'resultado' && res && <Informe res={res} foto={foto} farmacia={farmacia} emailActivo={emailActivo} onFin={reiniciar} />}
      </main>
    </div>
  )
}

/* ---------- Pantallas ---------- */

function Reclamo({ precio, onEmpezar, onRevision }: { precio: string; onEmpezar: () => void; onRevision: () => void }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 grid gap-10 content-center">
      <div className="grid md:grid-cols-[1fr_minmax(0,420px)] gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.02] max-w-[12ch]">Descubre qué necesita tu piel</h1>
          <p className="texto max-w-[34ch]">Una foto y dos minutos para saber qué le pasa a tu piel y qué le sienta bien.</p>
          <div className="flex flex-wrap items-center gap-5 pt-2">
            <button onClick={onEmpezar} className="boton">Empezar análisis <ArrowRight size={20} weight="bold" /></button>
            <span className="text-lg"><span className="cifra text-2xl font-medium">{precio}</span> <span className="text-[var(--k-muted)]">en el mostrador</span></span>
          </div>
          <button onClick={onRevision} className="inline-flex items-center gap-2 text-lg text-[var(--k-accent)] underline underline-offset-4"><CalendarCheck size={22} /> Vengo a mi revisión</button>
        </div>
        <Espejo />
      </div>
      <ul className="grid sm:grid-cols-3 gap-x-8 gap-y-6 border-t border-[var(--k-text)] pt-6 list-none p-0 m-0">
        <Ventaja icono={<ScanSmiley size={24} />} titulo="Mira tu piel de cerca" texto="La IA ve lo que el espejo no te enseña: poros, manchas, rojeces y arrugas." />
        <Ventaja icono={<Sparkle size={24} />} titulo="Descubre tu mejor versión" texto="Una simulación de cómo podría verse tu piel con los cuidados adecuados." />
        <Ventaja icono={<Drop size={24} />} titulo="Acierta a la primera" texto="Te decimos qué usar por la mañana y por la noche. Sin probar a ciegas." />
      </ul>
    </div>
  )
}

// Vista previa en vivo de la cámara frontal: la clienta se ve en el iPad. No se graba ni se envía.
function Espejo() {
  const video = useRef<HTMLVideoElement>(null)
  const [ok, setOk] = useState(true)
  useEffect(() => {
    let stream: MediaStream | null = null
    let vivo = true
    Promise.resolve()
      .then(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }))
      .then((s) => { if (!vivo) return s.getTracks().forEach((t) => t.stop()); stream = s; if (video.current) video.current.srcObject = s })
      .catch(() => setOk(false))
    return () => { vivo = false; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])
  return (
    <figure className="space-y-3">
      <div className="relative aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden bg-[var(--k-soft)] border border-[var(--k-line)]">
        {ok ? <><video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" /><MallaFacial video={video} /></> : (
          <div className="absolute inset-0 grid place-items-center text-[var(--k-muted)]"><ScanSmiley size={96} weight="thin" /></div>
        )}
        <Esquinas />
      </div>
      <figcaption className="text-sm text-[var(--k-muted)] flex items-center gap-2"><ShieldCheck size={16} /> Vista previa. No se graba nada hasta que tú lo aceptes.</figcaption>
    </figure>
  )
}

function Ventaja({ icono, titulo, texto }: { icono: React.ReactNode; titulo: string; texto: string }) {
  return (
    <li className="grid gap-2 content-start">
      <span className="flex items-center gap-2 text-lg font-medium"><span className="text-[var(--k-accent)]" aria-hidden>{icono}</span>{titulo}</span>
      <span className="block text-[var(--k-muted)]">{texto}</span>
    </li>
  )
}

function Pregunta({ q, n, valor, onResp, onAtras }: { q: (typeof PREGUNTAS)[number]; n: number; valor?: string; onResp: (v: string) => void; onAtras: () => void }) {
  return (
    <Bloque>
      <div className="w-full max-w-2xl flex items-center gap-4 text-sm text-[var(--k-muted)]">
        <span className="num">{n + 1} de {PREGUNTAS.length}</span>
        <span className="flex-1 h-1 rounded-full bg-[var(--k-line)] overflow-hidden"><span className="block h-full bg-[var(--k-accent)] transition-[width] duration-200" style={{ width: `${((n + 1) / PREGUNTAS.length) * 100}%` }} /></span>
      </div>
      <h2 className="titulo max-w-2xl">{q.t}</h2>
      <p className="texto max-w-2xl">{q.nota}</p>
      <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-3 gap-3">
        {q.ops.map(([v, t]) => (
          <button key={v} onClick={() => onResp(v)} className={`opcion ${valor === v ? 'opcion-sel' : ''}`}>{t}</button>
        ))}
      </div>
      <button onClick={onAtras} className="inline-flex items-center gap-2 h-11 px-3 rounded-xl text-[var(--k-muted)] hover:bg-[var(--k-soft)]"><ArrowLeft size={18} /> Atrás</button>
    </Bloque>
  )
}

function Aviso({ farmacia, onAcepta, onRechaza }: { farmacia: string; onAcepta: () => void; onRechaza: () => void }) {
  const [mas, setMas] = useState(false)
  return (
    <Bloque>
      <h2 className="titulo max-w-2xl">Antes de empezar</h2>
      <ul className="w-full max-w-2xl grid list-none p-0 m-0 border-t border-[var(--k-text)]">
        {AVISO_INICIO(farmacia).map((t) => <Punto key={t} icono={<ShieldCheck size={22} />} texto={t} />)}
      </ul>
      {mas ? (
        <ul className="w-full max-w-2xl grid gap-3 list-none p-0 m-0 text-[var(--k-muted)] leading-relaxed">
          {AVISO_DETALLE.map((t) => <li key={t}>{t}</li>)}
        </ul>
      ) : (
        <button onClick={() => setMas(true)} className="text-[var(--k-accent)] underline underline-offset-4">Más información sobre tus datos</button>
      )}
      <div className="w-full max-w-2xl flex flex-wrap gap-3">
        <button onClick={onAcepta} className="boton"><Check size={20} /> Acepto y empiezo</button>
        <button onClick={onRechaza} className="boton-sec">No, gracias</button>
      </div>
    </Bloque>
  )
}

function Codigo({ farmaciaId, onSeguir, onFin }: { farmaciaId: string; onSeguir: (r: Revision) => void; onFin: () => void }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [hallado, setHallado] = useState<Revision | null>(null)
  const [borrado, setBorrado] = useState(false)
  const [ocupado, start] = useTransition()
  const buscar = () => start(async () => {
    setError('')
    const r = await buscarSeguimiento(farmaciaId, codigo)
    if ('error' in r) setError(r.error ?? 'No encontramos ese código.')
    else setHallado(r)
  })
  const borrar = () => start(async () => {
    if (!hallado) return
    const r = await borrarSeguimiento(farmaciaId, hallado.id)
    if ('error' in r) setError(r.error ?? 'No se ha podido borrar.')
    else setBorrado(true)
  })
  if (borrado)
    return (
      <Bloque>
        <h2 className="titulo">Datos borrados</h2>
        <p className="texto">Hemos borrado tus respuestas, tus medidas y tu foto guardada, y hemos anulado tu código.</p>
        <button onClick={onFin} className="boton">Volver al inicio</button>
      </Bloque>
    )
  if (hallado) {
    const fecha = new Date(hallado.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })
    return (
      <Bloque>
        <h2 className="titulo">Tu primer análisis fue el {fecha}</h2>
        <p className="texto">{hallado.dias === 0 ? 'Fue hoy. ' : hallado.dias === 1 ? 'Fue ayer. ' : `Hace ${hallado.dias} días. `}{hallado.dias < 21 ? 'Para ver cambios, lo ideal es esperar unas 4 semanas, pero puedes repetirlo ya. ' : ''}{hallado.conFoto ? 'Tenemos tu foto guardada para enseñarte el antes y el después.' : 'Compararemos tus medidas. No guardamos foto del primer día.'}</p>
        <p className="texto">Para que la comparación sea justa, colócate en el mismo sitio y sin maquillaje.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onSeguir(hallado)} className="boton">Empezar la revisión <ArrowRight size={20} weight="bold" /></button>
          <button onClick={borrar} disabled={ocupado} className="boton-sec"><Trash size={20} /> Borrar mis datos guardados</button>
        </div>
      </Bloque>
    )
  }
  return (
    <Bloque>
      <h2 className="titulo">Escribe tu código de revisión</h2>
      <p className="texto">Lo tienes en la pantalla de tu primer análisis, en WhatsApp o en el informe por email. Tiene 6 caracteres.</p>
      <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 7))} placeholder="K7P-4QX" autoComplete="off" autoCapitalize="characters" spellCheck={false}
        className="h-20 px-6 rounded-[var(--radius-input)] border border-[var(--k-line)] bg-[var(--k-bg)] text-[2.5rem] tracking-[0.2em] cifra text-center uppercase" />
      {error && <p className="text-[var(--k-warn)]">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button onClick={buscar} disabled={ocupado || codigo.replace(/[^A-Za-z0-9]/g, '').length !== 6} className="boton">{ocupado ? 'Buscando…' : 'Continuar'}</button>
        <button onClick={onFin} className="boton-sec">Volver</button>
      </div>
    </Bloque>
  )
}

function Consentimiento({ revision, guardar, onGuardar, onFoto, onSinFoto }: { revision: boolean; guardar: boolean; onGuardar: (v: boolean) => void; onFoto: () => void; onSinFoto: () => void }) {
  return (
    <Bloque>
      <h2 className="titulo max-w-2xl">Antes de la foto</h2>
      <ul className="w-full max-w-2xl grid list-none p-0 m-0 border-t border-[var(--k-text)]">
        <Punto icono={<ShieldCheck size={22} />} texto={AVISO_FOTO[0]} />
        <Punto icono={<Trash size={22} />} texto={AVISO_FOTO[1]} />
        <Punto icono={<ScanSmiley size={22} />} texto={AVISO_FOTO[2]} />
      </ul>
      {revision ? (
        <p className="texto">Para compararla con tu primer análisis necesitamos una foto nueva.</p>
      ) : (
        <label className="w-full max-w-2xl flex items-start gap-3 text-lg leading-snug rounded-[var(--radius-card)] border border-[var(--k-line)] p-4">
          <input type="checkbox" checked={guardar} onChange={(e) => onGuardar(e.target.checked)} className="mt-1 w-6 h-6 shrink-0 accent-[var(--k-accent)]" />
          <span>{AVISO_GUARDAR_FOTO}</span>
        </label>
      )}
      <div className="w-full max-w-2xl flex flex-wrap gap-3">
        <button onClick={onFoto} className="boton"><Camera size={20} /> Acepto, hacer la foto</button>
        <button onClick={onSinFoto} className="boton-sec">Continuar sin foto</button>
      </div>
    </Bloque>
  )
}

function Punto({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return <li className="flex items-center gap-4 py-5 border-b border-[var(--k-line)] text-xl"><span className="text-[var(--k-accent)]">{icono}</span>{texto}</li>
}

// Foto automática: cuando la cara está bien colocada, cuenta atrás de 3 s vigilando que siga bien;
// al llegar a 0 espera a un fotograma correcto, comprueba la luz y la nitidez de la foto y solo entonces la envía.
export function Camara({ error, onFoto }: { error: string; onFoto: (b64: string, dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [fase, setFase] = useState<'colocando' | 'cuenta' | 'revisando' | 'hecha'>('colocando')
  const [cuenta, setCuenta] = useState(3)
  const [fallo, setFallo] = useState('')
  const [aviso, setAviso] = useState('')
  const [cara, setCara] = useState<EstadoCara>('buscando')
  const [hecha, setHecha] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const caraRef = useRef<EstadoCara>('buscando')
  const intentos = useRef(0)
  const enviada = useRef(false)
  const alEstado = useCallback((e: EstadoCara) => { caraRef.current = e; setCara(e) }, [])

  useEffect(() => {
    let stream: MediaStream | null = null
    let vivo = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => { if (!vivo) return s.getTracks().forEach((t) => t.stop()); stream = s; if (video.current) video.current.srcObject = s })
      .catch(() => setFallo('No se ha podido abrir la cámara. Pide ayuda en el mostrador.'))
    return () => { vivo = false; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  // Si en 25 s no ha salido, el botón de siempre aparece como plan B
  useEffect(() => { const t = setTimeout(() => setManual(true), 25000); return () => clearTimeout(t) }, [])

  // 1. Bien colocada durante 0,7 s: empieza la cuenta atrás
  useEffect(() => {
    if (fase !== 'colocando' || cara !== 'lista') return
    const t = setTimeout(() => { setAviso(''); setCuenta(3); setFase('cuenta') }, 700)
    return () => clearTimeout(t)
  }, [fase, cara])

  // 2. Durante la cuenta, si deja de estar bien más de medio segundo, se para y vuelve a esperar
  useEffect(() => {
    if (fase !== 'cuenta' || cara === 'lista') return
    const t = setTimeout(() => { setAviso('Te has movido. Vuelve a colocarte y empezamos otra vez.'); setFase('colocando') }, 500)
    return () => clearTimeout(t)
  }, [fase, cara])

  const capturar = useCallback(() => {
    const v = video.current
    if (!v || !v.videoWidth) return null
    // recorte vertical 3:4 centrado: la cara debe ocupar más del 60 % del ancho
    const alto = v.videoHeight
    const ancho = Math.min(v.videoWidth, Math.round((alto * 3) / 4))
    const x = Math.round((v.videoWidth - ancho) / 2)
    const escala = Math.min(1, 1280 / alto)
    const c = document.createElement('canvas')
    c.width = Math.round(ancho * escala)
    c.height = Math.round(alto * escala)
    c.getContext('2d')!.drawImage(v, x, 0, ancho, alto, 0, 0, c.width, c.height)
    return c
  }, [])

  const enviar = useCallback((c: HTMLCanvasElement) => {
    if (enviada.current) return
    enviada.current = true
    const url = c.toDataURL('image/jpeg', 0.9)
    setHecha(url)
    setFase('hecha')
    setTimeout(() => onFoto(url.split(',')[1], url), 1100)
  }, [onFoto])

  // 3. Cuenta atrás
  useEffect(() => {
    if (fase !== 'cuenta') return
    const t = setTimeout(() => { setCuenta(cuenta - 1); if (cuenta <= 1) setFase('revisando') }, 1000)
    return () => clearTimeout(t)
  }, [fase, cuenta])

  // 4. Disparo y revisión de la foto
  useEffect(() => {
    if (fase !== 'revisando') return
    let raf = 0
    const limite = performance.now() + 2500
    const intentar = () => {
      // Espera a un fotograma en el que todo esté bien (p. ej., que no esté parpadeando)
      if (caraRef.current !== 'lista') {
        if (performance.now() > limite) { setAviso('No ha salido bien. Colócate otra vez y la repetimos.'); setFase('colocando'); return }
        raf = requestAnimationFrame(intentar); return
      }
      const c = capturar()
      if (!c) { setFase('colocando'); return }
      // Revisión de la foto ya hecha: luz y nitidez del centro de la cara
      const m = document.createElement('canvas')
      m.width = 200; m.height = 200
      const mc = m.getContext('2d', { willReadFrequently: true })!
      mc.drawImage(c, c.width * 0.25, c.height * 0.25, c.width * 0.5, c.height * 0.5, 0, 0, 200, 200)
      const { brillo, nitidez } = brilloYNitidez(mc.getImageData(0, 0, 200, 200).data, 200, 200)
      intentos.current++
      const ultima = intentos.current >= 3 // a la tercera se envía la mejor que haya, para no dejarla esperando
      if (!ultima && brillo < 60) { setAviso('La foto ha salido oscura. Busca más luz de frente y la repetimos.'); setFase('colocando'); return }
      if (!ultima && nitidez < NITIDEZ_MIN) { setAviso('La foto ha salido movida. No te muevas un momento y la repetimos.'); setFase('colocando'); return }
      enviar(c)
    }
    raf = requestAnimationFrame(intentar)
    return () => cancelAnimationFrame(raf)
  }, [fase, capturar, enviar])

  const texto = fase === 'hecha' ? 'Foto correcta' : fase === 'revisando' ? 'Comprobando la foto' : AVISO[cara]

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-8 grid md:grid-cols-[minmax(0,1fr)_320px] gap-10 items-center">
      <div className="relative h-[min(72dvh,680px)] aspect-[3/4] max-w-full mx-auto rounded-[var(--radius-card)] overflow-hidden bg-camara">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <div className="absolute inset-0 pointer-events-none velo-ovalo" />
        <div className={`absolute left-[15%] right-[15%] top-[10%] bottom-[13%] rounded-[50%] border-2 pointer-events-none transition-colors duration-300 ${cara === 'lista' || fase === 'hecha' ? 'border-cara-lista' : 'border-sobre-marca/70'}`} />
        <MallaFacial video={video} onEstado={alEstado} />
        <p aria-live="polite" className={`absolute top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${fase === 'hecha' ? 'bg-[var(--k-accent)] text-sobre-marca' : 'bg-cristal text-sobre-marca'}`}>
          {fase === 'hecha' && <Check size={16} weight="bold" />}{texto}
        </p>
        {fase === 'cuenta' && cuenta > 0 && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div key={cuenta} className="cuenta-atras relative w-40 h-40 grid place-items-center text-sobre-marca text-8xl cifra">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" pathLength={100} className="cuenta-arco" />
              </svg>
              {cuenta}
            </div>
          </div>
        )}
        {fase === 'revisando' && <span className="absolute inset-0 bg-papel/70 destello pointer-events-none" aria-hidden />}
        {hecha && <img src={hecha} alt="Tu foto" className="absolute inset-0 w-full h-full object-cover -scale-x-100" />}
      </div>
      <div className="space-y-6">
        <h2 className="text-[2.25rem] leading-[1.05]">Coloca tu cara dentro del óvalo</h2>
        <p className="texto m-0">La foto se hace sola cuando estés en posición. No hace falta tocar nada.</p>
        <ul className="space-y-3 text-lg text-[var(--k-muted)]">
          {['Cara lavada, sin maquillaje ni crema', 'Luz de frente, sin una ventana detrás', 'Acércate hasta llenar el óvalo', 'Cabeza recta, mirando a la cámara', 'Cara relajada, sin sonreír ni fruncir', 'Sin gafas y con la frente despejada'].map((t) => (
            <li key={t} className="flex gap-3"><Check size={22} className="text-[var(--k-accent)] shrink-0 mt-0.5" />{t}</li>
          ))}
        </ul>
        {(aviso || error || fallo) && <p role="alert" className="rounded-[var(--radius-input)] bg-[var(--k-warn-soft)] text-[var(--k-warn)] p-4">{fallo || aviso || error}</p>}
        {!fallo && (manual || cara === 'sin_detector') && fase === 'colocando' && (
          <button onClick={() => { const c = capturar(); if (c) enviar(c) }} className="boton-sec w-full">
            <Camera size={20} /> Hacer la foto ahora
          </button>
        )}
      </div>
    </div>
  )
}

const NITIDEZ_MIN = 12

function Mejorar({ error, onListo }: { error: string; onListo: (m: string[]) => void }) {
  const [sel, setSel] = useState<string[]>([])
  const alternar = (v: string) => setSel(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])
  return (
    <Bloque>
      <h2 className="titulo max-w-2xl">¿Qué te gustaría mejorar?</h2>
      <p className="texto max-w-2xl">Marca todo lo que quieras.</p>
      <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-3 gap-3">
        {MEJORAR.map(([v, t]) => <button key={v} onClick={() => alternar(v)} className={`opcion ${sel.includes(v) ? 'opcion-sel' : ''}`}>{t}</button>)}
      </div>
      {error && <p role="alert" className="w-full max-w-2xl rounded-[var(--radius-input)] bg-[var(--k-warn-soft)] text-[var(--k-warn)] p-4">{error}</p>}
      <div className="w-full max-w-2xl"><button onClick={() => onListo(sel)} disabled={!sel.length} className="boton">Ver mi rutina <ArrowRight size={20} weight="bold" /></button></div>
    </Bloque>
  )
}

export function Analizando({ foto }: { foto: string | null }) {
  const [hechos, setHechos] = useState(0)
  useEffect(() => { const t = setInterval(() => setHechos((x) => Math.min(x + 1, PASOS_ANALISIS.length - 1)), 4500); return () => clearInterval(t) }, [])
  return (
    <div className="w-full max-w-5xl mx-auto px-6 md:px-10 py-10 grid md:grid-cols-[360px_1fr] gap-12 items-center">
      <div className="relative aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden bg-[var(--k-soft)] border border-[var(--k-line)]">
        {foto && <img src={foto} alt="" className="absolute inset-0 w-full h-full object-cover -scale-x-100" />}
        <div className="linea-escaneo" />
        <Esquinas />
      </div>
      <div className="space-y-6">
        <h2 className="text-[2.25rem] leading-[1.05]">Analizando tu piel</h2>
        <ol className="space-y-3 text-lg">
          {PASOS_ANALISIS.map((t, k) => (
            <li key={t} className={`flex items-center gap-3 transition-colors duration-200 ${k < hechos ? 'text-[var(--k-text)]' : k === hechos ? 'text-[var(--k-accent)]' : 'text-[var(--k-muted)]/60'}`}>
              <span className={`w-6 h-6 rounded-full grid place-items-center border ${k < hechos ? 'bg-[var(--k-accent)] border-[var(--k-accent)] text-sobre-marca' : k === hechos ? 'border-[var(--k-accent)]' : 'border-[var(--k-line)]'}`}>
                {k < hechos ? <Check size={14} weight="bold" /> : k === hechos ? <span className="w-2 h-2 rounded-full bg-[var(--k-accent)] latido" /> : null}
              </span>
              {t}
            </li>
          ))}
        </ol>
        <p className="text-[var(--k-muted)]">Tarda hasta un minuto.</p>
      </div>
    </div>
  )
}

function Bloque({ children }: { children: React.ReactNode }) {
  return <div className="w-full px-6 md:px-10 py-12 flex flex-col items-center justify-center gap-6 [&>*]:w-full [&>*]:max-w-2xl">{children}</div>
}

export function Estilos() {
  return (
    <style>{`
      .kiosko {
        --k-bg:var(--color-paper); --k-soft:var(--color-paper-2); --k-line:var(--color-rule); --k-text:var(--color-ink); --k-muted:var(--color-muted);
        --k-accent:var(--color-accent); --k-accent-mid:var(--color-accent-mid); --k-accent-soft:var(--color-accent-soft); --k-warn:var(--color-warn); --k-warn-soft:var(--color-warn-soft);
      }
      .num { font-variant-numeric: tabular-nums; }
      .titulo { font-size: clamp(2.25rem, 4vw, 3.25rem); font-weight: 600; letter-spacing: -0.035em; line-height: 1.04; text-wrap: balance; }
      .texto { font-size: 1.25rem; line-height: 1.55; color: var(--k-muted); }
      .boton, .boton-sec { display:inline-flex; align-items:center; justify-content:center; gap:.6rem; height:3.5rem; padding:0 1.75rem; border-radius:var(--radius-input); border:1px solid var(--k-accent); font-size:1.125rem; font-weight:500; white-space:nowrap; transition: background-color 140ms cubic-bezier(.23,1,.32,1), transform 80ms ease-out; }
      .boton { background: var(--k-accent); color: var(--color-accent-ink); }
      .boton:hover { background: var(--color-accent-deep); border-color: var(--color-accent-deep); }
      .boton-sec { background: var(--k-bg); color: var(--k-text); border-color: var(--color-field); }
      .boton-sec:hover { background: var(--k-soft); }
      .boton:active, .boton-sec:active, .opcion:active { transform: scale(.97); }
      .boton:disabled { background: var(--k-soft); border-color: var(--k-line); color: var(--k-muted); cursor: not-allowed; }
      .boton:focus-visible, .boton-sec:focus-visible, .opcion:focus-visible, .kiosko button:focus-visible { outline: 2px solid var(--k-accent); outline-offset: 2px; }
      .opcion { min-height: 4.5rem; padding: 1rem; border-radius: var(--radius-input); background: var(--k-bg); text-align: left; border: 1px solid var(--k-line); font-size: 1.15rem; transition: background-color 140ms ease-out, border-color 140ms ease-out, transform 80ms ease-out; }
      .opcion:hover { border-color: var(--k-accent-mid); }
      .opcion-sel { background: var(--k-accent-soft); border-color: var(--k-accent); color: var(--k-accent); font-weight: 500; }
      .velo-ovalo { background: radial-gradient(ellipse 35% 38.5% at 50% 48.5%, transparent 99%, var(--color-veil) 100%); }
      .linea-escaneo { position:absolute; left:0; right:0; height:2px; background: var(--k-accent); box-shadow: 0 0 0 1px var(--color-on-accent-muted); animation: escaneo 2.8s cubic-bezier(.45,0,.55,1) infinite; }
      @keyframes escaneo { 0%,100% { top: 10% } 50% { top: 88% } }
      .latido { animation: latido 1.2s ease-in-out infinite; }
      .cuenta-atras { animation: cuenta 1s cubic-bezier(.16,1,.3,1) both; }
      .cuenta-arco { stroke-dasharray: 100; animation: arco 1s linear both; }
      .destello { animation: destello 500ms ease-out both; }
      @keyframes cuenta { from { opacity: 0; transform: scale(.85) } 20% { opacity: 1; transform: none } to { opacity: 1 } }
      @keyframes arco { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
      @keyframes destello { from { opacity: 1 } to { opacity: 0 } }
      @media (prefers-reduced-motion: reduce) { .cuenta-atras, .cuenta-arco, .destello { animation: none } }
      @keyframes latido { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
      .entrar { animation: entrar 220ms cubic-bezier(.23,1,.32,1) both; }
      @keyframes entrar { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      @media (prefers-reduced-motion: reduce) { .linea-escaneo, .latido, .entrar { animation: none } }
    `}</style>
  )
}
