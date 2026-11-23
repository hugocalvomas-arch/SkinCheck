// Resultado real de Perfect Corp sobre una cara generada con IA (mujer de unos 55 años, public/ejemplos/zonas/foto.webp), 23/11/2026.
// Escala 0 a 100, más alto = más marcado, con los cortes del informe de la clienta (Leve 25, Moderado 50, Marcado 70).
export const MEDIDAS: [string, number][] = [
  ['Firmeza', 43], ['Luminosidad', 40], ['Arrugas', 39], ['Hidratación', 39], ['Textura', 36], ['Manchas', 34],
  ['Poros', 33], ['Brillo', 31], ['Rojez', 27], ['Ojeras', 23], ['Acné', 12],
]
export const valor = (a: string) => MEDIDAS.find(([n]) => n === a)![1]
export const nivel = (v: number) => (v >= 70 ? 'Marcado' : v >= 50 ? 'Moderado' : v >= 25 ? 'Leve' : 'Bien')
export const GLOBAL = 68
export const EDAD = 61
export const PRIMERO = 'Firmeza y arrugas'
export const DESTACADAS = ['Firmeza', 'Arrugas']
