# DESIGN.md · Landing pública de SkinCheck (`/`)

> Instrumento clínico: blanco, preciso y medido. La página se lee como la hoja de resultados de un equipo de laboratorio bien diseñado, no como un folleto de software.

Alcance: solo la landing pública (`src/app/page.tsx`, `src/components/web/*`, `Logo.tsx`). El panel interno, el login y el modo iPad siguen con su sistema actual (`globals.css`: Geist + `--color-*`). Todos los tokens de este documento viven bajo el ámbito `.lp` (wrapper de la landing) con prefijo `--lp-`, para que nada se filtre a la app.

Versión 2 (23/11): sustituye a "Botica de laboratorio" (papel crema + serifa), descartada por Hugo por parecerse demasiado a la estética de Claude.

## 1. Tema visual y atmósfera

**Estilo:** Instrumento clínico (blanco clínico, tecnológico, medido).
**Palabras clave:** hoja de resultados, escala graduada, rejilla milimétrica, precisión, blanco, filete fino, datos tabulares, sobriedad.
**Tono:** riguroso, clínico y tecnológico, sin frialdad de hospital. NO startup de IA, NO spa de lujo, NO estética editorial crema.
**Sensación:** la pantalla de un equipo médico bien diseñado: todo alineado, todo medido, nada decorativo.

**Recursos de firma (solo de SkinCheck):**
1. **La hoja.** Bloque blanco con borde de 1 px, cabecera en gris clínico (qué es, para quién, fecha) y filas separadas por filetes. Cierra con un filete en tinta (como un total). Se usa para la lectura de piel del hero, la hoja INCI y la tarjeta de precio.
2. **La escala graduada.** Regla de 0 a 100 con marcas cada 10 y una aguja vertical en el valor. Verde cuando el valor es alto (lo que conviene trabajar), tinta cuando no. Sustituye a las barras redondeadas genéricas.
3. **La lámina técnica.** Ilustración SVG sobre rejilla milimétrica: círculos para poros, trazos para líneas. Sustituye fotos ausentes y da el estado sin fotos del comparador.
4. **La etiqueta de stock.** Pastilla pequeña en verde suave ("6 en stock") junto a cada producto: el diferencial hecho dato.

**Nivel de interacción:** L1+ (estático cuidado con 4 animaciones de entrada con intención). Sin dependencias: solo CSS.

## 2. Paleta y roles

```css
.lp {
  /* Fondos */
  --lp-blanco: #FFFFFF;        /* fondo de página */
  --lp-clinico: #F3F6F7;       /* bandas alternas, cabecera de hojas */
  --lp-tinta-fondo: #0E1A1F;   /* una banda oscura por página como mucho (el criterio) */

  /* Líneas */
  --lp-rejilla: #E6ECEE;       /* rejilla milimétrica, carril de escalas, filetes internos */
  --lp-linea: #D5DDE0;         /* bordes y separadores */
  --lp-linea-fuerte: #0E1A1F;  /* filete de sección y de total */

  /* Texto */
  --lp-tinta: #0E1A1F;         /* titulares y texto importante (17,7:1 sobre blanco) */
  --lp-tinta-2: #4A575D;       /* cuerpo secundario (7,5:1) */
  --lp-tinta-3: #66747A;       /* notas; solo sobre blanco y ≥ 13 px (4,8:1) */

  /* Acento único: verde SkinCheck (el mismo de la app) */
  --lp-verde: #0B6E5B;         /* CTA, enlaces, valores altos, stock (6,2:1; blanco encima 6,2:1) */
  --lp-verde-hover: #095C4C;
  --lp-verde-suave: #E4F1ED;   /* etiqueta de stock, foco, estados */

  /* RGB auxiliares */
  --lp-tinta-rgb: 14, 26, 31;
  --lp-verde-rgb: 11, 110, 91;

  /* Semánticos */
  --lp-ok: #0B6E5B;
  --lp-error: #A3341F;
  --lp-error-suave: #FBEAE5;
}
```

