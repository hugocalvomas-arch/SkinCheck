// Marca: un dial de medida (la puntuación de la piel) junto al nombre.
export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg aria-hidden viewBox="0 0 24 24" className="w-6 h-6 shrink-0 -rotate-90">
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="3" className={claro ? 'stroke-sobre-marca-suave/40' : 'stroke-linea'} />
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="56.55" strokeDashoffset="14.7" className={claro ? 'stroke-sobre-marca' : 'stroke-marca'} />
      </svg>
      <span className={`text-[1.0625rem] font-semibold tracking-[-0.02em] ${claro ? 'text-sobre-marca' : 'text-tinta'}`}>SkinCheck</span>
    </span>
  )
}
