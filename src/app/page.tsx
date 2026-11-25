import Link from 'next/link'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CaretDown, ChartLineUp, Crosshair, DeviceTablet, FileXls, LockKey, Repeat, ShieldCheck, Storefront } from '@phosphor-icons/react/dist/ssr'
import { VideoAnalisis } from '@/components/web/VideoAnalisis'
import { AntesDespues } from '@/components/web/AntesDespues'
import { MiniInforme } from '@/components/web/MiniInforme'
import { FormularioInfo } from '@/components/web/FormularioInfo'
import { Logo } from '@/components/Logo'

export const metadata = {
  title: 'SkinRead · Análisis de piel con IA para farmacias',
  description: 'Análisis facial con IA en el mostrador: 11 parámetros de la piel, simulación del antes y después y una rutina con el stock de tu farmacia.',
}

// Fotos del comparador: public/ejemplos/antes.jpg y despues.jpg (con permiso de la persona retratada)
const hayEjemplo = existsSync(join(process.cwd(), 'public/ejemplos/antes.jpg')) && existsSync(join(process.cwd(), 'public/ejemplos/despues.jpg'))

const MIDE: [string, string][] = [
  ['Poros', 'Tamaño y visibilidad en nariz, mejillas y frente.'],
  ['Brillo', 'Exceso de sebo por zonas.'],
  ['Manchas', 'Hiperpigmentación y manchas solares.'],
  ['Luminosidad', 'Uniformidad del tono y falta de brillo sano.'],
  ['Arrugas', 'Líneas finas y arrugas de expresión.'],
  ['Firmeza', 'Pérdida de tono en óvalo y mejillas.'],
  ['Textura', 'Rugosidad e irregularidad de la superficie.'],
  ['Rojez', 'Enrojecimiento difuso o localizado.'],
  ['Hidratación', 'Nivel de agua aparente en la piel.'],
  ['Ojeras', 'Color e intensidad bajo los ojos.'],
  ['Acné', 'Granos e imperfecciones visibles.'],
  ['Edad de la piel', 'Y una puntuación global que sirve de punto de partida para el seguimiento.'],
]

const TECNOLOGIA: [string, string][] = [
  ['70.000+', 'imágenes de calidad médica, de distintos tonos de piel y edades, para entrenar el modelo.'],
  ['84 %', 'de coincidencia con un dermatólogo al valorar la rojez, y 82 % en arrugas.'],
  ['3×', 'más fiel a la edad real en arrugas que un equipo de cabina profesional.'],
  ['859', 'marcas de belleza y dermocosmética trabajan ya con esta tecnología.'],
]

const ACTIVOS: [string, string][] = [
  ['Niacinamida', 'Niacinamide'], ['Retinal', 'Retinal'], ['Ácido azelaico', 'Azelaic Acid'], ['Ácido tranexámico', 'Tranexamic Acid'], ['Ácido salicílico', 'Salicylic Acid'],
  ['Vitamina C', 'Ascorbic Acid'], ['Ceramidas', 'Ceramide NP'], ['Péptidos', 'Palmitoyl Tripeptide'], ['Pantenol', 'Panthenol'], ['Ácido hialurónico', 'Sodium Hyaluronate'],
]

const PREGUNTAS: [string, string][] = [
  ['¿Tengo que comprar algún aparato?', 'No. Funciona en el navegador de cualquier iPad con cámara frontal. Lo dejas en el mostrador y listo.'],
  ['¿Funciona con mi programa de gestión?', 'Exportas el stock en Excel o CSV desde Farmatic, Nixfarma, Unycop u otro programa y lo subes. SkinRead reconoce las columnas y recuerda tu formato para la próxima vez.'],
  ['¿Qué pasa con las fotos de las clientas?', 'No se piden nombres. La foto se envía al servicio de análisis (Perfect Corp), que la borra en un plazo de 30 días. Solo se guarda en la farmacia si la clienta lo acepta aparte, 35 días, para enseñarle el antes y el después en su revisión. Las respuestas y puntuaciones se guardan sin nombre 12 meses.'],
  ['¿Es un diagnóstico médico?', 'No. Es un análisis cosmético orientativo. Si las respuestas indican algo que necesita consulta, la pantalla lo recomienda en lugar de vender.'],
  ['¿Puedo cobrar el análisis a la clienta?', 'Sí, lo decides tú. Puedes cobrarlo como servicio, descontarlo de la compra o regalarlo.'],
  ['¿Cuánto cuesta?', 'Una cuota mensual por farmacia, sin permanencia. Déjanos tus datos y te enviamos las tarifas.'],
]

