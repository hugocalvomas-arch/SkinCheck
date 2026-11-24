// Informe completo en PDF que la clienta recibe por email si lo pide.
// Incluye lo que no cabe en el resumen del iPad: las 11 medidas explicadas, las fotos por zona,
// los ingredientes con la ficha de la web de Hugo y la rutina paso a paso.
/* eslint-disable @typescript-eslint/no-explicit-any, jsx-a11y/alt-text */
import path from 'node:path'
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { NOMBRE_ASPECTO, type ResultadoFoto } from '@/server/analisisPiel'
import { QUE_ES, type Lectura } from '@/server/lectura'
import { nivelPiel } from '@/lib/escalaPiel'

const FUENTES = path.join(process.cwd(), 'src/server/datos/fuentes')
Font.register({
  family: 'Geist',
  fonts: [
    { src: path.join(FUENTES, 'Geist-Regular.ttf') },
    { src: path.join(FUENTES, 'Geist-Medium.ttf'), fontWeight: 500 },
    { src: path.join(FUENTES, 'Geist-SemiBold.ttf'), fontWeight: 600 },
  ],
})
Font.registerHyphenationCallback((w) => [w])

const C = { tinta: '#0f1b1d', tinta2: '#2b3a3c', gris: '#56676a', linea: '#dfe6e5', marca: '#0b6e5b', suave: '#e5f2ee', papel2: '#f3f6f5' }
const s = StyleSheet.create({
  pagina: { fontFamily: 'Geist', fontSize: 10, color: C.tinta, padding: 40, lineHeight: 1.45 },
  cab: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 8.5, color: C.gris, marginBottom: 24 },
  h1: { fontSize: 26, fontWeight: 600, letterSpacing: -0.6, marginBottom: 6, lineHeight: 1.15 },
  h2: { fontSize: 16, fontWeight: 600, letterSpacing: -0.3, marginBottom: 10, marginTop: 4 },
  gris: { color: C.gris },
  fila: { flexDirection: 'row' },
  pie: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 7.5, color: C.gris, flexDirection: 'row', justifyContent: 'space-between' },
})

// Sufijo de las imágenes de Perfect Corp -> aspecto
const ZONA_DE: [string, string][] = [
  ['firmness', 'firmeza'], ['oiliness', 'brillo'], ['radiance', 'tono'], ['redness', 'rojez'], ['pore', 'poros'], ['texture', 'textura'],
  ['age_spot', 'manchas'], ['dark_circle', 'ojeras'], ['acne', 'acne'], ['wrinkle', 'arrugas'], ['moisture', 'hidratacion'],
]
const eur = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }))
const min = (x: string) => x.charAt(0).toLowerCase() + x.slice(1)
const TURNO: Record<string, string> = { AM: 'mañana', PM: 'noche', AMPM: 'mañana o noche' }
const lista = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] ?? '')

async function traer(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) return null
    return Buffer.from(await r.arrayBuffer())
  } catch { return null }
}

function Barra({ v }: { v: number }) {
  return (
    <View style={{ height: 5, backgroundColor: C.papel2, borderRadius: 3, flexGrow: 1 }}>
      <View style={{ height: 5, width: `${Math.max(3, v)}%`, backgroundColor: v < 50 ? C.marca : '#7fb5a9', borderRadius: 3 }} />
    </View>
  )
}

