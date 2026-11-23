'use client'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import { analizarKiosko, type Seguridad } from './actions'

// Recorrido de la clienta en el iPad del mostrador:
// reclamo → 4 preguntas de seguridad → consentimiento → foto → análisis → resultado → vuelta al reclamo.

type Paso = 'reclamo' | 'preguntas' | 'consentimiento' | 'camara' | 'mejorar' | 'analizando' | 'resultado' | 'menor'
type Props = { farmaciaId: string; farmacia: string; precio: string }

const PREGUNTAS: { id: keyof Seguridad; t: string; nota: string; ops: [string, string][] }[] = [
  { id: 'edad', t: '¿Qué edad tienes?', nota: 'Hay ingredientes que dependen de la edad.', ops: [['-14', 'Menos de 14'], ['14-17', '14 a 17'], ['18-24', '18 a 24'], ['25-39', '25 a 39'], ['40-49', '40 a 49'], ['50+', '50 o más']] },
  { id: 'embarazo', t: '¿Estás embarazada o dando el pecho?', nota: 'En el embarazo y la lactancia hay ingredientes que no se usan.', ops: [['si', 'Sí'], ['no', 'No / no aplica']] },
  { id: 'receta', t: '¿Usas algún tratamiento para la piel que te haya mandado un médico?', nota: 'Si es así, no pondremos activos encima de tu tratamiento.', ops: [['no', 'No'], ['si', 'Sí']] },
  { id: 'reactiva', t: 'Cuando pruebas un producto nuevo, ¿tu piel reacciona?', nota: 'Picor, rojez o escozor. Así sabemos si empezar por lo más suave.', ops: [['nunca', 'Casi nunca'], ['a_veces', 'A veces'], ['siempre', 'Casi siempre']] },
]

const MEJORAR: [string, string][] = [
  ['acne', 'Granitos'], ['poros', 'Poros'], ['brillo', 'Brillo'], ['manchas', 'Manchas'], ['tono', 'Tono apagado'], ['arrugas', 'Arrugas'],
  ['firmeza', 'Firmeza'], ['textura', 'Textura'], ['rojez', 'Rojeces'], ['hidratacion', 'Sequedad'], ['ojeras', 'Ojeras'],
]
const NOMBRE: Record<string, string> = Object.fromEntries(MEJORAR)
const MENSAJES = ['Localizando tu rostro…', 'Midiendo poros y textura…', 'Buscando manchas y rojeces…', 'Analizando arrugas y firmeza…', 'Eligiendo ingredientes para ti…', 'Buscando productos en esta farmacia…', 'Preparando tu simulación…']
const TURNO: Record<string, string> = { AM: 'Mañana', PM: 'Noche', AMPM: 'Mañana y noche' }
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

  // Privacidad: si nadie toca la pantalla, vuelve al inicio y borra todo
  useEffect(() => {
    if (paso === 'reclamo' || paso === 'analizando') return
    let t = setTimeout(reiniciar, INACTIVIDAD_MS)
    const tocar = () => { clearTimeout(t); t = setTimeout(reiniciar, INACTIVIDAD_MS) }
    window.addEventListener('pointerdown', tocar)
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', tocar) }
  }, [paso, reiniciar])

  function responder(id: keyof Seguridad, v: string) {
    const s = { ...seg, [id]: v }
    setSeg(s)
    if (id === 'edad' && v === '-14') return setPaso('menor')
    if (i < PREGUNTAS.length - 1) setI(i + 1)
    else setPaso('consentimiento')
  }

  function analizar(fotoB64: string | null, mejorar: string[] = []) {
    setError('')
    setPaso('analizando')
    start(async () => {
      const r = await analizarKiosko(farmaciaId, seg as Seguridad, fotoB64, mejorar)
      if ('error' in r) { setError(r.error ?? 'Error'); setPaso(fotoB64 ? 'camara' : 'mejorar'); return }
      setRes(r)
      setPaso('resultado')
    })
  }

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <Estilos />
      <Fondo />
      {paso !== 'reclamo' && paso !== 'analizando' && (
        <button onClick={reiniciar} className="absolute top-5 right-6 z-20 text-sm text-[#f5efe6]/60 hover:text-[#f5efe6]">✕ Salir</button>
      )}
      <div key={paso + i} className="relative z-10 aparecer">
        {paso === 'reclamo' && <Reclamo farmacia={farmacia} precio={precio} onEmpezar={() => setPaso('preguntas')} />}
        {paso === 'preguntas' && <Pregunta q={PREGUNTAS[i]} n={i} valor={seg[PREGUNTAS[i].id]} onResp={(v) => responder(PREGUNTAS[i].id, v)} onAtras={() => (i ? setI(i - 1) : setPaso('reclamo'))} />}
        {paso === 'menor' && (
          <Centro>
            <h2 className="titulo text-4xl">Para menores de 14 años, mejor en persona</h2>
            <p className="text-lg text-[#f5efe6]/70 max-w-xl">Pide consejo en el mostrador: te atenderán con un adulto.</p>
            <Boton onClick={reiniciar}>Volver al inicio</Boton>
          </Centro>
        )}
        {paso === 'consentimiento' && (
          <Centro>
            <p className="etiqueta">Antes de la foto</p>
            <h2 className="titulo text-4xl md:text-5xl max-w-2xl">Tu foto se usa solo para analizar tu piel</h2>
            <ul className="text-lg text-[#f5efe6]/75 max-w-xl space-y-2 text-left">
              <li>· La farmacia no guarda tu foto ni tu nombre.</li>
              <li>· El servicio de análisis la borra tras un tiempo limitado.</li>
              <li>· Es un análisis cosmético orientativo, no un diagnóstico médico.</li>
            </ul>
            <div className="flex flex-wrap gap-4 justify-center">
              <Boton onClick={() => setPaso('camara')}>Acepto, hacer la foto</Boton>
              <Boton secundario onClick={() => setPaso('mejorar')}>Prefiero sin foto</Boton>
            </div>
          </Centro>
        )}
        {paso === 'camara' && <Camara error={error} onFoto={(b64, url) => { setFoto(url); analizar(b64) }} />}
        {paso === 'mejorar' && <Mejorar error={error} onListo={(m) => analizar(null, m)} />}
        {paso === 'analizando' && <Analizando foto={foto} />}
        {paso === 'resultado' && res && <Resultado res={res} foto={foto} farmacia={farmacia} onFin={reiniciar} />}
      </div>
    </div>
  )
}

