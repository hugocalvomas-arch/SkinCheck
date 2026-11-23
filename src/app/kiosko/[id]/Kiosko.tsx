'use client'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { MallaFacial, type EstadoCara } from './MallaFacial'
import { aTrabajar, nivelPiel, notaPiel } from '@/lib/escalaPiel'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import { ArrowLeft, ArrowRight, ArrowsLeftRight, CalendarCheck, Camera, Check, Drop, EnvelopeSimple, Moon, ScanSmiley, ShieldCheck, Sparkle, Sun, Trash, X } from '@phosphor-icons/react'
import { analizarKiosko, enviarInformeEmail, type Seguridad } from './actions'
import { Logo } from '@/components/Logo'

// Recorrido de la clienta en el iPad del mostrador. Dirección visual: clínica, fondo claro,
// un único acento verde farmacia, Geist + números tabulares, iconos Phosphor.
// reclamo → 4 preguntas de seguridad → consentimiento → foto → análisis → informe → vuelta al reclamo

type Paso = 'reclamo' | 'preguntas' | 'consentimiento' | 'camara' | 'mejorar' | 'analizando' | 'resultado' | 'menor'
type Props = { farmaciaId: string; farmacia: string; precio: string }

const PREGUNTAS: { id: keyof Seguridad; t: string; nota: string; ops: [string, string][]; si?: (s: Partial<Seguridad>) => boolean }[] = [
  { id: 'edad', t: '¿Qué edad tienes?', nota: 'Algunos ingredientes dependen de la edad.', ops: [['-14', 'Menos de 14'], ['14-17', '14 a 17'], ['18-24', '18 a 24'], ['25-39', '25 a 39'], ['40-49', '40 a 49'], ['50+', '50 o más']] },
  { id: 'sexo', t: '¿Eres mujer u hombre?', nota: 'El análisis de la foto no lo distingue, y cambia algunos productos (por ejemplo, el afeitado).', ops: [['mujer', 'Mujer'], ['hombre', 'Hombre'], ['nd', 'Prefiero no decirlo']] },
  { id: 'embarazo', si: (s) => s.sexo !== 'hombre' && s.edad !== '50+', t: '¿Estás embarazada o en periodo de lactancia?', nota: 'Hay ingredientes que no se recomiendan en el embarazo ni en la lactancia.', ops: [['si', 'Sí'], ['no', 'No, o no aplica']] },
  { id: 'receta', t: '¿Sigues algún tratamiento para la piel indicado por un médico?', nota: 'Si es así, no añadiremos activos que interfieran con él.', ops: [['no', 'No'], ['si', 'Sí']] },
  { id: 'reactiva', t: '¿Tu piel reacciona cuando pruebas un producto nuevo?', nota: 'Picor, rojez o escozor. Así sabemos si empezar por lo más suave.', ops: [['nunca', 'Casi nunca'], ['a_veces', 'A veces'], ['siempre', 'Casi siempre']] },
]

const MEJORAR: [string, string][] = [
  ['acne', 'Granitos'], ['poros', 'Poros'], ['brillo', 'Brillo'], ['manchas', 'Manchas'], ['tono', 'Tono apagado'], ['arrugas', 'Arrugas'],
  ['firmeza', 'Firmeza'], ['textura', 'Textura'], ['rojez', 'Rojeces'], ['hidratacion', 'Sequedad'], ['ojeras', 'Ojeras'],
]
const NOMBRE: Record<string, string> = Object.fromEntries(MEJORAR)
// En el resultado, los mismos nombres que la web y el vídeo
const NOMBRE_RESULTADO: Record<string, string> = { ...NOMBRE, tono: 'Luminosidad', hidratacion: 'Hidratación' }
const PASOS_ANALISIS = ['Detectar el rostro', 'Medir poros, textura y brillo', 'Medir manchas, rojeces y ojeras', 'Medir arrugas y firmeza', 'Elegir ingredientes', 'Preparar tu rutina', 'Generar la simulación']
// "Vitamina C pura" y "vitamina C estable" cuentan como el mismo ingrediente al buscarlo en la rutina
const raiz = (t: string) => t.toLowerCase().replace(/\s+(pura|estable)$/, '')
const lista = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] ?? '')
const eur = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }))
const INACTIVIDAD_MS = 150_000

