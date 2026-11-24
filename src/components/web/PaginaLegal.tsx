import Link from 'next/link'
import { Logo } from '@/components/Logo'

export function PaginaLegal({ titulo, actualizado, children }: { titulo: string; actualizado: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-papel">
      <header className="contenedor py-6"><Link href="/" aria-label="Volver a la web"><Logo /></Link></header>
      <main className="contenedor pb-20">
        <article className="max-w-[70ch] grid gap-5 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:grid [&_ul]:gap-1.5 [&_a]:underline [&_a]:underline-offset-4">
          <h1 className="text-[2.25rem] leading-tight">{titulo}</h1>
          <p className="text-sm text-gris">Última actualización: {actualizado}</p>
          {children}
        </article>
      </main>
    </div>
  )
}
