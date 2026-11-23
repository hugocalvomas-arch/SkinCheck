// Resultado real de Perfect Corp sobre una cara generada con IA (public/ejemplos/cara-ia-analisis.jpg), 23/11/2026.
// Escala 0 a 100, más alto = más marcado, con los cortes del informe de la clienta (Leve 25, Moderado 50, Marcado 70).
export const MEDIDAS: [string, number][] = [
  ['Textura', 35], ['Brillo', 33], ['Rojez', 32], ['Ojeras', 31], ['Poros', 30], ['Hidratación', 30],
  ['Manchas', 25], ['Arrugas', 23], ['Firmeza', 22], ['Luminosidad', 20], ['Acné', 9],
]
export const valor = (a: string) => MEDIDAS.find(([n]) => n === a)![1]
export const nivel = (v: number) => (v >= 70 ? 'Marcado' : v >= 50 ? 'Moderado' : v >= 25 ? 'Leve' : 'Bien')
export const GLOBAL = 74
export const EDAD = 37
export const PRIMERO = 'Textura y brillo'
export const DESTACADAS = ['Textura', 'Brillo']
