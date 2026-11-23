import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'SkinCheck · Análisis de piel',
  appleWebApp: { capable: true, title: 'SkinCheck', statusBarStyle: 'default' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#ffffff' }

// Modo iPad: tema claro fijo, aspecto clínico. Fuente: Geist (cargada en el layout raíz).
export default function KioskoLayout({ children }: { children: React.ReactNode }) {
  return <div className="kiosko min-h-[100dvh] bg-papel text-tinta font-sans select-none">{children}</div>
}
