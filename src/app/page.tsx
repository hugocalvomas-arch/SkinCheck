import Link from 'next/link'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CaretDown, ChartLineUp, DeviceTablet, FileXls, Flask, LockKey, Repeat, Storefront } from '@phosphor-icons/react/dist/ssr'
import { AntesDespues } from '@/components/web/AntesDespues'
import { MiniInforme } from '@/components/web/MiniInforme'
import { FormularioInfo } from '@/components/web/FormularioInfo'
import { Logo } from '@/components/Logo'

export const metadata = {
  title: 'SkinCheck · Análisis de piel con IA para farmacias',
  description: 'Un iPad en el mostrador analiza la piel de tus clientas y recomienda una rutina con los productos que ya tienes.',
}

// Fotos del comparador: public/ejemplos/antes.jpg y despues.jpg (con permiso de la persona retratada)
const hayEjemplo = existsSync(join(process.cwd(), 'public/ejemplos/antes.jpg')) && existsSync(join(process.cwd(), 'public/ejemplos/despues.jpg'))

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
        <section className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-16 grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">El análisis de piel que vende tu dermocosmética</h1>
            <p className="text-lg md:text-xl text-gris max-w-[46ch] leading-relaxed">Un iPad en el mostrador analiza la piel de tus clientas y les recomienda una rutina con productos que ya tienes.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#contacto" className="btn btn-lg">Pedir información</a>
              <a href="#como" className="btn-sec btn-lg">Ver cómo funciona</a>
            </div>
          </div>
          <figure className="space-y-3 max-w-md md:ml-auto w-full">
            <AntesDespues antes={hayEjemplo ? '/ejemplos/antes.jpg' : undefined} despues={hayEjemplo ? '/ejemplos/despues.jpg' : undefined} />
            <figcaption className="text-sm text-gris">Desliza para comparar. La clienta ve cómo podría verse su piel con la rutina. Simulación orientativa generada con IA.</figcaption>
          </figure>
        </section>

        {/* La experiencia de la clienta */}
        <section id="como" className="bg-white border-y border-linea scroll-mt-16">
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
              <Flask size={32} className="text-marca" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">Criterio cosmético, multimarca</h3>
                <p className="text-gris">Ingredientes elegidos por evidencia: dosis, sinergias y ensayos del producto terminado.</p>
              </div>
            </article>
            <article className="tarjeta p-8 space-y-6">
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
            <article className="md:col-span-3 tarjeta p-8 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
              <LockKey size={32} className="text-marca" />
              <p className="text-lg"><span className="font-semibold">Privacidad por diseño.</span> <span className="text-gris">La farmacia no guarda fotos ni nombres de clientas, y la pantalla vuelve al inicio sola si nadie la toca.</span></p>
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
