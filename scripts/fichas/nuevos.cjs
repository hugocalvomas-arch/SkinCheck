/* eslint-disable @typescript-eslint/no-require-imports */
/* Productos con ficha verificada que no están en el catálogo del motor (marcas nuevas y gamas que faltaban: MartiDerm, RoC,
   Embryolisse, Perricone, Babé, BioNike…). Los convierte en registros del catálogo con una clasificación v2 PROPUESTA
   (hueco, protagonista, piel), marcada para que Hugo la revise.
   Uso: node scripts/fichas/nuevos.cjs <carpeta de fichas>   → src/server/motor/nuevos-fichas.json + revision-nuevos.csv
   Solo entra lo que tiene INCI completo en inglés de fuente primaria (web de la marca o farmacia). Sin precio: queda fuera de las recomendaciones. */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { A, aDosis, ACIDOS, estado } = require(path.join(ROOT, "src/server/motor/activos.js"));
const BASE = require(path.join(ROOT, "src/server/motor/catalogo.json")).concat(require(path.join(ROOT, "src/server/motor/contornos.json")));
const enCatalogo = new Set(BASE.map(p => p.id));
const dir = process.argv[2];
if(!dir) { console.error("Falta la carpeta de fichas"); process.exit(1); }

const s = v => String(v == null ? "" : v);
const fichas = new Map();
for(const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()){
  let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { console.error("lote ilegible:", f); continue; }
  if(!Array.isArray(d)) d = d.fichas || [];
  for(const x of d) if(x && x.id && !enCatalogo.has(x.id)) fichas.set(x.id, Object.assign({}, x, {_lote: f}));
}