**Reglas de color**
- Todo color sale de un token `--lp-*`. Nada de hex en los componentes.
- Un solo acento: el verde de la marca, igual que en la app. Se usa para actuar (botones, enlaces, foco) y para el dato que importa (valor alto, stock).
- Una única banda oscura (`--lp-tinta-fondo`) en toda la página: la sección del criterio.
- Sin degradados, sin brillos, sin transparencias sobre imagen, sin fondos crema o beis.
- `--lp-tinta-3` solo sobre blanco. Sobre gris clínico, `--lp-tinta-2`.

## 3. Tipografía

```css
/* Cargadas con next/font/google en layout.tsx como variables, sin aplicarlas al body de la app */
--lp-display: var(--font-archivo), 'Helvetica Neue', Arial, sans-serif;   /* con font-variation-settings: 'wdth' 112 */
--lp-texto: var(--font-public-sans), 'Helvetica Neue', Arial, sans-serif;
```
Equivalente @import: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Public+Sans:wght@400..700&display=swap`

**Por qué este par:** Archivo semiexpandida (ancho 112) tiene el aire de la rotulación de un equipo o de un envase farmacéutico: técnica, ancha y firme, sin parecerse a Inter ni a Geist. Public Sans nació para webs de administración pública: neutra, muy legible a 16 px y con números claros. Las dos son sin serifa: el carácter lo pone el ancho de Archivo, no un contraste de estilos.

| Rol | Fuente | Tamaño (móvil → escritorio) | Peso | Interlínea | Tracking |
|---|---|---|---|---|---|
| H1 hero | Archivo, wdth 112 | 40 → 72 px `clamp(2.5rem, 1.5rem + 4.2vw, 4.5rem)` | 600 | 1.0 | -0.025em |
| H2 sección | Archivo, wdth 112 | 30 → 48 px `clamp(1.875rem, 1.3rem + 2.4vw, 3rem)` | 600 | 1.06 | -0.02em |
| H3 | Archivo, wdth 108 | 19 → 22 px | 600 | 1.25 | -0.01em |
| Entradilla | Public Sans | 18 → 20 px | 400 | 1.5 | 0 |
| Cuerpo | Public Sans | 16 → 17 px | 400 | 1.6 | 0 |
| Nota / etiqueta | Public Sans | 13 → 14 px | 500 | 1.4 | 0 |
| Cifras de medida | Public Sans, `tabular-nums` | según contexto | 600 | 1 | 0 |
| Número de sección | Archivo, wdth 112 | 14 px | 600 | 1 | 0 |

**Reglas tipográficas**
- Titulares, números de sección y nombres de hoja en Archivo; todo lo demás en Public Sans.
- Sin serifa y sin monoespaciada en ninguna parte. Las cifras usan `tabular-nums` de Public Sans.
- Sin etiquetas en mayúsculas, sin palabras en cursiva de acento, sin "eyebrows" encima del H1.
- Ancho de línea máximo 62 caracteres en cuerpo.
- Prohibidas: Inter, Geist, Fraunces, Instrument Serif, Playfair, Newsreader y cualquier monoespaciada.

## 4. Componentes

```css
/* Botón principal */
.lp-btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
  min-height:3rem; padding:0 1.375rem; border-radius:.25rem;
  background:var(--lp-verde); color:var(--lp-blanco); font:600 1rem/1 var(--lp-texto);
  transition: background-color 160ms cubic-bezier(.2,.7,.2,1), transform 120ms cubic-bezier(.2,.7,.2,1); }
.lp-btn:hover { background:var(--lp-verde-hover); }
.lp-btn:active { transform: translateY(1px); }
.lp-btn:focus-visible { outline:2px solid var(--lp-verde); outline-offset:3px; }
.lp-btn:disabled { opacity:.5; cursor:not-allowed; }

/* Botón secundario: contorno de 1 px, mismo alto */
.lp-btn-sec { display:inline-flex; align-items:center; justify-content:center; min-height:3rem; padding:0 1.25rem;
  border-radius:.25rem; border:1px solid var(--lp-linea); background:var(--lp-blanco); color:var(--lp-tinta); font:500 1rem/1 var(--lp-texto);
  transition:border-color 160ms ease-out, background-color 160ms ease-out; }
