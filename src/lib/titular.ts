// Datos del titular de la web (LSSI art. 10 y RGPD art. 13). Se rellenan en Vercel, sin tocar código:
// TITULAR_NOMBRE, TITULAR_NIF, TITULAR_DOMICILIO y CONTACTO_PRIVACIDAD (email para ejercer derechos).
const falta = 'pendiente de completar'
export const TITULAR = {
  nombre: process.env.TITULAR_NOMBRE || `[Titular: ${falta}]`,
  nif: process.env.TITULAR_NIF || `[NIF: ${falta}]`,
  domicilio: process.env.TITULAR_DOMICILIO || `[Domicilio: ${falta}]`,
  email: process.env.CONTACTO_PRIVACIDAD || `[Email de contacto: ${falta}]`,
}
