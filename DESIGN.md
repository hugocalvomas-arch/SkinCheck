# DESIGN.md · Landing pública de SkinCheck (`/`)

> Botica de laboratorio: rigor de ficha técnica sobre papel cálido. La página se lee como una etiqueta bien hecha, no como un folleto de software.

Alcance: solo la landing pública (`src/app/page.tsx`, `src/components/web/*`, `Logo.tsx`). El panel interno, el login y el modo iPad siguen con su sistema actual (`globals.css`: Geist + `--color-*`). Todos los tokens de este documento viven bajo el ámbito `.lp` (wrapper de la landing) con prefijo `--lp-`, para que nada se filtre a la app.

## 1. Tema visual y atmósfera

**Estilo:** Botica de laboratorio (editorial clínico, papel y tinta).
**Palabras clave:** ficha técnica, papel cálido, tinta, filete fino, escala graduada, etiqueta de botica, sobriedad, cercanía.
**Tono:** riguroso y cercano. NO startup de IA, NO spa de lujo, NO hospital frío.
**Sensación:** como abrir el cuaderno de laboratorio de una farmacia que cuida su lineal de dermo: todo medido, todo anotado, nada gritado.

**Recursos de firma (solo de SkinCheck):**
1. **La ficha.** Bloque con doble filete superior (1 px + 3 px de aire + 1 px), campos numerados y pie con fecha o lote. Se usa para la ficha de consejo del hero, la ficha INCI y la tarjeta de precio. Inspirada en la etiqueta de una fórmula magistral.
2. **La escala graduada.** Regla de 0 a 100 con marcas cada 10 y marca larga cada 50. Sustituye a las barras redondeadas genéricas en la lectura de la piel.
3. **La lámina.** Ilustración en línea fina (SVG) de la superficie de la piel vista de cerca: puntos para poros, trazos para líneas. Sustituye fotos ausentes y da el estado sin fotos del comparador.

**Nivel de interacción:** L1+ (estático cuidado con 4 animaciones de entrada con intención). Sin dependencias: solo CSS y un IntersectionObserver mínimo si hace falta.

## 2. Paleta y roles

```css
.lp {
  /* Fondos */
  --lp-papel: #F5F1E8;        /* fondo de página: papel cálido */
  --lp-papel-claro: #FBF9F4;  /* fichas y superficies */
  --lp-papel-hondo: #EAE3D5;  /* bandas alternas, carril de escalas */
  --lp-tinta-fondo: #1B2420;  /* una banda oscura por página como mucho (el criterio) */

  /* Filetes */
  --lp-filete: #D9D1C1;       /* separadores y bordes */
  --lp-filete-fuerte: #1B2420;/* doble filete de las fichas */

  /* Texto */
  --lp-tinta: #1B2420;        /* titulares y texto importante (14,1:1 sobre papel) */
  --lp-tinta-2: #545B55;      /* cuerpo secundario (6,2:1) */
  --lp-tinta-3: #63675F;      /* notas y pies; solo ≥ 14 px (5,2:1) */

  /* Acento: verde frasco (acción) */
  --lp-verde: #1F5144;        /* CTA, enlaces, estados activos (8,0:1 sobre papel; blanco encima 9,1:1) */
  --lp-verde-hover: #163D33;
  --lp-verde-suave: #DDE6DF;  /* fondos de estado, foco */

  /* Marca de medida: arcilla (tono piel) */
  --lp-arcilla: #9C4426;      /* señala lo medido: marca en la escala, activo resaltado (5,7:1) */
  --lp-arcilla-suave: #F0DCD0;

  /* RGB auxiliares */
  --lp-tinta-rgb: 27, 36, 32;
  --lp-verde-rgb: 31, 81, 68;
  --lp-papel-rgb: 245, 241, 232;

  /* Semánticos */
  --lp-ok: #1F5144;
  --lp-error: #8E2F1F;
  --lp-error-suave: #F6E1DA;
}
```

**Reglas de color**
- Todo color sale de un token `--lp-*`. Nada de hex en los componentes.
- El verde es para actuar (botones, enlaces, foco). La arcilla es para medir (la marca en la escala, el activo resaltado). Nunca se intercambian.
- Una única banda oscura (`--lp-tinta-fondo`) en toda la página: la sección del criterio.
- Sin degradados, sin brillos, sin transparencias sobre imagen, sin blanco puro como fondo de página.
- Texto `--lp-tinta-3` solo a partir de 14 px. Por debajo, `--lp-tinta-2`.

## 3. Tipografía

