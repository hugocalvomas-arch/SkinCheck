/* eslint-disable @typescript-eslint/no-explicit-any */
/** Avisos de consulta del motor, sin repetir y los urgentes primero (decisión 12 de Hugo: imprescindibles en el iPad y en el PDF). */
export function textosConsulta(der: any): string[] {
  const l: { nivel?: string; texto?: string }[] = Array.isArray(der) ? der : []
  const orden = (n?: string) => (n === 'urgente' ? 0 : n === 'sin_rutina' || n === 'minima' ? 1 : 2)
  return [...new Set(l.filter((d) => d?.texto).sort((a, b) => orden(a.nivel) - orden(b.nivel)).map((d) => d.texto as string))]
}