.lp-btn-sec:hover { border-color:var(--lp-tinta); }
.lp-btn-sec:active { background:var(--lp-clinico); }
.lp-btn-sec:focus-visible { outline:2px solid var(--lp-verde); outline-offset:3px; }

/* Enlace de texto */
.lp-enlace { color:var(--lp-verde); text-decoration:underline; text-underline-offset:.25em; text-decoration-thickness:1px; }
.lp-enlace:hover { color:var(--lp-verde-hover); }

/* Hoja (recurso de firma) */
.lp-hoja { background:var(--lp-blanco); border:1px solid var(--lp-linea); border-radius:.375rem; overflow:hidden; }
.lp-hoja-cab { display:flex; justify-content:space-between; padding:.75rem 1.25rem; background:var(--lp-clinico);
  border-bottom:1px solid var(--lp-linea); font:500 .8125rem var(--lp-texto); color:var(--lp-tinta-2); }
/* Filas: filete --lp-rejilla entre filas; total con filete --lp-linea-fuerte */

/* Etiqueta de stock */
.lp-stock { font:500 .8125rem var(--lp-texto); color:var(--lp-verde); background:var(--lp-verde-suave); padding:.125rem .5rem; border-radius:.1875rem; }

/* Campo de formulario */
.lp-campo { width:100%; min-height:3rem; padding:.75rem .875rem; border-radius:.25rem;
  background:var(--lp-blanco); border:1px solid var(--lp-linea); color:var(--lp-tinta); font:400 1rem var(--lp-texto); }
.lp-campo:hover { border-color:var(--lp-tinta-3); }
.lp-campo:focus { outline:none; border-color:var(--lp-verde); box-shadow:0 0 0 3px var(--lp-verde-suave); }
.lp-campo[aria-invalid="true"] { border-color:var(--lp-error); }
.lp-campo:disabled { background:var(--lp-clinico); }

