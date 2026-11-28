'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Logo } from '@/components/Logo'
import { Camara, Estilos } from '@/app/kiosko/[id]/Kiosko'
import { enlaceVivo, subirFotoMovil } from './actions'

type Estado = 'comprobando' | 'camara' | 'enviando' | 'enviada' | 'caducado' | 'error'

export function FotoMovil({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>('comprobando')
  const [vuelta, setVuelta] = useState(0)

  useEffect(() => { enlaceVivo(token).then((ok) => setEstado(ok ? 'camara' : 'caducado')) }, [token])

  async function enviar(b64: string) {
    setEstado('enviando')
    const r = await subirFotoMovil(token, b64).catch(() => ({ ok: false }))
    if (r.ok) return setEstado('enviada')
    // Si el enlace ha caducado o ya se usó, no se reintenta
    setEstado((await enlaceVivo(token)) ? 'error' : 'caducado')
  }

  return (
    <div className="kiosko min-h-[100dvh] bg-papel text-tinta font-sans select-none flex flex-col">
      <Estilos />
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-[var(--k-line)] bg-papel">
        <Logo />
        <span className="text-sm text-[var(--k-muted)] pl-3 border-l border-[var(--k-line)]">Foto con tu móvil</span>
      </header>
      <main className="flex-1 flex">
        {estado === 'camara' && <Camara key={vuelta} error="" onFoto={(b64) => enviar(b64)} />}
        {estado !== 'camara' && (
          <div className="w-full max-w-md mx-auto px-6 py-12 flex flex-col items-start justify-center gap-5">
            {estado === 'comprobando' && <p className="texto">Abriendo la cámara…</p>}
            {estado === 'enviando' && <p className="texto">Enviando la foto a la pantalla de la farmacia…</p>}
            {estado === 'enviada' && (<>
              <CheckCircle size={56} weight="fill" className="text-[var(--k-accent)]" />
              <h1 className="text-[2rem] leading-[1.05] font-semibold">Foto enviada</h1>
              <p className="texto m-0">Ya puedes volver a la pantalla de la farmacia: allí sigue tu análisis. En este móvil no se guarda nada.</p>
            </>)}
            {estado === 'caducado' && (<>
              <WarningCircle size={56} className="text-[var(--k-warn)]" />
              <h1 className="text-[2rem] leading-[1.05] font-semibold">Este código ya no sirve</h1>
              <p className="texto m-0">Caduca a los 10 minutos y solo vale para una foto. Pide otro código en la pantalla de la farmacia.</p>
            </>)}
            {estado === 'error' && (<>
              <WarningCircle size={56} className="text-[var(--k-warn)]" />
              <h1 className="text-[2rem] leading-[1.05] font-semibold">No se ha podido enviar</h1>
              <p className="texto m-0">Revisa la conexión del móvil y vuelve a hacer la foto.</p>
              <button onClick={() => { setVuelta((v) => v + 1); setEstado('camara') }} className="boton w-full">Repetir la foto</button>
            </>)}
          </div>
        )}
      </main>
    </div>
  )
}
