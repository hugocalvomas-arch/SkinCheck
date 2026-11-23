'use client'
import { useState, useTransition } from 'react'
import { aNumero, clavesDeCodigo, detectarColumnas, type Campo } from '@/lib/codigos'
import { leerExportacion } from '@/lib/leerExportacion'
import { guardarStock } from './actions'

const ETIQUETAS: Record<Campo, string> = {
  cn: 'Código nacional (CN)',
  ean: 'Código de barras (EAN)',
  descripcion: 'Descripción',
  pvp: 'PVP con IVA',
  stock: 'Stock actual',
  marca: 'Laboratorio o marca (opcional)',
}
const PROGRAMAS = [
  ['farmatic', 'Farmatic'],
  ['nixfarma', 'Nixfarma'],
  ['unycop', 'Unycop'],
  ['iofwin', 'IOFWin'],
  ['bitfarma', 'Bitfarma'],
  ['otro', 'Otro'],
]

type Props = { farmaciaId: string; mapeoGuardado: Partial<Record<Campo, string>>; programaGuardado: string }

export function SubirCsv({ farmaciaId, mapeoGuardado, programaGuardado }: Props) {
  const [filas, setFilas] = useState<Record<string, string>[]>([])
  const [cabeceras, setCabeceras] = useState<string[]>([])
  const [mapa, setMapa] = useState<Partial<Record<Campo, string>>>({})
  const [programa, setPrograma] = useState(programaGuardado)
  const [aviso, setAviso] = useState('')
  const [resultado, setResultado] = useState('')
  const [pendiente, start] = useTransition()

  async function leer(file: File) {
    setResultado('')
    setAviso('')
    try {
      const t = await leerExportacion(file)
      setCabeceras(t.cabeceras)
      setFilas(t.filas)
      setAviso(t.aviso ?? '')
      // 1º el mapeo guardado de esta farmacia (si sus columnas siguen ahí), 2º la detección automática
      const auto = detectarColumnas(t.cabeceras)
      const guardado = Object.fromEntries(Object.entries(mapeoGuardado).filter(([, h]) => h && t.cabeceras.includes(h)))
      setMapa({ ...auto, ...guardado })
    } catch (e) {
      setAviso('No se ha podido leer el archivo: ' + (e as Error).message)
    }
  }

  const val = (f: Record<string, string>, c: Campo) => (mapa[c] ? f[mapa[c]!] ?? '' : '')
  const reconocibles = filas.filter((f) => {
    const a = clavesDeCodigo(val(f, 'cn'))
    const b = clavesDeCodigo(val(f, 'ean'))
    return a.cn || a.ean || b.cn || b.ean
  }).length
  const notacionCientifica = filas.slice(0, 200).some((f) => /e\+/i.test(val(f, 'ean') + val(f, 'cn')))

  function guardar() {
    if (!mapa.cn && !mapa.ean) return setResultado('Elige la columna del código nacional o la del código de barras.')
    if (!mapa.stock) return setResultado('Elige la columna de stock.')
    const datos = filas.map((f) => ({
      cn: val(f, 'cn'),
      ean: val(f, 'ean'),
      descripcion: val(f, 'descripcion'),
      marca: val(f, 'marca'),
      pvp: aNumero(val(f, 'pvp')),
      unidades: aNumero(val(f, 'stock')),
    }))
    start(async () => {
      const r = await guardarStock(farmaciaId, datos, mapa, programa)
      if ('error' in r) setResultado('Error: ' + r.error)
      else
        setResultado(
          `Listo: ${r.reconocidos} productos reconocidos (${r.conStock} con stock) y ${r.sinClasificar} sin clasificar, de ${r.total} filas.` +
            (r.descartadas ? ` ${r.descartadas} filas sin código válido se han ignorado.` : ''),
        )
    })
  }

  return (
    <div className="bg-papel rounded-[var(--radius-card)] border border-linea p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm space-y-1">
          <span className="block font-medium">Programa de gestión</span>
          <select value={programa} onChange={(e) => setPrograma(e.target.value)} className="w-full border rounded-lg px-2 py-1.5">
            <option value="">—</option>
            {PROGRAMAS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="block font-medium">Archivo exportado (Excel, CSV o TXT)</span>
          <input type="file" accept=".xlsx,.xls,.xlsm,.ods,.csv,.txt" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
        </label>
      </div>
      {aviso && <p className="text-sm bg-aviso-suave text-aviso rounded-lg p-3">{aviso}</p>}
      {cabeceras.length > 0 && (
        <>
          <p className="text-sm text-gris">
            {filas.length} filas leídas, {reconocibles} con un código válido. Comprueba qué columna es cada dato:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.keys(ETIQUETAS) as Campo[]).map((c) => (
              <label key={c} className="text-sm space-y-1">
                <span className="block text-gris">{ETIQUETAS[c]}</span>
                <select value={mapa[c] ?? ''} onChange={(e) => setMapa({ ...mapa, [c]: e.target.value || undefined })} className="w-full border rounded-lg px-2 py-1.5">
                  <option value="">—</option>
                  {cabeceras.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>
          {notacionCientifica && (
            <p className="text-sm bg-aviso-suave text-aviso rounded-lg p-3">
              Algunos códigos de barras vienen como “8,41E+12”. Excel los ha estropeado: en Excel, da formato de texto o de número sin decimales a esa columna y vuelve a guardar.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead><tr className="text-left text-gris">{(['cn', 'ean', 'descripcion', 'pvp', 'stock'] as Campo[]).map((c) => <th key={c} className="pr-3 pb-1">{ETIQUETAS[c]}</th>)}</tr></thead>
              <tbody>
                {filas.slice(0, 5).map((f, i) => (
                  <tr key={i} className="border-t">{(['cn', 'ean', 'descripcion', 'pvp', 'stock'] as Campo[]).map((c) => <td key={c} className="pr-3 py-1">{val(f, c)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={guardar} disabled={pendiente} className="btn">
            {pendiente ? 'Guardando…' : 'Actualizar stock'}
          </button>
        </>
      )}
      {resultado && <p className="text-sm">{resultado}</p>}
    </div>
  )
}
