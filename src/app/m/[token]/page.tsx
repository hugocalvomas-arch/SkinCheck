import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { FotoMovil } from './FotoMovil'

export const metadata: Metadata = { title: 'SkinRead · Foto con el móvil', robots: { index: false, follow: false } }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#ffffff' }

async function Contenido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <FotoMovil token={token} />
}

// Página que abre el QR de la pantalla de la farmacia: la misma cámara automática del iPad.
export default function Pagina({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Contenido params={params} />
    </Suspense>
  )
}
