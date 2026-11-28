import type { Metadata, Viewport } from 'next'
import { Demo } from './Demo'

export const metadata: Metadata = { title: 'SkinRead · Demo del resultado', robots: { index: false, follow: false } }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#ffffff' }

// Demostración del resultado del iPad con datos de ejemplo: cara generada con IA, mapas reales
// del análisis sobre esa cara y la rutina que da el motor con un stock de ejemplo. Sin datos de nadie.
export default function Pagina() {
  return <Demo />
}
