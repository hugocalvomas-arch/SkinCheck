import Link from 'next/link'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ArrowsInLineVertical, CaretDown, ChartLineUp, CirclesThree, Crosshair, DeviceTablet, DotsNine, Drop, DropHalf, Eye, FileXls, Grains, Hourglass, LockKey, Repeat, ShieldCheck, Storefront, Sun, ThermometerSimple, Waves, CircleHalf } from '@phosphor-icons/react/dist/ssr'
import { PanelAnalisis } from '@/components/web/PanelAnalisis'
import { AntesDespues } from '@/components/web/AntesDespues'
import { MiniInforme } from '@/components/web/MiniInforme'
import { FormularioInfo } from '@/components/web/FormularioInfo'
import { Logo } from '@/components/Logo'

export const metadata = {
  title: 'SkinCheck · Análisis de piel con IA para farmacias',
  description: 'Análisis facial con IA en el mostrador: 11 parámetros de la piel, simulación del antes y después y una rutina con el stock de tu farmacia.',
}

// Fotos del comparador: public/ejemplos/antes.jpg y despues.jpg (con permiso de la persona retratada)
const hayEjemplo = existsSync(join(process.cwd(), 'public/ejemplos/antes.jpg')) && existsSync(join(process.cwd(), 'public/ejemplos/despues.jpg'))

const MIDE = [
  [DotsNine, 'Poros', 'Tamaño y visibilidad en nariz, mejillas y frente.'],
  [DropHalf, 'Brillo', 'Exceso de sebo por zonas.'],
  [CircleHalf, 'Manchas', 'Hiperpigmentación y manchas solares.'],
  [Sun, 'Luminosidad', 'Uniformidad del tono y falta de brillo sano.'],
  [Waves, 'Arrugas', 'Líneas finas y arrugas de expresión.'],
  [ArrowsInLineVertical, 'Firmeza', 'Pérdida de tono en óvalo y mejillas.'],
  [Grains, 'Textura', 'Rugosidad e irregularidad de la superficie.'],
  [ThermometerSimple, 'Rojez', 'Enrojecimiento difuso o localizado.'],
  [Drop, 'Hidratación', 'Nivel de agua aparente en la piel.'],
  [Eye, 'Ojeras', 'Color e intensidad bajo los ojos.'],
  [CirclesThree, 'Acné', 'Granos e imperfecciones visibles.'],
] as const

const ACTIVOS: [string, string][] = [
  ['Niacinamida', 'Niacinamide'], ['Retinal', 'Retinal'], ['Ácido azelaico', 'Azelaic Acid'], ['Ácido tranexámico', 'Tranexamic Acid'], ['Ácido salicílico', 'Salicylic Acid'],
  ['Vitamina C', 'Ascorbic Acid'], ['Ceramidas', 'Ceramide NP'], ['Péptidos', 'Palmitoyl Tripeptide'], ['Pantenol', 'Panthenol'], ['Ácido hialurónico', 'Sodium Hyaluronate'],
]

const PREGUNTAS: [string, string][] = [
  ['¿Tengo que comprar algún aparato?', 'No. Funciona en el navegador de cualquier iPad con cámara frontal. Lo dejas en el mostrador y listo.'],
  ['¿Funciona con mi programa de gestión?', 'Exportas el stock en Excel o CSV desde Farmatic, Nixfarma, Unycop u otro programa y lo subes. SkinCheck reconoce las columnas y recuerda tu formato para la próxima vez.'],
  ['¿Qué pasa con las fotos de las clientas?', 'La farmacia no guarda fotos ni nombres. La foto se envía al servicio de análisis, que la elimina tras un periodo limitado. Solo quedan puntuaciones anónimas.'],
  ['¿Es un diagnóstico médico?', 'No. Es un análisis cosmético orientativo. Si las respuestas indican algo que necesita consulta, la pantalla lo recomienda en lugar de vender.'],
  ['¿Puedo cobrar el análisis a la clienta?', 'Sí, lo decides tú. Puedes cobrarlo como servicio, descontarlo de la compra o regalarlo.'],
  ['¿Cuánto cuesta?', 'Una cuota mensual por farmacia, sin permanencia. Déjanos tus datos y te enviamos las tarifas.'],
]

