/* eslint-disable @typescript-eslint/no-require-imports */
/* Productos de marcas de farmacia que están en la base de Hugo (data/catalogo.json, 3.413 productos) y no en el motor
   (Hugo, 28/11: «si faltan más productos para meter en el motor ponlos, no solo estos sino todos los de su marca»).
   Usa el INCI y el precio de la base de Hugo tal cual: el INCI lo sacó de la web (Hugo, 28/11), es fiable. La clasificación v2 es una propuesta
   automática (la misma de scripts/fichas/nuevos.cjs), marcada para que Hugo la revise: hasta entonces el motor la penaliza.
   Uso: node scripts/fichas/base-hugo.cjs   → src/server/motor/nuevos-base.json + scripts/fichas/revision-base.csv */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { A, aDosis } = require(path.join(ROOT, "src/server/motor/activos.js"));
const { clasifica, CATEG } = require("./nuevos.cjs");

const s = v => String(v == null ? "" : v);
const sinTilde = t => s(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const src = fs.readFileSync(path.join(ROOT, "src/server/motor/catalogo.js"), "utf8");
const MARCAS = new Set(JSON.parse(src.match(/const MARCAS_FARMACIA = new Set\((\[[^\]]*\])/)[1]).map(sinTilde));

// lo que ya está en el motor: catálogo, contornos y fichas nuevas del PR #17
const MOTOR = require(path.join(ROOT, "src/server/motor/catalogo.json"))
  .concat(require(path.join(ROOT, "src/server/motor/contornos.json")), require(path.join(ROOT, "src/server/motor/nuevos-fichas.json")));
const STOP = new Set(["de", "la", "el", "para", "con", "y", "en", "piel", "ml", "spf", "50", "facial", "rostro", "the", "and", "for", "a", "con", "sin"]);
const tok = t => new Set(sinTilde(t).replace(/[^a-z0-9+]+/g, " ").split(" ").filter(w => w && !STOP.has(w)));
const jac = (a, b) => { let i = 0; for(const x of a) if(b.has(x)) i++; return i / (a.size + b.size - i || 1); };
const inciKey = l => (l || []).slice(0, 10).map(x => sinTilde(x).replace(/[^a-z0-9]+/g, "")).join("|");
const motorIds = new Set(MOTOR.map(p => p.id)), motorInci = new Set(MOTOR.map(p => inciKey(p.inci_completo)).filter(k => k.split("|").length >= 6));
const incSet = l => new Set((l || []).map(x => sinTilde(x).replace(/[^a-z0-9]+/g, "")).filter(Boolean));
// mismo producto con otro nombre: casi todas las palabras del nombre más corto están en el otro, o el INCI coincide en un 85 %
const cont = (a, b) => { const x = [...a].filter(w => w.length > 2), y = new Set([...b].filter(w => w.length > 2)); if(x.length < 2 || y.size < 2) return 0; const [m, M2] = x.length <= y.size ? [x, y] : [[...y], new Set(x)]; return m.filter(w => M2.has(w)).length / m.length; };
const porMarca = {}; for(const p of MOTOR){ (porMarca[sinTilde(p.marca)] = porMarca[sinTilde(p.marca)] || []).push({t: tok(p.producto), i: incSet(p.inci_completo)}); }
const MARCA_ALIAS = {"cantabria labs (endocare)": "endocare", "eau thermale avene": "avene", "institut esthederm": "esthederm", "primaderm (singuladerm)": "primaderm", "cumlaude": "cumlaude lab", "galenic": "galenic"};
const marcasIguales = m => { const k = sinTilde(m); return [k, MARCA_ALIAS[k]].concat(Object.entries(MARCA_ALIAS).filter(([, v]) => v === k).map(([a]) => a)).filter(Boolean); };

const HUECO_TIPO = {"Limpiador": "limpiador", "Solar": "solar", "Contorno de ojos": "contorno de ojos", "Mascarilla": "mascarilla", "Tónico": "tónico", "Sérum": "sérum", "Crema": "crema", "Exfoliante": "exfoliante"};
const TEXTURA = t => { const x = sinTilde(t); return /gel.?crema|gel-crema/.test(x) ? "gel-crema" : /balsamo|baume|balm/.test(x) ? "balsamo" : /fluid/.test(x) ? "fluido" : /locion|lotion|leche/.test(x) ? "locion" : /gel/.test(x) ? "gel" : /crema|cream/.test(x) ? "crema" : null; };
const ES = /^(agua|glicerina|aceite|extracto|ácido|acido|escualeno|fenoxietanol|perfume|manteca|dióxido|óxido|cera de|lecitina|goma)/i;
const incDe = (inci, k) => inci.find(i => (A[k] ? A[k][0] : []).some(p => sinTilde(i).includes(p)));

const base = require(path.join(ROOT, "data/catalogo.json"));
const out = [], vistos = new Set(), inf = {base: base.length, de_farmacia: 0, ya_en_motor: 0, duplicados_en_base: 0, sin_inci: 0, inci_es: 0, sin_precio: 0, fuera: 0, cargados: 0, huecos: {}, marcas: {}};
for(const p of base){
  if(!MARCAS.has(sinTilde(p.marca)) || !HUECO_TIPO[p.tipo]) continue;
  inf.de_farmacia++;
  const inci = (p.inci || []).map(i => s(i).replace(/\s+/g, " ").trim()).filter(Boolean);
  const nombre = s(p.nombre).trim(), t = tok(nombre), ik = inciKey(inci);
  const enMotor = motorIds.has(p.id) || (ik.split("|").length >= 6 && motorInci.has(ik)) || marcasIguales(p.marca).some(m => (porMarca[m] || []).some(b => jac(t, b.t) >= .6 || cont(t, b.t) >= .85 || (b.i.size >= 6 && jac(incSet(inci), b.i) >= .85)));
  if(enMotor){ inf.ya_en_motor++; continue; }
  if(inci.length < 4){ inf.sin_inci++; continue; }
  if(inci.filter(x => ES.test(x)).length >= 3){ inf.inci_es++; continue; }
  const dk = sinTilde(p.marca) + "|" + ik; if(vistos.has(dk)){ inf.duplicados_en_base++; continue; } vistos.add(dk);
  const lower = inci.join(" | ").toLowerCase();
  const activos = Object.entries(p.declarados || {}).map(([k, d]) => ({k, d, inci: incDe(inci, k)})).filter(x => x.inci && d_ok(x.d))
    .map(x => ({inci: x.inci, pct_declarado: +x.d.pct, pct_estimado: null, confianza: "media", posicion_inci: null, rol: "primario"}));
  const pvp = +p.pvp_referencia > 1 && +p.pvp_referencia < 400 ? +p.pvp_referencia : null;
  const url = s((p.datos_extra || {}).url_oficial) || null;
  const q = {
    id: motorIds.has(p.id) ? p.id + "-base" : p.id, marca: p.marca, producto: nombre.slice(0, 140), categoria: null, estado_legal: "cosmetico",
    formato_ml: +p.formato_ml || null, pvp_eur: pvp, textura: TEXTURA(p.textura), fragancia: /parfum|fragrance/.test(lower), alergenos_declarados: [],
    alcohol_denat: /alcohol denat/.test(lower), spf: +p.spf || (/\bspf\s*(\d{2})/i.exec(nombre) ? +/\bspf\s*(\d{2})/i.exec(nombre)[1] : null), flags: [],
    url_producto: url, url_inci_fuente: url, inci_confianza: "alta (base de Hugo, sacado de la web)", inci_completo: inci, activos,
    subtitulo: s((p.datos_extra || {}).subtitulo) || undefined, ficha_nueva: "base-hugo", precio_fuente: pvp ? "base de Hugo" : null
  };
  if(!pvp){ q.sin_precio_es = true; inf.sin_precio++; }
  const v2 = clasifica(q, {identidad: {gama: HUECO_TIPO[p.tipo]}, caracteristicas: {tipo_piel: ""}});
  if(v2.hueco === "fuera"){ inf.fuera++; continue; }
  // seguridad: un sérum con retinoide a dosis (o que se llama retinol, retinal o retinoid) o con ácido exfoliante, solo de noche
  if(["AM", "AM/PM", "serum humectante"].includes(v2.hueco) && (["retinal", "retinol", "hpr", "esteres_retinilo", "glicolico", "lactico", "mandelico"].some(k => aDosis(q, k)) || /retin/i.test(nombre))){ v2.hueco = "PM"; v2.nota = "solo de noche: lleva retinoide o ácido"; }
  // el azelaico vale de mañana y de noche (R35 lo quiere de mañana con manchas): sin «noche» en el nombre, AM/PM
  else if(v2.hueco === "PM" && v2.protagonista === "azelaico" && !/noche|night|nuit/i.test(nombre) && !["glicolico", "lactico", "mandelico", "retinal", "retinol", "hpr"].some(k => aDosis(q, k))) v2.hueco = "AM/PM";
  v2.origen = "propuesta automática 28/11, base de Hugo (pendiente de revisar por Hugo)";
  q.v2_propuesta = v2;
  q.categoria = v2.hueco === "SERUM" ? "tratamiento" : (CATEG[v2.hueco] || "tratamiento");
  if(v2.exfoliante && !["L", "H"].includes(v2.hueco)) q.categoria = "exfoliante";
  inf.huecos[v2.hueco] = (inf.huecos[v2.hueco] || 0) + 1; inf.marcas[p.marca] = (inf.marcas[p.marca] || 0) + 1;
  out.push(q);
}
function d_ok(d){ return d && d.pct != null && +d.pct > 0 && +d.pct <= 50; }
out.sort((a, b) => a.id < b.id ? -1 : 1);
inf.cargados = out.length;
fs.writeFileSync(path.join(ROOT, "src/server/motor/nuevos-base.json"), JSON.stringify(out));
const csv = [["id", "marca", "producto", "pvp_eur", "hueco", "protagonista", "tipo", "exfoliante", "piel", "perfume"].join(";")]
  .concat(out.map(p => [p.id, p.marca, p.producto.replace(/;/g, ","), p.pvp_eur == null ? "" : p.pvp_eur, p.v2_propuesta.hueco, p.v2_propuesta.protagonista, p.v2_propuesta.tipo, p.v2_propuesta.exfoliante ? "sí" : "no", p.v2_propuesta.piel, p.fragancia ? "sí" : "no"].join(";")));
fs.writeFileSync(path.join(ROOT, "scripts/fichas/revision-base.csv"), csv.join("\n") + "\n");
console.log(JSON.stringify(inf, null, 1));
