// Datos de ejemplo de una lectura, con los mismos cortes que el informe de la clienta (Leve 25, Moderado 50, Marcado 70).
export const MEDIDAS: [string, number][] = [
  ['Poros', 72], ['Brillo', 61], ['Rojez', 48], ['Textura', 41], ['Manchas', 33], ['Hidratación', 29],
  ['Luminosidad', 26], ['Ojeras', 22], ['Arrugas', 17], ['Firmeza', 14], ['Acné', 9],
]
export const valor = (a: string) => MEDIDAS.find(([n]) => n === a)![1]
export const nivel = (v: number) => (v >= 70 ? 'Marcado' : v >= 50 ? 'Moderado' : v >= 25 ? 'Leve' : 'Bien')
export const GLOBAL = 74
export const EDAD = 31
export const PRIMERO = 'Poros y brillo'