```css
/* Cargadas con next/font/google en layout.tsx como variables, sin aplicarlas al body de la app */
--lp-serif: var(--font-newsreader), 'Iowan Old Style', Georgia, serif;
--lp-sans: var(--font-schibsted), 'Helvetica Neue', Arial, sans-serif;
```
Equivalente @import: `https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..600&family=Schibsted+Grotesk:wght@400..700&display=swap`

**Por qué este par:** Newsreader es una serifa de prensa con tamaño óptico: a 72 px se vuelve fina y editorial, a 16 px es robusta. Da rigor de publicación sin el aire "artesano blando" de Fraunces. Schibsted Grotesk nació para un periódico: grotesca con carácter, números claros y una "g" de dos pisos; nada que ver con Inter o Geist.

| Rol | Fuente | Tamaño (móvil → escritorio) | Peso | Interlínea | Tracking |
|---|---|---|---|---|---|
| H1 hero | Newsreader (opsz 72) | 40 → 76 px `clamp(2.5rem, 1.4rem + 4.6vw, 4.75rem)` | 400 | 1.02 | -0.02em |
| H2 sección | Newsreader (opsz 60) | 32 → 52 px `clamp(2rem, 1.4rem + 2.4vw, 3.25rem)` | 400 | 1.06 | -0.015em |
| H3 | Schibsted Grotesk | 19 → 21 px | 600 | 1.3 | -0.005em |
| Entradilla | Newsreader (opsz 20) | 19 → 22 px | 400 | 1.45 | 0 |
| Cuerpo | Schibsted Grotesk | 16 → 17 px | 400 | 1.6 | 0 |
| Etiqueta de campo / nota | Schibsted Grotesk | 13 → 14 px | 500 | 1.4 | 0.01em |
| Cifras de medida | Schibsted Grotesk, `tabular-nums` | según contexto | 500 | 1 | 0 |
| INCI | Newsreader (opsz 14) | 15 px | 400 | 1.5 | 0 |

**Reglas tipográficas**
- Titulares en serifa, todo lo demás en grotesca. La serifa nunca va en botones ni formularios.
- Sin monoespaciada en ningún sitio. Las cifras usan `tabular-nums` de Schibsted.
- Sin etiquetas en mayúsculas, sin palabras en cursiva de acento, sin "eyebrows" encima del H1.
- Ancho de línea máximo 62 caracteres en cuerpo y 18 palabras en titulares.
- Prohibidas: Inter, Geist, Fraunces, Instrument Serif, Playfair, cualquier monoespaciada.

## 4. Componentes

```css
/* Botón principal */
.lp-btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
  min-height:3rem; padding:0 1.375rem; border-radius:.375rem;
  background:var(--lp-verde); color:var(--lp-papel-claro); font:500 1rem/1 var(--lp-sans);
  transition: background-color 160ms cubic-bezier(.2,.7,.2,1), transform 120ms cubic-bezier(.2,.7,.2,1); }
.lp-btn:hover { background:var(--lp-verde-hover); }
.lp-btn:active { transform: translateY(1px); }
.lp-btn:focus-visible { outline:2px solid var(--lp-verde); outline-offset:3px; }
.lp-btn:disabled { opacity:.5; cursor:not-allowed; }

/* Botón secundario: texto con filete inferior, no caja */
.lp-enlace { color:var(--lp-tinta); text-decoration:underline; text-decoration-color:var(--lp-filete);
  text-underline-offset:.3em; text-decoration-thickness:1px; transition:text-decoration-color 160ms ease-out; }
.lp-enlace:hover { text-decoration-color:var(--lp-tinta); }
.lp-enlace:focus-visible { outline:2px solid var(--lp-verde); outline-offset:3px; border-radius:2px; }

/* Ficha (recurso de firma) */
.lp-ficha { background:var(--lp-papel-claro); border:1px solid var(--lp-filete); border-radius:.25rem;
  box-shadow: inset 0 3px 0 -2px var(--lp-filete-fuerte), inset 0 6px 0 -5px var(--lp-filete-fuerte); }
/* Campos de la ficha: fila con número de campo a la izquierda (01, 02…) en tinta-3 y valor a la derecha */

/* Campo de formulario */
.lp-campo { width:100%; min-height:3rem; padding:.75rem .875rem; border-radius:.25rem;
  background:var(--lp-papel-claro); border:1px solid var(--lp-filete); color:var(--lp-tinta); font:400 1rem var(--lp-sans); }
.lp-campo:hover { border-color:var(--lp-tinta-3); }
.lp-campo:focus { outline:none; border-color:var(--lp-verde); box-shadow:0 0 0 3px var(--lp-verde-suave); }
.lp-campo[aria-invalid="true"] { border-color:var(--lp-error); }
.lp-campo:disabled { background:var(--lp-papel-hondo); }

/* Navegación: barra de papel con filete inferior; enlaces en tinta-2, actual/hover en tinta */
/* Acordeón: filas separadas por filete, signo +/− dibujado con dos líneas (no icono), área táctil ≥ 48 px */
```