/* ---------- Pantallas ---------- */

function Reclamo({ farmacia, precio, onEmpezar }: { farmacia: string; precio: string; onEmpezar: () => void }) {
  return (
    <button onClick={onEmpezar} className="w-full min-h-dvh grid md:grid-cols-[1.1fr_1fr] items-center gap-10 px-10 md:px-16 py-12 text-left">
      <div className="space-y-8">
        <p className="etiqueta">{farmacia} · Análisis de piel con IA</p>
        <h1 className="titulo text-5xl md:text-7xl leading-[1.02]">
          Descubre lo que tu piel <em className="text-[#e8b48a]">necesita de verdad</em>
        </h1>
        <p className="text-xl text-[#f5efe6]/75 max-w-lg">
          Una foto, dos minutos. Ve lo que la IA detecta en tu piel, cómo podría verse con la rutina adecuada y qué productos de esta farmacia te funcionan.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <span className="boton-principal pulso">Toca para empezar</span>
          <span className="text-lg"><b className="text-2xl">{precio}</b> <span className="text-[#f5efe6]/60">· pregunta en el mostrador</span></span>
        </div>
        <ol className="flex flex-wrap gap-6 text-sm text-[#f5efe6]/60 pt-2">
          <li><b className="text-[#e8b48a]">1</b> Foto</li>
          <li><b className="text-[#e8b48a]">2</b> Análisis de 11 aspectos</li>
          <li><b className="text-[#e8b48a]">3</b> Tu antes y después</li>
          <li><b className="text-[#e8b48a]">4</b> Tu rutina</li>
        </ol>
      </div>
      <div className="relative mx-auto w-[min(80vw,440px)] aspect-[3/4]">
        <CaraEscaneo />
      </div>
    </button>
  )
}

