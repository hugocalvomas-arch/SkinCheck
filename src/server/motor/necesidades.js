/* SkinRead · Paso 1: qué ingredientes necesita esta piel (Hugo, 24/11/2026, decisiones de arquitectura A.2).
   Tabla ingrediente × aspecto de la foto con un peso por evidencia (0-3). Cada ingrediente suma puntos de TODAS las notas a la vez,
   así ganan los que resuelven varias cosas. La necesidad de cada aspecto se mide DENTRO de la persona: sus notas más bajas mandan
   aunque sean 62. La gravedad absoluta (bandas Bien / Leve / Moderado / Marcado) sigue decidiendo dosis, vetos y avisos en el motor.
   Las respuestas del iPad no suman: bloquean (vetos del motor) o restan (PENALIZACIONES).
   Determinista y sin dependencias. La tabla se edita en necesidades.json; el Excel de OUTPUTS sale de ese archivo. */
"use strict";
const T = require("./necesidades.json");

const ASPECTOS = ["arrugas", "manchas", "textura", "rojez", "brillo", "firmeza", "hidratacion", "poros", "ojeras", "acne", "tono"];
const BANDA = T.banda_duda;   // ±3 puntos: dentro de la banda de un umbral se elige la opción prudente

/** Necesidad de cada aspecto, de 0 a 1, relativa a la propia persona. */
function necesidades(notas){
  const ref = T.referencia_sana;                       // por encima de esta nota el aspecto no pide nada
  const gap = {};
  for(const a of ASPECTOS) gap[a] = typeof notas[a] === "number" ? Math.max(0, ref - notas[a]) : 0;
  const max = Math.max(0, ...Object.values(gap));
  const out = {};
  for(const a of ASPECTOS) out[a] = max > 0 ? Math.round(Math.pow(gap[a] / max, T.exponente) * 1000) / 1000 : 0;
  return out;
}

/** Multiplicador por las respuestas del iPad y por la foto (penalizaciones; los vetos los aplica el motor). */
function penalizacion(k, r, notas, c){
  let f = 1; const por = [];
  for(const p of T.penalizaciones){
    if(!p.factor[k]) continue;
    let si = false;
    if(p.si === "reactiva_a_veces") si = r.reactiva === "a_veces";
    else if(p.si === "reactiva_siempre") si = r.reactiva === "siempre";
    else if(p.si === "rojez_baja") si = typeof notas.rojez === "number" && notas.rojez < 55 + BANDA;
    else if(p.si === "hidratacion_baja") si = typeof notas.hidratacion === "number" && notas.hidratacion < 55 + BANDA;
    else if(p.si === "menor_25") si = ["14-17", "18-24"].includes(r.edad_tramo || r.edad);
    else if(p.si === "brillo_alto") si = typeof notas.brillo === "number" && notas.brillo <= 60 + BANDA;
    else if(p.si === "piel_madura") si = (typeof notas.arrugas === "number" && notas.arrugas < 60) || (typeof notas.firmeza === "number" && notas.firmeza < 60);
    if(si){ f *= p.factor[k]; por.push(p.texto); }
  }
  return {f, por};
}

/**
 * Puntuación de cada ingrediente para esta piel: Σ peso(ingrediente, aspecto) × necesidad(aspecto), por la penalización.
 * @returns {{necesidad: Record<string, number>, ranking: {k: string, nombre: string, clase: string, puntos: number, bruto: number, porque: {aspecto: string, aporte: number}[], penaliza: string[], vetado: string|null}[], max: number}}
 */
function puntuarIngredientes(notas, r = {}, veto = {}, c = {}){
  const nec = necesidades(notas || {});
  const ranking = [];
  for(const [k, ing] of Object.entries(T.ingredientes)){
    const porque = [];
    let bruto = 0;
    for(const [a, w] of Object.entries(ing.pesos)){ const ap = w * (nec[a] || 0); if(ap > 0){ bruto += ap; porque.push({aspecto: a, aporte: Math.round(ap * 100) / 100}); } }
    const pe = penalizacion(k, r, notas || {}, c);
    const vet = veto[k] || null;
    const puntos = vet ? 0 : Math.round(bruto * pe.f * 100) / 100;
    porque.sort((x, y) => y.aporte - x.aporte);
    ranking.push({k, nombre: ing.nombre, clase: ing.clase, puntos, bruto: Math.round(bruto * 100) / 100, porque, penaliza: pe.por, vetado: vet});
  }
  ranking.sort((a, b) => b.puntos - a.puntos || a.k.localeCompare(b.k));
  const max = Math.max(0.0001, ...ranking.map(x => x.puntos));
  return {necesidad: nec, ranking, max};
}

/** Clase del activo según la dosis: el azelaico cosmético (<15 %) y la urea <10 % cuentan como soporte. */
function claseCon(k, pct){
  const ing = T.ingredientes[k]; if(!ing) return null;
  if(ing.tratamiento_desde != null) return pct != null && pct >= ing.tratamiento_desde ? "tratamiento" : "soporte";
  return ing.clase;
}

module.exports = {necesidades, puntuarIngredientes, claseCon, TABLA: T, BANDA, ASPECTOS};
