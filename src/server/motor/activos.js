/* Motor v2 · Activos: cómo aparece cada uno en la lista de ingredientes, su clase de dosis y en qué estado
   está en un producto (declarada, probable por posición, no declarada, tras la línea del 1 %). */
"use strict";
const CFG = require("./config.js");
const n = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// clave → [fragmentos INCI, clase de dosis, nombre en llano]
const A = {
  retinal: [["retinal"], "muy_baja", "retinal"],
  retinol: [["retinol"], "media", "retinol"],
  esteres_retinilo: [["retinyl"], "media", "ésteres de retinilo"],
  hpr: [["hydroxypinacolone"], "muy_baja", "retinoide HPR"],
  bakuchiol: [["bakuchiol"], "media", "bakuchiol"],
  salicilico: [["salicylic acid", "betaine salicylate"], "media", "ácido salicílico"],
  lha: [["capryloyl salicylic"], "media", "LHA"],
  glicolico: [["glycolic acid"], "alta", "ácido glicólico"],
  lactico: [["lactic acid"], "alta", "ácido láctico"],
  mandelico: [["mandelic acid"], "alta", "ácido mandélico"],
  pha: [["gluconolactone", "lactobionic"], "alta", "PHA"],
  azelaico: [["azelaic acid"], "alta", "ácido azelaico"],
  niacinamida: [["niacinamide"], "alta", "niacinamida"],
  vitc_pura: [["ascorbic acid"], "alta", "vitamina C pura"],
  vitc_derivados: [["ascorbyl", "ethyl ascorbic", "tetrahexyldecyl ascorbate"], "alta", "vitamina C estable"],
  tranexamico: [["tranexamic", "tranexamate"], "alta", "ácido tranexámico"],
  thiamidol: [["thiazolyl resorcinol"], "muy_baja", "thiamidol"],
  arbutina: [["arbutin"], "alta", "arbutina"],
  kojico: [["kojic"], "media", "ácido kójico"],
  peptidos: [["peptide", "palmitoyl tri", "palmitoyl tetra", "palmitoyl penta", "acetyl hexa"], "muy_baja", "péptidos"],
  ceramidas: [["ceramide"], "media", "ceramidas"],
  colesterol: [["cholesterol"], "media", "colesterol"],
  pantenol: [["panthenol"], "alta", "pantenol"],
  hialuronico: [["hyaluron"], "media", "ácido hialurónico"],
  urea: [["urea"], "alta", "urea"],
  glicerina: [["glycerin"], "alta", "glicerina"],
  karite: [["butyrospermum"], "alta", "karité"],
  vaselina: [["petrolatum"], "alta", "vaselina"],
  dimeticona: [["dimethicone"], "alta", "dimeticona"],
  bisabolol: [["bisabolol"], "media", "bisabolol"],
  vitamina_e: [["tocopher"], "media", "vitamina E"],
  ferulico: [["ferulic"], "media", "ácido ferúlico"],
  cafeina: [["caffeine"], "alta", "cafeína"],
  centella: [["centella asiatica", "madecassoside", "asiaticoside", "madecassic", "asiatic acid"], "media", "centella"],
  escualano: [["squalane"], "media", "escualano"],
  ectoina: [["ectoin"], "media", "ectoina"],
  zinc: [["zinc pca", "zinc gluconate"], "media", "zinc"],
  perfume: [["parfum", "fragrance"], "-", "perfume"],
  alcohol: [["alcohol denat", "sd alcohol"], "-", "alcohol"],
  mentol: [["menthol", "camphor"], "-", "mentol o alcanfor"]
};
const EXCL = {
  salicilico: ["capryloyl", "ethylhexyl salicylate", "homosalate", "butyloctyl", "tridecyl"], retinol: ["retinyl"], retinal: ["retinaldehyde dimethyl"],
  urea: ["hydroxyethyl urea", "imidazolidinyl", "diazolidinyl", "polyurea"], vitc_pura: ["ethyl ascorbic", "ascorbyl"], glicerina: ["glyceryl"],
  mentol: ["dicamphor", "benzylidene camphor"], peptidos: [], lactico: []
};
const RETINOIDES = ["retinal", "retinol", "esteres_retinilo", "hpr"];
const ACIDOS = ["glicolico", "lactico", "mandelico", "pha", "salicilico", "lha"];
const nombre = k => (A[k] ? A[k][2] : k);

const _cache = new WeakMap();
/* Estado de cada activo presente en el producto. */
function estado(p){
  if(_cache.has(p)) return _cache.get(p);
  const inci = (p.inci_completo || []).map(n);
  const linea = (() => { const i = inci.findIndex(x => CFG.linea_1pct.some(l => x.includes(l))); return i < 0 ? null : i; })();
  const o = {};
  for(const k of Object.keys(A)){
    const es = x => A[k][0].some(f => x.includes(f)) && !(EXCL[k] || []).some(e => x.includes(e));
    const pos = inci.findIndex(es);
    const ficha = (p.activos || []).find(a => es(n(a.inci)));
    if(pos < 0 && !ficha) continue;
    const pct = ficha && ficha.pct_declarado != null ? +ficha.pct_declarado : null;
    const clase = A[k][1];
    let est;
    if(pct != null) est = "declarada";
    else if(clase === "alta") est = linea == null || pos < 0 ? "no_declarada" : pos < linea ? "probable" : "tras_linea";
    else est = "no_declarada";
    o[k] = {pct, estado: est, pos, rango_estimado: ficha && Array.isArray(ficha.pct_estimado) ? ficha.pct_estimado : null};
  }
  _cache.set(p, o);
  return o;
}
/* Está en la fórmula, en cualquier posición. Para vetos de seguridad. */
const lleva = (p, k) => !!estado(p)[k];
/* Está a dosis útil: declarada, probable, o de dosis media/muy baja (donde la posición no descarta). */
const aDosis = (p, k) => { const e = estado(p)[k]; return !!e && e.estado !== "tras_linea"; };

module.exports = {A, RETINOIDES, ACIDOS, nombre, estado, lleva, aDosis, n};