function Pregunta({ q, n, valor, onResp, onAtras }: { q: (typeof PREGUNTAS)[number]; n: number; valor?: string; onResp: (v: string) => void; onAtras: () => void }) {
  return (
    <Centro>
      <div className="flex gap-2">{PREGUNTAS.map((_, k) => <span key={k} className={`h-1.5 w-10 rounded-full ${k <= n ? 'bg-[#e8b48a]' : 'bg-[#f5efe6]/15'}`} />)}</div>
      <p className="etiqueta">Pregunta {n + 1} de {PREGUNTAS.length}</p>
      <h2 className="titulo text-4xl md:text-5xl max-w-3xl">{q.t}</h2>
      <p className="text-lg text-[#f5efe6]/60 max-w-xl">{q.nota}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {q.ops.map(([v, t]) => (
          <button key={v} onClick={() => onResp(v)} className={`opcion ${valor === v ? 'opcion-activa' : ''}`}>{t}</button>
        ))}
      </div>
      <button onClick={onAtras} className="text-[#f5efe6]/50 text-sm">← Atrás</button>
    </Centro>
  )
}

function Camara({ error, onFoto }: { error: string; onFoto: (b64: string, dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [cuenta, setCuenta] = useState<number | null>(null)
  const [fallo, setFallo] = useState('')
  const hecha = useRef(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => { stream = s; if (video.current) video.current.srcObject = s })
      .catch(() => setFallo('No se ha podido abrir la cámara. Pide ayuda en el mostrador.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
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
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6">
      <div className="relative h-[72dvh] aspect-[3/4] max-w-full overflow-hidden rounded-[2rem] bg-black shadow-2xl">
        <video ref={video} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <div className="absolute inset-0 pointer-events-none mascara-ovalo" />
        <div className="absolute left-[14%] right-[14%] top-[9%] bottom-[13%] rounded-[50%] border-[3px] border-[#e8b48a] pointer-events-none" />
        {cuenta != null && cuenta > 0 && <div className="absolute inset-0 flex items-center justify-center titulo text-[10rem] text-white/90 drop-shadow-lg">{cuenta}</div>}
      </div>
      {(error || fallo) && <p className="bg-[#7a2e1f] text-white rounded-xl px-5 py-3 max-w-xl text-center">{fallo || error}</p>}
      <p className="text-lg text-[#f5efe6]/70 text-center">Acércate hasta llenar el óvalo · Mira de frente · Sin gafas · Pelo fuera de la frente</p>
      {!fallo && <button onClick={() => setCuenta(3)} disabled={cuenta != null} className="boton-principal disabled:opacity-50">{error ? 'Repetir la foto' : 'Hacer la foto'}</button>}
    </div>
  )
}

function Mejorar({ error, onListo }: { error: string; onListo: (m: string[]) => void }) {
  const [sel, setSel] = useState<string[]>([])
  const alternar = (v: string) => setSel(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])
  return (
    <Centro>
      <p className="etiqueta">Sin foto</p>
      <h2 className="titulo text-4xl md:text-5xl">¿Qué te gustaría mejorar?</h2>
      <p className="text-lg text-[#f5efe6]/60">Marca todo lo que quieras.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
        {MEJORAR.map(([v, t]) => <button key={v} onClick={() => alternar(v)} className={`opcion ${sel.includes(v) ? 'opcion-activa' : ''}`}>{t}</button>)}
      </div>
      {error && <p className="bg-[#7a2e1f] text-white rounded-xl px-5 py-3">{error}</p>}
      <Boton onClick={() => onListo(sel)} disabled={!sel.length}>Ver mi rutina</Boton>
    </Centro>
  )
}

function Analizando({ foto }: { foto: string | null }) {
  const [m, setM] = useState(0)
  useEffect(() => { const t = setInterval(() => setM((x) => Math.min(x + 1, MENSAJES.length - 1)), 4500); return () => clearInterval(t) }, [])
  return (
    <Centro>
      <div className="relative w-[min(70vw,360px)] aspect-[3/4] rounded-[2rem] overflow-hidden bg-black/40 shadow-2xl">
        {foto ? <img src={foto} alt="" className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-80" /> : <CaraEscaneo />}
        <div className="linea-escaneo" />
        <div className="absolute inset-0 rejilla" />
      </div>
      <p key={m} className="titulo text-3xl aparecer">{MENSAJES[m]}</p>
      <div className="w-72 h-1.5 bg-[#f5efe6]/10 rounded-full overflow-hidden"><div className="h-full bg-[#e8b48a] barra-progreso" /></div>
    </Centro>
  )
}

function Resultado({ res, foto, farmacia, onFin }: { res: any; foto: string | null; farmacia: string; onFin: () => void }) {
  const R = res.rutinas
  const F = res.foto
  const [nivel, setNivel] = useState<'basica' | 'media' | 'completa'>('media')
  const [qr, setQr] = useState('')
  if (R?.sin_rutina) return <Centro><h2 className="titulo text-4xl max-w-2xl">{R.sin_rutina}</h2><Boton onClick={onFin}>Terminar</Boton></Centro>
  const rut = R.rutinas[nivel]
  const aspectos: [string, number][] = F ? Object.entries(F.puntuaciones as Record<string, number>).sort((a, b) => b[1] - a[1]) : []
  const destacados = aspectos.filter(([, v]) => v >= 40).slice(0, 3)
  const marcas: string | undefined = F?.imagenes?.marcas?.find((u: string) => u !== F.imagenes.despues)
  const ingredientes = (R.rutinas.completa.ingredientes ?? []).slice(0, 4)
  const productos = (rut.productos ?? []).filter((p: any) => p.producto)

  async function generarQr() {
    const lineas = [`Mi rutina SkinCheck · ${farmacia}`, '']
    for (const p of productos) lineas.push(`${TURNO[p.turno] ?? p.turno}: ${p.marca} ${p.producto}${p.precio ? ` (${eur(p.precio)})` : ''}`)
    lineas.push('', `Total: ${eur(rut.total)}`, 'Vuelve en 6 semanas para comparar tu piel.')
    setQr(await QRCode.toDataURL(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, { margin: 1, width: 360, errorCorrectionLevel: 'L' }))
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-14 space-y-14">
      <header className="space-y-3">
        <p className="etiqueta">Tu análisis</p>
        <h2 className="titulo text-4xl md:text-6xl">
          {destacados.length ? <>Tu piel pide trabajar <em className="text-[#e8b48a]">{destacados.map(([a]) => NOMBRE[a]?.toLowerCase()).join(', ')}</em></> : 'Esto es lo que necesita tu piel'}
        </h2>
        {F && (F.edad_piel != null || F.puntuacion_global != null) && (
          <p className="text-lg text-[#f5efe6]/70">
            {F.puntuacion_global != null && <>Puntuación de tu piel: <b className="text-[#f5efe6]">{F.puntuacion_global}/100</b></>}
            {F.edad_piel != null && <> · Edad aparente de la piel: <b className="text-[#f5efe6]">{F.edad_piel}</b></>}
          </p>
        )}
      </header>

      {F && (
        <section className="grid md:grid-cols-2 gap-8 items-start">
          {foto && F.imagenes?.despues ? (
            <AntesDespues antes={foto} despues={F.imagenes.despues} />
          ) : marcas ? (
            <img src={marcas} alt="Zonas analizadas" className="w-full rounded-[2rem]" />
          ) : foto ? (
            <img src={foto} alt="" className="w-full rounded-[2rem] -scale-x-100" />
          ) : null}
          <div className="space-y-6">
            {marcas && F.imagenes?.despues && (
              <figure className="space-y-2">
                <img src={marcas} alt="Zonas analizadas" className="w-48 rounded-2xl" />
                <figcaption className="text-sm text-[#f5efe6]/55">Zonas que ha detectado el análisis</figcaption>
              </figure>
            )}
            <ul className="space-y-3">
              {aspectos.map(([a, v]) => (
                <li key={a} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3">
                  <span className="text-[#f5efe6]/85">{NOMBRE[a] ?? a}</span>
                  <span className="h-2.5 bg-[#f5efe6]/10 rounded-full overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${v}%`, background: v >= 40 ? '#e8b48a' : '#8aa89a' }} /></span>
                  <span className="text-right text-sm text-[#f5efe6]/55">{v}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#f5efe6]/45">Cuanto más larga la barra, más marcado. La simulación es orientativa, generada con IA: no es una promesa de resultado.</p>
          </div>
        </section>
      )}

      {ingredientes.length > 0 && (
        <section className="space-y-6">
          <h3 className="titulo text-3xl md:text-4xl">Los ingredientes que tu piel necesita</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {ingredientes.map((o: any, k: number) => (
              <div key={k} className="tarjeta space-y-2">
                <p className="text-xs uppercase tracking-widest text-[#e8b48a]">{k === 0 ? 'Prioridad' : o.turno ? TURNO[o.turno] ?? o.turno : 'Ingrediente'}</p>
                <p className="titulo text-2xl">{o.nombre}</p>
                <p className="text-[#f5efe6]/70">{o.por_que}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="titulo text-3xl md:text-4xl">Tu rutina, con productos de esta farmacia</h3>
          <div className="ml-auto flex rounded-full bg-[#f5efe6]/8 p-1">
            {(['basica', 'media', 'completa'] as const).map((k) => (
              <button key={k} onClick={() => { setNivel(k); setQr('') }} className={`px-5 py-2.5 rounded-full text-sm ${nivel === k ? 'bg-[#f5efe6] text-[#14110f]' : 'text-[#f5efe6]/70'}`}>
                {R.rutinas[k].nombre} · {eur(R.rutinas[k].total)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p: any, k: number) => (
            <div key={k} className="tarjeta flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-[#e8b48a]">{p.paso} · {TURNO[p.turno] ?? p.turno}</p>
              <p className="text-sm text-[#f5efe6]/60">{p.marca}</p>
              <p className="titulo text-xl leading-snug">{p.producto}</p>
              <p className="text-[#f5efe6]/65 text-sm flex-1">{p.para}</p>
              <p className="text-xl">{eur(p.precio)}</p>
            </div>
          ))}
        </div>
        {!productos.length && <p className="text-[#f5efe6]/60">Pide al farmacéutico que te enseñe los productos de tu rutina.</p>}
      </section>

      <section className="tarjeta grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div className="space-y-3">
          <h3 className="titulo text-3xl">Llévatela y vuelve en 6 semanas</h3>
          <p className="text-[#f5efe6]/70 text-lg">Escanea el código con tu móvil para guardar tu rutina en WhatsApp. En 6 semanas, repite el análisis y compara tu piel con la de hoy.</p>
          <p className="text-[#f5efe6]/50">Enseña esta pantalla en el mostrador para que te preparen los productos.</p>
        </div>
        {qr ? <img src={qr} alt="Código QR de tu rutina" className="w-48 h-48 rounded-xl bg-white p-2" /> : <Boton onClick={generarQr}>Ver mi código</Boton>}
      </section>

      <div className="flex justify-center pb-6"><Boton secundario onClick={onFin}>Terminar y borrar mis datos</Boton></div>
    </div>
  )
}

/* ---------- Piezas ---------- */

function AntesDespues({ antes, despues }: { antes: string; despues: string }) {
  const [x, setX] = useState(50)
  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-black touch-none"
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') { const r = e.currentTarget.getBoundingClientRect(); setX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))) } }}>
        <img src={despues} alt="Simulación del después" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
          <img src={antes} alt="Hoy" className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/90" style={{ left: `${x}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white text-[#14110f] flex items-center justify-center shadow-lg">⇆</div>
        </div>
        <span className="absolute top-4 left-4 text-xs uppercase tracking-widest bg-black/50 rounded-full px-3 py-1">Hoy</span>
        <span className="absolute top-4 right-4 text-xs uppercase tracking-widest bg-black/50 rounded-full px-3 py-1">Con tu rutina · IA</span>
      </div>
      <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} className="w-full accent-[#e8b48a]" aria-label="Comparar antes y después" />
    </div>
  )
}

function CaraEscaneo() {
  return (
    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-[#2a211c] to-[#1a1512] border border-[#f5efe6]/10">
      <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full" fill="none" stroke="#e8b48a" strokeOpacity=".55" strokeWidth="1.2">
        <ellipse cx="150" cy="190" rx="95" ry="130" />
        <path d="M100 165 q20 -12 40 0 M160 165 q20 -12 40 0" />
        <path d="M150 180 v45 q-10 8 0 10" />
        <path d="M120 270 q30 20 60 0" />
        {[...Array(28)].map((_, k) => <circle key={k} cx={95 + ((k * 37) % 110)} cy={110 + ((k * 53) % 170)} r="1.8" fill="#e8b48a" className="punto" style={{ animationDelay: `${(k % 7) * 0.4}s` }} />)}
      </svg>
      <div className="linea-escaneo" />
      <div className="absolute inset-0 rejilla" />
      <div className="absolute left-6 bottom-6 right-6 flex justify-between text-[11px] uppercase tracking-widest text-[#f5efe6]/60">
        <span>Poros · Manchas · Arrugas</span><span>IA</span>
      </div>
    </div>
  )
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh flex flex-col items-center justify-center text-center gap-7 px-8 py-16">{children}</div>
}

function Boton({ children, onClick, secundario, disabled }: { children: React.ReactNode; onClick: () => void; secundario?: boolean; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={`${secundario ? 'boton-secundario' : 'boton-principal'} disabled:opacity-40`}>{children}</button>
}

function Fondo() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full bg-[#e8b48a]/10 blur-3xl" />
      <div className="absolute -bottom-52 -right-40 w-[55vw] h-[55vw] rounded-full bg-[#8aa89a]/10 blur-3xl" />
    </div>
  )
}

function Estilos() {
  return (
    <style>{`
      .titulo { font-family: var(--font-serif), Georgia, serif; font-weight: 400; letter-spacing: -0.02em; }
      .titulo em { font-style: italic; }
      .etiqueta { text-transform: uppercase; letter-spacing: .22em; font-size: .8rem; color: #e8b48a; }
      .boton-principal { display:inline-flex; align-items:center; justify-content:center; background:#e8b48a; color:#14110f; border-radius:999px; padding:1.1rem 2.4rem; font-size:1.2rem; font-weight:600; }
      .boton-secundario { display:inline-flex; align-items:center; justify-content:center; border:1px solid rgba(245,239,230,.3); color:#f5efe6; border-radius:999px; padding:1.1rem 2.2rem; font-size:1.1rem; }
      .opcion { border:1px solid rgba(245,239,230,.18); background:rgba(245,239,230,.04); border-radius:1.25rem; padding:1.4rem 1rem; font-size:1.2rem; transition: all .15s; }
      .opcion:active, .opcion-activa { background:#f5efe6; color:#14110f; border-color:#f5efe6; }
      .tarjeta { background:rgba(245,239,230,.05); border:1px solid rgba(245,239,230,.1); border-radius:1.5rem; padding:1.5rem; }
      .mascara-ovalo { background: radial-gradient(ellipse 36% 39% at 50% 48%, transparent 98%, rgba(20,17,15,.55) 100%); }
      .rejilla { background-image: linear-gradient(rgba(232,180,138,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(232,180,138,.07) 1px, transparent 1px); background-size: 24px 24px; }
      .linea-escaneo { position:absolute; left:0; right:0; height:3px; background: linear-gradient(90deg, transparent, #e8b48a, transparent); box-shadow: 0 0 24px 6px rgba(232,180,138,.45); animation: escaneo 3.2s ease-in-out infinite; }
      @keyframes escaneo { 0%,100% { top: 8%; } 50% { top: 90%; } }
      .punto { animation: parpadeo 2.8s ease-in-out infinite; }
      @keyframes parpadeo { 0%,100% { opacity:.15 } 50% { opacity:1 } }
      .pulso { animation: pulso 2.4s ease-in-out infinite; }
      @keyframes pulso { 0%,100% { box-shadow: 0 0 0 0 rgba(232,180,138,.5) } 50% { box-shadow: 0 0 0 18px rgba(232,180,138,0) } }
      .aparecer { animation: aparecer .5s ease-out both; }
      @keyframes aparecer { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform:none } }
      .barra-progreso { animation: progreso 40s cubic-bezier(.1,.6,.3,1) forwards; }
      @keyframes progreso { from { width: 4% } to { width: 96% } }
    `}</style>
  )
}