## 5. Composición y rejilla

- Contenedor: `max-width: 76rem` (1216 px), márgenes laterales 20 px (móvil), 32 px (tablet), 48 px (escritorio).
- Rejilla de 12 columnas, medianil de 24 px. Las secciones alternan composiciones: 7/5, 5/7, 4/8, ancho completo con índice. Nunca tres tarjetas iguales en fila.
- Escala de espaciado (rem): 0.25 · 0.5 · 0.75 · 1 · 1.5 · 2 · 3 · 4 · 6 · 8. Separación entre secciones: 6 rem en móvil, 8–9 rem en escritorio.
- Separadores: filete de 1 px `--lp-filete` a ancho de contenedor, con el número de sección (01–08) en tinta-3 a la izquierda, como en una ficha técnica.
- Radios: 4 px fichas y campos, 6 px botones, 0 en bandas. Nada de 16–32 px.

## 6. Profundidad

Casi plana: el papel no flota.
```css
--lp-sombra-ficha: 0 1px 0 rgba(var(--lp-tinta-rgb), .04), 0 12px 32px -20px rgba(var(--lp-tinta-rgb), .22);
```
- Solo las fichas del hero y del precio llevan `--lp-sombra-ficha`. Lo demás se separa con filetes y papel hondo.
- Sin glassmorphism, sin `backdrop-filter` (la cabecera es papel opaco).

## 7. Movimiento e interacción

Nivel L1+. Cuatro movimientos, todos dentro de `@media (prefers-reduced-motion: no-preference)`:
1. `sc-sube` (existe): entrada de los bloques del hero, 600 ms, `cubic-bezier(.16,1,.3,1)`, escalonado 70 ms.
2. `sc-barra` (existe, se adapta): la marca de arcilla se desliza por la escala hasta su valor, 900 ms, escalonado 50 ms.
3. `sc-escaneo` (existe, se reduce): una sola pasada de una línea fina sobre la lámina del comparador al entrar en vista, no en bucle.
4. `sc-aro` (existe): se mantiene para la puntuación global del panel, convertido en arco de escala.

Interacción: hover de botón 160 ms; acordeón con altura animada vía `grid-template-rows` 220 ms; comparador arrastrable con puntero y teclado (flechas ±5, Mayús+flecha ±10, Inicio/Fin), sin bloquear el scroll vertical en móvil (`touch-action: pan-y`).
Con `prefers-reduced-motion: reduce`: todo aparece en su estado final, sin desplazamientos.

## 8. Sí y no

**Sí**
1. Una idea por sección y una composición distinta en cada una.
2. Mostrar el producto funcionando con datos de ejemplo, siempre rotulados como tales.
3. Escalas graduadas y cifras alineadas para todo lo que se mide.
4. Hablar de "lo que tienes en tu estantería" antes que de "IA".
5. Ilustración en línea fina donde falte una foto, con un pie que diga qué foto irá ahí.
6. Áreas táctiles de 44 px como mínimo, también en el pie y en la casilla de consentimiento.
7. Un solo CTA principal por pantalla ("Pedir una demo").
8. Rotular cada simulación como simulación.

**No**
1. Ni Inter, ni Geist, ni monoespaciada, ni Fraunces.
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
| Móvil | < 640 px | Una columna. El hero muestra la ficha de consejo recortada justo debajo del CTA (la parte superior se ve en el primer pliegue a 390 × 844). CTA a ancho completo; el secundario es un enlace, así no hay dos botones de ancho distinto. Navegación: logo + "Acceso" + "Demo". |
| Tablet | 640–1023 px | Hero en una columna con la ficha a 80 % de ancho; secciones 5/7 se apilan con el texto primero. |
| Escritorio | ≥ 1024 px | Composición completa de 12 columnas. |
| Ancho | ≥ 1440 px | El contenedor se queda en 1216 px; las bandas llegan a los bordes. |

Áreas táctiles ≥ 44 × 44 px. Sin scroll horizontal a 320 px. El comparador conserva el scroll vertical con el dedo.
