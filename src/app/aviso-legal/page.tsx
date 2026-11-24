import Link from 'next/link'
import { PaginaLegal } from '@/components/web/PaginaLegal'
import { TITULAR } from '@/lib/titular'

export const metadata = { title: 'Aviso legal · SkinRead' }

// Ley 34/2002 (LSSI), art. 10. Texto base pendiente de validar por el asesor legal.
export default function AvisoLegal() {
  return (
    <PaginaLegal titulo="Aviso legal" actualizado="24 de noviembre de 2026">
      <h2>Titular</h2>
      <ul>
        <li>Titular: {TITULAR.nombre}</li>
        <li>NIF: {TITULAR.nif}</li>
        <li>Domicilio: {TITULAR.domicilio}</li>
        <li>Email: {TITULAR.email}</li>
      </ul>
      <h2>Objeto</h2>
      <p>Esta web presenta SkinRead, un servicio de análisis cosmético de la piel con inteligencia artificial y recomendación de productos para farmacias. SkinRead no presta servicios médicos ni realiza diagnósticos: sus resultados son orientativos y no sustituyen la consulta con un profesional sanitario.</p>
      <h2>Uso de la web</h2>
      <p>Quien use esta web se compromete a hacerlo de forma lícita. El acceso al área de farmacias está reservado a usuarios autorizados.</p>
      <h2>Propiedad intelectual</h2>
      <p>Los textos, el diseño, el logotipo y el software de esta web pertenecen a su titular o se usan con licencia. No se pueden reproducir sin permiso.</p>
      <h2>Privacidad y cookies</h2>
      <p>El tratamiento de datos personales se explica en la <Link href="/privacidad">política de privacidad</Link>. Esta web solo usa cookies técnicas necesarias para iniciar sesión en el área de farmacias; no usa cookies de análisis ni de publicidad.</p>
      <h2>Legislación aplicable</h2>
      <p>Esta web se rige por la legislación española.</p>
    </PaginaLegal>
  )
}
