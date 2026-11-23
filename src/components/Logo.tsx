export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-7 h-7 rounded-md grid place-items-center text-sm font-semibold ${claro ? 'bg-white text-marca' : 'bg-marca text-white'}`}>S</span>
      <span className={`font-semibold tracking-tight ${claro ? 'text-white' : 'text-tinta'}`}>SkinCheck</span>
    </span>
  )
}
