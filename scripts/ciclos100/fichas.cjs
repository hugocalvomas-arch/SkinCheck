/* eslint-disable @typescript-eslint/no-require-imports */
/* Genera las fichas de producto con la nota de calidad de fórmula (Hugo, 24/11/2026, A.3 y A.4).
   Se hacen una vez por producto (en la app, al subir el Excel de la farmacia) y el motor solo las consulta.
   Uso: node scripts/ciclos100/fichas.cjs [carpeta de fichas verificadas]   → src/server/motor/fichas-calidad.json
   La carpeta opcional son las fichas revisadas a mano (JSON por lotes): de ahí salen los estudios publicados y la confianza. */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { TODOS } = require(path.join(ROOT, "src/server/motor/catalogo.js"));
const { estado, lleva, aDosis, RETINOIDES, n } = require(path.join(ROOT, "src/server/motor/activos.js"));
const CFG = require(path.join(ROOT, "src/server/motor/config.js"));
const { claseCon, TABLA } = require(path.join(ROOT, "src/server/motor/necesidades.js"));

const verificadas = new Map();
const dir = process.argv[2];
if(dir && fs.existsSync(dir)) for(const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))){
  try { for(const x of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) if(x && x.id) verificadas.set(x.id, x); } catch { /* lote a medias */ }
}

const APOYO = ["ceramidas", "pantenol", "centella", "bisabolol", "ectoina", "glicerina", "hialuronico", "escualano", "colesterol", "vitamina_e", "ferulico"];
const ACEITES_ESENCIALES = /limonene|linalool|citral|geraniol|eugenol|citronellol|lavandula|rosmarinus|eucalyptus|citrus .*oil|peel oil|mentha|tea tree|melaleuca|bergamot/i;
const ESTABILIZA = /encapsul|liposom|cyclodextrin|microsphere|nanoemul|polymethylsilsesquioxane|hydrogenated lecithin/i;
const LABILES = ["vitc_pura", "retinal", "retinol"];
const HUECO = { L: "limpiador", H: "hidratante", S: "solar", "S que hidrata": "solar", PM: "sérum", AM: "sérum", "AM/PM": "sérum", "serum humectante": "sérum", "contorno de ojos": "contorno", posafeitado: "posafeitado", "tonico o bruma": "tónico", mascarilla: "mascarilla" };
const MOMENTO = { PM: "noche", AM: "mañana", "AM/PM": "mañana y noche", L: "mañana y noche", H: "mañana y noche", S: "mañana", "S que hidrata": "mañana" };
const VETO_EMB = RETINOIDES.concat(["bakuchiol", "tranexamico", "thiamidol", "arbutina", "kojico", "glicolico", "lactico", "mandelico", "lha"]);
const VETO_MENOR = RETINOIDES.concat(["bakuchiol", "tranexamico", "thiamidol", "arbutina", "kojico"]);
const VETO_RECETA = RETINOIDES.concat(["glicolico", "lactico", "mandelico", "pha", "salicilico", "lha", "azelaico", "vitc_pura", "bakuchiol", "tranexamico", "thiamidol", "arbutina", "kojico"]);
const salicilicoReal = p => (p.inci_completo || []).some(i => /\bsalicylic acid\b|betaine salicylate/i.test(i) && !/capryloyl/i.test(i));
const r1 = x => Math.round(x * 10) / 10;

