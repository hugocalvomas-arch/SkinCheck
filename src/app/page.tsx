import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-semibold">SkinCheck</h1>
        <p className="text-neutral-600">Consejo dermocosmético con el stock real de tu farmacia.</p>
        <Link href="/app" className="inline-block bg-neutral-900 text-white rounded-lg px-5 py-2.5">Entrar</Link>
      </div>
    </main>
  )
}
