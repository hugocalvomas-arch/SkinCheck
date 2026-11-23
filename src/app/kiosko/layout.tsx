import type { Metadata, Viewport } from 'next'
import { Fraunces } from 'next/font/google'

const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', axes: ['opsz'] })

export const metadata: Metadata = {
  title: 'SkinCheck · Análisis de piel',
  appleWebApp: { capable: true, title: 'SkinCheck', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#14110f' }

export default function KioskoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} min-h-dvh bg-[#14110f] text-[#f5efe6] select-none`}>{children}</div>
}