/* Navegación: barra blanca opaca con filete inferior; enlaces en tinta-2, actual/hover en tinta */
/* Acordeón: filas separadas por filete, signo +/− dibujado con dos líneas (no icono), área táctil ≥ 48 px */
```

## 5. Composición y rejilla

- Contenedor: `max-width: 76rem` (1216 px), márgenes laterales 20 px (móvil), 32 px (tablet), 48 px (escritorio).
- Rejilla de 12 columnas, medianil de 24 px. Las secciones alternan composiciones: 7/5, 5/7, 4/8, ancho completo con índice. Nunca tres tarjetas iguales en fila.
- Escala de espaciado (rem): 0.25 · 0.5 · 0.75 · 1 · 1.5 · 2 · 3 · 4 · 6 · 8. Separación entre secciones: 6 rem en móvil, 8–9 rem en escritorio.
- Separadores: filete de 1 px `--lp-linea-fuerte` a ancho de contenedor, con el número de sección (01–08) en Archivo a la izquierda, como en un informe técnico.
- Radios: 4 px botones y campos, 6 px hojas, 0 en bandas. Nada de 16–32 px.
- La rejilla milimétrica (20 px, `--lp-rejilla`) solo aparece dentro de las láminas, nunca de fondo de página.

## 6. Profundidad

Casi plana: precisión antes que volumen.
```css
--lp-sombra-hoja: 0 24px 48px -28px rgba(var(--lp-tinta-rgb), .25);
```
- Solo las hojas del hero y del precio llevan sombra. Lo demás se separa con filetes y bandas de gris clínico.
- Sin glassmorphism, sin `backdrop-filter` (la cabecera es blanca y opaca).

## 7. Movimiento e interacción

Nivel L1+. Cuatro movimientos, todos dentro de `@media (prefers-reduced-motion: no-preference)`:
1. `sc-sube` (existe): entrada de los bloques del hero, 600 ms, `cubic-bezier(.16,1,.3,1)`, escalonado 70 ms.
2. `sc-barra` (existe, se adapta): la aguja se desliza por la escala hasta su valor, 900 ms, escalonado 50 ms.
3. `sc-escaneo` (existe, se reduce): una sola pasada de una línea fina sobre la lámina técnica del comparador al entrar en vista, no en bucle.
4. `sc-aro` (existe): se mantiene para la puntuación global del panel, convertido en arco de escala.

Interacción: hover de botón 160 ms; acordeón con altura animada vía `grid-template-rows` 220 ms; comparador arrastrable con puntero y teclado (flechas ±5, Mayús+flecha ±10, Inicio/Fin), sin bloquear el scroll vertical en móvil (`touch-action: pan-y`).
Con `prefers-reduced-motion: reduce`: todo aparece en su estado final, sin desplazamientos.

## 8. Sí y no

**Sí**
1. Una idea por sección y una composición distinta en cada una.
2. Mostrar el producto funcionando con datos de ejemplo, siempre rotulados como tales.
3. Escalas graduadas y cifras tabulares alineadas para todo lo que se mide.
4. Hablar de "lo que tienes en tu estantería" antes que de "IA".
5. Lámina técnica donde falte una foto, con un pie que diga qué foto irá ahí.
6. Áreas táctiles de 44 px como mínimo, también en el pie y en la casilla de consentimiento.
7. Un solo CTA principal por pantalla ("Pedir una demo").
8. Rotular cada simulación como simulación.

**No**
1. Ni Inter, ni Geist, ni monoespaciada, ni serifas editoriales, ni fondos crema.
2. Ni iconos dentro de cajitas, ni rejillas de iconos con título y descripción.
3. Ni degradados, ni glassmorphism, ni neón, ni sombras de plantilla.
4. Ni bento genérico, ni fila de "4 cifras grandes".
5. Ni etiquetas en mayúsculas, ni palabras en cursiva de acento, ni eyebrows.
6. Ni fotos de personas reales sacadas de internet, ni testimonios, logos de clientes, cifras de ventas o certificaciones inventadas.
7. Ni decir que el modelo de visión es propio.
8. Ni un hueco gris donde iría una imagen.

## 9. Responsive

| Punto | Ancho | Cambios |
|---|---|---|
| Móvil | < 640 px | Una columna. El hero muestra la hoja de lectura recortada justo debajo del CTA (la parte superior se ve en el primer pliegue a 390 × 844). CTA a ancho completo; el secundario es un enlace, así no hay dos botones de ancho distinto. Navegación: logo + "Acceso" + "Demo". |
| Tablet | 640–1023 px | Hero en una columna con la hoja a 80 % de ancho; secciones 5/7 se apilan con el texto primero. |
| Escritorio | ≥ 1024 px | Composición completa de 12 columnas. |
| Ancho | ≥ 1440 px | El contenedor se queda en 1216 px; las bandas llegan a los bordes. |

Áreas táctiles ≥ 44 × 44 px. Sin scroll horizontal a 320 px. El comparador conserva el scroll vertical con el dedo.

## 10. Referencias (se toma una idea de cada una, ninguna se replica)

| Referencia | Qué se toma | Dónde se usa |
|---|---|---|
| [Canfield VISIA](https://www.canfieldsci.com/imaging-systems/visia) | Comparador con indicación "Arrastra para comparar"; hoja de especificaciones | Sección 6 (6 semanas) y hoja de requisitos en la sección 8 |
| [Haut.AI](https://haut.ai/ai-skin-analysis-lp) | Flujo numerado de 4 pasos, un verbo por paso | Sección 2 (en el mostrador) |
| [Withings](https://www.withings.com) | Cada cifra con nota al pie que dice de dónde sale | Toda la página |
| [Mettler-Toledo](https://www.mt.com) | Garantías concretas en 3–4 puntos comprobables | Sección 7 (objeciones) |
| [Consoft / Farmatic](https://www2.consoft.es/) | Lenguaje de farmacia española; programas de gestión nombrados en texto (sin logos) | Sección 5 (stock) |
| [Haut.AI × Südameapteek](https://haut.ai/blogs/sudameapteek-partners-haut) | Formato de caso real: datos de la farmacia + una cita | Hueco reservado; solo se publica con un piloto real |

Lo que **no** se toma: muros de logos de clientes, cifras de conversión sin fuente, premios, vídeos en bucle y carruseles.