const VENTAJAS = [
  { i: Storefront, t: 'Solo recomienda lo que tienes en la estantería', d: 'La rutina se calcula con tu stock y tus precios. Tres opciones para cada clienta: básica, media y completa.' },
  { i: ChartLineUp, t: 'Ves lo que vende', d: 'Cuántas clientas se analizan, cuántas compran y qué rutina eligen.' },
  { i: Repeat, t: 'Vuelve a las 4 semanas', d: 'La clienta vuelve con su código, repite el análisis y ve el antes y el después. Tú ganas otra visita y la reposición.' },
  { i: LockKey, t: 'Privacidad por diseño', d: 'Sin nombres y con permiso expreso de la clienta. La foto solo se guarda si ella lo pide. La pantalla vuelve al inicio sola.' },
]

export default function Inicio() {
  return (
    <div className="bg-papel">
      <header className="sticky top-0 z-[var(--z-sticky-nav)] bg-papel border-b border-linea">
        <nav className="contenedor h-16 flex items-center gap-8" aria-label="Principal">
          <Link href="/" aria-label="SkinRead, inicio"><Logo /></Link>
          <div className="hidden lg:flex items-center gap-7 text-[0.9375rem] text-tinta-2 whitespace-nowrap">
            <a href="#como" className="hover:text-tinta">Cómo funciona</a>
            <a href="#tecnologia" className="hover:text-tinta">Tecnología</a>
            <a href="#ventajas" className="hover:text-tinta">Para tu farmacia</a>
            <a href="#preguntas" className="hover:text-tinta">Preguntas</a>
          </div>
          <div className="ml-auto flex items-center gap-6">
            <Link href="/login" className="hidden sm:inline text-[0.9375rem] text-tinta-2 hover:text-tinta whitespace-nowrap">Acceso farmacias</Link>
            <a href="#contacto" className="btn">Pedir información</a>
          </div>
        </nav>
      </header>

      <main>
        {/* Portada: titular y la lectura del análisis */}
        <section className="contenedor pt-12 md:pt-16 pb-14">
          <div className="rejilla items-center gap-y-10">
            <div className="col-span-12 lg:col-span-5 grid gap-6">
              <h1 className="text-[clamp(2.5rem,4.2vw,3.75rem)] leading-[1.04] max-w-[13ch]">Análisis facial con IA en tu mostrador</h1>
              <p className="lead max-w-[34ch]">Una foto, 11 medidas de la piel y una rutina con tu stock.</p>
              <div className="flex flex-wrap items-center gap-6">
                <a href="#contacto" className="btn btn-lg">Pedir información</a>
                <a href="#como" className="enlace whitespace-nowrap">Ver cómo funciona</a>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7"><VideoAnalisis /></div>
          </div>
        </section>

        {/* Qué mide */}
        <section className="pt-[var(--section-gap-s)] pb-[var(--section-gap)] border-t border-linea">
          <div className="contenedor">
            <div className="rejilla gap-y-5 items-end">
              <h2 className="col-span-12 lg:col-span-6 titulo-seccion">Qué mide la IA en cada rostro</h2>
              <p className="col-span-12 lg:col-span-5 lg:col-start-8 lead">Visión artificial entrenada para dermocosmética. Cada parámetro sale con una puntuación de 0 a 100 y su zona marcada sobre la cara.</p>
            </div>
            <ol className="mt-16 grid md:grid-cols-2 gap-x-[var(--gap-columns)] border-t border-tinta list-none p-0 m-0">
              {MIDE.map(([t, d], k) => (
                <li key={t} className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,11rem)_minmax(0,1fr)] gap-x-4 gap-y-1 items-baseline py-5 border-b border-linea">
                  <span className="font-mono text-sm text-gris">{String(k + 1).padStart(2, '0')}</span>
                  <span className={`text-lg font-medium ${k === MIDE.length - 1 ? 'text-marca' : ''}`}>{t}</span>
                  <span className="text-gris col-start-2 sm:col-start-auto">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tecnología: de dónde sale el análisis */}
        <section id="tecnologia" className="pb-[var(--section-gap)] scroll-mt-16">
          <div className="contenedor">
            <div className="rejilla gap-y-5 items-end border-t border-linea pt-[var(--section-gap-s)]">
              <h2 className="col-span-12 lg:col-span-6 titulo-seccion">La misma IA que usan las grandes marcas de dermocosmética</h2>
              <p className="col-span-12 lg:col-span-5 lg:col-start-8 lead">El análisis lo hace la tecnología de Perfect Corp, empresa que cotiza en la Bolsa de Nueva York, validada por el Departamento de Dermatología de la Wake Forest School of Medicine.</p>
            </div>
            <dl className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-[var(--gap-columns)] gap-y-10 m-0">
              {TECNOLOGIA.map(([c, t]) => (
                <div key={c} className="border-t border-tinta pt-6 grid gap-3 content-start">
                  <dt className="cifra text-[3rem] leading-none text-marca">{c}</dt>
                  <dd className="m-0 text-tinta-2 max-w-[30ch]">{t}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 text-sm text-gris max-w-[80ch]">
              Estudios: Cook MK, Feldman SR <i>et al.</i> <a className="enlace" href="https://doi.org/10.1080/09546634.2022.2127305" target="_blank" rel="noopener noreferrer">J Dermatolog Treat 2022</a> y <a className="enlace" href="https://doi.org/10.1111/jocd.15434" target="_blank" rel="noopener noreferrer">J Cosmet Dermatol 2022</a>. Análisis cosmético, no diagnóstico médico.
            </p>
          </div>
        </section>

        {/* Antes y después */}
        <section className="pb-[var(--section-gap)]">
          <div className="contenedor rejilla gap-y-12 items-center">
            <div className="col-span-12 lg:col-span-5 grid gap-8">
              <h2 className="titulo-seccion">Su piel hoy y cómo podría verse con la rutina</h2>
              <p className="lead">La IA genera una simulación a partir de su propia foto, ajustada a lo que la rutina trabaja. Es lo que convierte un análisis en una compra.</p>
              <ul className="grid list-none p-0 m-0 border-t border-linea">
                {[
                  [Crosshair, 'Sobre su cara, no sobre una modelo', 'Misma foto, mismo encuadre y misma luz.'],
                  [ShieldCheck, 'Etiquetada como simulación', 'Siempre indica que es una imagen generada con IA.'],
                  [Repeat, 'Comparación real a las 4 semanas', 'La clienta repite el análisis y ve su evolución.'],
                ].map(([I, t, d]) => {
                  const Icono = I as typeof Crosshair
                  return (
                    <li key={t as string} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 py-4 border-b border-linea">
                      <Icono size={22} className="text-marca mt-0.5" aria-hidden />
                      <span><span className="block font-medium">{t as string}</span><span className="block text-gris">{d as string}</span></span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <figure className="col-span-12 lg:col-span-6 lg:col-start-7 m-0 w-full max-w-[34rem] lg:justify-self-end">
              <AntesDespues antes={hayEjemplo ? '/ejemplos/antes.jpg' : undefined} despues={hayEjemplo ? '/ejemplos/despues.jpg' : undefined} />
              <figcaption className="mt-3 text-sm text-gris">Desliza para comparar. Simulación orientativa generada con IA.</figcaption>
            </figure>
          </div>
        </section>

        {/* La experiencia de la clienta */}
        <section id="como" className="bg-suave py-[var(--section-gap-s)] scroll-mt-16">
          <div className="contenedor rejilla gap-y-12 items-start">
            <h2 className="col-span-12 titulo-seccion">Así lo vive tu clienta</h2>
            <div className="col-span-12 lg:col-span-5 order-2 lg:order-1">
              <MiniInforme />
              <p className="text-sm text-gris mt-3">Pantalla real del informe, con datos de ejemplo.</p>
            </div>
            <ol className="col-span-12 lg:col-span-6 lg:col-start-7 order-1 lg:order-2 list-none p-0 m-0 border-t border-tinta">
              {[
                ['Se ve en la pantalla y se anima', 'El iPad muestra su cara en vivo. Es lo que hace que se acerque.'],
                ['Responde 4 preguntas de seguridad', 'Edad, embarazo, tratamientos médicos y sensibilidad. Nada más.'],
                ['Se hace una foto guiada', 'La IA mide 11 aspectos: poros, manchas, rojeces, arrugas, hidratación y más.'],
                ['Recibe su informe y su rutina', 'Ve su antes y después, los ingredientes que necesita y qué usar de mañana y de noche.'],
              ].map(([t, d], k) => (
                <li key={t} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 py-7 border-b border-linea">
                  <span className="cifra text-[2.5rem] leading-none text-marca">{k + 1}</span>
                  <span><span className="block titulo-item font-semibold tracking-[-0.02em]">{t}</span><span className="block text-gris mt-2">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Criterio cosmético */}
        <section className="py-[var(--section-gap)]">
          <div className="contenedor">
            <div className="rejilla gap-y-5 items-end">
              <h2 className="col-span-12 lg:col-span-6 titulo-seccion">Criterio cosmético, no catálogo de marca</h2>
              <p className="col-span-12 lg:col-span-5 lg:col-start-8 lead">El motor lee la lista INCI de cada producto y evalúa 37 activos por su posición, la dosis declarada y los ensayos del producto terminado.</p>
            </div>
            <div className="mt-16 grid md:grid-cols-2 gap-x-[var(--gap-columns)]">
              {[ACTIVOS.slice(0, 5), ACTIVOS.slice(5)].map((grupo, g) => (
                <table key={g} className={`w-full border-collapse border-t-2 border-tinta ${g ? 'max-md:border-t-0' : ''}`}>
                  <thead className={g ? 'max-md:hidden' : ''}>
                    <tr className="text-left text-sm text-gris">
                      <th scope="col" className="font-normal py-3 pr-4">Activo</th>
                      <th scope="col" className="font-normal py-3">Nombre INCI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.map(([n, inci]) => (
                      <tr key={n} className="border-t border-linea">
                        <th scope="row" className="text-left font-medium text-lg py-4 pr-4">{n}</th>
                        <td className="font-mono text-sm text-tinta-2 py-4">{inci}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </div>
        </section>

        {/* En la farmacia */}
        <section className="pb-[var(--section-gap)]">
          <div className="contenedor">
            <h2 className="titulo-seccion">En tu farmacia, listo en una tarde</h2>
            <ol className="mt-16 grid md:grid-cols-3 gap-x-[var(--gap-columns)] gap-y-10 list-none p-0 m-0">
              {[
                { i: FileXls, t: 'Sube tu stock', d: 'El Excel o CSV que exporta tu programa de gestión. Reconocemos las columnas solos.' },
                { i: DeviceTablet, t: 'Abre el modo iPad', d: 'Un enlace en el navegador. Lo dejas en el mostrador, a la vista.' },
                { i: ChartLineUp, t: 'Mira qué vende', d: 'Análisis hechos, rutinas vendidas y venta estimada, mes a mes.' },
              ].map((p, k) => (
                <li key={p.t} className="border-t border-tinta pt-6 grid gap-4 content-start">
                  <span className="cifra text-[3.5rem] leading-none text-tinta">{k + 1}</span>
                  <h3 className="titulo-item flex items-center gap-2"><p.i size={24} className="text-marca shrink-0" aria-hidden />{p.t}</h3>
                  <p className="text-gris max-w-[34ch]">{p.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ventajas */}
        <section id="ventajas" className="bg-marca-suave py-[var(--section-gap-s)] scroll-mt-16">
          <div className="contenedor">
            <h2 className="text-[length:var(--text-display-s)] max-w-[22ch]">Hecho para vender bien, no para vender más de la cuenta</h2>
            <ul className="mt-16 grid md:grid-cols-2 gap-x-[var(--gap-columns)] list-none p-0 m-0">
              {VENTAJAS.map((v) => (
                <li key={v.t} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 py-8 border-t border-marca/25">
                  <v.i size={28} className="text-marca" aria-hidden />
                  <span className="grid gap-2">
                    <h3 className="titulo-item">{v.t}</h3>
                    <span className="text-tinta-2 max-w-[48ch]">{v.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="py-[var(--section-gap)] scroll-mt-16">
          <div className="contenedor rejilla gap-y-10">
            <h2 className="col-span-12 lg:col-span-4 titulo-seccion lg:sticky lg:top-28 self-start">Preguntas frecuentes</h2>
            <div className="col-span-12 lg:col-span-7 lg:col-start-6 border-t border-tinta">
              {PREGUNTAS.map(([p, r]) => (
                <details key={p} className="group border-b border-linea">
                  <summary className="flex items-center justify-between gap-6 cursor-pointer list-none py-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {p}<CaretDown size={20} className="shrink-0 text-gris transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                  </summary>
                  <p className="pb-6 text-gris leading-relaxed max-w-[60ch]">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="border-t border-linea py-[var(--section-gap-s)] scroll-mt-16">
          <div className="contenedor rejilla gap-y-10 items-start">
            <div className="col-span-12 lg:col-span-5 grid gap-6 lg:sticky lg:top-28">
              <h2 className="titulo-seccion">Pide tarifas o una demostración</h2>
              <p className="lead">Te enviamos los precios y, si quieres, te lo enseñamos funcionando con tu propio stock.</p>
            </div>
            <div className="col-span-12 lg:col-span-6 lg:col-start-7"><FormularioInfo /></div>
          </div>
        </section>
      </main>

      <footer className="bg-tinta text-sobre-marca">
        <div className="contenedor py-16 grid gap-12">
          <p className="text-[length:var(--text-2xl)] font-semibold tracking-[-0.03em] max-w-[24ch] leading-tight">Consejo dermocosmético con el stock de tu farmacia.</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-sobre-marca/20 pt-6 text-sm">
            <Logo claro />
            <span className="text-sobre-marca-suave">© 2026 SkinRead</span>
            <Link href="/login" className="sm:ml-auto hover:underline underline-offset-4">Acceso farmacias</Link>
            <a href="#contacto" className="hover:underline underline-offset-4">Pedir información</a>
            <Link href="/privacidad" className="hover:underline underline-offset-4">Privacidad</Link>
            <Link href="/aviso-legal" className="hover:underline underline-offset-4">Aviso legal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