export function Kiosko({ farmaciaId, farmacia, precio }: Props) {
  const [paso, setPaso] = useState<Paso>('reclamo')
  const [i, setI] = useState(0)
  const [seg, setSeg] = useState<Partial<Seguridad>>({})
  const [foto, setFoto] = useState<string | null>(null)
  const [res, setRes] = useState<any>(null)
  const [error, setError] = useState('')
  const [, start] = useTransition()

  const reiniciar = useCallback(() => {
    setPaso('reclamo'); setI(0); setSeg({}); setFoto(null); setRes(null); setError('')
  }, [])

  // Privacidad: sin interacción, vuelve al inicio y descarta todo
  useEffect(() => {
    if (paso === 'reclamo' || paso === 'analizando') return
    let t = setTimeout(reiniciar, INACTIVIDAD_MS)
    const tocar = () => { clearTimeout(t); t = setTimeout(reiniciar, INACTIVIDAD_MS) }
    window.addEventListener('pointerdown', tocar)
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', tocar) }
  }, [paso, reiniciar])

  // Siguiente pregunta que aplica (el embarazo no se pregunta a hombres ni a partir de 50 años)
  const siguiente = (desde: number, s: Partial<Seguridad>) => { let k = desde; while (k < PREGUNTAS.length && PREGUNTAS[k].si && !PREGUNTAS[k].si!(s)) k++; return k }
  const anterior = (desde: number, s: Partial<Seguridad>) => { let k = desde; while (k >= 0 && PREGUNTAS[k].si && !PREGUNTAS[k].si!(s)) k--; return k }

  function responder(id: keyof Seguridad, v: string) {
    const s = { ...seg, [id]: v }
    if (PREGUNTAS[i + 1]?.si && !PREGUNTAS[i + 1].si!(s)) (s as Partial<Seguridad>).embarazo = 'no'
    setSeg(s)
    if (id === 'edad' && v === '-14') return setPaso('menor')
    const k = siguiente(i + 1, s)
    if (k < PREGUNTAS.length) setI(k)
    else setPaso('consentimiento')
  }

  function analizar(fotoB64: string | null, mejorar: string[] = []) {
    setError('')
    setPaso('analizando')
    start(async () => {
      const r = await analizarKiosko(farmaciaId, seg as Seguridad, fotoB64, mejorar)
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
      <main key={paso + i} className="flex-1 flex entrar">
        {paso === 'reclamo' && <Reclamo precio={precio} onEmpezar={() => setPaso('preguntas')} />}
        {paso === 'preguntas' && <Pregunta q={PREGUNTAS[i]} n={i} valor={seg[PREGUNTAS[i].id]} onResp={(v) => responder(PREGUNTAS[i].id, v)} onAtras={() => { const k = anterior(i - 1, seg); return k >= 0 ? setI(k) : setPaso('reclamo') }} />}
        {paso === 'menor' && (
          <Bloque>
            <h2 className="titulo">Para menores de 14 años, mejor en persona</h2>
            <p className="texto">Pide consejo en el mostrador. Te atenderán junto a un adulto.</p>
            <button onClick={reiniciar} className="boton">Volver al inicio</button>
          </Bloque>
        )}
        {paso === 'consentimiento' && <Consentimiento onFoto={() => setPaso('camara')} onSinFoto={() => setPaso('mejorar')} />}
        {paso === 'camara' && <Camara error={error} onFoto={(b64, url) => { setFoto(url); analizar(b64) }} />}
        {paso === 'mejorar' && <Mejorar error={error} onListo={(m) => analizar(null, m)} />}
        {paso === 'analizando' && <Analizando foto={foto} />}
        {paso === 'resultado' && res && <Informe res={res} foto={foto} farmacia={farmacia} onFin={reiniciar} />}
      </main>
    </div>
  )
}

/* ---------- Pantallas ---------- */

function Reclamo({ precio, onEmpezar }: { precio: string; onEmpezar: () => void }) {
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

function Consentimiento({ onFoto, onSinFoto }: { onFoto: () => void; onSinFoto: () => void }) {
  return (
    <Bloque>
      <h2 className="titulo max-w-2xl">Antes de la foto</h2>
      <ul className="w-full max-w-2xl grid list-none p-0 m-0 border-t border-[var(--k-text)]">
        <Punto icono={<ShieldCheck size={22} />} texto="La farmacia no guarda tu foto ni tu nombre." />
        <Punto icono={<Trash size={22} />} texto="El servicio de análisis la elimina tras un periodo limitado." />
        <Punto icono={<ScanSmiley size={22} />} texto="Es un análisis cosmético orientativo, no un diagnóstico médico." />
      </ul>
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

function Camara({ error, onFoto }: { error: string; onFoto: (b64: string, dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [cuenta, setCuenta] = useState<number | null>(null)
  const [fallo, setFallo] = useState('')
  const [cara, setCara] = useState<EstadoCara>('buscando')
  const hecha = useRef(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let vivo = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => { if (!vivo) return s.getTracks().forEach((t) => t.stop()); stream = s; if (video.current) video.current.srcObject = s })
      .catch(() => setFallo('No se ha podido abrir la cámara. Pide ayuda en el mostrador.'))
    return () => { vivo = false; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  useEffect(() => {
    if (cuenta == null) return
    if (cuenta === 0) {
      const v = video.current
      if (!v || !v.videoWidth || hecha.current) return
      hecha.current = true
      // recorte vertical 3:4 centrado: la cara debe ocupar más del 60 % del ancho
      const alto = v.videoHeight
      const ancho = Math.min(v.videoWidth, Math.round((alto * 3) / 4))
      const x = Math.round((v.videoWidth - ancho) / 2)
      const escala = Math.min(1, 1280 / alto)
      const c = document.createElement('canvas')
      c.width = Math.round(ancho * escala)
      c.height = Math.round(alto * escala)
      c.getContext('2d')!.drawImage(v, x, 0, ancho, alto, 0, 0, c.width, c.height)
      const url = c.toDataURL('image/jpeg', 0.9)
      onFoto(url.split(',')[1], url)
      return
    }
    const t = setTimeout(() => setCuenta(cuenta - 1), 1000)
    return () => clearTimeout(t)
  }, [cuenta, onFoto])

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-8 grid md:grid-cols-[minmax(0,1fr)_320px] gap-10 items-center">
      <div className="relative h-[min(72dvh,680px)] aspect-[3/4] max-w-full mx-auto rounded-[var(--radius-card)] overflow-hidden bg-camara">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <div className="absolute inset-0 pointer-events-none velo-ovalo" />
        <div className={`absolute left-[15%] right-[15%] top-[10%] bottom-[13%] rounded-[50%] border-2 pointer-events-none transition-colors duration-300 ${cara === 'lista' ? 'border-cara-lista' : 'border-sobre-marca/70'}`} />
        <MallaFacial video={video} onEstado={setCara} />
        {cuenta == null && (
          <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-cristal px-4 py-2 text-sobre-marca text-sm font-medium whitespace-nowrap">
            {{ buscando: 'Buscando tu cara', lejos: 'Acércate un poco', descentrada: 'Céntrate en el óvalo', lista: 'Perfecto, no te muevas' }[cara]}
          </p>
        )}
        {cuenta != null && cuenta > 0 && <div className="absolute inset-0 grid place-items-center text-sobre-marca text-9xl cifra">{cuenta}</div>}
      </div>
      <div className="space-y-6">
        <h2 className="text-[2.25rem] leading-[1.05]">Coloca tu cara dentro del óvalo</h2>
        <ul className="space-y-3 text-lg text-[var(--k-muted)]">
          {['Acércate hasta llenarlo', 'Mira de frente, sin sonreír', 'Sin gafas y con la frente despejada', 'Mejor sin maquillaje'].map((t) => (
            <li key={t} className="flex gap-3"><Check size={22} className="text-[var(--k-accent)] shrink-0 mt-0.5" />{t}</li>
          ))}
        </ul>
        {(error || fallo) && <p role="alert" className="rounded-[var(--radius-input)] bg-[var(--k-warn-soft)] text-[var(--k-warn)] p-4">{fallo || error}</p>}
        {!fallo && (
          <button onClick={() => setCuenta(3)} disabled={cuenta != null} className="boton w-full">
            <Camera size={20} /> {error ? 'Repetir la foto' : 'Hacer la foto'}
          </button>
        )}
      </div>
    </div>
  )
}

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

export function Informe({ res, foto, farmacia, onFin }: { res: any; foto: string | null; farmacia: string; onFin: () => void }) {
  // Resumen para leer en menos de un minuto en el iPad. El detalle completo va en el PDF que se envía por email.
  const R = res.rutinas
  const F = res.foto
  const [nivel, setNivel] = useState<'basica' | 'media' | 'completa'>('media')
  const [qr, setQr] = useState('')
  if (R?.sin_rutina) return <Bloque><h2 className="titulo max-w-2xl">{R.sin_rutina}</h2><button onClick={onFin} className="boton">Terminar</button></Bloque>

  const rut = R.rutinas[nivel]
  const objetivos: any[] = res.lectura?.objetivos ?? []
  const productos = (rut.productos ?? []).filter((p: any) => p.producto)
  const conProducto = (g: any) => productos.find((p: any) => p.activo && raiz(p.activo) === raiz(g.nombre))
  // Los 3 ingredientes clave: primero los que ya van en la rutina de este nivel
  const clave: any[] = [...(res.lectura?.ingredientes ?? [])].sort((a, b) => Number(!!conProducto(b)) - Number(!!conProducto(a))).slice(0, 3)
  const marcas: string | undefined = F?.imagenes?.marcas?.find((u: string) => u !== F.imagenes.despues)
  const manana = productos.filter((p: any) => p.turno === 'AM' || p.turno === 'AMPM')
  const noche = productos.filter((p: any) => p.turno === 'PM' || p.turno === 'AMPM')

  async function generarQr() {
    const lineas = [`Mi rutina SkinCheck (${farmacia})`, '']
    if (manana.length) lineas.push('Mañana:', ...manana.map((p: any) => `- ${p.marca} ${p.producto}`), '')
    if (noche.length) lineas.push('Noche:', ...noche.map((p: any) => `- ${p.marca} ${p.producto}`), '')
    lineas.push(`Total: ${eur(rut.total)}`, 'Repite el análisis en 6 semanas para comparar.')
    setQr(await QRCode.toDataURL(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, { margin: 1, width: 400, errorCorrectionLevel: 'L', color: { dark: '#0f1b1d', light: '#ffffff' } }))
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-12">
      {/* 1. El resultado de un vistazo */}
      <section className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-12 items-center">
        <div className="max-w-md w-full mx-auto">
          {foto && F?.imagenes?.despues ? <AntesDespues antes={foto} despues={F.imagenes.despues} />
            : marcas ? <img src={marcas} alt="Zonas analizadas" className="w-full rounded-[var(--radius-card)] border border-[var(--k-line)]" />
            : foto ? <img src={foto} alt="Tu foto" className="w-full rounded-[var(--radius-card)] -scale-x-100" /> : null}
        </div>
        <div className="space-y-8">
          <p className="text-[var(--k-muted)]">Tu resultado</p>
          {F?.puntuacion_global != null ? (
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4 -mt-4">
              <p className="m-0 leading-none"><span className="cifra text-[clamp(5rem,10vw,7.5rem)] tracking-[-0.05em]">{Math.round(F.puntuacion_global)}</span><span className="text-2xl text-[var(--k-muted)]">/100</span></p>
              {F.edad_piel != null && <p className="m-0 pb-3"><span className="block text-sm text-[var(--k-muted)]">Edad de tu piel</span><span className="cifra text-3xl">{Math.round(F.edad_piel)}</span> <span className="text-[var(--k-muted)]">años</span></p>}
            </div>
          ) : <h2 className="titulo">Tu rutina</h2>}
          {objetivos.length > 0 && (
            <div className="space-y-3">
              <p className="text-xl font-medium">Lo primero que conviene trabajar</p>
              <ul className="grid gap-2.5 list-none p-0 m-0">
                {objetivos.map((o: any, k: number) => (
                  <li key={o.aspecto} className="grid grid-cols-[1.5rem_8.5rem_1fr_2.5rem] items-center gap-3">
                    <span className="cifra text-[var(--k-accent)]">{k + 1}</span>
                    <span className="text-lg">{o.nombre}</span>
                    {o.nota != null ? <span className="escala"><i /><b data-alto={aTrabajar(o.nota) ? '' : undefined} style={{ width: `${Math.max(4, o.nota)}%` }} /></span> : <span />}
                    <span className="cifra text-lg text-right">{o.nota ?? ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 2. Ingredientes clave, por qué y con qué producto */}
      {clave.length > 0 && (
        <section className="space-y-5">
          <h3 className="text-[2rem] leading-[1.05] tracking-[-0.03em]">Tus ingredientes clave</h3>
          <ol className="grid md:grid-cols-3 gap-4 list-none p-0 m-0">
            {clave.map((g: any) => {
              const pr = conProducto(g)
              return (
                <li key={g.nombre} className="rounded-[var(--radius-card)] border border-[var(--k-line)] bg-[var(--k-bg)] p-5 grid grid-rows-[auto_auto_1fr_auto] gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-[var(--k-muted)]">{g.turno === 'PM' ? <Moon size={16} /> : <Sun size={16} />}{g.turno === 'PM' ? 'Noche' : 'Mañana'}</span>
                  <span className="text-2xl font-medium tracking-[-0.02em]">{g.nombre}</span>
                  <span className="text-[var(--k-muted)] leading-snug"><span className="text-[var(--k-accent)] font-medium">Para {lista(g.para.map((n: string) => n.toLowerCase()))}.</span> {g.frase ?? g.por_que}</span>
                  <span className="mt-2 pt-3 border-t border-[var(--k-line)] flex items-baseline justify-between gap-3">
                    {pr ? <><span className="leading-snug"><span className="block text-sm text-[var(--k-muted)]">{pr.marca}</span>{pr.producto}</span><span className="cifra text-lg whitespace-nowrap">{eur(pr.precio)}</span></>
                      : <span className="text-sm text-[var(--k-muted)]">{g.ahora ? 'Pide en el mostrador un producto con este ingrediente.' : g.motivo ?? 'Entra más adelante.'}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* 3. La rutina completa, compacta */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="text-[2rem] leading-[1.05] tracking-[-0.03em]">Tu rutina</h3>
          <div role="tablist" aria-label="Nivel de la rutina" className="md:ml-auto inline-flex rounded-[var(--radius-card)] border border-[var(--k-line)] bg-[var(--k-bg)] p-1">
            {(['basica', 'media', 'completa'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={nivel === k} onClick={() => { setNivel(k); setQr('') }}
                className={`h-11 px-4 rounded-lg text-sm ${nivel === k ? 'bg-[var(--k-accent)] text-sobre-marca' : 'text-[var(--k-muted)] hover:text-[var(--k-text)]'}`}>
                {R.rutinas[k].nombre} <span className="num">{eur(R.rutinas[k].total)}</span>
              </button>
            ))}
          </div>
        </div>
        {productos.length ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Turno icono={<Sun size={20} />} titulo="Mañana" productos={manana} />
            <Turno icono={<Moon size={20} />} titulo="Noche" productos={noche} />
          </div>
        ) : <p className="texto">Pide al farmacéutico que te enseñe los productos de tu rutina.</p>}
      </section>

      {/* 4. Llevársela: informe completo por email y rutina en el móvil */}
      <section className="grid md:grid-cols-2 gap-4">
        <InformeEmail consejo={res.id} foto={foto} nivel={nivel} />
        <div className="rounded-[var(--radius-card)] bg-[var(--k-accent-soft)] p-6 grid grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-2">
            <p className="text-xl font-medium flex items-center gap-2"><CalendarCheck size={22} className="text-[var(--k-accent)]" /> Llévatela en el móvil</p>
            <p className="text-[var(--k-muted)] leading-relaxed">Guarda la rutina en WhatsApp y repite el análisis en 6 semanas. Enseña esta pantalla en el mostrador para que te preparen los productos.</p>
          </div>
          {qr ? <img src={qr} alt="Código QR con tu rutina" className="w-36 h-36 rounded-[var(--radius-input)] border border-[var(--k-line)]" /> : <button onClick={generarQr} className="boton-sec">Ver código</button>}
        </div>
      </section>

      <div className="flex justify-center pb-2">
        <button onClick={onFin} className="boton-sec"><Trash size={20} /> Terminar y borrar mis datos</button>
      </div>
      <p className="text-sm text-[var(--k-muted)] text-center pb-6">Análisis cosmético orientativo, no un diagnóstico médico. La simulación está generada con IA y no es una promesa de resultado.</p>
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
    <div className="rounded-[var(--radius-card)] border border-[var(--k-line)] bg-[var(--k-bg)] p-6 space-y-3">
      <p className="text-xl font-medium flex items-center gap-2"><EnvelopeSimple size={22} className="text-[var(--k-accent)]" /> Informe completo por email</p>
      {estado === 'ok' ? <p className="text-[var(--k-muted)] leading-relaxed">Enviado a {email.trim()}. Revisa también la carpeta de spam.</p> : (
        <>
          <p className="text-[var(--k-muted)] leading-relaxed">Un PDF con tus fotos por zona, cada medida explicada, los ingredientes y la rutina paso a paso.</p>
          <div className="flex gap-2">
            <input type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com"
              className="flex-1 min-w-0 h-12 px-4 rounded-[var(--radius-input)] border border-[var(--k-line)] bg-[var(--k-bg)] text-lg" />
            <button onClick={enviar} disabled={!valido || !acepta || estado === 'enviando'} className="boton !h-12">{estado === 'enviando' ? 'Enviando…' : 'Enviar'}</button>
          </div>
          <label className="flex items-start gap-2 text-sm text-[var(--k-muted)]">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[var(--k-accent)]" />
            Acepto recibir mi informe en este email. Solo se usa para enviarlo: no se guarda.
          </label>
          {estado && estado !== 'enviando' && <p className="text-sm text-[var(--k-warn)]">{estado}</p>}
        </>
      )}
    </div>
  )
}

/* ---------- Piezas ---------- */

function Turno({ icono, titulo, productos }: { icono: React.ReactNode; titulo: string; productos: any[] }) {
  return (
    <div className="border-t border-[var(--k-text)] pt-5 space-y-4">
      <p className="flex items-center gap-2 font-medium text-[var(--k-accent)]">{icono} {titulo}</p>
      <ol className="space-y-4">
        {productos.map((p: any, k: number) => (
          <li key={k} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 pb-4 border-b border-[var(--k-line)]">
            <span className="text-sm text-[var(--k-muted)]">{k + 1}. {p.paso}</span>
            <span className="row-span-2 self-center cifra text-lg">{eur(p.precio)}</span>
            <span className="text-lg leading-snug">{p.marca} {p.producto}</span>
          </li>
        ))}
        {!productos.length && <li className="text-[var(--k-muted)]">Sin productos en este turno.</li>}
      </ol>
    </div>
  )
}

function Dato({ etiqueta, valor, unidad }: { etiqueta: string; valor: string; unidad: string }) {
  return (
    <div className="py-5 pr-5 [&+&]:pl-5 [&+&]:border-l border-[var(--k-line)]">
      <dt className="text-sm text-[var(--k-muted)]">{etiqueta}</dt>
      <dd className="mt-2 m-0"><span className="cifra text-[3rem] leading-none">{valor}</span> <span className="text-[var(--k-muted)]">{unidad}</span></dd>
    </div>
  )
}

function AntesDespues({ antes, despues }: { antes: string; despues: string }) {
  const [x, setX] = useState(50)
  const [tocado, setTocado] = useState(false)
  // Al aparecer, el deslizador se mueve solo una vez para que se vea que se puede arrastrar
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
    <figure className="space-y-3">
      <div className="relative w-full aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden bg-[var(--k-soft)] touch-none cursor-ew-resize"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setTocado(true); mover(e) }}
        onPointerMove={(e) => { if (e.buttons) mover(e) }}>
        {/* Las dos en espejo, como la ve la clienta en la cámara; si solo se gira una, no coinciden */}
        <img src={despues} alt="Simulación con la rutina" className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <img src={antes} alt="Hoy" className="absolute inset-0 w-full h-full object-cover -scale-x-100" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} />
        <div className="absolute top-0 bottom-0 w-px bg-sobre-marca" style={{ left: `${x}%` }}>
          <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-papel text-[var(--k-text)] grid place-items-center shadow-pomo"><ArrowsLeftRight size={20} /></span>
        </div>
      </div>
      <figcaption className="flex justify-between text-sm text-[var(--k-muted)]"><span>Hoy</span><span className={`transition-opacity ${tocado ? 'opacity-0' : ''}`}>Desliza para comparar</span><span>Con tu rutina (simulación IA)</span></figcaption>
    </figure>
  )
}

function Esquinas() {
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
      @keyframes latido { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
      .entrar { animation: entrar 220ms cubic-bezier(.23,1,.32,1) both; }
      @keyframes entrar { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      @media (prefers-reduced-motion: reduce) { .linea-escaneo, .latido, .entrar { animation: none } }
    `}</style>
  )
}
