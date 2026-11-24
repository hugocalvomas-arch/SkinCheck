import { PaginaLegal } from '@/components/web/PaginaLegal'
import { TITULAR } from '@/lib/titular'
import { AVISO_DETALLE, MESES_RETENCION } from '@/lib/privacidad'

export const metadata = { title: 'Privacidad · SkinRead' }

// RGPD arts. 13 y 14 y LOPDGDD art. 11. Texto base pendiente de validar por el asesor legal.
export default function Privacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad" actualizado="24 de noviembre de 2026">
      <p>Esta página explica dos tratamientos distintos: los datos de quien nos escribe desde esta web (donde SkinRead es responsable) y los datos de las clientas que usan SkinRead en una farmacia (donde la responsable es la farmacia y SkinRead actúa por su cuenta).</p>

      <h2 id="web">1. Formulario de contacto de la web</h2>
      <ul>
        <li>Responsable: {TITULAR.nombre}, NIF {TITULAR.nif}, {TITULAR.domicilio}. Contacto: {TITULAR.email}.</li>
        <li>Datos: nombre, farmacia, email, teléfono y ciudad (opcionales), programa de gestión y mensaje.</li>
        <li>Finalidad: responder a tu solicitud y enviarte información comercial sobre SkinRead.</li>
        <li>Base legal: tu consentimiento (art. 6.1.a RGPD) y, para el envío de comunicaciones comerciales por email, el art. 21 de la LSSI. Puedes retirarlo cuando quieras escribiendo al email de contacto.</li>
        <li>Conservación: hasta que retires el consentimiento o, como máximo, 2 años desde el último contacto si no llegamos a trabajar juntos.</li>
        <li>Proveedores: Supabase (base de datos, Irlanda) y Vercel (servidor, Fráncfort), con contrato de encargo del tratamiento.</li>
        <li>No se ceden datos a terceros salvo obligación legal.</li>
      </ul>

      <h2 id="clientas">2. Clientas que usan SkinRead en una farmacia</h2>
      <ul>
        <li>Responsable: la farmacia donde se hace el análisis. Para ejercer tus derechos, dirígete a ella. SkinRead es su encargado del tratamiento (art. 28 RGPD) y no usa tus datos para fines propios.</li>
        <li>Datos: rango de edad, sexo, si estás embarazada o en lactancia, si sigues un tratamiento médico para la piel, cómo reacciona tu piel y, si haces la foto, las puntuaciones de su análisis. No se pide el nombre. La foto no se guarda, salvo que aceptes guardarla para la revisión.</li>
        <li>Finalidad: recomendarte una rutina con los productos disponibles en la farmacia.</li>
        <li>Conservación: las respuestas y puntuaciones se guardan sin nombre {MESES_RETENCION} meses y después se borran. Los enlaces a las imágenes del análisis se borran a las 24 horas.</li>
        <li>Código de revisión: no te identifica por sí solo. Con él puedes ver tu evolución o pedir que borremos tu foto en el iPad de la farmacia.</li>
        {AVISO_DETALLE.filter((t) => !t.startsWith('Puedes pedir')).map((t) => <li key={t}>{t}</li>)}
        <li>No se toman decisiones automatizadas con efectos jurídicos sobre ti: la recomendación es una propuesta que valoras tú con la farmacia.</li>
        <li>Menores: no se atiende a menores de 14 años sin un adulto (art. 7 LOPDGDD).</li>
      </ul>

      <h2>3. Tus derechos</h2>
      <p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad, y retirar tu consentimiento sin que afecte a lo hecho antes. Como no guardamos tu nombre, para localizar tus respuestas te pediremos tu código de revisión o, si no lo tienes, la fecha y la hora del análisis. Si crees que no se han respetado tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).</p>
    </PaginaLegal>
  )
}
