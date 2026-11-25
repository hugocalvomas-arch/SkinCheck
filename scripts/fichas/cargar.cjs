/* eslint-disable @typescript-eslint/no-require-imports */
/* Convierte las fichas verificadas (JSON por lotes, revisión de Hugo del 24/11/2026) en la capa que lee el motor.
   Uso: node scripts/fichas/cargar.cjs <carpeta de fichas>   → src/server/motor/fichas-verificadas.json + informe en stdout
   Solo se carga lo comprobado en una fuente primaria (web de la marca o ficha de farmacia):
   - INCI: si sale de la web de la marca o de una farmacia (no de perfumería ni del propio catálogo).
   - %: solo los declarados por la marca, con número y de un activo que el motor conoce.
   - SPF: solo si la ficha lo declara (no "según el catálogo").
   - Farmacia: farmacia_verificada = no → no se recomienda.
   - Duplicados: se queda uno (el que tiene INCI de fuente primaria; si empatan, el id más corto).
   - Descatalogado: solo si la ficha lo da por confirmado (no "probable" ni "posible"). */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { A } = require(path.join(ROOT, "src/server/motor/activos.js"));
const BASE = require(path.join(ROOT, "src/server/motor/catalogo.json")).concat(require(path.join(ROOT, "src/server/motor/contornos.json")));
const enCatalogo = new Set(BASE.map(p => p.id));
const dir = process.argv[2];
if(!dir) { console.error("Falta la carpeta de fichas"); process.exit(1); }
const fichas = new Map();
for(const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()){
  let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { console.error("lote ilegible:", f); continue; }
  for(const x of d) if(x && x.id) fichas.set(x.id, Object.assign({}, x, {_lote: f}));
}
const s = v => String(v == null ? "" : v);
const fuentePrimaria = i => i && Array.isArray(i.inci_completo) && i.inci_completo.length >= 4 &&
  /web oficial|farmacia|INCI publicado en la p[aá]gina/i.test(s(i.tipo_fuente)) && !/perfumer|druni|sephora|cat[aá]logo \(/i.test(s(i.tipo_fuente));
// INCI traducido al español (algunas webs de marca lo publican así): el motor busca los nombres INCI en inglés, así que no se usa.
const ES = /^(agua|glicerina|aceite|extracto|ácido|acido|alcohol cet|escualeno|ciclodextrina|copolímero|fenoxietanol|perfume \(fragancia\)|manteca|dióxido|óxido|cera de|lecitina|tocoferol$|hialuronato)/i;
const enEspanol = l => l.filter(x => ES.test(String(x).trim())).length >= 3;
const noFarmacia = c => /^(no|false)$/i.test(s(c && c.farmacia_verificada).trim());
const confirmadoBaja = e => /^(descatalogado|sustituido)\b/i.test(s(e).trim()) && !/no confirmado|probabl|posible/i.test(s(e));
const PATRONES = Object.entries(A).map(([k, v]) => [k, v[0]]);
const activoConocido = inci => { const t = s(inci).toLowerCase(); const m = PATRONES.find(([, pats]) => pats.some(p => t.includes(p))); return m ? m[0] : null; };
// % escrito dentro de un texto en español («ácido hialurónico 1,5 % (declarado por la marca)»): solo un activo suelto, no sumas (AHA = glicólico + málico)
const ES_ACT = [[/^(el |la )?(ácido|acido) hialur[oó]nico\b/i, "hialuronico"], [/^(la )?manteca de karit[eé]\b/i, "karite"], [/^(la )?urea\b/i, "urea"], [/^(la )?niacinamida\b/i, "niacinamida"], [/^(el )?pantenol\b/i, "pantenol"]];
const pctTexto = v => { const t = s(v).trim(); if(!/declarado por la marca/i.test(t)) return null; const m = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*%/.exec(t); if(!m) return null; const k = ES_ACT.find(([re]) => re.test(m[1])); return k ? {activo: k[1], pct: +m[2].replace(",", "."), inci: m[1]} : null; };
const pctNum = v => { const m = /^\s*(\d+(?:[.,]\d+)?)\s*%/.exec(s(v)); return m && !/suma|total|no encontrado|no declarado/i.test(s(v)) ? +m[1].replace(",", ".") : null; };
const spfNum = v => { const t = s(v).trim(); if(/seg[uú]n el cat[aá]logo|no comprobado|no aplica|no encontrado/i.test(t)) return null; const m = /^SPF\s*(\d{2})\+?/i.exec(t); return m ? +m[1] : null; };
const limpiaInci = l => l.map(x => s(x).replace(/\s+/g, " ").trim()).filter(Boolean);

const out = {}, inf = {fichas: fichas.size, fuera_catalogo: [], inci: 0, pct: [], spf: [], no_farmacia: [], duplicados: [], bajas: [], estudios: 0};
// duplicados: la ficha dice «duplicado de X» → se queda X, salvo que X no tenga INCI de fuente primaria y esta sí.
// En pares que se citan el uno al otro, se queda el que tiene INCI primario; si empatan, el id más corto.
const quita = new Set(), vistos = new Set();
for(const [id, x] of fichas){
  const d = s(x.identidad && x.identidad.duplicado_de).trim();
  if(!d || /^ninguno/i.test(d) || !fichas.has(d) && !enCatalogo.has(d)) continue;
  const par = [id, d].sort().join("|"); if(vistos.has(par)) continue; vistos.add(par);
  const otro = fichas.get(d), mutuo = otro && s(otro.identidad && otro.identidad.duplicado_de).trim() === id;
  const yoBueno = fuentePrimaria(x.inci), otroBueno = otro ? fuentePrimaria(otro.inci) : true;
  let sale;
  if(yoBueno !== otroBueno) sale = yoBueno ? d : id;
  else if(mutuo) sale = (id.length > d.length || (id.length === d.length && id > d)) ? id : d;
  else sale = id;
  if(quita.has(sale === id ? d : id)) continue;   // no quitar los dos de un grupo
  quita.add(sale); inf.duplicados.push(sale + " (queda " + (sale === id ? d : id) + ")");
}
for(const [id, x] of fichas){
  if(!enCatalogo.has(id)) { inf.fuera_catalogo.push(id); continue; }
  const o = {lote: x._lote};
  if(fuentePrimaria(x.inci) && enEspanol(x.inci.inci_completo)) inf.inci_es = (inf.inci_es || []).concat(id);
  else if(fuentePrimaria(x.inci)) { o.inci_completo = limpiaInci(x.inci.inci_completo); o.inci_fuente = s(x.inci.fuente); inf.inci++; }
  const pct = [];
  for(const a of (x.activos_y_porcentajes || [])){
    if(!a || typeof a !== "object") continue;
    const v = pctNum(a.pct_declarado_marca), k = activoConocido(a.inci);
    const tx = v == null ? pctTexto(a.pct_declarado_marca) : null;
    if(tx) { pct.push(tx); inf.pct.push(id + ": " + tx.activo + " " + tx.pct + " % (texto)"); continue; }
    if(v != null && k && v > 0 && v <= 50) { pct.push({inci: s(a.inci).replace(/\s*\(.*$/, "").trim(), pct: v, activo: k}); inf.pct.push(id + ": " + k + " " + v + " %"); }
  }
  if(pct.length) o.pct_declarados = pct;
  const spf = spfNum(x.caracteristicas && x.caracteristicas.solar);
  if(spf) { o.spf = spf; inf.spf.push(id + ": SPF " + spf); }
  if(noFarmacia(x.canal_venta)) { o.no_farmacia = true; inf.no_farmacia.push(id); }
  if(quita.has(id)) o.duplicado = true;
  if(confirmadoBaja(x.identidad && x.identidad.estado)) { o.descatalogado = true; inf.bajas.push(id + ": " + s(x.identidad.estado).slice(0, 80)); }
  const pub = ((x.estudios && x.estudios.publicados) || []).filter(e => e && typeof e === "object").map(e => ({pmid: e.pmid || null, doi: e.doi || null, financiado_por_marca: e.financiado_por_marca == null ? null : e.financiado_por_marca}));
  if(pub.length) { o.estudios_publicados = pub; inf.estudios += pub.length; }
  out[id] = o;
}
fs.writeFileSync(path.join(ROOT, "src/server/motor/fichas-verificadas.json"), JSON.stringify(out, null, 0));
console.log(JSON.stringify({fichas: inf.fichas, cargadas: Object.keys(out).length, fuera_catalogo: inf.fuera_catalogo.length, inci: inf.inci, pct: inf.pct.length, spf: inf.spf.length, no_farmacia: inf.no_farmacia.length, duplicados: inf.duplicados.length, bajas: inf.bajas.length, estudios: inf.estudios, inci_en_espanol_no_usado: (inf.inci_es || []).length}, null, 1));
if(process.argv[3] === "-v") console.log(JSON.stringify(inf, null, 1));
