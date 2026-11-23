# Vídeo del análisis de la portada

Composición de [HyperFrames](https://hyperframes.heygen.com) (HTML + GSAP → MP4). Datos e imágenes: resultado real de la API sobre la cara de ejemplo.

Renderizar (local, gratis):

```bash
cd video/analisis
npx hyperframes@0.9.85 render -f 30 -q high -o salida.mp4
ffmpeg -i salida.mp4 -vf scale=1440:-2 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart -an ../../public/ejemplos/video/analisis.mp4
```