function ficha(p){
  const e = estado(p), v2 = p.v2 || {}, inci = (p.inci_completo || []).map(String);
  const prim = (p.activos || []).filter(a => a.rol === "primario");
  const claves = Object.keys(TABLA.ingredientes).filter(k => e[k] && e[k].estado !== "tras_linea");
  const principal = v2.protagonista && e[v2.protagonista] ? v2.protagonista : claves.find(k => prim.some(a => (a.inci || "").toLowerCase().includes((require(path.join(ROOT, "src/server/motor/activos.js")).A[k][0][0])))) || null;
  const activos = claves.map(k => ({ activo: k, nombre: TABLA.ingredientes[k].nombre, rol: k === principal ? "principal" : "apoyo",
    concentracion: e[k].estado === "declarada" ? "declarada" : e[k].estado === "probable" ? "estimada" : "desconocida", pct: e[k].pct, clase: claseCon(k, e[k].pct) }));
  const ver = verificadas.get(p.id);
  // --- nota de calidad de fórmula (0-10)
  const partes = [];
  let nota = 1; partes.push("base 1");
  // estudios del producto
  const ep = CFG.ensayo_producto[p.id];
  const pub = ver && Array.isArray(ver.estudios && ver.estudios.publicados) ? ver.estudios.publicados.length : 0;
  let est = 0, estTipo = "no", estFuente = null;
  if(ep){ est = ep.control === false ? 2 : 3; estTipo = ep.control === false ? "ensayo sin grupo control" : "ensayo controlado del producto"; estFuente = (ep.refs || []).join(", "); }
  else if(pub){ est = Math.min(2.5, 1.5 + pub * .25); estTipo = `${pub} estudio${pub > 1 ? "s" : ""} publicado${pub > 1 ? "s" : ""} con el producto`; estFuente = ver.estudios.publicados.map(x => x.pmid ? "PMID " + x.pmid : x.doi).filter(Boolean).join(", "); }
  else if((p.evidencia_producto || 0) >= 2){ est = 1; estTipo = "estudios de la marca (sin publicar)"; }
  if(est){ nota += est; partes.push(`estudios +${est}`); }
  // estabilidad dentro de la fórmula (el envase no cuenta aparte)
  let estab = "no aplica (activos estables)", pe = 0;
  const lab = claves.filter(k => LABILES.includes(k));
  if(lab.length){
    const tec = inci.some(i => ESTABILIZA.test(i)), anti = ["vitamina_e", "ferulico"].filter(k => e[k]).length + (inci.some(i => /metabisulfite|bht|tocopherol|ascorbyl palmitate/i.test(i)) ? 1 : 0);
    pe = (tec ? 1.2 : 0) + Math.min(.8, anti * .4);
    estab = [tec ? "tecnología de estabilización en el INCI (encapsulado, liposomas o similar)" : "sin tecnología de estabilización visible", anti ? "con antioxidantes que protegen el activo" : "sin antioxidantes de apoyo"].join("; ");
  } else if(claves.some(k => ["vitc_derivados"].includes(k))){ pe = inci.some(i => /ethyl ascorbic/i.test(i)) ? 1.2 : .8; estab = "derivado estable de vitamina C"; }
  else pe = .8;
  nota += pe; partes.push(`estabilidad +${r1(pe)}`);
  // ingredientes de apoyo y sinergias
  const apoyo = APOYO.filter(k => e[k] && e[k].estado !== "tras_linea");
  const pa = Math.min(2, apoyo.length * .4); nota += pa; if(pa) partes.push(`apoyo +${r1(pa)}`);
  // porcentaje declarado o estimado
  let pc = 0;
  if(principal){ const s = e[principal].estado; pc = s === "declarada" ? 2 : s === "probable" ? 1 : ep ? 1 : 0; }
  else pc = ["L", "H", "S", "S que hidrata"].includes(v2.hueco) ? 1 : 0;
  nota += pc; partes.push(`concentración +${pc}`);
  // solares: SPF, UVA, fotoestabilidad
  if(p.categoria === "spf"){ const s = ((p.spf || 0) >= 50 ? .5 : 0) + (p.uva_pf_ok ? .5 : 0) + (p.fotoestable === true ? .3 : 0); nota += s; if(s) partes.push(`solar +${r1(s)}`); }
  // alertas
  const alertas = [];
  if(p.fragancia === true || lleva(p, "perfume")){ alertas.push("perfume"); nota -= (p.alergenos_declarados || []).length >= 3 ? 1.5 : 1; }
  const iAlc = inci.findIndex(i => /alcohol denat|sd alcohol/i.test(i));
  if(iAlc >= 0 && iAlc < 6){ alertas.push("alcohol alto en la fórmula"); nota -= 1; } else if(iAlc >= 0){ alertas.push("alcohol (bajo en la fórmula)"); nota -= .3; }
  if(inci.some(i => ACEITES_ESENCIALES.test(i))){ alertas.push("aceites esenciales o alérgenos de fragancia"); nota -= .5; }
  if(lleva(p, "mentol")){ alertas.push("mentol o alcanfor"); nota -= .5; }
  nota = Math.max(0, Math.min(10, r1(nota)));
  // --- vetos que dispara
  const vetos = [];
  if(VETO_EMB.some(k => lleva(p, k)) || salicilicoReal(p)) vetos.push("embarazo", "lactancia");
  if(VETO_MENOR.some(k => lleva(p, k))) vetos.push("menores");
  if(VETO_RECETA.some(k => aDosis(p, k))) vetos.push("receta");
  // --- confianza de la ficha
  let conf = "media";
  const motivosConf = [];
  if(inci.length < 8){ conf = "baja"; motivosConf.push("INCI corto o incompleto"); }
  if(/primaderm|singuladerm/i.test(p.marca)){ conf = "baja"; motivosConf.push("INCI de Primaderm contaminado con texto de la web"); }
  if(/parcial|estimad|desconoc/i.test(p.inci_confianza || "")){ conf = "baja"; motivosConf.push(`INCI ${p.inci_confianza}`); }
  if(principal && e[principal].estado === "no_declarada" && !ep && ["retinal", "retinol", "vitc_pura", "thiamidol", "tranexamico", "azelaico"].includes(principal)){ if(conf !== "baja") conf = "baja"; motivosConf.push("dosis del activo principal desconocida"); }
  if(conf !== "baja" && ver && /^alta/.test(String(ver.control && ver.control.confianza))) conf = "alta";
  else if(conf !== "baja" && /verificado_marca/.test(p.inci_confianza || "") && (!principal || e[principal].estado === "declarada")) conf = "alta";
  if(ver && /^baja/.test(String(ver.control && ver.control.confianza)) && conf === "alta") conf = "media";
  return {
    id: p.id, marca: p.marca, nombre: p.producto, categoria: p.categoria, subcategoria: p.subcategoria || null, hueco: HUECO[v2.hueco] || v2.hueco || null, momento: MOMENTO[v2.hueco] || null,
    activos, activo_principal: principal, estabilidad: estab, ingredientes_apoyo: apoyo,
    estudios: { si: est > 0, tipo: estTipo, fuente: estFuente },
    textura: p.textura || null, tipo_piel: v2.piel || null, alertas, vetos: [...new Set(vetos)],
    calidad: nota, calidad_porque: partes.join(", ") + (alertas.length ? `; resta por ${alertas.join(", ")}` : ""),
    confianza: conf, confianza_porque: motivosConf.join("; ") || (ver ? "contrastada con la ficha revisada" : "datos del catálogo"), revisar: conf === "baja",
    verificada: !!ver,
  };
}

if(require.main === module){
  const lista = TODOS.filter(p => !p.retirado && !p.sin_verificar && !p.fuera_farmacia && p.pvp_eur != null);
  const out = {};
  for(const p of lista) out[p.id] = ficha(p);
  fs.writeFileSync(path.join(ROOT, "src/server/motor/fichas-calidad.json"), JSON.stringify(out));
  const v = Object.values(out);
  console.log(`${v.length} fichas; ${verificadas.size} verificadas disponibles, ${v.filter(x => x.verificada).length} cruzadas; confianza baja: ${v.filter(x => x.revisar).length}`);
}
module.exports = { ficha };
