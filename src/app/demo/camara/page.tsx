import type { Metadata, Viewport } from 'next'
import { DemoCamara } from './DemoCamara'

export const metadata: Metadata = { title: 'SkinRead · Demo de la cámara', robots: { index: false, follow: false } }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#ffffff' }

// Prueba de la foto automática del iPad. La foto no sale del dispositivo: no se analiza ni se envía a ningún sitio.
export default function Pagina() {
  return <DemoCamara />
}
