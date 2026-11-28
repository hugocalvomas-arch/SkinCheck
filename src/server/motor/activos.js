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
  mentol: [["menthol", "camphor"], "-", "mentol o alcanfor"],
  // Hito 1, propuesta 11 (Hugo, 27/11): aceites esenciales, dentro del sistema de fragancias. Se detectan por la planta + «oil» (ver AE_PLANTAS);
  // no se tratan como un «parfum» en todo: solo cuentan con piel que reacciona, rojez fija o intolerancia al perfume declarada, y se nombra cuál lleva
  aceite_esencial: [[], "-", "aceites esenciales"]
};
// Plantas de aceite esencial (Diccionario de Ingredientes Cosméticos, Carrasco 2009; alérgenos del Reglamento (UE) 2023/1545). Los aceites vegetales
// fijos (semilla, hueso, fruto, nuez, germen) no son aceite esencial y no cuentan.
const AE_PLANTAS = ["lavandula", "citrus", "mentha", "melaleuca", "eucalyptus", "rosmarinus", "pelargonium", "cymbopogon", "salvia", "thymus", "origanum", "cananga",
  "jasminum", "santalum", "boswellia", "cupressus", "juniperus", "pogostemon", "anthemis", "chamomilla", "rosa damascena", "rosa centifolia", "litsea", "abies", "pinus",
  "foeniculum", "illicium", "cinnamomum", "syzygium", "eugenia caryophyllus", "myrtus", "vetiveria", "cedrus", "ocimum", "coriandrum", "elettaria", "zingiber", "laurus",
  "pimpinella", "michelia", "osmanthus"];
// laboratorio (27/11, C081): algunos INCI parten el nombre por una coma («Melaleuca», «Alternifolia Leaf Oil»); se une con el siguiente si este termina el nombre
const unirPartidos = l => l.map((x, i) => !/\boil\b/.test(x) && l[i + 1] && /^[a-z]+( [a-z]+)? oil\b/.test(l[i + 1]) && !/\(|\)/.test(l[i + 1]) ? x + " " + l[i + 1] : x);
const esAceiteEsencial = x => /\boil\b/.test(x) && AE_PLANTAS.some(g => x.includes(g)) && !/seed oil|kernel oil|fruit oil|nut oil|germ oil|hydrogenated|sulfonated/.test(x);
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
    const es = k === "aceite_esencial" ? esAceiteEsencial : x => A[k][0].some(f => x.includes(f)) && !(EXCL[k] || []).some(e => x.includes(e));
    const pos = (k === "aceite_esencial" ? unirPartidos(inci) : inci).findIndex(es);
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

/* Aceites esenciales que lleva, por su nombre INCI (para nombrarlos en el motivo y en el aviso). */
const aceitesEsenciales = p => { const l = p.inci_completo || [], u = unirPartidos(l.map(n)); return l.map((x, i) => u[i] !== n(x) ? x + " " + l[i + 1] : x).filter((x, i) => esAceiteEsencial(u[i])); };

module.exports = {A, RETINOIDES, ACIDOS, nombre, estado, lleva, aDosis, n, aceitesEsenciales};