export default function Inicio() {
  return (
    <div className="bg-fondo">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-linea">
        <nav className="max-w-6xl mx-auto h-16 px-5 md:px-8 flex items-center gap-6">
          <Link href="/" aria-label="SkinCheck, inicio"><Logo /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gris">
            <a href="#como" className="hover:text-tinta">Cómo funciona</a>
            <a href="#ventajas" className="hover:text-tinta">Para tu farmacia</a>
            <a href="#preguntas" className="hover:text-tinta">Preguntas</a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="btn-sec hidden sm:inline-flex">Acceso farmacias</Link>
            <a href="#contacto" className="btn">Pedir información</a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
          <div className="space-y-6 sc-sube">
            <p className="font-mono text-sm text-marca">Dermocosmética asistida por IA</p>
            <h1 className="text-4xl md:text-[3.5rem] font-semibold tracking-tight leading-[1.05]">Análisis de piel con IA en tu mostrador</h1>
            <p className="text-lg md:text-xl text-gris max-w-[44ch] leading-relaxed">Una foto en el iPad. La IA mide 11 parámetros de la piel y propone una rutina con tu stock.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#contacto" className="btn btn-lg">Pedir información</a>
              <a href="#como" className="btn-sec btn-lg">Ver cómo funciona</a>
            </div>
          </div>
          <div className="sc-sube" style={{ ['--i' as string]: 2 }}><PanelAnalisis /></div>
        </section>

        {/* Cifras del producto */}
        <section className="border-y border-linea bg-white">
          <dl className="max-w-6xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4">
            {[
              ['11', 'parámetros de la piel medidos en cada foto'],
              ['4', 'preguntas de seguridad antes de recomendar'],
              ['3', 'rutinas por clienta, con productos de tu stock'],
              ['0', 'fotos o nombres guardados en la farmacia'],
            ].map(([n, t], k) => (
              <div key={t} className={`py-8 md:py-10 pr-6 ${k % 2 ? 'pl-6 border-l' : ''} ${k === 2 ? 'md:pl-6 md:border-l' : ''} ${k > 1 ? 'border-t md:border-t-0' : ''} border-linea`}>
                <dt className="sr-only">{t}</dt>
                <dd className="font-mono text-4xl md:text-5xl font-semibold text-marca num">{n}</dd>
                <dd className="mt-2 text-sm text-gris max-w-[24ch]">{t}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Qué mide */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-20 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Qué mide la IA en cada rostro</h2>
            <p className="text-lg text-gris">Visión artificial entrenada para dermocosmética. Cada parámetro sale con una puntuación de 0 a 100 y su zona marcada sobre la cara.</p>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-linea border border-linea rounded-2xl overflow-hidden">
            {MIDE.map(([Icono, t, d]) => (
              <li key={t} className="bg-white p-5 md:p-6 space-y-3">
                <Icono size={26} className="text-marca" />
                <p className="font-medium">{t}</p>
                <p className="text-sm text-gris leading-relaxed">{d}</p>
              </li>
            ))}
            <li className="bg-marca text-white p-5 md:p-6 space-y-3">
              <Hourglass size={26} />
              <p className="font-medium">Edad de la piel</p>
              <p className="text-sm text-white/85 leading-relaxed">Y una puntuación global que sirve de punto de partida para el seguimiento.</p>
            </li>
          </ul>
        </section>

        {/* Antes y después */}
        <section className="bg-white border-y border-linea">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 grid md:grid-cols-[1fr_1.1fr] gap-12 items-center">
            <figure className="space-y-3 max-w-md w-full">
              <AntesDespues escaneo antes={hayEjemplo ? '/ejemplos/antes.jpg' : undefined} despues={hayEjemplo ? '/ejemplos/despues.jpg' : undefined} />
              <figcaption className="text-sm text-gris">Desliza para comparar. Simulación orientativa generada con IA.</figcaption>
            </figure>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Su piel hoy y cómo podría verse con la rutina</h2>
              <p className="text-lg text-gris leading-relaxed max-w-[52ch]">La IA genera una simulación a partir de su propia foto, ajustada a lo que la rutina trabaja. Es lo que convierte un análisis en una compra.</p>
              <ul className="grid gap-4">
                {[
                  [Crosshair, 'Sobre su cara, no sobre una modelo', 'Misma foto, mismo encuadre y misma luz.'],
                  [ShieldCheck, 'Etiquetada como simulación', 'Siempre indica que es una imagen generada con IA.'],
                  [Repeat, 'Comparación real a las 6 semanas', 'La clienta repite el análisis y ve su evolución.'],
                ].map(([I, t, d]) => {
                  const Icono = I as typeof Crosshair
                  return (
                    <li key={t as string} className="grid grid-cols-[2.5rem_1fr] gap-3">
                      <span className="w-10 h-10 rounded-xl bg-marca-suave text-marca grid place-items-center"><Icono size={20} /></span>
                      <span><span className="block font-medium">{t as string}</span><span className="block text-sm text-gris">{d as string}</span></span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* La experiencia de la clienta */}
        <section id="como" className="scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 grid md:grid-cols-[1fr_1.05fr] gap-14 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Así lo vive tu clienta</h2>
              <ol className="space-y-6">
                {[
                  ['Se ve en la pantalla y se anima', 'El iPad muestra su cara en vivo. Es lo que hace que se acerque.'],
                  ['Responde 4 preguntas de seguridad', 'Edad, embarazo, tratamientos médicos y sensibilidad. Nada más.'],
                  ['Se hace una foto guiada', 'La IA mide 11 aspectos: poros, manchas, rojeces, arrugas, hidratación y más.'],
                  ['Recibe su informe y su rutina', 'Ve su antes y después, los ingredientes que necesita y qué usar de mañana y de noche.'],
                ].map(([t, d], k) => (
                  <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-4">
                    <span className="w-10 h-10 rounded-full bg-marca-suave text-marca grid place-items-center font-semibold num">{k + 1}</span>
                    <span><span className="block text-lg font-medium">{t}</span><span className="block text-gris">{d}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="max-w-lg w-full md:ml-auto">
              <MiniInforme />
              <p className="text-sm text-gris mt-3">Pantalla real del informe, con datos de ejemplo.</p>
            </div>
          </div>
        </section>

        {/* Criterio cosmético */}
        <section className="bg-marca-suave">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 space-y-10">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Criterio cosmético, no catálogo de marca</h2>
              <p className="text-lg text-gris">El motor lee la lista INCI de cada producto y evalúa 37 activos por su posición, la dosis declarada y los ensayos del producto terminado.</p>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ACTIVOS.map(([n, inci]) => (
                <li key={n} className="rounded-xl bg-white/80 border border-marca/10 px-4 py-4">
                  <p className="font-medium">{n}</p>
                  <p className="font-mono text-xs text-gris mt-1">{inci}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* En la farmacia */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-20 space-y-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">En tu farmacia, listo en una tarde</h2>
          <ol className="relative grid md:grid-cols-3 gap-10 md:gap-6">
            <span aria-hidden className="hidden md:block absolute top-6 left-6 right-6 h-px bg-linea" />
            {[
              { i: <FileXls size={24} />, t: 'Sube tu stock', d: 'El Excel o CSV que exporta tu programa de gestión. Reconocemos las columnas solos.' },
              { i: <DeviceTablet size={24} />, t: 'Abre el modo iPad', d: 'Un enlace en el navegador. Lo dejas en el mostrador, a la vista.' },
              { i: <ChartLineUp size={24} />, t: 'Mira qué vende', d: 'Análisis hechos, rutinas vendidas y venta estimada, mes a mes.' },
            ].map((p) => (
              <li key={p.t} className="relative space-y-3">
                <span className="relative w-12 h-12 rounded-xl bg-white border border-linea text-marca grid place-items-center">{p.i}</span>
                <p className="text-xl font-medium">{p.t}</p>
                <p className="text-gris max-w-[34ch]">{p.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Ventajas */}
        <section id="ventajas" className="max-w-6xl mx-auto px-5 md:px-8 pb-20 scroll-mt-16 space-y-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Hecho para vender bien, no para vender más de la cuenta</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <article className="md:col-span-2 rounded-2xl bg-marca text-white p-8 flex flex-col justify-between gap-10 min-h-64">
              <Storefront size={32} />
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">Solo recomienda lo que tienes en la estantería</h3>
                <p className="text-white/85 max-w-[52ch]">La rutina se calcula con tu stock y tus precios. Tres opciones para cada clienta: básica, media y completa.</p>
              </div>
            </article>
            <article className="tarjeta p-8 flex flex-col justify-between gap-10">
              <ChartLineUp size={32} className="text-marca" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">Ves lo que vende</h3>
                <p className="text-gris">Cuántas clientas se analizan, cuántas compran y qué rutina eligen.</p>
              </div>
            </article>
            <article className="md:col-span-2 rounded-2xl bg-marca-suave p-8 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
              <Repeat size={40} className="text-marca" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">Vuelve a las 6 semanas</h3>
                <p className="text-gris max-w-[56ch]">La clienta repite el análisis y compara su piel con la del primer día. Tú ganas otra visita y la reposición.</p>
              </div>
            </article>
            <article className="tarjeta p-8 flex flex-col justify-between gap-10">
              <LockKey size={32} className="text-marca" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">Privacidad por diseño</h3>
                <p className="text-gris">Sin fotos ni nombres en la farmacia. La pantalla vuelve al inicio sola.</p>
              </div>
            </article>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="bg-white border-y border-linea scroll-mt-16">
          <div className="max-w-3xl mx-auto px-5 md:px-8 py-20 space-y-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Preguntas frecuentes</h2>
            <div className="divide-y divide-linea border-y border-linea">
              {PREGUNTAS.map(([p, r]) => (
                <details key={p} className="group py-5">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-lg font-medium">
                    {p}<CaretDown size={20} className="shrink-0 text-gris transition-transform duration-150 group-open:rotate-180" />
                  </summary>
                  <p className="pt-3 text-gris leading-relaxed max-w-[65ch]">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="max-w-6xl mx-auto px-5 md:px-8 py-20 grid md:grid-cols-[1fr_1.3fr] gap-12 items-start scroll-mt-16">
          <div className="space-y-5 md:sticky md:top-24">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Pide tarifas o una demostración</h2>
            <p className="text-lg text-gris leading-relaxed">Te enviamos los precios y, si quieres, te lo enseñamos funcionando con tu propio stock.</p>
          </div>
          <FormularioInfo />
        </section>
      </main>

      <footer className="border-t border-linea bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-wrap items-center gap-6 text-sm text-gris">
          <Logo />
          <span>© 2026 SkinCheck</span>
          <Link href="/login" className="ml-auto hover:text-tinta">Acceso farmacias</Link>
          <a href="#contacto" className="hover:text-tinta">Pedir información</a>
        </div>
      </footer>
    </div>
  )
}
