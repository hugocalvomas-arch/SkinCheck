// Análisis de la foto con un proveedor externo (Perfect Corp; Haut.AI como alternativa).
// La foto llega aquí, se envía al proveedor y no se guarda en ningún sitio: solo vuelven puntuaciones.
// Cambiar de proveedor = cambiar este archivo.

export type Puntuaciones = Record<string, number> // aspecto -> 0..100 (más alto = más marcado)

/** Aspecto de la foto -> problema del motor de Hugo, con el umbral por defecto. Se puede sobrescribir en la tabla umbrales_foto. */
export const UMBRALES_POR_DEFECTO: { aspecto: string; problema: string; umbral: number }[] = [
  { aspecto: 'acne', problema: 'P02', umbral: 60 },
  { aspecto: 'poros', problema: 'P07', umbral: 60 },
  { aspecto: 'brillo', problema: 'P06', umbral: 60 },
  { aspecto: 'manchas', problema: 'P12', umbral: 60 },
  { aspecto: 'tono', problema: 'P14', umbral: 60 },
  { aspecto: 'arrugas', problema: 'P17', umbral: 60 },
  { aspecto: 'firmeza', problema: 'P19', umbral: 60 },
  { aspecto: 'textura', problema: 'P20', umbral: 60 },
  { aspecto: 'rojez', problema: 'P23', umbral: 60 },
  { aspecto: 'hidratacion', problema: 'P29', umbral: 60 },
  { aspecto: 'ojeras', problema: 'P15', umbral: 60 },
]

export function problemasDesdeFoto(p: Puntuaciones, umbrales = UMBRALES_POR_DEFECTO) {
  return [...new Set(umbrales.filter((u) => (p[u.aspecto] ?? 0) >= u.umbral).map((u) => u.problema))]
}

export async function analizarFoto(jpegBase64: string): Promise<{ puntuaciones: Puntuaciones } | { error: string }> {
  const clave = process.env.PERFECTCORP_API_KEY
  if (!clave) return { error: 'El análisis con foto aún no está activado (falta la clave del proveedor). Sigue con el cuestionario.' }
  if (jpegBase64.length > 2_000_000) return { error: 'La foto es demasiado grande.' }
  // TODO(Perfect Corp): subir la imagen, lanzar la tarea de análisis de piel, esperar el resultado
  // y traducir sus aspectos a las claves de UMBRALES_POR_DEFECTO. Endpoints según su documentación
  // en cuanto haya clave para probar: no se programa a ciegas.
  return { error: 'El análisis con foto se está conectando. Sigue con el cuestionario.' }
}