const fuentePrimaria = i => i && Array.isArray(i.inci_completo) && i.inci_completo.length >= 4 &&
  /web oficial|farmacia|INCI publicado en la p[aá]gina|repaso/i.test(s(i.tipo_fuente)) && !/perfumer|druni|sephora|cat[aá]logo \(|no verificado|en espa[nñ]ol/i.test(s(i.tipo_fuente));
const ES = /^(agua|glicerina|aceite|extracto|ácido|acido|escualeno|fenoxietanol|perfume|manteca|dióxido|óxido|cera de|lecitina|goma)/i;
const enEspanol = l => l.filter(x => ES.test(s(x).trim())).length >= 3;
const noFarmacia = c => /^(no|false)$/i.test(s(c && c.farmacia_verificada).trim());
const baja = e => /^(descatalogado|sustituido)\b/i.test(s(e).trim()) && !/no confirmado|probabl|posible/i.test(s(e));
const num = v => { const m = /(\d+(?:[.,]\d+)?)\s*(?:€|eur)/i.exec(s(v)) || /^\s*(\d+(?:[.,]\d+)?)\s*$/.exec(s(v)); return m ? +m[1].replace(",", ".") : null; };
const PATRONES = Object.entries(A).map(([k, v]) => [k, v[0]]);
const activoConocido = inci => { const t = s(inci).toLowerCase(); const m = PATRONES.find(([, pats]) => pats.some(p => t.includes(p))); return m ? m[0] : null; };
const pctNum = v => { const m = /^\s*(\d+(?:[.,]\d+)?)\s*%/.exec(s(v)); return m && !/suma|total|no encontrado|no declarado/i.test(s(v)) ? +m[1].replace(",", ".") : null; };

function precio(cv){
  const ps = (cv.farmacias || []).map(f => num(f.pvp_eur)).filter(v => v && v > 1 && v < 400);
  if(ps.length) return {pvp: Math.min(...ps), fuente: "farmacia"};
  const r = num(cv.pvp_rango_eur); if(r && r > 1 && r < 400) return {pvp: r, fuente: "farmacia (rango)"};
  const m = num(cv.pvp_marca); if(m && m > 1 && m < 400) return {pvp: m, fuente: "marca"};
  return null;
}
const ml = t => { const m = /(\d+(?:[.,]\d+)?)\s*(ml|g)\b/i.exec(s(t)); return m ? +m[1].replace(",", ".") : null; };

/* ── clasificación propuesta ── */
const PROT = ["retinal", "retinol", "hpr", "esteres_retinilo", "thiamidol", "azelaico", "tranexamico", "vitc_pura", "vitc_derivados", "glicolico", "lactico", "salicilico", "bakuchiol", "niacinamida", "peptidos"];
const NOCHE = new Set(["retinal", "retinol", "hpr", "esteres_retinilo", "glicolico", "lactico", "azelaico"]);
function clasifica(p, x){
  const nom = (s(p.producto) + " " + s(x.identidad && x.identidad.gama)).toLowerCase();
  const piel0 = s(x.caracteristicas && x.caracteristicas.tipo_piel).toLowerCase();
  // protagonista: el activo con % declarado; si no, el primero de la lista a dosis útil (sin péptidos ni niacinamida tras la línea)
  const decl = (p.activos || []).filter(a => a.pct_declarado != null).map(a => activoConocido(a.inci)).filter(k => PROT.includes(k));
  // sin % declarado, un activo de dosis media o baja solo es protagonista si va arriba en el INCI o lo nombra el producto
  // (el salicílico o el ascorbil palmitato al final de la lista suelen ser ajuste de pH o antioxidante de la fórmula)
  const pos = k => { const e = estado(p)[k]; return e ? e.pos : -1; };
  const nombra = k => (A[k][0].concat({salicilico: ["salic", "bha"], azelaico: ["azela"], tranexamico: ["tranex"], niacinamida: ["niacinam", "b3"], peptidos: ["pept"], retinol: ["retinol"], retinal: ["retinal"], glicolico: ["glicol", "aha"], lactico: ["láctic", "lactic"], vitc_pura: ["vitamina c", "vitamin c", "vit c"], vitc_derivados: ["vitamina c", "vitamin c", "vit c"]}[k] || [])).some(t => nom.includes(t));
  const valido = k => aDosis(p, k) && (A[k][1] === "alta" || nombra(k) || (pos(k) >= 0 && pos(k) < 15) || ["retinal", "hpr", "thiamidol"].includes(k));
  let prot = decl.sort((a, b) => PROT.indexOf(a) - PROT.indexOf(b))[0] || PROT.find(k => valido(k) && nombra(k)) || PROT.find(valido) || "ninguno";
  const acido = ACIDOS.some(k => aDosis(p, k) && ["glicolico", "lactico", "mandelico", "salicilico"].includes(k));
  let hueco, nota = "";
  if(/limpiador|limpiadora|cleans|wash|espuma|mousse(?! sol)|micelar|micellar|desmaquill|démaquill|nettoyant|jab[oó]n|syndet|leche limp|aceite limp|b[aá]lsamo limp|gel de limpieza|cleanser/.test(nom)) hueco = "L";
  else if(p.spf || /\bspf\b|solar|fotoprot|sun ?screen|\bsun\b|\buv\b|photo/.test(nom)) hueco = "S";
  else if(/contorno|\beye|ojos|ojeras|p[aá]rpad|yeux|regard/.test(nom)) hueco = "contorno de ojos";
  else if(/afeitad|after.?shave|shav/.test(nom)) hueco = "posafeitado";
  else if(/mascarilla|\bmask|masque/.test(nom)) hueco = "mascarilla";
  else if(/stick|roll-on|spot control|\bneck\b|cuello|p[aâ]te/.test(nom)) hueco = "fuera";
  else if(/t[oó]nic|toner|tonique|bruma|\bmist|esencia|essence|loci[oó]n tonific|agua de belleza|pschitt/.test(nom)) hueco = "tonico o bruma";
  else if(/s[eé]rum|serum|ampolla|ampoule|booster|\bshot\b|activo puro|concentrate|gotas|drops/.test(nom)) hueco = "SERUM";
  else if(/crema|cream|cr[eè]me|gel.?crema|b[aá]lsamo|balm|baume/.test(nom)) hueco = "H";
  else if(/concentrad|elixir|peel|exfoli|aceite facial|face oil|\boil\b|aceite|tratamiento|treatment|soluci[oó]n|\bshot\b|activo puro|concentrate|infusi[oó]n|complex|retinoide|despigmentante|resurfacing|renovador|factores de crecimiento/.test(nom)) hueco = "SERUM";
  else if(/crema|cream|cr[eè]me|emulsi|fluid|gel.?crema|b[aá]lsamo|balm|baume|hidratante|moistur|loci[oó]n|lotion|gel|soin|[eé]mulsion|repair/.test(nom)) hueco = "H";
  else if(p.formato_ml) { hueco = p.formato_ml >= 40 ? "H" : "SERUM"; nota = "hueco deducido por el formato (" + p.formato_ml + " ml)"; }
  else hueco = "fuera";
  let tipo = "";
  if(hueco === "SERUM"){
    if(prot === "ninguno") { const hum = ["hialuronico", "glicerina", "pantenol", "ceramidas", "centella", "ectoina"].some(k => aDosis(p, k)); hueco = hum ? "serum humectante" : "AM/PM"; tipo = hum ? (["pantenol", "ceramidas", "centella", "ectoina"].some(k => aDosis(p, k)) ? "calmante o barrera" : "humectante") : "otro"; }
    else hueco = NOCHE.has(prot) || /noche|night|nuit/.test(nom) ? "PM" : /^vitc/.test(prot) || /d[ií]a|day|jour/.test(nom) ? "AM" : "AM/PM";
  }
  if(hueco === "H" && prot !== "ninguno" && /noche|night|nuit/.test(nom) && NOCHE.has(prot)) tipo = "tratamiento";
  const exfoliante = acido && (/peel|exfoli|renov|resurf|glyco|aha|bha/.test(nom) || ["PM", "AM/PM"].includes(hueco));
  let piel = "todas";
  if(/grasa|mixta|acn[eé]|imperfecc|brillo|oily|combination|blemish/.test(piel0)) piel = /normal/.test(piel0) ? "normal a grasa" : "grasa o mixta";
  else if(/muy seca|seca|deshidrat|dry|at[oó]pic/.test(piel0)) piel = /normal/.test(piel0) ? "normal a seca" : "seca";
  if(/todo tipo|todas|all skin|cualquier/.test(piel0)) piel = "todas";
  if(hueco === "L" && piel === "todas" && /grasa|mixta|purif|matif|sebo/.test(nom)) piel = "normal a grasa";
  return {hueco, protagonista: prot, tipo, exfoliante, piel, confianza: "baja", origen: "propuesta automática 27/11 (pendiente de revisar por Hugo)", nota};
}
const CATEG = {L: "limpiador", S: "spf", "contorno de ojos": "tratamiento", posafeitado: "hidratante", mascarilla: "tratamiento", "tonico o bruma": "tratamiento", H: "hidratante", fuera: "tratamiento"};

const out = [], inf = {candidatas: fichas.size, cargadas: 0, sin_inci: [], inci_es: [], no_farmacia: [], bajas: [], duplicados: [], sin_precio: [], huecos: {}, protagonistas: {}};
for(const [id, x] of fichas){
  const ident = x.identidad || {}, cv = x.canal_venta || {}, car = x.caracteristicas || {};
  const marca = s(x.marca || ident.marca).trim();
  if(!fuentePrimaria(x.inci)) { inf.sin_inci.push(id); continue; }
  if(enEspanol(x.inci.inci_completo)) { inf.inci_es.push(id); continue; }
  if(baja(ident.estado)) { inf.bajas.push(id); continue; }
  const dup = s(x.duplicado_de || ident.duplicado_de).trim();
  if(dup && !/^ninguno/i.test(dup) && (enCatalogo.has(dup) || (fichas.has(dup) && id > dup))) { inf.duplicados.push(id + " = " + dup); continue; }
  const activos = [];
  for(const a of (x.activos_y_porcentajes || [])){
    if(!a || typeof a !== "object") continue;
    const v = pctNum(a.pct_declarado_marca);
    if(v != null && activoConocido(a.inci) && v > 0 && v <= 50) activos.push({inci: s(a.inci).replace(/\s*\(.*$/, "").trim(), pct_declarado: v, pct_estimado: null, confianza: "alta", posicion_inci: null, rol: "primario"});
  }
  const spfM = /^SPF\s*(\d{2})/i.exec(s(car.solar).trim());
  const pr = precio(cv);
  const inci = x.inci.inci_completo.map(i => s(i).replace(/\s+/g, " ").trim()).filter(Boolean);
  const lower = inci.join(" | ").toLowerCase();
  const p = {
    id, marca, producto: s(ident.nombre_exacto_es || ident.nombre || id).replace(/\s*\(.*?\)\s*$/, "").slice(0, 140),
    categoria: null, estado_legal: "cosmetico", formato_ml: ml(ident.formato), pvp_eur: pr ? pr.pvp : null,
    textura: null, fragancia: /parfum|fragrance/.test(lower), alergenos_declarados: [], alcohol_denat: /alcohol denat/.test(lower),
    spf: spfM ? +spfM[1] : null, flags: [], url_producto: s(((cv.farmacias || [])[0] || {}).url || x.inci.fuente),
    url_inci_fuente: s(x.inci.fuente), inci_confianza: "alta", inci_completo: inci, activos,
    verificada: true, ficha_nueva: x._lote, precio_fuente: pr ? pr.fuente : null
  };
  if(noFarmacia(cv)) { p.no_farmacia = true; inf.no_farmacia.push(id); }
  if(!pr) { p.sin_precio_es = true; inf.sin_precio.push(id); }
  const pub = ((x.estudios && x.estudios.publicados) || []).filter(e => e && typeof e === "object" && (e.pmid || e.doi));
  if(pub.length) p.estudios_publicados = pub.map(e => ({pmid: e.pmid || null, doi: e.doi || null, financiado_por_marca: e.financiado_por_marca == null ? null : e.financiado_por_marca}));
  p.v2_propuesta = clasifica(p, x);
  p.categoria = p.v2_propuesta.hueco === "SERUM" ? "tratamiento" : (CATEG[p.v2_propuesta.hueco] || "tratamiento");
  if(p.v2_propuesta.exfoliante && !["L", "H"].includes(p.v2_propuesta.hueco)) p.categoria = "exfoliante";
  inf.huecos[p.v2_propuesta.hueco] = (inf.huecos[p.v2_propuesta.hueco] || 0) + 1;
  inf.protagonistas[p.v2_propuesta.protagonista] = (inf.protagonistas[p.v2_propuesta.protagonista] || 0) + 1;
  out.push(p);
}
out.sort((a, b) => a.id < b.id ? -1 : 1);
inf.cargadas = out.length;
fs.writeFileSync(path.join(ROOT, "src/server/motor/nuevos-fichas.json"), JSON.stringify(out));
const csv = [["id", "marca", "producto", "pvp_eur", "hueco", "protagonista", "tipo", "exfoliante", "piel", "lote"].join(";")]
  .concat(out.map(p => [p.id, p.marca, p.producto.replace(/;/g, ","), p.pvp_eur == null ? "" : p.pvp_eur, p.v2_propuesta.hueco, p.v2_propuesta.protagonista, p.v2_propuesta.tipo, p.v2_propuesta.exfoliante ? "sí" : "no", p.v2_propuesta.piel, p.ficha_nueva].join(";")));
fs.writeFileSync(path.join(ROOT, "scripts/fichas/revision-nuevos.csv"), csv.join("\n") + "\n");
const corto = Object.assign({}, inf, {sin_inci: inf.sin_inci.length, inci_es: inf.inci_es.length, no_farmacia: inf.no_farmacia.length, bajas: inf.bajas.length, duplicados: inf.duplicados.length, sin_precio: inf.sin_precio.length});
console.log(JSON.stringify(process.argv.includes("-v") ? inf : corto, null, 1));
