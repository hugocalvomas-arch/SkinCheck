// Textos y registro del consentimiento de la clienta. Un solo sitio para que el iPad, el mostrador
// y la web digan lo mismo. Si cambia algún texto, sube VERSION_CONSENTIMIENTO: cada consejo guarda
// la versión que aceptó la clienta (art. 7.1 RGPD: hay que poder demostrar el consentimiento).
// Los plazos y proveedores salen de la revisión del 24/11/2026; los debe validar el asesor legal.

export const VERSION_CONSENTIMIENTO = '2026-11-24.3'

/** Días que se guarda la foto para el antes y el después de la revisión (solo con permiso aparte). */
export const DIAS_FOTO = 35

/** Meses que se guardan las respuestas de salud y las puntuaciones antes de borrarlas (ver la migración de retención). */
export const MESES_RETENCION = 12

export type Consentimiento = { version: string; salud: true; foto: boolean; guardar_foto: boolean; fecha: string; via: 'kiosko' | 'mostrador' }

export function registroConsentimiento(foto: boolean, via: Consentimiento['via'], guardarFoto = false): Consentimiento {
  return { version: VERSION_CONSENTIMIENTO, salud: true, foto, guardar_foto: foto && guardarFoto, fecha: new Date().toISOString(), via }
}

/** Primera capa (art. 13 RGPD y art. 11 LOPDGDD): lo mínimo antes de preguntar nada. */
export const AVISO_INICIO = (farmacia: string) => [
  `${farmacia} es responsable de tus datos y los usa solo para recomendarte productos para tu piel.`,
  'Te preguntaremos si estás embarazada, si sigues un tratamiento médico y cómo reacciona tu piel. Son datos de salud: necesitamos tu permiso expreso.',
  `No pedimos tu nombre. Tus respuestas se guardan sin nombre ${MESES_RETENCION} meses y después se borran. Si haces la foto, te daremos un código para comparar tu piel en la revisión.`,
  'Puedes retirar tu permiso, pedir información o ejercer tus derechos en el mostrador.',
]

/** Segunda capa: el resto de la información obligatoria. */
export const AVISO_DETALLE = [
  'Base legal: tu consentimiento explícito (arts. 6.1.a y 9.2.a del RGPD). Si no aceptas, te atienden igual en el mostrador.',
  'SkinRead presta el servicio a la farmacia como encargado del tratamiento, con un contrato que le impide usar tus datos para otra cosa.',
  'Proveedores: Supabase (base de datos, Irlanda) y Vercel (servidor, Fráncfort). Si haces la foto, Perfect Corp (EE. UU.). Si pides el informe por email, Resend (EE. UU.). Las transferencias fuera de la UE se hacen con cláusulas contractuales tipo o el Marco de Privacidad UE-EE. UU.',
  'Puedes pedir acceso, rectificación, supresión, limitación u oposición, y retirar tu consentimiento en cualquier momento. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).',
  `Tu foto solo se guarda si lo aceptas aparte: ${DIAS_FOTO} días, para enseñarte el antes y el después en tu revisión. Solo se puede ver en esta farmacia con tu código y se borra sola. Puedes borrarla antes con tu código.`,
  'El análisis lo hace un sistema de inteligencia artificial. Es cosmético y orientativo: no es un diagnóstico médico ni decide nada por sí solo.',
]

/** Aviso antes de la foto. */
export const AVISO_FOTO = [
  'Ni la farmacia ni SkinRead guardan tu foto si no lo pides.',
  'La foto la analiza Perfect Corp, con servidores en EE. UU. Según su política, la borra en un plazo de 30 días.',
  'La IA mide el aspecto de la piel; no te identifica. La simulación del "después" también la genera una IA.',
]

export const AVISO_EMAIL = (conFoto: boolean) =>
  `Acepto recibir el informe en este email.${conFoto ? ' El PDF incluye mi foto.' : ''} Ni la farmacia ni SkinRead guardan el email; lo envía Resend (EE. UU.), que conserva un registro del envío.`

/** Permiso aparte (casilla sin marcar por defecto) para guardar la foto hasta la revisión. */
export const AVISO_GUARDAR_FOTO =
  `Guardar mi foto ${DIAS_FOTO} días para ver el antes y el después en mi revisión. Solo se puede ver en esta farmacia con mi código y se borra sola. Es opcional.`
