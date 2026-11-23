// Escala que ve la clienta: la de Perfect Corp tal cual (su ui_score), 0 a 100, más alto = piel en mejor estado.
// Internamente el motor trabaja con la intensidad (100 - nota) para ordenar qué tratar primero.
export const notaPiel = (intensidad: number) => Math.round(Math.max(0, Math.min(100, 100 - intensidad)))
export const nivelPiel = (nota: number) => (nota >= 75 ? 'Bien' : nota >= 50 ? 'Leve' : nota >= 30 ? 'Moderado' : 'Marcado')
/** Por debajo de 50 se resalta como algo a trabajar */
export const aTrabajar = (nota: number) => nota < 50
