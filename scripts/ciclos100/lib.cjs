/* eslint-disable @typescript-eslint/no-require-imports */
/* Ciclos de 100 casos (24/11/2026): generador de clientas, ejecución del motor real como en el iPad,
   revisión automática de dermofarmacia (CRÍTICO / GRAVE / MENOR) y prueba de ±3 puntos.
   No llama a ninguna API: las notas son simuladas. */
"use strict";
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const fresh = () => { for(const k of Object.keys(require.cache)) if(k.includes(path.join(ROOT, "src", "server", "motor"))) delete require.cache[k]; };
function cargar(){
  fresh();
  const motor = require(path.join(ROOT, "src/server/motor/motor.js"));
  const RF = require(path.join(ROOT, "src/server/motor/reglasFoto.js"));
  const AC = require(path.join(ROOT, "src/server/motor/activos.js"));
  const { TODOS } = require(path.join(ROOT, "src/server/motor/catalogo.js"));
  const LISTA = TODOS.filter(p => !p.retirado && !p.sin_verificar && !p.fuera_farmacia && p.pvp_eur != null);
  return { motor, RF, AC, LISTA, POR: new Map(LISTA.map(p => [p.id, p])) };
}
const ASP = ["arrugas", "manchas", "textura", "rojez", "brillo", "firmeza", "hidratacion", "poros", "ojeras", "acne", "tono"];
const EDAD_MOTOR = { "25-34": "25-39", "35-44": "25-39", "45-54": "40-49", "55+": "50+", "55-64": "50+", "65+": "50+" };
const NIVELES = [["basica", 3, "alto"], ["media", 4, "alto"], ["completa", 5, "alto"]];