function Cabecera({ farmacia, fecha }: { farmacia: string; fecha: string }) {
  return <View style={s.cab} fixed><Text>SkinRead · {farmacia}</Text><Text>{fecha}</Text></View>
}
function Pie() {
  return (
    <View style={s.pie} fixed>
      <Text>Análisis cosmético orientativo, no un diagnóstico médico.</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

export type AnteriorPdf = { fecha: string; ui: Record<string, number>; global?: number; edad?: number; foto: string | null }

export async function crearInformePdf(o: { farmacia: string; foto: ResultadoFoto | null; fotoCliente: string | null; lectura: Lectura; rutina: any; avisos: string[]; codigo?: string | null; anterior?: AnteriorPdf | null }) {
  const { farmacia, foto: F, lectura, rutina } = o
  const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
  const notas = F ? Object.keys(NOMBRE_ASPECTO).filter((a) => F.ui?.[a] != null || F.puntuaciones[a] != null)
    .map((a) => [a, Math.round(F.ui?.[a] ?? 100 - F.puntuaciones[a])] as [string, number]).sort((x, y) => x[1] - y[1]) : []

  // Fotos por zona: las imágenes del proveedor caducan a las 2 horas, así que se descargan ahora
  const zonas: { aspecto: string; img: Buffer }[] = []
  for (const url of F?.imagenes?.marcas ?? []) {
    if (url === F?.imagenes?.despues) continue
    const z = ZONA_DE.find(([k]) => url.includes(`_${k}`))
    if (!z) continue
    const img = await traer(url)
    if (img) zonas.push({ aspecto: z[1], img })
  }
  const despues = F?.imagenes?.despues ? await traer(F.imagenes.despues) : null
  const cliente = o.fotoCliente?.startsWith('data:image/') ? Buffer.from(o.fotoCliente.split(',')[1] ?? '', 'base64') : null
  // Revisión: el primer análisis frente al de hoy, en la misma escala (0-100, más alto = mejor)
  const A = o.anterior
  const fotoAntes = A?.foto?.startsWith('data:image/') ? Buffer.from(A.foto.split(',')[1] ?? '', 'base64') : null
  const fechaAntes = A ? new Date(A.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }) : ''
  const evolucion = A && F ? Object.keys(NOMBRE_ASPECTO).filter((a) => A.ui[a] != null && F.ui?.[a] != null)
    .map((a) => ({ a, antes: Math.round(A.ui[a]), ahora: Math.round(F.ui[a]) })).sort((x, y) => (y.ahora - y.antes) - (x.ahora - x.antes)) : []
  zonas.sort((x, y) => (notas.find((n) => n[0] === x.aspecto)?.[1] ?? 100) - (notas.find((n) => n[0] === y.aspecto)?.[1] ?? 100))

  const productos: any[] = (rutina?.productos ?? []).filter((p: any) => p.producto)
  const manana = productos.filter((p) => p.turno === 'AM' || p.turno === 'AMPM')
  const noche = productos.filter((p) => p.turno === 'PM' || p.turno === 'AMPM')

  const doc = (
    <Document title="Tu informe de piel" author="SkinRead">
      {/* 1. Resumen */}
      <Page size="A4" style={s.pagina}>
        <Cabecera farmacia={farmacia} fecha={fecha} />
        <Text style={s.h1}>Tu informe de piel</Text>
        <Text style={[s.gris, { fontSize: 11, marginBottom: 18 }]}>Tu resultado explicado, tus ingredientes clave y tu rutina paso a paso.</Text>
        <View style={[s.fila, { gap: 24 }]}>
          {(cliente || despues) && (
            <View style={{ width: 170, gap: 8 }}>
              {cliente && <Image src={cliente} style={{ width: 170, borderRadius: 6, transform: 'scaleX(-1)' }} />}
              {despues && <View><Image src={despues} style={{ width: 170, borderRadius: 6 }} /><Text style={[s.gris, { fontSize: 7.5, marginTop: 3 }]}>Simulación orientativa generada con IA. No es una promesa de resultado.</Text></View>}
            </View>
          )}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {F?.puntuacion_global != null && (
              <View style={[s.fila, { gap: 36, marginBottom: 16 }]}>
                <View>
                  <Text style={[s.gris, { fontSize: 9, marginBottom: 2 }]}>Puntuación de tu piel</Text>
                  <View style={[s.fila, { alignItems: 'flex-end' }]}>
                    <Text style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1 }}>{Math.round(F.puntuacion_global)}</Text>
                    <Text style={{ fontSize: 14, color: C.gris, marginLeft: 3, marginBottom: 4 }}>/100</Text>
                  </View>
                </View>
                {F.edad_piel != null && (
                  <View>
                    <Text style={[s.gris, { fontSize: 9, marginBottom: 2 }]}>Edad de tu piel</Text>
                    <Text style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1 }}>{Math.round(F.edad_piel)}<Text style={{ fontSize: 14, color: C.gris }}> años</Text></Text>
                  </View>
                )}
              </View>
            )}
            {lectura.objetivos.length > 0 && (
              <View style={{ backgroundColor: C.suave, borderRadius: 6, padding: 12 }}>
                <Text style={{ fontWeight: 500, marginBottom: 4 }}>Lo primero que conviene trabajar</Text>
                {lectura.objetivos.map((x, k) => <Text key={x.aspecto}>{k + 1}. {x.nombre} <Text style={s.gris}>· {x.nota}/100</Text></Text>)}
              </View>
            )}
          </View>
        </View>
        {notas.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <Text style={s.h2}>Tus 11 medidas</Text>
            <Text style={[s.gris, { fontSize: 8.5, marginTop: -6, marginBottom: 6 }]}>Escala de 0 a 100: más alto, piel en mejor estado. 75 o más: bien · 50 a 74: leve · 30 a 49: moderado · menos de 30: marcado.</Text>
            {notas.map(([a, v]) => (
              <View key={a} style={[s.fila, { alignItems: 'center', gap: 10, paddingVertical: 4, borderBottom: `0.5pt solid ${C.linea}` }]} wrap={false}>
                <Text style={{ width: 66, fontWeight: 500 }}>{NOMBRE_ASPECTO[a]}</Text>
                <View style={{ width: 90 }}><Barra v={v} /></View>
                <Text style={{ width: 62 }}>{v} <Text style={s.gris}>· {nivelPiel(v)}</Text></Text>
                <Text style={[s.gris, { flex: 1, fontSize: 8.5 }]}>{QUE_ES[a]}</Text>
              </View>
            ))}
          </View>
        )}
        <Pie />
      </Page>

      {/* Revisión: antes y ahora */}
      {evolucion.length > 0 && (
        <Page size="A4" style={s.pagina}>
          <Cabecera farmacia={farmacia} fecha={fecha} />
          <Text style={s.h2}>Tu evolución desde el {fechaAntes}</Text>
          <Text style={[s.gris, { marginTop: -6, marginBottom: 12 }]}>Las mismas medidas en tu primer análisis y hoy. Más alto, piel en mejor estado. Cambios de 1 o 2 puntos pueden deberse a la luz o a la postura.</Text>
          {fotoAntes && cliente && (
            <View style={[s.fila, { gap: 12, marginBottom: 14 }]}>
              <View><Image src={fotoAntes} style={{ width: 150, borderRadius: 6, transform: 'scaleX(-1)' }} /><Text style={[s.gris, { fontSize: 8.5, marginTop: 3 }]}>{fechaAntes}</Text></View>
              <View><Image src={cliente} style={{ width: 150, borderRadius: 6, transform: 'scaleX(-1)' }} /><Text style={[s.gris, { fontSize: 8.5, marginTop: 3 }]}>Hoy</Text></View>
            </View>
          )}
          {A?.global != null && F?.puntuacion_global != null && (
            <Text style={{ fontSize: 12, marginBottom: 10 }}>Puntuación global: {Math.round(A.global)} → <Text style={{ fontWeight: 600 }}>{Math.round(F.puntuacion_global)}</Text>{A.edad != null && F.edad_piel != null ? <Text style={s.gris}>   ·   Edad de la piel: {Math.round(A.edad)} → {Math.round(F.edad_piel)} años</Text> : null}</Text>
          )}
          {evolucion.map((e) => (
            <View key={e.a} style={[s.fila, { alignItems: 'center', gap: 10, paddingVertical: 4, borderBottom: `0.5pt solid ${C.linea}` }]} wrap={false}>
              <Text style={{ width: 80, fontWeight: 500 }}>{NOMBRE_ASPECTO[e.a]}</Text>
              <Text style={{ width: 70 }}>{e.antes} → {e.ahora}</Text>
              <Text style={{ width: 40, fontWeight: 600, color: e.ahora - e.antes >= 3 ? C.marca : C.gris }}>{e.ahora - e.antes > 0 ? '+' : ''}{e.ahora - e.antes}</Text>
              <Text style={[s.gris, { flex: 1, fontSize: 8.5 }]}>{nivelPiel(e.ahora)}</Text>
            </View>
          ))}
          <Pie />
        </Page>
      )}

      {/* 2. Fotos por zona */}
      {zonas.length > 0 && (
        <Page size="A4" style={s.pagina}>
          <Cabecera farmacia={farmacia} fecha={fecha} />
          <Text style={s.h2}>Tus zonas, una a una</Text>
          <Text style={[s.gris, { marginTop: -6, marginBottom: 12 }]}>Lo que ha visto el análisis en cada zona, de la nota más baja a la más alta.</Text>
          <View style={[s.fila, { flexWrap: 'wrap', gap: 8 }]}>
            {zonas.map((z) => (
              <View key={z.aspecto} style={{ width: 122 }} wrap={false}>
                <Image src={z.img} style={{ width: 122, borderRadius: 5 }} />
                <Text style={{ marginTop: 3, marginBottom: 4, fontWeight: 500, fontSize: 9 }}>{NOMBRE_ASPECTO[z.aspecto]} <Text style={s.gris}>· {notas.find((n) => n[0] === z.aspecto)?.[1]}/100</Text></Text>
              </View>
            ))}
          </View>
          <Pie />
        </Page>
      )}

      {/* 3. Recomendación: objetivos, ingredientes y rutina */}
      <Page size="A4" style={s.pagina}>
        <Cabecera farmacia={farmacia} fecha={fecha} />
        {lectura.objetivos.length > 0 && <Text style={s.h2}>Lo que conviene trabajar y qué esperar</Text>}
        {lectura.objetivos.map((x, k) => (
          <View key={x.aspecto} style={{ marginBottom: 10 }} wrap={false}>
            <Text style={{ fontWeight: 600, fontSize: 11 }}><Text style={{ color: C.marca }}>{k + 1}  </Text>{x.nombre}{x.nota != null ? <Text style={[s.gris, { fontWeight: 400 }]}>  {x.nota}/100 · {nivelPiel(x.nota)}</Text> : null}</Text>
            <Text style={s.gris}>{x.que_es}</Text>
            {x.ingredientes.length > 0 && <Text>Lo tratan: {lista(x.ingredientes.map(min))}.</Text>}
            {(x.alcance || x.plazo) && <Text style={s.gris}>{[x.alcance, x.plazo].filter(Boolean).join(' ')}</Text>}
          </View>
        ))}

        {lectura.ingredientes.length > 0 && <Text style={[s.h2, { marginTop: 12 }]}>Tus ingredientes clave</Text>}
        {lectura.ingredientes.map((g) => (
          <View key={g.nombre} style={{ marginBottom: 9, paddingLeft: 10, borderLeft: `2pt solid ${C.suave}` }} wrap={false}>
            <Text style={{ fontWeight: 600, fontSize: 11 }}>{g.nombre} <Text style={[s.gris, { fontWeight: 400, fontSize: 9 }]}>· {g.turno && TURNO[g.turno] ? `${TURNO[g.turno]} · ` : ''}para {lista(g.para.map(min))}</Text></Text>
            {g.frase && <Text>{g.frase}</Text>}
            {g.cuando && <Text style={s.gris}>Cuándo: {g.cuando}</Text>}
            {!g.ahora && g.motivo && <Text style={s.gris}>{g.motivo}</Text>}
          </View>
        ))}
        <Pie />
      </Page>

      <Page size="A4" style={s.pagina}>
        <Cabecera farmacia={farmacia} fecha={fecha} />
        <Text style={s.h2}>Tu rutina ({rutina?.nombre?.toLowerCase()}, {eur(rutina?.total)})</Text>
        {[['Mañana', manana], ['Noche', noche]].map(([t, l]: any) => (
          <View key={t} style={{ marginBottom: 14 }}>
            <Text style={{ color: C.marca, fontWeight: 600, marginBottom: 4 }}>{t}</Text>
            {l.map((p: any, k: number) => (
              <View key={k} style={[s.fila, { gap: 10, paddingVertical: 5, borderBottom: `0.5pt solid ${C.linea}` }]} wrap={false}>
                <Text style={[s.gris, { width: 14 }]}>{k + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.gris, { fontSize: 8.5 }]}>{p.paso}</Text>
                  <Text style={{ fontWeight: 500 }}>{p.marca} {p.producto}</Text>
                  {p.bajo_pedido && <Text style={s.gris}>Bajo pedido: la farmacia te lo consigue</Text>}
                  {p.para && <Text style={s.gris}>{p.para}</Text>}
                </View>
                <Text style={{ width: 50, textAlign: 'right' }}>{eur(p.precio)}</Text>
              </View>
            ))}
          </View>
        ))}
        {o.avisos.length > 0 && (
          <View style={{ backgroundColor: C.suave, borderRadius: 6, padding: 12, gap: 5 }} wrap={false}>
            <Text style={{ fontWeight: 600 }}>Cómo empezar</Text>
            {o.avisos.map((a, k) => <Text key={k}>· {a}</Text>)}
          </View>
        )}
        {o.codigo ? (
          <View style={{ marginTop: 16, borderTop: `0.5pt solid ${C.linea}`, paddingTop: 10 }} wrap={false}>
            <Text style={{ fontWeight: 600 }}>Tu código de revisión: <Text style={{ color: C.marca, fontSize: 13 }}>{o.codigo}</Text></Text>
            <Text style={s.gris}>Vuelve a la farmacia en unas 4 semanas, toca «Vengo a mi revisión» en el iPad y escribe este código para comparar tu piel con la de hoy.</Text>
          </View>
        ) : <Text style={[s.gris, { marginTop: 16 }]}>Repite el análisis en tu farmacia dentro de 4 semanas para comparar.</Text>}
        <Pie />
      </Page>
    </Document>
  )
  return renderToBuffer(doc)
}