/* ---------------------------------------------------------------- generador */
function rng(seed){ let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const ARQ = [
  { k: "acne_joven", bajos: { acne: [52, 66], brillo: [52, 66], poros: [55, 68], textura: [58, 72] }, edades: ["14-17", "18-24", "25-34"] },
  { k: "mixta_grasa", bajos: { brillo: [50, 64], poros: [52, 66], textura: [60, 74] }, edades: ["18-24", "25-34", "35-44", "45-54"] },
  { k: "deshidratada", bajos: { hidratacion: [50, 64], tono: [58, 72], textura: [60, 74] }, edades: ["25-34", "35-44", "45-54"] },
  { k: "madura", bajos: { arrugas: [52, 66], firmeza: [52, 66], manchas: [58, 72], hidratacion: [56, 70] }, edades: ["45-54", "55-64", "65+"] },
  { k: "manchas", bajos: { manchas: [50, 64], tono: [56, 70] }, edades: ["25-34", "35-44", "45-54", "55-64"] },
  { k: "rojez", bajos: { rojez: [50, 64], hidratacion: [58, 72] }, edades: ["25-34", "35-44", "45-54", "55-64"] },
  { k: "casi_perfecta", bajos: {}, edades: ["18-24", "25-34", "35-44"] },
  { k: "ojeras_apagada", bajos: { ojeras: [52, 64], tono: [58, 70] }, edades: ["25-34", "35-44", "45-54"] },
  { k: "textura_poros", bajos: { textura: [52, 64], poros: [54, 66], tono: [60, 72] }, edades: ["25-34", "35-44", "45-54"] },
  { k: "acne_adulto", bajos: { acne: [54, 66], manchas: [58, 70], rojez: [60, 72] }, edades: ["25-34", "35-44"] },
];
const UMBRALES = [50, 55, 60, 65, 70, 75];
/** 10 casos del ciclo n. Deterministas: el mismo ciclo da siempre los mismos casos. */
function generarCiclo(nc){
  if(nc >= 11) return generarCiclo2(nc);
  const R = rng(9000 + nc * 7919), pick = a => a[Math.floor(R() * a.length)], ent = (a, b) => a + Math.floor(R() * (b - a + 1));
  const arqs = ARQ.slice().sort(() => R() - .5);
  const bajos = new Set([Math.floor(R() * 10)]); if(R() < .5) bajos.add((Math.floor(R() * 9) + 1 + [...bajos][0]) % 10);
  const limite = [...Array(10).keys()].find(i => !bajos.has(i) && i === (nc * 3) % 10) ?? [...Array(10).keys()].find(i => !bajos.has(i));
  const out = [];
  for(let i = 0; i < 10; i++){
    const a = arqs[i];
    const edad = pick(a.edades);
    const sexo = R() < (a.k === "mixta_grasa" ? .5 : .3) ? "hombre" : "mujer";
    const edadNum = { "14-17": 16, "18-24": 21, "25-34": 30, "35-44": 40, "45-54": 50, "55-64": 60, "65+": 70 }[edad];
    const notas = {};
    for(const k of ASP) notas[k] = ent(72, 90);
    // la edad baja arrugas y firmeza; las ojeras y el tono varían
    if(edadNum >= 40){ notas.arrugas = Math.min(notas.arrugas, ent(60, 78)); notas.firmeza = Math.min(notas.firmeza, ent(62, 80)); }
    if(edadNum >= 55){ notas.arrugas = Math.min(notas.arrugas, ent(55, 70)); notas.firmeza = Math.min(notas.firmeza, ent(55, 70)); notas.manchas = Math.min(notas.manchas, ent(60, 76)); }
    for(const [k, [lo, hi]] of Object.entries(a.bajos)) notas[k] = ent(lo, hi);
    if(a.k === "casi_perfecta") for(const k of ASP) notas[k] = ent(74, 92);
    if(a.k === "mixta_grasa" || a.k === "acne_joven") notas.hidratacion = ent(66, 86);
    // ruido realista: una nota cualquiera algo más baja
    const extra = pick(ASP); notas[extra] = Math.min(notas[extra], ent(62, 76));
    const c = { id: `C${String(nc).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`, ciclo: nc, arquetipo: a.k, edad, sexo, embarazo: "no", receta: "no", reactiva: "nunca", retinoide: "nunca", notas, limite: null };
    // condiciones
    const fertil = sexo === "mujer" && ["18-24", "25-34", "35-44"].includes(edad);
    if(fertil && R() < .22) c.embarazo = R() < .5 ? "embarazo" : "lactancia";
    if(R() < .1) c.receta = "si";
    { const x = R(); c.reactiva = x < .6 ? "nunca" : x < .9 ? "a_veces" : "siempre"; }
    if(a.k === "rojez" && c.reactiva === "nunca" && R() < .5) c.reactiva = "a_veces";
    { const x = R(); if(edad !== "14-17" && c.embarazo === "no" && c.receta !== "si") c.retinoide = x < .6 ? "nunca" : x < .8 ? "reciente" : "tolera"; }
    // casos con alguna nota por debajo de 50 (1 o 2 por ciclo)
    if(bajos.has(i)){ const ks = Object.keys(a.bajos).length ? Object.keys(a.bajos) : ASP; const k = pick(ks); notas[k] = ent(32, 48); if(R() < .4){ const k2 = pick(ASP.filter(x => x !== k)); notas[k2] = ent(40, 49); } c.bajo = true; }
    else for(const k of ASP) notas[k] = Math.max(notas[k], 50);
    out.push(c);
  }
  // caso límite: nota a 1 punto de un umbral, o una condición de seguridad
  const L = out[limite], tipo = nc % 5;
  if(tipo === 0){ const k = Object.keys(ARQ.find(x => x.k === L.arquetipo).bajos)[0] || "manchas"; const u = pick(UMBRALES); L.notas[k] = u - 1; L.limite = `${k} = ${u - 1}, a 1 punto del umbral ${u}`; }
  else if(tipo === 1){ L.sexo = "mujer"; L.edad = pick(["25-34", "35-44"]); L.embarazo = "embarazo"; L.retinoide = "nunca"; L.notas.manchas = pick([59, 60, 64, 69, 70]); L.limite = `embarazo con manchas ${L.notas.manchas}`; }
  else if(tipo === 2){ L.edad = "14-17"; L.embarazo = "no"; L.retinoide = "nunca"; L.notas.acne = pick([49, 50, 54, 55, 64, 65]); L.notas.brillo = Math.min(L.notas.brillo, 62); L.limite = `menor con imperfecciones ${L.notas.acne}`; }
  else if(tipo === 3){ L.receta = "si"; L.retinoide = "nunca"; const k = pick(["acne", "rojez", "manchas"]); L.notas[k] = pick([50, 54, 55]); L.limite = `receta con ${k} ${L.notas[k]}`; }
  else { L.reactiva = "siempre"; const k = pick(["arrugas", "rojez", "manchas", "acne"]); L.notas[k] = pick([49, 50, 54, 55, 59, 60]); L.limite = `reactividad «siempre» con ${k} ${L.notas[k]}`; if(L.notas[k] < 50) L.bajo = true; }
  // un segundo límite de umbral en otro caso
  { const j = (limite + 5) % 10, C2 = out[j]; if(!C2.limite){ const ks = ASP.filter(k => C2.notas[k] < 78); const k = ks.length ? pick(ks) : "tono"; const u = pick([55, 60, 65, 70]); C2.notas[k] = R() < .5 ? u - 1 : u; C2.limite = `${k} = ${C2.notas[k]}, en el umbral ${u}`; } }
  // ningún caso fuera de banda: como mucho 2 con alguna nota < 50
  const conBajo = out.filter(c => ASP.some(k => c.notas[k] < 50));
  for(const c of conBajo.slice(2)) for(const k of ASP) c.notas[k] = Math.max(c.notas[k], 50);
  return out;
}


/* Serie 2 (ciclos 11-20, Hugo 24/11): población más variada de farmacia. Cada perfil fija edad, sexo, condiciones y notas
   correlacionadas como pasarían de verdad; la mayoría de notas 55-90 y 1-2 casos por ciclo con alguna <50. */
const PERFILES = [
  { k: "adolescente_acne", w: 3, edades: ["14-17"], hombre: .55, bajos: { acne: [50, 64], brillo: [48, 62], poros: [55, 68], textura: [60, 74] }, reactiva: [.75, .2] },
  { k: "joven_acne_inflamado", w: 3, edades: ["18-24"], hombre: .45, bajos: { acne: [50, 60], brillo: [52, 66], rojez: [58, 70], manchas: [62, 74] }, receta: .2, ret: [.6, .25] },
  { k: "joven_marcas_postacne", w: 2, edades: ["18-24", "25-34"], hombre: .35, bajos: { manchas: [52, 64], textura: [56, 68], acne: [62, 74] } },
  { k: "joven_seca_deshidratada", w: 2, edades: ["18-24", "25-34"], hombre: .3, bajos: { hidratacion: [50, 62], textura: [60, 72], rojez: [62, 74] }, reactiva: [.5, .35] },
  { k: "mixta_poros_brillo", w: 2, edades: ["25-34", "35-44"], hombre: .45, bajos: { brillo: [50, 62], poros: [52, 64], textura: [60, 72] } },
  { k: "hombre_afeitado_rojez", w: 2, edades: ["25-34", "35-44", "45-54"], hombre: 1, bajos: { rojez: [54, 66], textura: [58, 70], acne: [64, 76] }, reactiva: [.5, .4] },
  { k: "rojez_sensible", w: 2, edades: ["35-44", "45-54", "55-64"], hombre: .2, bajos: { rojez: [50, 62], hidratacion: [56, 68] }, reactiva: [.15, .5] },
  { k: "barrera_atopica", w: 1, edades: ["18-24", "25-34", "35-44", "65+"], hombre: .35, bajos: { hidratacion: [48, 60], rojez: [54, 66], textura: [58, 70] }, reactiva: [.1, .4] },
  { k: "melasma_embarazo", w: 1, edades: ["25-34", "35-44"], hombre: 0, bajos: { manchas: [50, 64], tono: [56, 68] }, embarazo: .7 },
  { k: "ojeras_cansancio", w: 2, edades: ["25-34", "35-44"], hombre: .35, bajos: { ojeras: [50, 62], tono: [60, 70] } },
  { k: "prevencion_casi_perfecta", w: 2, edades: ["25-34", "35-44"], hombre: .35, bajos: {}, perfecta: true },
  { k: "primeras_arrugas", w: 2, edades: ["35-44"], hombre: .35, bajos: { arrugas: [58, 70], tono: [60, 72], ojeras: [60, 72] }, ret: [.5, .3] },
  { k: "menopausia", w: 2, edades: ["45-54", "55-64"], hombre: 0, bajos: { firmeza: [52, 64], hidratacion: [54, 66], arrugas: [54, 66] }, ret: [.5, .3] },
  { k: "hombre_manchas_sol", w: 1, edades: ["45-54", "55-64", "65+"], hombre: 1, bajos: { manchas: [50, 62], arrugas: [56, 68], textura: [60, 72] } },
  { k: "madura_seca_65", w: 2, edades: ["65+"], hombre: .3, bajos: { arrugas: [50, 62], firmeza: [50, 62], hidratacion: [52, 64], manchas: [56, 68] }, ret: [.6, .25] },
];
function generarCiclo2(nc){
  const R = rng(51000 + nc * 7907), pick = a => a[Math.floor(R() * a.length)], ent = (a, b) => a + Math.floor(R() * (b - a + 1));
  const bolsa = PERFILES.flatMap(p => Array(p.w).fill(p));
  const out = [], usados = new Set();
  const bajos = new Set([Math.floor(R() * 10)]); if(R() < .5) bajos.add((Math.floor(R() * 9) + 1 + [...bajos][0]) % 10);
  for(let i = 0; i < 10; i++){
    let a = pick(bolsa); for(let t = 0; t < 6 && usados.has(a.k); t++) a = pick(bolsa); usados.add(a.k);
    const edad = pick(a.edades), sexo = R() < a.hombre ? "hombre" : "mujer";
    const edadNum = { "14-17": 16, "18-24": 21, "25-34": 30, "35-44": 40, "45-54": 50, "55-64": 60, "65+": 70 }[edad];
    const notas = {};
    for(const k of ASP) notas[k] = ent(70, 90);
    if(edadNum >= 40){ notas.arrugas = Math.min(notas.arrugas, ent(62, 80)); notas.firmeza = Math.min(notas.firmeza, ent(64, 82)); }
    if(edadNum >= 55){ notas.arrugas = Math.min(notas.arrugas, ent(55, 70)); notas.firmeza = Math.min(notas.firmeza, ent(55, 70)); notas.manchas = Math.min(notas.manchas, ent(60, 76)); }
    if(edadNum <= 24){ notas.arrugas = Math.max(notas.arrugas, ent(80, 92)); notas.firmeza = Math.max(notas.firmeza, ent(80, 92)); }
    for(const [k, [lo, hi]] of Object.entries(a.bajos)) notas[k] = ent(lo, hi);
    if(a.perfecta) for(const k of ASP) notas[k] = ent(74, 92);
    if(["adolescente_acne", "joven_acne_inflamado", "mixta_poros_brillo"].includes(a.k)) notas.hidratacion = ent(64, 86);
    if(R() < .6){ const extra = pick(ASP); notas[extra] = Math.min(notas[extra], ent(62, 76)); }
    const c = { id: `C${nc}-${String(i + 1).padStart(2, "0")}`, ciclo: nc, serie: 2, arquetipo: a.k, edad, sexo, embarazo: "no", receta: "no", reactiva: "nunca", retinoide: "nunca", notas, limite: null };
    const fertil = sexo === "mujer" && ["18-24", "25-34", "35-44"].includes(edad);
    if(fertil && R() < (a.embarazo || .12)) c.embarazo = R() < .55 ? "embarazo" : "lactancia";
    if(R() < (a.receta || .06)) c.receta = "si";
    { const [p0, p1] = a.reactiva || [.62, .3]; const x = R(); c.reactiva = x < p0 ? "nunca" : x < p0 + p1 ? "a_veces" : "siempre"; }
    { const [p0, p1] = a.ret || [.75, .15]; const x = R(); if(edad !== "14-17" && c.embarazo === "no" && c.receta !== "si") c.retinoide = x < p0 ? "nunca" : x < p0 + p1 ? "reciente" : "tolera"; }
    if(bajos.has(i)){ const ks = Object.keys(a.bajos).length ? Object.keys(a.bajos) : ASP; const k = pick(ks); notas[k] = ent(32, 48); if(R() < .35){ const k2 = pick(ASP.filter(x => x !== k)); notas[k2] = ent(40, 49); } c.bajo = true; }
    else for(const k of ASP) notas[k] = Math.max(notas[k], 50);
    out.push(c);
  }
  // un caso límite por ciclo: nota en un umbral o condición de seguridad
  // el caso límite se aplica a un perfil compatible (no se convierte una adolescente en embarazada)
  const tipo = nc % 5;
  const compatible = c => tipo === 1 ? c.sexo === "mujer" && ["25-34", "35-44"].includes(c.edad) : tipo === 2 ? ["14-17", "18-24"].includes(c.edad) : true;
  const idx = [...Array(10).keys()], pref = idx.filter(i => !bajos.has(i) && compatible(out[i]));
  const li = pref.find(i => i === (nc * 7) % 10) ?? pref[0] ?? idx.find(i => !bajos.has(i) && i === (nc * 7) % 10) ?? idx.find(i => !bajos.has(i));
  const L = out[li];
  if(tipo === 0){ const k = Object.keys((PERFILES.find(x => x.k === L.arquetipo) || {}).bajos || {})[0] || "manchas"; const u = pick(UMBRALES); L.notas[k] = u - 1; L.limite = `${k} = ${u - 1}, a 1 punto del umbral ${u}`; }
  else if(tipo === 1){ L.sexo = "mujer"; L.edad = pick(["25-34", "35-44"]); L.embarazo = pick(["embarazo", "lactancia"]); L.retinoide = "nunca"; const k = pick(["acne", "manchas", "arrugas"]); L.notas[k] = pick([54, 59, 60, 64]); L.limite = `${L.embarazo} con ${k} ${L.notas[k]}`; }
  else if(tipo === 2){ L.edad = "14-17"; L.embarazo = "no"; L.retinoide = "nunca"; L.reactiva = pick(["nunca", "a_veces"]); L.notas.acne = pick([50, 54, 55, 59]); L.limite = `menor con imperfecciones ${L.notas.acne}`; }
  else if(tipo === 3){ L.receta = "si"; L.retinoide = "nunca"; const k = pick(["acne", "rojez", "hidratacion"]); L.notas[k] = pick([50, 54, 55]); L.limite = `receta con ${k} ${L.notas[k]}`; }
  else { L.reactiva = "siempre"; const k = pick(["arrugas", "rojez", "manchas", "acne"]); L.notas[k] = pick([50, 54, 55, 59, 60]); L.limite = `reactividad «siempre» con ${k} ${L.notas[k]}`; }
  const conBajo = out.filter(c => ASP.some(k => c.notas[k] < 50));
  for(const c of conBajo.slice(2)) for(const k of ASP) c.notas[k] = Math.max(c.notas[k], 50);
  return out;
}

/* ---------------------------------------------------------------- ejecución (igual que el iPad) */
function respuestas(c, M){
  const puedeRet = c.edad !== "14-17" && c.embarazo === "no" && c.receta !== "si";
  const r = {
    edad: EDAD_MOTOR[c.edad] ?? c.edad, edad_tramo: c.edad, sexo: c.sexo,
    embarazo: c.sexo !== "hombre" && (c.embarazo === "embarazo" || c.embarazo === "lactancia") ? "si" : "no",
    lactancia: c.sexo !== "hombre" && c.embarazo === "lactancia" ? "si" : "no",
    receta: c.receta, reactiva: c.reactiva, sienta: ["nada"],
    retinoide_exp: puedeRet && (c.retinoide === "reciente" || c.retinoide === "tolera") ? c.retinoide : "nunca",
    // igual que el iPad (Hito 1, 27/11): el fototipo y el tratamiento en consulta solo van si la clienta los declara; antes el iPad mandaba siempre «III»
    fototipo: c.fototipo && c.fototipo !== "nd" ? c.fototipo : undefined, procedimiento: c.procedimiento && c.procedimiento !== "no" ? c.procedimiento : undefined,
    procedimiento_cuando: c.procedimiento && c.procedimiento !== "no" ? c.procedimiento_cuando : undefined,
    textura: "igual", preocupa: ["nada"], piel: "normal", kiosko: true,
    consentimiento: { version: "sim", salud: true, foto: true, guardar_foto: false, fecha: c.fecha || "2026-11-24T10:00:00.000Z", via: "kiosko" },
  };
  const p = Object.fromEntries(ASP.map(a => [a, 100 - c.notas[a]]));
  r.piel = p.brillo >= 50 ? "brillo_total" : p.brillo >= 35 ? "brillo_T" : p.hidratacion >= 50 ? "tirante" : "normal";
  const rf = M.RF.aplicarAlMotor(r, c.notas);
  return { r, rf };
}
function correr(c, M){
  const { r, rf } = respuestas(c, M);
  const res = { reglas: rf.reglas_aplicadas.map(x => x.id), prioridad: rf.prioridad_foto, piel: r.piel, vetos_foto: Object.keys(rf.veto_extra), bonus: rf.bonus_activos };
  for(const [k, n, pres] of NIVELES){
    const out = M.motor.calcularCon({ ...JSON.parse(JSON.stringify(r)), productos: n, presupuesto: pres }, M.LISTA);
    res[k] = out;
  }
  return res;
}
function estructura(o){
  return JSON.stringify({ modo: o.modo, orden: o.perfil.problemas.map(x => x.id), serums: o._pauta.serums.map(s => s.k + "/" + s.turno), huecos: o._pauta.huecos.map(h => h.slot) });
}
const ids = o => o.productos.map(p => p.id || "∅:" + p.slot);

/* ---------------------------------------------------------------- revisión de dermofarmacia */
const ACT_ASPECTO = {
  acne: ["azelaico", "niacinamida", "salicilico", "retinal", "retinol", "esteres_retinilo", "lha", "zinc"],
  manchas: ["vitc_pura", "vitc_derivados", "azelaico", "niacinamida", "tranexamico", "thiamidol", "arbutina", "kojico", "retinal", "retinol", "glicolico"],
  arrugas: ["retinal", "retinol", "esteres_retinilo", "vitc_pura", "vitc_derivados", "peptidos", "bakuchiol", "glicolico"],
  firmeza: ["retinal", "retinol", "esteres_retinilo", "vitc_pura", "vitc_derivados", "peptidos", "bakuchiol"],
  textura: ["glicolico", "lactico", "pha", "salicilico", "retinal", "retinol", "esteres_retinilo", "niacinamida", "urea"],
  poros: ["niacinamida", "salicilico", "retinal", "retinol", "esteres_retinilo", "zinc", "lha"],
  brillo: ["niacinamida", "salicilico", "zinc", "retinal", "retinol"],
  rojez: ["niacinamida", "azelaico", "centella", "pantenol", "ceramidas", "ectoina", "bisabolol"],
  tono: ["vitc_pura", "vitc_derivados", "niacinamida", "azelaico", "glicolico", "lactico", "pha", "tranexamico"],
  hidratacion: ["hialuronico", "glicerina", "ceramidas", "pantenol", "urea", "escualano"],
};
const FUERTES = ["retinal", "retinol", "esteres_retinilo", "hpr", "glicolico", "lactico", "mandelico", "salicilico", "azelaico", "vitc_pura", "tranexamico", "thiamidol", "bakuchiol"];
function revisar(c, res, M){
  const { lleva, estado, aDosis, RETINOIDES } = M.AC;
  const f = [];
  const emb = c.sexo !== "hombre" && c.embarazo !== "no";
  const nb = k => c.notas[k];
  const todos70 = ASP.every(k => nb(k) >= 70);
  for(const [nivel] of NIVELES){
    const o = res[nivel];
    const add = (sev, tipo, txt) => f.push({ nivel, sev, tipo, txt });
    const ps = o.productos.filter(p => p.id).map(p => ({ s: p, p: M.POR.get(p.id) })).filter(x => x.p);
    const noAcl = ps.filter(x => x.s.slot !== "L");
    const tiene = (k, lista = ps) => lista.filter(x => lleva(x.p, k));
    // --- CRÍTICO
    if(o.productos.length > 6) add("CRÍTICO", "más de 6 productos", `${o.productos.length} productos`);
    const sol = o.productos.find(p => p.slot === "S");
    if(!sol || !sol.id) add("CRÍTICO", "sin solar", "la rutina no lleva protector solar con producto");
    else { const P = M.POR.get(sol.id); if(!P || P.categoria !== "spf" || (P.spf || 0) < 30) add("CRÍTICO", "solar sin SPF verificado", `${sol.producto}: SPF ${P && P.spf}`); }
    if(emb) for(const k of RETINOIDES.concat(["bakuchiol", "tranexamico", "thiamidol", "arbutina", "kojico"], c.embarazo === "embarazo" ? ["glicolico", "lactico", "mandelico"] : [])) for(const x of tiene(k)) add("CRÍTICO", "veto de embarazo o lactancia", `${x.p.marca} · ${x.p.producto} lleva ${k}`);
    if(emb && c.embarazo === "embarazo") for(const x of ps.filter(x => (x.p.inci_completo || []).some(i => /\bsalicylic acid\b|betaine salicylate/i.test(i) && !/capryloyl/i.test(i)))) add("CRÍTICO", "veto de embarazo", `${x.p.producto} lleva salicílico o betaína salicilato (R4)`);
    if(c.edad === "14-17") for(const k of RETINOIDES.concat(["bakuchiol", "glicolico", "lactico"])) for(const x of tiene(k, noAcl)) add("CRÍTICO", "menor con activo vetado", `${x.p.producto} lleva ${k}`);
    if(c.edad === "14-17" && o.productos.some(p => /^serum/.test(p.slot))) add("GRAVE", "menor con sérum", "de 14 a 17 años la rutina es limpiador, hidratante y solar");
    if(c.receta === "si"){ if(o.modo !== "suave") add("CRÍTICO", "receta sin modo suave", o.modo);
      if(o.productos.some(p => /^serum/.test(p.slot) && p.id)) add("CRÍTICO", "receta con sérum de tratamiento", o.productos.filter(p => /^serum/.test(p.slot)).map(p => p.producto).join(", "));
      for(const k of RETINOIDES.concat(["glicolico", "lactico", "salicilico", "azelaico", "vitc_pura"])) for(const x of tiene(k, noAcl).filter(x => aDosis(x.p, k))) add("CRÍTICO", "receta con activo encima", `${x.p.producto} lleva ${k}`); }
    if(c.reactiva === "siempre"){ for(const k of RETINOIDES.concat(["vitc_pura", "glicolico", "lactico", "salicilico"])) for(const x of tiene(k, noAcl).filter(x => aDosis(x.p, k))) add("CRÍTICO", "reactividad «siempre» con activo fuerte", `${x.p.producto} lleva ${k}`);
      if(o.productos.length > 4) add("GRAVE", "reactividad «siempre» con muchos productos", `${o.productos.length} productos`); }
    { const r = noAcl.filter(x => RETINOIDES.some(k => aDosis(x.p, k))); if(r.length > 1) add("CRÍTICO", "dos retinoides", r.map(x => x.p.producto).join(" + ")); }
    for(const x of ps) for(const k of ["retinol", "esteres_retinilo"]) if(lleva(x.p, k) && estado(x.p)[k].estado !== "declarada" && !(x.p.flags || []).includes("conforme_2024_996")) add("CRÍTICO", "vitamina A sin % declarado", x.p.producto);
    for(const [k] of Object.entries(o._veto || {})){ if(["perfume", "alcohol"].includes(k)) continue; for(const x of tiene(k)) add("CRÍTICO", "salta un veto", `${x.p.producto} lleva ${k} y está vetado («${o._veto[k]}»)`); }
    if(o._veto && o._veto.perfume) for(const x of ps.filter(x => x.p.fragancia === true || lleva(x.p, "perfume"))) add("GRAVE", "salta el veto de perfume", x.p.producto);
    for(const x of ps) if(x.p.fuera_farmacia) add("CRÍTICO", "marca fuera de dermofarmacia", `${x.p.marca} · ${x.p.producto}`);
    // --- GRAVE
    const conAcido = noAcl.filter(x => ["glicolico", "lactico", "mandelico", "lha", "pha"].some(k => aDosis(x.p, k)) || (x.p.inci_completo || []).some(i => /\bsalicylic acid\b/i.test(i) && !/capryloyl/i.test(i)));
    if(conAcido.length > 1) add("GRAVE", "dos exfoliantes sin aclarado (R1)", conAcido.map(x => x.p.producto).join(" + "));
    if(todos70 && conAcido.length) add("GRAVE", "exfoliante con todo ≥70 (R3)", conAcido.map(x => x.p.producto).join(", "));
    if(nb("hidratacion") < 55 && noAcl.some(x => ["glicolico", "lactico"].some(k => { const e = estado(x.p)[k]; return e && (e.pct == null ? e.estado === "probable" : e.pct >= 5); }))) add("GRAVE", "AHA con hidratación <55 (R19)", "");
    if((nb("rojez") < 55 || c.reactiva !== "nunca") && noAcl.some(x => { const e = estado(x.p).urea; return e && (e.pct == null || e.pct >= 5) && e.estado !== "tras_linea"; })) add("GRAVE", "urea con rojez o reactividad (R5)", noAcl.filter(x => lleva(x.p, "urea")).map(x => x.p.producto).join(", "));
    { const L = o.productos.find(p => p.slot === "L" && p.producto); const nom = L ? (L.producto + " " + L.marca).toLowerCase() : "";
      if(L && (nb("rojez") < 55 || c.reactiva !== "nunca") && /espum|foam|mousse|moussant/.test(nom)) add("GRAVE", "limpiador espumoso con rojez o reactividad (R25/R32)", L.producto);
      if(L && /micel|micellar|\bh2o\b/.test(nom) && !/gel|mousse|espuma|foam/.test(nom)) add("MENOR", "micelar como limpiador (R7)", L.producto);
      if(L && /\bcrema\b|\bcream\b|serum|sérum|fluido|spf/.test(nom) && !/limpi|cleans|lavant|nettoy|wash|gel|leche|lait|milk|aceite|oil|balm|bálsamo/.test(nom)) add("GRAVE", "el limpiador no es un limpiador", L.producto); }
    for(const h of o.productos.filter(p => ["H", "H2"].includes(p.slot) && p.producto)){ const nom = (h.producto || "").toLowerCase();
      if(/limpia|cleanser|cleansing|lavant|nettoyant|wash|micel|desmaquill|démaquill|gel limpiador|syndet|pain/.test(nom)) add("GRAVE", "la hidratante es un limpiador", h.producto);
      if(/\bsolar\b|\bspf\b|fotoprotector/.test(nom) && !/hidrat|crema/.test(nom)) add("MENOR", "la hidratante es un solar", h.producto);
      if(/contorno|eye|ojos|labio|lip/.test(nom)) add("GRAVE", "la hidratante es de ojos o labios", h.producto);
      const P = M.POR.get(h.id);
      if((nb("rojez") < 55) && P && (/gel/.test(P.textura || "") || /water gel|gel.?cream|gel-crema/.test(nom)) && !(nb("brillo") <= 60 && (P.textura === "gel-crema" || /gel.?cr[eè]m|gel.?cream/.test(nom)))) add("GRAVE", "hidratante en gel con rojez <55 (R26/R32)", h.producto);
      if(nb("brillo") <= 60 && P && (P.textura === "balsamo" || /intensive|\brich\b|\brica\b|piel seca|dry skin|baume|bálsamo/.test(nom))) add("MENOR", "crema densa con brillo ≤60 (R9/R20)", h.producto);
      if(nb("brillo") >= 75 && /matific|\bmate\b|oil control|shine|seborreg|purif/.test(nom)) add("MENOR", "hidratante matificante con brillo ≥75 (R36)", h.producto);
      if(nb("hidratacion") < 55 && nb("brillo") >= 65 && P && (P.textura === "gel" || /matific|seborreg|water cream|oil control/.test(nom))) add("MENOR", "gel seborregulador con piel deshidratada (R20)", h.producto); }
    for(const s of o.productos.filter(p => /^serum/.test(p.slot) && p.producto)){ const nom = s.producto.toLowerCase();
      if(/limpia|cleanser|lavant|wash|mascarilla|\bmask\b|solar|spf\b|contorno|eye/.test(nom)) add("GRAVE", "el sérum no es un sérum", s.producto);
      if(s.turno === "AM" && RETINOIDES.some(k => aDosis(M.POR.get(s.id), k))) add("CRÍTICO", "retinoide de mañana", s.producto); }
    for(const s of o.productos.filter(p => /^serum/.test(p.slot) && p.activo_clave && ((res.bonus || {})[p.activo_clave] || 0) < 0)) add((s.alternativas || []).some(a => !a.sin_dosis && a.activo_clave && !(((res.bonus || {})[a.activo_clave] || 0) < 0) && !o.productos.some(q => q !== s && /^serum/.test(q.slot) && q.id && M.AC.aDosis(M.POR.get(q.id), a.activo_clave))) ? "GRAVE" : "MENOR", "activo que la foto pide evitar", `${s.producto} (${s.activo_clave})`);
    for(const T of ["AM", "PM"]){ const d = o.productos.filter(p => /^serum/.test(p.slot) && p.turno === T && p.id && !p.noches && !p.frecuencia);
      const parAz = d.length === 2 && d.some(p => /azelaico/i.test(p.activo || "")) && d.some(p => /vitamina C|niacinamida/i.test(p.activo || ""));
      if(d.length > 1 && !parAz) add("GRAVE", "dos sérums diarios en el mismo turno (R8)", d.map(p => p.producto).join(" + ")); }
    // duplicados de activo fuerte en dos productos sin aclarado
    for(const k of FUERTES){ const l = noAcl.filter(x => x.s.slot !== "contorno" && aDosis(x.p, k) && (estado(x.p)[k].estado === "declarada" || estado(x.p)[k].estado === "probable" || ["retinal", "retinol", "esteres_retinilo", "thiamidol", "bakuchiol"].includes(k)));
      if(l.length > 1) add(k === "niacinamida" ? "MENOR" : "GRAVE", "activo duplicado", `${k} en ${l.map(x => x.p.producto).join(" + ")}`); }
    { const l = noAcl.filter(x => { const e = estado(x.p).niacinamida; return e && e.estado === "declarada" && e.pct >= 2; }); if(l.length > 2) add("MENOR", "niacinamida en 3 productos", l.map(x => x.p.producto).join(" + ")); }
    if(RETINOIDES.some(k => noAcl.some(x => aDosis(x.p, k))) && o.productos.some(p => /^serum/.test(p.slot) && p.turno === "AM" && p.id && ["glicolico", "lactico"].some(k => aDosis(M.POR.get(p.id), k)))) add("GRAVE", "glicólico de mañana con retinoide (R14)", "");
    // retinoide en menores de 30 sin indicación (R21/R31)
    if(["18-24", "25-34"].includes(c.edad) && noAcl.some(x => RETINOIDES.some(k => aDosis(x.p, k))) && !(nb("acne") < 65 || nb("textura") < 60 || nb("poros") < 55 || nb("arrugas") < 65)) add("GRAVE", "retinoide sin indicación con menos de 30 (R31)", "");
    // primer retinoide fuerte
    if(c.retinoide === "nunca" || emb || c.receta === "si") for(const x of noAcl){ const e = estado(x.p); if((e.retinal && e.retinal.pct > 0.05) || (e.retinol && e.retinol.pct >= 0.3)) add("GRAVE", "primer retinoide a dosis alta", x.p.producto); }
    // reactividad a veces: retinoide sin pauta suave
    for(const s of o.productos.filter(p => /^serum/.test(p.slot) && p.id && RETINOIDES.some(k => aDosis(M.POR.get(p.id), k)))) if(c.reactiva !== "nunca" && (!s.noches || s.noches.length > 2)) add("GRAVE", "retinoide en piel reactiva sin pauta de 2 noches", `${s.producto}: ${s.frecuencia || "a diario"}`);
    // embarazo con manchas sin solar con color (R4)
    if(c.embarazo === "embarazo" && c.sexo === "mujer" && nb("manchas") <= 69 && sol && sol.id && !M.POR.get(sol.id).oxidos_hierro) add("GRAVE", "embarazo con manchas sin solar con color (R4)", sol.producto);
    if(emb && !o.avisos.concat(o.derivacion.map(d => d.texto)).some(a => /embaraz|lactancia|pecho|matrona|médico|medico/i.test(a))) add("MENOR", "sin el aviso de embarazo o lactancia", "");
    // problema principal sin tratar en la básica (R16)
    const peor = ASP.filter(k => !["ojeras", "hidratacion"].includes(k)).sort((a, b) => nb(a) - nb(b))[0];
    const libre = c.receta !== "si" && c.edad !== "14-17" && !o._c.barrera && o.modo === "normal";
    if(nivel === "basica" && libre && nb(peor) < 60 && !ASP.every(k => nb(k) >= 70)){
      const vale = ACT_ASPECTO[peor] || [];
      const trat = noAcl.filter(x => vale.some(k => aDosis(x.p, k)) && (x.s.slot !== "S"));
      if(!trat.length && !(peor === "rojez" && o.productos.some(p => ["H"].includes(p.slot) && p.id))) add("GRAVE", "la básica no trata el problema principal (R16)", `${peor} ${nb(peor)}`);
    }
    // manchas <60 sin vitamina C o azelaico de mañana (R35)
    if(nivel !== "basica" && nb("manchas") < 60 && c.receta !== "si" && !(c.reactiva === "siempre" && nb("rojez") < 60 && nivel !== "completa") && c.edad !== "14-17" && o.modo === "normal" && !o.productos.some(p => /^serum/.test(p.slot) && p.turno === "AM" && p.id && ["vitc_pura", "vitc_derivados", "azelaico", "tranexamico", "thiamidol"].some(k => aDosis(M.POR.get(p.id), k)))) add(o.queda_fuera.some(q => /presupuesto/.test(q.por)) || c.reactiva === "siempre" ? "MENOR" : "GRAVE", "manchas <60 sin vitamina C ni azelaico de mañana (R35)", o.queda_fuera.some(q => /presupuesto/.test(q.por)) ? "no cabe en el presupuesto" : "");
    for(const x of ps){ const nom = x.p.producto.toLowerCase();
      if(/[ií]ntim|pliegue|zonas con pelo|corporal|\bbody\b|\bpies\b|\bmanos\b|cuero cabelludo|capilar|pañal|panal|bebé|bebe\b|labial|\blip\b/.test(nom)) add("GRAVE", "producto que no es de cara", `${x.p.marca} · ${x.p.producto}`);
      if(/dermatitis seborreica|kelual|psoria|atópic|atopic|eccema|eczema/.test(nom) && !o._c.barrera) add("MENOR", "producto para una afección sin indicación", `${x.p.marca} · ${x.p.producto}`); }
    // ojeras <60: contorno en las tres (R31)
    if(nb("ojeras") < 60 && c.receta !== "si" && c.edad !== "14-17" && o.modo === "normal" && !o.productos.some(p => p.slot === "contorno")) add("MENOR", "ojeras <60 sin contorno (R31)", "");
    // despigmentantes sin manchas (R28/R33)
    if(nb("manchas") >= 70) for(const x of noAcl.filter(x => ["arbutina", "kojico"].some(k => lleva(x.p, k)))) add("MENOR", "despigmentante con manchas ≥70 (R28)", x.p.producto);
    // 65+ con poco brillo: crema nutritiva (R34)
    if(c.edad === "65+" && nb("brillo") >= 65){ const h = o.productos.find(p => p.slot === "H" && p.id); const P = h && M.POR.get(h.id); if(P && (!["crema", "balsamo"].includes(P.textura) || /gel/.test(P.textura || ""))) add("MENOR", "65+ sin crema nutritiva (R34)", h.producto); }
    // solar
    if(sol && sol.id){ const P = M.POR.get(sol.id), nom = (P.producto || "").toLowerCase();
      if(P.tipo_filtro === "mineral" && nb("brillo") >= 60 && nb("rojez") >= 55 && c.reactiva === "nunca") add("MENOR", "solar mineral sin necesidad (R36)", P.producto);
      if((nb("arrugas") < 55 || nb("firmeza") < 55) && /oil control|aqua fresh|dry touch|toque seco|\bmat/.test(nom)) add("MENOR", "solar de piel grasa en piel madura (R29)", P.producto); }
    // pasos vacíos
    for(const p of o.productos.filter(p => !p.producto && p.slot !== "S")) add(/^serum1$/.test(p.slot) ? "GRAVE" : "MENOR", "paso sin producto", `${p.paso}: ${p.motivo || ""}`);
    // perfume con rojez o reactividad
    if((nb("rojez") < 55 || c.reactiva !== "nunca") && !(o._veto && o._veto.perfume)) for(const x of ps.filter(x => x.s.slot !== "S" && (x.p.fragancia === true || lleva(x.p, "perfume")))){
      // Hugo, 25/11 (pregunta 1): con reactividad «a veces» y sin rojez marcada, el sérum activo con perfume vale si lleva su aviso
      if(c.reactiva === "a_veces" && nb("rojez") >= 55 && /^serum/.test(x.s.slot) && o.avisos.some(a => a.includes(x.p.producto) && /perfume/.test(a))) continue;
      add("MENOR", "perfume con rojez o reactividad", x.p.producto); }
  }
  // receta: las tres rutinas iguales
  // dedupe
  const vistos = new Set();
  return f.filter(x => { const k = x.nivel + x.sev + x.tipo + x.txt; if(vistos.has(k)) return false; vistos.add(k); return true; });
}

/* ---------------------------------------------------------------- ±3 puntos */
function estabilidad(c, base, M, veces = 8){
  const R = rng(4242 + c.id.split("").reduce((a, ch) => a * 31 + ch.charCodeAt(0) >>> 0, 7));
  const cambios = [];
  for(let t = 0; t < veces; t++){
    const notas = {};
    for(const k of ASP) notas[k] = Math.max(0, Math.min(100, c.notas[k] + (t === 0 ? 3 : t === 1 ? -3 : Math.round(R() * 6 - 3))));
    const res = correr({ ...c, notas, fecha: "2026-11-24T1" + t + ":00:00.000Z" }, M);
    for(const [k] of NIVELES){
      const a = ids(base[k]), b = ids(res[k]);
      if(a.join() === b.join()) continue;
      const mismoEsq = estructura(base[k]) === estructura(res[k]) && base.reglas.slice().sort().join() === res.reglas.slice().sort().join();
      const rg = { mas: res.reglas.filter(x => !base.reglas.includes(x)), menos: base.reglas.filter(x => !res.reglas.includes(x)) };
      cambios.push({ nivel: k, intento: t, tipo: mismoEsq ? "desempate" : "umbral", antes: a.filter(x => !b.includes(x)), despues: b.filter(x => !a.includes(x)), reglas: rg, notas });
    }
  }
  return { cambios, total: veces * NIVELES.length };
}

module.exports = { cargar, generarCiclo, correr, revisar, estabilidad, estructura, ids, ASP, NIVELES, respuestas };
